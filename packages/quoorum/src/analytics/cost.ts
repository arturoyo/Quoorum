/**
 * Cost Tracking
 */

import { quoorumLogger } from '../logger'
import type { DebateResult } from '../types'
import type { CostBreakdown } from './types'

const TOKENS_PER_MILLION = 1_000_000
const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_USER = 'user-1'

// Pricing per 1M tokens (as of 2024)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
}

export function trackCost(
  operation: string,
  model: string,
  tokens: number,
  userId: string
): number {
  const modelPricing = MODEL_PRICING[model] ?? MODEL_PRICING[DEFAULT_MODEL] ?? { input: 0.15, output: 0.6 }

  // Assume 50/50 input/output split
  const cost = (tokens / TOKENS_PER_MILLION) * ((modelPricing.input + modelPricing.output) / 2)

  // Log with structured logger
  quoorumLogger.info('Cost tracked', {
    operation,
    model,
    tokens,
    cost,
    userId,
  })

  return cost
}

export function calculateCostBreakdown(debates: DebateResult[]): CostBreakdown {
  const breakdown: CostBreakdown = {
    total: 0,
    byModel: {},
    byOperation: {},
    byUser: {},
    byDate: {},
  }

  for (const debate of debates) {
    const cost = debate.totalCostUsd || 0
    breakdown.total += cost

    // By model (would need to track which model was used)
    const model = DEFAULT_MODEL
    breakdown.byModel[model] = (breakdown.byModel[model] || 0) + cost

    // By operation
    const operation = 'debate'
    breakdown.byOperation[operation] = (breakdown.byOperation[operation] || 0) + cost

    // By user (would need userId)
    const userId = DEFAULT_USER
    breakdown.byUser[userId] = (breakdown.byUser[userId] || 0) + cost

    // By date
    const date = new Date().toISOString().split('T')[0]
    if (date) {
      breakdown.byDate[date] = (breakdown.byDate[date] || 0) + cost
    }
  }

  return breakdown
}
