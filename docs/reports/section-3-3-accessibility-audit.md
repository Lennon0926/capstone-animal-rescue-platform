# Section 3.3 — Accessibility Audit Results (WCAG 2.1 AA)

Accessibility audits were executed on 2026-05-14 against the deployed Vercel frontend using pa11y with the axe-core runner.

---

## Test Configuration

| Parameter | Value |
|-----------|-------|
| Tool | pa11y + axe-core |
| WCAG Standard | WCAG 2.1 Level AA |
| Browser/Runner | Headless Chrome, axe runner |
| Target | `https://capstone-animal-rescue-web.vercel.app` |
| Run date | 2026-05-14 |

**Pages audited:**

| # | Page | URL |
|---|------|-----|
| 1 | Home | `https://capstone-animal-rescue-web.vercel.app/home` |
| 2 | Adopt Listing | `https://capstone-animal-rescue-web.vercel.app/adopt` |
| 3 | Animal Detail | `https://capstone-animal-rescue-web.vercel.app/adopt/1` |
| 4 | About | `https://capstone-animal-rescue-web.vercel.app/about` |
| 5 | Blog | `https://capstone-animal-rescue-web.vercel.app/blog` |

---

## Visualizations

![Accessibility Violations by Page — WCAG 2.1 AA Current State](./charts/accessibility-violations.svg)

---

## Summary Table

| Page | Critical | Serious | Moderate | Minor | Status |
|------|----------|---------|----------|-------|--------|
| `/home` | 0 | 0 | 0 | 0 | **PASS** |
| `/adopt` | 0 | 0 | 0 | 0 | **PASS** |
| `/adopt/1` | 0 | 0 | 0 | 0 | **PASS** |
| `/about` | 0 | 0 | 0 | 0 | **PASS** |
| `/blog` | 0 | 0 | 0 | 0 | **PASS** |
| **Total** | **0** | **0** | **0** | **0** | |

> **Status definition:** PASS = 0 Critical + 0 Serious violations.

---

## Top Issues by Page

No issues were reported on the audited pages in this run.

---

## SMART Objective 5 Validation

> *"The platform must comply with WCAG 2.1 Level AA accessibility standards."*

**Result: PASS for the deployed public pages audited in this run.**

No Critical, Serious, Moderate, or Minor violations were reported by pa11y/axe-core on any audited page.

---

## Analysis

The deployed accessibility result for this run indicates full compliance with the current automated checks. Since this is tool-based validation, periodic manual accessibility checks (keyboard-only flows, screen reader behavior, language switching, and form announcements) should continue as part of release QA.

---

## Artifacts

| Artifact | Location |
|----------|----------|
| Raw accessibility JSON | `docs/reports/scripts/output/accessibility.json` |
| Violation chart | `docs/reports/charts/accessibility-violations.svg` |
| Audit script | `docs/reports/scripts/run-audit.sh` |
