#!/bin/bash
# Script wrapper para install en Vercel monorepo
# Busca la raíz del monorepo (donde está package.json)

# Empezar desde el directorio actual (apps/web)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Buscar package.json subiendo directorios
ROOT_DIR="$SCRIPT_DIR"
while [ ! -f "$ROOT_DIR/package.json" ] && [ "$ROOT_DIR" != "/" ]; do
  ROOT_DIR="$(dirname "$ROOT_DIR")"
done

if [ ! -f "$ROOT_DIR/package.json" ]; then
  echo "Error: No se encontró package.json en la raíz del monorepo"
  exit 1
fi

# Ir a la raíz y ejecutar install
cd "$ROOT_DIR" || exit 1
pnpm install
