#!/bin/bash
# 🚨 AUTOMATED CODE VIOLATION DETECTION
# Detecta colores hardcodeados, any types, y console.log
# Se ejecuta automáticamente en pre-commit

echo "🔍 VERIFICANDO VIOLACIONES DE CÓDIGO..."

VIOLATIONS_FOUND=0

# ═══════════════════════════════════════════════════════════
# 1. COLORES HARDCODEADOS (NO usar var(--theme-*))
# ═══════════════════════════════════════════════════════════

echo ""
echo "→ Verificando colores hardcodeados..."

# Patrones prohibidos de colores
HARDCODED_PATTERNS=(
  "className=\"[^\"]*bg-white/[0-9]"
  "className=\"[^\"]*text-white[^-]"
  "className=\"[^\"]*bg-black"
  "className=\"[^\"]*text-black[^-]"
  "className=\"[^\"]*border-white/"
  "className=\"[^\"]*text-gray-[0-9]"
  "className='[^']*bg-white/[0-9]"
  "className='[^']*text-white[^-]"
  "className='[^']*bg-black"
  "className='[^']*text-black[^-]"
  "className='[^']*border-white/"
  "className='[^']*text-gray-[0-9]"
)

# Archivos a revisar (staged files)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(tsx|ts|jsx|js)$')

if [ -z "$STAGED_FILES" ]; then
  echo "   ℹ️  No hay archivos staged para revisar"
else
  for pattern in "${HARDCODED_PATTERNS[@]}"; do
    MATCHES=$(echo "$STAGED_FILES" | xargs grep -Hn -E "$pattern" 2>/dev/null || true)

    if [ ! -z "$MATCHES" ]; then
      echo ""
      echo "   [ERROR] COLORES HARDCODEADOS DETECTADOS:"
      echo "$MATCHES" | while IFS=: read -r file line content; do
        echo "      📄 $file:$line"
        echo "         → $(echo "$content" | xargs)"
        echo ""
      done
      VIOLATIONS_FOUND=$((VIOLATIONS_FOUND + 1))
    fi
  done
fi

# ═══════════════════════════════════════════════════════════
# 2. CONSOLE.LOG EN PRODUCCIÓN (ESLint ya lo detecta)
# ═══════════════════════════════════════════════════════════

echo ""
echo "→ Verificando console.log en producción..."

# Buscar console.log/error/warn en staged files (excluyendo tests y scripts)
CONSOLE_MATCHES=$(echo "$STAGED_FILES" | \
  grep -v -E '(__tests__|\.test\.|\.spec\.|scripts/)' | \
  xargs grep -Hn -E 'console\.(log|error|warn|info)' 2>/dev/null || true)

if [ ! -z "$CONSOLE_MATCHES" ]; then
  echo ""
  echo "   [ERROR] CONSOLE.LOG DETECTADO EN PRODUCCIÓN:"
  echo "$CONSOLE_MATCHES" | while IFS=: read -r file line content; do
    echo "      📄 $file:$line"
    echo "         → $(echo "$content" | xargs)"
    echo ""
  done
  VIOLATIONS_FOUND=$((VIOLATIONS_FOUND + 1))
fi

# ═══════════════════════════════════════════════════════════
# 3. ANY TYPES (ESLint ya lo detecta, pero redundancia útil)
# ═══════════════════════════════════════════════════════════

echo ""
echo "→ Verificando 'any' types..."

# Buscar : any (excluyendo tests)
ANY_MATCHES=$(echo "$STAGED_FILES" | \
  grep -v -E '(__tests__|\.test\.|\.spec\.)' | \
  xargs grep -Hn -E ':\s*any\s*[,;=)]' 2>/dev/null || true)

if [ ! -z "$ANY_MATCHES" ]; then
  echo ""
  echo "   [ERROR] TIPOS 'ANY' DETECTADOS:"
  echo "$ANY_MATCHES" | while IFS=: read -r file line content; do
    echo "      📄 $file:$line"
    echo "         → $(echo "$content" | xargs)"
    echo ""
  done
  VIOLATIONS_FOUND=$((VIOLATIONS_FOUND + 1))
fi

# ═══════════════════════════════════════════════════════════
# RESULTADO FINAL
# ═══════════════════════════════════════════════════════════

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $VIOLATIONS_FOUND -gt 0 ]; then
  echo "[ERROR] VIOLACIONES DETECTADAS: $VIOLATIONS_FOUND"
  echo ""
  echo "🚨 ACCIÓN REQUERIDA:"
  echo ""
  echo "1. COLORES HARDCODEADOS → Usa variables CSS:"
  echo "   [ERROR] bg-white/5, text-white, border-white/10"
  echo "   [OK] bg-[var(--theme-landing-card)]"
  echo "   [OK] text-[var(--theme-text-primary)]"
  echo "   [OK] border-[var(--theme-landing-border)]"
  echo ""
  echo "   O usa componentes themed:"
  echo "   [OK] <ThemedCard>"
  echo "   [OK] <ThemedText.Primary>"
  echo "   [OK] <ThemedInput>"
  echo ""
  echo "2. CONSOLE.LOG → Usa logger estructurado o elimínalo"
  echo ""
  echo "3. ANY TYPES → Define tipos explícitos"
  echo ""
  echo "Ver guía completa en: CLAUDE-CORE.md (Regla #6 y #13)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
else
  echo "[OK] NO SE DETECTARON VIOLACIONES"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
fi
