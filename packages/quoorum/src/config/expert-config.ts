/**
 * Expert Configuration with Environment Variable Support
 *
 * Centralizes AI provider and model configuration for expert profiles.
 * Given the large number of experts (25+), we use global defaults with
 * optional per-expert overrides.
 */

import { z } from 'zod'
import type { ExpertProfile } from '../expert-database'

// Zod schema for validation
const ExpertProviderConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'groq', 'deepseek']),
  model: z.string().min(1),
})

/**
 * Get default expert provider configuration
 * Falls back to free tier (Gemini) if not configured
 */
function getDefaultConfig(): Pick<ExpertProfile, 'provider' | 'modelId'> {
  const provider = (process.env.EXPERT_DEFAULT_PROVIDER || 'google') as ExpertProfile['provider']
  const model = process.env.EXPERT_DEFAULT_MODEL || 'gemini-2.0-flash-exp'

  try {
    ExpertProviderConfigSchema.parse({ provider, model })
    return { provider, modelId: model }
  } catch (error) {
    console.error('Invalid expert default configuration, falling back to Gemini:', error)
    return { provider: 'google', modelId: 'gemini-2.0-flash-exp' }
  }
}

/**
 * Get per-category configuration (optional override)
 * Categories: positioning, conversion, product, growth, operations, technical, fundraising, legal
 */
function getCategoryConfig(
  category: string
): Pick<ExpertProfile, 'provider' | 'modelId'> | null {
  const envPrefix = `EXPERT_${category.toUpperCase()}_`
  const provider = process.env[`${envPrefix}PROVIDER`] as ExpertProfile['provider'] | undefined
  const model = process.env[`${envPrefix}MODEL`]

  if (!provider || !model) {
    return null // No override for this category
  }

  try {
    ExpertProviderConfigSchema.parse({ provider, model })
    return { provider, modelId: model }
  } catch (error) {
    console.warn(`Invalid configuration for category ${category}, using defaults`)
    return null
  }
}

/**
 * Get per-expert configuration (optional override)
 * Allows fine-grained control for specific experts
 */
function getExpertConfig(expertId: string): Pick<ExpertProfile, 'provider' | 'modelId'> | null {
  const envPrefix = `EXPERT_${expertId.toUpperCase()}_`
  const provider = process.env[`${envPrefix}PROVIDER`] as ExpertProfile['provider'] | undefined
  const model = process.env[`${envPrefix}MODEL`]

  if (!provider || !model) {
    return null // No override for this expert
  }

  try {
    ExpertProviderConfigSchema.parse({ provider, model })
    return { provider, modelId: model }
  } catch (error) {
    console.warn(`Invalid configuration for expert ${expertId}, using defaults`)
    return null
  }
}

/**
 * Get configuration for an expert with fallback hierarchy:
 * 1. Per-expert override (EXPERT_APRIL_DUNFORD_PROVIDER)
 * 2. Per-category override (EXPERT_POSITIONING_PROVIDER)
 * 3. Global default (EXPERT_DEFAULT_PROVIDER)
 * 4. Hard default (google/gemini-2.0-flash-exp)
 *
 * @param expertId - Expert identifier (e.g., 'april_dunford')
 * @param category - Expert category (e.g., 'positioning')
 * @returns Provider and model configuration
 */
export function getExpertProviderConfig(
  expertId: string,
  category?: string
): Pick<ExpertProfile, 'provider' | 'modelId'> {
  // 1. Try per-expert override
  const expertOverride = getExpertConfig(expertId)
  if (expertOverride) {
    return expertOverride
  }

  // 2. Try per-category override
  if (category) {
    const categoryOverride = getCategoryConfig(category)
    if (categoryOverride) {
      return categoryOverride
    }
  }

  // 3. Use global default
  return getDefaultConfig()
}

/**
 * Expert categories mapping
 */
