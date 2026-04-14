#!/bin/bash
set -e
set -x

echo "🚀 Starting Minikube..."

minikube start --memory=4096 --cpus=2

echo "🐳 Configuring Docker to use Minikube..."

eval $(minikube docker-env)

echo "✅ Minikube ready"
