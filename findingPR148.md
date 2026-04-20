# PR 148 Findings

## Summary

PR 148 was failing because the server CI job stopped at `npm audit --audit-level=high` before running syntax checks or tests.

## Root Cause

- Failing check: `CI / Server – install, validate & test`
- Failing step: `npm audit --audit-level=high`
- Advisory: `GHSA-xq3m-2v4x-88gg`
- Package: `protobufjs`
- Severity: `critical`
- Vulnerable range: `<7.5.5`

The issue came from the server dependency tree, not from the medical-record feature code itself.

## Verification

The following checks were confirmed locally:

- `apps/server`: `npm audit --audit-level=high` initially failed because of `protobufjs`
- `apps/server`: `npm test -- --runInBand` passed before the fix

## Resolution

The server package was updated to force a safe `protobufjs` version through `overrides`.

Files changed:

- `apps/server/package.json`
- `apps/server/package-lock.json`

After refreshing the lockfile, `protobufjs` resolved to a non-vulnerable version and the audit passed.

## Post-Fix Validation

- `apps/server`: `npm audit --audit-level=high` -> `found 0 vulnerabilities`
- `apps/server`: `npm test -- --runInBand` -> `8` suites passed, `105` tests passed

## Commit

- Commit pushed: `5f03932`
- Message: `fix(server): override vulnerable protobufjs`