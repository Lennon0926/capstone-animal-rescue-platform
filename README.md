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
```

**Web** (`apps/web/.env.local`):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_GOOGLE_FORM_URL=https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform
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
