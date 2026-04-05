#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BACKEND_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
PROJECT_DIR=$(CDPATH= cd -- "$BACKEND_DIR/.." && pwd)
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "==> Build frontend"
(cd "$FRONTEND_DIR" && npm run build)

echo "==> Verify database schema"
if [ -n "${1:-}" ]; then
  (cd "$BACKEND_DIR" && npm run db:verify -- "$1")
else
  (cd "$BACKEND_DIR" && npm run db:verify)
fi

echo "==> Smoke API"
(cd "$BACKEND_DIR" && npm run smoke)

echo "Release check completado."
