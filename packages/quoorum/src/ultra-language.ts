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
  // Regex para emojis: usar patrón simple sin rangos problemáticos
  // Detecta emojis comunes usados en el sistema de compresión
  // eslint-disable-next-line security/detect-unsafe-regex -- Simple emoji pattern, safe
  const emojiPattern = /[💰📈📉✓✗⚠️🎯👑🐌🚀👍👎🔥💡🤔⏰💪🎲]/gu
  const emojiCount = (text.match(emojiPattern) || []).length
  // Caracteres restantes
  const charCount = text.replace(emojiPattern, '').length
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

// ============================================================================
// INPUT COMPRESSION (Comprimir contexto antes de enviar a IA)
// ============================================================================

/**
 * Prompt para comprimir contexto antes de enviarlo a la IA
 */
export const INPUT_COMPRESSION_PROMPT = `
Comprime el siguiente contexto a un formato ultra-optimizado manteniendo TODA la información esencial.

OBJETIVO: Reducir tokens al máximo sin perder información crítica.

HERRAMIENTAS:
1. Emojis (1 token): 💰=dinero 📈=sube 📉=baja ✓=sí ✗=no ⚠️=riesgo 🎯=objetivo
2. Símbolos: ∆=cambio →=implica ∴=por_tanto ≈=aprox
3. Abreviaturas: O=Opción R=Riesgo S=Score P=Pros C=Cons
4. Números directos: 49 no "cuarenta y nueve"
5. Eliminar palabras redundantes, artículos innecesarios

REGLAS:
- Mantén TODOS los datos numéricos
- Mantén TODAS las opciones mencionadas
- Mantén TODOS los riesgos identificados
- Elimina solo palabras decorativas o redundantes
- Usa formato: [TIPO][DATOS_COMPRIMIDOS]

EJEMPLO:
Input: "La opción de 49 euros tiene un margen del 77% que es positivo, el willingness to pay está validado, hay posicionamiento premium pero riesgo de adopción lenta, probabilidad de éxito del 75% con 2 apoyos"
Output: "O49€ ✓77%📈 WTP✓ 👑pos ⚠️🐌adopt 75% 👍2"

CONTEXTO A COMPRIMIR:
`

/**
 * Comprime contexto/prompt antes de enviarlo a la IA
 * @param context - Contexto original (pregunta, contexto corporativo, rondas previas)
 * @returns Contexto comprimido (menos tokens)
 */
export async function compressInput(context: string): Promise<string> {
  // Si el contexto es muy corto, no vale la pena comprimir
  const estimatedTokens = estimateTokens(context)
  if (estimatedTokens < 100) {
    return context // No comprimir si es muy corto
  }

  try {
    const { getAIClient } = await import('@quoorum/ai')
    const client = getAIClient()

    const compressionPrompt = INPUT_COMPRESSION_PROMPT + '\n\n' + context

    const response = await client.generate(compressionPrompt, {
      modelId: 'gemini-2.0-flash-exp', // Free tier para compresión
      temperature: 0.1, // Baja temperatura para mantener precisión
      maxTokens: Math.min(estimatedTokens, 500), // Máximo 500 tokens de salida
    })

    const compressed = response.text.trim()

    // Verificar que la compresión realmente redujo tokens
    const compressedTokens = estimateTokens(compressed)
    if (compressedTokens < estimatedTokens * 0.7) {
      // Si redujo al menos 30%, usar comprimido
      return compressed
    }

    // Si no redujo suficiente, usar original
    return context
  } catch (error) {
    // Si falla la compresión, usar original (no crítico)
    // Usar import dinámico para evitar dependencia circular
    const { quoorumLogger } = await import('./logger')
    quoorumLogger.warn('[Compression] Failed to compress input, using original', {
      error: error instanceof Error ? error.message : String(error),
    })
    return context
  }
}

// ============================================================================
// OUTPUT DECOMPRESSION (Descomprimir respuesta de IA para mostrar al usuario)
// ============================================================================

/**
 * Descomprime respuesta de IA de formato ultra-optimizado a texto legible
 * @param compressedMessage - Mensaje comprimido de la IA
 * @returns Mensaje expandido y legible para el usuario
 */
export async function decompressOutput(compressedMessage: string): Promise<string> {
  // Si el mensaje no parece comprimido (no tiene emojis ni símbolos), devolver tal cual
  // Regex para detectar emojis y símbolos de compresión (sin rangos problemáticos)
  // eslint-disable-next-line security/detect-unsafe-regex -- Simple pattern, safe
  const hasCompressionMarkers = /[💰📈📉✓✗⚠️🎯👑🐌🚀👍👎🔥💡🤔⏰💪🎲∆→∴≈]/.test(compressedMessage)
  if (!hasCompressionMarkers) {
    return compressedMessage // Ya está legible
  }

  try {
    const { getAIClient } = await import('@quoorum/ai')
    const client = getAIClient()

    const translationPrompt = TRANSLATION_PROMPT + '\n\n' + compressedMessage

    const response = await client.generate(translationPrompt, {
      modelId: 'gemini-2.0-flash-exp', // Free tier para traducción
      temperature: 0.3, // Baja temperatura para mantener precisión
      maxTokens: 500, // Suficiente para expandir mensaje comprimido
    })

    return response.text.trim()
  } catch (error) {
    // Si falla la descompresión, devolver original (mejor que nada)
    // Usar import dinámico para evitar dependencia circular
    const { quoorumLogger } = await import('./logger')
    quoorumLogger.warn('[Decompression] Failed to decompress output, using original', {
      error: error instanceof Error ? error.message : String(error),
    })
    return compressedMessage
  }
}
