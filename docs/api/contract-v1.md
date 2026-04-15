# API Contract v1 (MVP)

> **Living reference:** For production-accurate endpoint documentation (request/response examples, validation rules, and error codes) see [`endpoints.md`](./endpoints.md).
> This contract describes the *planned* v1 design; the implemented API uses base URL `/api/` (not `/api/v1/`).

**Version:** v1
**Base URL:** `/api/v1` *(planned — current implementation uses `/api/`)*
**Content-Type:** `application/json`
**Date format:** ISO-8601 (`YYYY-MM-DDTHH:mm:ssZ`)

## Authentication
- Public endpoints: no auth
- Admin endpoints: `Authorization: Bearer <token>`

## Error Schema (Convention)
All errors return:

~~~json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "details": []
  }
}
~~~

---

## Frontend Endpoints

### Animals
- GET `/animals`
Description: List animals available for adoption.
Authentication: Public (no auth)
Query Parameters (optional)
  species (string) — e.g., dog, cat
  status (string) — available | adopted | pending
  page (integer) — default 1, min 1
  limit (integer) — default 20, min 1, max 100

Request example
- GET /api/v1/animals?species=dog&status=available&page=1&limit=20

Response 200
{
  "data": [
    {
      "id": "a1f9c2e4-8c3a-4b2f-9c5d-1f3e7a9b2d10",
      "name": "Luna",
      "species": "dog",
      "breed": "Mixed",
      "age": 2,
      "sex": "female",
      "status": "available",
      "description": "Friendly and energetic dog",
      "images": [
        "https://cdn.shelter.org/animals/luna-1.jpg"
      ],
      "created_at": "2026-02-20T14:30:00Z",
      "updated_at": "2026-02-20T14:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}

Error 400 
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "Invalid query parameters",
    "details": [
      {
        "field": "limit",
        "issue": "must be <= 100"
      }
    ]
  }
}

Error 500 
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}

- GET `/animals/{id}`
Description: Get details for a specific animal.
Authentication: Public (no auth)
Path Parameters
  id (uuid)

Request example
- GET /api/v1/animals/a1f9c2e4-8c3a-4b2f-9c5d-1f3e7a9b2d10

Response 200 
{
  "data": {
    "id": "a1f9c2e4-8c3a-4b2f-9c5d-1f3e7a9b2d10",
    "name": "Luna",
    "species": "dog",
    "breed": "Mixed",
    "age": 2,
    "sex": "female",
    "status": "available",
    "description": "Friendly and energetic dog",
    "images": [
      "https://cdn.shelter.org/animals/luna-1.jpg"
    ],
    "created_at": "2026-02-20T14:30:00Z",
    "updated_at": "2026-02-20T14:30:00Z"
  }
}

Error 404
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Animal not found",
    "details": [
      {
        "field": "id",
        "issue": "no_record"
      }
    ]
  }
}

Error 500
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}

### Applications
- POST `/applications`

Description: Submit an adoption application.
Authentication: Public (no auth)
Request body
  animal_id (uuid) — required
  full_name (string) — required
  email (string) — required
  phone (string) — optional
  message (string) — optional

Request example
- POST /api/v1/applications

{
  "animal_id": "a1f9c2e4-8c3a-4b2f-9c5d-1f3e7a9b2d10",
  "full_name": "Carlos Hernandez",
  "email": "carlos@email.com",
  "phone": "+1-787-555-1234",
  "message": "I would love to adopt Luna."
}

Response 201
{
  "data": {
    "id": "9b3c1a4e-3dd1-4cdb-a4a9-b5d77b0c1d21",
    "animal_id": "a1f9c2e4-8c3a-4b2f-9c5d-1f3e7a9b2d10",
    "full_name": "Carlos Hernandez",
    "email": "carlos@email.com",
    "phone": "+1-787-555-1234",
    "message": "I would love to adopt Luna.",
    "status": "pending",
    "created_at": "2026-02-22T10:15:00Z",
    "updated_at": "2026-02-22T10:15:00Z"
  }
}

