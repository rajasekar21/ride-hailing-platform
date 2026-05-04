#!/usr/bin/env bash
set -euo pipefail

echo "Cleaning up Minikube Kubernetes resources..."

pkill -f "kubectl port-forward" || true
kubectl delete -f k8s/ --ignore-not-found=true

echo "Minikube resources removed"
