#!/bin/bash

echo "🚀 Starting Minikube..."

minikube start --memory=4096 --cpus=2
minikube addons enable metrics-server

echo "☸️ Deploying services..."

kubectl apply -f k8s/

kubectl get pods

echo "✅ Deployment complete"
