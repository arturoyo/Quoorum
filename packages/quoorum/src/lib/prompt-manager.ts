/**
 * Prompt Manager - Runtime System for AI Prompt Resolution
 *
 * This system:
 * 1. Queries DB first for admin overrides (system_prompts table)
 * 2. Falls back to config defaults if not in DB
 * 3. Substitutes variables in templates
 * 4. Selects appropriate model based on performance tier
 * 5. Caches results for performance (15 min TTL)
 *
 * Integration:
 * - Reuses clearPromptFromCache() from get-system-prompt.ts
 * - Extends existing system_prompts table
 * - Supports 3 performance tiers (economic/balanced/performance)
 */

import { db } from '@quoorum/db'
import { sql } from 'drizzle-orm'
import { DEBATE_PROMPTS_DEFAULTS, type PromptConfig } from '../config/debate-prompts-config'
import { getPerformanceProfile, getDefaultPerformanceProfile } from '../config/performance-profiles-config'
import { quoorumLogger as logger } from '../logger'

export interface ResolvedPrompt {
  template: string
  systemPrompt?: string
  model: string
  temperature: number
  maxTokens: number
  slug: string
  phase?: number
  category?: string
}

// Cache in memory (15 min TTL)
// Note: This is separate from get-system-prompt.ts cache to handle richer prompt objects
const promptCache = new Map<string, { prompt: PromptConfig; timestamp: number }>()
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

/**
 * Get and resolve a prompt template with variables and performance tier
 *
 * @param promptSlug - Unique identifier for the prompt (e.g., 'analyze-question')
 * @param variables - Object with variable values to substitute in template
 * @param performanceLevel - Performance tier: 'economic', 'balanced', or 'performance'
 * @returns Resolved prompt with template, model, and configuration
 *
 * @example
 * const resolved = await getPromptTemplate(
 *   'validate-answer',
 *   {
 *     question: 'Should we launch now?',
 *     answer: 'Yes, market conditions are favorable',
 *     previousAnswers: '[]'
 *   },
 *   'balanced'
 * )
 * // Use resolved.template, resolved.model, etc. for AI call
 */
export async function getPromptTemplate(
  promptSlug: string,
  variables: Record<string, any> = {},
  performanceLevel: 'economic' | 'balanced' | 'performance' = 'balanced'
): Promise<ResolvedPrompt> {
  // 1. Check cache
  const cacheKey = `${promptSlug}_${performanceLevel}`
  const cached = promptCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug('[getPromptTemplate] Using cached prompt', { promptSlug, performanceLevel })
    return resolvePrompt(cached.prompt, variables, performanceLevel)
  }

  // 2. Try DB first (for admin overrides)
  let promptConfig: PromptConfig | null = null

  try {
    const result = await db.execute(sql`
      SELECT
        key as slug,
        name,
        prompt as template,
        system_prompt,
        category,
        phase,
        variables,
        recommended_model,
        economic_model,
        balanced_model,
        performance_model,
        temperature,
        max_tokens
      FROM system_prompts
      WHERE key = ${promptSlug} AND is_active = true
      LIMIT 1
    `)

    if (result && result.length > 0) {
      const dbRow = result[0] as Record<string, any>

      // Transform DB row to PromptConfig
      promptConfig = {
        slug: String(dbRow.slug || promptSlug),
        name: String(dbRow.name || ''),
        description: '',
        phase: Number(dbRow.phase || 0) as 1 | 2 | 3 | 4 | 5,
        category: dbRow.category as any,
        template: String(dbRow.template || ''),
        systemPrompt: dbRow.system_prompt ? String(dbRow.system_prompt) : undefined,
        variables: Array.isArray(dbRow.variables) ? dbRow.variables : [],
        recommendedModel: String(dbRow.recommended_model || 'gpt-4-turbo'),
        economicModel: String(dbRow.economic_model || 'gpt-3.5-turbo'),
        balancedModel: String(dbRow.balanced_model || 'gpt-4-turbo'),
        performanceModel: String(dbRow.performance_model || 'claude-opus-4-20250514'),
        temperature: Number(dbRow.temperature || 0.7),
        maxTokens: Number(dbRow.max_tokens || 2000),
        orderInPhase: 0,
      }

      logger.debug('[getPromptTemplate] Using DB prompt', { promptSlug })
    }
  } catch (error) {
    logger.error(
      '[getPromptTemplate] Error querying DB, will fallback to config',
      error instanceof Error ? error : undefined,
      {
        slug: promptSlug,
      }
    )
  }

  // 3. Fallback to config defaults
  if (!promptConfig) {
    promptConfig = DEBATE_PROMPTS_DEFAULTS[promptSlug]

    if (!promptConfig) {
      throw new Error(
        `Prompt not found: ${promptSlug}. Not in DB and not in config defaults.`
      )
    }

    logger.debug('[getPromptTemplate] Using config default', { promptSlug })
  }

  // 4. Cache it
  promptCache.set(cacheKey, { prompt: promptConfig, timestamp: Date.now() })

  // 5. Resolve with variables and tier
  return resolvePrompt(promptConfig, variables, performanceLevel)
}

