#!/usr/bin/env bash
set -euo pipefail

# Materialize an immutable Git checkout for a beta release. This never changes
# the live application directory; deploy from the printed APP_ROOT instead.
GIPROY_RELEASE_REPOSITORY="${GIPROY_RELEASE_REPOSITORY:?Set the Git repository URL}"
GIPROY_RELEASE_REF="${GIPROY_RELEASE_REF:?Set the full Git commit SHA}"
GIPROY_RELEASES_ROOT="${GIPROY_RELEASES_ROOT:-$HOME/giproy-releases}"

if ! [[ "$GIPROY_RELEASE_REF" =~ ^[0-9a-f]{40}$ ]]; then
  echo "GIPROY_RELEASE_REF must be a full 40-character lowercase commit SHA." >&2
  exit 1
fi

target="$GIPROY_RELEASES_ROOT/$GIPROY_RELEASE_REF"
if [ -e "$target" ]; then
  if [ ! -d "$target/.git" ] || [ "$(git -C "$target" rev-parse HEAD)" != "$GIPROY_RELEASE_REF" ] || [ -n "$(git -C "$target" status --porcelain --untracked-files=all)" ]; then
    echo "Existing release directory is not the requested clean checkout: $target" >&2
    exit 1
  fi
else
  mkdir -p "$GIPROY_RELEASES_ROOT"
  staging="$(mktemp -d "$GIPROY_RELEASES_ROOT/.staging.XXXXXX")"
  trap 'rm -rf "$staging"' EXIT
  git clone --no-checkout "$GIPROY_RELEASE_REPOSITORY" "$staging"
  git -C "$staging" checkout --detach "$GIPROY_RELEASE_REF"
  if [ "$(git -C "$staging" rev-parse HEAD)" != "$GIPROY_RELEASE_REF" ] || [ -n "$(git -C "$staging" status --porcelain --untracked-files=all)" ]; then
    echo "Resolved checkout is not a clean requested commit." >&2
    exit 1
  fi
  mv "$staging" "$target"
  trap - EXIT
fi

printf 'APP_ROOT=%q\nGIPROY_RELEASE_REF=%q\n' "$target" "$GIPROY_RELEASE_REF"
