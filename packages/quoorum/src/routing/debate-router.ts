/**
 * Debate Router - Agent Selection Logic
 *
 * Selects agents/experts for a debate based on routing configuration.
 * Applies expert filters, provider overrides, and cost constraints.
 */

import type { ExpertProfile } from '../types'

export interface RoutingConfig {
  agentSelectionMode: 'auto' | 'fixed' | 'template'
  expertFilterRules?: {
    categories?: string[]
    expertIds?: string[]
    excludeIds?: string[]
  } | null
  providerOverride?: string | null
  modelOverride?: string | null
  maxCostUsd?: number | null
  maxRounds?: number | null
  slackChannelOverride?: string | null
}

export interface RoutedDebateConfig {
  experts: ExpertProfile[]
  provider?: string
  model?: string
  maxRounds: number
  maxCostUsd?: number
  slackChannel?: string
}

/**
 * Apply routing configuration to filter and configure experts for a debate.
 */
export function applyRoutingConfig(
  allExperts: ExpertProfile[],
  config: RoutingConfig,
): RoutedDebateConfig {
  let filtered = [...allExperts]
  const rules = config.expertFilterRules

  if (rules) {
    // Filter by categories
    if (rules.categories && rules.categories.length > 0) {
      const cats = new Set(rules.categories)
      filtered = filtered.filter(
        (e) => e.category && cats.has(e.category)
      )
    }

    // Filter by specific expert IDs
    if (rules.expertIds && rules.expertIds.length > 0) {
      const ids = new Set(rules.expertIds)
      filtered = filtered.filter((e) => ids.has(e.id))
    }

    // Exclude specific experts
    if (rules.excludeIds && rules.excludeIds.length > 0) {
      const excludeSet = new Set(rules.excludeIds)
      filtered = filtered.filter((e) => !excludeSet.has(e.id))
    }
  }

  // Apply provider/model overrides
  if (config.providerOverride || config.modelOverride) {
    filtered = filtered.map((e) => ({
      ...e,
      ...(config.providerOverride ? { provider: config.providerOverride } : {}),
      ...(config.modelOverride ? { modelId: config.modelOverride } : {}),
    }))
  }

  return {
    experts: filtered,
    provider: config.providerOverride ?? undefined,
    model: config.modelOverride ?? undefined,
    maxRounds: config.maxRounds ?? 10,
    maxCostUsd: config.maxCostUsd ?? undefined,
    slackChannel: config.slackChannelOverride ?? undefined,
  }
}

/**
 * Select the best routing config from multiple candidates.
 * Higher priority wins. Department-specific > company-level.
 */
export function selectBestRoute(
  configs: (RoutingConfig & { priority: number; departmentId?: string | null })[],
  targetDepartmentId?: string,
): RoutingConfig | null {
  if (configs.length === 0) return null

  // Sort by: department match first, then priority descending
  const sorted = [...configs].sort((a, b) => {
    const aDeptMatch = a.departmentId === targetDepartmentId ? 1 : 0
    const bDeptMatch = b.departmentId === targetDepartmentId ? 1 : 0
    if (aDeptMatch !== bDeptMatch) return bDeptMatch - aDeptMatch
    return b.priority - a.priority
  })

  return sorted[0] ?? null
}
