#!/bin/bash
set -e

echo "☸️ Applying Kubernetes manifests..."

kubectl apply -f k8s/

echo "⏳ Checking pods..."

sleep 5
kubectl get pods
