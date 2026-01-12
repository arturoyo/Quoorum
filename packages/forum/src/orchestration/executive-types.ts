/**
 * Executive Types - Type definitions for CEO-level features
 */

// ============================================================================
// EXECUTIVE SUMMARY TYPES
// ============================================================================

export interface ExecutiveSummary {
  headline: string
  recommendation: string
  confidence: ConfidenceScore
  keyInsights: string[]
  risks: RiskItem[]
  opportunities: OpportunityItem[]
  stakeholderImpact: StakeholderImpact[]
  costOfDelay: CostOfDelay
  reversibility: ReversibilityScore
  nextSteps: string[]
  generatedAt: string
}

export interface ConfidenceScore {
  score: number // 0-100
  level: 'low' | 'medium' | 'high' | 'very_high'
  factors: string[]
  caveats: string[]
}

export interface RiskItem {
  id: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  probability: number
  mitigation: string
}

export interface OpportunityItem {
  id: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'transformative'
  timeframe: string
  requirements: string[]
}

export interface StakeholderImpact {
  stakeholder: string
  impact: 'positive' | 'neutral' | 'negative' | 'mixed'
  magnitude: number
  notes: string
}

export interface CostOfDelay {
  dailyCost: number
  weeklyCost: number
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  reasoning: string
}

export interface ReversibilityScore {
  score: number // 0-100 (100 = fully reversible)
  level: 'irreversible' | 'difficult' | 'moderate' | 'easy'
  timeToRevert: string
  costToRevert: string
}

// ============================================================================
// BOARD OF ADVISORS TYPES
// ============================================================================

export type AdvisorRole = 'cfo' | 'cto' | 'cmo' | 'coo' | 'chro' | 'legal' | 'customer'

export interface BoardAdvisor {
  role: AdvisorRole
  name: string
  perspective: string
  concerns: string[]
  opportunities: string[]
  vote: 'approve' | 'reject' | 'abstain' | 'needs_more_info'
  confidence: number
}

export interface BoardVote {
  question: string
  advisors: BoardAdvisor[]
  consensus: 'unanimous' | 'majority' | 'split' | 'no_consensus'
  recommendation: string
  dissent: string[]
}
