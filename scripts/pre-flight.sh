#!/bin/bash
# Pre-flight checks antes de CUALQUIER cambio

echo "[INFO] PRE-FLIGHT CHECKS - Sistema Proactivo"
echo "========================================"

ERRORS=0

# 1. Verificar PostgreSQL local está corriendo
echo "→ Verificando PostgreSQL local..."
if ! docker ps | grep -q quoorum-postgres; then
  echo "  [ERROR] PostgreSQL local NO está corriendo"
  echo "     Ejecuta: docker start quoorum-postgres"
  ERRORS=$((ERRORS + 1))
else
  echo "  [OK] PostgreSQL local corriendo"
fi

# 2. Verificar conexión a DB
echo "→ Verificando conexión a DB..."
if docker exec quoorum-postgres psql -U postgres -d quoorum -c "SELECT 1;" > /dev/null 2>&1; then
  echo "  [OK] Conexión a DB OK"
else
  echo "  [ERROR] No se puede conectar a PostgreSQL"
  ERRORS=$((ERRORS + 1))
fi

# 3. Verificar que existen perfiles (evita foreign key errors)
echo "→ Verificando perfiles en DB..."
PROFILE_COUNT=$(docker exec quoorum-postgres psql -U postgres -d quoorum -t -c "SELECT COUNT(*) FROM profiles;" 2>/dev/null | xargs)
if [ -z "$PROFILE_COUNT" ] || [ "$PROFILE_COUNT" -eq 0 ]; then
  echo "  [WARN]  WARNING: No hay perfiles en DB (posible foreign key error)"
  echo "     Usuario actual debe tener perfil antes de crear debates"
  ERRORS=$((ERRORS + 1))
else
  echo "  [OK] $PROFILE_COUNT perfiles encontrados"
fi

# 4. Verificar tablas principales
echo "→ Verificando tablas principales..."
TABLES=("profiles" "quoorum_debates" "quoorum_debate_comments")
for table in "${TABLES[@]}"; do
  if docker exec quoorum-postgres psql -U postgres -d quoorum -c "\d $table" > /dev/null 2>&1; then
    echo "  [OK] Tabla $table existe"
  else
    echo "  [ERROR] Tabla $table NO existe"
    ERRORS=$((ERRORS + 1))
  fi
done

# 5. Verificar enum draft en debate_status
echo "→ Verificando enums..."
DRAFT_EXISTS=$(docker exec quoorum-postgres psql -U postgres -d quoorum -t -c "SELECT unnest(enum_range(NULL::debate_status));" 2>/dev/null | grep -c "draft")
if [ "$DRAFT_EXISTS" -eq 0 ]; then
  echo "  [ERROR] Enum 'draft' NO existe en debate_status"
  echo "     Ejecuta: docker exec quoorum-postgres psql -U postgres -d quoorum -c \"ALTER TYPE debate_status ADD VALUE 'draft';\""
  ERRORS=$((ERRORS + 1))
else
  echo "  [OK] Enum debate_status completo"
fi

# 6. Verificar columna deleted_at
echo "→ Verificando columnas críticas..."
DELETED_AT_EXISTS=$(docker exec quoorum-postgres psql -U postgres -d quoorum -t -c "\d quoorum_debates" 2>/dev/null | grep -c "deleted_at")
if [ "$DELETED_AT_EXISTS" -eq 0 ]; then
  echo "  [ERROR] Columna 'deleted_at' NO existe en quoorum_debates"
  echo "     Ejecuta: docker exec quoorum-postgres psql -U postgres -d quoorum -c \"ALTER TABLE quoorum_debates ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;\""
  ERRORS=$((ERRORS + 1))
else
  echo "  [OK] Columna deleted_at existe"
fi

# 7. Verificar imports (NO .js extensions en TypeScript)
echo "→ Verificando imports de TypeScript..."
if command -v pwsh &> /dev/null; then
  # Windows con PowerShell
  IMPORT_ERRORS=$(pwsh -NoProfile -File scripts/check-imports-simple.ps1 2>&1 | grep -c "Found .js extension" || echo "0")
  if [ "$IMPORT_ERRORS" -gt 0 ]; then
    echo "  [ERROR] Encontrados $IMPORT_ERRORS archivos con .js extensions"
    echo "     Ejecuta: pwsh -File scripts/fix-imports.ps1"
    ERRORS=$((ERRORS + 1))
  else
    echo "  [OK] Todos los imports correctos (sin .js extensions)"
  fi
else
  # Linux/macOS con bash
  IMPORT_ERRORS=$(bash scripts/check-imports-simple.sh 2>&1 | grep -c "Found .js extension" || echo "0")
  if [ "$IMPORT_ERRORS" -gt 0 ]; then
    echo "  [ERROR] Encontrados archivos con .js extensions"
    echo "     Ejecuta: bash scripts/check-imports-simple.sh"
    ERRORS=$((ERRORS + 1))
  else
    echo "  [OK] Todos los imports correctos (sin .js extensions)"
  fi
fi

# 8. Verificar sincronización de enums (NO hardcodear enums de DB)
echo "→ Verificando sincronización de enums..."
if command -v tsx &> /dev/null; then
  if tsx scripts/verify-enum-sync.ts 2>&1 | grep -q "Verification PASSED"; then
    echo "  [OK] Todos los enums infieren desde DB"
  else
    echo "  [ERROR] Detectados enums hardcodeados"
    echo "     Ejecuta: pnpm validate:enums"
    echo "     Ver: docs/claude/05-patterns.md#type-inference"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  [WARN] tsx no disponible, omitiendo verificación de enums"
fi

# RESULTADO FINAL
echo ""
echo "========================================"
if [ $ERRORS -eq 0 ]; then
  echo "[OK] PRE-FLIGHT CHECKS PASSED"
  echo "   Puedes continuar con confianza"
  exit 0
else
  echo "[ERROR] PRE-FLIGHT CHECKS FAILED ($ERRORS errores)"
  echo "   CORRIGE LOS ERRORES ANTES DE CONTINUAR"
  exit 1
fi
