# Section 3.1 — Page Performance Results (Lighthouse)

All Lighthouse audits were executed on 2026-05-14 against the deployed Vercel frontend.

---

## Test Configuration

| Parameter | Value |
|-----------|-------|
| Tool | Lighthouse v12 |
| Target | `https://capstone-animal-rescue-web.vercel.app` |
| API Backend | `https://capstone-animal-rescue-server.vercel.app` |
| Preset | Desktop (1350 x 940, no CPU/network throttling) |
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
| `/home` | 76 | **98** | **100** | **100** |
| `/adopt` | **100** | **99** | **100** | **100** |
| `/adopt/1` | **100** | **100** | **100** | **100** |
| `/about` | **100** | **98** | **100** | **100** |
| `/blog` | **94** | **96** | **100** | **100** |
| **Average** | **94.0** | **98.2** | **100.0** | **100.0** |

Score scale: 0-49 Poor · 50-89 Needs Improvement · 90-100 Good.

---

## Core Web Vitals / Metrics

| Page | LCP | CLS | TTFB | Speed Index | TBT |
|------|-----|-----|------|-------------|-----|
| `/home` | 1,858 ms | 0.037 | 49 ms | 4,643 ms | 0 ms |
| `/adopt` | 709 ms | 0.000 | 54 ms | 677 ms | 0 ms |
| `/adopt/1` | 485 ms | 0.000 | 46 ms | 473 ms | 0 ms |
| `/about` | 277 ms | 0.000 | 48 ms | 406 ms | 0 ms |
| `/blog` | 1,561 ms | 0.000 | 47 ms | 821 ms | 0 ms |

> **LCP** = Largest Contentful Paint · **CLS** = Cumulative Layout Shift · **TTFB** = Time to First Byte · **TBT** = Total Blocking Time

---

## SMART Objective 1 Validation

> *"The web application must load in under 3 seconds for 95% of page visits."*

| Page | LCP | <= 3,000 ms? |
|------|-----|:------------:|
| `/home` | 1,858 ms | **PASS** |
| `/adopt` | 709 ms | **PASS** |
| `/adopt/1` | 485 ms | **PASS** |
| `/about` | 277 ms | **PASS** |
| `/blog` | 1,561 ms | **PASS** |

**Result: PASS**

All audited deployed pages stayed under the 3-second LCP target. `/home` is the slowest page at 1,858 ms, followed by `/blog` at 1,561 ms, but both remain within the SMART objective threshold.

---

## Analysis

The deployed frontend performs well overall, with Best Practices and SEO scoring 100 on every audited page. `/home` is the only page below the Lighthouse "Good" threshold for Performance, scoring 76 with a 4,643 ms Speed Index and 1,858 ms LCP. Total Blocking Time is 0 ms across all pages, and deployed TTFB remains consistently low at 46-54 ms.

---

## Artifacts

| Artifact | Location |
|----------|----------|
| Raw Lighthouse JSON | `docs/reports/scripts/output/lighthouse.json` |
| Scores chart | `docs/reports/charts/lighthouse-scores.svg` |
| Audit script | `docs/reports/scripts/run-audit.sh` |
