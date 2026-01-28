/**
 * Forum Helper Functions
 *
 * Funciones de utilidad para facilitar integración con UI y aplicaciones
 */

import { analyzeQuestion, type QuestionAnalysis } from './question-analyzer'
import { matchExperts } from './expert-matcher'
import { getConfig } from './config'

// ============================================================================
// MODE DETECTION HELPERS
// ============================================================================

export interface DebateModeInfo {
  mode: 'static' | 'dynamic'
  reason: string
  complexity: number
  areas: number
  estimatedRounds: number
  estimatedCostUsd: number
}

/**
 * Determina qué modo se usará para una pregunta sin ejecutar el debate
 */
export async function getDebateMode(question: string): Promise<DebateModeInfo> {
  const config = getConfig()
  const analysis = await analyzeQuestion(question)

  const usesDynamic =
    analysis.complexity >= config.dynamicModeComplexityThreshold ||
    analysis.areas.length > config.staticModeMaxAreas

  const mode = usesDynamic ? 'dynamic' : 'static'
  const estimatedRounds = estimateRounds(analysis)
  const estimatedCostUsd = estimateDebateCostInternal(estimatedRounds, mode === 'dynamic' ? 6 : 4)

  let reason: string
  if (mode === 'dynamic') {
    if (analysis.complexity >= config.dynamicModeComplexityThreshold) {
      reason = `High complexity (${analysis.complexity}/10)`
    } else {
      reason = `Multiple areas (${analysis.areas.length} areas)`
    }
  } else {
    reason = `Simple question (complexity: ${analysis.complexity}/10, areas: ${analysis.areas.length})`
  }

  return {
    mode,
    reason,
    complexity: analysis.complexity,
    areas: analysis.areas.length,
    estimatedRounds,
    estimatedCostUsd,
  }
}

function estimateRounds(analysis: QuestionAnalysis): number {
  // Simple heuristic: complexity maps to rounds
  if (analysis.complexity >= 8) return 6
  if (analysis.complexity >= 6) return 5
  if (analysis.complexity >= 4) return 4
  return 3
}

function estimateDebateCostInternal(rounds: number, numExperts: number): number {
  const costPerRound = numExperts * 0.005
  return rounds * costPerRound
}

// ============================================================================
// EXPERT PREVIEW HELPERS
// ============================================================================

export interface ExpertPreview {
  id: string
  name: string
  title: string
  role: 'primary' | 'secondary' | 'critic'
  matchScore: number
  expertise: string[]
  reasoning: string
}

/**
 * Obtiene preview de expertos recomendados sin ejecutar el debate
 */
export async function getRecommendedExperts(question: string): Promise<ExpertPreview[]> {
  const analysis = await analyzeQuestion(question)
  const matches = matchExperts(analysis, {
    companyOnly: true, // Solo seleccionar expertos de empresa
  })

  return matches.map((match) => ({
    id: match.expert.id,
    name: match.expert.name,
    title: match.expert.title,
    expertise: match.expert.expertise,
    matchScore: match.score,
    role: match.suggestedRole,
    reasoning: match.reasons.join('; '),
  }))
}

/**
 * Obtiene solo los expertos principales (primary)
 */
export async function getPrimaryExperts(question: string): Promise<ExpertPreview[]> {
  const experts = await getRecommendedExperts(question)
  return experts.filter((e) => e.role === 'primary')
}

/**
 * Obtiene el crítico recomendado
 */
export async function getCriticExpert(question: string): Promise<ExpertPreview | undefined> {
  const experts = await getRecommendedExperts(question)
  return experts.find((e) => e.role === 'critic')
}

// ============================================================================
// COST ESTIMATION HELPERS
// ============================================================================

export interface CostEstimate {
  minCostUsd: number
  maxCostUsd: number
  expectedCostUsd: number
  breakdown: {
    analysis: number
    matching: number
    debate: number
    consensus: number
  }
}

/**
 * Estima el costo de un debate antes de ejecutarlo
 */
export async function estimateDebateCost(question: string): Promise<CostEstimate> {
  const modeInfo = await getDebateMode(question)
  const numExperts = modeInfo.mode === 'dynamic' ? 6 : 4

  // Costos aproximados por fase
  const analysisCost = 0.001 // Question analysis
  const matchingCost = modeInfo.mode === 'dynamic' ? 0.002 : 0 // Expert matching
  const costPerRound = numExperts * 0.005 // ~$0.005 per expert per round
  const consensusCost = 0.003 // Consensus checking

  const minRounds = Math.max(1, modeInfo.estimatedRounds - 2)
  const maxRounds = modeInfo.estimatedRounds + 3

  const minCostUsd = analysisCost + matchingCost + minRounds * costPerRound + consensusCost
  const maxCostUsd = analysisCost + matchingCost + maxRounds * costPerRound + consensusCost
  const expectedCostUsd =
    analysisCost + matchingCost + modeInfo.estimatedRounds * costPerRound + consensusCost

  return {
    minCostUsd: Math.round(minCostUsd * 100) / 100,
    maxCostUsd: Math.round(maxCostUsd * 100) / 100,
    expectedCostUsd: Math.round(expectedCostUsd * 100) / 100,
    breakdown: {
      analysis: analysisCost,
      matching: matchingCost,
      debate: modeInfo.estimatedRounds * costPerRound,
      consensus: consensusCost,
    },
  }
}

