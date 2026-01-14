/**
 * Visualization Types
 *
 * Tipos para el sistema de visualización tipo WhatsApp
 */

export type ExpertCategory = 'gtm' | 'pricing' | 'product' | 'growth' | 'ai' | 'critic'

export interface ExpertColor {
  category: ExpertCategory
  color: string
  emoji: string
  label: string
}

export const EXPERT_COLORS: Record<ExpertCategory, ExpertColor> = {
  gtm: {
    category: 'gtm',
    color: '#10b981', // green-500
    emoji: '🟢',
    label: 'Go-to-Market',
  },
  pricing: {
    category: 'pricing',
    color: '#3b82f6', // blue-500
    emoji: '🔵',
    label: 'Pricing',
  },
  product: {
    category: 'product',
    color: '#a855f7', // purple-500
    emoji: '🟣',
    label: 'Product',
  },
  growth: {
    category: 'growth',
    color: '#f97316', // orange-500
    emoji: '🟠',
    label: 'Growth',
  },
  ai: {
    category: 'ai',
    color: '#ef4444', // red-500
    emoji: '🔴',
    label: 'AI/ML',
  },
  critic: {
    category: 'critic',
    color: '#1f2937', // gray-800
    emoji: '⚫',
    label: 'Critical Thinking',
  },
}

export const EXPERT_CATEGORY_MAP: Record<string, ExpertCategory> = {
  // GTM
  april_dunford: 'gtm',
  peep_laja: 'gtm',
  steli_efti: 'gtm',
  julian_shapiro: 'gtm',
  rand_fishkin: 'gtm',
  aaron_ross: 'gtm',
  sahil_lavingia: 'gtm',

  // Pricing
  patrick_campbell: 'pricing',
  alex_hormozi: 'pricing',
  tomasz_tunguz: 'pricing',
  christoph_janz: 'pricing',
  david_skok: 'pricing',
  boris_wertz: 'pricing',

  // Product
  rahul_vohra: 'product',
  lenny_rachitsky: 'product',
  des_traynor: 'product',
  sean_ellis: 'product',
  lincoln_murphy: 'product',
  nick_mehta: 'product',

  // Growth
  brian_balfour: 'growth',
  jason_lemkin: 'growth',

  // AI
  andrej_karpathy: 'ai',
  simon_willison: 'ai',
  shreya_shankar: 'ai',

  // Critic
  the_critic: 'critic',
  critic: 'critic',
}

export function getExpertColor(expertId: string): ExpertColor {
  const category = EXPERT_CATEGORY_MAP[expertId] || 'critic'
  return EXPERT_COLORS[category]
}

export interface DebateSummary {
  sessionId: string
  question: string
  shortQuestion: string // Truncated for list view
  topOption: string
  expertIds: string[]
  rounds: number
  cost: number
  consensus: number
  quality: number
  timestamp: Date
  tags: string[]
}

export interface DebateMessage {
  id: string
  expertId: string
  expertName: string
  content: string
  timestamp: Date
  round: number
  depth: number
  isIntervention?: boolean
  interventionType?: string
}

export interface DebateView {
  summary: DebateSummary
  messages: DebateMessage[]
  qualityHistory: number[]
  interventions: Array<{
    round: number
    type: string
    prompt: string
  }>
}
