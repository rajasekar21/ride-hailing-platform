const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.send("OK"));

app.listen(3000, () => {
  console.log("Notification service running");
});
