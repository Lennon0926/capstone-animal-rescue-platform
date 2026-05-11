# Section 4.3 — API Documentation Summary

The Express backend exposes a RESTful API at port 4000. All endpoints return JSON. Write endpoints and sensitive read endpoints require a Supabase-issued JWT Bearer token via the `requireAuth` middleware. Input validation, Content-Type enforcement, rate limiting, and CORS are all handled by dedicated middleware. Most routes use the shared error handler and return `success: false` with a numeric HTTP status in `error.code`, while upload endpoints use route-specific string error codes such as `INVALID_IMAGE_TYPE` and `R2_UNAUTHORIZED`. Rate-limit violations return `error.code: "TOO_MANY_REQUESTS"` with HTTP 429.

The table below summarizes every implemented endpoint:

| # | Method | Endpoint | Auth | Purpose | Status Codes |
|---|--------|----------|------|---------|--------------|
| 1 | GET | `/` | Public | API info and available routes | 200 |
| 2 | GET | `/api/health` | Public | Health check with database connectivity | 200, 503 |
| 3 | GET | `/health` | Public | Liveness probe (uptime, no dependency check) | 200 |
| 4 | GET | `/ready` | Public | Readiness probe (env-var validation) | 200, 503 |
| 5 | GET | `/api/animals` | Public | List animals with filtering, sorting, and pagination | 200, 500 |
| 6 | GET | `/api/animals/filters` | Public | Distinct filter values (species, status, size, gender) | 200, 500 |
| 7 | GET | `/api/animals/:aid` | Public | Retrieve a single animal by ID | 200, 400, 404, 500 |
| 8 | GET | `/api/animals/records` | Required | Admin view: all animals with full medical record data | 200, 401, 500 |
| 9 | POST | `/api/animals` | Required | Create a new animal record | 201, 400, 401, 415, 500 |
| 10 | PATCH | `/api/animals/:aid` | Required | Partially update an animal | 200, 400, 401, 404, 415, 500 |
| 11 | DELETE | `/api/animals/:aid` | Required | Delete an animal | 200, 401, 404, 500 |
| 12 | GET | `/api/posts` | Public | List blog posts with pagination | 200, 500 |
| 13 | GET | `/api/posts/:pid` | Public | Retrieve a single blog post by ID | 200, 400, 404, 500 |
| 14 | POST | `/api/posts` | Required | Create a new blog post | 201, 400, 401, 415, 500 |
| 15 | PATCH | `/api/posts/:pid` | Required | Partially update a blog post | 200, 400, 401, 404, 415, 500 |
| 16 | DELETE | `/api/posts/:pid` | Required | Delete a blog post | 200, 401, 404, 500 |
| 17 | GET | `/api/settings/pinned-fb-post` | Public | Get the currently pinned Facebook post ID | 200 |
| 18 | PUT | `/api/settings/pinned-fb-post` | Required | Set or clear the pinned Facebook post ID | 200, 401 |
| 19 | GET | `/api/uploads/config` | Public | R2 storage configuration and health | 200 |
| 20 | POST | `/api/uploads/animals/:animalId/image` | Public ³ | Upload an animal image to Cloudflare R2 | 201, 400, 413, 415, 500, 503 |

> ³ The image upload endpoint is rate-limited independently (10 requests per IP per window) and validates the R2 configuration before accepting any payload.

**Key implementation details:**

- **Authentication** is enforced via `requireAuth` middleware on all write endpoints and on `/api/animals/records`. It validates a Supabase JWT from the `Authorization: Bearer <token>` header and returns 401 on missing or invalid tokens.
- **Rate limiting** is applied globally (100 req / window) and separately on the upload endpoint (10 req / window). Exceeded limits return HTTP 429 with `error.code: "TOO_MANY_REQUESTS"`.
- **CORS** is restricted to an explicit allowlist configured via the `ALLOWED_ORIGINS` environment variable. Unknown origins receive no `Access-Control-Allow-Origin` header.
- **Content-Type enforcement** — POST, PATCH, and PUT endpoints reject non-JSON bodies with HTTP 415 via `requireJson` middleware. The upload endpoint is exempt (it accepts `multipart/form-data`).
- **Pagination** uses `limit` (1–100, default 50) and `offset` (default 0) with a `hasMore` flag in the response.
- **Filtering** supports species, status, size, gender, name, tags, and a combined `search` parameter. The `/api/animals/filters` endpoint is backed by a single `get_animal_filter_options` database RPC and caches results for 30 seconds.
- **Image uploads** accept `multipart/form-data` with JPEG, PNG, or WebP files up to 5 MB, stored in Cloudflare R2.
- **Health probes** are split into three tiers: `/` (info), `/health` (liveness), and `/ready` (readiness), suitable for container orchestrators.

For full request/response examples and field-level documentation, see [`docs/api/endpoints.md`](./endpoints.md).

---

**Security Hardening — Status (updated 2026-05-09)**

| Item | Prior Status | Current Status |
|------|-------------|----------------|
| Authentication on write endpoints | ❌ Not implemented | ✅ `requireAuth` middleware (Supabase JWT) |
| Rate limiting | ❌ None | ✅ Global + per-upload limiter; 429 with error envelope |
| CORS restriction | ❌ All origins allowed | ✅ `ALLOWED_ORIGINS` allowlist enforced |
| Content-Type enforcement | ❌ Silent drop | ✅ `requireJson` returns 415 on non-JSON bodies |
| API versioning | ❌ No `/api/v1/` prefix | ❌ Still outstanding ([#133](https://github.com/Lennon0926/capstone-animal-rescue-platform/issues/133)) |
