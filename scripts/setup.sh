#!/bin/bash

echo "🔧 Installing dependencies..."

for dir in services/*; do
  if [ -f "$dir/package.json" ]; then
    echo "Installing in $dir"
    (cd $dir && npm install)
  fi
done

if [ -d "frontend" ]; then
  echo "Installing frontend..."
  (cd frontend && npm install)
fi

echo "✅ Setup complete"
