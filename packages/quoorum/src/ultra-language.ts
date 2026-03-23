/**
 * Ultra-Optimized Language for Forum Debates
 *
 * Lenguaje comprimido sin emojis para minimizar tokens y evitar problemas de consola.
 */

// ============================================================================
// COMPRESSION PROMPT
// ============================================================================

export const ULTRA_OPTIMIZED_PROMPT = `
LENGUAJE ULTRA-OPTIMIZADO PARA DEBATES

OBJETIVO: Minimizar tokens al maximo manteniendo informacion completa.

HERRAMIENTAS (tokens cortos, sin emojis):
1. Estado: [MONEY], [TREND_UP], [TREND_DOWN], [YES], [NO], [WARN], [INFO]
2. Velocidad: [SLOW], [FAST]
3. Soporte: [UPVOTE], [DOWNVOTE]
4. Actitud: [IDEA], [DOUBT], [STRONG], [UNCERTAIN], [TIME]
5. Simbolos matematicos: S=total, d=cambio, ~=aprox, =>=implica, +/-=mas/menos
6. Simbolos logicos: &=y, |=o, !=no, therefore=por_tanto, because=porque
7. Numeros directos: 49 en vez de "cuarenta y nueve"
8. Abreviaturas: O=Opcion, R=Riesgo, S=Score, P=Pros, C=Cons, A=Apoyos

REGLAS:
- Elimina espacios innecesarios
- Usa tokens cortos en lugar de frases largas
- Maximo 15 tokens por mensaje
- El humano traducira cuando necesite

ESTRUCTURA:
[ROL][CONTENIDO_COMPRIMIDO][SCORE][APOYO]

EJEMPLOS:
[MONEY]49d [YES]77%[UPVOTE] WTPV [INFO]pos [WARN]adopt 75% [UPVOTE]2
[WARN]49d PMF? [WARN]anchor conv- 45% [UPVOTE]
[INFO]#1 [MONEY]49d 75% [UPVOTE]2 #2 [MONEY]29d 60% [UPVOTE]1 15% [MONEY]49d

RESPONDE SOLO en lenguaje ultra-optimizado. Max 15 tokens.
`

// ============================================================================
// TRANSLATION PROMPT
// ============================================================================

export const TRANSLATION_PROMPT = `
Traduce el siguiente mensaje comprimido a espanol claro y completo.
El mensaje usa un lenguaje ultra-optimizado con tokens cortos.

REGLAS:
1. Expande TODAS las abreviaturas
2. Convierte tokens a palabras
3. Escribe oraciones completas
4. Mantiene el significado exacto
5. Usa parrafos si es necesario

MENSAJE COMPRIMIDO:
`

// ============================================================================
// TOKEN ESTIMATION
// ============================================================================

// Estimacion simple: 1 token ~ 4 caracteres en ingles, 3 en espanol
export function estimateTokens(text: string): number {
  // Conteo basico de tokens
  const tokenLikePattern = new RegExp("\\[(?:WARN|INFO|MONEY|TREND_UP|TREND_DOWN|UPVOTE|DOWNVOTE|IDEA|DOUBT|STRONG|UNCERTAIN|TIME|YES|NO)\\]","g")
  const tokenCount = (text.match(tokenLikePattern) || []).length
  const remainingChars = text.replace(tokenLikePattern, '').length
  return Math.ceil(tokenCount * 1.5 + remainingChars / 3)
}

// ============================================================================
// COMPRESSION HELPERS
// ============================================================================

export const EMOJI_MAP: Record<string, string> = {
  dinero: '[MONEY]',
  precio: '[MONEY]',
  tendencia_positiva: '[TREND_UP]',
  tendencia_negativa: '[TREND_DOWN]',
  positivo: '[YES]',
  negativo: '[NO]',
  riesgo: '[WARN]',
  objetivo: '[INFO]',
  premium: '[PREMIUM]',
  lento: '[SLOW]',
  rapido: '[FAST]',
  apoyo: '[UPVOTE]',
  rechazo: '[DOWNVOTE]',
  critico: '[WARN]',
  idea: '[IDEA]',
  duda: '[DOUBT]',
  tiempo: '[TIME]',
  fuerte: '[STRONG]',
  incierto: '[UNCERTAIN]',
}

