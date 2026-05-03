#!/bin/bash
set -e
set -x
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

echo "⚙️ Configuring frontend environment..."

cat <<EOF > frontend/.env
VITE_USER_BASE=/api/user
VITE_API_BASE=/api/ride
VITE_DRIVER_BASE=/api/driver
VITE_PAYMENT_BASE=/api/payment
VITE_RATING_BASE=/api/rating
EOF

echo "✅ Frontend .env configured"

echo "✅ Setup complete"
