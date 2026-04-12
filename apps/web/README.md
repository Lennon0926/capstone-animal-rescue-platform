# Web — Next.js Frontend

The animal rescue platform frontend, built with Next.js (Pages Router), React, TypeScript, and Tailwind CSS.

## Pages

| Route | Description |
|-------|-------------|
| `/home` | Landing page — hero, mission, animal cards, adoption steps, donation banner |
| `/adopt` | Animal listing with search, species/tag filters, and pagination |
| `/adopt/[id]` | Animal detail page |
| `/about` | Organization info — mission, history, values, team, contact |
| `/blog` | Blog |
| `/donation` | Donation page |

## Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Lint
npm run lint

# Production build
npm run build
```

Requires `NEXT_PUBLIC_API_BASE_URL` pointing to the backend (default: `http://localhost:4000`).
Copy `.env.example` → `.env.local` and fill in values.

## Testing

```bash
# Unit tests (Jest + React Testing Library)
npm test

# E2E tests (Playwright — Desktop Chrome)
npm run test:e2e
```

E2E tests live in `e2e/` and use a lightweight mock API server (port 4001) so no real backend is needed. The mock server starts automatically via `globalSetup`.

### E2E test files

| File | Page covered |
|------|-------------|
| `e2e/home.spec.ts` | `/home` |
| `e2e/about.spec.ts` | `/about` |
| `e2e/adopt.spec.ts` | `/adopt` |
| `e2e/adopt-detail.spec.ts` | `/adopt/[id]` |
| `e2e/blog.spec.ts` | `/blog` |
| `e2e/donation.spec.ts` | `/donation` |
