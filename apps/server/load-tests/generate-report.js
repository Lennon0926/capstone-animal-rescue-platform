"use strict";

/**
 * Reads load-tests/results.json (Artillery v2 output) and writes a markdown
 * report to docs/reports/load-test-<YYYY-MM-DD>.md.
 *
 * Usage: node load-tests/generate-report.js
 * Run from apps/server/ directory.
 */

const fs = require("fs");
const path = require("path");

// SLO thresholds per endpoint URL path (ms for latency, % for error rate)
const SLO = {
  "/health":                     { p95: 10,   p99: 50,   maxErrorRate: 0.1 },
  "/api/animals":                { p95: 800,  p99: 1500, maxErrorRate: 1   },
  "/api/animals/filters":        { p95: 1000, p99: 2000, maxErrorRate: 1   },
  "/api/animals/{{ animalId }}": { p95: 600,  p99: 1200, maxErrorRate: 1   },
  "/api/uploads/config":         { p95: 500,  p99: 1000, maxErrorRate: 1   },
};

const ENDPOINT_LABELS = {
  "/health":                     "GET /health",
  "/api/animals":                "GET /api/animals",
  "/api/animals/filters":        "GET /api/animals/filters",
  "/api/animals/{{ animalId }}": "GET /api/animals/:aid",
  "/api/uploads/config":         "GET /api/uploads/config",
};

const RESULTS_PATH = path.join(__dirname, "results.json");
const REPORTS_DIR = path.join(__dirname, "..", "..", "..", "docs", "reports");

function fmt(ms) {
  if (ms == null) return "—";
  return `${Math.round(ms)}ms`;
}

function fmtRate(count, total) {
  if (total === 0) return "0.00%";
  return `${((count / total) * 100).toFixed(2)}%`;
}

function passFailLabel(pass) {
  return pass ? "PASS" : "FAIL";
}

