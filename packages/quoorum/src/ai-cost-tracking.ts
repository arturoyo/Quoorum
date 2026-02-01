/**
 * AI Cost Tracking Utilities
 * Track ALL AI operations including free tier usage
 * Purpose: Prevent "hidden costs" from destroying profit margins
 */

import { db } from '@quoorum/db'
import { aiCostTracking, type AIOperationType, type AIProvider } from '@quoorum/db/schema'
import { quoorumLogger as logger } from './logger'

// ============================================================================
// PRICING DATA (cost per 1M tokens)
// ============================================================================

export const AI_PRICING = {
  openai: {
    'gpt-4o': { prompt: 2.5, completion: 10.0 },
    'gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
    'gpt-4-turbo': { prompt: 10.0, completion: 30.0 },
    'gpt-3.5-turbo': { prompt: 0.5, completion: 1.5 },
  },
  anthropic: {
    'claude-opus-4-5-20251101': { prompt: 15.0, completion: 75.0 },
    'claude-sonnet-4-20250514': { prompt: 3.0, completion: 15.0 },
    'claude-3-5-sonnet-20241022': { prompt: 3.0, completion: 15.0 },
    'claude-3-5-haiku-20241022': { prompt: 0.8, completion: 4.0 },
  },
  google: {
    'gemini-2.0-flash': { prompt: 0, completion: 0 }, // FREE (for now)
    'gemini-1.5-pro': { prompt: 1.25, completion: 5.0 },
    'gemini-1.5-flash': { prompt: 0.075, completion: 0.3 },
  },
  groq: {
    'llama-3.3-70b-versatile': { prompt: 0.59, completion: 0.79 },
    'mixtral-8x7b-32768': { prompt: 0.24, completion: 0.24 },
  },
  deepseek: {
    'deepseek-chat': { prompt: 0.14, completion: 0.28 },
    'deepseek-reasoner': { prompt: 0.55, completion: 2.19 },
  },
} as const

// ============================================================================
// COST CALCULATION
// ============================================================================

export function calculateAICost(
  provider: AIProvider,
  modelId: string,
  promptTokens: number,
  completionTokens: number
): {
  costUsdPrompt: number
  costUsdCompletion: number
  costUsdTotal: number
  isFreeTier: boolean
} {
  const providerPricing = AI_PRICING[provider]
  if (!providerPricing) {
    logger.warn(`[AI Cost Tracking] Unknown provider: ${provider}`, { provider, modelId })
    return {
      costUsdPrompt: 0,
      costUsdCompletion: 0,
      costUsdTotal: 0,
      isFreeTier: false,
    }
  }

  // Find model pricing (exact match or fallback)
  let pricing = providerPricing[modelId as keyof typeof providerPricing]

  // Fallback: if model not found, try to find similar model
  if (!pricing) {
    // Try to find a similar model (e.g., 'gpt-4o-2024-08-06' → 'gpt-4o')
    const similarModelKey = Object.keys(providerPricing).find((key) =>
      modelId.includes(key) || key.includes(modelId.split('-')[0] ?? '')
    )
    if (similarModelKey) {
      pricing = providerPricing[similarModelKey as keyof typeof providerPricing]
      logger.info(`[AI Cost Tracking] Using similar model pricing: ${similarModelKey} for ${modelId}`)
    }

    // Final check: if still no pricing found, return zero cost
    if (!pricing) {
      logger.warn(`[AI Cost Tracking] Unknown model: ${modelId} for provider ${provider}`, { provider, modelId })
      return {
        costUsdPrompt: 0,
        costUsdCompletion: 0,
        costUsdTotal: 0,
        isFreeTier: false,
      }
    }
  }

  const isFreeTier = pricing.prompt === 0 && pricing.completion === 0

  // Calculate cost: (tokens / 1,000,000) * price_per_million
  const costUsdPrompt = (promptTokens / 1_000_000) * pricing.prompt
  const costUsdCompletion = (completionTokens / 1_000_000) * pricing.completion
  const costUsdTotal = costUsdPrompt + costUsdCompletion

  return {
    costUsdPrompt,
    costUsdCompletion,
    costUsdTotal,
    isFreeTier,
  }
}

// ============================================================================
// TRACKING FUNCTION
// ============================================================================

export interface TrackAICallParams {
  // Required
  userId: string
  operationType: AIOperationType
  provider: AIProvider
  modelId: string
  promptTokens: number
  completionTokens: number

  // Optional
  debateId?: string
  latencyMs?: number
  success?: boolean
  errorMessage?: string
  inputSummary?: string
  outputSummary?: string
  metadata?: Record<string, unknown>
}

