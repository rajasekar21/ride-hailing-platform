#!/usr/bin/env bash
set -euo pipefail

echo "Starting Minikube..."

minikube start --driver=docker --memory=4096 --cpus=2

echo "Minikube status:"
minikube status

echo "Configuring Docker to use Minikube..."
eval "$(minikube docker-env)"

echo "Minikube ready"
