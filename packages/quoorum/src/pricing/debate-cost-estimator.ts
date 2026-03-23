/**
 * Debate Cost Estimator
 *
 * Estimates the cost of a debate BEFORE execution based on:
 * - Performance level selected (economic/balanced/performance)
 * - Number of experts
 * - Framework chosen
 * - Context quality
 *
 * Used for Just-in-Time cost preview in Phase 4 (Revision)
 */

import { quoorumLogger as logger } from '../logger'

export interface DebateCostEstimate {
  contexto: number // Credits for context phase
  expertos: number // Credits for expert matching
  estrategia: number // Credits for strategy selection
  debate: number // Credits for main debate execution
  synthesis: number // Credits for final synthesis
  total: number // Total estimated credits
  breakdown: {
    phase: string
    credits: number
    description: string
  }[]
}

export interface DebateParameters {
  performanceLevel: 'economic' | 'balanced' | 'performance'
  numExperts: number // Number of experts selected
  framework?: string // 'swot' | 'pros-cons' | 'eisenhower' | null
  numContextQuestions: number // Number of questions answered
  hasInternetSearch: boolean // Whether internet search is enabled
}

/**
 * Cost multipliers by performance level
 */
const PERFORMANCE_MULTIPLIERS = {
  economic: 0.3,
  balanced: 1.0,
  performance: 3.0,
}

/**
 * Base credit costs for operations (at 'balanced' level)
 */
const BASE_COSTS = {
  // Phase 1: Context
  analyzeQuestion: 2, // Analyze question complexity
  validateAnswer: 1, // Per context question validation
  evaluateContext: 2, // Final context quality evaluation

  // Phase 2: Experts
  matchExperts: 3, // Match experts to question
  matchDepartments: 2, // Match departments
  matchWorkers: 2, // Match workers/professionals

  // Phase 3: Strategy
  analyzeStrategy: 2, // Strategy recommendation
  suggestFramework: 2, // Framework suggestion

  // Phase 5: Debate Execution
  perExpertPerRound: 5, // Cost per expert per round
  baseRounds: 3, // Typical number of rounds
  frameworkMultiplier: {
    swot: 1.5, // SWOT has 5 analysis prompts
    'pros-cons': 1.2, // Pros/Cons has 4 prompts
    eisenhower: 1.3, // Eisenhower has 2 prompts
    none: 1.0, // No framework
  },

  // Synthesis
  finalSynthesis: 8, // Secretary synthesis

  // Optional
  internetSearchPerQuery: 0, // Free (Google Custom Search)
}

/**
 * Estimate debate cost before execution
 */
export function estimateDebateCost(params: DebateParameters): DebateCostEstimate {
  const multiplier = PERFORMANCE_MULTIPLIERS[params.performanceLevel]
  const breakdown: DebateCostEstimate['breakdown'] = []

  // PHASE 1: Contexto
  const contextoCost =
    (BASE_COSTS.analyzeQuestion +
      BASE_COSTS.validateAnswer * params.numContextQuestions +
      BASE_COSTS.evaluateContext) *
    multiplier

  breakdown.push({
    phase: 'Contexto',
    credits: Math.ceil(contextoCost),
    description: `Análisis de pregunta + ${params.numContextQuestions} validaciones + evaluación`,
  })

  // PHASE 2: Expertos
  const expertosCost =
    (BASE_COSTS.matchExperts + BASE_COSTS.matchDepartments + BASE_COSTS.matchWorkers) * multiplier

  breakdown.push({
    phase: 'Expertos',
    credits: Math.ceil(expertosCost),
    description: 'Matching de expertos, departamentos y profesionales',
  })

  // PHASE 3: Estrategia
  const estrategiaCost = (BASE_COSTS.analyzeStrategy + BASE_COSTS.suggestFramework) * multiplier

  breakdown.push({
    phase: 'Estrategia',
    credits: Math.ceil(estrategiaCost),
    description: 'Recomendación de estrategia y framework',
  })

  // PHASE 5: Debate
  const frameworkKey = params.framework || 'none'
  const frameworkMultiplier =
    BASE_COSTS.frameworkMultiplier[
      frameworkKey as keyof typeof BASE_COSTS.frameworkMultiplier
    ] || 1.0

  const debateCost =
    BASE_COSTS.perExpertPerRound *
    params.numExperts *
    BASE_COSTS.baseRounds *
    frameworkMultiplier *
    multiplier

  breakdown.push({
    phase: 'Debate',
    credits: Math.ceil(debateCost),
    description: `${params.numExperts} expertos × ${BASE_COSTS.baseRounds} rondas${params.framework ? ` × Framework ${params.framework.toUpperCase()}` : ''}`,
  })

  // SYNTHESIS
  const synthesisCost = BASE_COSTS.finalSynthesis * multiplier

  breakdown.push({
    phase: 'Síntesis Final',
    credits: Math.ceil(synthesisCost),
    description: 'Síntesis ejecutiva del Secretario',
  })

  // INTERNET SEARCH (optional, free)
  if (params.hasInternetSearch) {
    breakdown.push({
      phase: 'Internet Search',
      credits: 0,
      description: 'Búsqueda en Google (gratuita)',
    })
  }

  const total =
    Math.ceil(contextoCost) +
    Math.ceil(expertosCost) +
    Math.ceil(estrategiaCost) +
    Math.ceil(debateCost) +
    Math.ceil(synthesisCost)

  logger.debug('[estimateDebateCost] Estimation calculated', {
    params,
    total,
    breakdown,
  })

  return {
    contexto: Math.ceil(contextoCost),
    expertos: Math.ceil(expertosCost),
    estrategia: Math.ceil(estrategiaCost),
    debate: Math.ceil(debateCost),
    synthesis: Math.ceil(synthesisCost),
    total,
    breakdown,
  }
}

/**
 * Get cost comparison across all 3 performance levels
 */
export function getPerformanceLevelComparison(
  params: Omit<DebateParameters, 'performanceLevel'>
): Record<'economic' | 'balanced' | 'performance', DebateCostEstimate> {
  return {
    economic: estimateDebateCost({ ...params, performanceLevel: 'economic' }),
    balanced: estimateDebateCost({ ...params, performanceLevel: 'balanced' }),
    performance: estimateDebateCost({ ...params, performanceLevel: 'performance' }),
  }
}
