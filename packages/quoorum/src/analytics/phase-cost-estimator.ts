/**
 * Phase Cost Estimator
 * 
 * Calcula el coste estimado de créditos para cada fase del flujo de debate.
 */

import { convertUsdToCredits } from './cost'

// ============================================================================
// TYPES
// ============================================================================

export interface PhaseCostConfig {
  numCriticalQuestions?: number
  numExperts?: number
  numDepartments?: number
  numWorkers?: number
  strategyComplexity?: 'simple' | 'medium' | 'complex'
  estimatedRounds?: number
}

export interface PhaseCostEstimate {
  phase: string
  costCredits: number
  costUsd: number
  breakdown?: {
    item: string
    costCredits: number
  }[]
  minCostCredits?: number
  maxCostCredits?: number
}

// ============================================================================
// COST ESTIMATION BY PHASE
// ============================================================================

/**
 * Estima el coste de la fase de contexto
 * - Contexto inicial: 0 créditos (solo input del usuario)
 * - Preguntas críticas: ~1 crédito por pregunta (análisis con IA)
 */
export function estimateContextPhaseCost(config: PhaseCostConfig): PhaseCostEstimate {
  const numQuestions = config.numCriticalQuestions || 0
  
  // Contexto inicial: 0 créditos (solo input del usuario)
  if (numQuestions === 0) {
    return {
      phase: 'contexto',
      costCredits: 0,
      costUsd: 0,
      breakdown: [],
    }
  }
  
  // Preguntas críticas: ~500 tokens × $0.00015/1k = $0.000075 → 1 crédito por pregunta
  const costPerQuestionUsd = 0.000075
  const totalCostUsd = numQuestions * costPerQuestionUsd
  const totalCredits = convertUsdToCredits(totalCostUsd)
  
  return {
    phase: 'contexto',
    costCredits: totalCredits,
    costUsd: totalCostUsd,
    breakdown: Array.from({ length: numQuestions }, (_, i) => ({
      item: `Pregunta crítica ${i + 1}`,
      costCredits: 1, // Mínimo 1 crédito por pregunta
    })),
  }
}

/**
 * Estima el coste de la fase de selección de expertos
 * - Matching de expertos: ~$0.002 (análisis con IA)
 * - Análisis por experto: ~$0.001 por experto
 * - Análisis por departamento: ~$0.001 por departamento
 * - Análisis por profesional: ~$0.001 por profesional
 */
export function estimateExpertSelectionPhaseCost(config: PhaseCostConfig): PhaseCostEstimate {
  const numExperts = config.numExperts || 0
  const numDepartments = config.numDepartments || 0
  const numWorkers = config.numWorkers || 0
  
  // Matching base: ~$0.002
  const matchingCostUsd = 0.002
  
  // Coste por experto: ~$0.001
  const expertCostUsd = numExperts * 0.001
  
  // Coste por departamento: ~$0.001
  const departmentCostUsd = numDepartments * 0.001
  
  // Coste por profesional: ~$0.001
  const workerCostUsd = numWorkers * 0.001
  
  const totalCostUsd = matchingCostUsd + expertCostUsd + departmentCostUsd + workerCostUsd
  const totalCredits = convertUsdToCredits(totalCostUsd)
  
  const breakdown = []
  if (matchingCostUsd > 0) {
    breakdown.push({ item: 'Matching de expertos', costCredits: convertUsdToCredits(matchingCostUsd) })
  }
  if (numExperts > 0) {
    breakdown.push({ item: `${numExperts} experto(s)`, costCredits: convertUsdToCredits(expertCostUsd) })
  }
  if (numDepartments > 0) {
    breakdown.push({ item: `${numDepartments} departamento(s)`, costCredits: convertUsdToCredits(departmentCostUsd) })
  }
  if (numWorkers > 0) {
    breakdown.push({ item: `${numWorkers} profesional(es)`, costCredits: convertUsdToCredits(workerCostUsd) })
  }
  
  return {
    phase: 'expertos',
    costCredits: totalCredits,
    costUsd: totalCostUsd,
    breakdown,
  }
}

