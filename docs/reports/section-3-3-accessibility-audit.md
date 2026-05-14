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
| `/home` | 0 | 20 | 14 | 0 | **FAIL** |
| `/adopt` | 0 | 12 | 3 | 0 | **FAIL** |
| `/adopt/1` | 0 | 0 | 3 | 0 | **PASS** |
| `/about` | 0 | 3 | 33 | 0 | **FAIL** |
| `/blog` | 0 | 5 | 4 | 0 | **FAIL** |
| **Total** | **0** | **40** | **57** | **0** | |

> **Status definition:** PASS = 0 Critical + 0 Serious violations. Moderate issues are still tracked because they affect semantic structure and assistive-technology navigation.

---

## Top Issues by Page

### `/home`

| Impact | Code | Count | Issue |
|--------|------|------:|-------|
| Serious | `color-contrast` | 20 | Text and link colors do not meet minimum contrast thresholds. |
| Moderate | `region` | 12 | Page content is not fully contained by landmarks. |
| Moderate | `heading-order` | 1 | Heading levels skip hierarchy. |

### `/adopt`

| Impact | Code | Count | Issue |
|--------|------|------:|-------|
| Serious | `color-contrast` | 12 | Animal card text does not meet minimum contrast thresholds. |
| Moderate | `landmark-one-main` | 1 | Document should have one main landmark. |
| Moderate | `page-has-heading-one` | 1 | Page should contain a level-one heading. |

### `/adopt/1`

| Impact | Code | Count | Issue |
|--------|------|------:|-------|
| Moderate | `landmark-one-main` | 1 | Document should have one main landmark. |
| Moderate | `page-has-heading-one` | 1 | Page should contain a level-one heading. |
| Moderate | `region` | 1 | Page content is not fully contained by landmarks. |

### `/about`

| Impact | Code | Count | Issue |
|--------|------|------:|-------|
| Serious | `color-contrast` | 3 | Hero text does not meet minimum contrast thresholds. |
| Moderate | `region` | 31 | Page content is not fully contained by landmarks. |
| Moderate | `heading-order` | 1 | Heading levels skip hierarchy. |

### `/blog`

| Impact | Code | Count | Issue |
|--------|------|------:|-------|
| Serious | `color-contrast` | 5 | Blog date, badge, button, and link text do not meet contrast thresholds. |
| Moderate | `region` | 4 | Masthead content is not fully contained by landmarks. |

---

## SMART Objective 5 Validation

> *"The platform must comply with WCAG 2.1 Level AA accessibility standards."*

**Result: FAIL for the deployed public pages audited in this run.**

No critical violations were found, but four of the five deployed public pages have serious WCAG AA issues. Most serious findings are `color-contrast` violations, while the moderate findings are largely structural (`region`, `landmark-one-main`, and missing or skipped heading hierarchy).

---

## Analysis

The deployed accessibility result differs from the earlier local E2E accessibility report because this run audits the live Vercel frontend with production data and pa11y/axe directly. `/adopt/1` has no serious violations and passes the strict status rule, but `/home`, `/adopt`, `/about`, and `/blog` need contrast remediation before claiming WCAG 2.1 AA compliance. The repeated landmark and heading findings also indicate shared layout structure should be updated so every page has a clear `<main>` landmark and a predictable heading hierarchy.

---

## Artifacts

| Artifact | Location |
|----------|----------|
| Raw accessibility JSON | `docs/reports/scripts/output/accessibility.json` |
| Violation chart | `docs/reports/charts/accessibility-violations.svg` |
| Audit script | `docs/reports/scripts/run-audit.sh` |
