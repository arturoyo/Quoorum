/**
 * Ultra-Optimized Language for Forum Debates
 *
 * Los agentes debaten en un lenguaje comprimido para minimizar tokens.
 * El humano puede traducir cuando necesite leer.
 */

// ============================================================================
// COMPRESSION PROMPT
// ============================================================================

export const ULTRA_OPTIMIZED_PROMPT = `
LENGUAJE ULTRA-OPTIMIZADO PARA DEBATES

OBJETIVO: Minimizar tokens al maximo manteniendo informacion completa.

HERRAMIENTAS:
1. Emojis (1 token)
   💰=dinero 📈📉=tendencias ✓✗=si/no ⚠️=riesgo 🎯=objetivo
   👑=premium 🐌🚀=lento/rapido 👍👎=apoyo 🔥=critico 💡=idea
   🤔=duda ⏰=tiempo 💪=fuerte 🎲=incierto

2. Simbolos matematicos
   ∑=total ∆=cambio ≈=aprox →=implica ↑↓=sube/baja ±=mas/menos

3. Simbolos logicos
   ∧=y ∨=o ¬=no ∴=por_tanto ∵=porque

4. Numeros directos: 49 no "cuarenta y nueve"

5. Abreviaturas: O=Opcion R=Riesgo S=Score P=Pros C=Cons A=Apoyan

REGLAS:
- Elimina espacios innecesarios
- Usa emojis en vez de palabras
- Maximo 15 tokens por mensaje
- El humano traducira cuando necesite

ESTRUCTURA:
[EMOJI_ROL][CONTENIDO_COMPRIMIDO][SCORE][APOYO]

EJEMPLOS:
💡49€ ✓77%📈 WTP✓ 👑pos ⚠️🐌adopt 75% 👍2
⚠️49€ ✗PMF? 🔥anchor ∆conv↓ 45% 👎
📊49€:77%📈 29€:58%📈 ∴49€if≥30% 70%
🎯#1💰49€ 75%👍2 #2💰29€ 60%👍1 ∆15%∴49€

RESPONDE SOLO en lenguaje ultra-optimizado. Max 15 tokens.
`

// ============================================================================
// TRANSLATION PROMPT
// ============================================================================

export const TRANSLATION_PROMPT = `
Traduce el siguiente mensaje comprimido a espanol claro y completo.
El mensaje usa un lenguaje ultra-optimizado con emojis y simbolos.

REGLAS:
1. Expande TODAS las abreviaturas
2. Convierte emojis a palabras
3. Escribe oraciones completas
4. Mantén el significado exacto
5. Usa parrafos si es necesario

MENSAJE COMPRIMIDO:
`

// ============================================================================
// TOKEN ESTIMATION
// ============================================================================

// Estimacion simple: 1 token ≈ 4 caracteres en ingles, 3 en espanol
export function estimateTokens(text: string): number {
  // Emojis cuentan como 1-2 tokens cada uno
  // eslint-disable-next-line security/detect-unsafe-regex -- Unicode range literal, safe and bounded
  const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length
  // Caracteres restantes
  // eslint-disable-next-line security/detect-unsafe-regex -- Unicode range literal, safe and bounded
  const charCount = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').length
  // Aproximacion conservadora
  return Math.ceil(emojiCount * 1.5 + charCount / 3)
}

// ============================================================================
// COMPRESSION HELPERS
// ============================================================================

export const EMOJI_MAP: Record<string, string> = {
  dinero: '💰',
  precio: '💰',
  tendencia_positiva: '📈',
  tendencia_negativa: '📉',
  positivo: '✓',
  negativo: '✗',
  riesgo: '⚠️',
  objetivo: '🎯',
  premium: '👑',
  lento: '🐌',
  rapido: '🚀',
  apoyo: '👍',
  rechazo: '👎',
  critico: '🔥',
  idea: '💡',
  duda: '🤔',
  tiempo: '⏰',
  fuerte: '💪',
  incierto: '🎲',
}

export const REVERSE_EMOJI_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(EMOJI_MAP).map(([k, v]) => [v, k])
)

// ============================================================================
// AGENT ROLE EMOJIS
// ============================================================================

export const ROLE_EMOJI: Record<string, string> = {
  optimizer: '💡',
  critic: '⚠️',
  analyst: '📊',
  synthesizer: '🎯',
}

export function getRoleEmoji(role: string): string {
  return ROLE_EMOJI[role] ?? '💬'
}