Error 400
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "email",
        "issue": "invalid_format"
      }
    ]
  }
}

Error 404
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Animal not found",
    "details": [
      {
        "field": "animal_id",
        "issue": "no_record"
      }
    ]
  }
}

Error 500
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}

### Posts
- GET `/posts`

Description: List available services offered by the shelter.
Authentication: Public (no auth)
Query Parameters (optional)
  page (integer) — default 1
  limit (integer) — default 20, max 100

Request example
GET /api/v1/posts?page=1&limit=20

Response 200
{
  "data": [
    {
      "id": "c2a5f4e6-1b0a-4f6b-9e8a-4b9d6e2c0f33",
      "title": "Adoption Event This Weekend",
      "content": "Join us for our adoption event this weekend!",
      "published": true,
      "created_at": "2026-02-18T09:00:00Z",
      "updated_at": "2026-02-18T09:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}

Error 400
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "Invalid query parameters",
    "details": [
      {
        "field": "page",
        "issue": "must be >= 1"
      }
    ]
  }
}

Error 500
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}

### Services
- GET `/services`

Description: List public posts/news.
Authentication: Public (no auth)
Query Parameters (optional)
  page (integer) — default 1
  limit (integer) — default 20, max 100

Request example
GET /api/v1/services?page=1&limit=20

Response 200
{
  "data": [
    {
      "id": "f61d3b1a-9b10-4e6a-8d51-03a2c7e8f9aa",
      "name": "Low-cost Vaccination Clinic",
      "description": "Weekly vaccination clinic for dogs and cats.",
      "active": true,
      "created_at": "2026-02-10T12:00:00Z",
      "updated_at": "2026-02-10T12:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}

Error 400
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "Invalid query parameters",
    "details": [
      {
        "field": "limit",
        "issue": "must be <= 100"
      }
    ]
  }
}

Error 500 
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}

### Donation
- GET `/donation-link`

Description: Get external donation URL.
Authentication: Public (no auth)

Request example
GET /api/v1/donation-link

Response 200
{
  "data": {
    "url": "https://donate.example.org/cpaaa"
  }
}

Error 500
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}

---

## Admin Endpoints

### Animals (Admin)
- POST `/admin/animals`

Description: Create a new animal.
Authentication: Admin (Authorization: Bearer <token>)
Request body
  name (string) — required
  species (string) — required
  breed (string) — optional
  age (integer) — optional
  sex (string) — optional (male | female | unknown)
  status (string) — required (available | adopted | pending)
  description (string) — optional
  images (string[]) — optional

Request example
- POST /api/v1/admin/animals
{
  "name": "Luna",
  "species": "dog",
  "breed": "Mixed",
  "age": 2,
  "sex": "female",
  "status": "available",
  "description": "Friendly and energetic dog",
  "images": [
    "https://cdn.shelter.org/animals/luna-1.jpg"
  ]
}

Response 201
{
  "data": {
    "id": "a1f9c2e4-8c3a-4b2f-9c5d-1f3e7a9b2d10",
    "name": "Luna",
    "species": "dog",
    "breed": "Mixed",
    "age": 2,
    "sex": "female",
    "status": "available",
    "description": "Friendly and energetic dog",
    "images": [
      "https://cdn.shelter.org/animals/luna-1.jpg"
    ],
    "created_at": "2026-02-20T14:30:00Z",
    "updated_at": "2026-02-20T14:30:00Z"
  }
}

Error 400
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "species",
        "issue": "required"
      }
    ]
  }
}

Error 401
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid token",
    "details": []
  }
}

Error 403
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required",
    "details": []
  }
}

Error 500
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}

- PATCH `/admin/animals/{id}`

Description: Update an existing animal (partial update).
Authentication: Admin (Authorization: Bearer <token>)
Path Parameters
  id (uuid)
