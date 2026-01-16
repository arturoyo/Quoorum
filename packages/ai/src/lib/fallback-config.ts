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

export type ProviderName = 'google' | 'deepseek' | 'groq' | 'openai' | 'anthropic'

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
    modelId: 'gemini-2.0-flash-exp',
    displayName: 'Gemini 2.0 Flash',
    costPerMillion: 0,
    isFree: true,
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
    modelId: 'claude-3-5-haiku-20241022',
    displayName: 'Claude 3.5 Haiku',
    costPerMillion: 0.75, // (0.25 + 1.25) / 2
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
