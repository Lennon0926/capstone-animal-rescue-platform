const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });

const express = require("express");
const cors = require("cors");
const { validateEnv, REQUIRED_ENV_VARS } = require("./validateEnv");

validateEnv();

const app = express();
const port = Number(process.env.PORT) || 4000;
const startedAt = new Date().toISOString();

app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "This is the Capstone Animal Rescue Platform" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), startedAt });
});

app.get("/ready", (req, res) => {
  const envReady = REQUIRED_ENV_VARS.every((key) => !!process.env[key]);

  if (!envReady) {
    return res.status(503).json({ status: "not ready", reason: "missing env" });
  }

  res.json({ status: "ready" });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
