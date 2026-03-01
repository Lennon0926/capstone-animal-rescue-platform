#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/apps/server"
WEB_DIR="$ROOT_DIR/apps/web"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but not found in PATH."
  exit 1
fi

if [ ! -f "$SERVER_DIR/package.json" ] || [ ! -f "$WEB_DIR/package.json" ]; then
  echo "Expected apps/server and apps/web package.json files were not found."
  exit 1
fi

cleanup() {
  if [ -n "${SERVER_PID:-}" ]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting API server (apps/server)..."
(
  cd "$SERVER_DIR"
  npm run dev
) &
SERVER_PID=$!

echo "Starting web app (apps/web)..."
cd "$WEB_DIR"
npm run dev
