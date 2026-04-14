const express = require("express");
const cors = require("cors");
const { Sequelize, DataTypes } = require("sequelize");

const app = express();

app.use(cors());
app.use(express.json());

// DB setup
const db = new Sequelize({
  dialect: "sqlite",
  storage: "users.db"
});

const U = db.define("U", {
  name: DataTypes.STRING
});

db.sync();

// Routes
app.get("/users", async (req, res) => {
  const users = await U.findAll();
  res.send(users);
});

app.post("/users", async (req, res) => {
  const user = await U.create(req.body);
  res.send(user);
});

// Health check
app.get("/health", (req, res) => {
  res.send("OK");
});

app.listen(3000, () => {
  console.log("User service running on port 3000");
});
