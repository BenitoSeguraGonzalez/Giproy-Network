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
  : "${GIPROY_APP_VERSION:?GIPROY_APP_VERSION is required in .env}"
  : "${VITE_ADAPTIVE_UI_ENABLED:?VITE_ADAPTIVE_UI_ENABLED is required in .env}"
  if [ "$VITE_ADAPTIVE_UI_ENABLED" != "true" ]; then
    echo "VITE_ADAPTIVE_UI_ENABLED must be true for the adaptive beta: $VITE_ADAPTIVE_UI_ENABLED" >&2
    exit 1
  fi
  if ! [[ "$GIPROY_APP_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([+-][0-9A-Za-z.-]+)?$ ]]; then
    echo "GIPROY_APP_VERSION must be a valid SemVer value: $GIPROY_APP_VERSION" >&2
    exit 1
  fi
  PACKAGE_VERSION="$(sed -n 's/^[[:space:]]*\"version\":[[:space:]]*\"\([^\"]*\)\".*/\1/p' "$APP_ROOT/frontend/package.json" | head -n 1)"
  if [ "$GIPROY_APP_VERSION" != "$PACKAGE_VERSION" ]; then
    echo "Version mismatch: deploy=$GIPROY_APP_VERSION package=$PACKAGE_VERSION" >&2
    exit 1
  fi
  echo "GIPROY_HOST=$GIPROY_HOST"
  echo "GIPROY_APP_VERSION=$GIPROY_APP_VERSION"
  echo "VITE_ADAPTIVE_UI_ENABLED=$VITE_ADAPTIVE_UI_ENABLED"
fi

echo
echo "-- Compose config --"
if [ -f "$COMPOSE_FILE" ] && [ -f "$ENV_FILE" ]; then
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config --quiet
  echo "compose config: OK"
else
  echo "compose config: skipped"
fi
