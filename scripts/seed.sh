#!/bin/bash

echo "🌱 Seeding data..."

(cd services/user && node seed.js)
(cd services/ride && node seed.js 2>/dev/null || true)
(cd services/payment && node seed.js 2>/dev/null || true)

echo "✅ Data seeded"
