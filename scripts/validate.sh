#!/bin/bash
set -e

echo "🔍 Running system validation..."

PASS=true

# ---------------------------
# 1. Check Pods
# ---------------------------
echo "📦 Checking pods..."

if kubectl get pods | grep -E "CrashLoopBackOff|Error" > /dev/null; then
  echo "❌ Some pods are failing"
  kubectl get pods
  PASS=false
else
  echo "✅ Pods are healthy"
fi

# ---------------------------
# 2. Check User API
# ---------------------------
echo "👤 Checking User API..."

if curl -s http://localhost:3001/users | grep -q "\["; then
  echo "✅ User API working"
else
  echo "❌ User API failed"
  PASS=false
fi

# ---------------------------
# 3. Check Ride API
# ---------------------------
echo "🚕 Checking Ride API..."

if curl -s -X POST http://localhost:3000/rides > /dev/null; then
  echo "✅ Ride API working"
else
  echo "❌ Ride API failed"
  PASS=false
fi

# ---------------------------
# 4. Check Port-forward Processes
# ---------------------------
echo "🔌 Checking port-forward..."

if ps aux | grep "kubectl port-forward" | grep -v grep > /dev/null; then
  echo "✅ Port-forward active"
else
  echo "❌ Port-forward not running"
  PASS=false
fi

# ---------------------------
# 5. Final Result
# ---------------------------
echo "--------------------------------"

if [ "$PASS" = true ]; then
  echo "🎉 ALL CHECKS PASSED"
else
  echo "⚠️ SOME CHECKS FAILED"
  exit 1
fi#!/bin/bash
set -e

echo "🔍 Running system validation..."

PASS=true

# ---------------------------
# 1. Check Pods
# ---------------------------
echo "📦 Checking pods..."

if kubectl get pods | grep -E "CrashLoopBackOff|Error" > /dev/null; then
  echo "❌ Some pods are failing"
  kubectl get pods
  PASS=false
else
  echo "✅ Pods are healthy"
fi

# ---------------------------
# 2. Check User API
# ---------------------------
echo "👤 Checking User API..."

if curl -s http://localhost:3001/users | grep -q "\["; then
  echo "✅ User API working"
else
  echo "❌ User API failed"
  PASS=false
fi

# ---------------------------
# 3. Check Ride API
# ---------------------------
echo "🚕 Checking Ride API..."

if curl -s -X POST http://localhost:3000/rides > /dev/null; then
  echo "✅ Ride API working"
else
  echo "❌ Ride API failed"
  PASS=false
fi

# ---------------------------
# 4. Check Port-forward Processes
# ---------------------------
echo "🔌 Checking port-forward..."

if ps aux | grep "kubectl port-forward" | grep -v grep > /dev/null; then
  echo "✅ Port-forward active"
else
  echo "❌ Port-forward not running"
  PASS=false
fi

# ---------------------------
# 5. Final Result
# ---------------------------
echo "--------------------------------"

if [ "$PASS" = true ]; then
  echo "🎉 ALL CHECKS PASSED"
else
  echo "⚠️ SOME CHECKS FAILED"
  exit 1
fi
