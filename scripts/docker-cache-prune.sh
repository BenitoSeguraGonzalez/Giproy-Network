#!/usr/bin/env bash
set -euo pipefail

LOGFILE="/home/benito/logs/docker-cache-prune.log"
mkdir -p "$(dirname "$LOGFILE")"
{
  echo "$(date '+%F %T') - inicio limpieza cache Docker"
  docker builder prune -af
  echo "$(date '+%F %T') - fin limpieza cache Docker"
} >> "$LOGFILE" 2>&1
