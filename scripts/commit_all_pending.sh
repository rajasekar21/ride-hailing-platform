#!/usr/bin/env bash
set -euo pipefail

git add .
git commit -m "$(cat <<'EOF'
docs: add service README files to platform repo

Track the new service-level README files in the platform repository so local service documentation is available alongside orchestration assets.
EOF
)"
git status --short