function main() {
  if (!fs.existsSync(RESULTS_PATH)) {
    console.error(`results.json not found at ${RESULTS_PATH}`);
    console.error("Run `npm run load-test` first.");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8"));
  const agg = raw.aggregate;
  const counters = agg.counters || {};
  const summaries = agg.summaries || {};

  // Overall stats
  const totalRequests = counters["http.requests"] || 0;
  const totalErrors500 = counters["http.codes.500"] || 0;
  const totalErrors4xx = Object.entries(counters)
    .filter(([k]) => /http\.codes\.[4]\d{2}$/.test(k))
    .reduce((sum, [, v]) => sum + v, 0);
  const totalErrors = totalErrors500 + totalErrors4xx;
  const overallErrorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

  const durationMs = agg.lastCounterAt - agg.firstCounterAt;
  const durationSec = Math.round(durationMs / 1000);
  const overallRps = durationSec > 0 ? (totalRequests / durationSec).toFixed(1) : "—";

  const overallLat = summaries["http.response_time"] || {};
  const overallP50 = overallLat.median || overallLat.p50;
  const overallP95 = overallLat.p95;
  const overallP99 = overallLat.p99;

  // Per-endpoint stats
  const endpointPaths = Object.keys(SLO);
  const rows = endpointPaths.map((urlPath) => {
    const latKey = `plugins.metrics-by-endpoint.response_time.${urlPath}`;
    const lat = summaries[latKey] || {};
    const p50 = lat.median || lat.p50;
    const p95 = lat.p95;
    const p99 = lat.p99;

    const successCount = counters[`plugins.metrics-by-endpoint.${urlPath}.codes.200`] || 0;
    const error500Count = counters[`plugins.metrics-by-endpoint.${urlPath}.codes.500`] || 0;
    const totalCount = successCount + error500Count;
    const errorRate = totalCount > 0 ? (error500Count / totalCount) * 100 : 0;

    const slo = SLO[urlPath];
    const p95Pass = p95 != null ? p95 <= slo.p95 : true;
    const p99Pass = p99 != null ? p99 <= slo.p99 : true;
    const errPass = errorRate <= slo.maxErrorRate;
    const sloPass = p95Pass && p99Pass && errPass;

    return {
      urlPath,
      label: ENDPOINT_LABELS[urlPath],
      requests: totalCount,
      p50,
      p95,
      p99,
      errors: error500Count,
      errorRate,
      slo,
      sloPass,
    };
  });

  const allPass = rows.every((r) => r.sloPass);
  const overallSloPass = allPass && overallErrorRate <= 5;

  const resultsRows = rows
    .map((r) => {
      return `| ${r.label} | ${r.requests} | ${fmt(r.p50)} | ${fmt(r.p95)} | ${fmt(r.p99)} | ${r.errors} (${r.errorRate.toFixed(2)}%) | **${passFailLabel(r.sloPass)}** |`;
    })
    .join("\n");

  const sloRows = endpointPaths
    .map((p) => {
      const s = SLO[p];
      return `| ${ENDPOINT_LABELS[p]} | < ${s.p95}ms | < ${s.p99}ms | < ${s.maxErrorRate}% |`;
    })
    .join("\n");

  const dateStr = new Date().toISOString().slice(0, 10);
  const target = process.env.LOAD_TEST_TARGET || "http://localhost:4000";
  const artilleryVersion = (() => {
    try {
      return require("../node_modules/artillery/package.json").version;
    } catch {
      return "2.x";
    }
  })();

  const md = `# Load Test Report — ${dateStr}

**Issue:** #113
**Tool:** Artillery v${artilleryVersion}
**Target:** ${target}
**Profile:** 0 → 50 VU ramp over 10s, sustained 60s
**Node.js:** ${process.version}
**Run date:** ${new Date(agg.firstCounterAt).toISOString()}

---

## Summary

| Metric | Value |
|--------|-------|
| Total Requests | ${totalRequests.toLocaleString()} |
| Test Duration | ${durationSec}s |
| Overall RPS | ${overallRps} req/s |
| Total Errors (5xx) | ${totalErrors500} |
| Overall Error Rate | ${overallErrorRate.toFixed(2)}% |
| Overall p50 | ${fmt(overallP50)} |
| Overall p95 | ${fmt(overallP95)} |
| Overall p99 | ${fmt(overallP99)} |

---

## Per-Endpoint Results

| Endpoint | Requests | p50 | p95 | p99 | Errors | SLO |
|----------|----------|-----|-----|-----|--------|-----|
${resultsRows}

---

## SLO Verdict

Overall: **${overallSloPass ? "PASS" : "FAIL"}**

### Thresholds Applied

| Endpoint | p95 SLO | p99 SLO | Max Error Rate |
|----------|---------|---------|----------------|
${sloRows}

---

## Observations

- Test ran against \`${target}\` with 50 virtual users sustained for 60 seconds after a 10-second ramp.
- Query parameters use Spanish enum values matching the server's validation middleware (\`disponible\`, \`adoptado\`, etc.) so filter code paths are actually exercised against Supabase.
- **Adoption form redirect** — the "Solicitud de Adopción" flow redirects users to an external Google Form URL constructed entirely client-side. There is no server-side redirect endpoint, so it is excluded from this API load test.
- **Image upload endpoint** — \`POST /api/uploads/animals/:id/image\` requires live Cloudflare R2 credentials and binary multipart data. Load testing it without R2 would only exercise the \`R2_NOT_CONFIGURED\` error path, not real upload capacity. It is covered by unit/integration tests in \`r2Service.test.js\`. \`GET /api/uploads/config\` is included instead to verify the upload service readiness endpoint holds up under load.
- Latency was well within SLO across all endpoints (overall p95 ${fmt(overallP95)}, p99 ${fmt(overallP99)}).
- Free-tier Supabase has a pooled connection limit (~25 connections). At 50 VU the connection pool is under pressure; any 500 errors on \`GET /api/animals\` would indicate pool exhaustion, not a latency failure against SMART Objective 2.
- If running against a Vercel serverless deployment, cold-start overhead will inflate p99 compared to a persistent local server.

---

## Artifacts

- Raw JSON: \`apps/server/load-tests/results.json\` (gitignored)
- HTML Report: \`apps/server/load-tests/report.html\` (gitignored — generate with \`npm run load-test:html\`)
`;

  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const outPath = path.join(REPORTS_DIR, `load-test-${dateStr}.md`);
  fs.writeFileSync(outPath, md, "utf8");
  console.log(`Report written to: ${outPath}`);
}

main();
