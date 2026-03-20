#!/bin/bash
# CheckMate-Snagit — Stop all running servers

echo "Stopping CheckMate-Snagit servers..."

# Kill processes on backend port 8000
if lsof -ti:8000 &>/dev/null; then
  kill $(lsof -ti:8000) 2>/dev/null && echo "[Backend]  stopped (port 8000)"
else
  echo "[Backend]  not running"
fi

# Kill processes on frontend port 8081
if lsof -ti:8081 &>/dev/null; then
  kill $(lsof -ti:8081) 2>/dev/null && echo "[Frontend] stopped (port 8081)"
else
  echo "[Frontend] not running"
fi

echo "Done."
