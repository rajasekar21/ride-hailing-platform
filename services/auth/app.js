
const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

app.use(express.json());

app.post("/login", (req, res) => {
  try {
    if (!req.body.u) {
      return res.status(400).send({ error: "Username is required" });
    }
    const token = jwt.sign({ u: req.body.u }, JWT_SECRET);
    res.send({ token });
  } catch (err) {
    res.status(500).send({ error: "Authentication failed" });
  }
});

app.get("/health", (req, res) => {
  res.send("OK");
});

app.listen(3000, () => {
  console.log("Auth service running on port 3000");
});
