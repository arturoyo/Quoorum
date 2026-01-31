#!/bin/bash
set -e

echo ""
echo "================================================================"
echo "  WSL2 Development Environment Setup"
echo "  Project: Quoorum"
echo "================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check if running in WSL
if ! grep -qi microsoft /proc/version; then
    echo "[ERROR] This script must be run inside WSL2"
    exit 1
fi

echo "[INFO] WSL2 detected. Starting setup..."
echo ""

# 2. Update system
echo "[INFO] Updating Ubuntu packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq
echo -e "${GREEN}[OK]${NC} System updated"
echo ""

# 3. Install build essentials (needed for some npm packages)
echo "[INFO] Installing build essentials..."
sudo apt-get install -y -qq build-essential curl git
echo -e "${GREEN}[OK]${NC} Build tools installed"
echo ""

# 4. Install nvm
echo "[INFO] Installing nvm (Node Version Manager)..."
if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    echo -e "${GREEN}[OK]${NC} nvm installed"
else
    echo -e "${YELLOW}[SKIP]${NC} nvm already installed"
fi
echo ""

# 5. Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 6. Install Node.js 20
echo "[INFO] Installing Node.js 20..."
nvm install 20
nvm use 20
nvm alias default 20
echo -e "${GREEN}[OK]${NC} Node.js $(node --version) installed"
echo ""

# 7. Install pnpm
echo "[INFO] Installing pnpm..."
npm install -g pnpm
echo -e "${GREEN}[OK]${NC} pnpm $(pnpm --version) installed"
echo ""

# 8. Navigate to project
echo "[INFO] Checking project directory..."
PROJECT_DIR="/mnt/c/Quoorum"
if [ ! -d "$PROJECT_DIR" ]; then
    echo "[ERROR] Project not found at $PROJECT_DIR"
    exit 1
fi
cd "$PROJECT_DIR"
echo -e "${GREEN}[OK]${NC} Project found at $(pwd)"
echo ""

# 9. Clean existing node_modules and cache
echo "[INFO] Cleaning existing node_modules and cache..."
rm -rf node_modules .next apps/web/.next packages/*/node_modules apps/*/node_modules
echo -e "${GREEN}[OK]${NC} Cleaned"
echo ""

# 10. Install dependencies
echo "[INFO] Installing project dependencies..."
echo "[INFO] This may take 3-5 minutes..."
pnpm install
echo -e "${GREEN}[OK]${NC} Dependencies installed"
echo ""

# 11. Create convenience alias
echo "[INFO] Creating convenience alias..."
if ! grep -q "alias quoorum=" ~/.bashrc; then
    echo "alias quoorum='cd /mnt/c/Quoorum && pnpm dev'" >> ~/.bashrc
    echo -e "${GREEN}[OK]${NC} Alias 'quoorum' created"
else
    echo -e "${YELLOW}[SKIP]${NC} Alias already exists"
fi
echo ""

# 12. Setup git config (inherit from Windows)
echo "[INFO] Setting up git config..."
if [ ! -f ~/.gitconfig ]; then
    git config --global user.name "$(git config --file /mnt/c/Users/Usuario/.gitconfig user.name)"
    git config --global user.email "$(git config --file /mnt/c/Users/Usuario/.gitconfig user.email)"
    echo -e "${GREEN}[OK]${NC} Git config copied from Windows"
else
    echo -e "${YELLOW}[SKIP]${NC} Git config already exists"
fi
echo ""

# 13. Test build
echo "[INFO] Testing TypeScript compilation..."
pnpm typecheck
echo -e "${GREEN}[OK]${NC} TypeScript check passed"
echo ""

# Done!
echo ""
echo "================================================================"
echo -e "  ${GREEN}WSL2 Setup Complete!${NC}"
echo "================================================================"
echo ""
echo "Environment summary:"
echo "  - Node.js: $(node --version)"
echo "  - pnpm: $(pnpm --version)"
echo "  - Project: $PROJECT_DIR"
echo ""
echo "Quick commands:"
echo "  - Start dev server: pnpm dev"
echo "  - Run from anywhere: quoorum (alias)"
echo ""
echo "Next steps:"
echo "  1. Close this terminal"
echo "  2. Open new Ubuntu terminal (or run: source ~/.bashrc)"
echo "  3. Run: cd /mnt/c/Quoorum && pnpm dev"
echo ""
echo "Enjoy your new development environment! 🚀"
echo ""
