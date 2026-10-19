#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
test -f .env || { echo "ERROR: Copy .env.example to .env and configure it on the server."; exit 1; }
set -a
# .env is a private administrator-managed file on this VM only.
source .env
set +a
for key in N8N_DOMAIN N8N_VERSION POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD N8N_ENCRYPTION_KEY N8N_RUNNERS_AUTH_TOKEN; do
  test -n "${!key:-}" || { echo "ERROR: Missing $key"; exit 1; }
done
case "$N8N_DOMAIN" in *CHANGE_ME*|*.example|*localhost*) echo "ERROR: Set your actual DNS name"; exit 1;; esac
for key in POSTGRES_PASSWORD N8N_ENCRYPTION_KEY N8N_RUNNERS_AUTH_TOKEN; do
  value="${!key}"
  if [ "${#value}" -lt 40 ] || [[ "$value" == *CHANGE_ME* ]]; then
    echo "ERROR: $key must be a random secret with at least 40 characters"
    exit 1
  fi
done
command -v docker >/dev/null || { echo "ERROR: Docker missing"; exit 1; }
docker compose version >/dev/null
docker compose --env-file .env config --quiet
echo "Preflight OK: compose syntax and placeholder checks passed (NOT a live health check)."
