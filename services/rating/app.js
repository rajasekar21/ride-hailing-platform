const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { Sequelize, DataTypes } = require("sequelize");
const promClient = require("prom-client");

const app = express();
app.use(cors());
app.use(express.json());

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const ratingsTotal = new promClient.Gauge({
  name: 'rating_ratings_total',
  help: 'Total number of ratings',
  registers: [register]
});

const averageRating = new promClient.Gauge({
  name: 'avg_driver_rating',
  help: 'Average driver rating',
  registers: [register]
});

const db = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_PATH || "ratings.db"
});

const Rating = db.define("Rating", {
  trip_id: DataTypes.INTEGER,
  rider_id: DataTypes.INTEGER,
  driver_id: DataTypes.INTEGER,
  rating: DataTypes.INTEGER,
  feedback: DataTypes.STRING,
  created_at: DataTypes.STRING
});

db.sync();

const TRIP_SERVICE_URL = process.env.TRIP_SERVICE_URL || "http://ride:3000";

app.use((req, res, next) => {
  const requestId = req.get("X-Request-ID") || `req-${Date.now()}`;
  const traceId = req.get("X-Trace-ID") || requestId;
  req.requestId = requestId;
  req.traceId = traceId;
  console.log(JSON.stringify({ requestId, traceId, method: req.method, path: req.path, body: req.body }));
  next();
});

app.post("/v1/trips/:id/rating", async (req, res) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    const { rider_id, driver_id, rating, feedback } = req.body;
    if (!rider_id || !driver_id || typeof rating !== "number") {
      return res.status(400).send({ error: "rider_id, driver_id, and numeric rating are required" });
    }

    const tripResponse = await axios.get(`${TRIP_SERVICE_URL}/v1/trips/${tripId}`, {
      headers: { "X-Request-ID": req.requestId, "X-Trace-ID": req.traceId }
    });
    const trip = tripResponse.data;
    if (!trip || trip.trip_status !== "COMPLETED") {
      return res.status(400).send({ error: "Rating is allowed only for completed trips" });
    }

    const existing = await Rating.findOne({ where: { trip_id: tripId } });
    if (existing) {
      return res.status(409).send({ error: "Rating already exists for this trip" });
    }

    const saved = await Rating.create({
      trip_id: tripId,
      rider_id,
      driver_id,
      rating,
      feedback: feedback || "",
      created_at: new Date().toISOString()
    });
    res.status(201).send(saved);
  } catch (err) {
    if (err.response && err.response.data) {
      return res.status(err.response.status).send(err.response.data);
    }
    res.status(500).send({ error: "Failed to save rating", details: err.message });
  }
});

app.get("/v1/ratings", async (req, res) => {
  const ratings = await Rating.findAll();
  res.send(ratings);
});

app.get("/v1/ratings/trip/:tripId", async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  const ratings = await Rating.findAll({ where: { trip_id: tripId } });
  res.send(ratings);
});

app.get("/health", (req, res) => {
  res.send("OK");
});

app.get("/metrics", async (req, res) => {
  const ratings = await Rating.findAll({ attributes: ["rating"] });
  const total = ratings.length;
  const sum = ratings.reduce((acc, row) => acc + Number(row.rating || 0), 0);
  const avg = total ? Number((sum / total).toFixed(2)) : 0;
  ratingsTotal.set(total);
  averageRating.set(avg);
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(3000, () => {
  console.log("Rating service running on port 3000");
});