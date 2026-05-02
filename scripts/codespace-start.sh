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
no_cache=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --reset)
      reset=true
      shift
      ;;
    --no-cache)
      no_cache=true
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Usage: $0 [--reset] [--no-cache]" >&2
      exit 1
      ;;
  esac
done

mkdir -p logs
log_file="logs/codespace-start.log"

{
  echo "[$(date -Is)] Starting ride-hailing platform"
  if [[ "$reset" == true ]]; then
    echo "[$(date -Is)] Resetting existing containers and volumes"
    "${COMPOSE[@]}" down -v --remove-orphans || true
  fi
  echo "[$(date -Is)] Building and starting containers"
  if [[ "$no_cache" == true ]]; then
    "${COMPOSE[@]}" build --no-cache --quiet
    "${COMPOSE[@]}" up -d --no-build --remove-orphans
  else
    "${COMPOSE[@]}" up -d --build --quiet-pull --remove-orphans
  fi
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
