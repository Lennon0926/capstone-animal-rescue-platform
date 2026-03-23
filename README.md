# Capstone Animal Rescue Platform

A full-stack web application for animal rescue coordination, built with Next.js and Express.

## Project Structure

```
├── apps/
│   ├── server/          # Express API (Node.js)
│   │   ├── routes/      # Route handlers (animals, uploads, health)
│   │   ├── services/    # Business logic (r2Service)
│   │   ├── middleware/  # Error handling, request validation
│   │   ├── lib/         # Shared clients (Supabase)
│   │   ├── __tests__/   # Jest test suites
│   │   └── server.js    # Entry point
│   └── web/             # Next.js frontend (React + TypeScript)
├── docs/                # Project documentation
├── ngrok/               # Tunnel script for local → public URL
├── supabase/            # DB schema and migrations
├── dev.sh               # Start both servers in one command
└── init_db.sql          # Initial database schema
```

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| Backend  | Express 5, Node.js 20 |
| Database | Supabase (PostgreSQL) |
| Storage  | Cloudflare R2 (image uploads) |
| CI/CD    | GitHub Actions |

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or higher
- npm (included with Node.js)
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Lennon0926/capstone-animal-rescue-platform.git
cd capstone-animal-rescue-platform
```

### 2. Install dependencies

```bash
cd apps/server && npm install
cd ../web && npm install
```

### 3. Configure environment variables

Copy the example files and fill in your values:

```bash
cp apps/server/.env.example apps/server/.env.local
cp apps/web/.env.example apps/web/.env.local
```

**Server** (`apps/server/.env.local`):

```env
# Server
PORT=4000

# Supabase Configuration (Required)
# Get these from: Supabase Dashboard > Project Settings > API
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Note: SUPABASE_ANON_KEY is optional for the backend but required if you
# need client-level RLS queries from the server.
SUPABASE_ANON_KEY=your_anon_key_here

# Cloudflare R2 Storage (Required)
# Get these from: Cloudflare Dashboard > R2 > Manage R2 API Tokens
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_bucket_name

# Optional: Public base URL for uploaded files (e.g., custom domain via Cloudflare)
# Example: https://cdn.your-domain.com
R2_PUBLIC_BASE_URL=

# Optional: Override upload size limit in bytes (default: 5 MB)
R2_MAX_IMAGE_SIZE_BYTES=5242880

# Optional: Signed URL TTL in seconds when R2_PUBLIC_BASE_URL is not set (default: 1 hour)
R2_SIGNED_READ_URL_TTL_SECONDS=3600
```

**Web** (`apps/web/.env.local`):

```env
# Backend API URL
# Development: http://localhost:4000
# Production: set to your deployed backend URL (e.g., Railway)
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# Supabase Configuration (for client-side access)
# Get these from: Supabase Dashboard > Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Forms Integration
# URL for the adoption application form
NEXT_PUBLIC_GOOGLE_FORM_URL=your-google-form-url
```

> See [docs/SECRETS_MANAGEMENT.md](docs/SECRETS_MANAGEMENT.md) for the full variable reference, optional vars, and secret rotation procedures.
> See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for Supabase project setup instructions.

### 4. Seed the database

```bash
cd apps/server
npm run seed
```

### 5. Start the development servers

```bash
# Start both servers at once from the repo root:
./dev.sh
```

Or start them separately:

```bash
# Terminal 1 — API server
cd apps/server && npm run dev

# Terminal 2 — Frontend
cd apps/web && npm run dev
```

- API: `http://localhost:4000`
- Frontend: `http://localhost:3000`

## API Endpoints

### Health & System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info and available endpoints |
| GET | `/api/health` | Health check with database connectivity status |
| GET | `/health` | Liveness probe — returns uptime, no dependency check |
| GET | `/ready` | Readiness probe — 503 if required env vars are missing |

### Animals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/animals` | List animals with filters and pagination |
| GET | `/api/animals/:aid` | Get a single animal by ID |
| GET | `/api/animals/filters` | Get available filter values (species, status, etc.) |

### Uploads

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/uploads/animals/:animalId/image` | Upload an animal image to Cloudflare R2 |

**Upload details:**
- Request: `multipart/form-data`, field name `image`
- Allowed types: `image/jpeg`, `image/png`, `image/webp`
- Max size: 5 MB (override with `R2_MAX_IMAGE_SIZE_BYTES`)
- Returns: object key and a public or signed URL

```json
{
  "data": {
    "objectKey": "animals/1/1739932938123-shelter-dog.jpg",
    "url": "https://cdn.your-domain.com/animals/1/1739932938123-shelter-dog.jpg",
    "urlType": "public",
    "contentType": "image/jpeg",
    "size": 381248
  }
}
```

## Environment Validation

On startup, the server validates that all required environment variables are present. Missing variables cause an immediate exit with a clear error listing each missing var.

The `/ready` endpoint also returns `503` if any required variable is absent — useful for orchestrator readiness probes.

## Testing

```bash
# Server unit tests
cd apps/server && npm test

# Web unit tests
cd apps/web && npm test

# Web E2E tests (Playwright — requires no running dev server)
cd apps/web && npm run test:e2e
```

CI runs lint, build, unit tests, and E2E tests for every push and pull request to `main` and `develop`.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/SECRETS_MANAGEMENT.md](docs/SECRETS_MANAGEMENT.md) | All env vars, GitHub Secrets setup, deployment config, rotation procedures |
| [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) | Database setup and schema reference |
| [docs/GOOGLE_FORMS_INTEGRATION.md](docs/GOOGLE_FORMS_INTEGRATION.md) | Adoption application intake via Google Forms |
| [docs/SECURITY_ALERTS.md](docs/SECURITY_ALERTS.md) | Security alert handling and procedures |
| [docs/api/contract-v1.md](docs/api/contract-v1.md) | Full API contract |

## ngrok Tunnel

Expose the local frontend via a public URL for testing:

```bash
./ngrok/start-ngrok.sh
```

See [`ngrok/README.md`](ngrok/README.md) for setup instructions.

## Commit and Ignore Policy

**Commit:**
- Application source code and project docs
- Lockfiles (`apps/web/package-lock.json`, `apps/server/package-lock.json`)
- Environment templates (`.env.example`)
- DB schema and migrations

**Do not commit:**
- `node_modules/`, `.next/`, build artifacts, caches
- `.env.local` or any file containing real secrets
- Cloudflare local state (`.wrangler/`, `.dev.vars`)
- Supabase local runtime state (`supabase/.temp/`)

## License

See [LICENSE](LICENSE) for details.
