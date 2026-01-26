/**
 * Cost Tracking
 */

import { quoorumLogger } from '../logger'
import type { DebateResult } from '../types'
import type { CostBreakdown } from './types'

const TOKENS_PER_MILLION = 1_000_000
const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_USER = 'user-1'

// ============================================================================
// ESTÁNDAR QUOORUM: SISTEMA DE CRÉDITOS
// ============================================================================
// Valor del Crédito: $0.01 USD (100 Créditos = $1 USD)
// Multiplicador de Servicio: 1.75x
// Fórmula: Créditos = ⌈(Coste API USD × 1.75) / 0.01⌉
// ============================================================================

export const CREDIT_MULTIPLIER = 1.75 // Service margin (75% markup)
export const USD_PER_CREDIT = 0.01 // 1 credit = $0.01 USD (100 credits = $1 USD)

// Pricing per 1M tokens (as of January 2026)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },

  // Anthropic
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-3-5-haiku-20241022': { input: 1.0, output: 5.0 },

  // Google Gemini
  'gemini-2.0-flash-exp': { input: 0, output: 0 }, // Free Tier
  'gemini-1.5-flash': { input: 0.075, output: 0.3 },
  'gemini-1.5-pro': { input: 1.25, output: 5.0 },

  // DeepSeek
  'deepseek-chat': { input: 0.14, output: 0.28 },

  // Groq (Llama models)
  'llama3-70b-8192': { input: 0.59, output: 0.79 },
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
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

// ============================================================================
// CREDIT SYSTEM
// ============================================================================

/**
 * Convert USD cost to credits
 * Formula: Créditos = ⌈(Coste API USD × 1.75) / 0.01⌉
 *
 * @example
 * convertUsdToCredits(0.10) // $0.10 → ⌈(0.10 × 1.75) / 0.01⌉ = ⌈17.5⌉ = 18 créditos
 * convertUsdToCredits(1.00) // $1.00 → ⌈(1.00 × 1.75) / 0.01⌉ = ⌈175⌉ = 175 créditos
 */
export function convertUsdToCredits(costUsd: number): number {
  return Math.ceil((costUsd * CREDIT_MULTIPLIER) / USD_PER_CREDIT)
}

/**
 * Track cost in credits instead of USD
 * Same logic as trackCost() but returns credits
 *
 * @returns Credits consumed (integer)
 */
export function trackCredits(
  operation: string,
  model: string,
  tokens: number,
  userId: string
): number {
  // Calculate USD cost first
  const costUsd = trackCost(operation, model, tokens, userId)

  // Convert to credits
  const credits = convertUsdToCredits(costUsd)

  quoorumLogger.info('Credits tracked', {
    operation,
    model,
    tokens,
    costUsd,
    credits,
    userId,
  })

  return credits
}
