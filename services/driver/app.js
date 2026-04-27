const express = require("express");
const cors = require("cors");
const { Sequelize, DataTypes } = require("sequelize");

const app = express();
app.use(cors());
app.use(express.json());

const db = new Sequelize({
  dialect: "sqlite",
  storage: "drivers.db"
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
  created_at: DataTypes.STRING
});

db.sync();

app.use((req, res, next) => {
  const requestId = req.get("X-Request-ID") || `req-${Date.now()}`;
  req.requestId = requestId;
  console.log(JSON.stringify({ requestId, method: req.method, path: req.path, query: req.query, body: req.body }));
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
    const driver = await Driver.create({
      id: req.body.id,
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      vehicle_type: req.body.vehicle_type,
      vehicle_plate: req.body.vehicle_plate,
      is_active: req.body.is_active === true,
      city: req.body.city,
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

app.listen(3000, () => {
  console.log("Driver service running on port 3000");
});
