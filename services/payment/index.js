const express = require("express");
const cors = require("cors");
const axios = require("axios");
const amqp = require("amqplib");
const rateLimit = require("express-rate-limit");
const Database = require("better-sqlite3");
const { Sequelize, DataTypes } = require("sequelize");
const promClient = require("prom-client");

const app = express();
app.use(cors());
app.use(express.json());

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const paymentsTotal = new promClient.Counter({
  name: "payment_payments_total",
  help: "Total number of payments processed",
  registers: [register]
});

const paymentAmountTotal = new promClient.Counter({
  name: "payment_amount_total",
  help: "Total amount of payments processed",
  registers: [register]
});

const refundsTotal = new promClient.Counter({
  name: "payment_refunds_total",
  help: "Total number of refunds processed",
  registers: [register]
});

const paymentsFailedMetric = new promClient.Gauge({
  name: "payments_failed_total",
  help: "Total number of failed payment operations",
  registers: [register]
});

const db = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_PATH || "payments.db"
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
  refund_idempotency_key: DataTypes.STRING,
  refunded_at: DataTypes.STRING,
  refund_amount: DataTypes.FLOAT
});

const sqlitePath = process.env.DB_PATH || "payments.db";
const idemDb = new Database(sqlitePath);

// Idempotency table DDL
idemDb.exec(`
  CREATE TABLE IF NOT EXISTS idempotency_keys (
    key TEXT PRIMARY KEY,
    response TEXT NOT NULL,
    created_at DATETIME NOT NULL
  );
`);

db.sync();

const TRIP_SERVICE_URL = process.env.TRIP_SERVICE_URL || "http://ride:3000";
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";
const EVENTS_EXCHANGE = process.env.EVENTS_EXCHANGE || "ride.events";
const PAYMENT_QUEUE = process.env.PAYMENT_QUEUE || "payment.queue";
let paymentsFailedTotal = 0;
let eventsConsumedTotal = 0;
let eventConsumerErrorsTotal = 0;

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

const deleteExpiredIdempotencyKeysStmt = idemDb.prepare(`
  DELETE FROM idempotency_keys
  WHERE datetime(created_at) < datetime(?)
`);

const getIdempotencyEntryStmt = idemDb.prepare(`
  SELECT key, response, created_at
  FROM idempotency_keys
  WHERE key = ?
`);

const upsertIdempotencyEntryStmt = idemDb.prepare(`
  INSERT OR REPLACE INTO idempotency_keys (key, response, created_at)
  VALUES (?, ?, ?)
`);

const chargeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests" }
});

function cleanupExpiredIdempotencyKeys() {
  const cutoffIso = new Date(Date.now() - IDEMPOTENCY_TTL_MS).toISOString();
  deleteExpiredIdempotencyKeysStmt.run(cutoffIso);
}

app.use((req, res, next) => {
  const requestId = req.get("X-Request-ID") || `req-${Date.now()}`;
  const traceId = req.get("X-Trace-ID") || requestId;
  req.requestId = requestId;
  req.traceId = traceId;
  console.log(JSON.stringify({ requestId, traceId, method: req.method, path: req.path, body: req.body }));
  next();
});

const v1Router = express.Router();

