/**
 * AI Provider Fallback Configuration
 *
 * Orden: Más barato → Más caro (ideal para desarrollo/pruebas)
 *
 * Costos aproximados por 1M tokens:
 * - Gemini 2.0 Flash: $0.00 (FREE tier)
 * - DeepSeek: $0.14
 * - Groq Llama: $0.05-0.10 (muy rápido)
 * - GPT-4o-mini: $0.15 (input) + $0.60 (output)
 * - Claude Haiku: $0.25 (input) + $1.25 (output)
 */

export type ProviderName = 'google' | 'deepseek' | 'groq' | 'openai' | 'anthropic' | 'optym'

export interface FallbackModel {
  provider: ProviderName
  modelId: string
  displayName: string
  costPerMillion: number // Promedio input/output
  isFree: boolean
}

/**
 * Orden de fallback: FREE primero, luego por costo ascendente
 */
export const FALLBACK_ORDER: FallbackModel[] = [
  {
    provider: 'google',
    modelId: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    costPerMillion: 0,
    isFree: true,
  },
  {
    provider: 'optym',
    modelId: 'optym-balanced',
    displayName: 'OPTYM (balanced)',
    costPerMillion: 0.22,
    isFree: false,
  },
  {
    provider: 'deepseek',
    modelId: 'deepseek-chat',
    displayName: 'DeepSeek Chat',
    costPerMillion: 0.14,
    isFree: false,
  },
  {
    provider: 'groq',
    modelId: 'llama-3.3-70b-versatile',
    displayName: 'Groq Llama 3.3 70B',
    costPerMillion: 0.08,
    isFree: false,
  },
  {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    costPerMillion: 0.38, // (0.15 + 0.60) / 2
    isFree: false,
  },
  {
    provider: 'anthropic',
    modelId: 'claude-haiku-4-5-20251001',
    displayName: 'Claude Haiku 4.5',
    costPerMillion: 0.75,
    isFree: false,
  },
]

/**
 * Get fallback chain starting from a specific provider
 * If original fails, try the next ones in order
 */
export function getFallbackChain(fromProvider?: ProviderName): FallbackModel[] {
  if (!fromProvider) {
    return FALLBACK_ORDER
  }

  const startIndex = FALLBACK_ORDER.findIndex((m) => m.provider === fromProvider)

  if (startIndex === -1) {
    // Provider not found, return full chain
    return FALLBACK_ORDER
  }

  // Return from current provider + rest of chain
  return FALLBACK_ORDER.slice(startIndex)
}

/**
 * Get next fallback after a provider fails
 */
export function getNextFallback(currentProvider: ProviderName): FallbackModel | null {
  const currentIndex = FALLBACK_ORDER.findIndex((m) => m.provider === currentProvider)

  if (currentIndex === -1 || currentIndex === FALLBACK_ORDER.length - 1) {
    return null
  }

  return FALLBACK_ORDER[currentIndex + 1] ?? null
}

/**
 * Get available fallback chain (only providers with API keys configured)
 */
export function getAvailableFallbackChain(fromProvider?: ProviderName): FallbackModel[] {
  const chain = getFallbackChain(fromProvider)
  return chain.filter((m) => {
    switch (m.provider) {
      case 'google': return !!process.env.GOOGLE_AI_API_KEY
      case 'openai': return !!process.env.OPENAI_API_KEY
      case 'anthropic': return !!process.env.ANTHROPIC_API_KEY
      case 'deepseek': return !!process.env.DEEPSEEK_API_KEY
      case 'groq': return !!process.env.GROQ_API_KEY
      case 'optym': return !!process.env.OPTYM_API_KEY
      default: return true
    }
  })
}
