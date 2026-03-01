# Capstone Animal Rescue Platform

A full-stack web application for animal rescue coordination, built with Next.js and Express.

## Project Structure

```
├── apps/
│   ├── server/          # Express API (Node.js)
│   └── web/             # Next.js frontend (React + TypeScript)
├── docs/                # Project documentation and diagram scripts
├── ngrok/               # Tunnel script for exposing local dev to the internet
├── .gitignore
├── LICENSE
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
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

**Server** (`apps/server/.env.local`):

```env
PORT=4000

# Supabase Configuration (Required)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Cloudflare R2 Configuration (for image uploads)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_BASE_URL=https://cdn.your-domain.com
# Optional override (default is 5 MB):
R2_MAX_IMAGE_SIZE_BYTES=5242880
# Optional signed URL duration when public base URL is not set:
R2_SIGNED_READ_URL_TTL_SECONDS=3600
```

**Web** (`apps/web/.env.local`):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_GOOGLE_FORM_URL=https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform
```

You can copy from templates first:

```bash
cp apps/server/.env.example apps/server/.env.local
cp apps/web/.env.example apps/web/.env.local
```

> 📖 See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for detailed Supabase configuration instructions.

### 4. Apply database schema and seed data

```bash
cd apps/server
npm run seed
```

### 5. Start the development servers

In one terminal, start the API server:

```bash
cd apps/server
npm run dev
```

In a second terminal, start the frontend:

```bash
cd apps/web
npm run dev
```

The API will be available at `http://localhost:4000` and the frontend at `http://localhost:3000`.

Or run both from the repository root:

```bash
./dev.sh
```

## Cloudflare R2 Image Upload API

- Endpoint: `POST /api/uploads/animals/:animalId/image`
- Request format: `multipart/form-data` with file field name `image`
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Max upload size: `5 MB` by default (`R2_MAX_IMAGE_SIZE_BYTES` can override)
- Object key format: `animals/{animalId}/{timestamp}-{filename}`
- Response includes stored object key and an accessible URL for frontend use (public URL when `R2_PUBLIC_BASE_URL` is set, signed read URL otherwise)

Example success response:

```json
{
  "data": {
    "objectKey": "animals/demo-animal/1739932938123-shelter-dog.jpg",
    "url": "https://cdn.your-domain.com/animals/demo-animal/1739932938123-shelter-dog.jpg",
    "urlType": "public",
    "contentType": "image/jpeg",
    "size": 381248
  }
}
```

### Image Size Choice

The default `5 MB` limit is a simple balance between quality and performance:

- Typical 1600x1200 JPEG images are often around 1-2 MB.
- PNG files can be significantly larger for the same dimensions.
- 5 MB allows normal shelter images while still preventing oversized uploads.

## Manual Verification (Issue #20)

Success case:

1. Start `apps/server` and `apps/web`.
2. Open `http://localhost:3000`.
3. Use the upload form with an `animalId` and a `.jpg`, `.png`, or `.webp` file under 5 MB.
4. Confirm a returned `objectKey` and `url`, and verify the file exists in your R2 bucket.

Failure cases:

1. Upload a file larger than 5 MB and confirm `413 IMAGE_TOO_LARGE`.
2. Upload a non-supported file type (for example `.gif`) and confirm `415 INVALID_IMAGE_TYPE`.
3. Use an invalid `animalId` (for example `dog/123`) and confirm `400 INVALID_ANIMAL_ID`.
4. Remove one required `R2_*` server variable and confirm `500 R2_NOT_CONFIGURED`.

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| Backend  | Express 5, Node.js                  |
| Database | Supabase (PostgreSQL)               |
| Tooling  | ESLint, Nodemon, PostCSS            |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check with database status |
| GET | `/api/animals` | List animals with filters/pagination |
| GET | `/api/animals/:aid` | Get single animal by ID |
| GET | `/api/animals/filters` | Get available filter options |

See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for full API documentation.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) | Database setup, schema, and API reference |
| [docs/GOOGLE_FORMS_INTEGRATION.md](docs/GOOGLE_FORMS_INTEGRATION.md) | Adoption application intake via Google Forms |
### Health & Readiness

| Endpoint  | Method | Description | Success | Failure |
| --------- | ------ | ----------- | ------- | ------- |
| `/health` | GET    | Liveness check — confirms the process is running. Returns uptime and start timestamp. | `200 { "status": "ok", "uptime": ..., "startedAt": "..." }` | N/A (if the server is down the request won't reach it) |
| `/ready`  | GET    | Readiness check — confirms all required environment variables are set. | `200 { "status": "ready" }` | `503 { "status": "not ready", "reason": "missing env" }` |

### Environment Validation

On startup the server validates that every variable listed in `apps/server/validateEnv.js` (`REQUIRED_ENV_VARS`) is present. If any are missing the process exits immediately with an actionable error listing each missing variable.

**Local usage:**

```bash
curl http://localhost:8080/health
curl http://localhost:8080/ready
```

**Deployment:** Point your orchestrator's liveness probe at `/health` and its readiness probe at `/ready`.

## Documentation Scripts

The `docs/scripts/` directory contains Python scripts for generating project diagrams (flowcharts, sequence diagrams, timelines, algorithm charts). These are documentation-only utilities and are not required to run the application.

To run them:

```bash
cd docs/scripts
pip install -r requirements.txt
python flowchart/generate_flowchart.py
```

## ngrok Tunnel

The `ngrok/` directory includes a script to expose the local frontend via a public URL for testing. See [`ngrok/README.md`](ngrok/README.md) for setup instructions.

```bash
./ngrok/start-ngrok.sh
```

## License

See [LICENSE](LICENSE) for details.
---

## Commit and Ignore Policy

To keep pull requests small, predictable, and secure, commit source/config files and ignore generated output and secrets.

Commit these:

- Application source code and project docs
- Lockfiles (`apps/web/package-lock.json`, `apps/server/package-lock.json`)
- Environment templates (`.env.example`, `apps/web/.env.example`, `apps/server/.env.example`)
- Supabase config and migrations (for example `supabase/config.toml`, `supabase/migrations/**`)

Do not commit these:

- Dependency folders (`node_modules/`, `apps/web/node_modules/`, `apps/server/node_modules/`, `venv/`, `.venv/`)
- Build/generated artifacts (`apps/web/.next/`, coverage output, caches)
- Local environment/secret files (`.env`, `.env.*`, `apps/web/.env*`, `apps/server/.env*`)
- Cloudflare local state (`.wrangler/`, `.dev.vars`, `.dev.vars.*`)
- Supabase local runtime state (`supabase/.temp/`, `supabase/.env`)

Quick verification:

```bash
# No generated frontend artifacts should be tracked
git ls-files | rg '^apps/web/(\.next|node_modules)/'

# Confirm key local artifacts are ignored
git check-ignore -v apps/web/.next apps/web/node_modules apps/web/.env.local
```

---

## Stack Disclaimer

This setup does **not** define the final architecture, backend language, or deployment strategy of the project.

All final technical decisions will be documented in the **Technical Approach** section of the project proposal and updated as needed.
