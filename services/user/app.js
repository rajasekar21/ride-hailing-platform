const express = require("express");
const cors = require("cors");
const { Sequelize, DataTypes } = require("sequelize");
const promClient = require("prom-client");
const logger = require("../shared/logger");
const correlationMiddleware = require("../shared/correlationMiddleware");

const app = express();
app.use(cors());
app.use(express.json());
app.use(correlationMiddleware);

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const ridersTotal = new promClient.Gauge({
  name: 'user_riders_total',
  help: 'Total number of riders',
  registers: [register]
});

const db = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_PATH || "users.db"
});

const Rider = db.define("Rider", {
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  city: DataTypes.STRING,
  password: DataTypes.STRING, // For demo purposes, plain text
  role: { type: DataTypes.STRING, defaultValue: 'rider' },
  created_at: DataTypes.STRING
});

db.sync();

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

const v1Router = express.Router();

v1Router.post("/riders", async (req, res) => {
  try {
    const { name, email, phone, city, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).send({ error: "name, email, and password are required" });
    }
    const rider = await Rider.create({
      name,
      email,
      phone,
      city,
      password,
      role: role || 'rider',
      created_at: new Date().toISOString()
    });
    res.status(201).send(rider);
  } catch (err) {
    res.status(500).send({ error: "Failed to create rider" });
  }
});

v1Router.get("/riders", async (req, res) => {
  const { email } = req.query;
  let riders;
  if (email) {
    riders = await Rider.findAll({ where: { email } });
  } else {
    riders = await Rider.findAll();
  }
  res.send(riders);
});

v1Router.get("/riders/:id", async (req, res) => {
  const rider = await Rider.findByPk(req.params.id);
  if (!rider) {
    return res.status(404).send({ error: "Rider not found" });
  }
  res.send(rider);
});

v1Router.put("/riders/:id", async (req, res) => {
  const rider = await Rider.findByPk(req.params.id);
  if (!rider) {
    return res.status(404).send({ error: "Rider not found" });
  }
  await rider.update(req.body);
  res.send(rider);
});

v1Router.delete("/riders/:id", async (req, res) => {
  const rider = await Rider.findByPk(req.params.id);
  if (!rider) {
    return res.status(404).send({ error: "Rider not found" });
  }
  await rider.destroy();
  res.status(204).send();
});

app.use("/v1", v1Router);

app.get("/health", (req, res) => {
  res.send("OK");
});

app.get("/metrics", async (req, res) => {
  const riderCount = await Rider.count();
  ridersTotal.set(riderCount);
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(3000, () => {
  logger.info({ service: "user", port: 3000 }, "service started");
});
