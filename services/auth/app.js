
const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user:3000";

app.use(express.json());

app.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).send({ error: "Email is required" });
    }

    // Verify user exists in User Service
    const userResponse = await axios.get(`${USER_SERVICE_URL}/v1/riders`, {
      params: { email }
    });

    const users = userResponse.data;
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).send({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.send({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).send({ error: "Authentication failed" });
  }
});

app.get("/health", (req, res) => {
  res.send("OK");
});

app.listen(3000, () => {
  console.log("Auth service running on port 3000");
});