Request body (any fields)
  name, species, breed, age, sex, status, description, images

Request example
- PATCH /api/v1/admin/animals/a1f9c2e4-8c3a-4b2f-9c5d-1f3e7a9b2d10

{
  "status": "pending",
  "description": "On hold while application is reviewed"
}

Response 200
{
  "data": {
    "id": "a1f9c2e4-8c3a-4b2f-9c5d-1f3e7a9b2d10",
    "name": "Luna",
    "species": "dog",
    "breed": "Mixed",
    "age": 2,
    "sex": "female",
    "status": "pending",
    "description": "On hold while application is reviewed",
    "images": [
      "https://cdn.shelter.org/animals/luna-1.jpg"
    ],
    "created_at": "2026-02-20T14:30:00Z",
    "updated_at": "2026-02-23T16:05:00Z"
  }
}

Error 400
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "status",
        "issue": "must be one of: available, adopted, pending"
      }
    ]
  }
}

Error 401
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid token",
    "details": []
  }
}

Error 403
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required",
    "details": []
  }
}

Error 404
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Animal not found",
    "details": [
      {
        "field": "id",
        "issue": "no_record"
      }
    ]
  }
}

Error 500
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}

- DELETE `/admin/animals/{id}`

Authentication: Admin (Authorization: Bearer <token>)
Path Parameters
  id (uuid)

Request example
- DELETE /api/v1/admin/animals/a1f9c2e4-8c3a-4b2f-9c5d-1f3e7a9b2d10

Response 204
No Content

Error 401
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid token",
    "details": []
  }
}

Error 404
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Animal not found",
    "details": [
      {
        "field": "id",
        "issue": "no_record"
      }
    ]
  }
}

Error 500
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}

### Uploads (Admin UI Support)
- GET `/uploads/config`

Description: Return upload configuration and live Cloudflare R2 health for admin image flows.
Authentication: Admin (Authorization: Bearer <token>)

Request example
- GET /api/v1/uploads/config

Response 200
{
  "data": {
    "r2Configured": true,
    "missingEnvVars": [],
    "publicObjectUrlConfigured": true,
    "missingPublicObjectUrlEnvVars": [],
    "allowedMimeTypes": [
      "image/jpeg",
      "image/png",
      "image/webp"
    ],
    "maxImageSizeBytes": 5242880,
    "health": {
      "ok": true,
      "code": "R2_OK",
      "message": "Cloudflare R2 is available.",
      "checkedAt": "2026-03-29T12:00:00Z"
    }
  }
}

Error 500
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}

- POST `/uploads/animals/{animalId}/image`

Description: Upload an animal image to Cloudflare R2.
Authentication: Admin (Authorization: Bearer <token>)
Path Parameters
  animalId (string)
Request body
  multipart/form-data with one file in field `image`

Request example
- POST /api/v1/uploads/animals/a1f9c2e4-8c3a-4b2f-9c5d-1f3e7a9b2d10/image

Response 201
{
  "data": {
    "objectKey": "animals/a1f9c2e4-8c3a-4b2f-9c5d-1f3e7a9b2d10/1739932938123-luna.jpg",
    "url": "https://cdn.shelter.org/animals/a1f9c2e4-8c3a-4b2f-9c5d-1f3e7a9b2d10/1739932938123-luna.jpg",
    "urlType": "public",
    "contentType": "image/jpeg",
    "size": 381248
  }
}

Error 400
{
  "error": {
    "code": "INVALID_ANIMAL_ID",
    "message": "animalId must be valid for image uploads.",
    "details": []
  }
}

Error 413
{
  "error": {
    "code": "IMAGE_TOO_LARGE",
    "message": "Image exceeds the configured upload limit.",
    "details": []
  }
}

Error 415
{
  "error": {
    "code": "INVALID_IMAGE_TYPE",
    "message": "Unsupported image content type.",
    "details": []
  }
}

