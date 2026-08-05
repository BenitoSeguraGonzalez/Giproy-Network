#!/usr/bin/env bash
set -euo pipefail

export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ENV_FILE="/home/benito/docker/apps/giproy-beta/deploy/.env"
BACKUP_DIR="/opt/backups/postgresql"
DATE="$(date +%F)"
DEST="$BACKUP_DIR/$DATE"
LOGFILE="/home/benito/logs/postgresql-backup.log"

# shellcheck disable=SC1090
source "$ENV_FILE"
mkdir -p "$DEST" "$(dirname "$LOGFILE")"

docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" giproy-beta-postgres \
  pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB" \
  | gzip -c > "$DEST/${POSTGRES_DB}.dump.gz"

find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime +3 -exec rm -rf {} +
echo "$(date '+%F %T') - backup PostgreSQL incremental source actualizado: $DEST" >> "$LOGFILE"
