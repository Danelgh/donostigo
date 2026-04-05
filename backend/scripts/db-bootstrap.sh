#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SCHEMA_FILE="$SCRIPT_DIR/../../database/schema.sql"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

TARGET_DATABASE_URL="${1:-${DATABASE_URL:-}}"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "No se ha encontrado el esquema SQL en: $SCHEMA_FILE" >&2
  exit 1
fi

if [ -z "$TARGET_DATABASE_URL" ]; then
  echo "Uso: DATABASE_URL=postgresql://... npm run db:bootstrap" >&2
  echo "o bien: npm run db:bootstrap -- postgresql://..." >&2
  exit 1
fi

echo "Aplicando schema.sql sobre la base configurada..."
psql "$TARGET_DATABASE_URL" -f "$SCHEMA_FILE"
echo "Base de datos reinicializada correctamente."
