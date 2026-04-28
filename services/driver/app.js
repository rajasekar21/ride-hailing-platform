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

const driversTotal = new promClient.Gauge({
  name: 'driver_drivers_total',
  help: 'Total number of drivers',
  registers: [register]
});

const activeDriversTotal = new promClient.Gauge({
  name: 'driver_active_drivers_total',
  help: 'Total number of active drivers',
  registers: [register]
});

const db = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_PATH || "drivers.db"
});

const Driver = db.define("Driver", {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  name: DataTypes.STRING,
  phone: DataTypes.STRING,
  email: DataTypes.STRING,
  vehicle_type: DataTypes.STRING,
  vehicle_plate: DataTypes.STRING,
  is_active: DataTypes.BOOLEAN,
  city: DataTypes.STRING,
  password: DataTypes.STRING,
  role: { type: DataTypes.STRING, defaultValue: 'driver' },
  created_at: DataTypes.STRING
});

db.sync();

app.use((req, res, next) => {
  const requestId = req.get("X-Request-ID") || `req-${Date.now()}`;
  const traceId = req.get("X-Trace-ID") || requestId;
  req.requestId = requestId;
  req.traceId = traceId;
  console.log(JSON.stringify({ requestId, traceId, method: req.method, path: req.path, query: req.query, body: req.body }));
  next();
});

app.get("/v1/drivers", async (req, res) => {
  const where = {};
  if (req.query.active === "true") {
    where.is_active = true;
  }
  const drivers = await Driver.findAll({ where });
  res.send(drivers);
});

app.get("/v1/drivers/:id", async (req, res) => {
  const driver = await Driver.findByPk(req.params.id);
  if (!driver) {
    return res.status(404).send({ error: "Driver not found" });
  }
  res.send(driver);
});

app.post("/v1/drivers", async (req, res) => {
  try {
    const { id, name, phone, email, vehicle_type, vehicle_plate, is_active, city, password, role } = req.body;
    if (!id || !name || !email || !password) {
      return res.status(400).send({ error: "id, name, email, and password are required" });
    }
    const driver = await Driver.create({
      id,
      name,
      phone,
      email,
      vehicle_type,
      vehicle_plate,
      is_active: is_active === true,
      city,
      password,
      role: role || 'driver',
      created_at: new Date().toISOString()
    });
    res.status(201).send(driver);
  } catch (err) {
    res.status(500).send({ error: "Failed to create driver" });
  }
});

app.patch("/v1/drivers/:id/status", async (req, res) => {
  const driver = await Driver.findByPk(req.params.id);
  if (!driver) {
    return res.status(404).send({ error: "Driver not found" });
  }
  const isActive = req.body.is_active;
  if (typeof isActive !== "boolean") {
    return res.status(400).send({ error: "is_active boolean is required" });
  }
  await driver.update({ is_active: isActive });
  res.send(driver);
});

app.get("/health", (req, res) => res.send("OK"));

app.get("/metrics", async (req, res) => {
  const driverCount = await Driver.count();
  const activeDriverCount = await Driver.count({ where: { is_active: true } });
  driversTotal.set(driverCount);
  activeDriversTotal.set(activeDriverCount);
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(3000, () => {
  console.log("Driver service running on port 3000");
});