v1Router.post("/payments/charge", chargeRateLimiter, async (req, res) => {
  const idempotencyKey = req.get("Idempotency-Key");
  if (!idempotencyKey) {
    return res.status(400).send({ error: "Idempotency-Key header required" });
  }

  cleanupExpiredIdempotencyKeys();

  const existingIdempotentResponse = getIdempotencyEntryStmt.get(idempotencyKey);
  if (existingIdempotentResponse) {
    return res.status(200).send(JSON.parse(existingIdempotentResponse.response));
  }

  try {
    const { trip_id, amount, method = "CARD" } = req.body;
    if (!trip_id || typeof amount !== "number") {
      return res.status(400).send({ error: "trip_id and numeric amount are required" });
    }

    const tripResponse = await axios.get(`${TRIP_SERVICE_URL}/v1/trips/${trip_id}`, {
      headers: { "X-Request-ID": req.requestId, "X-Trace-ID": req.traceId }
    });
    const trip = tripResponse.data;
    if (!trip || trip.trip_status !== "COMPLETED") {
      return res.status(400).send({ error: "Trip must be completed before charging payment" });
    }

    const payment = await Payment.create({
      trip_id,
      amount,
      method,
      currency: "INR",
      status: "COMPLETED",
      idempotency_key: idempotencyKey,
      reference: `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      created_at: new Date().toISOString()
    });

    paymentsTotal.inc();
    paymentAmountTotal.inc(amount);

    const responsePayload = payment.toJSON();
    upsertIdempotencyEntryStmt.run(idempotencyKey, JSON.stringify(responsePayload), new Date().toISOString());

    return res.status(201).send(responsePayload);
  } catch (err) {
    paymentsFailedTotal += 1;
    if (err.response && err.response.data) {
      return res.status(err.response.status).send(err.response.data);
    }
    return res.status(502).send({ error: "Payment service failed", details: err.message });
  }
});

v1Router.post("/payments/:id/refund", async (req, res) => {
  const { reason } = req.body || {};
  const payment = await Payment.findByPk(req.params.id);
  if (!payment) {
    return res.status(404).send({ error: "Payment not found" });
  }
  if (payment.status === "REFUNDED") {
    return res.status(409).send({ error: "Payment already refunded" });
  }
  if (payment.status !== "COMPLETED") {
    return res.status(400).send({ error: "Only completed payments may be refunded" });
  }

  payment.status = "REFUNDED";
  payment.refunded_at = new Date().toISOString();
  payment.refund_amount = payment.amount;
  void reason;
  await payment.save();

  refundsTotal.inc();
  return res.send(payment);
});

v1Router.get("/payments", async (req, res) => {
  const payments = await Payment.findAll({ order: [["id", "DESC"]] });
  res.send(payments);
});

v1Router.get("/payments/:id", async (req, res) => {
  const payment = await Payment.findByPk(req.params.id);
  if (!payment) {
    return res.status(404).send({ error: "Payment not found" });
  }
  res.send(payment);
});

app.use("/v1", v1Router);

app.get("/health", (req, res) => res.send("OK"));

app.get("/metrics", async (req, res) => {
  paymentsFailedMetric.set(paymentsFailedTotal);
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

async function startPaymentConsumer() {
  while (true) {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();
      await channel.assertExchange(EVENTS_EXCHANGE, "topic", { durable: true });
      await channel.assertQueue(PAYMENT_QUEUE, { durable: true });
      await channel.bindQueue(PAYMENT_QUEUE, EVENTS_EXCHANGE, "trip.completed");

      channel.consume(PAYMENT_QUEUE, async (msg) => {
        if (!msg) return;
        try {
          const event = JSON.parse(msg.content.toString());
          eventsConsumedTotal += 1;
          const { trip_id, amount, idempotency_key, trace_id } = event;
          const existing = await Payment.findOne({ where: { idempotency_key } });
          if (!existing) {
            await Payment.create({
              trip_id,
              amount,
              method: "EVENT_DRIVEN",
              currency: "INR",
              status: "COMPLETED",
              idempotency_key,
              reference: `PAY-EVT-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              created_at: new Date().toISOString()
            });
            paymentsTotal.inc();
            paymentAmountTotal.inc(Number(amount) || 0);
          }

          await axios.patch(`${TRIP_SERVICE_URL}/v1/trips/${trip_id}/payment-status`, {
            status: "PAID"
          }, {
            headers: {
              "X-Request-ID": event.request_id || `evt-${Date.now()}`,
              "X-Trace-ID": trace_id || `trace-${Date.now()}`
            }
          });

          channel.publish(EVENTS_EXCHANGE, "payment.completed", Buffer.from(JSON.stringify({
            event: "payment.completed",
            trace_id: trace_id || null,
            trip_id,
            amount,
            status: "PAID",
            occurred_at: new Date().toISOString()
          })), { persistent: true });

          channel.ack(msg);
        } catch (err) {
          paymentsFailedTotal += 1;
          eventConsumerErrorsTotal += 1;
          console.error(JSON.stringify({ level: "error", event: "payment_consumer_failed", error: err.message }));
          channel.nack(msg, false, false);
        }
      });
      break;
    } catch (err) {
      console.error(JSON.stringify({ level: "warn", event: "payment_consumer_connect_retry", error: err.message }));
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

app.listen(3000, () => {
  console.log("Payment service running on port 3000");
  startPaymentConsumer().catch((err) => {
    console.error(JSON.stringify({ level: "error", event: "payment_consumer_start_failed", error: err.message }));
  });
});
