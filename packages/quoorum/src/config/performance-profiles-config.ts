/**
 * Performance Profiles Configuration
 *
 * Defines the 3 performance tiers for AI operations:
 * - Economic: 0.3x cost (budget models)
 * - Balanced: 1.0x cost (mix based on criticality)
 * - Performance: 3.0x cost (premium models)
 */

import type { PromptCategory } from './debate-prompts-config'

export interface PerformanceProfile {
  slug: 'economic' | 'balanced' | 'performance'
  name: string
  description: string
  costMultiplier: number
  badgeColor: 'green' | 'blue' | 'purple'
  icon: string // Lucide icon name
  modelRules: Record<PromptCategory, string>
}

export const PERFORMANCE_PROFILES: Record<string, PerformanceProfile> = {
  economic: {
    slug: 'economic',
    name: 'Económico',
    description:
      'Modelos más baratos en todas las operaciones. Ideal para pruebas o presupuestos limitados.',
    costMultiplier: 0.3,
    badgeColor: 'green',
    icon: 'TrendingDown',
    modelRules: {
      generation: 'gpt-3.5-turbo',
      validation: 'gpt-4o-mini',
      suggestion: 'gemini-2.0-flash',
      analysis: 'gpt-3.5-turbo',
      execution: 'gemini-2.0-flash',
      synthesis: 'gpt-4o-mini',
      intervention: 'gpt-4o-mini',
      framework: 'gemini-2.0-flash',
    },
  },

  balanced: {
    slug: 'balanced',
    name: 'Equilibrado',
    description:
      '80% operaciones con modelos económicos, 20% operaciones críticas con modelos premium. Mejor balance calidad/precio.',
    costMultiplier: 1.0,
    badgeColor: 'blue',
    icon: 'Scale',
    modelRules: {
      generation: 'gpt-4-turbo', // Critical: good model
      validation: 'gpt-4o-mini', // High volume: cheap
      suggestion: 'gemini-2.0-flash', // High volume: cheap
      analysis: 'gpt-4o-mini', // High volume: cheap
      execution: 'claude-3-5-sonnet-20241022', // Critical: premium
      synthesis: 'gpt-4-turbo', // Critical: good model
      intervention: 'gpt-4o-mini', // Medium volume: cheap
      framework: 'gpt-4-turbo', // Critical: good model
    },
  },

  performance: {
    slug: 'performance',
    name: 'Alto Rendimiento',
    description: 'Modelos premium en todas las operaciones. Máxima calidad y precisión.',
    costMultiplier: 3.0,
    badgeColor: 'purple',
    icon: 'Zap',
    modelRules: {
      generation: 'gpt-4',
      validation: 'gpt-4-turbo',
      suggestion: 'gpt-4-turbo',
      analysis: 'gpt-4-turbo',
      execution: 'claude-opus-4-20250514',
      synthesis: 'claude-opus-4-20250514',
      intervention: 'gpt-4-turbo',
      framework: 'claude-opus-4-20250514',
    },
  },
}

/**
 * Get performance profile by slug
 */
export function getPerformanceProfile(
  slug: 'economic' | 'balanced' | 'performance'
): PerformanceProfile | undefined {
  return PERFORMANCE_PROFILES[slug]
}

/**
 * Get default performance profile (balanced)
 */
export function getDefaultPerformanceProfile(): PerformanceProfile {
  return PERFORMANCE_PROFILES.balanced
}

/**
 * Get model for a specific category and performance level
 */
export function getModelForCategory(
  category: PromptCategory,
  performanceLevel: 'economic' | 'balanced' | 'performance' = 'balanced'
): string {
  const profile = getPerformanceProfile(performanceLevel)
  if (!profile) {
    return getDefaultPerformanceProfile().modelRules[category]
  }
  return profile.modelRules[category]
}
