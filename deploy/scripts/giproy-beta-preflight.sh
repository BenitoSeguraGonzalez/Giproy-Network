#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-$APP_ROOT/deploy/docker-compose.beta.yml}"
ENV_FILE="${ENV_FILE:-$APP_ROOT/deploy/.env}"

echo "== GiProy beta preflight =="
echo "Host: $(hostname)"
echo "User: $(whoami)"
echo "App root: $APP_ROOT"

echo
echo "-- System --"
uname -a
nproc | awk '{print "CPU cores: "$1}'
free -h
df -h / "$HOME" 2>/dev/null || df -h /

echo
echo "-- Docker --"
docker --version
docker compose version
docker network inspect proxy >/dev/null && echo "network proxy: OK"
docker network inspect backend >/dev/null && echo "network backend: OK"

echo
echo "-- Existing containers --"
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'

echo
echo "-- GiProy files --"
test -f "$COMPOSE_FILE" && echo "compose: OK" || echo "compose: MISSING $COMPOSE_FILE"
test -f "$ENV_FILE" && echo "env: OK" || echo "env: MISSING $ENV_FILE"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  : "${GIPROY_HOST:?GIPROY_HOST is required in .env}"
  echo "GIPROY_HOST=$GIPROY_HOST"
fi

echo
echo "-- Compose config --"
if [ -f "$COMPOSE_FILE" ] && [ -f "$ENV_FILE" ]; then
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config --quiet
  echo "compose config: OK"
else
  echo "compose config: skipped"
fi
