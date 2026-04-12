# Supabase Integration Guide

This document describes how to set up and configure Supabase for the Capstone Animal Rescue Platform.

## Overview

The platform uses Supabase as the primary backend data store, providing:
- **PostgreSQL database** for animal catalog, medical records, and user data
- **Row Level Security (RLS)** foundation for future auth integration
- **Role-based access control (RBAC)** via `roles` and `user_roles` tables

## Prerequisites

- [Supabase account](https://supabase.com) (free tier available)
- Node.js 18+
- npm

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose your organization and enter:
   - Project name: `animal-rescue-platform`
   - Database password: (save this securely)
   - Region: Choose nearest to your users
4. Wait for project to provision (~2 minutes)

### 2. Get API Credentials

1. Go to **Project Settings** > **API**
2. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **service_role (secret)** → `SUPABASE_SERVICE_ROLE_KEY`

>  **Security Note**: The service_role key bypasses RLS. Never expose it in client-side code.

### 3. Configure Environment Variables

Create or update `apps/server/.env.local`:

```env
PORT=4000

# Supabase Configuration (Required)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your_service_role_key

# Optional: Override schema (defaults to 'public')
# SUPABASE_SCHEMA=public
```

### 4. Apply Database Schema

#### Option A: Via Supabase Dashboard

1. Go to **SQL Editor** in your Supabase dashboard
2. Paste the contents of `init_db.sql` from the project root
3. Click **Run**

#### Option B: Via Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Push schema
supabase db push
```

### 5. Seed Sample Data

```bash
cd apps/server
npm install
npm run seed
```

Options:
- `npm run seed` - Seed if empty, otherwise prompt
- `npm run seed:force` - Clear existing data and reseed
- `npm run seed:append` - Add data without clearing existing

### 6. Verify Setup

Start the server and test:

```bash
npm run dev

# Test health endpoint (should show database connected)
curl http://localhost:4000/api/health

# Test animals endpoint
curl http://localhost:4000/api/animals
```

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `animals` | Animal catalog with species, status, etc. |
| `medical_records` | Treatment history linked to animals |
| `users` | User accounts (for future auth integration) |
| `roles` | RBAC role definitions |
| `user_roles` | User-to-role mappings |

### Default Roles

| Role | Description |
|------|-------------|
| `admin` | Full system access |
| `helper` | Can assist with animal care and view records |

### Entity Relationship

```
users ──────────┐
                │ user_roles
roles ──────────┘
                
animals ◄────── medical_records
```

## API Endpoints

### Health Check
```
GET /api/health
```
Returns database connection status.

### Animals

```
GET /api/animals
```

Query parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| `species` | string | Filter by species (partial match) |
| `status` | string | Filter: available, adopted, pending, fostered, medical_hold |
| `size` | string | Filter: small, medium, large, extra_large |
| `gender` | string | Filter: male, female, unknown |
| `name` | string | Search by name (partial match) |
| `sortBy` | string | Sort field: aid, name, species, status, created_at |
| `sortOrder` | string | Sort direction: asc, desc |
| `limit` | number | Results per page (1-100, default: 50) |
| `offset` | number | Pagination offset (default: 0) |

Example:
```bash
curl "http://localhost:4000/api/animals?species=dog&status=available&limit=10"
```

```
GET /api/animals/:aid
```
Get single animal by ID.

```
GET /api/animals/filters
```
Get available filter options (distinct values).

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role API key (server-side only) |
| `SUPABASE_SCHEMA` | No | Database schema (default: public) |
| `PORT` | No | Server port (default: 4000) |

## Troubleshooting

### "Missing required environment variables"
Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in `.env.local`.

### "Database query error" / RLS policy errors
The service_role key should bypass RLS. If you see permission errors:
1. Verify you're using the service_role key, not the anon key
2. Check that RLS policies exist (see `init_db.sql`)

### Connection timeouts
1. Verify your Supabase project is active (not paused)
2. Check network/firewall settings
3. Verify the SUPABASE_URL is correct

### Seed script fails
1. Ensure the database schema is applied first
2. Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
3. Try `npm run seed:force` to clear and retry

## Next Steps

- [ ] Implement Supabase Auth for user login
- [ ] Add RLS policies for authenticated users
- [ ] Connect frontend to animals API
- [ ] Implement admin CRUD operations for animals
