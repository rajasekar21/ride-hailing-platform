
const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user:3000";
const DRIVER_SERVICE_URL = process.env.DRIVER_SERVICE_URL || "http://driver:3000";

app.use(express.json());

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({ error: "Email and password are required" });
    }

    // Check riders first
    let userResponse = await axios.get(`${USER_SERVICE_URL}/v1/riders`, {
      params: { email }
    });
    let users = userResponse.data;
    let user = users.find(u => u.email === email && u.password === password);

    let service = 'rider';

    if (!user) {
      // Check drivers
      userResponse = await axios.get(`${DRIVER_SERVICE_URL}/v1/drivers`);
      users = userResponse.data;
      user = users.find(u => u.email === email && u.password === password);
      service = 'driver';
    }

    if (!user) {
      return res.status(401).send({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role, service }, JWT_SECRET, { expiresIn: '24h' });
    res.send({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, service } });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).send({ error: "Authentication failed" });
  }
});

app.post("/verify", (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).send({ error: "Token is required" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    res.send({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).send({ error: "Invalid token" });
  }
});

app.get("/health", (req, res) => {
  res.send("OK");
});

app.listen(3000, () => {
  console.log("Auth service running on port 3000");
});
