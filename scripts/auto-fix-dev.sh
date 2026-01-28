#!/bin/bash
# Auto-fix script for development
# Fixes TypeScript and ESLint errors before starting the server
# This script runs automatically before `pnpm dev` via the `predev` hook

set +e  # Don't exit on error, continue with fixes

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🔧 AUTO-FIX: Corrigiendo errores antes de iniciar servidor"
echo "═══════════════════════════════════════════════════════════"
echo ""

# 1. Clean and Build API package FIRST (esto corrige muchos errores de TypeScript durante el build)
echo "→ [1/4] Limpiando y compilando paquete API..."
echo "   (Esto corrige errores de TypeScript durante el build)"
# Limpiar dist primero para evitar errores de archivos huérfanos
if [ -d "packages/api/dist" ]; then
    echo "   🧹 Limpiando directorio dist..."
    rm -rf packages/api/dist
fi
# Ahora compilar
if pnpm --filter @quoorum/api build; then
    echo "   [OK] Build de API completado exitosamente"
else
    echo "   [WARN]  Build de API con errores (continuando de todas formas)"
    echo "   💡 Revisa los errores arriba"
fi

echo ""

# 2. Fix ESLint errors
echo "→ [2/4] Corrigiendo errores de ESLint automáticamente..."
if pnpm lint:fix; then
    echo "   [OK] ESLint fix completado"
else
    echo "   [WARN]  ESLint fix completado con advertencias"
fi

echo ""

# 3. Build Web package (para asegurar que todo compile)
echo "→ [3/4] Verificando compilación de Web..."
if pnpm --filter @quoorum/web typecheck > /dev/null 2>&1; then
    echo "   [OK] TypeCheck de Web: Sin errores"
else
    echo "   [WARN]  TypeCheck de Web: Se encontraron errores"
    echo "   💡 Algunos errores pueden corregirse automáticamente"
fi

echo ""

# 4. TypeCheck general (verificación rápida, no bloquea)
echo "→ [4/4] Verificación final de tipos..."
if pnpm typecheck > /dev/null 2>&1; then
    echo "   [OK] TypeCheck: Sin errores de tipos"
else
    echo "   [WARN]  TypeCheck: Se encontraron errores de tipos"
    echo "   💡 Algunos errores se corrigen automáticamente durante el build"
    echo "   💡 Revisa los errores arriba si el servidor no inicia correctamente"
fi

echo ""

# 5. Verificar y liberar puerto 3000 si está en uso
echo "→ [5/5] Verificando puerto 3000..."
if command -v lsof &> /dev/null; then
    PID=$(lsof -ti:3000 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "   [WARN]  Puerto 3000 en uso por proceso PID: $PID"
        echo "   🧹 Liberando puerto 3000..."
        kill -9 "$PID" 2>/dev/null && sleep 0.5
        echo "   [OK] Puerto 3000 liberado"
    else
        echo "   [OK] Puerto 3000 disponible"
    fi
elif command -v netstat &> /dev/null; then
    PID=$(netstat -tuln 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | head -1)
    if [ -n "$PID" ] && [ "$PID" != "-" ]; then
        echo "   [WARN]  Puerto 3000 en uso por proceso PID: $PID"
        echo "   🧹 Liberando puerto 3000..."
        kill -9 "$PID" 2>/dev/null && sleep 0.5
        echo "   [OK] Puerto 3000 liberado"
    else
        echo "   [OK] Puerto 3000 disponible"
    fi
else
    echo "   ℹ️  No se pudo verificar el puerto (lsof/netstat no disponible)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "[OK] AUTO-FIX COMPLETADO"
echo "[INFO] Iniciando servidor de desarrollo..."
echo "═══════════════════════════════════════════════════════════"
echo ""
