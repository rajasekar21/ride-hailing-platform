const express = require("express");
const cors = require("cors");
const amqp = require("amqplib");

const app = express();

app.use(cors());
app.use(express.json());

let ch;

async function connectRabbitMQ() {
  while (true) {
    try {
      const conn = await amqp.connect("amqp://rabbitmq");
      ch = await conn.createChannel();
      await ch.assertQueue("payment");
      console.log("✅ Payment connected");
      break;
    } catch {
      console.log("❌ Retry RabbitMQ...");
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

connectRabbitMQ();

app.get("/health", (req, res) => res.send("OK"));

app.listen(3000, () => {
  console.log("Payment service running");
});
