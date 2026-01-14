/**
 * Orchestration Types
 *
 * Types for the debate orchestration system that supports
 * multiple resolution patterns (sequential, parallel, tournament, etc.)
 */

// ============================================================================
// PATTERN TYPES
// ============================================================================

export type PatternType =
  | 'simple'        // Single debate, no subdivision
  | 'sequential'    // A → B → C → Conclusion
  | 'parallel'      // A, B, C simultaneously → Synthesis
  | 'conditional'   // Branch based on results
  | 'iterative'     // Loop until quality threshold
  | 'tournament'    // Bracket elimination (A vs B, C vs D, winners compete)
  | 'adversarial'   // Defender vs Attacker + Judge
  | 'ensemble'      // Multiple independent debates → Aggregate
  | 'hierarchical'  // Tree structure, drill down

// ============================================================================
// STRATEGY SELECTION
// ============================================================================

export interface StrategyAnalysis {
  recommendedPattern: PatternType
  confidence: number
  reasoning: string
  estimatedCost: number
  estimatedTimeMinutes: number
  alternativePatterns: PatternType[]
  structure: DebateStructure
  signals: QuerySignal[]
}

export interface QuerySignal {
  type: SignalType
  detected: boolean
  value?: string | number
  weight: number
}

export type SignalType =
  | 'binary_choice'       // "¿A o B?"
  | 'multiple_options'    // "¿A, B, C o D?"
  | 'broad_topic'         // Tema amplio que necesita desglose
  | 'high_risk'           // Decisión crítica
  | 'optimization'        // "Optimizar/mejorar X"
  | 'multiple_factors'    // "Considerando X, Y, Z"
  | 'comparison'          // "¿Cuál es mejor?"
  | 'exploration'         // "¿Cómo podría...?"
  | 'validation'          // "¿Es correcto que...?"

// ============================================================================
// DEBATE STRUCTURE
// ============================================================================

export interface DebateStructure {
  phases: DebatePhase[]
  estimatedTotalCost: number
  estimatedTotalTimeMinutes: number
}

export interface DebatePhase {
  id: string
  order: number
  type: 'debate' | 'synthesis' | 'branch' | 'aggregate'
  execution: 'sequential' | 'parallel'
  debates: SubDebate[]
  dependsOn: string[]  // IDs of phases that must complete first
  condition?: BranchCondition
}

export interface SubDebate {
  id: string
  question: string
  context?: string
  inheritContext: boolean  // Inherit conclusions from previous phases
  estimatedCost: number
  estimatedTimeMinutes: number
  forceExperts?: string[]  // Force specific experts
  maxRounds?: number
}

export interface BranchCondition {
  field: string  // e.g., 'consensusScore', 'qualityScore'
  operator: '>' | '<' | '==' | '>=' | '<='
  value: number
  thenPhase: string
  elsePhase: string
}

// ============================================================================
// EXECUTION
// ============================================================================

export interface DebateSequence {
  id: string
  userId: string
  mainQuestion: string
  pattern: PatternType
  mode: 'manual' | 'suggested' | 'auto'
  structure: DebateStructure
  status: SequenceStatus
  results: PhaseResult[]
  finalConclusion?: FinalConclusion
  totalCost: number
  totalTimeMinutes: number
  createdAt: Date
  completedAt?: Date
}

export type SequenceStatus =
  | 'planning'      // Analyzing and creating structure
  | 'pending'       // Waiting for user approval
  | 'running'       // Executing debates
  | 'synthesizing'  // Creating final conclusion
  | 'completed'     // Done
  | 'failed'        // Error occurred
  | 'cancelled'     // User cancelled

export interface PhaseResult {
  phaseId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  debateResults: SubDebateResult[]
  synthesizedConclusion?: string
  startedAt?: Date
  completedAt?: Date
}

export interface SubDebateResult {
  debateId: string
  question: string
  consensusScore: number
  qualityScore: number
  topOption: string
  ranking: RankedOption[]
  cost: number
  rounds: number
}

export interface RankedOption {
  option: string
  score: number
  confidence: number
  reasoning: string
}

export interface FinalConclusion {
  summary: string
  recommendation: string
  confidence: number
  keyInsights: string[]
  dissenting?: string  // Any minority opinions
  nextSteps?: string[]
}

// ============================================================================
// USER CONTROLS
// ============================================================================

export interface OrchestrationConfig {
  // Pattern selection
  patternMode: 'auto' | 'manual'
  preferredPattern?: PatternType

  // Cost controls
  maxTotalCost: number
  warnAtCost: number

  // Quality controls
  minQualityThreshold: number
  maxIterations: number  // For iterative pattern

  // Execution
  parallelLimit: number  // Max concurrent debates
  timeout: number        // Max time per debate (minutes)

  // User approval
  requireApproval: boolean  // Pause before execution
  notifyOnComplete: boolean
}

export const DEFAULT_ORCHESTRATION_CONFIG: OrchestrationConfig = {
  patternMode: 'auto',
  maxTotalCost: 5.0,
  warnAtCost: 2.0,
  minQualityThreshold: 70,
  maxIterations: 3,
  parallelLimit: 5,
  timeout: 10,
  requireApproval: true,
  notifyOnComplete: true,
}

// ============================================================================
// CALLBACKS
// ============================================================================

export interface OrchestrationCallbacks {
  onStructureReady?: (structure: DebateStructure) => void
  onPhaseStart?: (phase: DebatePhase) => void
  onPhaseComplete?: (phase: DebatePhase, result: PhaseResult) => void
  onDebateStart?: (debate: SubDebate) => void
  onDebateComplete?: (debate: SubDebate, result: SubDebateResult) => void
  onCostWarning?: (currentCost: number, maxCost: number) => void
  onApprovalNeeded?: (structure: DebateStructure) => Promise<boolean>
  onComplete?: (sequence: DebateSequence) => void
  onError?: (error: Error, phase?: DebatePhase) => void
}
