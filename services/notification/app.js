const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const requestId = req.get("X-Request-ID") || `req-${Date.now()}`;
  req.requestId = requestId;
  console.log(JSON.stringify({ requestId, method: req.method, path: req.path, body: req.body }));
  next();
});

app.post("/v1/notifications", (req, res) => {
  const notification = req.body;
  console.log(JSON.stringify({ type: "notification", payload: notification }));
  res.status(201).send({ status: "sent", notification });
});

app.get("/health", (req, res) => res.send("OK"));

app.listen(3000, () => {
  console.log("Notification service running on port 3000");
});
