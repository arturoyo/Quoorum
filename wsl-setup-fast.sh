#!/bin/bash
set -e

echo ""
echo "WSL2 Quick Setup for Quoorum"
echo ""

# Load nvm if exists
export NVM_DIR="$HOME/.nvm"

# Install nvm if not exists
if [ ! -d "$NVM_DIR" ]; then
    echo "[INFO] Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    echo "[OK] nvm installed"
else
    echo "[OK] nvm already installed"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Install Node.js 20
echo "[INFO] Installing Node.js 20..."
nvm install 20
nvm use 20
nvm alias default 20
echo "[OK] Node.js $(node --version) installed"

# Install pnpm
echo "[INFO] Installing pnpm..."
npm install -g pnpm
echo "[OK] pnpm $(pnpm --version) installed"

# Navigate to project
echo "[INFO] Going to project directory..."
cd /mnt/c/Quoorum
echo "[OK] At $(pwd)"

# Clean
echo "[INFO] Cleaning old files..."
rm -rf .next node_modules/.cache
echo "[OK] Cleaned"

# Install dependencies
echo "[INFO] Installing dependencies (this will take 3-5 minutes)..."
pnpm install
echo "[OK] Dependencies installed"

# Test (allow failure to continue)
echo "[INFO] Testing TypeScript..."
set +e
pnpm typecheck
TYPECHECK_EXIT=$?
set -e
if [ $TYPECHECK_EXIT -eq 0 ]; then
  echo "[OK] TypeScript check passed"
else
  echo "[WARN] TypeScript check had issues (exit code: $TYPECHECK_EXIT)"
  echo "[INFO] Continuing anyway..."
fi

echo ""
echo "Setup complete!"
echo ""
echo "Commands to use:"
echo "  cd /mnt/c/Quoorum"
echo "  pnpm dev"
echo ""
