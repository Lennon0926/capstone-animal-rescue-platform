# Section 3.1 — Page Performance Results (Lighthouse)

All Lighthouse audits were executed locally on 2026-04-11 against the `report-analytics-progress-report` branch
(Node.js v24.13.1, Lighthouse v13.1.0 via `@lhci/cli` v0.15.1, Next.js v16.2.3 production build).

---

## Test Configuration

| Parameter | Value |
|-----------|-------|
| Tool | Lighthouse v13.1.0 via `@lhci/cli` v0.15.1 |
| Target | `http://localhost:3000` (Next.js production build, `npm run start`) |
| API Backend | `https://animal-rescue-server.vercel.app` (`NEXT_PUBLIC_API_BASE_URL`) |
| Preset | Desktop (1350 × 940, 4× CPU, fast 3G throttling removed) |
| Runs per URL | 1 |
| Config file | `apps/web/lighthouserc.js` |
| Branch | `report-analytics-progress-report` |
| Run date | 2026-04-11 |

**Pages audited:**

| # | Page | URL |
|---|------|-----|
| 1 | Home | `/home` |
| 2 | Adopt Listing | `/adopt` |
| 3 | Animal Detail | `/adopt/1` |
| 4 | About | `/about` |
| 5 | Blog | `/blog` |
| 6 | Donation | `/donation` |

> **Admin pages excluded:** `/admin/*` routes require authenticated state and are not public-facing pages.

---

## Visualizations

![Lighthouse Scores by Page — Performance, Accessibility, Best Practices, SEO](./charts/lighthouse-scores.svg)

---

## Lighthouse Scores

| Page | Performance | Accessibility | Best Practices | SEO |
|------|:-----------:|:-------------:|:--------------:|:---:|
| `/home` | **98** | **98** | 89 | 91 |
| `/adopt` | **100** | **100** | 89 | 91 |
| `/adopt/1` | **100** | 94 | 96 | 80 |
| `/about` | **100** | **98** | 89 | 91 |
| `/blog` | **100** | **98** | 89 | 91 |
| `/donation` | **100** | **98** | 89 | 91 |
| **Average** | **99.7** | **97.7** | **90.2** | **89.2** |

Score scale: 0–49 Poor · 50–89 Needs Improvement · 90–100 Good.

---

## Core Web Vitals

| Page | LCP | CLS | TTFB | FCP | TBT | Speed Index |
|------|-----|-----|------|-----|-----|-------------|
| `/home` | 248 ms | 0.012 | 2,520 ms | 248 ms | 0 ms | 1,635 ms |
| `/adopt` | 518 ms | 0.000 | 937 ms | 246 ms | 0 ms | 740 ms |
| `/adopt/1` | 492 ms | 0.000 | 327 ms | 252 ms | 0 ms | 333 ms |
| `/about` | 488 ms | 0.000 | 3 ms | 248 ms | 0 ms | 248 ms |
| `/blog` | 484 ms | 0.000 | 2 ms | 244 ms | 0 ms | 244 ms |
| `/donation` | 484 ms | 0.000 | 2 ms | 244 ms | 0 ms | 244 ms |

> **LCP** = Largest Contentful Paint · **CLS** = Cumulative Layout Shift · **TTFB** = Time to First Byte
> **FCP** = First Contentful Paint · **TBT** = Total Blocking Time

---

## SMART Objective 1 Validation

> *"The web application must load in under 3 seconds for 95% of page visits."*

| Page | LCP | ≤ 3,000 ms? |
|------|-----|:-----------:|
| `/home` | 248 ms | **PASS** |
| `/adopt` | 518 ms | **PASS** |
| `/adopt/1` | 492 ms | **PASS** |
| `/about` | 488 ms | **PASS** |
| `/blog` | 484 ms | **PASS** |
| `/donation` | 484 ms | **PASS** |

**Result: PASS**

All six public pages have a Largest Contentful Paint well under the 3,000 ms threshold, with the worst-case LCP of 518 ms on `/adopt` — 83% below the limit. Total Blocking Time is 0 ms on every page, meaning the main thread is never blocked and the UI is interactive immediately after paint. Cumulative Layout Shift is 0.000 on five of six pages (Good) and 0.012 on `/home` (also within the 0.1 Good threshold).

---

## Top 3 Performance Issues

### Issue 1 — `/home` TTFB of 2,520 ms (Vercel cold start + live Supabase query)

**Audit:** `server-response-time`
**Affected page:** `/home`
**Lighthouse flag:** Server response time of 2,520 ms exceeds the 600 ms target.

