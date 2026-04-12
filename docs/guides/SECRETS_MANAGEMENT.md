# Secrets Management

This document describes all required environment variables, how to configure them for local development and CI/CD, and how to rotate them safely.

---

## Environment Variables Reference

### Backend (`apps/server`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Port the Express server listens on (default: `4000`) |
| `SUPABASE_URL` | Yes | Supabase project URL — from _Project Settings > API_ |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key — **keep secret**, bypasses RLS |
| `R2_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Yes | Cloudflare R2 API token access key ID |
| `R2_SECRET_ACCESS_KEY` | Yes | Cloudflare R2 API token secret access key |
| `R2_BUCKET_NAME` | Yes | Name of the R2 bucket for image uploads |
| `R2_PUBLIC_BASE_URL` | No | Public CDN URL for R2 objects (e.g., `https://cdn.example.com`) |
| `R2_MAX_IMAGE_SIZE_BYTES` | No | Upload size limit in bytes (default: `5242880` = 5 MB) |

### Frontend (`apps/web`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Base URL of the backend API |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (same as backend) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key — safe for client-side use |
| `NEXT_PUBLIC_GOOGLE_FORM_URL` | No | URL for the adoption application Google Form |

---

## Local Development Setup

1. Copy the example files:
   ```bash
   cp apps/server/.env.example apps/server/.env.local
   cp apps/web/.env.example apps/web/.env.local
   ```

2. Fill in your values in each `.env.local` file.

3. **Never commit `.env.local`** — it is listed in `.gitignore`.

---

## GitHub Actions Secrets

All required variables must be added as **repository secrets** so CI/CD can access them.

### How to add secrets

1. Go to your repository on GitHub.
2. Navigate to **Settings > Secrets and variables > Actions**.
3. Click **New repository secret** for each variable below.

### Required secrets

**Backend:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

**Frontend:**
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The CI pipeline validates that all required secrets are present before running any build or test jobs (see `.github/workflows/ci.yml` → `validate-secrets` job).

---

## Deployment Platform Secrets

### Railway (Backend)

1. Open your Railway project and select the backend service.
2. Go to **Variables** and add each backend environment variable from the table above.
3. Railway injects these at runtime — no `.env` file is needed in production.

### Vercel (Frontend)

1. Open your Vercel project and go to **Settings > Environment Variables**.
2. Add each frontend environment variable, setting the correct environment scope (Production / Preview / Development).
3. Redeploy after adding variables for them to take effect.

---

## Secret Rotation Procedures

### Supabase Service Role Key

1. Go to **Supabase Dashboard > Project Settings > API**.
2. Generate a new service role key.
3. Update `SUPABASE_SERVICE_ROLE_KEY` in:
   - GitHub repository secrets
   - Railway environment variables
   - Your local `.env.local` file
4. Redeploy the backend.
5. Verify the application is working, then revoke the old key in Supabase.

### Cloudflare R2 API Token

1. Go to **Cloudflare Dashboard > R2 > Manage R2 API Tokens**.
2. Create a new API token with the same permissions.
3. Update `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in:
   - GitHub repository secrets
   - Railway environment variables
   - Your local `.env.local` file
4. Redeploy the backend.
5. Delete the old API token in Cloudflare.

### Supabase Anon Key

The anon key is safe to expose client-side, but rotate it if you suspect compromise:

1. Go to **Supabase Dashboard > Project Settings > API**.
2. Rotate the anon key.
3. Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_ANON_KEY` (if used on the backend) in all locations.
4. Redeploy both frontend and backend.

### General Rotation Checklist

- [ ] Generate the new secret in the service dashboard.
- [ ] Update GitHub repository secrets.
- [ ] Update Railway variables (backend).
- [ ] Update Vercel variables (frontend).
- [ ] Update local `.env.local` files for all developers (communicate via secure channel).
- [ ] Trigger a new deployment and verify.
- [ ] Revoke / delete the old secret.
- [ ] Record the rotation date in your team's security log.

---

## Security Notes

- The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security (RLS). Treat it like a root password — never expose it client-side or log it.
- `NEXT_PUBLIC_*` variables are bundled into the client-side JavaScript. Only place non-sensitive configuration there.
- Rotate all secrets immediately if you suspect any have been exposed (e.g., accidentally committed to git).
- Use `git log --all -S 'secret_value'` to audit git history for accidental secret exposure.
