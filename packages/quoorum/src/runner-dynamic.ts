/**
 * Forum Debate Runner - Dynamic Mode
 *
 * Ejecuta debates multi-agente con sistema dinámico de expertos,
 * quality monitoring y meta-moderación
 */

import { getAIClient } from '@quoorum/ai'
import { quoorumLogger } from './logger'
import { QUOORUM_AGENTS, AGENT_ORDER, estimateAgentCost } from './agents'
import { estimateTokens, getRoleEmoji } from './ultra-language'
import { checkConsensus } from './consensus'
import { analyzeQuestion } from './question-analyzer'
import { matchExperts } from './expert-matcher'
import { analyzeDebateQuality } from './quality-monitor'
import { shouldIntervene, generateIntervention, getInterventionFrequency } from './meta-moderator'
import type {
  DebateMessage,
  DebateRound,
  DebateResult,
  LoadedContext,
  ConsensusResult,
  AgentConfig,
} from './types'
import type { ExpertProfile } from './expert-database'

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_ROUNDS = 20
const MAX_TOKENS_PER_MESSAGE = 50
const COMPLEXITY_THRESHOLD = 5 // Complejidad >= 5 activa modo dinámico
const MAX_AREAS_STATIC = 2 // <= 2 áreas usa modo estático

// ============================================================================
// TYPES
// ============================================================================

export interface RunDebateOptions {
  sessionId: string
  question: string
  context: LoadedContext
  forceMode?: 'static' | 'dynamic' // Forzar modo específico
  onRoundComplete?: (round: DebateRound) => Promise<void>
  onMessageGenerated?: (message: DebateMessage) => Promise<void>
  onQualityCheck?: (quality: { round: number; score: number; issues: string[] }) => Promise<void>
  onIntervention?: (intervention: { round: number; type: string; prompt: string }) => Promise<void>
  onProgress?: (progress: { phase: string; message: string; progress: number; currentRound?: number; totalRounds?: number }) => Promise<void>
}

interface DebateMode {
  mode: 'static' | 'dynamic'
  reason: string
  agents: AgentConfig[]
  agentOrder: string[]
  estimatedRounds: number // Number of rounds estimated based on complexity
}

// ============================================================================
// MAIN RUNNER (HYBRID INTELLIGENT MODE)
// ============================================================================

export async function runDebate(options: RunDebateOptions): Promise<DebateResult> {
  const {
    sessionId,
    question,
    context,
    forceMode,
    onRoundComplete,
    onMessageGenerated,
    onQualityCheck,
    onIntervention,
    onProgress,
  } = options

  try {
    // 1. Determine debate mode (static vs dynamic)
    const debateMode = await determineDebateMode(question, forceMode)
    quoorumLogger.info('Starting debate', { mode: debateMode.mode, sessionId })

    // 2. Run debate with selected mode
    let result: DebateResult

    if (debateMode.mode === 'static') {
      result = await runStaticDebate({
        sessionId,
        question,
        context,
        maxRounds: debateMode.estimatedRounds,
        onRoundComplete,
        onMessageGenerated,
      })
    } else {
      result = await runDynamicDebate({
        sessionId,
        question,
        context,
        agents: debateMode.agents,
        agentOrder: debateMode.agentOrder,
        maxRounds: debateMode.estimatedRounds,
        onRoundComplete,
        onMessageGenerated,
        onQualityCheck,
        onIntervention,
        onProgress,
      })
    }

    quoorumLogger.info('Debate completed', {
      sessionId,
      totalRounds: result.totalRounds,
      totalCostUsd: result.totalCostUsd
    })
    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    quoorumLogger.error('Debate failed', new Error(errorMessage), { sessionId })

    // Return failed result instead of throwing
    return {
      sessionId,
      status: 'failed',
      rounds: [],
      finalRanking: [],
      totalCostUsd: 0,
      totalRounds: 0,
      consensusScore: 0,
      error: errorMessage,
    }
  }
}

// ============================================================================
// ROUND ESTIMATION
// ============================================================================

/**
 * Estimate number of rounds needed based on question complexity
 * Returns a dynamic limit instead of always using MAX_ROUNDS
 */