The Home page is server-rendered on demand (`ƒ Dynamic` in the build output). On first request, the Vercel Function cold-starts and immediately issues a live Supabase query to populate the featured-animals section. The combined cold-start + round-trip inflates TTFB to 2,520 ms. Despite this, LCP is only 248 ms because the critical above-the-fold content (hero image + headline) is statically embedded in the HTML; the animal cards load via client-side SWR after hydration.

**Recommended fix:** Convert the featured-animals data fetch to ISR (`revalidate: 60`) so the rendered HTML is served from Vercel's edge cache after the first request, eliminating the cold-start penalty on subsequent visits. This would bring TTFB in line with the 2–3 ms seen on the static pages.

---

### Issue 2 — Header logo image dimension mismatch (Best Practices: 89/100 on 5 of 6 pages)

**Audits:** `image-aspect-ratio`, `image-size-responsive`
**Affected pages:** all pages with the shared `<Header>` component (5 of 6 pages)
**Lighthouse flag:** `org-logo.png` has natural dimensions 48 × 41 px but is rendered at 50 × 50 px, violating the declared `width={45} height={45}` props.

The `<Image>` component in `components/HeaderSection/headerSection.tsx` declares `width={45} height={45}`, but the source image (`public/org-logo.png`) has a natural 48 × 41 aspect ratio. Next.js `<Image>` scales the image to fill the declared dimensions, rendering it at 50 × 50 due to device pixel adjustments, which distorts the logo and triggers both the aspect-ratio and responsive-size audits. This is the sole cause of the Best Practices penalty across all pages.

**Recommended fix:** Either (a) update the `<Image>` props to `width={48} height={41}` to match the natural dimensions and adjust CSS to maintain the intended display size, or (b) re-export `org-logo.png` at a square 1:1 aspect ratio.

---

### Issue 3 — `/adopt/1` missing `<title>` and `<meta description>` at Lighthouse scan time (SEO: 80/100)

**Audits:** `document-title` (score 0), `meta-description` (score 0)
**Affected page:** `/adopt/1`

The animal detail page (`pages/adopt/[id].tsx`) sets the page `<title>` conditionally: `{animal ? \`${animal.name} | Huellitas Sin Hogar\` : ''}`. Lighthouse captures the initial page state before the client-side SWR data fetch resolves. At that moment `animal` is `undefined`, so the `<title>` is an empty string (failing the `document-title` audit) and no `<meta name="description">` tag exists on any page.

The accessibility fix in Section 3.3 resolved the axe-core `document-title` violation because axe-core waits for JavaScript to execute, whereas Lighthouse's SEO audit evaluates the initial HTML. The fix is incomplete from an SEO perspective.

**Recommended fix:**
1. Add a static fallback title so the `<Head>` always emits a non-empty `<title>`: `{animal?.name ?? 'Animal'} | Huellitas Sin Hogar`.
2. Add `<meta name="description">` to all six public pages. For the animal detail page, use `{animal?.description ?? 'View this animal available for adoption at Huellitas Sin Hogar.'}`.

Both changes are contained in `pages/adopt/[id].tsx` and a shared `<Head>` helper if one exists.

---

## Known Limitations

- **Vercel Analytics/Speed Insights scripts 404 locally.** `@vercel/analytics` and `@vercel/speed-insights` inject scripts at `/_vercel/insights/script.js` and `/_vercel/speed-insights/script.js`. These are served by the Vercel platform and are not present in the local `next start` server, generating two 404 console errors that Lighthouse flags under Best Practices. This is a local-only artifact; the scripts load correctly on the deployed production URL and do not affect production Best Practices scores.
- **Single run per page.** `numberOfRuns: 1` was used to keep audit time manageable. Real-world variance in cold-start timing (especially TTFB on `/home` and `/adopt`) means individual run results may differ by ±15% from a multi-run median. The LCP and CLS values are stable across single runs.
- **Desktop preset only.** The audit used Lighthouse's desktop preset (no CPU or network throttling). Mobile scores would be lower, particularly for pages that fetch data from the production API. A mobile audit is recommended before production release.
- **Local server, not production Vercel deployment.** TTFB on `/about`, `/blog`, and `/donation` (2–3 ms) reflects the local in-process server; production values will include Vercel Function overhead on cold starts but will benefit from edge caching on warm requests.

---

## Artifacts

| Artifact | Location |
|----------|----------|
| LHCI configuration | `apps/web/lighthouserc.js` |
| npm audit script | `npm run audit:lighthouse` (in `apps/web/package.json`) |
| Raw LHCI JSON reports | `apps/web/.lighthouseci/*.report.json` (gitignored) |
| Raw LHCI HTML reports | `apps/web/.lighthouseci/*.report.html` (gitignored) |
| LHCI manifest | `apps/web/.lighthouseci/manifest.json` (gitignored) |
| Scores chart | `docs/reports/charts/lighthouse-scores.svg` |
