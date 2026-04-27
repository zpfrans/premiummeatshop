#!/usr/bin/env sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

if [ $# -ne 1 ]; then
  echo "Usage: ./scripts/restore-postgres.sh <dump-file>"
  exit 1
fi

input_file="$1"
pg_restore --clean --no-owner --no-privileges -d "$DATABASE_URL" "$input_file"
echo "Restore completed from: $input_file"
