#!/bin/sh
set -eu

if [ "${DEBUG_DATABASE_URL_PRESENT:-false}" = "true" ]; then
  if [ -n "${DATABASE_URL:-}" ]; then
    echo "DATABASE_URL_PRESENT"
  else
    echo "DATABASE_URL_MISSING"
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is missing at runtime. Check Railway service variables."
  exit 1
fi

./node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma
exec node dist/index.js
