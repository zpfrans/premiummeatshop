#!/usr/bin/env sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

mkdir -p backups
timestamp="$(date +%Y%m%d-%H%M%S)"
output_file="backups/farmerpremium-${timestamp}.dump"

pg_dump "$DATABASE_URL" -Fc -f "$output_file"
echo "Backup created: $output_file"
