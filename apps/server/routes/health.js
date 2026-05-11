/**
 * Health & System Routes
 * Provides health checks, readiness probes, and API info endpoints.
 */


const express = require("express");
const router = express.Router();

const { verifyConnection } = require("../lib/supabase");
const { REQUIRED_ENV_VARS } = require("../validateEnv");

const startedAt = new Date().toISOString();

/**
 * GET /
 * Root endpoint — returns API info and available endpoints.
 */
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Capstone Animal Rescue Platform API",
    version: "1.0.0",
    endpoints: {
      animals: "/api/animals",
      users: "/api/users",
      health: "/api/health",
    },
  });
});

/**
 * GET /api/health
 * Returns API health status including database connectivity.
 */
router.get("/api/health", async (req, res) => {
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

/**
 * GET /health
 * Simple liveness probe — returns uptime without checking dependencies.
 */
router.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), startedAt });
});

/**
 * GET /ready
 * Readiness probe — returns 503 if required environment variables are missing.
 */
router.get("/ready", (req, res) => {
  const envReady = REQUIRED_ENV_VARS.every((key) => !!process.env[key]);

  if (!envReady) {
    return res.status(503).json({ status: "not ready", reason: "missing env" });
  }

  res.json({ status: "ready" });
});

module.exports = router;