function estimateRoundsNeeded(complexity: number, areasCount: number): number {
  // Base rounds: 3-5 for simple, 6-10 for moderate, 11-15 for complex
  let baseRounds = 5

  if (complexity <= 3) {
    baseRounds = 3
  } else if (complexity <= 5) {
    baseRounds = 5
  } else if (complexity <= 7) {
    baseRounds = 8
  } else {
    baseRounds = 12
  }

  // Add extra rounds for multi-area questions (max +3)
  const areaBonus = Math.min(areasCount - 1, 3)

  const estimated = baseRounds + areaBonus

  // Clamp between 3 and MAX_ROUNDS
  return Math.max(3, Math.min(estimated, MAX_ROUNDS))
}

// ============================================================================
// MODE DETECTION
// ============================================================================

async function determineDebateMode(
  question: string,
  forceMode?: 'static' | 'dynamic'
): Promise<DebateMode> {
  // Force mode if specified
  if (forceMode === 'static') {
    // Still analyze question to estimate rounds
    const analysis = await analyzeQuestion(question)
    return {
      mode: 'static',
      reason: 'Forced static mode',
      agents: Object.values(QUOORUM_AGENTS),
      agentOrder: AGENT_ORDER,
      estimatedRounds: estimateRoundsNeeded(analysis.complexity, analysis.areas.length),
    }
  }

  if (forceMode === 'dynamic') {
    const analysis = await analyzeQuestion(question)
    const matches = matchExperts(analysis, { minExperts: 5, maxExperts: 7 })
    return {
      mode: 'dynamic',
      reason: 'Forced dynamic mode',
      agents: matches.map((m) => expertToAgentConfig(m.expert)),
      agentOrder: matches.map((m) => m.expert.id),
      estimatedRounds: estimateRoundsNeeded(analysis.complexity, analysis.areas.length),
    }
  }

  // Auto-detect based on question complexity
  const analysis = await analyzeQuestion(question)
  const estimatedRounds = estimateRoundsNeeded(analysis.complexity, analysis.areas.length)

  // Use static mode for simple questions
  if (analysis.complexity < COMPLEXITY_THRESHOLD && analysis.areas.length <= MAX_AREAS_STATIC) {
    return {
      mode: 'static',
      reason: `Simple question (complexity: ${analysis.complexity}, areas: ${analysis.areas.length})`,
      agents: Object.values(QUOORUM_AGENTS),
      agentOrder: AGENT_ORDER,
      estimatedRounds,
    }
  }

  // Use dynamic mode for complex questions
  const matches = matchExperts(analysis, { minExperts: 5, maxExperts: 7 })

  // Fallback to static mode if not enough experts found
  if (matches.length < 4) {
    return {
      mode: 'static',
      reason: `Complex question but insufficient expert matches (${matches.length} < 4), using static agents`,
      agents: Object.values(QUOORUM_AGENTS),
      agentOrder: AGENT_ORDER,
      estimatedRounds,
    }
  }

  return {
    mode: 'dynamic',
    reason: `Complex question (complexity: ${analysis.complexity}, areas: ${analysis.areas.length}, ${matches.length} experts)`,
    agents: matches.map((m) => expertToAgentConfig(m.expert)),
    agentOrder: matches.map((m) => m.expert.id),
    estimatedRounds,
  }
}

function expertToAgentConfig(expert: ExpertProfile): AgentConfig {
  return {
    key: expert.id,
    name: expert.name,
    role: 'analyst', // Default role for dynamic experts
    prompt: expert.systemPrompt,
    provider: 'google', // Using Gemini free tier to avoid quota issues
    model: 'gemini-2.0-flash-exp', // Free tier model
    temperature: expert.temperature,
  }
}

// ============================================================================
// STATIC MODE (Original behavior)
// ============================================================================

