#!/bin/bash
set -e
echo "🛑 Cleaning up..."

kubectl delete -f k8s/

echo "✅ All services stopped"
