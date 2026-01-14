/**
 * Phase Executor
 *
 * Executes individual phases and sub-debates.
 */

import { runDebate as runForumDebate } from '../runner-dynamic'
import type {
  DebatePhase,
  SubDebate,
  SubDebateResult,
  PhaseResult,
  OrchestrationConfig,
  OrchestrationCallbacks,
  BranchCondition,
} from './types'

// ============================================================================
// EXECUTION CONTEXT
// ============================================================================

export interface ExecutionContext {
  userId: string
  previousResults: Map<string, PhaseResult>
  accumulatedContext: string[]
  totalCost: number
  config: OrchestrationConfig
  callbacks: OrchestrationCallbacks
  sessionId: string
}

// ============================================================================
// SUB-DEBATE EXECUTION
// ============================================================================

/**
 * Execute a single sub-debate
 */
export async function executeSubDebate(
  debate: SubDebate,
  context: ExecutionContext
): Promise<SubDebateResult> {
  let inheritedContext = ''
  if (debate.inheritContext && context.accumulatedContext.length > 0) {
    inheritedContext = '\n\nContexto de debates anteriores:\n' +
      context.accumulatedContext.join('\n---\n')
  }

  const fullQuestion = debate.context
    ? `${debate.question}\n\nContexto adicional: ${debate.context}${inheritedContext}`
    : `${debate.question}${inheritedContext}`

  context.callbacks.onDebateStart?.(debate)

  try {
    const result = await runForumDebate({
      sessionId: `${context.sessionId}-${debate.id}`,
      question: fullQuestion,
      context: { sources: [], combinedContext: inheritedContext || 'Orquestación de debates' },
      forceMode: 'dynamic',
    })

    const winner = result.ranking?.[0]
    const consensusScore = result.consensus ?? result.consensusScore ?? 0.5
    const qualityScore = result.rounds.length > 0 ? 70 : 50

    const subResult: SubDebateResult = {
      debateId: debate.id,
      question: debate.question,
      consensusScore,
      qualityScore,
      topOption: winner?.option ?? 'No determinado',
      ranking: result.ranking?.map((r, index) => ({
        option: r.option,
        score: r.score ?? 0,
        confidence: r.confidence ?? (1 - index * 0.2),
        reasoning: r.reasoning ?? '',
      })) ?? [],
      cost: result.totalCostUsd ?? debate.estimatedCost,
      rounds: result.rounds.length,
    }

    const conclusionSummary = `[${debate.id}] ${debate.question}: ${subResult.topOption} (Consenso: ${(subResult.consensusScore * 100).toFixed(0)}%)`
    context.accumulatedContext.push(conclusionSummary)
    context.totalCost += subResult.cost

    if (context.totalCost >= context.config.warnAtCost) {
      context.callbacks.onCostWarning?.(context.totalCost, context.config.maxTotalCost)
    }

    context.callbacks.onDebateComplete?.(debate, subResult)

    return subResult
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    context.callbacks.onError?.(err)
    throw err
  }
}

// ============================================================================
// PARALLEL/SEQUENTIAL EXECUTION
// ============================================================================

/**
 * Execute debates in parallel
 */
export async function executeParallel(
  debates: SubDebate[],
  context: ExecutionContext,
  parallelLimit: number
): Promise<SubDebateResult[]> {
  const results: SubDebateResult[] = []

  for (let i = 0; i < debates.length; i += parallelLimit) {
    const batch = debates.slice(i, i + parallelLimit)
    const batchResults = await Promise.all(
      batch.map(debate => executeSubDebate(debate, context))
    )
    results.push(...batchResults)
  }

  return results
}

/**
 * Execute debates sequentially
 */
export async function executeSequential(
  debates: SubDebate[],
  context: ExecutionContext
): Promise<SubDebateResult[]> {
  const results: SubDebateResult[] = []

  for (const debate of debates) {
    const result = await executeSubDebate(debate, context)
    results.push(result)
  }

  return results
}

// ============================================================================
// BRANCH EVALUATION
// ============================================================================

/**
 * Evaluate a branch condition
 */
export function evaluateBranchCondition(
  condition: BranchCondition,
  phaseResult: PhaseResult
): string {
  const lastDebate = phaseResult.debateResults[phaseResult.debateResults.length - 1]
  if (!lastDebate) {
    return condition.elsePhase
  }

  let fieldValue: number
  switch (condition.field) {
    case 'consensusScore':
      fieldValue = lastDebate.consensusScore
      break
    case 'qualityScore':
      fieldValue = lastDebate.qualityScore
      break
    default:
      fieldValue = 0
  }

  let result: boolean
  switch (condition.operator) {
    case '>':
      result = fieldValue > condition.value
      break
    case '<':
      result = fieldValue < condition.value
      break
    case '>=':
      result = fieldValue >= condition.value
      break
    case '<=':
      result = fieldValue <= condition.value
      break
    case '==':
      result = fieldValue === condition.value
      break
    default:
      result = false
  }

  return result ? condition.thenPhase : condition.elsePhase
}

// ============================================================================
// PHASE EXECUTION
// ============================================================================

/**
 * Execute a single phase
 */
export async function executePhase(
  phase: DebatePhase,
  context: ExecutionContext,
  synthesizeResults: (results: SubDebateResult[], ctx: ExecutionContext) => Promise<string>
): Promise<PhaseResult> {
  context.callbacks.onPhaseStart?.(phase)

  const result: PhaseResult = {
    phaseId: phase.id,
    status: 'running',
    debateResults: [],
    startedAt: new Date(),
  }

  try {
    if (phase.type === 'branch') {
      const previousPhaseId = phase.dependsOn[0]
      const previousResult = previousPhaseId
        ? context.previousResults.get(previousPhaseId)
        : undefined

      if (previousResult && phase.condition) {
        const nextPhaseId = evaluateBranchCondition(phase.condition, previousResult)
        result.synthesizedConclusion = `Branch: ir a ${nextPhaseId}`
      }

      result.status = 'completed'
      result.completedAt = new Date()
    } else if (phase.debates.length === 0) {
      result.status = 'completed'
      result.completedAt = new Date()
    } else if (phase.execution === 'parallel') {
      result.debateResults = await executeParallel(
        phase.debates,
        context,
        context.config.parallelLimit
      )
      result.status = 'completed'
      result.completedAt = new Date()
    } else {
      result.debateResults = await executeSequential(phase.debates, context)
      result.status = 'completed'
      result.completedAt = new Date()
    }

    if (result.debateResults.length > 1) {
      result.synthesizedConclusion = await synthesizeResults(result.debateResults, context)
    } else if (result.debateResults.length === 1) {
      result.synthesizedConclusion = result.debateResults[0]?.topOption
    }

    context.previousResults.set(phase.id, result)
    context.callbacks.onPhaseComplete?.(phase, result)

    return result
  } catch (error) {
    result.status = 'failed'
    const err = error instanceof Error ? error : new Error(String(error))
    context.callbacks.onError?.(err, phase)
    throw err
  }
}
