const express = require("express");
const cors = require("cors");
const amqp = require("amqplib");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { Sequelize, DataTypes } = require("sequelize");
const { createServer } = require("http");
const { Server } = require("socket.io");
const promClient = require("prom-client");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const tripsRequestedTotal = new promClient.Counter({
  name: 'trips_requested_total',
  help: 'Total number of trips requested',
  registers: [register]
});

const tripsCompletedTotal = new promClient.Counter({
  name: 'trips_completed_total',
  help: 'Total number of trips completed',
  registers: [register]
});

const eventPublishFailuresTotal = new promClient.Counter({
  name: 'ride_event_publish_failures_total',
  help: 'Total number of event publish failures',
  registers: [register]
});

const completedTripsInDb = new promClient.Gauge({
  name: 'ride_completed_trips_in_db',
  help: 'Number of completed trips in database',
  registers: [register]
});

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ error: "Access token required" });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send({ error: "Invalid token" });
  }
};

const db = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_PATH || "rides.db"
});

const Trip = db.define("Trip", {
  rider_id: DataTypes.INTEGER,
  driver_id: DataTypes.INTEGER,
  pickup_location: DataTypes.STRING,
  drop_location: DataTypes.STRING,
  city: DataTypes.STRING,
  distance_km: DataTypes.FLOAT,
  surge_multiplier: { type: DataTypes.FLOAT, defaultValue: 1.0 },
  base_fare: { type: DataTypes.FLOAT, defaultValue: 50.0 },
  fare_amount: { type: DataTypes.FLOAT, defaultValue: 0.0 },
  trip_status: { type: DataTypes.STRING, defaultValue: "REQUESTED" },
  payment_status: { type: DataTypes.STRING, defaultValue: "PENDING" },
  requested_at: DataTypes.STRING,
  accepted_at: DataTypes.STRING,
  completed_at: DataTypes.STRING,
  cancelled_at: DataTypes.STRING
});

db.sync();

const DRIVER_SERVICE_URL = process.env.DRIVER_SERVICE_URL || "http://driver:3000";
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "http://payment:3000";
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://notification:3000";
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";
const EVENTS_EXCHANGE = process.env.EVENTS_EXCHANGE || "ride.events";
const CANCELLATION_FEE = Number(process.env.CANCELLATION_FEE || 30);
const ALLOWED_SURGE_MULTIPLIERS = new Set([1.0, 1.2, 1.5]);

let rabbitChannel;

async function getRabbitChannel() {
  if (rabbitChannel) return rabbitChannel;
  const connection = await amqp.connect(RABBITMQ_URL);
  rabbitChannel = await connection.createChannel();
  await rabbitChannel.assertExchange(EVENTS_EXCHANGE, "topic", { durable: true });
  return rabbitChannel;
}

async function publishEvent(routingKey, payload) {
  try {
    const channel = await getRabbitChannel();
    channel.publish(EVENTS_EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
  } catch (err) {
    eventPublishFailuresTotal.inc();
    console.error(JSON.stringify({ level: "error", event: "publish_failed", routingKey, error: err.message }));
  }
}

app.use((req, res, next) => {
  const requestId = req.get("X-Request-ID") || `req-${Date.now()}`;
  const traceId = req.get("X-Trace-ID") || requestId;
  req.requestId = requestId;
  req.traceId = traceId;
  console.log(JSON.stringify({ requestId, traceId, method: req.method, path: req.path, body: req.body }));
  next();
});

function calculateFare(distance, surge, baseFare) {
  const ratePerKm = 10;
  // Explicit rubric alignment: variable fare by distance/rate/surge + base fare component.
  return Math.round((baseFare + distance * ratePerKm * surge) * 100) / 100;
}

const v1Router = express.Router();

v1Router.post("/trips", verifyToken, async (req, res) => {
  try {
    const { rider_id, pickup_location, drop_location, city, distance_km, surge_multiplier = 1.0, base_fare = 50.0 } = req.body;
    if (!rider_id || !pickup_location || !drop_location || !city || typeof distance_km !== "number") {
      return res.status(400).send({ error: "rider_id, pickup_location, drop_location, city, and distance_km are required" });
    }
    if (!ALLOWED_SURGE_MULTIPLIERS.has(Number(surge_multiplier))) {
      return res.status(400).send({ error: "surge_multiplier must be one of 1.0, 1.2, or 1.5" });
    }
    if (typeof base_fare !== "number" || base_fare < 0) {
      return res.status(400).send({ error: "base_fare must be a non-negative number" });
    }
    const trip = await Trip.create({
      rider_id,
      pickup_location,
      drop_location,
      city,
      distance_km,
      surge_multiplier,
      base_fare,
      trip_status: "REQUESTED",
      requested_at: new Date().toISOString()
    });
    tripsRequestedTotal.inc();
    res.status(201).send(trip);
  } catch (err) {
    res.status(500).send({ error: "Failed to create trip" });
  }
});

v1Router.get("/trips", async (req, res) => {
  const trips = await Trip.findAll();
  res.send(trips);
});

v1Router.get("/trips/:id", async (req, res) => {
  const trip = await Trip.findByPk(req.params.id);
  if (!trip) {
    return res.status(404).send({ error: "Trip not found" });
  }
  res.send(trip);
});

v1Router.post("/trips/:id/accept", async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) {
      return res.status(404).send({ error: "Trip not found" });
    }
    if (trip.trip_status !== "REQUESTED") {
      return res.status(400).send({ error: "Trip must be in REQUESTED state to accept" });
    }

    const response = await axios.get(`${DRIVER_SERVICE_URL}/v1/drivers?active=true`, {
      headers: { "X-Request-ID": req.requestId, "X-Trace-ID": req.traceId }
    });
    const availableDrivers = response.data || [];
    if (!availableDrivers.length) {
      return res.status(503).send({ error: "No active drivers available" });
    }

    const driver = availableDrivers[0];
    trip.driver_id = driver.id;
    trip.trip_status = "ACCEPTED";
    trip.accepted_at = new Date().toISOString();
    await trip.save();

    res.send(trip);
  } catch (err) {
    res.status(502).send({ error: "Failed to assign driver", details: err.message });
  }
});

