# Section 3.4 — Unit and Integration Test Results

All test suites were executed locally on 2026-05-14 against the `feature/test-coverage` branch
(Node.js v24, Jest). The server suite expanded to 19 files following the addition of new routes
(uploads, settings, users, posts) and middleware (auth, CORS, rate limiting, requireJson,
validateEnv). The web suite expanded to 31 files covering all UI components, API route handlers,
services, hooks, and utilities.

---

## Visualizations

![Test Suite Summary](./charts/test-suite-summary.svg)

![Server Jest — Tests per File](./charts/test-server-breakdown.svg)

---

## Summary Table

| Suite | Tool | Spec Files | Total Tests | Passed | Failed | Skipped | Pass Rate |
|-------|------|-----------|-------------|--------|--------|---------|-----------|
| Server unit/integration | Jest | 19 | 228 | 228 | 0 | 0 | **100%** |
| Web unit | Jest | 31 | 211 | 211 | 0 | 0 | **100%** |
| **Total** | | **50** | **439** | **439** | **0** | **0** | **100%** |

---

## Server Jest Results (`apps/server`)

**Run command:** `npx jest --no-coverage --passWithNoTests`
**Result:** 19 suites, 228 tests — all passed.

| Test File | Tests | Passed | Failed | Status |
|-----------|-------|--------|--------|--------|
| `animals.routes.test.js` | 52 | 52 | 0 | Pass |
| `validation.test.js` | 30 | 30 | 0 | Pass |
| `posts.routes.test.js` | 24 | 24 | 0 | Pass |
| `uploads.routes.test.js` | 17 | 17 | 0 | Pass |
| `users.routes.test.js` | 14 | 14 | 0 | Pass |
| `errorHandler.test.js` | 11 | 11 | 0 | Pass |
| `auth.middleware.test.js` | 9 | 9 | 0 | Pass |
| `settings.routes.test.js` | 8 | 8 | 0 | Pass |
| `routes.test.js` | 8 | 8 | 0 | Pass |
| `smoke.test.js` | 8 | 8 | 0 | Pass |
| `settingsRepository.test.js` | 7 | 7 | 0 | Pass |
| `requireJson.test.js` | 7 | 7 | 0 | Pass |
| `usersRepository.test.js` | 6 | 6 | 0 | Pass |
| `validateEnv.test.js` | 6 | 6 | 0 | Pass |
| `cors.test.js` | 5 | 5 | 0 | Pass |
| `animalsRepository.test.js` | 5 | 5 | 0 | Pass |
| `migrateImageUrls.test.js` | 4 | 4 | 0 | Pass |
| `r2Service.test.js` | 4 | 4 | 0 | Pass |
| `rateLimiting.test.js` | 3 | 3 | 0 | Pass |
| **Total** | **228** | **228** | **0** | **Pass** |

---

## Web Jest Results (`apps/web`)

**Run command:** `npx jest --no-coverage --passWithNoTests`
**Result:** 31 suites, 211 tests — all passed.

| Test File | Tests | Passed | Failed | Status |
|-----------|-------|--------|--------|--------|
| `postService.test.ts` | 15 | 15 | 0 | Pass |
| `animalImageUploadService.test.ts` | 12 | 12 | 0 | Pass |
| `editPostForm.test.tsx` | 11 | 11 | 0 | Pass |
| `apiRoutes.test.ts` | 13 | 13 | 0 | Pass |
| `adminAnimalsList.test.tsx` | 20 | 20 | 0 | Pass |
| `adminPostsList.test.tsx` | 17 | 17 | 0 | Pass |
| `settingsService.test.ts` | 9 | 9 | 0 | Pass |
| `createPostForm.test.tsx` | 8 | 8 | 0 | Pass |
| `adminImageFlows.test.tsx` | 9 | 9 | 0 | Pass |
| `adminHome.test.tsx` | 7 | 7 | 0 | Pass |
| `apiExportAnimals.test.ts` | 7 | 7 | 0 | Pass |
| `donationModal.test.tsx` | 7 | 7 | 0 | Pass |
| `adminPages.test.tsx` | 7 | 7 | 0 | Pass |
| `useAdoptionFormUrlExtra.test.ts` | 6 | 6 | 0 | Pass |
| `imageCompressor.test.ts` | 6 | 6 | 0 | Pass |
| `login.test.tsx` | 5 | 5 | 0 | Pass |
| `useAuthRequired.test.tsx` | 5 | 5 | 0 | Pass |
| `medicalRecords.test.ts` | 5 | 5 | 0 | Pass |
| `apiAuthExtra.test.ts` | 5 | 5 | 0 | Pass |
| `adminHeader.test.tsx` | 4 | 4 | 0 | Pass |
| `animalImages.test.ts` | 4 | 4 | 0 | Pass |
| `animalImageRendering.test.tsx` | 4 | 4 | 0 | Pass |
| `createUserForm.test.tsx` | 4 | 4 | 0 | Pass |
| `volunteerIntakeSection.test.tsx` | 4 | 4 | 0 | Pass |
| `usersManagement.test.tsx` | 4 | 4 | 0 | Pass |
| `adminAnimalFormValues.test.ts` | 3 | 3 | 0 | Pass |
| `resetPasswordPage.test.tsx` | 3 | 3 | 0 | Pass |
| `publicNavigation.test.ts` | 2 | 2 | 0 | Pass |
| `storiesSection.test.tsx` | 2 | 2 | 0 | Pass |
| `volunteerFormPlacement.test.tsx` | 2 | 2 | 0 | Pass |
| `accessDeniedScreen.test.tsx` | 1 | 1 | 0 | Pass |
| **Total** | **211** | **211** | **0** | **Pass** |

---

## Analysis

Both suites achieve a **100% pass rate** across 439 tests and 50 spec files — the highest test count in the project's history. The server suite grew from 12 to 19 files with the addition of authentication middleware, user management routes, settings repository, and upload routes. The web suite grew from 9 to 31 files, now covering all admin UI components, post management flows, image handling, hooks, and API route handlers. No tests are skipped or pending.
