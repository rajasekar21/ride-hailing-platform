const express = require("express");
const cors = require("cors");
const amqp = require("amqplib");
const promClient = require("prom-client");
const logger = require("../shared/logger");
const correlationMiddleware = require("../shared/correlationMiddleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use(correlationMiddleware);

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";
const EVENTS_EXCHANGE = process.env.EVENTS_EXCHANGE || "ride.events";
const NOTIFICATION_QUEUE = process.env.NOTIFICATION_QUEUE || "notification.queue";

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const notificationEventsConsumedTotal = new promClient.Counter({
  name: 'notification_events_consumed_total',
  help: 'Total number of notification events consumed',
  registers: [register]
});

app.use((req, res, next) => {
  const startMs = Date.now();
  req.requestId = req.correlationId;
  req.traceId = req.correlationId;
  logger.info({ correlationId: req.correlationId, method: req.method, path: req.path }, "request started");
  res.on("finish", () => {
    logger.info({
      correlationId: req.correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - startMs
    }, "request completed");
  });
  next();
});

app.post("/v1/notifications", (req, res) => {
  const notification = req.body;
  logger.info({ correlationId: req.correlationId, type: "notification", payload: notification }, "notification request");
  res.status(201).send({ status: "sent", notification });
});

app.get("/health", (req, res) => res.send("OK"));

app.get("/metrics", async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

async function startNotificationConsumer() {
  while (true) {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();
      await channel.assertExchange(EVENTS_EXCHANGE, "topic", { durable: true });
      await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });
      await channel.bindQueue(NOTIFICATION_QUEUE, EVENTS_EXCHANGE, "payment.completed");
      await channel.bindQueue(NOTIFICATION_QUEUE, EVENTS_EXCHANGE, "trip.cancelled");

      channel.consume(NOTIFICATION_QUEUE, (msg) => {
        if (!msg) return;
        try {
          const event = JSON.parse(msg.content.toString());
          notificationEventsConsumedTotal.inc();
          logger.info({ type: "notification_event", event }, "notification event consumed");
          channel.ack(msg);
        } catch (err) {
          logger.info({ event: "notification_consumer_failed", error: err.message }, "notification consumer failed");
          channel.nack(msg, false, false);
        }
      });
      break;
    } catch (err) {
      logger.info({ event: "notification_consumer_connect_retry", error: err.message }, "notification consumer connect retry");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

app.listen(3000, () => {
  logger.info({ service: "notification", port: 3000 }, "service started");
  startNotificationConsumer().catch((err) => {
    logger.info({ event: "notification_consumer_start_failed", error: err.message }, "notification consumer start failed");
  });
});
