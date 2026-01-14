/**
 * Structure Generators
 *
 * Generates complete debate structures for each pattern type.
 */

import type { PatternType, DebateStructure, DebatePhase } from './types'
import {
  createSimplePhase,
  createSequentialPhases,
  createParallelPhases,
  createTournamentPhases,
  createAdversarialPhases,
  createIterativePhases,
  createEnsemblePhases,
  createHierarchicalPhases,
  createConditionalPhases,
  createSynthesisPhase,
} from './pattern-structures'

// ============================================================================
// MAIN STRUCTURE GENERATOR
// ============================================================================

/**
 * Generate debate structure for the selected pattern
 */
export function generateStructure(
  pattern: PatternType,
  question: string,
  factors: string[],
  optionCount: number
): DebateStructure {
  const phases: DebatePhase[] = []

  switch (pattern) {
    case 'simple':
      phases.push(createSimplePhase(question))
      break
    case 'sequential':
      phases.push(...createSequentialPhases(question, factors))
      break
    case 'parallel':
      phases.push(...createParallelPhases(question, factors))
      break
    case 'tournament':
      phases.push(...createTournamentPhases(question, optionCount))
      break
    case 'adversarial':
      phases.push(...createAdversarialPhases(question))
      break
    case 'iterative':
      phases.push(...createIterativePhases(question))
      break
    case 'ensemble':
      phases.push(...createEnsemblePhases(question))
      break
    case 'hierarchical':
      phases.push(...createHierarchicalPhases(question, factors))
      break
    case 'conditional':
      phases.push(...createConditionalPhases(question))
      break
  }

  const debateCount = phases.reduce((sum, p) => sum + p.debates.length, 0)
  if (debateCount > 1) {
    phases.push(createSynthesisPhase(phases))
  }

  const estimatedTotalCost = phases.reduce(
    (sum, p) => sum + p.debates.reduce((s, d) => s + d.estimatedCost, 0),
    0
  )
  const estimatedTotalTimeMinutes = calculateTotalTime(phases)

  return {
    phases,
    estimatedTotalCost,
    estimatedTotalTimeMinutes,
  }
}

function calculateTotalTime(phases: DebatePhase[]): number {
  let totalTime = 0

  for (const phase of phases) {
    if (phase.execution === 'parallel') {
      const maxTime = Math.max(...phase.debates.map(d => d.estimatedTimeMinutes))
      totalTime += maxTime
    } else {
      totalTime += phase.debates.reduce((sum, d) => sum + d.estimatedTimeMinutes, 0)
    }
  }

  return totalTime
}
