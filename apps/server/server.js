const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });

const express = require("express");
const cors = require("cors");
const { validateEnv, REQUIRED_ENV_VARS } = require("./validateEnv");

validateEnv();

// Import custom modules
const { verifyConnection } = require("./lib/supabase");
const animalsRouter = require("./routes/animals");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();
const port = Number(process.env.PORT) || 4000;
const startedAt = new Date().toISOString();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Capstone Animal Rescue Platform API",
    version: "1.0.0",
    endpoints: {
      animals: "/api/animals",
      health: "/api/health",
    },
  });
});

// Health check with database connection status
app.get("/api/health", async (req, res) => {
  const dbStatus = await verifyConnection();

  res.status(dbStatus.connected ? 200 : 503).json({
    success: dbStatus.connected,
    status: dbStatus.connected ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.connected,
      error: dbStatus.error || null,
    },
  });
});

// Simple health/ready endpoints
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

// API Routes
app.use("/api/animals", animalsRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(port, () => {
  console.log(`Server started on port ${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
  console.log(`Animals API: http://localhost:${port}/api/animals`);
});

// Graceful shutdown handling
const shutdown = (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
  // Force exit after 5 seconds if server doesn't close
  setTimeout(() => {
    console.error("Forcing shutdown after timeout");
    process.exit(1);
  }, 5000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
