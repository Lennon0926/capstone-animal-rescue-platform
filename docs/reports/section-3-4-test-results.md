# Section 3.4 — Unit and Integration Test Results

All test suites were executed locally on 2026-05-14 against the `feature/155-AI-pet-match` branch
(Node.js v24, Jest). The server suite expanded to 20 files with the addition of the AI pet-match
service tests (`petMatchService.test.js`) and new route/validation coverage for
`POST /api/animals/ai-match` and `validateAiMatchBody`. The web suite expanded to 34 files,
adding tests for the three AI Pet Match components (`aiPetMatch.test.tsx`,
`heroMatchCard.test.tsx`, `matchResultCard.test.tsx`).

---

## Visualizations

![Test Suite Summary](./charts/test-suite-summary.svg)

![Server Jest — Tests per File](./charts/test-server-breakdown.svg)

---

## Summary Table

| Suite | Tool | Spec Files | Total Tests | Passed | Failed | Skipped | Pass Rate |
|-------|------|-----------|-------------|--------|--------|---------|-----------|
| Server unit/integration | Jest | 20 | 271 | 271 | 0 | 0 | **100%** |
| Web unit | Jest | 34 | 252 | 252 | 0 | 0 | **100%** |
| **Total** | | **54** | **523** | **523** | **0** | **0** | **100%** |

---

## Server Jest Results (`apps/server`)

**Run command:** `npx jest --no-coverage --passWithNoTests`
**Result:** 20 suites, 271 tests — all passed.

| Test File | Tests | Passed | Failed | Status |
|-----------|-------|--------|--------|--------|
| `animals.routes.test.js` | 61 | 61 | 0 | Pass |
| `validation.test.js` | 44 | 44 | 0 | Pass |
| `posts.routes.test.js` | 24 | 24 | 0 | Pass |
| `uploads.routes.test.js` | 17 | 17 | 0 | Pass |
| `errorHandler.test.js` | 11 | 11 | 0 | Pass |
| `users.routes.test.js` | 14 | 14 | 0 | Pass |
| `petMatchService.test.js` | 20 | 20 | 0 | Pass |
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
| **Total** | **271** | **271** | **0** | **Pass** |

---

## Web Jest Results (`apps/web`)

**Run command:** `npx jest --no-coverage --passWithNoTests`
**Result:** 34 suites, 252 tests — all passed.

| Test File | Tests | Passed | Failed | Status |
|-----------|-------|--------|--------|--------|
| `adminAnimalsList.test.tsx` | 20 | 20 | 0 | Pass |
| `adminPostsList.test.tsx` | 17 | 17 | 0 | Pass |
| `postService.test.ts` | 15 | 15 | 0 | Pass |
| `apiRoutes.test.ts` | 13 | 13 | 0 | Pass |
| `animalImageUploadService.test.ts` | 12 | 12 | 0 | Pass |
| `editPostForm.test.tsx` | 11 | 11 | 0 | Pass |
| `aiPetMatch.test.tsx` | 18 | 18 | 0 | Pass |
| `heroMatchCard.test.tsx` | 14 | 14 | 0 | Pass |
| `adminImageFlows.test.tsx` | 9 | 9 | 0 | Pass |
| `settingsService.test.ts` | 9 | 9 | 0 | Pass |
| `adminHome.test.tsx` | 7 | 7 | 0 | Pass |
| `apiExportAnimals.test.ts` | 7 | 7 | 0 | Pass |
| `donationModal.test.tsx` | 7 | 7 | 0 | Pass |
| `adminPages.test.tsx` | 7 | 7 | 0 | Pass |
| `createPostForm.test.tsx` | 8 | 8 | 0 | Pass |
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
| `matchResultCard.test.tsx` | 9 | 9 | 0 | Pass |
| `adminAnimalFormValues.test.ts` | 3 | 3 | 0 | Pass |
| `resetPasswordPage.test.tsx` | 3 | 3 | 0 | Pass |
| `publicNavigation.test.ts` | 2 | 2 | 0 | Pass |
| `storiesSection.test.tsx` | 2 | 2 | 0 | Pass |
| `volunteerFormPlacement.test.tsx` | 2 | 2 | 0 | Pass |
| `accessDeniedScreen.test.tsx` | 1 | 1 | 0 | Pass |
| **Total** | **252** | **252** | **0** | **Pass** |

---

## Analysis

Both suites achieve a **100% pass rate** across 523 tests and 54 spec files — the highest test count in the project's history. This sprint added full coverage for the AI Pet Match feature: the server gained `petMatchService.test.js` (semantic ranking, embedding helpers, attribute extraction), extended `animals.routes.test.js` with 9 new tests for `POST /api/animals/ai-match` (validation errors, successful ranking, alternatives, DB failure), and extended `validation.test.js` with 13 tests for `validateAiMatchBody`. The web gained three new files covering `AIPetMatch` (form states, loading, results, empty state, error handling), `HeroMatchCard` (score gauge, conditional compatibility bars, CTAs), and `MatchResultCard` (score badge, attribute chips, profile link). No tests are skipped or pending.
