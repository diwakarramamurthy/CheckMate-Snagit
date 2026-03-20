#!/bin/bash
# CheckMate-Snagit — First-time environment setup helper
# Run this once before start.sh to create the required .env file.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$(dirname "$SCRIPT_DIR")/backend/.env"

echo "============================================"
echo "  CheckMate-Snagit — Environment Setup"
echo "============================================"
echo ""

if [ -f "$ENV_FILE" ]; then
  echo "A .env file already exists at:"
  echo "  $ENV_FILE"
  echo ""
  read -p "Overwrite it? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }
fi

echo ""
read -p "MongoDB connection string (MONGO_URL): " MONGO_URL
read -p "Database name [checkmate_inspections]: " DB_NAME
DB_NAME="${DB_NAME:-checkmate_inspections}"

cat > "$ENV_FILE" <<EOF
MONGO_URL=${MONGO_URL}
DB_NAME=${DB_NAME}
EOF

echo ""
echo "Saved to $ENV_FILE"
echo ""
echo "You can now run:  bash start.sh"
