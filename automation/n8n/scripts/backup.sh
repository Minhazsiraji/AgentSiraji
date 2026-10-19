#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
test -f .env || { echo "Missing .env"; exit 1; }
set -a; source .env; set +a
umask 077
mkdir -p backups
out="backups/business-os-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
docker compose --env-file .env exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip -9 > "$out"
test -s "$out"
echo "Database backup written to $out"
echo "IMPORTANT: copy securely OFF the VM. Safeguard the encryption key in an independent secret store."
echo "Also back up the n8n_data Docker volume when workflows may use filesystem binary data."
