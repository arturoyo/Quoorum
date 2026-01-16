/**
 * AI Request Telemetry and Cost Tracking
 *
 * Tracks AI API usage, costs, latency, and errors for analytics
 * and monitoring. Integrates with PostHog for telemetry.
 */

export interface AIRequestMetrics {
  provider: string
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  latencyMs: number
  success: boolean
  costUsd?: number
  userId?: string
  feature?: string // e.g., 'chat', 'analysis', 'debate'
  errorType?: string
}

export interface CostConfig {
  model: string
  promptCostPer1M: number
  completionCostPer1M: number
}

// Cost configuration per model (USD per 1M tokens)
const MODEL_COSTS: Record<string, CostConfig> = {
  // OpenAI
  'gpt-4o': { model: 'gpt-4o', promptCostPer1M: 2.5, completionCostPer1M: 10.0 },
  'gpt-4o-mini': { model: 'gpt-4o-mini', promptCostPer1M: 0.15, completionCostPer1M: 0.6 },
  'gpt-4-turbo': { model: 'gpt-4-turbo', promptCostPer1M: 10.0, completionCostPer1M: 30.0 },
  'gpt-3.5-turbo': { model: 'gpt-3.5-turbo', promptCostPer1M: 0.5, completionCostPer1M: 1.5 },

  // Anthropic
  'claude-opus-4-5-20251101': {
    model: 'claude-opus-4-5',
    promptCostPer1M: 15.0,
    completionCostPer1M: 75.0,
  },
  'claude-sonnet-4-20250514': {
    model: 'claude-sonnet-4',
    promptCostPer1M: 3.0,
    completionCostPer1M: 15.0,
  },
  'claude-3-5-sonnet-20241022': {
    model: 'claude-3-5-sonnet',
    promptCostPer1M: 3.0,
    completionCostPer1M: 15.0,
  },
  'claude-3-5-haiku-20241022': {
    model: 'claude-3-5-haiku',
    promptCostPer1M: 0.8,
    completionCostPer1M: 4.0,
  },

  // Google Gemini
  'gemini-2.0-flash-exp': { model: 'gemini-2.0-flash', promptCostPer1M: 0.0, completionCostPer1M: 0.0 }, // Free
  'gemini-1.5-flash': { model: 'gemini-1.5-flash', promptCostPer1M: 0.075, completionCostPer1M: 0.3 },
  'gemini-1.5-pro': { model: 'gemini-1.5-pro', promptCostPer1M: 1.25, completionCostPer1M: 5.0 },

  // Groq
  'llama-3.3-70b-versatile': { model: 'llama-3.3-70b', promptCostPer1M: 0.59, completionCostPer1M: 0.79 },
  'llama-3.1-70b-versatile': { model: 'llama-3.1-70b', promptCostPer1M: 0.59, completionCostPer1M: 0.79 },

  // DeepSeek
  'deepseek-chat': { model: 'deepseek-chat', promptCostPer1M: 0.14, completionCostPer1M: 0.28 },
}

/**
 * Calculate cost for an AI request
 */
export function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const config = MODEL_COSTS[model]
  if (!config) {
    // Unknown model, estimate as mid-tier
    return ((promptTokens * 1.0 + completionTokens * 3.0) / 1_000_000)
  }

  const promptCost = (promptTokens / 1_000_000) * config.promptCostPer1M
  const completionCost = (completionTokens / 1_000_000) * config.completionCostPer1M

  return promptCost + completionCost
}

/**
 * In-memory telemetry store (for simple aggregation)
 */
class TelemetryStore {
  private metrics: AIRequestMetrics[] = []
  private maxSize = 1000 // Keep last 1000 requests in memory

