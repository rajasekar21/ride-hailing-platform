#!/usr/bin/env bash
set -euo pipefail

mkdir -p logs

log() {
  echo "==> $*"
}

have_sudo() {
  command -v sudo >/dev/null 2>&1
}

install_bin() {
  local source_path="$1"
  local bin_name="$2"

  chmod +x "$source_path"

  if have_sudo; then
    sudo install "$source_path" "/usr/local/bin/$bin_name"
  else
    mkdir -p "$HOME/.local/bin"
    install "$source_path" "$HOME/.local/bin/$bin_name"
    export PATH="$HOME/.local/bin:$PATH"
  fi
}

ensure_minikube() {
  if command -v minikube >/dev/null 2>&1; then
    return
  fi

  log "Installing Minikube"
  local tmp_file
  tmp_file="$(mktemp)"
  curl -fsSL -o "$tmp_file" https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
  install_bin "$tmp_file" minikube
  rm -f "$tmp_file"
}

ensure_kubectl() {
  if command -v kubectl >/dev/null 2>&1; then
    return
  fi

  log "Installing kubectl"
  local tmp_file version
  tmp_file="$(mktemp)"
  version="$(curl -fsSL https://dl.k8s.io/release/stable.txt)"
  curl -fsSL -o "$tmp_file" "https://dl.k8s.io/release/${version}/bin/linux/amd64/kubectl"
  install_bin "$tmp_file" kubectl
  rm -f "$tmp_file"
}

ensure_node() {
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    return
  fi

  if ! have_sudo || ! command -v apt-get >/dev/null 2>&1; then
    echo "Node.js and npm are required, but automatic apt installation is unavailable." >&2
    exit 1
  fi

  log "Installing Node.js and npm"
  sudo apt-get update
  sudo apt-get install -y nodejs npm
}

ensure_jq() {
  if command -v jq >/dev/null 2>&1; then
    return
  fi

  if ! have_sudo || ! command -v apt-get >/dev/null 2>&1; then
    echo "jq is required for validation, but automatic apt installation is unavailable." >&2
    exit 1
  fi

  log "Installing jq"
  sudo apt-get update
  sudo apt-get install -y jq
}

ensure_git() {
  if command -v git >/dev/null 2>&1; then
    return
  fi

  if ! have_sudo || ! command -v apt-get >/dev/null 2>&1; then
    echo "git is required to build Minikube images from standalone service repos." >&2
    exit 1
  fi

  log "Installing git"
  sudo apt-get update
  sudo apt-get install -y git
}

ensure_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required for Minikube's docker driver." >&2
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    echo "Docker is installed but not reachable. Start Docker before running this script." >&2
    exit 1
  fi
}

show_minikube_status() {
  log "Minikube status"
  minikube status || true
}

log "Starting full Minikube system"
ensure_docker
ensure_minikube
ensure_kubectl
ensure_node
ensure_jq
ensure_git

log "Tool versions"
git --version
docker --version
minikube version
kubectl version --client=true
node --version
npm --version
jq --version

show_minikube_status

./scripts/setup.sh
./scripts/deploy.sh
show_minikube_status
./scripts/build.sh
./scripts/apply.sh
./scripts/seed.sh
./scripts/port-forward.sh
./scripts/frontend.sh
./scripts/validate.sh

log "System ready"
