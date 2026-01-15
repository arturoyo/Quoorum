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
    echo "   ❌ Debes completar este paso antes de hacer commit"
    exit 1
  fi
  echo "   ✅ OK"
}

# Pre-flight checks primero
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
    ask_question "Drizzle ORM" "¿Cambiaste de ctx.supabase a db (Drizzle)?"
    ask_question "Filtrado userId" "¿Todas las queries filtran por userId?"
    ;;
  *)
    ask_question "ERRORES-COMETIDOS.md" "¿Leíste ERRORES-COMETIDOS.md?"
    ask_question "Tests" "¿Ejecutaste los tests relevantes?"
    ;;
esac

# TypeCheck + Lint (siempre)
echo ""
echo "→ Ejecutando TypeCheck..."
pnpm typecheck || exit 1

echo "→ Ejecutando Lint..."
pnpm lint || exit 1

echo ""
echo "✅ PRE-COMMIT CHECKLIST COMPLETADO"
echo "   Puedes hacer commit con confianza"
