# Rollback Procedures

This document covers how to revert a bad deployment for the web (Next.js on Vercel) and server (Express on Vercel).

---

## Option 1 – Instant Rollback via Vercel Dashboard (fastest)

Vercel keeps every successful deployment and lets you promote any prior one to production instantly.

1. Open the [Vercel dashboard](https://vercel.com/dashboard) and select the project (web or server).
2. Go to **Deployments**.
3. Find the last known-good deployment and click **⋯ → Promote to Production**.
4. Vercel instantly swaps the production alias — no rebuild required.

Repeat for the other project if both were affected.

---

## Option 2 – Rollback via Vercel CLI

```bash
# List recent deployments
vercel ls <project-name>

# Promote a specific deployment URL to production
vercel promote <deployment-url> --token="$VERCEL_TOKEN"
```

---

## Option 3 – Git Revert and Redeploy

Use this when the bad code is already merged to `main` and you want a clean history.

```bash
# Identify the bad commit
git log --oneline main

# Revert it (creates a new commit, safe for shared history)
git revert <bad-commit-sha>

# Push — the CD pipeline redeploys automatically
git push origin main
```

> Do **not** use `git reset --hard` + force-push on `main`. It rewrites shared history and can corrupt teammates' local branches.

---

## Option 4 – Environment Variable Rollback

If the incident was caused by a bad env var (e.g., wrong Supabase key):

1. In the Vercel dashboard go to **Project → Settings → Environment Variables**.
2. Correct or restore the variable.
3. Trigger a redeployment by clicking **Redeploy** on the last production deployment (no code change needed).

---

## Verifying a Rollback

After any rollback, confirm the service is healthy:

```bash
# Server health check
curl https://<server-production-url>/health
curl https://<server-production-url>/ready

# Web root
curl -I https://<web-production-url>
```

Both endpoints must return `200` before closing the incident.

---

## Preventing Future Issues

- The `staging` environment (auto-deployed from `develop`) is the first validation gate.
- Smoke tests on `/health` and `/ready` run automatically after every deployment.
- Never merge to `main` without a passing CI run and a verified staging deployment.
