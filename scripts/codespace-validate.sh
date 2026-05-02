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

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
mkdir -p logs
compose_log="logs/codespace-validate-compose.log"

request() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local headers=("${@:4}")
  local output="$tmp_dir/response.json"
  local status

  if [[ -n "$body" ]]; then
    status="$(curl -sS -o "$output" -w "%{http_code}" -X "$method" "$url" \
      -H "Content-Type: application/json" "${headers[@]}" -d "$body")"
  else
    status="$(curl -sS -o "$output" -w "%{http_code}" -X "$method" "$url" "${headers[@]}")"
  fi

  echo "$status"
}

expect_status() {
  local expected="$1"
  local actual="$2"
  local label="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "FAILED: $label expected HTTP $expected but got $actual" >&2
    cat "$tmp_dir/response.json" >&2 || true
    echo >&2
    "${COMPOSE[@]}" ps >&2 || true
    exit 1
  fi
  echo "PASS: $label"
}

json_value() {
  jq -r "$1" "$tmp_dir/response.json"
}

wait_for_http() {
  local url="$1"
  local label="$2"
  for _ in {1..90}; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "READY: $label"
      return 0
    fi
    sleep 2
  done
  echo "FAILED: $label did not become ready at $url" >&2
  "${COMPOSE[@]}" ps >&2 || true
  "${COMPOSE[@]}" logs --no-color --tail=120 user driver ride payment notification rating auth >&2 || true
  exit 1
}

if [[ "${SKIP_DEPLOY:-0}" != "1" ]]; then
  echo "Building and starting the full ride-hailing stack..."
  echo "Compose output is being written to $compose_log"
  "${COMPOSE[@]}" down -v --remove-orphans >>"$compose_log" 2>&1 || true
  "${COMPOSE[@]}" up -d --build --quiet-pull --remove-orphans >>"$compose_log" 2>&1
else
  echo "Skipping deployment because SKIP_DEPLOY=1"
fi

wait_for_http "http://localhost:3001/health" "user service"
wait_for_http "http://localhost:3002/health" "driver service"
wait_for_http "http://localhost:3003/health" "payment service"
wait_for_http "http://localhost:3004/health" "notification service"
wait_for_http "http://localhost:3005/health" "rating service"
wait_for_http "http://localhost:3006/health" "auth service"
wait_for_http "http://localhost:3000/health" "ride service"
wait_for_http "http://localhost:5173" "frontend"
wait_for_http "http://localhost:9090/-/ready" "prometheus"
wait_for_http "http://localhost:3007/api/health" "grafana"

run_id="$(date +%s)"
rider_email="codespace.rider.${run_id}@example.com"
rider_password="Rider${run_id}@123"
driver_email="codespace.driver.${run_id}@example.com"
driver_password="Driver${run_id}@123"
inactive_driver_id="$((run_id % 100000 + 700000))"
active_driver_id="$((inactive_driver_id + 1))"

status="$(request POST http://localhost:3001/v1/riders "{\"name\":\"Codespace Rider\",\"email\":\"$rider_email\",\"phone\":\"9000000000\",\"city\":\"Bengaluru\",\"password\":\"$rider_password\"}")"
expect_status 201 "$status" "create rider"
rider_id="$(json_value '.id')"

status="$(request POST http://localhost:3002/v1/drivers "{\"id\":$inactive_driver_id,\"name\":\"Inactive Driver\",\"email\":\"inactive.$driver_email\",\"phone\":\"9111111111\",\"vehicle_type\":\"Sedan\",\"vehicle_plate\":\"KA00IN$run_id\",\"is_active\":false,\"city\":\"Bengaluru\",\"password\":\"$driver_password\"}")"
expect_status 201 "$status" "create inactive driver"

status="$(request POST http://localhost:3002/v1/drivers "{\"id\":$active_driver_id,\"name\":\"Active Driver\",\"email\":\"$driver_email\",\"phone\":\"9222222222\",\"vehicle_type\":\"Sedan\",\"vehicle_plate\":\"KA00AC$run_id\",\"is_active\":true,\"city\":\"Bengaluru\",\"password\":\"$driver_password\"}")"
expect_status 201 "$status" "create active driver"

status="$(request POST http://localhost:3006/login "{\"email\":\"$rider_email\",\"password\":\"$rider_password\"}")"
expect_status 200 "$status" "rider login"
token="$(json_value '.token')"

trip_body="{\"rider_id\":$rider_id,\"pickup_location\":\"Indiranagar\",\"drop_location\":\"MG Road\",\"city\":\"Bengaluru\",\"distance_km\":8.4}"
status="$(request POST http://localhost:3000/v1/trips "$trip_body" "-H" "Authorization: Bearer $token")"
expect_status 201 "$status" "request trip"
trip_id="$(json_value '.id')"

status="$(request POST "http://localhost:3000/v1/trips/$trip_id/accept" "{\"driver_id\":$inactive_driver_id}")"
expect_status 422 "$status" "reject inactive driver"

status="$(request POST "http://localhost:3000/v1/trips/$trip_id/accept" "{\"driver_id\":$active_driver_id}")"
expect_status 200 "$status" "accept active driver"

status="$(request POST "http://localhost:3000/v1/trips/$trip_id/complete" "{}")"
expect_status 200 "$status" "complete trip and charge payment"
payment_id="$(json_value '.payment.id')"
payment_status="$(json_value '.payment.status')"
if [[ "$payment_status" != "COMPLETED" ]]; then
  echo "FAILED: payment status expected COMPLETED but got $payment_status" >&2
  exit 1
fi

status="$(request POST http://localhost:3003/v1/payments/charge "{\"trip_id\":$trip_id,\"amount\":123.45}" )"
expect_status 400 "$status" "payment requires idempotency key"

status="$(request POST http://localhost:3003/v1/payments/charge "{\"trip_id\":$trip_id,\"amount\":123.45}" "-H" "Idempotency-Key: $trip_id")"
expect_status 200 "$status" "payment duplicate idempotency key returns stored response"

status="$(request POST "http://localhost:3005/v1/trips/$trip_id/rating" "{\"rider_id\":$rider_id,\"driver_id\":$active_driver_id,\"rating\":5,\"feedback\":\"Smooth Codespace validation ride\"}")"
expect_status 201 "$status" "submit rating"

status="$(request GET "http://localhost:3005/v1/ratings/trip/$trip_id")"
expect_status 200 "$status" "fetch rating by trip"

for check in \
  "http://localhost:3000/metrics trips_completed_total" \
  "http://localhost:3003/metrics payment_payments_total" \
  "http://localhost:3005/metrics avg_driver_rating"; do
  url="${check% *}"
  metric="${check#* }"
  if ! curl -fsS "$url" | grep -q "$metric"; then
    echo "FAILED: metric $metric missing from $url" >&2
    exit 1
  fi
  echo "PASS: metric $metric"
done

if ! "${COMPOSE[@]}" logs --no-color notification | grep -q "notification request"; then
  echo "FAILED: notification service did not log trip completion notification" >&2
  exit 1
fi
echo "PASS: notification completion log"

echo "PASS: full rider -> trip -> driver -> payment -> notification -> rating journey validated"
echo "Frontend: http://localhost:5173"
echo "Prometheus: http://localhost:9090"
echo "Grafana: http://localhost:3007 (admin/admin)"
echo "RabbitMQ: http://localhost:15672"