// ============================================================================
// QUESTION ANALYSIS HELPERS
// ============================================================================

export interface QuestionInsights {
  complexity: number
  complexityLabel: 'Simple' | 'Medium' | 'Complex' | 'Very Complex'
  decisionType: 'strategic' | 'tactical' | 'operational'
  decisionTypeLabel: string
  primaryArea: string
  allAreas: string[]
  topics: string[]
  recommendedMode: 'static' | 'dynamic'
  summary: string
}

/**
 * Obtiene insights sobre una pregunta de forma user-friendly
 */
export async function getQuestionInsights(question: string): Promise<QuestionInsights> {
  const analysis = await analyzeQuestion(question)
  const modeInfo = await getDebateMode(question)

  let complexityLabel: 'Simple' | 'Medium' | 'Complex' | 'Very Complex'
  if (analysis.complexity <= 3) complexityLabel = 'Simple'
  else if (analysis.complexity <= 5) complexityLabel = 'Medium'
  else if (analysis.complexity <= 7) complexityLabel = 'Complex'
  else complexityLabel = 'Very Complex'

  const decisionTypeLabels = {
    strategic: 'Strategic Decision (Long-term impact)',
    tactical: 'Tactical Decision (Medium-term impact)',
    operational: 'Operational Decision (Short-term impact)',
  }

  const primaryArea = analysis.areas[0]?.area ?? 'general'
  const allAreas = analysis.areas.map((a) => a.area)
  const topics = analysis.topics.map((t) => t.name)

  return {
    complexity: analysis.complexity,
    complexityLabel,
    decisionType: analysis.decisionType,
    decisionTypeLabel: decisionTypeLabels[analysis.decisionType],
    primaryArea,
    allAreas,
    topics,
    recommendedMode: modeInfo.mode,
    summary: analysis.reasoning,
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

/**
 * Valida una pregunta antes de ejecutar el debate
 */
export function validateQuestion(question: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []

  // Check if empty
  if (!question || question.trim().length === 0) {
    errors.push('Question cannot be empty')
    return { valid: false, errors, warnings, suggestions }
  }

  // Check minimum length
  if (question.trim().length < 10) {
    errors.push('Question is too short (minimum 10 characters)')
  }

  // Check if it's actually a question
  if (!question.includes('?') && !question.toLowerCase().includes('should')) {
    warnings.push('Question should end with a question mark or contain "should"')
  }

  // Check for vague terms
  const vagueTerms = ['something', 'anything', 'maybe', 'perhaps', 'might']
  const hasVagueTerms = vagueTerms.some((term) => question.toLowerCase().includes(term))
  if (hasVagueTerms) {
    warnings.push('Question contains vague terms - try to be more specific')
  }

  // Suggestions for improvement
  if (!question.toLowerCase().includes('context')) {
    suggestions.push('Consider adding context about your situation for more relevant advice')
  }

  if (question.split(' ').length < 5) {
    suggestions.push('Add more context to get better recommendations')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  }
}

/**
 * Valida contexto antes de ejecutar el debate
 */
export function validateContext(context: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []

  // Context is optional, so empty is valid
  if (!context || context.trim().length === 0) {
    suggestions.push('Adding context will help experts provide better advice')
    return { valid: true, errors, warnings, suggestions }
  }

  // Check if too short
  if (context.trim().length < 20) {
    warnings.push('Context is very short - consider adding more details')
  }

  // Check if too long (> 10k chars)
  if (context.length > 10000) {
    warnings.push('Context is very long - it will be synthesized to reduce cost')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  }
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Formatea un número como moneda USD
 */
export function formatCost(costUsd: number): string {
  return `$${costUsd.toFixed(3)}`
}

/**
 * Formatea un score (0-100) con emoji
 */
export function formatScore(score: number): string {
  let emoji = '[ERROR]'
  if (score >= 80) emoji = '[OK]'
  else if (score >= 60) emoji = '🟡'
  else if (score >= 40) emoji = '🟠'

  return `${emoji} ${score}/100`
}

/**
 * Formatea complejidad con emoji
 */
export function formatComplexity(complexity: number): string {
  let emoji = '[OK]'
  if (complexity >= 8) emoji = '[ERROR]'
  else if (complexity >= 6) emoji = '🟠'
  else if (complexity >= 4) emoji = '🟡'

  return `${emoji} ${complexity}/10`
}
