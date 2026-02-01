#!/bin/bash
set -e

echo "[INFO] Setting up WSL2 development environment..."

# Load nvm if exists
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  source "$NVM_DIR/nvm.sh"
  echo "[OK] nvm loaded"
else
  echo "[ERROR] nvm not found. Installing..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  source "$NVM_DIR/nvm.sh"
fi

# Install Node.js 20
echo "[INFO] Installing Node.js 20..."
nvm install 20
nvm use 20
echo "[OK] Node.js installed: $(node --version)"

# Install pnpm
echo "[INFO] Installing pnpm..."
npm install -g pnpm
echo "[OK] pnpm installed: $(pnpm --version)"

# Navigate to project
echo "[INFO] Checking project directory..."
cd /mnt/c/Quoorum || {
  echo "[ERROR] Project not found at /mnt/c/Quoorum"
  exit 1
}

echo "[OK] Project found"

# Install dependencies
echo "[INFO] Installing project dependencies (this may take a few minutes)..."
pnpm install

echo ""
echo "[OK] WSL2 setup complete!"
echo ""
echo "Next steps:"
echo "1. wsl -d Ubuntu"
echo "2. cd /mnt/c/Quoorum"
echo "3. pnpm dev"