Error 503
{
  "error": {
    "code": "R2_UNAUTHORIZED",
    "message": "Cloudflare R2 rejected the configured server credentials for the upload bucket.",
    "details": []
  }
}

### Applications (Admin)
- GET `/admin/applications`

Description: List adoption applications.
Authentication: Admin (Authorization: Bearer <token>)
Query Parameters (optional)
  status (string) — pending | approved | rejected
  page (integer) — default 1
  limit (integer) — default 20, max 100

Request example
- GET /api/v1/admin/applications?status=pending&page=1&limit=20

Response 200
{
  "data": [
    {
      "id": "9b3c1a4e-3dd1-4cdb-a4a9-b5d77b0c1d21",
      "animal_id": "a1f9c2e4-8c3a-4b2f-9c5d-1f3e7a9b2d10",
      "full_name": "Carlos Hernandez",
      "email": "carlos@email.com",
      "phone": "+1-787-555-1234",
      "message": "I would love to adopt Luna.",
      "status": "pending",
      "created_at": "2026-02-22T10:15:00Z",
      "updated_at": "2026-02-22T10:15:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}

Error 400
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "Invalid query parameters",
    "details": [
      {
        "field": "status",
        "issue": "must be one of: pending, approved, rejected"
      }
    ]
  }
}

Error 401
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid token",
    "details": []
  }
}

Error 403 
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required",
    "details": []
  }
}

Error 500 
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}

- PATCH `/admin/applications/{id}`

Description: Update application status (approve/reject).
Authentication: Admin (Authorization: Bearer <token>)
Path Parameters
  id (uuid)
Request body
  status (string) — required: approved | rejected
  admin_notes (string) — optional

Request example
- PATCH /api/v1/admin/applications/9b3c1a4e-3dd1-4cdb-a4a9-b5d77b0c1d21

{
  "status": "approved",
  "admin_notes": "Approved after phone interview."
}

Response 200
{
  "data": {
    "id": "9b3c1a4e-3dd1-4cdb-a4a9-b5d77b0c1d21",
    "animal_id": "a1f9c2e4-8c3a-4b2f-9c5d-1f3e7a9b2d10",
    "full_name": "Carlos Hernandez",
    "email": "carlos@email.com",
    "phone": "+1-787-555-1234",
    "message": "I would love to adopt Luna.",
    "status": "approved",
    "admin_notes": "Approved after phone interview.",
    "created_at": "2026-02-22T10:15:00Z",
    "updated_at": "2026-02-23T18:20:00Z"
  }
}

Error 400
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "status",
        "issue": "must be one of: approved, rejected"
      }
    ]
  }
}

Error 401
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid token",
    "details": []
  }
}

Error 403
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required",
    "details": []
  }
}

Error 404 
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Application not found",
    "details": [
      {
        "field": "id",
        "issue": "no_record"
      }
    ]
  }
}

Error 500
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}


### Posts (Admin)
- POST `/admin/posts`

Description: Create a post.
Authentication: Admin (Authorization: Bearer <token>)
Request body
  title (string) — required
  content (string) — required
  published (boolean) — optional (default true)

Request example
- POST /api/v1/admin/posts

{
  "title": "Adoption Event This Weekend",
  "content": "Join us for our adoption event this weekend!",
  "published": true
}

Response 201
{
  "data": {
    "id": "c2a5f4e6-1b0a-4f6b-9e8a-4b9d6e2c0f33",
    "title": "Adoption Event This Weekend",
    "content": "Join us for our adoption event this weekend!",
    "published": true,
    "created_at": "2026-02-18T09:00:00Z",
    "updated_at": "2026-02-18T09:00:00Z"
  }
}

Error 400
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "title",
        "issue": "required"
      }
    ]
  }
}

Error 401
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid token",
    "details": []
  }
}

Error 403
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required",
    "details": []
  }
}

Error 500
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}

- PATCH `/admin/posts/{id}`

Description: Update a post (partial update).
Authentication: Admin (Authorization: Bearer <token>)
Path Parameters
  id (uuid) 

