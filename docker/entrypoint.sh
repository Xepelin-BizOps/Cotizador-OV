#!/bin/sh
set -e

# Si APP_SECRETS trae JSON con DATABASE_URL/JWT_SECRET, expórtalos
if [ -n "$APP_SECRETS" ]; then
  DB_FROM_JSON=$(echo "$APP_SECRETS" | jq -r '.DATABASE_URL // empty' 2>/dev/null || true)
  JWT_FROM_JSON=$(echo "$APP_SECRETS" | jq -r '.JWT_SECRET // empty' 2>/dev/null || true)

  if [ -z "$DATABASE_URL" ] && [ -n "$DB_FROM_JSON" ]; then
    export DATABASE_URL="$DB_FROM_JSON"
  fi
  if [ -z "$JWT_SECRET" ] && [ -n "$JWT_FROM_JSON" ]; then
    export JWT_SECRET="$JWT_FROM_JSON"
  fi
fi

exec "$@"
