#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p docs/evidence/generated

timestamp="$(date -Is)"
out="docs/evidence/generated/compose-evidence-$(date +%Y%m%d-%H%M%S).md"

write_cmd() {
  local title="$1"
  shift
  {
    echo
    echo "## $title"
    echo
    echo '```bash'
    printf '$'
    printf ' %q' "$@"
    echo
    echo '```'
    echo
    echo '```text'
    "$@" 2>&1 || true
    echo '```'
  } >> "$out"
}

cat > "$out" <<EOF
# Docker Compose Evidence

Captured: $timestamp

This evidence is generated from the current Docker Compose deployment. Use it for screenshots and as text backup in the submission PDF.
EOF

write_cmd "Container Status" docker compose ps
write_cmd "Service Health Summary" ./scripts/codespace-status.sh
write_cmd "Full Workflow Validation" env SKIP_DEPLOY=1 ./scripts/codespace-validate.sh
write_cmd "Ride Metrics" curl -fsS http://localhost:3000/metrics
write_cmd "Payment Metrics" curl -fsS http://localhost:3003/metrics
write_cmd "Rating Metrics" curl -fsS http://localhost:3005/metrics
write_cmd "Notification Logs" docker compose logs --no-color --tail=120 notification

latest_id_from_json() {
  node -e '
    let raw = "";
    process.stdin.on("data", (chunk) => { raw += chunk; });
    process.stdin.on("end", () => {
      try {
        const parsed = JSON.parse(raw);
        const rows = Array.isArray(parsed) ? parsed : parsed.data;
        const last = Array.isArray(rows) ? rows[rows.length - 1] : null;
        if (last && last.id !== undefined && last.id !== null) {
          process.stdout.write(String(last.id));
        }
      } catch (_) {
      }
    });
  '
}

latest_trip_id="$(curl -fsS http://localhost:3000/v1/trips 2>/dev/null | latest_id_from_json || true)"
latest_rider_id="$(curl -fsS http://localhost:3001/v1/riders 2>/dev/null | latest_id_from_json || true)"

if [[ -n "$latest_trip_id" ]]; then
  write_cmd "DB Persistence Proof - Latest Trip Via API" curl -fsS "http://localhost:3000/v1/trips/$latest_trip_id"
fi

if [[ -n "$latest_rider_id" ]]; then
  write_cmd "DB Persistence Proof - Latest Rider Via API" curl -fsS "http://localhost:3001/v1/riders/$latest_rider_id"
fi

if [[ -z "$latest_trip_id" || -z "$latest_rider_id" ]]; then
  cat >> "$out" <<EOF

## DB Persistence Proof Note

The script could not infer both latest IDs from list endpoints. Run the validation script first, then capture a specific persisted record manually:

\`\`\`bash
curl -fsS http://localhost:3000/v1/trips/<trip_id>
curl -fsS http://localhost:3001/v1/riders/<rider_id>
\`\`\`
EOF
fi

cat <<EOF
Evidence written to: $out

Recommended screenshots to refresh from this run:
- docker compose ps
- ./scripts/codespace-status.sh
- SKIP_DEPLOY=1 ./scripts/codespace-validate.sh final PASS section
- Frontend dashboard after hard refresh
- Latest trip/rider DB persistence proof sections in $out
EOF
