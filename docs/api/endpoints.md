# API Endpoint Documentation

**Base URL:** `http://localhost:4000` (development)
**Content-Type:** `application/json` (unless noted otherwise)
**Authentication:** All endpoints are currently public (no auth required)

Most API routes use the shared Express error handler and return:

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Human-readable error message"
  }
}
```

Upload endpoints return route-specific string error codes instead.

---

## Known Limitations

The following gaps were identified during a REST best-practices audit and are tracked as open issues:

| # | Gap | Affected Endpoints | Issue |
|---|-----|--------------------|-------|
| 1 | **No authentication** — all write endpoints are publicly accessible | `POST`, `PATCH`, `DELETE /api/animals`, `POST /api/uploads/...` | tracked separately |
| 2 | **No rate limiting** — no request throttling per IP | all endpoints | [#132](https://github.com/Lennon0926/capstone-animal-rescue-platform/issues/132) |
| 3 | **No API versioning** — routes use `/api/` instead of `/api/v1/` | all endpoints | [#133](https://github.com/Lennon0926/capstone-animal-rescue-platform/issues/133) |
| 4 | **CORS allows all origins** — not restricted to known client origins | all endpoints | [#134](https://github.com/Lennon0926/capstone-animal-rescue-platform/issues/134) |
| 5 | **No Content-Type enforcement** — non-JSON bodies on write endpoints are silently dropped instead of returning `415` | `POST /api/animals`, `PATCH /api/animals/:aid` | [#135](https://github.com/Lennon0926/capstone-animal-rescue-platform/issues/135) |

---

## Table of Contents

- [Health & System](#health--system)
- [Animals](#animals)
- [Uploads](#uploads)

---

## Health & System

### GET `/`

Returns API info and available endpoints.

**Request Example**

```bash
curl http://localhost:4000/
```

**Response `200`**

```json
{
  "success": true,
  "message": "Capstone Animal Rescue Platform API",
  "version": "1.0.0",
  "endpoints": {
    "animals": "/api/animals",
    "health": "/api/health"
  }
}
```

---

### GET `/api/health`

Returns API health status including database connectivity.

**Request Example**

```bash
curl http://localhost:4000/api/health
```

**Response `200`** (healthy)

```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-04-05T12:00:00.000Z",
  "database": {
    "connected": true,
    "error": null
  }
}
```

**Response `503`** (degraded)

```json
{
  "success": false,
  "status": "degraded",
  "timestamp": "2026-04-05T12:00:00.000Z",
  "database": {
    "connected": false,
    "error": "connection refused"
  }
}
```

---

### GET `/health`

Simple liveness probe. Returns uptime without checking dependencies.

**Request Example**

```bash
curl http://localhost:4000/health
```

**Response `200`**

```json
{
  "status": "ok",
  "uptime": 3612.45,
  "startedAt": "2026-04-05T11:00:00.000Z"
}
```

---

### GET `/ready`

Readiness probe. Returns `503` if required environment variables are missing.

**Request Example**

```bash
curl http://localhost:4000/ready
```

**Response `200`** (ready)

```json
{
  "status": "ready"
}
```

**Response `503`** (not ready)

```json
{
  "status": "not ready",
  "reason": "missing env"
}
```

---

## Animals

### GET `/api/animals`

Retrieves animals with optional filtering, sorting, and pagination.

**Query Parameters**

| Parameter   | Type    | Default      | Description |
|-------------|---------|--------------|-------------|
| `species`   | string  | —            | Filter by species (partial match). Valid: `perro`, `gato` |
| `status`    | string  | —            | Filter by status. Valid: `disponible`, `adoptado`, `pendiente`, `en hogar temporal`, `atención médica` |
| `size`      | string  | —            | Filter by size. Valid: `pequeño`, `mediano`, `grande`, `muy grande` |
| `gender`    | string  | —            | Filter by gender. Valid: `macho`, `hembra`, `desconocido` |
| `name`      | string  | —            | Search by name (partial match) |
| `tags`      | string  | —            | Filter by tag (exact match within tags array) |
| `search`    | string  | —            | Combined search across name and tags (partial match) |
| `sortBy`    | string  | `created_at` | Sort field. Valid: `aid`, `name`, `species`, `status`, `created_at` |
| `sortOrder` | string  | `desc`       | Sort direction: `asc` or `desc` |
| `limit`     | integer | `50`         | Records per page (1–100) |
| `offset`    | integer | `0`          | Records to skip |

**Request Example**

```
GET /api/animals?species=perro&status=disponible&sortBy=name&sortOrder=asc&limit=10&offset=0
```

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "aid": 1,
      "name": "Luna",
      "species": "perro",
      "size": "mediano",
      "gender": "hembra",
      "status": "disponible",
      "description": "Friendly and energetic dog",
      "image_url": "https://cdn.example.com/animals/1/luna.jpg",
      "tags": ["friendly", "energetic"],
      "created_at": "2026-02-20T14:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

**Error `500`**

```json
{
  "success": false,
  "error": {
    "code": 500,
    "message": "Failed to fetch animals"
  }
}
```

---

### GET `/api/animals/filters`

Returns the distinct values currently in the database for each filterable field.

**Request Example**

```
GET /api/animals/filters
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "species": ["perro", "gato"],
    "status": ["disponible", "adoptado", "pendiente"],
    "size": ["pequeño", "mediano", "grande"],
    "gender": ["macho", "hembra"]
  }
}
```

**Error `500`**

```json
{
  "success": false,
  "error": {
    "code": 500,
    "message": "Failed to fetch filter options"
  }
}
```

---

### GET `/api/animals/:aid`

Retrieves a single animal by ID.

**Path Parameters**

| Parameter | Type    | Description |
|-----------|---------|-------------|
| `aid`     | integer | Positive integer animal ID |

**Request Example**

```
GET /api/animals/1
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "aid": 1,
    "name": "Luna",
    "species": "perro",
    "size": "mediano",
    "gender": "hembra",
    "status": "disponible",
    "description": "Friendly and energetic dog",
    "image_url": "https://cdn.example.com/animals/1/luna.jpg",
    "tags": ["friendly", "energetic"],
    "created_at": "2026-02-20T14:30:00.000Z"
  }
}
```

**Error `400`**

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Invalid animal ID. Must be a positive integer."
  }
}
```

