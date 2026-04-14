#!/bin/bash
set -e
set -x
echo "🔌 Setting up port-forwarding..."

mkdir -p logs

# Kill existing port-forward processes
pkill -f "kubectl port-forward" || true

# Start port-forward in background
nohup kubectl port-forward service/user 3001:3000 > logs/user-pf.log 2>&1 &
nohup kubectl port-forward service/ride 3000:3000 > logs/ride-pf.log 2>&1 &

sleep 5

echo "✅ Port forwarding ready"
