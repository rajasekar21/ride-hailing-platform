#!/usr/bin/env bash
set -euo pipefail

VISIBILITY="${CODESPACE_PORT_VISIBILITY:-public}"

if [[ "$#" -gt 0 ]]; then
  PORTS=("$@")
else
  PORTS=(3000 3001 3002 3003 3004 3005 3006 5173)
fi

if [[ -z "${CODESPACES:-}" && -z "${CODESPACE_NAME:-}" ]]; then
  echo "Not running in GitHub Codespaces; skipping port visibility update."
  exit 0
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI is not installed; cannot update Codespace port visibility." >&2
  exit 0
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI is not authenticated; cannot update Codespace port visibility." >&2
  exit 0
fi

args=()
for port in "${PORTS[@]}"; do
  args+=("${port}:${VISIBILITY}")
done

codespace_args=()
if [[ -n "${CODESPACE_NAME:-}" ]]; then
  codespace_args=(-c "$CODESPACE_NAME")
fi

echo "Setting Codespace port visibility to ${VISIBILITY}: ${PORTS[*]}"
gh codespace ports visibility "${args[@]}" "${codespace_args[@]}"
gh codespace ports "${codespace_args[@]}" || true
