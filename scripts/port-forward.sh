#!/usr/bin/env bash
set -euo pipefail

echo "Setting up Minikube port-forwarding..."

mkdir -p logs

pkill -f "kubectl port-forward" || true

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

./scripts/expose-codespace-ports.sh 3000 3001 3002 3003 3004 3005 3006
