#!/bin/bash
set -e
echo "🌐 Starting frontend..."

cd frontend
npm run dev > /dev/null 2>&1 &
cd ..

echo "✅ Frontend running"
