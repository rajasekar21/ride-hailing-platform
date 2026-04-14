#!/bin/bash

echo "🔧 Installing dependencies..."

IP=$(minikube ip)

echo "VITE_API_BASE=http://$IP:30300" > frontend/.env
echo "VITE_USER_BASE=http://$IP:30301" >> frontend/.env

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

echo "⚙️ Configuring frontend environment..."

cat <<EOF > frontend/.env
VITE_USER_BASE=http://localhost:3001
VITE_API_BASE=http://localhost:3000
EOF

echo "✅ Frontend .env configured"

echo "✅ Setup complete"
