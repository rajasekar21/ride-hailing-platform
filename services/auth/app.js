
const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const promClient = require("prom-client");
const logger = require("../shared/logger");
const correlationMiddleware = require("../shared/correlationMiddleware");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user:3000";
const DRIVER_SERVICE_URL = process.env.DRIVER_SERVICE_URL || "http://driver:3000";

app.use(express.json());
app.use(correlationMiddleware);

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

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const loginAttemptsTotal = new promClient.Counter({
  name: 'auth_login_attempts_total',
  help: 'Total number of login attempts',
  registers: [register]
});

const loginSuccessTotal = new promClient.Counter({
  name: 'auth_login_success_total',
  help: 'Total number of successful logins',
  registers: [register]
});

const loginFailuresTotal = new promClient.Counter({
  name: 'auth_login_failures_total',
  help: 'Total number of failed logins',
  registers: [register]
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      loginAttemptsTotal.inc();
      loginFailuresTotal.inc();
      return res.status(400).send({ error: "Email and password are required" });
    }

    loginAttemptsTotal.inc();

    // Check riders first
    let userResponse = await axios.get(`${USER_SERVICE_URL}/v1/riders`, {
      params: { email },
      headers: { "x-correlation-id": req.correlationId }
    });
    let users = userResponse.data;
    let user = users.find(u => u.email === email && u.password === password);

    let service = 'rider';

    if (!user) {
      // Check drivers
      userResponse = await axios.get(`${DRIVER_SERVICE_URL}/v1/drivers`, {
        headers: { "x-correlation-id": req.correlationId }
      });
      users = userResponse.data;
      user = users.find(u => u.email === email && u.password === password);
      service = 'driver';
    }

    if (!user) {
      loginFailuresTotal.inc();
      return res.status(401).send({ error: "Invalid credentials" });
    }

    loginSuccessTotal.inc();
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role, service }, JWT_SECRET, { expiresIn: '24h' });
    res.send({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, service } });
  } catch (err) {
    logger.info({ correlationId: req.correlationId, error: err.message }, "login failed");
    loginFailuresTotal.inc();
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

app.get("/metrics", async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info({ service: "auth", port: PORT }, "service started");
});
