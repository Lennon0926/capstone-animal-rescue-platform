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
PORT='8080'
```

**Web** (`apps/web/.env.local`):

```env
NEXT_PUBLIC_API_BASE_URL='http://localhost:8080'
```

### 4. Start the development servers

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

The API will be available at `http://localhost:8080` and the frontend at `http://localhost:3000`.

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| Backend  | Express 5, Node.js                  |
| Tooling  | ESLint, Nodemon, PostCSS            |

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
- Lockfiles (`client/package-lock.json`, `server/package-lock.json`)
- Environment templates (`.env.example`, `client/.env.example`, `server/.env.example`)
- Supabase config and migrations (for example `supabase/config.toml`, `supabase/migrations/**`)

Do not commit these:

- Dependency folders (`node_modules/`, `client/node_modules/`, `venv/`, `.venv/`)
- Build/generated artifacts (`client/.next/`, coverage output, caches)
- Local environment/secret files (`.env`, `.env.*`, `client/.env*`, `server/.env*`)
- Cloudflare local state (`.wrangler/`, `.dev.vars`, `.dev.vars.*`)
- Supabase local runtime state (`supabase/.temp/`, `supabase/.env`)

Quick verification:

```bash
# No generated frontend artifacts should be tracked
git ls-files | rg '^client/(\.next|node_modules)/'

# Confirm key local artifacts are ignored
git check-ignore -v client/.next client/node_modules client/.env.local
```

---

## Stack Disclaimer

This setup does **not** define the final architecture, backend language, or deployment strategy of the project.

All final technical decisions will be documented in the **Technical Approach** section of the project proposal and updated as needed.
