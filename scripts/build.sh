#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Building Docker images in the Minikube Docker environment..."
eval "$(minikube -p minikube docker-env)"

service_source_dir() {
  local image_name="$1"
  local repo_url="$2"
  local checkout_dir=".external-services/$image_name"

  if command -v git >/dev/null 2>&1; then
    if [[ -d "$checkout_dir/.git" ]]; then
      git -C "$checkout_dir" fetch --quiet origin
      git -C "$checkout_dir" checkout --quiet master
      git -C "$checkout_dir" pull --ff-only --quiet origin master
    else
      rm -rf "$checkout_dir"
      git clone --quiet --branch master "$repo_url" "$checkout_dir"
    fi

    if [[ -f "$checkout_dir/Dockerfile" ]]; then
      echo "$checkout_dir"
      return
    fi
  fi

  echo "services/$image_name"
}

build_service() {
  local image_name="$1"
  local repo_url="$2"
  local source_dir

  source_dir="$(service_source_dir "$image_name" "$repo_url")"
  echo "Building $image_name from $source_dir"
  docker build -t "$image_name" "$source_dir"
}

build_service user https://github.com/rajasekar21/ride-hailing-user-service.git
build_service driver https://github.com/rajasekar21/ride-hailing-driver-service.git
build_service ride https://github.com/rajasekar21/ride-hailing-trip-service.git
build_service payment https://github.com/rajasekar21/ride-hailing-payment-service.git
build_service notification https://github.com/rajasekar21/ride-hailing-notification-service.git
build_service rating https://github.com/rajasekar21/ride-hailing-rating-service.git
build_service auth https://github.com/rajasekar21/ride-hailing-auth-service.git

if [[ -f "frontend/package.json" ]]; then
  echo "Building frontend from platform repo"
  docker build -t frontend ./frontend
else
  echo "Frontend not found, skipping frontend image build"
fi

echo "Images built"
