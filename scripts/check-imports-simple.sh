#!/bin/bash
# Simple import checker - NO DEPENDENCIES, just grep
# Checks for .js extensions in TypeScript files

set -e

echo "🔍 Checking for .js extensions in TypeScript imports..."

# Find all .ts and .tsx files, exclude node_modules and .next
FILES=$(find packages apps -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -not -path "*/.turbo/*" \
  2>/dev/null || true)

ERRORS_FOUND=0

for file in $FILES; do
  # Check if file contains imports with .js extension from relative paths
  if grep -n "from ['\"]\..*\.js['\"]" "$file" > /dev/null 2>&1; then
    echo ""
    echo "[ERROR] Found .js extension in: $file"
    grep -n "from ['\"]\..*\.js['\"]" "$file" | while read -r line; do
      echo "   $line"
    done
    ERRORS_FOUND=$((ERRORS_FOUND + 1))
  fi
done

echo ""

if [ $ERRORS_FOUND -gt 0 ]; then
  echo "[ERROR] Found $ERRORS_FOUND file(s) with .js extensions in imports"
  echo ""
  echo "To fix automatically, run:"
  echo "  find packages apps -type f \( -name '*.ts' -o -name '*.tsx' \) -exec sed -i \"s/from ['\\\"]\(\..*\)\.js['\\\"]/from '\1'/g\" {} +"
  echo ""
  exit 1
else
  echo "[OK] No .js extensions found in TypeScript imports"
  exit 0
fi
