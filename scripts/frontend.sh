#!/bin/bash
set -e
set -x
echo "🌐 Starting frontend..."

cd frontend
npm run dev > /dev/null 2>&1 &
cd ..

echo "✅ Frontend running"
