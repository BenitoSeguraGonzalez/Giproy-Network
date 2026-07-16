#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-$APP_ROOT/deploy/docker-compose.beta.yml}"
ENV_FILE="${ENV_FILE:-$APP_ROOT/deploy/.env}"
SEED_FILE="${SEED_FILE:-$APP_ROOT/deploy/giproy-local-seed.sql}"

cd "$APP_ROOT"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

if [ ! -f "$SEED_FILE" ]; then
  echo "Missing seed file: $SEED_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

echo "== Reset GiProy beta database =="
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down -v --remove-orphans
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d postgres

echo "== Wait for PostgreSQL =="
for _ in $(seq 1 90); do
  if docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
    pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "== Import seed =="
case "$SEED_FILE" in
  *.sql)
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
      psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$SEED_FILE"
    ;;
  *.tar.gz|*.tgz)
    tmp_sql="$APP_ROOT/deploy/.seed-import.sql"
    tar -xOzf "$SEED_FILE" > "$tmp_sql"
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
      psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$tmp_sql"
    rm -f "$tmp_sql"
    ;;
  *.gz)
    gunzip -c "$SEED_FILE" | docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
      psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"
    ;;
  *)
    echo "Unsupported seed format: $SEED_FILE" >&2
    exit 1
    ;;
esac

echo "== Run Alembic migrations =="
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --profile tools run --rm migrate

echo "== Start app =="
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d backend frontend
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
