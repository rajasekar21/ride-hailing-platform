#!/usr/bin/env bash
set -euo pipefail

echo "Applying Kubernetes manifests..."

kubectl apply -f k8s/

echo "Waiting for deployments to roll out..."
for deployment in rabbitmq user driver payment notification rating auth ride; do
  kubectl rollout status "deployment/${deployment}" --timeout=240s
done

echo "Pods:"
kubectl get pods -o wide

echo "Services:"
kubectl get svc
