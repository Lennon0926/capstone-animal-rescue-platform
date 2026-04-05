# Section 4.3 — API Documentation Summary

The Express backend exposes a RESTful API at port 4000. All endpoints return JSON and currently require no authentication. Input validation and sanitization are handled by dedicated middleware, and errors follow a consistent `{ error: { code, message } }` schema.

The table below summarizes every implemented endpoint:

| # | Method | Endpoint | Purpose | Status Codes |
|---|--------|----------|---------|--------------|
| 1 | GET | `/` | API info and available routes | 200 |
| 2 | GET | `/api/health` | Health check with database connectivity | 200, 503 |
| 3 | GET | `/health` | Liveness probe (uptime, no dependency check) | 200 |
| 4 | GET | `/ready` | Readiness probe (env-var validation) | 200, 503 |
| 5 | GET | `/api/animals` | List animals with filtering, sorting, and pagination | 200, 500 |
| 6 | GET | `/api/animals/filters` | Distinct filter values (species, status, size, gender) | 200, 500 |
| 7 | GET | `/api/animals/:aid` | Retrieve a single animal by ID | 200, 400, 404, 500 |
| 8 | POST | `/api/animals` | Create a new animal record | 201, 400, 500 |
| 9 | PATCH | `/api/animals/:aid` | Partially update an animal | 200, 400, 404, 500 |
| 10 | DELETE | `/api/animals/:aid` | Delete an animal | 200, 404, 500 |
| 11 | GET | `/api/uploads/config` | R2 storage configuration and health | 200 |
| 12 | POST | `/api/uploads/animals/:animalId/image` | Upload an animal image to Cloudflare R2 | 201, 400, 413, 415, 500, 503 |

**Key implementation details:**

- **Pagination** uses `limit` (1–100, default 50) and `offset` (default 0) with a `hasMore` flag in the response.
- **Filtering** supports species, status, size, gender, name, tags, and a combined `search` parameter.
- **Image uploads** accept `multipart/form-data` with JPEG, PNG, or WebP files up to 5 MB, stored in Cloudflare R2.
- **Health probes** are split into three tiers: `/` (info), `/health` (liveness), and `/ready` (readiness), suitable for container orchestrators.

For full request/response examples and field-level documentation, see [`docs/api/endpoints.md`](./endpoints.md).
