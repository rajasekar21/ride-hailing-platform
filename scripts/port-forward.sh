#!/usr/bin/env bash
set -euo pipefail

echo "Setting up Minikube port-forwarding..."

mkdir -p logs

pkill -f "kubectl port-forward" || true

nohup kubectl port-forward service/ride 3000:3000 > logs/ride-pf.log 2>&1 &
nohup kubectl port-forward service/user 3001:3000 > logs/user-pf.log 2>&1 &
nohup kubectl port-forward service/driver 3002:3000 > logs/driver-pf.log 2>&1 &
nohup kubectl port-forward service/payment 3003:3000 > logs/payment-pf.log 2>&1 &
nohup kubectl port-forward service/notification 3004:3000 > logs/notification-pf.log 2>&1 &
nohup kubectl port-forward service/rating 3005:3000 > logs/rating-pf.log 2>&1 &
nohup kubectl port-forward service/auth 3006:3000 > logs/auth-pf.log 2>&1 &

sleep 5

echo "Port forwarding ready"
