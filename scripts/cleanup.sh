#!/bin/bash
set -e
set -x
echo "🛑 Cleaning up..."

kubectl delete -f k8s/

echo "✅ All services stopped"
