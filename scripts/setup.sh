#!/bin/bash

echo "🔧 Installing dependencies..."

# Backend services
for dir in services/*; do
  if [ -f "$dir/package.json" ]; then
    echo "Installing in $dir"
    (cd $dir && npm install)
  fi
done

# ✅ FRONTEND AUTO-CREATION (FIX HERE)
if [ ! -f "frontend/package.json" ]; then
  echo "⚠️ Frontend not found. Creating using Vite..."

  rm -rf frontend

  npm create vite@latest frontend -- --template react

  cd frontend
  npm install
  cd ..

else
  echo "Installing frontend..."
  (cd frontend && npm install)
fi

echo "✅ Setup complete"
