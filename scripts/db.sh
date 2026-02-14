#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source .env.db.local
exec psql "$DB_URL" "$@"
