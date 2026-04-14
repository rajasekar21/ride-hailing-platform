#!/bin/bash

if [ -f "frontend/package.json" ]; then
  cd frontend
  npm run dev
else
  echo "Frontend not available"
fi
