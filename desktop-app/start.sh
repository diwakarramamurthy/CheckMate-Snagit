#!/bin/bash
# CheckMate-Snagit — Desktop Launcher
# Starts both the backend (FastAPI) and frontend (Expo web) in one click.

set -e

# Resolve the repo root relative to this script's location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"
ENV_FILE="$BACKEND_DIR/.env"

echo "============================================"
echo "  CheckMate-Snagit — Starting App"
echo "============================================"

# ── 1. Check prerequisites ────────────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
  echo "[ERROR] python3 not found. Install Python 3.10+ and re-run."
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "[ERROR] node not found. Install Node.js 18+ and re-run."
  exit 1
fi

if ! command -v npx &>/dev/null; then
  echo "[ERROR] npx not found. Install Node.js/npm and re-run."
  exit 1
fi

# ── 2. Check .env file ────────────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo ""
  echo "[SETUP] No backend/.env file found."
  echo "        Please create $ENV_FILE with:"
  echo ""
  echo "          MONGO_URL=mongodb+srv://<user>:<password>@<host>/<db>?retryWrites=true&w=majority"
  echo "          DB_NAME=checkmate_inspections"
  echo ""
  echo "        Then re-run this script."
  exit 1
fi

# ── 3. Install backend dependencies (if needed) ───────────────────────────────
echo ""
echo "[Backend] Installing Python dependencies..."
pip install -q -r "$BACKEND_DIR/requirements.txt"

# ── 4. Install frontend dependencies (if needed) ─────────────────────────────
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo ""
  echo "[Frontend] Installing Node dependencies (first run — this may take a minute)..."
  cd "$FRONTEND_DIR" && npm install --legacy-peer-deps
fi

# ── 5. Start backend ──────────────────────────────────────────────────────────
echo ""
echo "[Backend] Starting FastAPI on http://localhost:8000 ..."
cd "$REPO_ROOT"
uvicorn backend.server:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "[Backend] PID: $BACKEND_PID"

# Give the backend a moment to bind the port
sleep 2

# ── 6. Start frontend (web) ───────────────────────────────────────────────────
echo ""
echo "[Frontend] Starting Expo web on http://localhost:8081 ..."
export EXPO_PUBLIC_BACKEND_URL="http://localhost:8000"
cd "$FRONTEND_DIR"
npx expo start --web &
FRONTEND_PID=$!
echo "[Frontend] PID: $FRONTEND_PID"

echo ""
echo "============================================"
echo "  App is running!"
echo "  Backend  → http://localhost:8000"
echo "  Frontend → http://localhost:8081"
echo ""
echo "  Press Ctrl+C to stop both servers."
echo "============================================"

# ── 7. Wait and clean up on exit ─────────────────────────────────────────────
trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