Request example
- PATCH /api/v1/admin/posts/c2a5f4e6-1b0a-4f6b-9e8a-4b9d6e2c0f33

{
  "published": false
}

Response 200 
{
  "data": {
    "id": "c2a5f4e6-1b0a-4f6b-9e8a-4b9d6e2c0f33",
    "title": "Adoption Event This Weekend",
    "content": "Join us for our adoption event this weekend!",
    "published": false,
    "created_at": "2026-02-18T09:00:00Z",
    "updated_at": "2026-02-23T11:30:00Z"
  }
}

Error 401
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid token",
    "details": []
  }
}

Error 403
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required",
    "details": []
  }
}

Error 404
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Post not found",
    "details": [
      {
        "field": "id",
        "issue": "no_record"
      }
    ]
  }
}

Error 500
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}

- DELETE `/admin/posts/{id}`

Description: Delete a post.
Authentication: Admin (Authorization: Bearer <token>)

Request example
- DELETE /api/v1/admin/posts/c2a5f4e6-1b0a-4f6b-9e8a-4b9d6e2c0f33

Response 204
No Content

Error 401
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid token",
    "details": []
  }
}

Error 403
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required",
    "details": []
  }
}

Error 404
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Post not found",
    "details": [
      {
        "field": "id",
        "issue": "no_record"
      }
    ]
  }
}

Error 500
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}

### Services (Admin)
- POST `/admin/services`

Description: Create a service.
Authentication: Admin (Authorization: Bearer <token>)
Request body
  name (string) — required
  description (string) — required
  active (boolean) — optional (default true)

Request example
- POST /api/v1/admin/services

{
  "name": "Low-cost Vaccination Clinic",
  "description": "Weekly vaccination clinic for dogs and cats.",
  "active": true
}

Response 201
{
  "data": {
    "id": "f61d3b1a-9b10-4e6a-8d51-03a2c7e8f9aa",
    "name": "Low-cost Vaccination Clinic",
    "description": "Weekly vaccination clinic for dogs and cats.",
    "active": true,
    "created_at": "2026-02-10T12:00:00Z",
    "updated_at": "2026-02-10T12:00:00Z"
  }
}

Error 400
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "name",
        "issue": "required"
      }
    ]
  }
}

Error 401
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid token",
    "details": []
  }
}

Error 403
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required",
    "details": []
  }
}

Error 500
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}

- PATCH `/admin/services/{id}`

Description: Update a service (partial update).
Authentication: Admin (Authorization: Bearer <token>)

Request example
- PATCH /api/v1/admin/services/f61d3b1a-9b10-4e6a-8d51-03a2c7e8f9aa

{
  "active": false
}

Response 200
{
  "data": {
    "id": "f61d3b1a-9b10-4e6a-8d51-03a2c7e8f9aa",
    "name": "Low-cost Vaccination Clinic",
    "description": "Weekly vaccination clinic for dogs and cats.",
    "active": false,
    "created_at": "2026-02-10T12:00:00Z",
    "updated_at": "2026-02-23T12:40:00Z"
  }
}

Error 401
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid token",
    "details": []
  }
}

Error 403
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required",
    "details": []
  }
}

Error 404
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Service not found",
    "details": [
      {
        "field": "id",
        "issue": "no_record"
      }
    ]
  }
}

Error 500
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}

- DELETE `/admin/services/{id}`

Description: Delete a service.
Authentication: Admin (Authorization: Bearer <token>)

Request example
- DELETE /api/v1/admin/services/f61d3b1a-9b10-4e6a-8d51-03a2c7e8f9aa

Response 204
No Content

Error 401
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid token",
    "details": []
  }
}

Error 403
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required",
    "details": []
  }
}

Error 404
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Service not found",
    "details": [
      {
        "field": "id",
        "issue": "no_record"
      }
    ]
  }
}

Error 500
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error",
    "details": []
  }
}
