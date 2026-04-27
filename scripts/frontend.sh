#!/bin/bash
set -e
set -x
echo "🌐 Starting frontend..."

mkdir -p logs
pkill -f "npm run dev" || true
pkill -f "vite" || true

cd frontend
npm run dev -- --host 0.0.0.0 > ../logs/frontend.log 2>&1 &
cd ..

echo "✅ Frontend running"