  add(metric: AIRequestMetrics): void {
    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxSize) {
      this.metrics = this.metrics.slice(-this.maxSize)
    }
  }

  getAll(): AIRequestMetrics[] {
    return this.metrics
  }

  getByProvider(provider: string): AIRequestMetrics[] {
    return this.metrics.filter((m) => m.provider === provider)
  }

  getByFeature(feature: string): AIRequestMetrics[] {
    return this.metrics.filter((m) => m.feature === feature)
  }

  getSuccessRate(provider?: string): number {
    const filtered = provider ? this.getByProvider(provider) : this.metrics
    if (filtered.length === 0) return 0

    const successful = filtered.filter((m) => m.success).length
    return (successful / filtered.length) * 100
  }

  getTotalCost(provider?: string): number {
    const filtered = provider ? this.getByProvider(provider) : this.metrics
    return filtered.reduce((sum, m) => sum + (m.costUsd ?? 0), 0)
  }

  getAverageLatency(provider?: string): number {
    const filtered = provider ? this.getByProvider(provider) : this.metrics
    if (filtered.length === 0) return 0

    const total = filtered.reduce((sum, m) => sum + m.latencyMs, 0)
    return total / filtered.length
  }

  getTotalTokens(provider?: string): { prompt: number; completion: number; total: number } {
    const filtered = provider ? this.getByProvider(provider) : this.metrics

    return filtered.reduce(
      (acc, m) => ({
        prompt: acc.prompt + m.promptTokens,
        completion: acc.completion + m.completionTokens,
        total: acc.total + m.totalTokens,
      }),
      { prompt: 0, completion: 0, total: 0 }
    )
  }

  reset(): void {
    this.metrics = []
  }
}

// Singleton store
let storeInstance: TelemetryStore | null = null

function getStore(): TelemetryStore {
  if (!storeInstance) {
    storeInstance = new TelemetryStore()
  }
  return storeInstance
}

/**
 * Track an AI request (stores locally and sends to PostHog)
 */
export async function trackAIRequest(metrics: AIRequestMetrics): Promise<void> {
  // Calculate cost if not provided
  if (!metrics.costUsd) {
    metrics.costUsd = calculateCost(metrics.model, metrics.promptTokens, metrics.completionTokens)
  }

  // Store locally
  const store = getStore()
  store.add(metrics)

  // Send to PostHog (if available)
  try {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('ai_request', {
        provider: metrics.provider,
        model: metrics.model,
        tokens: metrics.totalTokens,
        latency_ms: metrics.latencyMs,
        success: metrics.success,
        cost_usd: metrics.costUsd,
        feature: metrics.feature,
        error_type: metrics.errorType,
      })
    }

    // Server-side PostHog (if configured)
    // TODO: Add server-side PostHog client integration
  } catch (error) {
    // Silently fail telemetry errors
    console.warn('Failed to track AI request:', error)
  }
}

/**
 * Track quota alert (when approaching limits)
 */
export async function trackQuotaAlert(
  provider: string,
  metric: 'rpm' | 'tpm' | 'rpd',
  percent: number,
  type: 'warning' | 'critical'
): Promise<void> {
  try {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('quota_alert', {
        provider,
        metric,
        percent,
        type,
      })
    }
  } catch (error) {
    console.warn('Failed to track quota alert:', error)
  }
}

/**
 * Get telemetry summary
 */
export function getTelemetrySummary(provider?: string): {
  totalRequests: number
  successRate: number
  totalCost: number
  averageLatency: number
  totalTokens: { prompt: number; completion: number; total: number }
} {
  const store = getStore()
  const filtered = provider ? store.getByProvider(provider) : store.getAll()

  return {
    totalRequests: filtered.length,
    successRate: store.getSuccessRate(provider),
    totalCost: store.getTotalCost(provider),
    averageLatency: store.getAverageLatency(provider),
    totalTokens: store.getTotalTokens(provider),
  }
}

/**
 * Get all telemetry metrics (for export/debugging)
 */
export function getAllTelemetry(): AIRequestMetrics[] {
  return getStore().getAll()
}

/**
 * Reset all telemetry (for testing)
 */
export function resetAllMetrics(): void {
  getStore().reset()
}

/**
 * Estimate monthly cost based on current usage
 */
export function estimateMonthlyCost(daysElapsed: number = 1): number {
  const totalCost = getTelemetrySummary().totalCost
  const dailyCost = totalCost / daysElapsed
  return dailyCost * 30 // Estimate for 30 days
}
