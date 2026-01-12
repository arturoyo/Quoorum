/**
 * Debate Orchestrator
 *
 * Main class for orchestrated debates with multiple patterns.
 */

import { selectStrategy, getAvailablePatterns } from './strategy-selector'
import { executeStructure } from './flow-executor'
import { toMermaid, toAsciiTree, toVisualizationJson } from './visualization'
import type {
  PatternType,
  StrategyAnalysis,
  DebateSequence,
  OrchestrationConfig,
  OrchestrationCallbacks,
} from './types'
import { DEFAULT_ORCHESTRATION_CONFIG } from './types'

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

/**
 * Main orchestrator for debate sequences
 */
export class DebateOrchestrator {
  private config: OrchestrationConfig
  private callbacks: OrchestrationCallbacks
  private activeSequences: Map<string, DebateSequence> = new Map()

  constructor(
    config: Partial<OrchestrationConfig> = {},
    callbacks: OrchestrationCallbacks = {}
  ) {
    this.config = { ...DEFAULT_ORCHESTRATION_CONFIG, ...config }
    this.callbacks = callbacks
  }

  /**
   * Analyze a question and recommend a debate pattern
   */
  async analyze(question: string): Promise<StrategyAnalysis> {
    return selectStrategy(question, this.config)
  }

  /**
   * Preview what the debate structure would look like
   */
  async preview(question: string, pattern?: PatternType): Promise<{
    analysis: StrategyAnalysis
    estimatedCost: number
    estimatedTimeMinutes: number
    phaseCount: number
    debateCount: number
  }> {
    const configOverride = pattern
      ? { ...this.config, patternMode: 'manual' as const, preferredPattern: pattern }
      : this.config

    const analysis = await selectStrategy(question, configOverride)

    const phaseCount = analysis.structure.phases.length
    const debateCount = analysis.structure.phases.reduce(
      (sum, p) => sum + p.debates.length, 0
    )

    return {
      analysis,
      estimatedCost: analysis.estimatedCost,
      estimatedTimeMinutes: analysis.estimatedTimeMinutes,
      phaseCount,
      debateCount,
    }
  }

  /**
   * Run a complete debate sequence
   */
  async run(
    question: string,
    userId: string,
    options: {
      pattern?: PatternType
      skipApproval?: boolean
    } = {}
  ): Promise<DebateSequence> {
    const configOverride: Partial<OrchestrationConfig> = {
      ...this.config,
      requireApproval: !options.skipApproval,
    }

    if (options.pattern) {
      configOverride.patternMode = 'manual'
      configOverride.preferredPattern = options.pattern
    }

    const analysis = await selectStrategy(question, configOverride)

    const sequence = await executeStructure(
      analysis.structure,
      userId,
      question,
      configOverride,
      this.callbacks
    )

    sequence.pattern = analysis.recommendedPattern
    this.activeSequences.set(sequence.id, sequence)

    return sequence
  }

  /**
   * Run with auto pattern selection
   */
  async runAuto(question: string, userId: string): Promise<DebateSequence> {
    return this.run(question, userId, { skipApproval: false })
  }

  /**
   * Run with manual pattern selection
   */
  async runManual(
    question: string,
    userId: string,
    pattern: PatternType
  ): Promise<DebateSequence> {
    return this.run(question, userId, { pattern, skipApproval: false })
  }

  /**
   * Run quick (simple pattern, no approval)
   */
  async runQuick(question: string, userId: string): Promise<DebateSequence> {
    return this.run(question, userId, { pattern: 'simple', skipApproval: true })
  }

  /**
   * Get active sequence status
   */
  getSequence(sequenceId: string): DebateSequence | undefined {
    return this.activeSequences.get(sequenceId)
  }

  /**
   * Cancel an active sequence
   */
  cancel(sequenceId: string): boolean {
    const sequence = this.activeSequences.get(sequenceId)
    if (sequence && sequence.status === 'running') {
      sequence.status = 'cancelled'
      sequence.completedAt = new Date()
      return true
    }
    return false
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OrchestrationConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): OrchestrationConfig {
    return { ...this.config }
  }

