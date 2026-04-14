#!/bin/bash

echo "🐳 Building Docker images..."

eval $(minikube docker-env)

docker build -t user ./services/user
docker build -t ride ./services/ride
docker build -t driver ./services/driver
docker build -t payment ./services/payment
docker build -t notification ./services/notification
docker build -t auth ./services/auth

echo "✅ Images built"
