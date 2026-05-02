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

"${COMPOSE[@]}" ps

echo
echo "Health checks:"

down_services=()

check() {
  local name="$1"
  local url="$2"
  if curl -fsS --max-time 2 "$url" >/dev/null 2>&1; then
    printf "  %-14s OK     %s\n" "$name" "$url"
  else
    printf "  %-14s DOWN   %s\n" "$name" "$url"
    down_services+=("$name")
  fi
}

check "ride" "http://localhost:3000/health"
check "user" "http://localhost:3001/health"
check "driver" "http://localhost:3002/health"
check "payment" "http://localhost:3003/health"
check "notification" "http://localhost:3004/health"
check "rating" "http://localhost:3005/health"
check "auth" "http://localhost:3006/health"
check "frontend" "http://localhost:5173"
check "prometheus" "http://localhost:9090/-/ready"
check "grafana" "http://localhost:3007/api/health"

if [[ "${#down_services[@]}" -gt 0 ]]; then
  echo
  echo "Recent logs for DOWN services:"
  for service in "${down_services[@]}"; do
    case "$service" in
      frontend|prometheus|grafana)
        continue
        ;;
    esac
    echo
    echo "----- $service -----"
    "${COMPOSE[@]}" logs --no-color --tail=60 "$service" || true
  done

  echo
  echo "Next useful commands:"
  echo "  ./scripts/codespace-logs.sh --follow ${down_services[*]}"
  echo "  ./scripts/codespace-start.sh --reset"
fi
