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
  content: string
  isCompressed: boolean
  tokensUsed: number
  costUsd: number
  createdAt: Date
  translation?: string
  expert?: string // Expert ID for dynamic mode
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

export interface DebateResult {
  sessionId: string
  status: SessionStatus
  rounds: DebateRound[]
  finalRanking: RankedOption[]
  ranking?: RankedOption[] // Alias for finalRanking
  totalCostUsd: number
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
