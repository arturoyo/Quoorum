/**
 * Strategy Selector
 *
 * Analyzes the initial query and automatically selects
 * the optimal debate pattern based on detected signals.
 */

import type { StrategyAnalysis, OrchestrationConfig } from './types'
import { detectSignals, countOptions, detectFactors } from './signal-patterns'
import { calculatePatternScores } from './pattern-scoring'
import { generateStructure } from './structure-generators'

// Re-export for convenience
export { detectSignals } from './signal-patterns'
export { getAvailablePatterns } from './pattern-scoring'

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Analyze a question and select the optimal debate pattern
 */
// eslint-disable-next-line @typescript-eslint/require-await -- Synchronous analysis, async for future AI enhancement
export async function selectStrategy(
  question: string,
  config: Partial<OrchestrationConfig> = {}
): Promise<StrategyAnalysis> {
  // If manual mode with preferred pattern, use that
  if (config.patternMode === 'manual' && config.preferredPattern) {
    const factors = detectFactors(question)
    const optionCount = countOptions(question)
    const structure = generateStructure(config.preferredPattern, question, factors, optionCount)

    return {
      recommendedPattern: config.preferredPattern,
      confidence: 1.0,
      reasoning: 'Patrón seleccionado manualmente por el usuario',
      estimatedCost: structure.estimatedTotalCost,
      estimatedTimeMinutes: structure.estimatedTotalTimeMinutes,
      alternativePatterns: [],
      structure,
      signals: [],
    }
  }

  // Auto mode: analyze and select
  const signals = detectSignals(question)
  const optionCount = countOptions(question)
  const factors = detectFactors(question)
  const patternScores = calculatePatternScores(signals, optionCount, factors)

  const bestPattern = patternScores[0]
  if (!bestPattern) {
    throw new Error('No pattern could be determined')
  }

  const structure = generateStructure(bestPattern.pattern, question, factors, optionCount)

  // Check cost limits
  if (config.maxTotalCost && structure.estimatedTotalCost > config.maxTotalCost) {
    const simpleStructure = generateStructure('simple', question, [], 0)
    return {
      recommendedPattern: 'simple',
      confidence: 0.5,
      reasoning: `Patrón simplificado: coste estimado (${structure.estimatedTotalCost.toFixed(2)}) excede límite (${config.maxTotalCost})`,
      estimatedCost: simpleStructure.estimatedTotalCost,
      estimatedTimeMinutes: simpleStructure.estimatedTotalTimeMinutes,
      alternativePatterns: patternScores.slice(0, 3).map((p) => p.pattern),
      structure: simpleStructure,
      signals,
    }
  }

  return {
    recommendedPattern: bestPattern.pattern,
    confidence: bestPattern.score,
    reasoning: bestPattern.reasoning,
    estimatedCost: structure.estimatedTotalCost,
    estimatedTimeMinutes: structure.estimatedTotalTimeMinutes,
    alternativePatterns: patternScores.slice(1, 4).map((p) => p.pattern),
    structure,
    signals,
  }
}
