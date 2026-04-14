#!/bin/bash

echo "🌱 Seeding data..."

# USER SERVICE
if [ -f "services/user/seed.js" ]; then
  echo "Seeding user service..."
  (cd services/user && node seed.js)
else
  echo "⚠️ user seed.js not found, skipping..."
fi

# RIDE SERVICE (optional)
if [ -f "services/ride/seed.js" ]; then
  echo "Seeding ride service..."
  (cd services/ride && node seed.js)
fi

# PAYMENT SERVICE (optional)
if [ -f "services/payment/seed.js" ]; then
  echo "Seeding payment service..."
  (cd services/payment && node seed.js)
fi

echo "✅ Data seeding complete"