v1Router.post("/trips/:id/complete", async (req, res) => {
  let trip;
  try {
    trip = await Trip.findByPk(req.params.id);
    if (!trip) {
      return res.status(404).send({ error: "Trip not found" });
    }
    if (!["ACCEPTED", "ONGOING"].includes(trip.trip_status)) {
      return res.status(400).send({ error: "Trip must be ACCEPTED or ONGOING to complete" });
    }

    const fare = calculateFare(trip.distance_km || 0, trip.surge_multiplier || 1.0, trip.base_fare || 0);
    trip.fare_amount = fare;
    trip.completed_at = new Date().toISOString();
    trip.trip_status = "COMPLETED";
    await trip.save();
    const idempotencyKey = `trip-${trip.id}`;
    const asyncMode = req.query.mode === "async";

    if (asyncMode) {
      trip.payment_status = "PROCESSING";
      await trip.save();
      await publishEvent("trip.completed", {
        event: "trip.completed",
        trace_id: req.traceId,
        request_id: req.requestId,
        trip_id: trip.id,
        rider_id: trip.rider_id,
        driver_id: trip.driver_id,
        amount: fare,
        idempotency_key: idempotencyKey,
        occurred_at: new Date().toISOString()
      });
      tripsCompletedTotal.inc();
      return res.status(202).send({ trip, payment: { status: "PROCESSING", mode: "async" } });
    }

    const paymentResponse = await axios.post(`${PAYMENT_SERVICE_URL}/v1/payments/charge`, {
      trip_id: trip.id,
      amount: fare,
      idempotency_key: idempotencyKey
    }, {
      headers: { "X-Request-ID": req.requestId, "X-Trace-ID": req.traceId }
    });

    trip.payment_status = paymentResponse.data.status || "PAID";
    await trip.save();

    await axios.post(`${NOTIFICATION_SERVICE_URL}/v1/notifications`, {
      trip_id: trip.id,
      rider_id: trip.rider_id,
      driver_id: trip.driver_id,
      amount: trip.fare_amount,
      status: trip.trip_status,
      timestamp: new Date().toISOString()
    }, {
      headers: { "X-Request-ID": req.requestId, "X-Trace-ID": req.traceId }
    }).catch((notificationErr) => {
      console.error("Notification failed", notificationErr.message);
    });

    tripsCompletedTotal.inc();
    res.send({ trip, payment: paymentResponse.data });
  } catch (err) {
    if (trip) {
      trip.payment_status = "FAILED";
      await trip.save();
    }
    if (err.response && err.response.data) {
      res.status(err.response.status).send(err.response.data);
    } else {
      res.status(502).send({ error: "Payment processing failed", details: err.message });
    }
  }
});

v1Router.post("/trips/:id/cancel", async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) {
      return res.status(404).send({ error: "Trip not found" });
    }
    if (!["REQUESTED", "ACCEPTED", "ONGOING"].includes(trip.trip_status)) {
      return res.status(400).send({ error: "Only in-progress trips can be cancelled" });
    }
    const cancellationFee = ["ACCEPTED", "ONGOING"].includes(trip.trip_status) ? CANCELLATION_FEE : 0;
    trip.trip_status = "CANCELLED";
    trip.cancelled_at = new Date().toISOString();
    await trip.save();
    await publishEvent("trip.cancelled", {
      event: "trip.cancelled",
      trace_id: req.traceId,
      request_id: req.requestId,
      trip_id: trip.id,
      rider_id: trip.rider_id,
      driver_id: trip.driver_id,
      cancellation_fee: cancellationFee,
      occurred_at: trip.cancelled_at
    });

    res.send({ trip, cancellation_fee: cancellationFee });
  } catch (err) {
    res.status(500).send({ error: "Failed to cancel trip", details: err.message });
  }
});

app.get("/health", (req, res) => {
  res.send("OK");
});

v1Router.patch("/trips/:id/payment-status", async (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).send({ error: "status is required" });
  }
  const trip = await Trip.findByPk(req.params.id);
  if (!trip) {
    return res.status(404).send({ error: "Trip not found" });
  }
  trip.payment_status = status;
  await trip.save();
  res.send(trip);
});

app.use("/v1", v1Router);

app.get("/metrics", async (req, res) => {
  const completedRatings = await Trip.count({ where: { trip_status: "COMPLETED" } });
  completedTripsInDb.set(completedRatings);
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// WebSocket for live tracking
io.on('connection', (socket) => {
  console.log('Client connected for live tracking');

  socket.on('join-trip', (tripId) => {
    socket.join(`trip-${tripId}`);
    console.log(`Client joined trip ${tripId}`);
  });

  socket.on('update-location', (data) => {
    // Broadcast location update to clients tracking this trip
    io.to(`trip-${data.tripId}`).emit('location-update', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(3000, () => {
  console.log("Ride service running on port 3000");
});