**Error `404`**

```json
{
  "success": false,
  "error": {
    "code": 404,
    "message": "Animal with ID 999 not found"
  }
}
```

---

### POST `/api/animals`

Creates a new animal record.

**Request Body**

| Field              | Type     | Required | Description |
|--------------------|----------|----------|-------------|
| `name`             | string   | Yes      | Animal name (max 100 chars) |
| `description`      | string   | Yes      | Description (max 100 chars) |
| `species`          | string   | Yes      | `perro` or `gato` |
| `size`             | string   | Yes      | `pequeño`, `mediano`, `grande`, or `muy grande` |
| `gender`           | string   | Yes      | `macho`, `hembra`, or `desconocido` |
| `status`           | string   | Yes      | `disponible`, `adoptado`, `pendiente`, `en hogar temporal`, or `atención médica` |
| `image_object_key` | string   | No       | R2 object key for the animal's image |
| `tags`             | string[] | No       | Array of tag strings |

> **Note:** `image_url` is read-only and cannot be set directly. Use `image_object_key` instead.

**Request Example**

```bash
curl -X POST http://localhost:4000/api/animals \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Luna",
    "species": "perro",
    "size": "mediano",
    "gender": "hembra",
    "status": "disponible",
    "description": "Friendly and energetic dog",
    "tags": ["friendly", "energetic"]
  }'
```

**Response `201`**

```json
{
  "success": true,
  "data": {
    "aid": 1,
    "name": "Luna",
    "species": "perro",
    "size": "mediano",
    "gender": "hembra",
    "status": "disponible",
    "description": "Friendly and energetic dog",
    "tags": ["friendly", "energetic"],
    "created_at": "2026-02-20T14:30:00.000Z"
  }
}
```

**Error `400`**

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Name is required."
  }
}
```

---

### PATCH `/api/animals/:aid`

Partially updates an existing animal. At least one valid field must be provided.

**Path Parameters**

| Parameter | Type    | Description |
|-----------|---------|-------------|
| `aid`     | integer | Positive integer animal ID |

**Request Body** (all fields optional, at least one required)

| Field              | Type     | Description |
|--------------------|----------|-------------|
| `name`             | string   | Animal name (max 100 chars) |
| `description`      | string   | Description (max 1000 chars) |
| `species`          | string   | `perro` or `gato` |
| `size`             | string   | `pequeño`, `mediano`, `grande`, or `muy grande` |
| `gender`           | string   | `macho`, `hembra`, or `desconocido` |
| `status`           | string   | `disponible`, `adoptado`, `pendiente`, `en hogar temporal`, or `atención médica` |
| `image_object_key` | string   | R2 object key for the animal's image |
| `record_id`        | any      | External record identifier |
| `tags`             | string[] | Array of tag strings |

**Request Example**

```bash
curl -X PATCH http://localhost:4000/api/animals/1 \
  -H "Content-Type: application/json" \
  -d '{ "status": "adoptado" }'
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "aid": 1,
    "name": "Luna",
    "species": "perro",
    "size": "mediano",
    "gender": "hembra",
    "status": "adoptado",
    "description": "Friendly and energetic dog",
    "tags": ["friendly", "energetic"],
    "created_at": "2026-02-20T14:30:00.000Z"
  }
}
```

**Error `400`**

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "No valid fields provided for update."
  }
}
```

