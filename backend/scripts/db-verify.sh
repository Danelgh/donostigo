#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ENV_FILE="$SCRIPT_DIR/../.env"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

TARGET_DATABASE_URL="${1:-${DATABASE_URL:-}}"

if [ -z "$TARGET_DATABASE_URL" ]; then
  echo "Uso: DATABASE_URL=postgresql://... npm run db:verify" >&2
  echo "o bien: npm run db:verify -- postgresql://..." >&2
  exit 1
fi

echo "Verificando tablas y columnas clave..."
psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1 -At <<'SQL'
SELECT 'saved_lists=' || EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'saved_lists'
);

SELECT 'saved_list_items=' || EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'saved_list_items'
);

SELECT 'business_services=' || EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'business_services'
);

SELECT 'business_requests=' || EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'business_requests'
);

SELECT 'reservation_waitlist=' || EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'reservation_waitlist'
);

SELECT 'business_schedule_rules=' || EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'business_schedule_rules'
);

SELECT 'business_schedule_exceptions=' || EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'business_schedule_exceptions'
);

SELECT 'businesses.service_mode=' || EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'service_mode'
);

SELECT 'businesses.hero_badge=' || EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'hero_badge'
);

SELECT 'reviews.business_response=' || EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'business_response'
);
SQL
