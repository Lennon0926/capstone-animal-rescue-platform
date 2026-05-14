# Section 3.1 — Page Performance Results (Lighthouse)

All Lighthouse audits were executed on 2026-05-14 against the deployed Vercel frontend.

---

## Test Configuration

| Parameter | Value |
|-----------|-------|
| Tool | Lighthouse v12 |
| Target | `https://capstone-animal-rescue-web.vercel.app` |
| API Backend | `https://capstone-animal-rescue-server.vercel.app` |
| Preset | Desktop (1350 × 940, no throttling) |
| Runs per URL | 1 |
| Run date | 2026-05-14 |

**Pages audited:**

| # | Page | URL |
|---|------|-----|
| 1 | Home | `/home` |
| 2 | Adopt Listing | `/adopt` |
| 3 | Animal Detail | `/adopt/1` |
| 4 | About | `/about` |
| 5 | Blog | `/blog` |

---

## Visualizations

![Lighthouse Scores by Page — Performance, Accessibility, Best Practices, SEO](./charts/lighthouse-scores.svg)

---

## Lighthouse Scores

| Page | Performance | Accessibility | Best Practices | SEO |
|------|:-----------:|:-------------:|:--------------:|:---:|
| `/home` | 75 | 100 | 100 | 100 |
| `/adopt` | 98 | 99 | 100 | 100 |
| `/adopt/1` | 100 | 100 | 100 | 100 |
| `/about` | 100 | 100 | 100 | 100 |
| `/blog` | 88 | 100 | 100 | 100 |
| **Average** | **92.2** | **99.8** | **100.0** | **100.0** |

Score scale: 0-49 Poor · 50-89 Needs Improvement · 90-100 Good.

---

## Core Web Vitals / Metrics

| Page | LCP | CLS | TTFB | Speed Index | TBT |
|------|-----|-----|------|-------------|-----|
| `/home` | 1,904 ms | 0.036 | 46 ms | 5,223 ms | 0 ms |
| `/adopt` | 899 ms | 0.000 | 48 ms | 866 ms | 0 ms |
| `/adopt/1` | 650 ms | 0.000 | 48 ms | 636 ms | 0 ms |
| `/about` | 402 ms | 0.000 | 46 ms | 405 ms | 0 ms |
| `/blog` | 2,229 ms | 0.000 | 50 ms | 1,187 ms | 0 ms |

> **LCP** = Largest Contentful Paint · **CLS** = Cumulative Layout Shift · **TTFB** = Time to First Byte · **TBT** = Total Blocking Time

---

## SMART Objective 1 Validation

> *"The web application must load in under 3 seconds for 95% of page visits."*

| Page | LCP | <= 3,000 ms? |
|------|-----|:------------:|
| `/home` | 1,904 ms | **PASS** |
| `/adopt` | 899 ms | **PASS** |
| `/adopt/1` | 650 ms | **PASS** |
| `/about` | 402 ms | **PASS** |
| `/blog` | 2,229 ms | **PASS** |

**Result: PASS**

All audited deployed pages stayed under the 3-second LCP target.

---

## Analysis

The deployed frontend remains strong in quality categories, with Accessibility, Best Practices, and SEO near-perfect or perfect across all pages. Performance is still good overall (average 92.2), but `/home` and `/blog` are below the 90 threshold and are the best candidates for optimization work.

---

## Artifacts

| Artifact | Location |
|----------|----------|
| Raw Lighthouse JSON | `docs/reports/scripts/output/lighthouse.json` |
| Scores chart | `docs/reports/charts/lighthouse-scores.svg` |
| Audit script | `docs/reports/scripts/run-audit.sh` |
