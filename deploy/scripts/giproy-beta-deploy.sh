#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-$APP_ROOT/deploy/docker-compose.beta.yml}"
ENV_FILE="${ENV_FILE:-$APP_ROOT/deploy/.env}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-1}"
RUN_BACKUP="${RUN_BACKUP:-1}"
GIPROY_IMAGE_TAG="${GIPROY_IMAGE_TAG:-local}"
GIPROY_RELEASE_REF="${GIPROY_RELEASE_REF:-}"
export GIPROY_IMAGE_TAG

cd "$APP_ROOT"

if [ -z "$GIPROY_RELEASE_REF" ]; then
  echo "GIPROY_RELEASE_REF must be the immutable full Git commit for this release." >&2
  exit 1
fi
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Refusing deployment: APP_ROOT is not a Git checkout." >&2
  exit 1
fi
RELEASE_COMMIT="$(git rev-parse HEAD)"
if [ "$RELEASE_COMMIT" != "$GIPROY_RELEASE_REF" ]; then
  echo "Refusing deployment: GIPROY_RELEASE_REF does not match HEAD ($RELEASE_COMMIT)." >&2
  exit 1
fi
if [ -n "$(git status --porcelain --untracked-files=all)" ]; then
  echo "Refusing deployment: Git checkout has local or untracked changes." >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE" >&2
  echo "Create it from env/giproy-beta.env.example and fill strong secrets." >&2
  exit 1
fi

echo "== GiProy beta deploy =="
echo "Release image tag: $GIPROY_IMAGE_TAG"
echo "Release commit: $RELEASE_COMMIT"
bash ./deploy/scripts/giproy-beta-preflight.sh

# The public manifest identifies the deployed URL but never prints values from
# the environment file. It is sourced again below for migrations.
REQUESTED_IMAGE_TAG="$GIPROY_IMAGE_TAG"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
GIPROY_IMAGE_TAG="$REQUESTED_IMAGE_TAG"
export GIPROY_IMAGE_TAG

# `--env-file` has precedence for Compose interpolation. Preserve the secret
# environment file but materialize a private, per-release override so build and
# up resolve the identical image tag.
COMPOSE_ENV_FILE="$(mktemp)"
cleanup_release_files() {
  rm -f "$COMPOSE_ENV_FILE"
  [ -n "${FRONTEND_EVIDENCE_ROOT:-}" ] && rm -rf "$FRONTEND_EVIDENCE_ROOT"
}
trap cleanup_release_files EXIT
grep -v '^GIPROY_IMAGE_TAG=' "$ENV_FILE" > "$COMPOSE_ENV_FILE"
printf 'GIPROY_IMAGE_TAG=%s\n' "$GIPROY_IMAGE_TAG" >> "$COMPOSE_ENV_FILE"
compose() { docker compose --env-file "$COMPOSE_ENV_FILE" -f "$COMPOSE_FILE" "$@"; }

if [ "$RUN_BACKUP" = "1" ]; then
  bash ./deploy/scripts/giproy-beta-backup.sh
fi

echo
echo "-- Build backend image for release inventory --"
compose build backend

echo
echo "-- Generate public legal evidence --"
FRONTEND_EVIDENCE_ROOT="$(mktemp -d)"
cp frontend/package.json frontend/package-lock.json "$FRONTEND_EVIDENCE_ROOT/"
docker run --rm --user "$(id -u):$(id -g)" -v "$FRONTEND_EVIDENCE_ROOT:/work" -w /work node:22-alpine npm ci --ignore-scripts >/dev/null
python3 scripts/compliance/generate_release_evidence.py \
  --root "$APP_ROOT" \
  --output "dist/compliance/$GIPROY_IMAGE_TAG" \
  --public-output "frontend/public/legal/release" \
  --frontend-root "$FRONTEND_EVIDENCE_ROOT" \
  --local-image "giproy-beta-backend:$GIPROY_IMAGE_TAG" \
  --image "frontend=giproy-beta-frontend:$GIPROY_IMAGE_TAG" \
  --image "backend=giproy-beta-backend:$GIPROY_IMAGE_TAG" \
  --deployment-url "${GIPROY_HOST:-}"

echo
echo "-- Build frontend image with evidence --"
compose build frontend

echo
echo "-- Start database --"
compose up -d postgres

if [ "$RUN_MIGRATIONS" = "1" ]; then
  echo
  echo "-- Resolve database schema --"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  TABLE_COUNT="$(compose exec -T postgres \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
    "select count(*) from information_schema.tables where table_schema = 'public' and table_name <> 'alembic_version';" | tr -d '[:space:]')"

  if [ "${TABLE_COUNT:-0}" = "0" ]; then
    echo "Empty schema detected; running controlled bootstrap and stamping Alembic heads."
    compose --profile tools run --rm bootstrap
  else
    echo "Existing schema detected; running Alembic migrations."
    compose --profile tools run --rm migrate
  fi
else
  echo "Migrations skipped because RUN_MIGRATIONS=$RUN_MIGRATIONS"
fi

echo
echo "-- Start app --"
compose up -d backend frontend

echo
echo "-- Status --"
compose ps

echo
echo "Deploy command finished."
