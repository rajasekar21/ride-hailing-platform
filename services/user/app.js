const express = require("express");
const cors = require("cors");
const { Sequelize, DataTypes } = require("sequelize");
const promClient = require("prom-client");

const app = express();
app.use(cors());
app.use(express.json());

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
  const requestId = req.get("X-Request-ID") || `req-${Date.now()}`;
  req.requestId = requestId;
  console.log(JSON.stringify({ requestId, method: req.method, path: req.path, body: req.body }));
  next();
});

app.post("/v1/riders", async (req, res) => {
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

app.get("/v1/riders", async (req, res) => {
  const { email } = req.query;
  let riders;
  if (email) {
    riders = await Rider.findAll({ where: { email } });
  } else {
    riders = await Rider.findAll();
  }
  res.send(riders);
});

app.get("/v1/riders/:id", async (req, res) => {
  const rider = await Rider.findByPk(req.params.id);
  if (!rider) {
    return res.status(404).send({ error: "Rider not found" });
  }
  res.send(rider);
});

app.put("/v1/riders/:id", async (req, res) => {
  const rider = await Rider.findByPk(req.params.id);
  if (!rider) {
    return res.status(404).send({ error: "Rider not found" });
  }
  await rider.update(req.body);
  res.send(rider);
});

app.delete("/v1/riders/:id", async (req, res) => {
  const rider = await Rider.findByPk(req.params.id);
  if (!rider) {
    return res.status(404).send({ error: "Rider not found" });
  }
  await rider.destroy();
  res.status(204).send();
});

app.get("/users", async (req, res) => {
  const riders = await Rider.findAll();
  res.send(riders);
});

app.post("/users", async (req, res) => {
  try {
    const rider = await Rider.create({
      ...req.body,
      created_at: new Date().toISOString()
    });
    res.status(201).send(rider);
  } catch (err) {
    res.status(500).send({ error: "Failed to create user" });
  }
});

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
  console.log("User service running on port 3000");
});
