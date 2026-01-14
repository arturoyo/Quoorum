/**
 * Debate Sequence
 *
 * Main entry point and convenience functions for orchestrated debates.
 */

import { selectStrategy } from './strategy-selector'
import { DebateOrchestrator } from './orchestrator'
import type {
  PatternType,
  StrategyAnalysis,
  DebateSequence,
  OrchestrationConfig,
  OrchestrationCallbacks,
} from './types'

// Re-exports
export { DebateOrchestrator, createOrchestrator } from './orchestrator'
export { consoleCallbacks, collectingCallbacks } from './callback-helpers'

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick analyze without creating an orchestrator
 */
export async function analyzeQuestion(question: string): Promise<StrategyAnalysis> {
  return selectStrategy(question)
}

/**
 * Quick run with auto pattern selection
 */
export async function runOrchestrated(
  question: string,
  userId: string,
  options?: {
    pattern?: PatternType
    config?: Partial<OrchestrationConfig>
    callbacks?: OrchestrationCallbacks
  }
): Promise<DebateSequence> {
  const orchestrator = new DebateOrchestrator(options?.config, options?.callbacks)
  return orchestrator.run(question, userId, { pattern: options?.pattern })
}

/**
 * Get pattern recommendation for a question
 */
export async function recommendPattern(question: string): Promise<{
  pattern: PatternType
  confidence: number
  reasoning: string
  alternatives: PatternType[]
}> {
  const analysis = await selectStrategy(question)
  return {
    pattern: analysis.recommendedPattern,
    confidence: analysis.confidence,
    reasoning: analysis.reasoning,
    alternatives: analysis.alternativePatterns,
  }
}

/**
 * List all patterns with details
 */
export { getAvailablePatterns as listPatterns } from './pattern-scoring'

// ============================================================================
// CONFIG HELPERS
// ============================================================================

/**
 * Create configuration for manual mode
 */
export function manualModeConfig(pattern: PatternType): Partial<OrchestrationConfig> {
  return {
    patternMode: 'manual',
    preferredPattern: pattern,
  }
}

/**
 * Create configuration for auto mode
 */
export function autoModeConfig(): Partial<OrchestrationConfig> {
  return {
    patternMode: 'auto',
    preferredPattern: undefined,
  }
}

/**
 * Create configuration with cost limits
 */
export function costLimitedConfig(
  maxCost: number,
  warnAt?: number
): Partial<OrchestrationConfig> {
  return {
    maxTotalCost: maxCost,
    warnAtCost: warnAt ?? maxCost * 0.7,
  }
}

/**
 * Create configuration with quality thresholds
 */
export function qualityConfig(
  minQuality: number,
  maxIterations?: number
): Partial<OrchestrationConfig> {
  return {
    minQualityThreshold: minQuality,
    maxIterations: maxIterations ?? 3,
  }
}
