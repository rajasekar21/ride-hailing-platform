#!/bin/bash

echo "🚀 Starting Minikube..."

minikube start --memory=4096 --cpus=2
minikube addons enable metrics-server

echo "☸️ Deploying services..."

kubectl apply -f k8s/

echo "⏳ Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod --all --timeout=180s

echo "✅ All pods are ready"
