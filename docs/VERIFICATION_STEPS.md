# Manual Verification Steps

This document provides step-by-step verification for the Supabase integration PR.

## Prerequisites

1. Server running: `cd apps/server && npm run dev`
2. Database seeded with sample data

## Success Cases

### 1. Health Check Endpoint

**Test:**
```bash
curl http://localhost:4000/api/health
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-02-28T...",
  "database": {
    "connected": true,
    "error": null
  }
}
```

### 2. List All Animals

**Test:**
```bash
curl http://localhost:4000/api/animals
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "aid": 1,
      "name": "Buddy",
      "species": "dog",
      "status": "available",
      ...
    },
    ...
  ],
  "pagination": {
    "total": 12,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### 3. Filter by Species

**Test:**
```bash
curl "http://localhost:4000/api/animals?species=cat"
```

**Expected Response (200 OK):**
- Only animals with species containing "cat"
- Should return 5 cats (Whiskers, Luna, Oliver, Simba, Cleo)

### 4. Filter by Status

**Test:**
```bash
curl "http://localhost:4000/api/animals?status=available"
```

**Expected Response (200 OK):**
- Only animals with status "available"
- Should return 8 animals

### 5. Combined Filters

**Test:**
```bash
curl "http://localhost:4000/api/animals?species=dog&status=available&size=large"
```

**Expected Response (200 OK):**
- Large, available dogs only
- Should return 1 animal (Buddy)

### 6. Pagination

**Test:**
```bash
curl "http://localhost:4000/api/animals?limit=3&offset=0"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [/* 3 animals */],
  "pagination": {
    "total": 12,
    "limit": 3,
    "offset": 0,
    "hasMore": true
  }
}
```

### 7. Get Single Animal

**Test:**
```bash
curl http://localhost:4000/api/animals/1
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "aid": 1,
    "name": "Buddy",
    ...
  }
}
```

### 8. Get Filter Options

**Test:**
```bash
curl http://localhost:4000/api/animals/filters
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "species": ["dog", "cat"],
    "status": ["available", "adopted", "pending", "fostered", "medical_hold"],
    "size": ["small", "medium", "large", "extra_large"],
    "gender": ["male", "female"]
  }
}
```

### 9. Sorting

**Test:**
```bash
curl "http://localhost:4000/api/animals?sortBy=name&sortOrder=asc"
```

**Expected Response (200 OK):**
- Animals sorted alphabetically by name (A-Z)
- First animal should be "Bella", last should be "Whiskers"

## Failure Cases

### 1. Invalid Animal ID

**Test:**
```bash
curl http://localhost:4000/api/animals/99999
```

**Expected Response (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": 404,
    "message": "Animal with ID 99999 not found"
  }
}
```

### 2. Invalid Animal ID Format

**Test:**
```bash
curl http://localhost:4000/api/animals/abc
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Invalid animal ID. Must be a positive integer."
  }
}
```

### 3. Undefined Route

**Test:**
```bash
curl http://localhost:4000/api/undefined
```

**Expected Response (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": 404,
    "message": "Route not found: GET /api/undefined"
  }
}
```

### 4. Invalid Query Parameters (Graceful Handling)

**Test:**
```bash
curl "http://localhost:4000/api/animals?limit=-5&offset=abc"
```

**Expected Response (200 OK):**
- Server should use defaults (limit=50, offset=0)
- Should not error

### 5. Database Disconnection (Manual Test)

1. Stop the Supabase project or use invalid credentials
2. Restart server with invalid `SUPABASE_SERVICE_ROLE_KEY`

**Test:**
```bash
curl http://localhost:4000/api/health
```

**Expected Response (503 Service Unavailable):**
```json
{
  "success": false,
  "status": "degraded",
  "timestamp": "...",
  "database": {
    "connected": false,
    "error": "..."
  }
}
```

## Database Verification

### Verify Tables via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor**
3. Verify these tables exist:
   - `animals` (12 rows)
   - `medical_records` (0 rows)
   - `users` (0 rows)
   - `roles` (2 rows: admin, helper)
   - `user_roles` (0 rows)

### Verify Roles

```sql
SELECT * FROM public.roles ORDER BY id;
```

Expected: 2 roles (admin, helper)

### Verify RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('animals', 'roles', 'user_roles', 'users', 'medical_records');
```

Expected: All tables should have `rowsecurity = true`

## Environment Variables Checklist

### Server (`apps/server/.env.local`)

- [ ] `SUPABASE_URL` is set to project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (required for bypassing RLS)
- [ ] `PORT` is set (default: 4000)

### Web (`apps/web/.env.local`)

- [ ] `NEXT_PUBLIC_API_BASE_URL` points to backend
- [ ] `NEXT_PUBLIC_GOOGLE_FORM_URL` is set to adoption form URL

## Quick Smoke Test Script

Run all success tests:

```bash
#!/bin/bash
BASE_URL="http://localhost:4000"

echo "Testing health..."
curl -s "$BASE_URL/api/health" | jq .

echo "\nTesting animals list..."
curl -s "$BASE_URL/api/animals?limit=3" | jq '.data | length'

echo "\nTesting filters..."
curl -s "$BASE_URL/api/animals?species=dog" | jq '.data | length'

echo "\nTesting single animal..."
curl -s "$BASE_URL/api/animals/1" | jq '.data.name'

echo "\nTesting 404..."
curl -s "$BASE_URL/api/animals/99999" | jq '.error.code'

echo "\nAll tests complete!"
```
