#!/usr/bin/env bash
set -euo pipefail

export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

RESTIC_IMAGE="${RESTIC_IMAGE:-restic/restic:0.18.0}"
REPOSITORY="${RESTIC_REPOSITORY:-/opt/backups/restic}"
PASSWORD_FILE="${RESTIC_PASSWORD_FILE:-/home/benito/.config/restic/password}"
LOGFILE="${RESTIC_LOGFILE:-/home/benito/logs/restic-backup.log}"

mkdir -p "$REPOSITORY" "$(dirname "$PASSWORD_FILE")" "$(dirname "$LOGFILE")"
chmod 700 "$(dirname "$PASSWORD_FILE")"
chmod 600 "$PASSWORD_FILE"

restic_cmd() {
  docker run --rm \
    -e RESTIC_REPOSITORY=/repo \
    -e RESTIC_PASSWORD_FILE=/run/secrets/restic_password \
    -v "$REPOSITORY:/repo" \
    -v "$PASSWORD_FILE:/run/secrets/restic_password:ro" \
    -v /home/benito:/data/home/benito:ro \
    -v /home/benito/scripts:/data/home/benito/scripts:ro \
    -v /etc:/data/etc:ro \
    -v /opt/backups/postgresql:/data/opt/backups/postgresql:ro \
    -v /var/lib/docker/volumes:/data/var/lib/docker/volumes:ro \
    "$RESTIC_IMAGE" "$@"
}

if ! restic_cmd snapshots >/dev/null 2>&1; then
  restic_cmd init
fi

restic_cmd backup \
  /data/home/benito/docker \
  /data/home/benito/scripts \
  /data/etc/cloudflared \
  /data/etc/systemd/system \
  /data/etc/cron.d \
  /data/etc/cron.daily \
  /data/etc/cron.hourly \
  /data/etc/cron.monthly \
  /data/etc/cron.weekly \
  /data/opt/backups/postgresql \
  /data/var/lib/docker/volumes \
  --tag daily \
  --host giproy-beta \
  --exclude '**/.cache/**' \
  --exclude '**/node_modules/**' \
  --exclude '**/.capture-browser/**' 2>&1 | tee -a "$LOGFILE"

restic_cmd forget --tag daily --host giproy-beta --keep-last 3 --prune 2>&1 | tee -a "$LOGFILE"
restic_cmd check --read-data-subset=5% 2>&1 | tee -a "$LOGFILE"