/**
 * Estima el coste de la fase de estrategia
 * - Base: ~$0.005
 * - Multiplicador según complejidad: simple (1x), medium (1.5x), complex (2x)
 */
export function estimateStrategyPhaseCost(config: PhaseCostConfig): PhaseCostEstimate {
  const baseCostUsd = 0.005
  const complexity = config.strategyComplexity || 'medium'
  
  const multipliers = {
    simple: 1,
    medium: 1.5,
    complex: 2,
  }
  
  const totalCostUsd = baseCostUsd * multipliers[complexity]
  const totalCredits = convertUsdToCredits(totalCostUsd)
  
  return {
    phase: 'estrategia',
    costCredits: totalCredits,
    costUsd: totalCostUsd,
    breakdown: [
      { item: 'Análisis de estrategia', costCredits: totalCredits },
    ],
  }
}

/**
 * Estima el coste de ejecución del debate completo
 * - Basado en número de rondas y expertos
 * - Usa la función estimateCost existente
 * - Retorna rango min-max para estimación conservadora
 */
export function estimateDebateExecutionCost(config: PhaseCostConfig): PhaseCostEstimate {
  const numExperts = config.numExperts || 4
  const estimatedRounds = config.estimatedRounds || 5
  
  // Usar la misma lógica que estimateCost en debates.ts
  const avgTokensPerMessage = 125
  const inputTokensPerRound = avgTokensPerMessage * numExperts * 2
  const outputTokensPerRound = avgTokensPerMessage * numExperts
  
  const totalInputTokens = inputTokensPerRound * estimatedRounds
  const totalOutputTokens = outputTokensPerRound * estimatedRounds
  
  // GPT-4o-mini pricing
  const inputCost = (totalInputTokens / 1000) * 0.00015
  const outputCost = (totalOutputTokens / 1000) * 0.0006
  
  const totalCostUsd = Number((inputCost + outputCost).toFixed(4))
  const totalCredits = convertUsdToCredits(totalCostUsd)
  
  // Calcular rango (min-max)
  const minRounds = Math.max(1, estimatedRounds - 2)
  const maxRounds = estimatedRounds + 3
  
  const minInputTokens = inputTokensPerRound * minRounds
  const minOutputTokens = outputTokensPerRound * minRounds
  const minInputCost = (minInputTokens / 1000) * 0.00015
  const minOutputCost = (minOutputTokens / 1000) * 0.0006
  const minCostUsd = Number((minInputCost + minOutputCost).toFixed(4))
  const minCredits = convertUsdToCredits(minCostUsd)
  
  const maxInputTokens = inputTokensPerRound * maxRounds
  const maxOutputTokens = outputTokensPerRound * maxRounds
  const maxInputCost = (maxInputTokens / 1000) * 0.00015
  const maxOutputCost = (maxOutputTokens / 1000) * 0.0006
  const maxCostUsd = Number((maxInputCost + maxOutputCost).toFixed(4))
  const maxCredits = convertUsdToCredits(maxCostUsd)
  
  const result: PhaseCostEstimate & { minCostCredits?: number; maxCostCredits?: number } = {
    phase: 'debate',
    costCredits: totalCredits,
    costUsd: totalCostUsd,
    breakdown: [
      { item: `Debate (${estimatedRounds} rondas, ${numExperts} expertos)`, costCredits: totalCredits },
    ],
    minCostCredits: minCredits,
    maxCostCredits: maxCredits,
  }
  
  return result
}

/**
 * Calcula el coste total acumulado de todas las fases
 */
export function calculateTotalAccumulatedCost(
  phaseCosts: PhaseCostEstimate[]
): { totalCredits: number; totalUsd: number } {
  const totalCredits = phaseCosts.reduce((sum, phase) => sum + phase.costCredits, 0)
  const totalUsd = phaseCosts.reduce((sum, phase) => sum + phase.costUsd, 0)
  
  return { totalCredits, totalUsd }
}
