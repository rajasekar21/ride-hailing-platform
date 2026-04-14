const express = require("express");
const cors = require("cors");
const amqp = require("amqplib");
const { Sequelize, DataTypes } = require("sequelize");

const app = express();

app.use(cors());
app.use(express.json());

// DB setup
const db = new Sequelize({
  dialect: "sqlite",
  storage: "rides.db"
});

const R = db.define("R", {
  status: DataTypes.STRING
});

db.sync();

// RabbitMQ connection with retry
let ch;

async function connectRabbitMQ() {
  while (true) {
    try {
      const conn = await amqp.connect("amqp://rabbitmq");
      ch = await conn.createChannel();
      await ch.assertQueue("ride");
      console.log("✅ Connected to RabbitMQ");
      break;
    } catch (err) {
      console.log("❌ RabbitMQ not ready, retrying...");
      await new Promise(res => setTimeout(res, 5000));
    }
  }
}

connectRabbitMQ();

// Routes
app.post("/rides", async (req, res) => {
  const ride = await R.create({ status: "NEW" });

  if (ch) {
    ch.sendToQueue("ride", Buffer.from(JSON.stringify({ id: ride.id })));
  }

  res.send(ride);
});

// Health check
app.get("/health", (req, res) => {
  res.send("OK");
});

app.listen(3000, () => {
  console.log("Ride service running on port 3000");
});
