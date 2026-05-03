#!/usr/bin/env bash
set -euo pipefail

cat <<'EOF'
Host-side seeding is intentionally disabled.

Reason:
- The mandatory path is Minikube via ./scripts/run-all.sh.
- Service images/repos own their runtime seeding.
- Running services/*/seed.js from the platform host can read the wrong CSV path
  because services/* are reference copies while dataset/*.csv is the shared platform dataset.

Use these instead:
- ./scripts/run-all.sh
- ./scripts/validate.sh
EOF
