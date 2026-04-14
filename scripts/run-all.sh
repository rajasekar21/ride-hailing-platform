#!/bin/bash
set -e
set -x
mkdir -p logs
echo "🚀 Starting full system..."

./scripts/setup.sh
./scripts/deploy.sh
./scripts/build.sh
./scripts/apply.sh
./scripts/seed.sh
./scripts/port-forward.sh
./scripts/frontend.sh
./scripts/validate.sh
echo "✅ System ready"
