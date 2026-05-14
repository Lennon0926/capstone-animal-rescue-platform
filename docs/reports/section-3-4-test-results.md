# Section 3.4 — Unit and Integration Test Results

All test suites were executed locally on 2026-05-14 as part of the audit workflow (Node.js + Jest).

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
| `__tests__/animals.routes.test.js` | 52 | 52 | 0 | Pass |
| `__tests__/validation.test.js` | 30 | 30 | 0 | Pass |
| `__tests__/posts.routes.test.js` | 24 | 24 | 0 | Pass |
| `__tests__/uploads.routes.test.js` | 17 | 17 | 0 | Pass |
| `__tests__/users.routes.test.js` | 14 | 14 | 0 | Pass |
| `__tests__/errorHandler.test.js` | 11 | 11 | 0 | Pass |
| `__tests__/auth.middleware.test.js` | 9 | 9 | 0 | Pass |
| `__tests__/settings.routes.test.js` | 8 | 8 | 0 | Pass |
| `__tests__/routes.test.js` | 8 | 8 | 0 | Pass |
| `__tests__/smoke.test.js` | 8 | 8 | 0 | Pass |
| `__tests__/requireJson.test.js` | 7 | 7 | 0 | Pass |
| `__tests__/settingsRepository.test.js` | 7 | 7 | 0 | Pass |
| `__tests__/usersRepository.test.js` | 6 | 6 | 0 | Pass |
| `__tests__/validateEnv.test.js` | 6 | 6 | 0 | Pass |
| `__tests__/animalsRepository.test.js` | 5 | 5 | 0 | Pass |
| `__tests__/cors.test.js` | 5 | 5 | 0 | Pass |
| `__tests__/migrateImageUrls.test.js` | 4 | 4 | 0 | Pass |
| `__tests__/r2Service.test.js` | 4 | 4 | 0 | Pass |
| `__tests__/rateLimiting.test.js` | 3 | 3 | 0 | Pass |
| **Total** | **228** | **228** | **0** | **Pass** |

---

## Web Jest Results (`apps/web`)

**Run command:** `npx jest --no-coverage --passWithNoTests`
**Result:** 31 suites, 211 tests — all passed.

| Test File | Tests | Passed | Failed | Status |
|-----------|-------|--------|--------|--------|
| `__tests__/adminAnimalsList.test.tsx` | 20 | 20 | 0 | Pass |
| `__tests__/adminPostsList.test.tsx` | 17 | 17 | 0 | Pass |
| `__tests__/postService.test.ts` | 15 | 15 | 0 | Pass |
| `__tests__/apiRoutes.test.ts` | 13 | 13 | 0 | Pass |
| `__tests__/animalImageUploadService.test.ts` | 12 | 12 | 0 | Pass |
| `__tests__/editPostForm.test.tsx` | 11 | 11 | 0 | Pass |
| `__tests__/adminImageFlows.test.tsx` | 9 | 9 | 0 | Pass |
| `__tests__/settingsService.test.ts` | 9 | 9 | 0 | Pass |
| `__tests__/createPostForm.test.tsx` | 8 | 8 | 0 | Pass |
| `__tests__/adminHome.test.tsx` | 7 | 7 | 0 | Pass |
| `__tests__/adminPages.test.tsx` | 7 | 7 | 0 | Pass |
| `__tests__/apiExportAnimals.test.ts` | 7 | 7 | 0 | Pass |
| `__tests__/donationModal.test.tsx` | 7 | 7 | 0 | Pass |
| `__tests__/imageCompressor.test.ts` | 6 | 6 | 0 | Pass |
| `__tests__/useAdoptionFormUrlExtra.test.ts` | 6 | 6 | 0 | Pass |
| `__tests__/apiAuthExtra.test.ts` | 5 | 5 | 0 | Pass |
| `__tests__/login.test.tsx` | 5 | 5 | 0 | Pass |
| `__tests__/medicalRecords.test.ts` | 5 | 5 | 0 | Pass |
| `__tests__/useAuthRequired.test.tsx` | 5 | 5 | 0 | Pass |
| `__tests__/adminHeader.test.tsx` | 4 | 4 | 0 | Pass |
| `__tests__/animalImageRendering.test.tsx` | 4 | 4 | 0 | Pass |
| `__tests__/animalImages.test.ts` | 4 | 4 | 0 | Pass |
| `__tests__/createUserForm.test.tsx` | 4 | 4 | 0 | Pass |
| `__tests__/usersManagement.test.tsx` | 4 | 4 | 0 | Pass |
| `__tests__/volunteerIntakeSection.test.tsx` | 4 | 4 | 0 | Pass |
| `__tests__/adminAnimalFormValues.test.ts` | 3 | 3 | 0 | Pass |
| `__tests__/resetPasswordPage.test.tsx` | 3 | 3 | 0 | Pass |
| `__tests__/publicNavigation.test.ts` | 2 | 2 | 0 | Pass |
| `__tests__/storiesSection.test.tsx` | 2 | 2 | 0 | Pass |
| `__tests__/volunteerFormPlacement.test.tsx` | 2 | 2 | 0 | Pass |
| `__tests__/accessDeniedScreen.test.tsx` | 1 | 1 | 0 | Pass |
| **Total** | **211** | **211** | **0** | **Pass** |

---

## Analysis

Both suites achieved a 100% pass rate in this run, with 439 total passing tests and zero failures. This confirms stable backend and frontend unit/integration behavior at the time of the audit.
