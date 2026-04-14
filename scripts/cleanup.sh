#!/bin/bash

echo "🛑 Cleaning up..."

kubectl delete -f k8s/

echo "✅ All services stopped"
