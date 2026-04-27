const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { Sequelize, DataTypes } = require("sequelize");

const app = express();
app.use(cors());
app.use(express.json());

const db = new Sequelize({
  dialect: "sqlite",
  storage: "payments.db"
});

const Payment = db.define("Payment", {
  trip_id: DataTypes.INTEGER,
  amount: DataTypes.FLOAT,
  currency: { type: DataTypes.STRING, defaultValue: "INR" },
  status: { type: DataTypes.STRING, defaultValue: "PENDING" },
  idempotency_key: DataTypes.STRING,
  method: DataTypes.STRING,
  reference: DataTypes.STRING,
  created_at: DataTypes.STRING,
  refunded_at: DataTypes.STRING,
  refund_amount: DataTypes.FLOAT
});

db.sync();

const TRIP_SERVICE_URL = process.env.TRIP_SERVICE_URL || "http://ride:3000";

app.use((req, res, next) => {
  const requestId = req.get("X-Request-ID") || `req-${Date.now()}`;
  req.requestId = requestId;
  console.log(JSON.stringify({ requestId, method: req.method, path: req.path, body: req.body }));
  next();
});

app.post("/v1/payments/charge", async (req, res) => {
  try {
    const { trip_id, amount, idempotency_key, method = "CARD" } = req.body;
    if (!trip_id || typeof amount !== "number") {
      return res.status(400).send({ error: "trip_id and numeric amount are required" });
    }

    if (idempotency_key) {
      const existing = await Payment.findOne({ where: { idempotency_key } });
      if (existing) {
        return res.send(existing);
      }
    }

    const tripResponse = await axios.get(`${TRIP_SERVICE_URL}/v1/trips/${trip_id}`);
    const trip = tripResponse.data;
    if (!trip || trip.trip_status !== "COMPLETED") {
      return res.status(400).send({ error: "Trip must be completed before charging payment" });
    }

    const payment = await Payment.create({
      trip_id,
      amount,
      method,
      currency: "INR",
      status: "PAID",
      idempotency_key: idempotency_key || null,
      reference: `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      created_at: new Date().toISOString()
    });

    res.status(201).send(payment);
  } catch (err) {
    if (err.response && err.response.data) {
      return res.status(err.response.status).send(err.response.data);
    }
    res.status(502).send({ error: "Payment service failed", details: err.message });
  }
});

app.post("/v1/payments/:id/refund", async (req, res) => {
  const payment = await Payment.findByPk(req.params.id);
  if (!payment) {
    return res.status(404).send({ error: "Payment not found" });
  }
  if (payment.status !== "PAID") {
    return res.status(400).send({ error: "Only paid payments may be refunded" });
  }
  payment.status = "REFUNDED";
  payment.refunded_at = new Date().toISOString();
  payment.refund_amount = payment.amount;
  await payment.save();
  res.send(payment);
});

app.get("/v1/payments/:id", async (req, res) => {
  const payment = await Payment.findByPk(req.params.id);
  if (!payment) {
    return res.status(404).send({ error: "Payment not found" });
  }
  res.send(payment);
});

app.get("/health", (req, res) => res.send("OK"));

app.listen(3000, () => {
  console.log("Payment service running on port 3000");
});
