#!/usr/bin/env node
/**
 * Load test collector — autocannon against deployed API.
 * Gentle profile to avoid hammering deployed rate limiter.
 *
 * Usage: node collect/load-test.js <api-base-url>
 * Output: ../output/load-test.json
 */

"use strict";

const fs = require("fs");
const path = require("path");
const autocannon = require("autocannon");

// Endpoint mix (approximate weights via repetition in requests array):
//   Health Check    10% → 1× in 10-slot rotation
//   List Animals    45% → 5× in 10-slot rotation (with varied query params)
//   Filter Options  15% → 1×
//   Single Animal   20% → 2×
//   Upload Config   10% → 1×
const REQUESTS = [
  { method: "GET", path: "/health" },
  { method: "GET", path: "/api/animals?limit=10&offset=0" },
  { method: "GET", path: "/api/animals?limit=10&offset=0&species=perro" },
  { method: "GET", path: "/api/animals/filters" },
  { method: "GET", path: "/api/animals?limit=10&offset=0&species=gato" },
  { method: "GET", path: "/api/animals/1" },
  { method: "GET", path: "/api/animals?limit=10&offset=10" },
  { method: "GET", path: "/api/animals/2" },
  { method: "GET", path: "/api/uploads/config" },
  { method: "GET", path: "/api/animals?limit=10&offset=0&status=disponible" },
];

async function main() {
  const apiUrl = process.argv[2];
  if (!apiUrl) {
    console.error("Usage: node collect/load-test.js <api-base-url>");
    process.exit(1);
  }

  const outputDir = path.join(__dirname, "..", "output");
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`[load-test] Target: ${apiUrl}`);
  console.log(`[load-test] Profile: 20 connections × 40s (deployed-friendly)`);
  console.log(`[load-test] Running autocannon...`);

  const result = await autocannon({
    url: apiUrl,
    connections: 20,
    duration: 40,
    pipelining: 1,
    requests: REQUESTS,
    setupClient: (client) => {
      client.setHeaders({ Accept: "application/json" });
    },
  });

  const lat = result.latency;
  const http2xx = result["2xx"] ?? 0;
  const http4xx = result["4xx"] ?? 0;
  const http5xx = result["5xx"] ?? 0;
  const http429 = result.statusCodeStats?.["429"]?.count ?? 0;

  const output = {
    tool: "autocannon",
    collectedAt: new Date().toISOString(),
    target: apiUrl,
    profile: "20 connections × 40s",
    summary: {
      totalRequests: result.requests.total,
      totalResponses: result.requests.total - (result.errors ?? 0) - (result.timeouts ?? 0),
      http2xx,
      http429,
      http4xx,
      http5xx,
      p50: lat.p50 ?? null,
      p95: lat.p97_5 ?? null,
      p99: lat.p99 ?? null,
      min: lat.min ?? null,
      max: lat.max ?? null,
      requestRate: result.requests.mean ?? null,
      errors: result.errors ?? 0,
      timeouts: result.timeouts ?? 0,
    },
  };

  console.log(`[load-test] Requests: ${output.summary.totalRequests}  2xx: ${http2xx}  4xx: ${http4xx}  5xx: ${http5xx}`);
  console.log(`[load-test] p50=${lat.p50}ms  p95≈${lat.p97_5}ms  p99=${lat.p99}ms  max=${lat.max}ms`);

  const outFile = path.join(outputDir, "load-test.json");
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
  console.log(`[load-test] Saved → ${outFile}`);
}

main().catch((err) => {
  console.error("[load-test] Fatal:", err.message);
  process.exit(1);
});
