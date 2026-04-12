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

kill_tree() {
  local pid="$1"
  local child

  for child in $(pgrep -P "$pid" 2>/dev/null || true); do
    kill_tree "$child"
  done

  kill "$pid" >/dev/null 2>&1 || true
}

cleanup() {
  local exit_code=$?

  trap - EXIT INT TERM

  for pid in "${WEB_PID:-}" "${SERVER_PID:-}"; do
    if [ -n "${pid:-}" ] && kill -0 "$pid" >/dev/null 2>&1; then
      kill_tree "$pid"
    fi
  done

  wait "${WEB_PID:-}" "${SERVER_PID:-}" 2>/dev/null || true
  exit "$exit_code"
}

trap cleanup EXIT INT TERM

echo "Starting API server (apps/server)..."
(
  cd "$SERVER_DIR"
  exec npm run dev
) &
SERVER_PID=$!

if [ -d "$WEB_DIR/.next/dev" ]; then
  echo "Clearing stale Next.js dev state (apps/web/.next/dev)..."
  rm -rf "$WEB_DIR/.next/dev"
fi

echo "Starting web app (apps/web)..."
(
  cd "$WEB_DIR"
  exec npm run dev
) &
WEB_PID=$!

while true; do
  if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    if wait "$SERVER_PID"; then
      exit 0
    else
      exit $?
    fi
  fi

  if ! kill -0 "$WEB_PID" >/dev/null 2>&1; then
    if wait "$WEB_PID"; then
      exit 0
    else
      exit $?
    fi
  fi

  sleep 1
done