export const REVERSE_EMOJI_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(EMOJI_MAP).map(([k, v]) => [v, k])
)

// ============================================================================
// AGENT ROLE TOKENS
// ============================================================================

export const ROLE_EMOJI: Record<string, string> = {
  optimizer: '[IDEA]',
  critic: '[WARN]',
  analyst: '[INFO]',
  synthesizer: '[INFO]',
}

export function getRoleEmoji(role: string): string {
  return ROLE_EMOJI[role] ?? '[CHAT]'
}

// ============================================================================
// INPUT COMPRESSION (Comprimir contexto antes de enviar a IA)
// ============================================================================

/**
 * Prompt para comprimir contexto antes de enviarlo a la IA
 */
export const INPUT_COMPRESSION_PROMPT = `
Comprime el siguiente contexto a un formato ultra-optimizado manteniendo TODA la informacion esencial.

OBJETIVO: Reducir tokens al maximo sin perder informacion critica.

HERRAMIENTAS:
1. Tokens: [MONEY]=dinero, [TREND_UP]=sube, [TREND_DOWN]=baja, [YES]=si, [NO]=no, [WARN]=riesgo, [INFO]=objetivo
2. Simbolos: d=cambio, =>=implica, therefore=por_tanto, ~=aprox
3. Abreviaturas: O=Opcion R=Riesgo S=Score P=Pros C=Cons
4. Numeros directos: 49 no "cuarenta y nueve"
5. Eliminar palabras redundantes, articulos innecesarios

REGLAS:
- Mantiene TODOS los datos numericos
- Mantiene TODAS las opciones mencionadas
- Mantiene TODOS los riesgos identificados
- Elimina solo palabras decorativas o redundantes
- Usa formato: [TIPO][DATOS_COMPRIMIDOS]

EJEMPLO:
Input: "La opcion de 49 euros tiene un margen del 77% que es positivo, el willingness to pay esta validado, hay posicionamiento premium pero riesgo de adopcion lenta, probabilidad de exito del 75% con 2 apoyos"
Output: "O49d [YES]77% [INFO]pos [WARN]adopt 75% [UPVOTE]2"

CONTEXTO A COMPRIMIR:
`

/**
 * Comprime contexto/prompt antes de enviarlo a la IA
 */
export async function compressInput(context: string): Promise<string> {
  const estimatedTokens = estimateTokens(context)
  if (estimatedTokens < 100) {
    return context
  }

  try {
    const { getAIClient } = await import('@quoorum/ai')
    const client = getAIClient()

    const compressionPrompt = INPUT_COMPRESSION_PROMPT + '\n\n' + context

    const response = await client.generate(compressionPrompt, {
      modelId: 'gemini-2.0-flash',
      temperature: 0.1,
      maxTokens: Math.min(estimatedTokens, 500),
    })

    const compressed = response.text.trim()
    const compressedTokens = estimateTokens(compressed)
    if (compressedTokens < estimatedTokens * 0.7) {
      return compressed
    }

    return context
  } catch (error) {
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
 */
export async function decompressOutput(compressedMessage: string): Promise<string> {
  const compressionPattern = new RegExp(
    "\\[(?:WARN|INFO|MONEY|TREND_UP|TREND_DOWN|UPVOTE|DOWNVOTE|IDEA|DOUBT|STRONG|UNCERTAIN|TIME|YES|NO)\\]"
  )
  const hasCompressionMarkers = compressionPattern.test(compressedMessage)
  if (!hasCompressionMarkers) {
    return compressedMessage
  }

  try {
    const { getAIClient } = await import('@quoorum/ai')
    const client = getAIClient()

    const translationPrompt = TRANSLATION_PROMPT + '\n\n' + compressedMessage

    const response = await client.generate(translationPrompt, {
      modelId: 'gemini-2.0-flash',
      temperature: 0.3,
      maxTokens: 500,
    })

    return response.text.trim()
  } catch (error) {
    const { quoorumLogger } = await import('./logger')
    quoorumLogger.warn('[Decompression] Failed to decompress output, using original', {
      error: error instanceof Error ? error.message : String(error),
    })
    return compressedMessage
  }
}