  /**
   * Get all available patterns with descriptions
   */
  getPatterns(): Array<{
    pattern: PatternType
    name: string
    description: string
    bestFor: string
  }> {
    return getAvailablePatterns()
  }

  /**
   * Compare all patterns for a question (quick win)
   */
  async comparePatterns(question: string): Promise<Array<{
    pattern: PatternType
    cost: number
    time: number
    phases: number
    debates: number
    recommended: boolean
  }>> {
    const auto = await selectStrategy(question, this.config)
    const patterns = getAvailablePatterns()

    const comparisons = await Promise.all(
      patterns.map(async ({ pattern }) => {
        const analysis = await selectStrategy(question, {
          ...this.config,
          patternMode: 'manual',
          preferredPattern: pattern,
        })
        return {
          pattern,
          cost: analysis.estimatedCost,
          time: analysis.estimatedTimeMinutes,
          phases: analysis.structure.phases.length,
          debates: analysis.structure.phases.reduce((s, p) => s + p.debates.length, 0),
          recommended: pattern === auto.recommendedPattern,
        }
      })
    )

    return comparisons.sort((a, b) => a.cost - b.cost)
  }

  /**
   * Dry run - show execution plan without running (quick win)
   */
  async dryRun(question: string, pattern?: PatternType): Promise<{
    pattern: PatternType
    phases: Array<{
      id: string
      type: string
      execution: string
      debates: string[]
      dependsOn: string[]
    }>
    totalCost: number
    totalTime: number
    wouldAskApproval: boolean
  }> {
    const configOverride = pattern
      ? { ...this.config, patternMode: 'manual' as const, preferredPattern: pattern }
      : this.config

    const analysis = await selectStrategy(question, configOverride)

    return {
      pattern: analysis.recommendedPattern,
      phases: analysis.structure.phases.map(p => ({
        id: p.id,
        type: p.type,
        execution: p.execution,
        debates: p.debates.map(d => d.question),
        dependsOn: p.dependsOn,
      })),
      totalCost: analysis.estimatedCost,
      totalTime: analysis.estimatedTimeMinutes,
      wouldAskApproval: this.config.requireApproval,
    }
  }

  /**
   * Generate Mermaid diagram of the debate structure
   */
  async visualize(question: string, pattern?: PatternType): Promise<string> {
    const configOverride = pattern
      ? { ...this.config, patternMode: 'manual' as const, preferredPattern: pattern }
      : this.config
    const analysis = await selectStrategy(question, configOverride)
    return toMermaid(analysis.structure, analysis.recommendedPattern)
  }

  /**
   * Generate ASCII tree representation
   */
  async visualizeAscii(question: string, pattern?: PatternType): Promise<string> {
    const configOverride = pattern
      ? { ...this.config, patternMode: 'manual' as const, preferredPattern: pattern }
      : this.config
    const analysis = await selectStrategy(question, configOverride)
    return toAsciiTree(analysis.structure, analysis.recommendedPattern)
  }

  /**
   * Generate JSON for external visualization tools
   */
  async toVisualizationData(question: string, pattern?: PatternType): Promise<{
    metadata: { pattern: PatternType; question: string; generatedAt: string; estimatedCost: number; estimatedTime: number }
    nodes: Array<{ id: string; type: string; label: string; data?: Record<string, unknown> }>
    edges: Array<{ source: string; target: string; label?: string }>
  }> {
    const configOverride = pattern
      ? { ...this.config, patternMode: 'manual' as const, preferredPattern: pattern }
      : this.config
    const analysis = await selectStrategy(question, configOverride)
    return toVisualizationJson(analysis.structure, analysis.recommendedPattern, question)
  }
}

/** Create a new orchestrator with default configuration */
export function createOrchestrator(
  config?: Partial<OrchestrationConfig>, callbacks?: OrchestrationCallbacks
): DebateOrchestrator { return new DebateOrchestrator(config, callbacks) }
