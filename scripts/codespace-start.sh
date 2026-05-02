#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose --ansi never)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose --ansi never)
else
  echo "Docker Compose is required." >&2
  exit 1
fi

reset=false
if [[ "${1:-}" == "--reset" ]]; then
  reset=true
fi

mkdir -p logs
log_file="logs/codespace-start.log"

{
  echo "[$(date -Is)] Starting ride-hailing platform"
  if [[ "$reset" == true ]]; then
    echo "[$(date -Is)] Resetting existing containers and volumes"
    "${COMPOSE[@]}" down -v --remove-orphans || true
  fi
  echo "[$(date -Is)] Building and starting containers"
  "${COMPOSE[@]}" up -d --build --quiet-pull --remove-orphans
  echo "[$(date -Is)] Startup command finished"
  "${COMPOSE[@]}" ps
} >"$log_file" 2>&1 &

pid="$!"

echo "Background startup launched."
echo "PID: $pid"
echo "Startup log: $log_file"
echo
echo "Check status:"
echo "  ./scripts/codespace-status.sh"
echo
echo "Follow startup log:"
echo "  tail -f $log_file"
echo
echo "Follow service logs:"
echo "  ./scripts/codespace-logs.sh --follow"