async function runStaticDebate(options: {
  sessionId: string
  question: string
  context: LoadedContext
  maxRounds: number
  onRoundComplete?: (round: DebateRound) => Promise<void>
  onMessageGenerated?: (message: DebateMessage) => Promise<void>
}): Promise<DebateResult> {
  const { sessionId, question, context, maxRounds, onRoundComplete, onMessageGenerated } = options

  const rounds: DebateRound[] = []
  let totalCost = 0
  let consensusResult: ConsensusResult | undefined

  const contextPrompt = buildContextPrompt(question, context)

  quoorumLogger.info(`Starting static debate with ${maxRounds} estimated rounds`, { sessionId })

  for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
    const roundMessages: DebateMessage[] = []

    for (const agentKey of AGENT_ORDER) {
      const agent = QUOORUM_AGENTS[agentKey]
      if (!agent) continue

      const prompt = buildAgentPrompt(agent, question, contextPrompt, rounds, roundMessages)

      const message = await generateAgentResponse({
        sessionId,
        round: roundNum,
        agent,
        prompt,
      })

      roundMessages.push(message)
      totalCost += message.costUsd

      if (onMessageGenerated) {
        await onMessageGenerated(message)
      }
    }

    const allMessages = [...rounds.flatMap((r) => r.messages), ...roundMessages]
    consensusResult = await checkConsensus(allMessages, roundNum, maxRounds, question)

    const round: DebateRound = {
      round: roundNum,
      messages: roundMessages,
      consensusCheck: consensusResult,
    }

    rounds.push(round)

    if (onRoundComplete) {
      await onRoundComplete(round)
    }

    if (consensusResult.hasConsensus) {
      break
    }
  }

  return {
    sessionId,
    status: 'completed',
    rounds,
    finalRanking: consensusResult?.topOptions ?? [],
    totalCostUsd: totalCost,
    totalRounds: rounds.length,
    consensusScore: consensusResult?.consensusScore ?? 0,
  }
}

// ============================================================================
// DYNAMIC MODE (With quality monitoring and meta-moderation)
// ============================================================================

async function runDynamicDebate(options: {
  sessionId: string
  question: string
  context: LoadedContext
  agents: AgentConfig[]
  agentOrder: string[]
  maxRounds: number
  onRoundComplete?: (round: DebateRound) => Promise<void>
  onMessageGenerated?: (message: DebateMessage) => Promise<void>
  onQualityCheck?: (quality: { round: number; score: number; issues: string[] }) => Promise<void>
  onIntervention?: (intervention: { round: number; type: string; prompt: string }) => Promise<void>
  onProgress?: (progress: { phase: string; message: string; progress: number; currentRound?: number; totalRounds?: number }) => Promise<void>
}): Promise<DebateResult> {
  const {
    sessionId,
    question,
    context,
    agents,
    agentOrder,
    maxRounds,
    onRoundComplete,
    onMessageGenerated,
    onQualityCheck,
    onIntervention,
    onProgress,
  } = options

  const rounds: DebateRound[] = []
  let totalCost = 0
  let consensusResult: ConsensusResult | undefined
  let interventionFrequency = 5

  let contextPrompt = buildContextPrompt(question, context)
  const agentsMap = new Map(agents.map((a) => [a.key, a]))

  quoorumLogger.info(`Starting dynamic debate with ${maxRounds} estimated rounds`, { sessionId, agentCount: agents.length })

  for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
    // Emit progress event at start of each round (30% to 80% range)
    if (onProgress) {
      const progressPercent = 30 + Math.floor((50 / maxRounds) * roundNum)
      await onProgress({
        phase: 'deliberating',
        message: `Ronda ${roundNum} de deliberación en progreso...`,
        progress: progressPercent,
        currentRound: roundNum,
        totalRounds: maxRounds,
      })
    }

    const roundMessages: DebateMessage[] = []

    // Check if meta-moderator should intervene
    const allMessages = rounds.flatMap((r) => r.messages)
    if (roundNum > 1 && roundNum % interventionFrequency === 0) {
      const quality = analyzeDebateQuality(allMessages)

      if (onQualityCheck) {
        await onQualityCheck({
          round: roundNum,
          score: quality.overallQuality,
          issues: quality.issues.map((i) => i.type),
        })
      }

      if (shouldIntervene(quality)) {
        const intervention = generateIntervention(quality)

        if (onIntervention) {
          await onIntervention({
            round: roundNum,
            type: intervention.type,
            prompt: intervention.prompt,
          })
        }

        // Add intervention as system message to all agents
        contextPrompt += `\n\n${intervention.prompt}`

        // Update intervention frequency based on quality
        interventionFrequency = getInterventionFrequency(quality)
      }
    }

    // Execute round with selected experts
    for (const agentKey of agentOrder) {
      const agent = agentsMap.get(agentKey)
      if (!agent) continue

      const prompt = buildAgentPrompt(agent, question, contextPrompt, rounds, roundMessages)

      const message = await generateAgentResponse({
        sessionId,
        round: roundNum,
        agent,
        prompt,
      })

      roundMessages.push(message)
      totalCost += message.costUsd

      if (onMessageGenerated) {
        await onMessageGenerated(message)
      }
    }

    const allMessagesWithCurrent = [...allMessages, ...roundMessages]
    consensusResult = await checkConsensus(allMessagesWithCurrent, roundNum, maxRounds, question)

    const round: DebateRound = {
      round: roundNum,
      messages: roundMessages,
      consensusCheck: consensusResult,
    }

    rounds.push(round)

    if (onRoundComplete) {
      await onRoundComplete(round)
    }

    if (consensusResult.hasConsensus) {
      break
    }
  }

  return {
    sessionId,
    status: 'completed',
    rounds,
    finalRanking: consensusResult?.topOptions ?? [],
    totalCostUsd: totalCost,
    totalRounds: rounds.length,
    consensusScore: consensusResult?.consensusScore ?? 0,
  }
}

