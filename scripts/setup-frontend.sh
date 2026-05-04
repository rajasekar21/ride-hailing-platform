#!/usr/bin/env bash
set -euo pipefail

echo "Preparing local frontend environment..."

install_if_needed() {
  local dir="$1"
  local stamp_file="$dir/node_modules/.package-lock.sha256"
  local current_hash=""

  if [[ -f "$dir/package-lock.json" ]]; then
    current_hash="$(sha256sum "$dir/package-lock.json" | awk '{print $1}')"
  elif [[ -f "$dir/package.json" ]]; then
    current_hash="$(sha256sum "$dir/package.json" | awk '{print $1}')"
  else
    echo "No package file found in $dir" >&2
    return 1
  fi

  if [[ -d "$dir/node_modules" && -f "$stamp_file" && "$(cat "$stamp_file")" == "$current_hash" ]]; then
    echo "Dependencies already current in $dir"
    return
  fi

  echo "Installing dependencies in $dir"
  if [[ -f "$dir/package-lock.json" ]]; then
    (cd "$dir" && npm ci)
  else
    (cd "$dir" && npm install)
  fi

  mkdir -p "$dir/node_modules"
  echo "$current_hash" > "$stamp_file"
}

if [[ ! -f "frontend/package.json" ]]; then
  echo "Frontend not found. Creating Vite React app..."
  rm -rf frontend
  npm create vite@latest frontend -- --template react
fi

install_if_needed frontend

cat <<EOF > frontend/.env
VITE_USER_BASE=/api/user
VITE_API_BASE=/api/ride
VITE_DRIVER_BASE=/api/driver
VITE_PAYMENT_BASE=/api/payment
VITE_RATING_BASE=/api/rating
EOF

echo "Frontend .env configured"
echo "Setup complete"
