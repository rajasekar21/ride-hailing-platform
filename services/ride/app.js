const express = require("express");
const cors = require("cors");
const amqp = require("amqplib");
const axios = require("axios");
const { Sequelize, DataTypes } = require("sequelize");

const app = express();
app.use(cors());
app.use(express.json());

const db = new Sequelize({
  dialect: "sqlite",
  storage: "rides.db"
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

app.use((req, res, next) => {
  const requestId = req.get("X-Request-ID") || `req-${Date.now()}`;
  req.requestId = requestId;
  console.log(JSON.stringify({ requestId, method: req.method, path: req.path, body: req.body }));
  next();
});

function calculateFare(distance, surge) {
  const ratePerKm = 10;
  const baseFare = 50;
  return Math.round((baseFare + distance * ratePerKm) * surge * 100) / 100;
}

app.post("/v1/trips", async (req, res) => {
  try {
    const { rider_id, pickup_location, drop_location, city, distance_km, surge_multiplier = 1.0, base_fare = 50.0 } = req.body;
    if (!rider_id || !pickup_location || !drop_location || !city || typeof distance_km !== "number") {
      return res.status(400).send({ error: "rider_id, pickup_location, drop_location, city, and distance_km are required" });
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
    res.status(201).send(trip);
  } catch (err) {
    res.status(500).send({ error: "Failed to create trip" });
  }
});

app.get("/v1/trips", async (req, res) => {
  const trips = await Trip.findAll();
  res.send(trips);
});

app.get("/v1/trips/:id", async (req, res) => {
  const trip = await Trip.findByPk(req.params.id);
  if (!trip) {
    return res.status(404).send({ error: "Trip not found" });
  }
  res.send(trip);
});

app.post("/v1/trips/:id/accept", async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) {
      return res.status(404).send({ error: "Trip not found" });
    }
    if (trip.trip_status !== "REQUESTED") {
      return res.status(400).send({ error: "Trip must be in REQUESTED state to accept" });
    }

    const response = await axios.get(`${DRIVER_SERVICE_URL}/v1/drivers?active=true`);
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

app.post("/v1/trips/:id/complete", async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) {
      return res.status(404).send({ error: "Trip not found" });
    }
    if (!["ACCEPTED", "ONGOING"].includes(trip.trip_status)) {
      return res.status(400).send({ error: "Trip must be ACCEPTED or ONGOING to complete" });
    }

    const fare = calculateFare(trip.distance_km || 0, trip.surge_multiplier || 1.0);
    trip.fare_amount = fare;
    trip.completed_at = new Date().toISOString();
    trip.trip_status = "COMPLETED";
    await trip.save();

    const paymentResponse = await axios.post(`${PAYMENT_SERVICE_URL}/v1/payments/charge`, {
      trip_id: trip.id,
      amount: fare,
      idempotency_key: `trip-${trip.id}`
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
    }).catch((notificationErr) => {
      console.error("Notification failed", notificationErr.message);
    });

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

app.get("/rides", async (req, res) => {
  const trips = await Trip.findAll();
  res.send(trips);
});

app.post("/rides", async (req, res) => {
  const trip = await Trip.create({
    rider_id: req.body.rider_id || 1,
    pickup_location: req.body.pickup_location || "Unknown pickup",
    drop_location: req.body.drop_location || "Unknown drop",
    city: req.body.city || "Unknown",
    distance_km: req.body.distance_km || 5,
    surge_multiplier: req.body.surge_multiplier || 1.0,
    base_fare: req.body.base_fare || 50,
    trip_status: "REQUESTED",
    requested_at: new Date().toISOString()
  });
  res.status(201).send(trip);
});

app.get("/health", (req, res) => {
  res.send("OK");
});

app.listen(3000, () => {
  console.log("Ride service running on port 3000");
});
