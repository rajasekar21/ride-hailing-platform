#!/usr/bin/env bash
set -euo pipefail

cat <<'EOF'
# Minikube Recording Command Pack

# 1) Start Minikube
minikube start --driver=docker --memory=4096 --cpus=2

# 2) Build/load one or more standalone service images into Minikube.
# Run from a clone of each standalone service repo, for example:
#   git clone https://github.com/rajasekar21/ride-hailing-user-service.git
#   cd ride-hailing-user-service
#   docker build -t user:latest .
#   minikube image load user:latest
#
# Image names expected by k8s/*.yaml:
#   auth:latest
#   user:latest
#   driver:latest
#   ride:latest
#   payment:latest
#   notification:latest
#   rating:latest

# 3) Deploy platform Kubernetes manifests.
kubectl apply -f k8s/platform-config.yaml
kubectl apply -f k8s/rabbitmq.yaml
kubectl apply -f k8s/user.yaml
kubectl apply -f k8s/driver.yaml
kubectl apply -f k8s/payment.yaml
kubectl apply -f k8s/notification.yaml
kubectl apply -f k8s/rating.yaml
kubectl apply -f k8s/auth.yaml
kubectl apply -f k8s/ride.yaml

# 4) Show deployment health for recording.
kubectl get pods -o wide
kubectl get svc
kubectl describe deployment ride
kubectl logs deployment/notification --since=10m

# 5) Show probes configured in manifests.
grep -RniE "readinessProbe|livenessProbe" k8s/*.yaml k8s/trip/*.yaml

# 6) Get service URLs for individual clips.
minikube service user --url
minikube service ride --url
minikube service driver-nodeport --url
minikube service payment-nodeport --url
minikube service rating-nodeport --url
minikube service auth --url

# 7) Record individual service clips:
# - Show one service pod/deployment/svc.
# - Curl /health.
# - Show logs.
# Example:
kubectl get pods -l app=user
kubectl get svc user
kubectl logs deployment/user --tail=50

# 8) Cleanup when recording is done.
# kubectl delete -f k8s/
# minikube stop
EOF
