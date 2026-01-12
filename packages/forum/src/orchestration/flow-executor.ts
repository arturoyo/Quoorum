/**
 * Flow Executor
 *
 * Executes debate structures according to the selected pattern.
 */

import type {
  DebateStructure,
  DebateSequence,
  OrchestrationConfig,
  OrchestrationCallbacks,
} from './types'
import { DEFAULT_ORCHESTRATION_CONFIG } from './types'
import { executePhase, type ExecutionContext } from './phase-executor'
import { synthesizePhaseResults, generateFinalConclusion } from './result-synthesis'

// ============================================================================
// MAIN EXECUTOR
// ============================================================================

/**
 * Execute a complete debate structure
 */
export async function executeStructure(
  structure: DebateStructure,
  userId: string,
  mainQuestion: string,
  config: Partial<OrchestrationConfig> = {},
  callbacks: OrchestrationCallbacks = {}
): Promise<DebateSequence> {
  const fullConfig: OrchestrationConfig = {
    ...DEFAULT_ORCHESTRATION_CONFIG,
    ...config,
  }

  if (fullConfig.requireApproval && callbacks.onApprovalNeeded) {
    const approved = await callbacks.onApprovalNeeded(structure)
    if (!approved) {
      return {
        id: `seq-${Date.now()}`,
        userId,
        mainQuestion,
        pattern: 'simple',
        mode: 'auto',
        structure,
        status: 'cancelled',
        results: [],
        totalCost: 0,
        totalTimeMinutes: 0,
        createdAt: new Date(),
      }
    }
  }

  callbacks.onStructureReady?.(structure)

  const context: ExecutionContext = {
    userId,
    previousResults: new Map(),
    accumulatedContext: [],
    totalCost: 0,
    config: fullConfig,
    callbacks,
    sessionId: `seq-${Date.now()}`,
  }

  const sequence: DebateSequence = {
    id: `seq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    mainQuestion,
    pattern: 'simple',
    mode: fullConfig.patternMode === 'auto' ? 'auto' : 'manual',
    structure,
    status: 'running',
    results: [],
    totalCost: 0,
    totalTimeMinutes: 0,
    createdAt: new Date(),
  }

  try {
    const sortedPhases = [...structure.phases].sort((a, b) => a.order - b.order)
    const executedPhases = new Set<string>()

    for (const phase of sortedPhases) {
      const dependenciesMet = phase.dependsOn.every(depId => executedPhases.has(depId))

      if (!dependenciesMet) {
        throw new Error(`Phase ${phase.id} has unmet dependencies: ${phase.dependsOn.join(', ')}`)
      }

      if (context.totalCost >= fullConfig.maxTotalCost) {
        sequence.status = 'failed'
        throw new Error(`Límite de coste alcanzado: $${context.totalCost.toFixed(2)} >= $${fullConfig.maxTotalCost}`)
      }

      const phaseResult = await executePhase(phase, context, synthesizePhaseResults)
      sequence.results.push(phaseResult)
      executedPhases.add(phase.id)
    }

    sequence.status = 'synthesizing'
    sequence.finalConclusion = await generateFinalConclusion(sequence, context)

    sequence.status = 'completed'
    sequence.completedAt = new Date()
    sequence.totalCost = context.totalCost
    sequence.totalTimeMinutes = Math.round(
      (sequence.completedAt.getTime() - sequence.createdAt.getTime()) / 60000
    )

    callbacks.onComplete?.(sequence)

    return sequence
  } catch (error) {
    sequence.status = 'failed'
    sequence.completedAt = new Date()
    const err = error instanceof Error ? error : new Error(String(error))
    callbacks.onError?.(err)
    throw err
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Estimate execution cost for a structure
 */
export function estimateCost(structure: DebateStructure): number {
  return structure.phases.reduce(
    (sum, phase) => sum + phase.debates.reduce(
      (s, d) => s + d.estimatedCost, 0
    ), 0
  )
}

/**
 * Estimate execution time for a structure
 */
export function estimateTime(structure: DebateStructure): number {
  let totalTime = 0

  for (const phase of structure.phases) {
    if (phase.execution === 'parallel') {
      const maxTime = Math.max(...phase.debates.map(d => d.estimatedTimeMinutes), 0)
      totalTime += maxTime
    } else {
      totalTime += phase.debates.reduce((sum, d) => sum + d.estimatedTimeMinutes, 0)
    }
  }

  return totalTime
}

/**
 * Cancel a running sequence
 */
export function cancelSequence(_sequenceId: string): void {
  // TODO: Implement proper cancellation with AbortController
}
