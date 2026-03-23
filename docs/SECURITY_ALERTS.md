# Handling Security Alerts

## Dependabot

Dependabot automatically opens PRs to update dependencies weekly (every Monday). PRs are grouped so minor and patch updates arrive as a single PR per app.

**Review process:**
1. Check the Dependabot PR description for changelog links.
2. Run CI locally or let it run in the PR.
3. Merge if CI passes and no breaking changes are noted.

**If a Dependabot PR breaks CI:**
- Read the changelog for breaking changes.
- Update any affected code, then push to the Dependabot branch or close and fix manually.

## CodeQL

CodeQL runs automatically on every pull request and on a weekly schedule (Monday 03:00 UTC). Results appear in the **Security > Code scanning alerts** tab.

**Severity guidance:**
- **Critical / High:** Must be resolved before merging the PR that introduced the alert.
- **Medium:** Should be resolved within the current sprint.
- **Low / Informational:** Address opportunistically or dismiss with a note.

**Dismissing a false positive:**
1. Open the alert in the Security tab.
2. Click **Dismiss alert** and select the reason (false positive, used in tests, won't fix).
3. Add a brief comment explaining the decision.

## npm audit

`npm audit --audit-level=high` runs in CI for both `apps/server` and `apps/web` on every push and PR. The job fails only on **high** or **critical** severity vulnerabilities.

**To resolve a failing audit:**
```bash
# In the affected app directory
npm audit
npm audit fix          # auto-fix compatible updates
npm audit fix --force  # upgrade majors (review carefully)
```

If no fix is available yet, check the advisory for a workaround and open a tracking issue.