**Error `404`**

```json
{
  "success": false,
  "error": {
    "code": 404,
    "message": "Animal with ID 999 not found"
  }
}
```

---

### DELETE `/api/animals/:aid`

Deletes an animal by ID.

**Path Parameters**

| Parameter | Type    | Description |
|-----------|---------|-------------|
| `aid`     | integer | Positive integer animal ID |

**Request Example**

```
DELETE /api/animals/1
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "aid": 1,
    "name": "Luna",
    "species": "perro"
  }
}
```

**Error `404`**

```json
{
  "success": false,
  "error": {
    "code": 404,
    "message": "Animal with ID 999 not found"
  }
}
```

---

## Uploads

### GET `/api/uploads/config`

Returns current Cloudflare R2 upload configuration and live health status.

**Request Example**

```
GET /api/uploads/config
```

**Response `200`**

```json
{
  "data": {
    "r2Configured": true,
    "missingEnvVars": [],
    "publicObjectUrlConfigured": true,
    "missingPublicObjectUrlEnvVars": [],
    "allowedMimeTypes": ["image/jpeg", "image/png", "image/webp"],
    "maxImageSizeBytes": 5242880,
    "health": {
      "ok": true,
      "code": "R2_OK",
      "message": "Cloudflare R2 is available.",
      "checkedAt": "2026-04-05T12:00:00.000Z"
    }
  }
}
```

---

### POST `/api/uploads/animals/:animalId/image`

Uploads an image for an animal to Cloudflare R2.

**Content-Type:** `multipart/form-data`

**Path Parameters**

| Parameter  | Type   | Description |
|------------|--------|-------------|
| `animalId` | string | 1–64 chars: letters, numbers, underscores, or dashes |

**Form Fields**

| Field   | Type | Required | Description |
|---------|------|----------|-------------|
| `image` | file | Yes      | Image file to upload |

**Constraints**

- Allowed types: `image/jpeg`, `image/png`, `image/webp`
- Max file size: 5 MB (configurable via `R2_MAX_IMAGE_SIZE_BYTES`)
- One file per request

**Request Example**

```bash
curl -X POST http://localhost:4000/api/uploads/animals/1/image \
  -F "image=@./photo.jpg"
```

**Response `201`**

```json
{
  "data": {
    "objectKey": "animals/1/1739932938123-photo.jpg",
    "url": "https://cdn.example.com/animals/1/1739932938123-photo.jpg",
    "urlType": "public",
    "contentType": "image/jpeg",
    "size": 381248
  }
}
```

**Error `400` — Invalid animal ID**

```json
{
  "error": {
    "code": "INVALID_ANIMAL_ID",
    "message": "animalId must be 1-64 chars using only letters, numbers, underscores, or dashes."
  }
}
```

**Error `400` — Missing file**

```json
{
  "error": {
    "code": "MISSING_IMAGE_FILE",
    "message": "No upload file found. Send one file using multipart field name \"image\"."
  }
}
```

**Error `413` — File too large**

```json
{
  "error": {
    "code": "IMAGE_TOO_LARGE",
    "message": "Image exceeds the 5242880 byte upload limit."
  }
}
```

**Error `415` — Unsupported type**

```json
{
  "error": {
    "code": "INVALID_IMAGE_TYPE",
    "message": "Unsupported content type \"image/gif\". Allowed types: image/jpeg, image/png, image/webp."
  }
}
```

**Error `500` — R2 not configured**

```json
{
  "error": {
    "code": "R2_NOT_CONFIGURED",
    "message": "Cloudflare R2 is not configured on the server.",
    "details": { "missingEnvVars": ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID"] }
  }
}
```

**Error `503` — R2 unavailable**

```json
{
  "error": {
    "code": "R2_UNAUTHORIZED",
    "message": "Cloudflare R2 rejected the configured server credentials for the upload bucket."
  }
}
```
