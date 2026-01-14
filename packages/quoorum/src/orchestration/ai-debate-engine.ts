/**
 * AI Debate Engine - Real LLM-powered debate execution
 *
 * CONSOLIDATION NOTE:
 * This engine now uses runner-dynamic.ts as the single source of truth for debates.
 * The core runner integrates:
 *   - expert-matcher.ts (expert selection)
 *   - quality-monitor.ts (quality monitoring)
 *   - meta-moderator.ts (interventions)
 *   - learning-system.ts (performance tracking)
 *
 * Special modes (Devil's Advocate, Pre-Mortem, Gut Check) remain unique to this engine.
 */

import type {
  AIProvider, GenerateOptions, DebateContext, DebaterPersona,
  SubDebate, AISubDebateResult, DevilsAdvocateResult, PreMortemResult, GutCheckResult,
} from './ai-debate-types'
import { DEFAULT_PERSONAS } from './ai-debate-types'
import {
  DEVILS_ADVOCATE_SYSTEM,
  PRE_MORTEM_SYSTEM, GUT_CHECK_SYSTEM,
  buildDevilsAdvocatePrompt,
  buildPreMortemPrompt, buildGutCheckPrompt,
} from './ai-debate-prompts'
import { MockAIProvider } from './ai-mock-provider'

// Import core runner as single source of truth
import { runDebate as runDynamicDebate, type RunDebateOptions } from '../runner-dynamic'
import type { DebateResult, LoadedContext } from '../types'

// Re-export types and utilities for convenience
export type { AIProvider, GenerateOptions, DebateContext, DebaterPersona }
export type { DevilsAdvocateResult, PreMortemResult, GutCheckResult }
export { DEFAULT_PERSONAS, MockAIProvider }

// ============================================================================
// ADAPTER: Convert DebateResult (core) to AISubDebateResult (orchestration)
// ============================================================================

function adaptDebateResult(result: DebateResult, originalQuestion: string): AISubDebateResult {
  // Extract conclusion from final ranking
  const topOption = result.finalRanking?.[0]
  const conclusion = topOption
    ? `${topOption.option} (${Math.round(topOption.successRate)}% confianza): ${topOption.reasoning || topOption.pros.join(', ')}`
    : 'Debate completado sin consenso claro'

  // Convert experts to arguments format
  const args = result.experts?.map(expert => ({
    persona: expert.name,
    position: `Rol: ${expert.role || 'experto'}. Especialidades: ${expert.specializations?.join(', ') || 'general'}`,
  })) || []

  return {
    id: result.sessionId,
    question: result.question || originalQuestion,
    status: result.status === 'completed' ? 'completed' : result.status === 'failed' ? 'failed' : 'running',
    conclusion,
    confidence: result.consensusScore || 0,
    arguments: args,
    metadata: {
      totalRounds: result.totalRounds,
      totalCostUsd: result.totalCostUsd,
      consensusScore: result.consensusScore,
      qualityMetrics: result.qualityMetrics,
      interventions: result.interventions,
      finalRanking: result.finalRanking,
      experts: result.experts,
    },
  }
}

// ============================================================================
// AI DEBATE ENGINE
// ============================================================================

export class AIDebateEngine {
  private provider: AIProvider
  private personas: Record<string, DebaterPersona>

  constructor(provider: AIProvider, customPersonas?: Record<string, DebaterPersona>) {
    this.provider = provider
    this.personas = { ...DEFAULT_PERSONAS, ...customPersonas }
  }

