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
| Total requests | 8,671 |
| Total responses | 8,671 |
| HTTP 2xx | 7,369 |
| HTTP 429 | 484 |
| HTTP 4xx | 1,302 |
| HTTP 5xx | 0 |
| p50 latency | 78 ms |
| p95 latency | **177 ms — PASS** |
| p99 latency | 328 ms |
| Min latency | 51 ms |
| Max latency | 1,299 ms |
| Mean request rate | 216.78 req/s |
| Network/client errors | 0 |
| Timeouts | 0 |

---

## SMART Objective 2 Validation

> *"The API must respond within 2 seconds under simulated load."*

**Result: PASS**

The deployed API returned an aggregate p95 of **177 ms**, well below the 2,000 ms target. No 5xx responses, network errors, or timeouts were recorded during the 40-second deployed run.

---

## Analysis

The deployed API handled 8,671 requests at roughly 217 requests per second with strong latency: p50 was 78 ms and p99 was 328 ms. The 1,302 HTTP 4xx responses include 484 rate-limited requests and other client-status responses from data-dependent routes in the deployed dataset; they did not indicate server failure. The absence of HTTP 5xx responses remains the critical reliability signal.

---

## Artifacts

| Artifact | Location |
|----------|----------|
| Raw load-test JSON | `docs/reports/scripts/output/load-test.json` |
| p95 chart | `docs/reports/charts/load-test-p95.svg` |
| Audit script | `docs/reports/scripts/run-audit.sh` |
