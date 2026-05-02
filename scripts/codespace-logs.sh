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

follow=false
tail_lines=100
services=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -f|--follow)
      follow=true
      shift
      ;;
    --tail)
      tail_lines="$2"
      shift 2
      ;;
    *)
      services+=("$1")
      shift
      ;;
  esac
done

if [[ "${#services[@]}" -eq 0 ]]; then
  services=(user driver ride payment notification rating auth frontend prometheus grafana rabbitmq)
fi

args=(logs --no-color --tail="$tail_lines")
if [[ "$follow" == true ]]; then
  args+=("--follow")
fi

"${COMPOSE[@]}" "${args[@]}" "${services[@]}"