  /**
   * Execute a single debate using the CORE runner-dynamic.ts
   *
   * This method now delegates to the core runner which integrates:
   * - Expert matching (expert-matcher.ts)
   * - Quality monitoring (quality-monitor.ts)
   * - Meta-moderation (meta-moderator.ts)
   * - Learning system (learning-system.ts)
   */
  async executeDebate(
    debate: SubDebate,
    context: DebateContext,
    _personaIds: string[] = ['optimist', 'pessimist', 'pragmatist']
  ): Promise<AISubDebateResult> {
    // Convert context to LoadedContext format
    const loadedContext: LoadedContext = {
      sources: [],
      combinedContext: [
        context.originalQuestion,
        context.companyContext || '',
        context.previousDebates?.map(d => d.topOption || '').join('\n') || '',
        context.userPreference || '',
      ].filter(Boolean).join('\n\n'),
    }

    // Prepare runner options
    const runnerOptions: RunDebateOptions = {
      sessionId: debate.id,
      question: debate.question,
      context: loadedContext,
      forceMode: 'dynamic', // Always use dynamic mode for full feature set
    }

    try {
      // Execute using the CORE runner (single source of truth)
      const result = await runDynamicDebate(runnerOptions)

      // Adapt result to orchestration format
      return adaptDebateResult(result, debate.question)
    } catch (error) {
      // Return failed result on error
      return {
        id: debate.id,
        question: debate.question,
        status: 'failed',
        conclusion: `Error en debate: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        arguments: [],
        metadata: { error: String(error) },
      }
    }
  }

  /**
   * Execute Devil's Advocate mode
   * UNIQUE FEATURE - Not duplicated in core runner
   */
  async executeDevilsAdvocate(
    question: string, userPreference: string, context: DebateContext
  ): Promise<DevilsAdvocateResult> {
    const prompt = buildDevilsAdvocatePrompt(question, userPreference, context)
    const response = await this.provider.generateResponse(prompt, {
      systemPrompt: DEVILS_ADVOCATE_SYSTEM, temperature: 0.7, maxTokens: 1500,
    })

    return {
      userPreference, counterArguments: response,
      shouldReconsider: response.toLowerCase().includes('error') || response.toLowerCase().includes('riesgo alto'),
    }
  }

  /**
   * Execute Pre-Mortem analysis
   * UNIQUE FEATURE - Not duplicated in core runner
   */
  async executePreMortem(question: string, context: DebateContext): Promise<PreMortemResult> {
    const prompt = buildPreMortemPrompt(question, context)
    const response = await this.provider.generateResponse(prompt, {
      systemPrompt: PRE_MORTEM_SYSTEM, temperature: 0.6, maxTokens: 1500,
    })

    return { question, failureAnalysis: response, preventionActions: this.extractPreventionActions(response) }
  }

  /**
   * Execute Gut Check (30-second version)
   * UNIQUE FEATURE - Not duplicated in core runner
   */
  async executeGutCheck(question: string): Promise<GutCheckResult> {
    const prompt = buildGutCheckPrompt(question)
    const response = await this.provider.generateResponse(prompt, {
      systemPrompt: GUT_CHECK_SYSTEM, temperature: 0.5, maxTokens: 150,
    })

    const lines = response.split('\n').filter(l => l.trim())
    return { instinct: lines[0] || response, reasoning: lines[1] || '', keyQuestion: lines[2] || '', fullResponse: response }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private extractPreventionActions(analysis: string): string[] {
    const section = analysis.match(/prevención[:\s]*([\s\S]*?)(?=\n\n|\n#|$)/i)
    const content = section?.[1]
    if (content) {
      return content.split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
        .map(line => line.replace(/^[-\d.)\s]+/, '').trim())
        .slice(0, 5)
    }
    return ['Revisar supuestos clave', 'Establecer checkpoints de validación']
  }

  getPersonas(): DebaterPersona[] { return Object.values(this.personas) }
  addPersona(persona: DebaterPersona): void { this.personas[persona.id] = persona }  // eslint-disable-line security/detect-object-injection
}

// ============================================================================
// FACTORY
// ============================================================================

export function createDebateEngine(provider: AIProvider): AIDebateEngine {
  return new AIDebateEngine(provider)
}

export function createMockDebateEngine(): AIDebateEngine {
  return new AIDebateEngine(new MockAIProvider())
}
