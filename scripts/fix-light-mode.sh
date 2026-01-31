#!/bin/bash
# fix-light-mode.sh - Refactor masivo para modo claro premium
# Fecha: 28 Ene 2026

echo "[INFO] Iniciando refactor de modo claro..."

cd "$(dirname "$0")/../apps/web/src" || exit 1

# Contador de archivos modificados
count=0

# Función para reemplazar en archivos
fix_file() {
    local file="$1"

    # Backup (opcional)
    # cp "$file" "$file.backup"

    # Textos
    sed -i 's/className="\([^"]*\)text-white\([^"]*\)"/className="\1text-[var(--theme-text-primary)]\2"/g' "$file"
    sed -i "s/className='\([^']*\)text-white\([^']*\)'/className='\1text-[var(--theme-text-primary)]\2'/g" "$file"

    # Fondos oscuros
    sed -i 's/bg-slate-900\/60/bg-[var(--theme-bg-secondary)]/g' "$file"
    sed -i 's/bg-slate-900\/80/bg-[var(--theme-bg-secondary)]/g' "$file"
    sed -i 's/bg-slate-900\/95/bg-[var(--theme-bg-secondary)]/g' "$file"
    sed -i 's/bg-slate-900[^\/a-z-]/bg-[var(--theme-bg-primary)] /g' "$file"
    sed -i 's/bg-slate-800\/50/bg-[var(--theme-bg-tertiary)]/g' "$file"
    sed -i 's/bg-slate-800\/30/bg-[var(--theme-bg-tertiary)]/g' "$file"
    sed -i 's/bg-slate-800[^\/a-z-]/bg-[var(--theme-bg-tertiary)] /g' "$file"
    sed -i 's/bg-slate-700/bg-[var(--theme-bg-input)]/g' "$file"

    # Bordes
    sed -i 's/border-white\/10/border-[var(--theme-border)]/g' "$file"
    sed -i 's/border-white\/5/border-[var(--theme-border)]/g' "$file"
    sed -i 's/border-white\/20/border-[var(--theme-border)]/g' "$file"

    # Hover states
    sed -i 's/hover:bg-white\/5/hover:bg-[var(--theme-bg-tertiary)]/g' "$file"
    sed -i 's/hover:bg-slate-800/hover:bg-[var(--theme-bg-tertiary)]/g' "$file"

    count=$((count + 1))
}

# Procesar componentes Quoorum
echo "[INFO] Procesando componentes Quoorum..."
find components/quoorum -name "*.tsx" -type f | while read -r file; do
    if grep -q "text-white\|bg-slate-\|border-white/" "$file" 2>/dev/null; then
        echo "  - Fixing: $file"
        fix_file "$file"
    fi
done

# Procesar componentes Settings
echo "[INFO] Procesando componentes Settings..."
find components/settings -name "*.tsx" -type f | while read -r file; do
    if grep -q "text-white\|bg-slate-\|border-white/" "$file" 2>/dev/null; then
        echo "  - Fixing: $file"
        fix_file "$file"
    fi
done

# Procesar componentes Admin
echo "[INFO] Procesando componentes Admin..."
find components/admin -name "*.tsx" -type f | while read -r file; do
    if grep -q "text-white\|bg-slate-\|border-white/" "$file" 2>/dev/null; then
        echo "  - Fixing: $file"
        fix_file "$file"
    fi
done

# Procesar componentes UI
echo "[INFO] Procesando componentes UI..."
find components/ui -name "*.tsx" -type f | while read -r file; do
    if grep -q "text-white\|bg-slate-\|border-white/" "$file" 2>/dev/null; then
        echo "  - Fixing: $file"
        fix_file "$file"
    fi
done

# Procesar Layout
echo "[INFO] Procesando Layout..."
find components/layout -name "*.tsx" -type f | while read -r file; do
    if grep -q "text-white\|bg-slate-\|border-white/" "$file" 2>/dev/null; then
        echo "  - Fixing: $file"
        fix_file "$file"
    fi
done

echo "[OK] Refactor completado"
echo "[INFO] Archivos procesados: $count"
echo "[INFO] Verifica los cambios con: git diff"
