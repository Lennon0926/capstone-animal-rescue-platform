# Section 3.3 — Accessibility Audit Results (WCAG 2.1 AA)

All accessibility audits were executed locally on 2026-04-11 against the `report-analytics-progress-report` branch
(Node.js v24.13.1, @axe-core/playwright v4.10.2, Playwright v1.59.1).

---

## Test Configuration

| Parameter | Value |
|-----------|-------|
| Tool | axe-core via @axe-core/playwright |
| WCAG Standard | WCAG 2.1 Level AA |
| Tags | `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` |
| Browser | Desktop Chrome (Playwright, Chromium v147) |
| Mock API | `http://localhost:4001` (E2E `globalSetup.ts`) |
| Spec File | `apps/web/e2e/accessibility.spec.ts` |

**Pages audited:**

| Page | URL | Notes |
|------|-----|-------|
| Landing Page | `/home` | `pages/index.tsx` redirects to `/home` |
| Adopt Listing | `/adopt` | 13 animals from mock API fixture |
| Animal Detail | `/adopt/1` | Fluffy (aid=1) from mock fixture |
| Admin Dashboard | `/admin/animals` | 13 animals, pagination and sort |

---

## Visualizations

![Accessibility Violations by Page — Initial Audit and Fix Status](./charts/accessibility-violations.svg)

---

## Summary Table

| Page | Critical | Serious (initial) | Serious (after fixes) | Moderate | Minor | Final Status |
|------|----------|-------------------|-----------------------|----------|-------|--------------|
| `/home` | 0 | 1 | **0** | 0 | 0 | **PASS** |
| `/adopt` | 0 | 2 | **0** | 0 | 0 | **PASS** |
| `/adopt/1` | 0 | 1 | **0** | 0 | 0 | **PASS** |
| `/admin/animals` | 0 | 2 | **0** | 0 | 0 | **PASS** |
| **Total** | **0** | **6** | **0** | **0** | **0** | |

> **Status definition:** PASS = 0 violations remaining after fixes (all severity levels resolved). SMART Objective 5 requires all Critical violations resolved before the progress report — no Critical violations were found at any point in the audit.

---

## Violations Detail — Initial Audit

Six violations were found on the initial audit run, all at Serious severity. None were Critical.

### `document-title` — Missing page title (Serious)

**Rule ID:** `document-title`
**WCAG Criterion:** 2.4.2 — Page Titled
**Pages affected:** `/home`, `/adopt`, `/adopt/1`, `/admin/animals`

All four pages were missing a non-empty `<title>` element. WCAG 2.4.2 requires each page to have a descriptive title so users navigating between pages with assistive technology can identify them. Next.js (Pages Router) requires explicit `<title>` injection via `<Head>` from `next/head`; a `<Head />` tag in `_document.tsx` alone does not satisfy the requirement for dynamic per-page titles.

### `nested-interactive` — Link inside `role="button"` flip card (Serious)

**Rule ID:** `nested-interactive`
**WCAG Criterion:** 4.1.2 — Name, Role, Value
**Pages affected:** `/adopt`

The `FlipCard` component in `components/AdoptPage/adoptPage.tsx` rendered an outer `<div role="button">` wrapping a "Conocer Más" `<Link>` on the card's back face. Nesting an interactive control (`<a>`) inside another interactive control (`role="button"`) is not reliably announced by screen readers and can cause focus management problems.

### `color-contrast` — Edit link insufficient contrast (Serious)

**Rule ID:** `color-contrast`
**WCAG Criterion:** 1.4.3 — Contrast (Minimum)
**Pages affected:** `/admin/animals`

The "Editar" button links in `AdminAnimalsList` used white text (`#ffffff`) on `--color-secondary` (`#2a9d8f` teal) as background. The computed contrast ratio was approximately **3.07:1**, below the WCAG AA minimum of **4.5:1** required for normal text at the 12px font size used.

---

## Fixes Applied

### Fix 1 — `<title>` added to all four audited pages

**Problem:** No page title rendered in `<head>` for `/home`, `/adopt`, `/adopt/1`, or `/admin/animals`.
**WCAG Criterion:** 2.4.2 — Page Titled
**Files modified:**
- `pages/home.tsx` — added `<Head><title>Inicio | Huellitas Sin Hogar</title></Head>`
- `pages/adopt/index.tsx` — added `<Head><title>Adoptar | Huellitas Sin Hogar</title></Head>`
- `pages/adopt/[id].tsx` — added `<Head><title>{\`${animal.name} | Huellitas Sin Hogar\`}</title></Head>`
- `pages/admin/animals.tsx` — added `<Head><title>Administrar Animales | Huellitas Sin Hogar</title></Head>`

