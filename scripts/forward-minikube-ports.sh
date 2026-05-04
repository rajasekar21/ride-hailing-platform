#!/usr/bin/env bash
set -euo pipefail

echo "Setting up Minikube port-forwarding..."

mkdir -p logs

PORTS=(3000 3001 3002 3003 3004 3005 3006)

stop_compose_stack() {
  if docker compose version >/dev/null 2>&1; then
    if docker compose ps --services --filter status=running 2>/dev/null | grep -q .; then
      echo "Stopping Docker Compose stack to free Minikube port-forward ports..."
      docker compose down --remove-orphans >/dev/null 2>&1 || true
    fi
  elif command -v docker-compose >/dev/null 2>&1; then
    if docker-compose ps --services --filter status=running 2>/dev/null | grep -q .; then
      echo "Stopping Docker Compose stack to free Minikube port-forward ports..."
      docker-compose down --remove-orphans >/dev/null 2>&1 || true
    fi
  fi
}

print_port_owner() {
  local port="$1"
  echo "Port ${port} is already in use:" >&2
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp "sport = :${port}" >&2 || true
  elif command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"${port}" -sTCP:LISTEN >&2 || true
  else
    echo "Install ss or lsof to inspect the owning process." >&2
  fi
}

port_is_busy() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "sport = :${port}" | grep -q ":${port}"
  elif command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1
  else
    return 1
  fi
}

stop_compose_stack
pkill -f "kubectl port-forward" || true
sleep 2

busy=false
for port in "${PORTS[@]}"; do
  if port_is_busy "$port"; then
    print_port_owner "$port"
    busy=true
  fi
done

if [[ "$busy" == true ]]; then
  echo "FAILED: one or more required ports are busy. Stop the listed process and rerun ./scripts/forward-minikube-ports.sh." >&2
  exit 1
fi

start_forward() {
  local name="$1"
  local local_port="$2"
  local remote_port="$3"
  local log_file="logs/${name}-pf.log"

  : > "$log_file"
  nohup kubectl port-forward "deployment/${name}" "${local_port}:${remote_port}" > "$log_file" 2>&1 &
  echo "$!" > "logs/${name}-pf.pid"
}

start_forward ride 3000 3000
start_forward user 3001 3000
start_forward driver 3002 3000
start_forward payment 3003 3000
start_forward notification 3004 3000
start_forward rating 3005 3000
start_forward auth 3006 3000

sleep 5

failed=false
for name in ride user driver payment notification rating auth; do
  pid_file="logs/${name}-pf.pid"
  if [[ ! -s "$pid_file" ]] || ! kill -0 "$(cat "$pid_file")" >/dev/null 2>&1; then
    echo "FAILED: port-forward for ${name} is not running" >&2
    cat "logs/${name}-pf.log" >&2 || true
    failed=true
  fi
done

if [[ "$failed" == true ]]; then
  exit 1
fi

echo "Port forwarding ready"

./scripts/expose-codespace-ports.sh "${PORTS[@]}"