/**
 * Resolve a prompt config into a ready-to-use prompt
 * - Substitutes ${variables} in template
 * - Selects model based on performance tier
 *
 * @internal
 */
function resolvePrompt(
  promptConfig: PromptConfig,
  variables: Record<string, any>,
  tier: 'economic' | 'balanced' | 'performance'
): ResolvedPrompt {
  // Select model based on tier
  let model: string
  if (tier === 'economic') {
    model = promptConfig.economicModel
  } else if (tier === 'performance') {
    model = promptConfig.performanceModel
  } else {
    model = promptConfig.balancedModel
  }

  // Fallback if model not specified
  if (!model) {
    const profile = getPerformanceProfile(tier) || getDefaultPerformanceProfile()
    model = profile.modelRules[promptConfig.category] || 'gpt-4-turbo'
    logger.warn('[resolvePrompt] Model not specified for tier, using profile default', {
      slug: promptConfig.slug,
      tier,
      fallbackModel: model,
    })
  }

  // Replace variables in template
  let resolvedTemplate = promptConfig.template

  for (const [key, value] of Object.entries(variables)) {
    // Support ${variable} syntax
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g')
    resolvedTemplate = resolvedTemplate.replace(regex, String(value ?? ''))
  }

  // Check for unresolved variables (debugging)
  const unresolvedVars = resolvedTemplate.match(/\$\{[^}]+\}/g)
  if (unresolvedVars && unresolvedVars.length > 0) {
    logger.warn('[resolvePrompt] Unresolved variables in template', {
      slug: promptConfig.slug,
      unresolvedVars,
      providedVariables: Object.keys(variables),
      expectedVariables: promptConfig.variables,
    })
  }

  return {
    template: resolvedTemplate,
    systemPrompt: promptConfig.systemPrompt,
    model,
    temperature: promptConfig.temperature,
    maxTokens: promptConfig.maxTokens,
    slug: promptConfig.slug,
    phase: promptConfig.phase,
    category: promptConfig.category,
  }
}

/**
 * Invalidate prompt cache
 * Called when admins update prompts in DB
 *
 * @param promptSlug - Optional specific prompt to invalidate, or undefined to clear all
 */
export function invalidatePromptCache(promptSlug?: string) {
  if (promptSlug) {
    // Clear all tiers for this prompt
    promptCache.delete(`${promptSlug}_economic`)
    promptCache.delete(`${promptSlug}_balanced`)
    promptCache.delete(`${promptSlug}_performance`)
    logger.info('[invalidatePromptCache] Cleared cache for prompt', { promptSlug })
  } else {
    promptCache.clear()
    logger.info('[invalidatePromptCache] Cleared entire prompt cache')
  }
}

/**
 * Get cache stats (for debugging/monitoring)
 */
export function getPromptCacheStats() {
  const now = Date.now()
  let activeEntries = 0
  let staleEntries = 0

  for (const [key, value] of promptCache.entries()) {
    if (now - value.timestamp < CACHE_TTL) {
      activeEntries++
    } else {
      staleEntries++
    }
  }

  return {
    totalEntries: promptCache.size,
    activeEntries,
    staleEntries,
    cacheTTL: CACHE_TTL,
  }
}

/**
 * Preload common prompts into cache (optional optimization)
 * Can be called at application startup
 */
export async function preloadPromptCache(performanceLevel: 'economic' | 'balanced' | 'performance' = 'balanced') {
  logger.info('[preloadPromptCache] Preloading common prompts', { performanceLevel })

  const commonPrompts = [
    'analyze-question',
    'suggest-initial-questions',
    'validate-answer',
    'match-experts',
    'core-agent-optimizer',
    'core-agent-critic',
    'core-agent-analyst',
    'core-agent-synthesizer',
  ]

  const promises = commonPrompts.map((slug) =>
    getPromptTemplate(slug, {}, performanceLevel).catch((err) => {
      logger.warn('[preloadPromptCache] Failed to preload prompt', { slug, error: err })
      return null
    })
  )

  await Promise.all(promises)

  logger.info('[preloadPromptCache] Preload complete', {
    attempted: commonPrompts.length,
    stats: getPromptCacheStats(),
  })
}
