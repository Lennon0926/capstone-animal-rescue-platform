#!/usr/bin/env bash
# run-audit.sh — Full audit pipeline for deployed app
#
# Usage:
#   ./run-audit.sh <web-url> <api-url>
#
# Example:
#   ./run-audit.sh https://animal-rescue-web.vercel.app https://animal-rescue-server.vercel.app
#
# Required env:
#   ANTHROPIC_API_KEY — for the report generator
#
# What it does:
#   1. Runs Jest in apps/server and apps/web  (no URL needed)
#   2. Runs Lighthouse against <web-url>
#   3. Runs pa11y + axe-core against <web-url>
#   4. Runs Artillery load test against <api-url>
#   5. Generates SVG charts from all collected data
#   6. Calls Claude API to write updated markdown sections

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Args ─────────────────────────────────────────────────────────────────────

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <web-url> <api-url>"
  echo "  web-url  — deployed Next.js frontend (e.g. https://your-app.vercel.app)"
  echo "  api-url  — deployed Express API      (e.g. https://your-api.vercel.app)"
  exit 1
fi

WEB_URL="${1%/}"
API_URL="${2%/}"

# ── Env checks ───────────────────────────────────────────────────────────────

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "[run-audit] ERROR: ANTHROPIC_API_KEY is not set"
  exit 1
fi

# ── Dependencies ─────────────────────────────────────────────────────────────

echo "[run-audit] Installing script dependencies..."
cd "$SCRIPT_DIR"
npm install --silent

# ── Step 1: Test results (no URL needed, runs locally) ───────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[run-audit] Step 1/5 — Jest test results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node "$SCRIPT_DIR/collect/test-results.js"

# ── Step 2: Lighthouse ────────────────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[run-audit] Step 2/5 — Lighthouse ($WEB_URL)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node "$SCRIPT_DIR/collect/lighthouse.js" "$WEB_URL"

# ── Step 3: Accessibility ─────────────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[run-audit] Step 3/5 — Accessibility audit ($WEB_URL)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node "$SCRIPT_DIR/collect/accessibility.js" "$WEB_URL"

# ── Step 4: Load test ─────────────────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[run-audit] Step 4/5 — Load test ($API_URL)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node "$SCRIPT_DIR/collect/load-test.js" "$API_URL"

# ── Step 5: Charts + report ───────────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[run-audit] Step 5a/5 — Generating charts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node "$SCRIPT_DIR/generate/charts.js"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[run-audit] Step 5b/5 — Generating report sections (Claude API)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node "$SCRIPT_DIR/generate/report.js"

# ── Done ─────────────────────────────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[run-audit] All done."
echo ""
echo "  Charts:  docs/reports/charts/*.svg"
echo "  Sections:"
echo "    docs/reports/section-3-1-lighthouse-audit.md"
echo "    docs/reports/section-3-2-load-test-results.md"
echo "    docs/reports/section-3-3-accessibility-audit.md"
echo "    docs/reports/section-3-4-test-results.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
