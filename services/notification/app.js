const express = require("express");
const cors = require("cors");
const amqp = require("amqplib");

const app = express();

app.use(cors());
app.use(express.json());

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";
const EVENTS_EXCHANGE = process.env.EVENTS_EXCHANGE || "ride.events";
const NOTIFICATION_QUEUE = process.env.NOTIFICATION_QUEUE || "notification.queue";
let notificationEventsConsumedTotal = 0;

app.use((req, res, next) => {
  const requestId = req.get("X-Request-ID") || `req-${Date.now()}`;
  const traceId = req.get("X-Trace-ID") || requestId;
  req.requestId = requestId;
  req.traceId = traceId;
  console.log(JSON.stringify({ requestId, traceId, method: req.method, path: req.path, body: req.body }));
  next();
});

app.post("/v1/notifications", (req, res) => {
  const notification = req.body;
  console.log(JSON.stringify({ type: "notification", traceId: req.traceId, payload: notification }));
  res.status(201).send({ status: "sent", notification });
});

app.get("/health", (req, res) => res.send("OK"));

app.get("/metrics", (req, res) => {
  res.send({
    notification_events_consumed_total: notificationEventsConsumedTotal
  });
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
          notificationEventsConsumedTotal += 1;
          console.log(JSON.stringify({ type: "notification_event", event }));
          channel.ack(msg);
        } catch (err) {
          console.error(JSON.stringify({ level: "error", event: "notification_consumer_failed", error: err.message }));
          channel.nack(msg, false, false);
        }
      });
      break;
    } catch (err) {
      console.error(JSON.stringify({ level: "warn", event: "notification_consumer_connect_retry", error: err.message }));
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

app.listen(3000, () => {
  console.log("Notification service running on port 3000");
  startNotificationConsumer().catch((err) => {
    console.error(JSON.stringify({ level: "error", event: "notification_consumer_start_failed", error: err.message }));
  });
});
