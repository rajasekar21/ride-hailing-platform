#!/usr/bin/env bash
set -euo pipefail

cd /z/Raja/ride-hailing-platform
git add -A
git commit -m "$(cat <<'EOF'
feat: add guided multi-page frontend demo experience

Improve the assignment demo UI with sidebar navigation, presenter hints, and step-by-step page flow across rider, driver, trip, payment, and rating actions.
EOF
)"
git push
git status --short