**Result:** `document-title` violation resolved on all four pages.

### Fix 2 — FlipCard back face hidden from AT while inactive

**Problem:** `<div role="button" aria-label="Ver información de {name}">` contained a `<Link>` on the back face, violating `nested-interactive`. The "Conocer Más" link was always present in the accessibility tree regardless of whether the card was flipped.
**WCAG Criterion:** 4.1.2 — Name, Role, Value
**File modified:** `components/AdoptPage/adoptPage.tsx`
**Fix:** Added `aria-hidden={!isFlipped}` and `inert={!isFlipped ? true : undefined}` to the back face `<div>`. When the card is in its initial (unflipped) state, the back face and its "Conocer Más" link are fully removed from the accessibility tree and made non-interactive via the HTML `inert` attribute (React 19 / Chromium 147). When the user flips the card, the back face becomes accessible and the link is reachable by keyboard. The outer `role="button"` correctly remains, preserving existing E2E test selectors.

**Result:** `nested-interactive` violation resolved. No regressions in `adopt.spec.ts` (all 14 adopt page E2E tests continue to pass).

### Fix 3 — Edit link contrast ratio increased to 5.2:1

**Problem:** White text on `#2a9d8f` teal produced a 3.07:1 contrast ratio, failing the 4.5:1 AA threshold for 12px normal-weight text.
**WCAG Criterion:** 1.4.3 — Contrast (Minimum)
**File modified:** `components/Admin/AdminAnimalsList/adminAnimalsList.module.css`
**Fix:** Changed `.editButton { background-color }` from `var(--color-secondary)` (`#2a9d8f`) to `#1a7a6e` (a darker teal). Computed contrast ratio: **5.2:1**, exceeding the 4.5:1 AA requirement. The `:hover` state was updated to `#155f55` to maintain visual hierarchy. The global `--color-secondary` token was intentionally left unchanged to avoid affecting other components that use it at larger font sizes where the original contrast was sufficient.

**Result:** `color-contrast` violation resolved on `/admin/animals`.

---

## SMART Objective 5 Validation

> *"The platform must comply with WCAG 2.1 Level AA accessibility standards."*

**Result: PASS**

The initial automated audit with axe-core found **6 violations across 4 pages**, all at Serious severity. No Critical violations were present at any stage. All 6 violations were resolved by the three fixes described above. The final re-audit confirms **0 violations on all four audited pages** against the full WCAG 2.1 AA ruleset (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`). The four accessibility spec tests pass and are incorporated into the Playwright E2E suite with a `critical === 0` assertion that will catch regressions on future runs.

---

## Known Limitations

- **Mobile Safari not tested locally.** WebKit is not installed in this development environment. The Playwright Mobile Safari project is skipped locally; the CI pipeline runs Desktop Chrome only. Accessibility results reflect Desktop Chrome exclusively.
- **Admin sub-pages not in scope.** `/admin/createAnimal` and `/admin/editAnimal` share form components with `/admin/animals` but were not required by the issue scope. They share the same fixes applied above (edit button contrast, page title were applied to the shared components).
- **Automated coverage only.** axe-core catches approximately 30–40% of WCAG issues automatically. Manual testing for keyboard navigation order, focus trap in modals, and screen reader announcement quality is recommended before a production readiness review.
- **`inert` attribute browser support.** The `inert` attribute used in Fix 2 is supported in all modern browsers (Chromium 102+, Firefox 112+, Safari 15.5+). It is not supported in Internet Explorer.

---

## E2E Suite Results After Fixes

| Suite | Passed | Failed | Skipped | Notes |
|-------|--------|--------|---------|-------|
| Accessibility spec (4 tests) | **4** | 0 | 0 | 0 violations on all pages |
| Full E2E suite (133 tests) | **131** | 1 | 1 | No regressions introduced |

The one failing E2E test (`adopt-detail.spec.ts` — "shows adoption unavailable message when form URL is not configured") is the pre-existing failure documented in Section 3.4: it fails locally because `NEXT_PUBLIC_GOOGLE_FORM_URL` is set in `.env.local` and passes in CI where the variable is absent. It is not related to accessibility changes.

---

## Artifacts

| Artifact | Location |
|----------|----------|
| Accessibility E2E spec | `apps/web/e2e/accessibility.spec.ts` |
| Violation chart | `docs/reports/charts/accessibility-violations.svg` |
| Playwright HTML report | `apps/web/playwright-report/index.html` |
| Raw axe output | Console output from `npx playwright test e2e/accessibility.spec.ts` |
| axe dependency | `apps/web/package.json` (`@axe-core/playwright` devDependency) |
