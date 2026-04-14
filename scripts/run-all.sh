#!/bin/bash
set -e
mkdir -p logs
echo "🚀 Starting full system..."

./scripts/setup.sh
./scripts/seed.sh
./scripts/build.sh
./scripts/deploy.sh
./scripts/port-forward.sh
./scripts/frontend.sh
./scripts/validate.sh
echo "✅ System ready"