/**
 * Track an AI API call with full cost breakdown
 *
 * @example
 * ```typescript
 * // After calling OpenAI
 * await trackAICall({
 *   userId: ctx.userId,
 *   operationType: 'context_assessment',
 *   provider: 'google',
 *   modelId: 'gemini-2.0-flash',
 *   promptTokens: 1500,
 *   completionTokens: 800,
 *   latencyMs: Date.now() - startTime,
 *   success: true,
 *   inputSummary: input.userInput.substring(0, 500),
 *   outputSummary: JSON.stringify(result).substring(0, 500),
 * })
 * ```
 */
export async function trackAICall(params: TrackAICallParams): Promise<void> {
  try {
    const totalTokens = params.promptTokens + params.completionTokens

    // Calculate cost
    const { costUsdPrompt, costUsdCompletion, costUsdTotal, isFreeTier } = calculateAICost(
      params.provider,
      params.modelId,
      params.promptTokens,
      params.completionTokens
    )

    // Insert tracking record
    await db.insert(aiCostTracking).values({
      userId: params.userId,
      debateId: params.debateId,
      operationType: params.operationType,
      provider: params.provider,
      modelId: params.modelId,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      totalTokens,
      costUsdPrompt: costUsdPrompt.toFixed(8),
      costUsdCompletion: costUsdCompletion.toFixed(8),
      costUsdTotal: costUsdTotal.toFixed(8),
      isFreeTier,
      latencyMs: params.latencyMs,
      success: params.success ?? true,
      errorMessage: params.errorMessage,
      inputSummary: params.inputSummary,
      outputSummary: params.outputSummary,
      metadata: params.metadata,
    })

    logger.info('[AI Cost Tracking] Recorded', {
      operationType: params.operationType,
      provider: params.provider,
      modelId: params.modelId,
      totalTokens,
      costUsdTotal,
      isFreeTier,
    })
  } catch (error) {
    // Don't throw - tracking failure shouldn't break the app
    logger.error('[AI Cost Tracking] Failed to record', error instanceof Error ? error : undefined, {
      error: String(error),
      operationType: params.operationType,
      provider: params.provider,
    })
  }
}

// ============================================================================
// COST ANALYSIS QUERIES
// ============================================================================

/**
 * Get total AI cost for a user in a date range
 */
export async function getUserAICost(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalCostUsd: number
  freeCreditsUsed: number
  paidCreditsUsed: number
  byOperation: Record<AIOperationType, number>
  byProvider: Record<AIProvider, number>
}> {
  const { and, eq, gte, lte, sql } = await import('drizzle-orm')

  const results = await db
    .select({
      operationType: aiCostTracking.operationType,
      provider: aiCostTracking.provider,
      costUsdTotal: aiCostTracking.costUsdTotal,
      isFreeTier: aiCostTracking.isFreeTier,
    })
    .from(aiCostTracking)
    .where(
      and(
        eq(aiCostTracking.userId, userId),
        gte(aiCostTracking.createdAt, startDate),
        lte(aiCostTracking.createdAt, endDate)
      )
    )

  let totalCostUsd = 0
  let freeCreditsUsed = 0
  let paidCreditsUsed = 0
  const byOperation: Record<string, number> = {}
  const byProvider: Record<string, number> = {}

  results.forEach((row) => {
    const cost = parseFloat(row.costUsdTotal)
    totalCostUsd += cost

    if (row.isFreeTier) {
      freeCreditsUsed += 1
    } else {
      paidCreditsUsed += 1
    }

    byOperation[row.operationType] = (byOperation[row.operationType] || 0) + cost
    byProvider[row.provider] = (byProvider[row.provider] || 0) + cost
  })

  return {
    totalCostUsd,
    freeCreditsUsed,
    paidCreditsUsed,
    byOperation: byOperation as Record<AIOperationType, number>,
    byProvider: byProvider as Record<AIProvider, number>,
  }
}

/**
 * Get AI cost for a specific debate
 */
export async function getDebateAICost(debateId: string): Promise<{
  totalCostUsd: number
  byPhase: Record<string, number>
  totalTokens: number
}> {
  const { eq } = await import('drizzle-orm')

  const results = await db
    .select({
      operationType: aiCostTracking.operationType,
      costUsdTotal: aiCostTracking.costUsdTotal,
      totalTokens: aiCostTracking.totalTokens,
    })
    .from(aiCostTracking)
    .where(eq(aiCostTracking.debateId, debateId))

  let totalCostUsd = 0
  let totalTokens = 0
  const byPhase: Record<string, number> = {}

  results.forEach((row) => {
    const cost = parseFloat(row.costUsdTotal)
    totalCostUsd += cost
    totalTokens += row.totalTokens

    byPhase[row.operationType] = (byPhase[row.operationType] || 0) + cost
  })

  return {
    totalCostUsd,
    byPhase,
    totalTokens,
  }
}