export const EXPERT_CATEGORIES = {
  // Go-to-Market & Positioning
  april_dunford: 'positioning',
  peep_laja: 'conversion',
  steli_efti: 'sales',

  // Pricing & Monetization
  patrick_campbell: 'pricing',
  alex_hormozi: 'pricing',
  tomasz_tunguz: 'fundraising',

  // Product & PMF
  rahul_vohra: 'product',
  sean_ellis: 'growth',
  lenny_rachitsky: 'product',

  // Growth & Acquisition
  brian_balfour: 'growth',
  julian_shapiro: 'growth',
  rand_fishkin: 'growth',
  sahil_lavingia: 'growth',
  boris_wertz: 'growth',

  // Operations & Support
  lincoln_murphy: 'operations',
  des_traynor: 'operations',
  nick_mehta: 'operations',
  david_skok: 'operations',

  // Sales & GTM
  aaron_ross: 'sales',

  // Finance & VC
  jason_lemkin: 'fundraising',
  christoph_janz: 'fundraising',

  // Venture Capital & Investment
  marc_andreessen: 'investment',
  bill_gurley: 'investment',
  brad_feld: 'investment',
  chamath_palihapitiya: 'investment',
  naval_ravikant: 'investment',

  // AI & Technical
  andrej_karpathy: 'technical',
  simon_willison: 'technical',
  shreya_shankar: 'technical',

  // Critical Thinking (no category - uses global default)
  critic: 'general',

  // Vida Personal
  gretchen_rubin: 'vida-personal',
  james_clear: 'vida-personal',
  marie_kondo: 'vida-personal',
  cal_newport: 'vida-personal',
  tim_ferriss: 'vida-personal',
  brene_brown: 'vida-personal',
  mark_manson: 'vida-personal',
  ryan_holiday: 'vida-personal',
  suze_orman: 'vida-personal',
  dave_ramsey: 'vida-personal',
  melissa_urban: 'vida-personal',
  dan_harris: 'vida-personal',
  stephen_covey: 'vida-personal',
  gary_chapman: 'vida-personal',
  john_gottman: 'vida-personal',
  eckhart_tolle: 'vida-personal',
  jordan_peterson: 'vida-personal',
  pema_chodron: 'vida-personal',
  daniel_goleman: 'vida-personal',
  carol_dweck: 'vida-personal',
  simon_sinek: 'vida-personal',
  atul_gawande: 'vida-personal',
  malcolm_gladwell: 'vida-personal',
  charles_duhigg: 'vida-personal',
  tara_brach: 'vida-personal',

  // Históricos
  socrates: 'historicos',
  aristotle: 'historicos',
  marcus_aurelius: 'historicos',
  seneca: 'historicos',
  epictetus: 'historicos',
  plato: 'historicos',
  confucius: 'historicos',
  sun_tzu: 'historicos',
  machiavelli: 'historicos',
  voltaire: 'historicos',
  kant: 'historicos',
  nietzsche: 'historicos',
  buddha: 'historicos',
  laozi: 'historicos',
  da_vinci: 'historicos',
  galileo: 'historicos',
  einstein: 'historicos',
  darwin: 'historicos',
  lincoln: 'historicos',
  churchill: 'historicos',
  mandela: 'historicos',
  gandhi: 'historicos',
  tesla: 'historicos',
  franklin: 'historicos',
  washington: 'historicos',
} as const

/**
 * Get recommended free tier configuration
 */
export function getExpertFreeTierConfig(): Pick<ExpertProfile, 'provider' | 'modelId'> {
  return {
    provider: 'google',
    modelId: 'gemini-2.0-flash-exp',
  }
}

/**
 * Get recommended paid tier configuration (balanced)
 */
export function getExpertPaidTierConfig(): Pick<ExpertProfile, 'provider' | 'modelId'> {
  return {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
  }
}

/**
 * Get recommended premium tier configuration (best quality)
 */
export function getExpertPremiumTierConfig(): Pick<ExpertProfile, 'provider' | 'modelId'> {
  return {
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
  }
}
