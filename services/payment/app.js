const express = require("express");
const cors = require("cors");
const axios = require("axios");
const amqp = require("amqplib");
const { Sequelize, DataTypes } = require("sequelize");

const app = express();
app.use(cors());
app.use(express.json());

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
  refunded_at: DataTypes.STRING,
  refund_amount: DataTypes.FLOAT
});

db.sync();

const TRIP_SERVICE_URL = process.env.TRIP_SERVICE_URL || "http://ride:3000";
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";
const EVENTS_EXCHANGE = process.env.EVENTS_EXCHANGE || "ride.events";
const PAYMENT_QUEUE = process.env.PAYMENT_QUEUE || "payment.queue";
let paymentsFailedTotal = 0;
let eventsConsumedTotal = 0;
let eventConsumerErrorsTotal = 0;

app.use((req, res, next) => {
  const requestId = req.get("X-Request-ID") || `req-${Date.now()}`;
  const traceId = req.get("X-Trace-ID") || requestId;
  req.requestId = requestId;
  req.traceId = traceId;
  console.log(JSON.stringify({ requestId, traceId, method: req.method, path: req.path, body: req.body }));
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
      status: "PAID",
      idempotency_key: idempotency_key || null,
      reference: `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      created_at: new Date().toISOString()
    });

    res.status(201).send(payment);
  } catch (err) {
    paymentsFailedTotal += 1;
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
              status: "PAID",
              idempotency_key,
              reference: `PAY-EVT-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              created_at: new Date().toISOString()
            });
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

app.get("/metrics", async (req, res) => {
  res.send({
    payments_failed_total: paymentsFailedTotal,
    payments_total: await Payment.count(),
    refunded_total: await Payment.count({ where: { status: "REFUNDED" } }),
    payment_events_consumed_total: eventsConsumedTotal,
    payment_event_consumer_errors_total: eventConsumerErrorsTotal
  });
});

app.listen(3000, () => {
  console.log("Payment service running on port 3000");
  startPaymentConsumer().catch((err) => {
    console.error(JSON.stringify({ level: "error", event: "payment_consumer_start_failed", error: err.message }));
  });
});
