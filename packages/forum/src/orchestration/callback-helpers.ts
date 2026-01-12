/**
 * Callback Helpers
 *
 * Pre-built callback configurations for common use cases.
 */

import type { OrchestrationCallbacks } from './types'
import { forumLogger } from '../forum-logger'

// ============================================================================
// CONSOLE CALLBACKS
// ============================================================================

/**
 * Create callbacks for console logging
 */
export function consoleCallbacks(): OrchestrationCallbacks {
  return {
    onStructureReady: (structure) => {
      forumLogger.info('Estructura lista', {
        phases: structure.phases.length,
        estimatedCost: `$${structure.estimatedTotalCost.toFixed(2)}`,
        estimatedTime: `${structure.estimatedTotalTimeMinutes} min`,
      })
    },
    onPhaseStart: (phase) => {
      forumLogger.info('Iniciando fase', {
        phaseId: phase.id,
        execution: phase.execution,
      })
    },
    onPhaseComplete: (phase, result) => {
      forumLogger.info('Fase completada', {
        phaseId: phase.id,
        conclusion: result.synthesizedConclusion?.substring(0, 100),
      })
    },
    onDebateStart: (debate) => {
      forumLogger.info('Debate iniciado', {
        question: debate.question.substring(0, 60),
      })
    },
    onDebateComplete: (_debate, result) => {
      forumLogger.info('Debate completado', {
        topOption: result.topOption,
        consensusScore: `${(result.consensusScore * 100).toFixed(0)}%`,
      })
    },
    onCostWarning: (current, max) => {
      forumLogger.warn('Advertencia de coste', {
        current: `$${current.toFixed(2)}`,
        max: `$${max.toFixed(2)}`,
      })
    },
    onComplete: (sequence) => {
      forumLogger.info('Secuencia completada', {
        sequenceId: sequence.id,
        totalCost: `$${sequence.totalCost.toFixed(2)}`,
        totalTime: `${sequence.totalTimeMinutes} min`,
        recommendation: sequence.finalConclusion?.recommendation,
      })
    },
    onError: (error, phase) => {
      forumLogger.error(
        `Error${phase ? ` en fase ${phase.id}` : ''}`,
        error instanceof Error ? error : new Error(String(error)),
        { phaseId: phase?.id }
      )
    },
  }
}

// ============================================================================
// COLLECTING CALLBACKS
// ============================================================================

/**
 * Create callbacks that collect results
 */
export function collectingCallbacks(): {
  callbacks: OrchestrationCallbacks
  getResults: () => {
    phases: Array<{ id: string; debates: number; conclusion?: string }>
    totalCost: number
    totalTime: number
  }
} {
  const phases: Array<{ id: string; debates: number; conclusion?: string }> = []
  let totalCost = 0
  let totalTime = 0

  return {
    callbacks: {
      onPhaseComplete: (phase, result) => {
        phases.push({
          id: phase.id,
          debates: result.debateResults.length,
          conclusion: result.synthesizedConclusion,
        })
      },
      onComplete: (sequence) => {
        totalCost = sequence.totalCost
        totalTime = sequence.totalTimeMinutes
      },
    },
    getResults: () => ({ phases, totalCost, totalTime }),
  }
}