// ============================================================================
// AGENT RESPONSE GENERATION
// ============================================================================

interface GenerateAgentResponseInput {
  sessionId: string
  round: number
  agent: AgentConfig
  prompt: string
}

async function generateAgentResponse(input: GenerateAgentResponseInput): Promise<DebateMessage> {
  const { sessionId, round, agent, prompt } = input

  try {
    const client = getAIClient()

    const response = await client.generate(prompt, {
      modelId: agent.model,
      temperature: agent.temperature,
      maxTokens: MAX_TOKENS_PER_MESSAGE,
    })

    const content = response.text.trim()
    const tokensUsed = response.usage?.totalTokens ?? estimateTokens(content)
    const costUsd = estimateAgentCost(agent, tokensUsed)

    return {
      id: crypto.randomUUID(),
      sessionId,
      round,
      agentKey: agent.key,
      agentName: agent.name,
      content,
      isCompressed: true,
      tokensUsed,
      costUsd,
      modelId: agent.model,
      createdAt: new Date(),
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    quoorumLogger.error(`Agent ${agent.name} failed`, new Error(errorMessage), { sessionId, agentName: agent.name })

    // Return error message as content instead of throwing
    return {
      id: crypto.randomUUID(),
      sessionId,
      round,
      agentKey: agent.key,
      agentName: agent.name,
      content: `[Error: ${errorMessage}]`,
      isCompressed: true,
      tokensUsed: 0,
      costUsd: 0,
      modelId: agent.model,
      createdAt: new Date(),
    }
  }
}

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

function buildContextPrompt(question: string, context: LoadedContext): string {
  const parts: string[] = [`PREGUNTA: ${question}`]

  for (const source of context.sources) {
    parts.push(`\n[${source.type.toUpperCase()}]\n${source.content}`)
  }

  return parts.join('\n')
}

function buildAgentPrompt(
  agent: AgentConfig,
  _question: string,
  contextPrompt: string,
  previousRounds: DebateRound[],
  currentRoundMessages: DebateMessage[]
): string {
  const parts: string[] = []

  // Clear instructions for debate participation
  parts.push(`
INSTRUCCIONES DEL DEBATE:
- Participa de forma concisa pero clara (1-3 oraciones máximo)
- Responde a los argumentos previos de otros agentes
- Presenta tu perspectiva única desde tu rol
- Mantente objetivo y enfocado en responder la pregunta
- Máximo 150 tokens por respuesta
`)

  parts.push(`\nTU ROL: ${agent.name} (${agent.role})`)
  parts.push(agent.prompt)
  parts.push(`\n--- CONTEXTO ---\n${contextPrompt}`)

  if (previousRounds.length > 0) {
    parts.push('\n--- DEBATE PREVIO ---')
    for (const round of previousRounds.slice(-3)) {
      for (const msg of round.messages) {
        parts.push(`R${round.round} ${getRoleEmoji(msg.agentKey)}: ${msg.content}`)
      }
    }
  }

  if (currentRoundMessages.length > 0) {
    parts.push('\n--- ESTA RONDA ---')
    for (const msg of currentRoundMessages) {
      parts.push(`${getRoleEmoji(msg.agentKey)}: ${msg.content}`)
    }
  }

  parts.push('\n--- TU RESPUESTA ---')
  parts.push('Responde de forma concisa y clara (1-3 oraciones):')

  return parts.join('\n')
}
