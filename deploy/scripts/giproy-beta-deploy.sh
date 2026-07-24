#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-$APP_ROOT/deploy/docker-compose.beta.yml}"
ENV_FILE="${ENV_FILE:-$APP_ROOT/deploy/.env}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-1}"
RUN_BACKUP="${RUN_BACKUP:-1}"

cd "$APP_ROOT"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE" >&2
  echo "Create it from env/giproy-beta.env.example and fill strong secrets." >&2
  exit 1
fi

echo "== GiProy beta deploy =="
./deploy/scripts/giproy-beta-preflight.sh

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if docker container inspect giproy-beta-frontend >/dev/null 2>&1; then
  CURRENT_VERSION="$(docker exec giproy-beta-frontend sh -c 'cat /usr/share/nginx/html/version.json 2>/dev/null || true')"
  if printf '%s' "$CURRENT_VERSION" | grep -Fq "\"version\":\"$GIPROY_APP_VERSION\"" \
    && [ "${ALLOW_SAME_VERSION_REDEPLOY:-0}" != "1" ]; then
    echo "Refusing deploy: version $GIPROY_APP_VERSION is already active." >&2
    echo "Increment frontend/package.json and GIPROY_APP_VERSION first." >&2
    echo "Use ALLOW_SAME_VERSION_REDEPLOY=1 only for an explicit recovery/rollback." >&2
    exit 1
  fi
fi

if [ "$RUN_BACKUP" = "1" ]; then
  ./deploy/scripts/giproy-beta-backup.sh
fi

echo
echo "-- Build images --"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build

echo
echo "-- Start database --"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d postgres

if [ "$RUN_MIGRATIONS" = "1" ]; then
  echo
  echo "-- Resolve database schema --"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  TABLE_COUNT="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
    "select count(*) from information_schema.tables where table_schema = 'public' and table_name <> 'alembic_version';" | tr -d '[:space:]')"

  if [ "${TABLE_COUNT:-0}" = "0" ]; then
    echo "Empty schema detected; running controlled bootstrap and stamping Alembic heads."
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --profile tools run --rm bootstrap
  else
    echo "Existing schema detected; running Alembic migrations."
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --profile tools run --rm migrate
  fi
else
  echo "Migrations skipped because RUN_MIGRATIONS=$RUN_MIGRATIONS"
fi

echo
echo "-- Start app --"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d backend frontend

echo
echo "-- Status --"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

DEPLOYED_VERSION="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T frontend wget -qO- http://127.0.0.1/version.json)"
printf '%s' "$DEPLOYED_VERSION" | grep -Fq "\"version\":\"$GIPROY_APP_VERSION\"" || {
  echo "Deployed version verification failed: $DEPLOYED_VERSION" >&2
  exit 1
}
echo "Application version verified: $GIPROY_APP_VERSION"

echo
echo "Deploy command finished."
