#!/usr/bin/env node
/**
 * Load test collector — Artillery against deployed API.
 * Uses a gentler profile than local (shorter duration, no ramp hammering).
 *
 * Usage: node collect/load-test.js <api-base-url>
 * Output: ../output/load-test.json
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

// Gentler profile for deployed server (avoid hammering rate limiter)
const ARTILLERY_CONFIG = (apiUrl) => ({
  config: {
    target: apiUrl,
    phases: [
      { duration: 10, arrivalRate: 1, rampTo: 20, name: "Ramp up (0→20 VU)" },
      { duration: 30, arrivalRate: 20, name: "Sustained load (20 VU)" },
    ],
    defaults: { headers: { Accept: "application/json" } },
    ensure: { p95: 2000, maxErrorRate: 5 },
  },
  scenarios: [
    {
      name: "Health Check",
      weight: 10,
      flow: [{ get: { url: "/health" } }],
    },
    {
      name: "List Animals",
      weight: 45,
      flow: [
        {
          get: {
            url: "/api/animals",
            qs: { limit: 10, offset: 0, species: "perro" },
          },
        },
      ],
    },
    {
      name: "Filter Options",
      weight: 15,
      flow: [{ get: { url: "/api/animals/filters" } }],
    },
    {
      name: "Single Animal",
      weight: 20,
      flow: [{ get: { url: "/api/animals/1" } }],
    },
    {
      name: "Upload Config",
      weight: 10,
      flow: [{ get: { url: "/api/uploads/config" } }],
    },
  ],
});

function parseArtilleryOutput(rawJson) {
  const data = JSON.parse(rawJson);
  const agg = data.aggregate;

  const endpoints = [
    "Health Check",
    "List Animals",
    "Filter Options",
    "Single Animal",
    "Upload Config",
  ];

  // Artillery doesn't break down by scenario in the aggregate — parse intermediate
  const scenarioStats = {};
  for (const name of endpoints) {
    scenarioStats[name] = { requests: 0, p95: null, p99: null, errors: 0 };
  }

  // Aggregate histogram for overall
  const hist = agg.histograms?.["http.response_time"] ?? {};

  return {
    summary: {
      totalRequests: agg.counters?.["http.requests"] ?? 0,
      totalResponses: agg.counters?.["http.responses"] ?? 0,
      http2xx: agg.counters?.["http.codes.200"] ?? 0,
      http429: agg.counters?.["http.codes.429"] ?? 0,
      http4xx:
        (agg.counters?.["http.codes.400"] ?? 0) +
        (agg.counters?.["http.codes.401"] ?? 0) +
        (agg.counters?.["http.codes.403"] ?? 0) +
        (agg.counters?.["http.codes.404"] ?? 0) +
        (agg.counters?.["http.codes.429"] ?? 0),
      http5xx:
        (agg.counters?.["http.codes.500"] ?? 0) +
        (agg.counters?.["http.codes.502"] ?? 0) +
        (agg.counters?.["http.codes.503"] ?? 0),
      p50: hist.p50 ?? null,
      p95: hist.p95 ?? null,
      p99: hist.p99 ?? null,
      min: hist.min ?? null,
      max: hist.max ?? null,
      requestRate: agg.rates?.["http.request_rate"] ?? null,
    },
    scenarios: scenarioStats,
    raw: data.aggregate,
  };
}

async function main() {
  const apiUrl = process.argv[2];
  if (!apiUrl) {
    console.error("Usage: node collect/load-test.js <api-base-url>");
    process.exit(1);
  }

  const outputDir = path.join(__dirname, "..", "output");
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`[load-test] Target: ${apiUrl}`);
  console.log(`[load-test] Profile: 20 VU sustained × 30s (deployed-friendly)`);

  // Write artillery config to tmp file
  const configPath = path.join(os.tmpdir(), `artillery-deployed-${Date.now()}.json`);
  fs.writeFileSync(configPath, JSON.stringify(ARTILLERY_CONFIG(apiUrl), null, 2));

  const rawOutputPath = path.join(outputDir, "load-test-raw.json");

  // Find artillery binary: try local node_modules first, then npx
  const localArtillery = path.join(__dirname, "..", "node_modules", ".bin", "artillery");
  const artilleryBin = fs.existsSync(localArtillery) ? localArtillery : "npx artillery";

  console.log(`[load-test] Running Artillery...`);
  try {
    execSync(
      `${artilleryBin} run --output "${rawOutputPath}" "${configPath}"`,
      { stdio: "inherit", timeout: 120_000 }
    );
  } catch (err) {
    console.warn(`[load-test] Artillery exited non-zero (may be threshold): ${err.message}`);
  } finally {
    fs.unlinkSync(configPath);
  }

  if (!fs.existsSync(rawOutputPath)) {
    console.error("[load-test] No output file produced — artillery may have failed.");
    process.exit(1);
  }

  const rawContent = fs.readFileSync(rawOutputPath, "utf8");
  const parsed = parseArtilleryOutput(rawContent);

  const output = {
    tool: "Artillery v2",
    collectedAt: new Date().toISOString(),
    target: apiUrl,
    profile: "20 VU ramp 10s + sustained 30s",
    ...parsed,
  };

  const outFile = path.join(outputDir, "load-test.json");
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

  console.log(`[load-test] p95=${parsed.summary.p95}ms p99=${parsed.summary.p99}ms`);
  console.log(`[load-test] Saved → ${outFile}`);
}

main().catch((err) => {
  console.error("[load-test] Fatal:", err.message);
  process.exit(1);
});
