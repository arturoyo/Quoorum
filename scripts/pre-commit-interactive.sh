#!/bin/bash
# Checklist interactivo ANTES de commit

echo "📋 PRE-COMMIT CHECKLIST"
echo "======================="

# Helper function
ask_question() {
  echo ""
  echo "❓ $1"
  echo "   → $2"
  read -p "   ¿Completado? (y/n): " answer
  if [ "$answer" != "y" ]; then
    echo "   [ERROR] Debes completar este paso antes de hacer commit"
    exit 1
  fi
  echo "   [OK] OK"
}

# Verificar archivos importantes sin trackear
echo "→ Verificando archivos sin trackear..."
IMPORTANT_PATTERNS=(
  "*.svg"
  "*.png"
  "*.jpg"
  "*.jpeg"
  "*.gif"
  "*.ico"
  "apps/web/public/*"
  "packages/*/src/**/*.ts"
  "packages/*/src/**/*.tsx"
)

UNTRACKED_IMPORTANT=()
for pattern in "${IMPORTANT_PATTERNS[@]}"; do
  while IFS= read -r file; do
    # Excluir node_modules, .next, .turbo, etc.
    if [[ ! "$file" =~ (node_modules|\.next|\.turbo|dist|build|coverage|\.git) ]]; then
      UNTRACKED_IMPORTANT+=("$file")
    fi
  done < <(git ls-files --others --exclude-standard "$pattern" 2>/dev/null)
done

if [ ${#UNTRACKED_IMPORTANT[@]} -gt 0 ]; then
  echo ""
  echo "⚠️  ARCHIVOS IMPORTANTES SIN TRACKEAR DETECTADOS:"
  echo "   Estos archivos podrían perderse si no se añaden a git:"
  echo ""
  for file in "${UNTRACKED_IMPORTANT[@]}"; do
    echo "   • $file"
  done
  echo ""
  read -p "   ¿Añadir estos archivos al commit? (y/n): " add_files
  if [ "$add_files" = "y" ]; then
    for file in "${UNTRACKED_IMPORTANT[@]}"; do
      git add "$file"
      echo "   ✅ Añadido: $file"
    done
  else
    echo "   ⚠️  Archivos NO añadidos (podrían perderse)"
    read -p "   ¿Continuar de todas formas? (y/n): " continue_anyway
    if [ "$continue_anyway" != "y" ]; then
      echo "   ❌ Commit cancelado"
      exit 1
    fi
  fi
fi

# Pre-flight checks primero
echo ""
echo "→ Ejecutando pre-flight checks..."
bash scripts/pre-flight.sh || exit 1

# Checklist según el tipo de cambio
echo ""
echo "¿Qué tipo de cambio estás haciendo?"
echo "1) Nuevo router/endpoint"
echo "2) Cambio en schema DB"
echo "3) Migración de Supabase a PostgreSQL"
echo "4) Otro"
read -p "Selecciona (1-4): " change_type

case $change_type in
  1)
    ask_question "Validación Zod" "¿Todos los inputs tienen validación Zod?"
    ask_question "Filtro userId" "¿Todas las queries filtran por userId?"
    ask_question "Error handling" "¿Usas TRPCError para errores?"
    
    # Verificar si es un procedimiento de créditos
    if git diff --cached --name-only | grep -q "packages/api/src/routers/admin.ts"; then
      if git diff --cached packages/api/src/routers/admin.ts | grep -qE "(addCredits|deductCredits)"; then
        echo ""
        echo "  🔍 Detectado cambio en procedimientos de créditos del admin router"
        ask_question "Usa @quoorum/quoorum" "¿Usas addCredits/deductCredits de @quoorum/quoorum?"
        ask_question "Retorno correcto" "¿Retornas creditsAdded/creditsDeducted y newBalance?"
        ask_question "Validación reason" "¿deductCredits requiere reason obligatorio?"
      fi
    fi
    
    ask_question "Tests" "¿Escribiste tests para el nuevo endpoint?"
    ;;
  2)
    ask_question "Schema Drizzle" "¿Actualizaste el schema Drizzle?"
    ask_question "Migración generada" "¿Ejecutaste 'pnpm db:generate'?"
    ask_question "Backup" "¿Hiciste backup de la DB antes de aplicar?"
    ask_question "Verificación" "¿Verificaste que el schema se aplicó correctamente?"
    ;;
  3)
    ask_question "Perfiles existen" "¿Verificaste que existen perfiles en PostgreSQL local?"
    ask_question "Foreign keys" "¿Verificaste todas las tablas referenciadas existen?"
    ask_question "Drizzle ORM" "¿Usas db (Drizzle) para todas las queries?"
    ask_question "Filtrado userId" "¿Todas las queries filtran por userId?"
    ;;
  *)
    ask_question "ERRORES-COMETIDOS.md" "¿Leíste ERRORES-COMETIDOS.md?"
    ask_question "Tests" "¿Ejecutaste los tests relevantes?"
    ;;
esac

# Auto-fix errors primero
echo ""
echo "→ Ejecutando auto-fix de errores comunes..."
pnpm fix:auto || echo "[WARN]  Auto-fix falló, continuando..."

# Automated violation detection
echo ""
echo "→ Verificando violaciones de código (colores hardcodeados, console.log, any)..."
bash scripts/check-code-violations.sh || exit 1

# TypeCheck + Lint (siempre)
echo ""
echo "→ Ejecutando TypeCheck..."
pnpm typecheck || exit 1

echo "→ Ejecutando Lint..."
pnpm lint || exit 1

echo ""
echo "[OK] PRE-COMMIT CHECKLIST COMPLETADO"
echo "   Puedes hacer commit con confianza"
