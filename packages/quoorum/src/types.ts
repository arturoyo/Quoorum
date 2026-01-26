/**
 * Forum Types
 *
 * Tipos para el sistema de deliberacion multi-agente
 */

import { z } from 'zod'

// ============================================================================
// AGENT TYPES
// ============================================================================

export type AgentRole = 'optimizer' | 'critic' | 'analyst' | 'synthesizer'
export type AIProviderType = 'openai' | 'anthropic' | 'deepseek' | 'google' | 'groq'

export interface AgentConfig {
  key: string
  name: string
  role: AgentRole
  prompt: string
  provider: AIProviderType
  model: string
  temperature: number
  narrativeId?: string // Narrative character ID (e.g., 'atenea', 'apolo', 'ares', 'hermes')
}

// ============================================================================
// SESSION TYPES
// ============================================================================

export type SessionStatus = 'running' | 'completed' | 'failed'

export interface CreateSessionInput {
  question: string
  manualContext?: string
  useInternet: boolean
  useRepo: boolean
  repoPath?: string
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export interface DebateMessage {
  id: string
  sessionId: string
  round: number
  agentKey: string
  agentName: string
  narrativeId?: string // Narrative character ID (e.g., 'atenea', 'arturo') - for UI anonymization
  content: string // Versión expandida/legible para mostrar al usuario
  compressedContent?: string // Versión comprimida original de la IA (para análisis/optimización)
  isCompressed: boolean
  tokensUsed: number
  costUsd: number
  createdAt: Date
  provider?: AIProviderType // AI provider used (denormalized for analytics)
  modelId?: string // AI model used (e.g., "gpt-4o", "claude-3-5-sonnet", "gemini-2.0-flash")
  translation?: string
  expert?: string // Expert ID for dynamic mode
  isError?: boolean // True if this message represents an error (agent failed)
}

// ============================================================================
// CONSENSUS TYPES
// ============================================================================

export interface RankedOption {
  option: string
  successRate: number // 0-100
  score?: number // Overall score (alias for successRate)
  pros: string[]
  cons: string[]
  supporters: string[]
  confidence: number // 0-1
  reasoning?: string // Explanation for this option
}

// ============================================================================
// ROUTER TYPES (Conditional Workflow)
// ============================================================================

export type RouterCondition =
  | 'high_confidence' // confidence >= 0.7
  | 'low_confidence' // confidence < 0.5
  | 'strong_agreement' // successRate >= 80
  | 'strong_disagreement' // successRate <= 30
  | 'needs_data' // message contains "falta", "necesito", "datos"
  | 'stalemate' // No change in ranking for 2+ rounds
  | 'default' // Fallback

export interface RouterRule {
  condition: RouterCondition
  agentOrder: AgentRole[]
  description: string
}

export interface RouterConfig {
  rules: RouterRule[]
  defaultOrder: AgentRole[]
}

export interface ConsensusResult {
  hasConsensus: boolean
  consensusScore: number // 0-1
  topOptions: RankedOption[]
  shouldContinue: boolean
  reasoning: string
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export type ContextSourceType = 'manual' | 'internet' | 'repo'

export interface ContextSource {
  type: ContextSourceType
  content: string
  metadata?: Record<string, unknown>
}

export interface LoadedContext {
  sources: ContextSource[]
  combinedContext: string
}

// ============================================================================
// DEBATE RUNNER TYPES
// ============================================================================

export interface DebateRound {
  round: number
  messages: DebateMessage[]
  consensusCheck?: ConsensusResult
}

// ============================================================================
// FINAL SYNTHESIS TYPES
// ============================================================================

export interface FinalSynthesisOption {
  option: string
  successRate: number // 0-100
  pros: string[] // Max 3
  cons: string[] // Max 3
  criticalRisks: string[] // Max 3
  implementation: string // Brief description of how to execute
}

export interface FinalSynthesis {
  summary: string // Executive summary (max 200 words)
  top3Options: FinalSynthesisOption[]
  recommendation: {
    option: string
    reasoning: string
    nextSteps: string[]
  }
  debateQuality: {
    convergenceScore: number // 0-100: How well agents converged
    depthScore: number // 0-100: How deeply was the topic analyzed
    diversityScore: number // 0-100: How diverse were perspectives
  }
}

export interface DebateResult {
  sessionId: string
  status: SessionStatus
  rounds: DebateRound[]
  finalRanking: RankedOption[]
  ranking?: RankedOption[] // Alias for finalRanking
  finalSynthesis?: FinalSynthesis // NEW: Executive synthesis (generated at end)
  totalCostUsd: number
  totalCreditsUsed?: number // Credits consumed (formula: costUsd * 1.75 / 0.005)
  costsByProvider?: Record<
    AIProviderType,
    {
      costUsd: number
      creditsUsed: number
      tokensUsed: number
      messagesCount: number
    }
  > // Cost breakdown by AI provider (denormalized for analytics)
  totalRounds: number
  consensusScore: number
  consensus?: number // Alias for consensusScore
  question?: string
  experts?: Array<{ id: string; name: string; role?: string; specializations?: string[] }>
  qualityMetrics?: {
    depth: number
    diversity: number
    originality: number
  }
  interventions?: Array<{
    type: string
    round: number
    prompt: string
  }>
  themeId?: string // Narrative theme used for this debate (e.g., 'greek-mythology', 'education', 'generic')
  themeConfidence?: number // Confidence score of theme selection (0-1)
  error?: string // Error message if status is 'failed'
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const CreateSessionSchema = z.object({
  question: z.string().min(10, 'La pregunta debe tener al menos 10 caracteres'),
  manualContext: z.string().optional(),
  useInternet: z.boolean().default(true),
  useRepo: z.boolean().default(true),
  repoPath: z.string().optional(),
})

export const RankedOptionSchema = z.object({
  option: z.string(),
  successRate: z.number().min(0).max(100),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  supporters: z.array(z.string()),
  confidence: z.number().min(0).max(1),
})

export const ConsensusResultSchema = z.object({
  hasConsensus: z.boolean(),
  consensusScore: z.number().min(0).max(1),
  topOptions: z.array(RankedOptionSchema),
  shouldContinue: z.boolean(),
  reasoning: z.string(),
})
