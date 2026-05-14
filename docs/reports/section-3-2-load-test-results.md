# Section 3.2 — Load Test Results

The API load test was executed on 2026-05-14 against the deployed Vercel backend.

---

## Test Configuration

| Parameter | Value |
|-----------|-------|
| Tool | autocannon |
| Target | `https://capstone-animal-rescue-server.vercel.app` |
| Profile | 20 connections x 40 s |
| Run date | 2026-05-14 |

**Endpoint mix:**

| Scenario | Endpoint | Weight |
|----------|----------|--------|
| Health Check | `GET /health` | 10% |
| List Animals | `GET /api/animals` with varied filters/pagination | 45% |
| Filter Options | `GET /api/animals/filters` | 15% |
| Single Animal | `GET /api/animals/:id` | 20% |
| Upload Config | `GET /api/uploads/config` | 10% |

---

## Visualizations

![p95 Response Time per Endpoint](./charts/load-test-p95.svg)

---

## Results Table

| Metric | Value |
|--------|------:|
| Total requests | 8,537 |
| Total responses | 8,537 |
| HTTP 2xx | 6,802 |
| HTTP 429 | 976 |
| HTTP 4xx | 1,735 |
| HTTP 5xx | 0 |
| p50 latency | 78 ms |
| p95 latency | **228 ms — PASS** |
| p99 latency | 312 ms |
| Min latency | 52 ms |
| Max latency | 1,516 ms |
| Mean request rate | 213.43 req/s |
| Network/client errors | 0 |
| Timeouts | 0 |

---

## SMART Objective 2 Validation

> *"The API must respond within 2 seconds under simulated load."*

**Result: PASS**

The deployed API returned an aggregate p95 of **228 ms**, well below the 2,000 ms target. No 5xx responses, network errors, or timeouts were recorded during the 40-second deployed run.

---

## Analysis

The deployed API handled 8,537 requests at roughly 213 requests per second with strong latency: p50 was 78 ms and p99 was 312 ms. The 1,735 HTTP 4xx responses include 976 rate-limited requests and other client-status responses from data-dependent routes in the deployed dataset; they did not indicate server failure. The absence of HTTP 5xx responses is the main change from earlier local/free-tier tests, where Supabase connection pressure could surface as backend errors.

---

## Artifacts

| Artifact | Location |
|----------|----------|
| Raw load-test JSON | `docs/reports/scripts/output/load-test.json` |
| p95 chart | `docs/reports/charts/load-test-p95.svg` |
| Audit script | `docs/reports/scripts/run-audit.sh` |
