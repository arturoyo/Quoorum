/**
 * AI Debate Types - Type definitions for the debate engine
 */

import type { SubDebate, SubDebateResult } from './types'

// ============================================================================
// AI PROVIDER INTERFACE
// ============================================================================

export interface AIProvider {
  generateResponse(prompt: string, options?: GenerateOptions): Promise<string>
}

export interface GenerateOptions {
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

// ============================================================================
// DEBATE CONTEXT
// ============================================================================

export interface DebateContext {
  originalQuestion: string
  companyContext?: string
  previousDebates?: SubDebateResult[]
  userPreference?: string
}

// ============================================================================
// DEBATER PERSONAS
// ============================================================================

export interface DebaterPersona {
  id: string
  name: string
  role: string
  perspective: string
  style: 'analytical' | 'creative' | 'conservative' | 'aggressive' | 'balanced'
  biases: string[]
}

export const DEFAULT_PERSONAS: Record<string, DebaterPersona> = {
  optimist: {
    id: 'optimist', name: 'El Optimista', role: 'Defensor',
    perspective: 'Ve oportunidades y potencial en cada opción',
    style: 'creative', biases: ['confirmation_bias', 'overconfidence'],
  },
  pessimist: {
    id: 'pessimist', name: 'El Escéptico', role: 'Crítico',
    perspective: 'Identifica riesgos, problemas y obstáculos',
    style: 'conservative', biases: ['loss_aversion', 'negativity_bias'],
  },
  pragmatist: {
    id: 'pragmatist', name: 'El Pragmático', role: 'Moderador',
    perspective: 'Busca el equilibrio entre riesgo y oportunidad',
    style: 'balanced', biases: ['status_quo_bias'],
  },
  innovator: {
    id: 'innovator', name: 'El Innovador', role: 'Disruptor',
    perspective: 'Propone alternativas no consideradas',
    style: 'creative', biases: ['novelty_bias'],
  },
  analyst: {
    id: 'analyst', name: 'El Analista', role: 'Data-driven',
    perspective: 'Se enfoca en datos, métricas y evidencia',
    style: 'analytical', biases: ['analysis_paralysis'],
  },
}

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface DevilsAdvocateResult {
  userPreference: string
  counterArguments: string
  shouldReconsider: boolean
}

export interface PreMortemResult {
  question: string
  failureAnalysis: string
  preventionActions: string[]
}

export interface GutCheckResult {
  instinct: string
  reasoning: string
  keyQuestion: string
  fullResponse: string
}

export interface SynthesisResult {
  conclusion: string
  consensus: string[]
  dissent: string[]
  confidence: number
  nextStep: string
}

export interface DebateResponse {
  persona: DebaterPersona
  response: string
}

// Extended SubDebateResult for AI debate engine with more detail
export interface AISubDebateResult {
  id: string
  question: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  conclusion?: string
  confidence: number
  arguments?: Array<{ persona: string; position: string }>
  metadata?: Record<string, unknown>
}

// Re-export for convenience
export type { SubDebate, SubDebateResult }
