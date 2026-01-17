/**
 * Forum Debate Runner
 *
 * Ejecuta debates multi-agente hasta alcanzar consenso
 */

import { getAIClient } from '@quoorum/ai'
import { QUOORUM_AGENTS, AGENT_ORDER, estimateAgentCost } from './agents'
import { ULTRA_OPTIMIZED_PROMPT, estimateTokens, getRoleEmoji } from './ultra-language'
import { checkConsensus } from './consensus'
import { deductCredits, refundCredits, hasSufficientCredits } from './billing/credit-transactions'
import { convertUsdToCredits } from './analytics/cost'
import type {
  DebateMessage,
  DebateRound,
  DebateResult,
  LoadedContext,
  ConsensusResult,
  AgentConfig,
} from './types'

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_ROUNDS = 20
const MAX_TOKENS_PER_MESSAGE = 50 // Ultra-optimized messages should be ~15 tokens

// ============================================================================
// MAIN RUNNER
// ============================================================================

export interface RunDebateOptions {
  sessionId: string
  userId: string // Required for credit deduction
  question: string
  context: LoadedContext
  onRoundComplete?: (round: DebateRound) => Promise<void>
  onMessageGenerated?: (message: DebateMessage) => Promise<void>
}

export async function runDebate(options: RunDebateOptions): Promise<DebateResult> {
  const { sessionId, userId, question, context, onRoundComplete, onMessageGenerated } = options

  const rounds: DebateRound[] = []
  let totalCost = 0
  let consensusResult: ConsensusResult | undefined

  // ============================================================================
  // CREDIT PRE-FLIGHT CHECK
  // ============================================================================

  // Estimate max credits needed (worst case: MAX_ROUNDS * 4 agents * ~$0.02 per message)
  // Average debate: 5 rounds * 4 agents * 500 tokens * $0.0001/token = $0.10 = 35 credits
  // Conservative estimate: 20 rounds max = $0.40 = 140 credits
  const estimatedCreditsMax = 140

  // Check if user has sufficient balance
  const hasSufficientBalance = await hasSufficientCredits(userId, estimatedCreditsMax)
  if (!hasSufficientBalance) {
    return {
      sessionId,
      status: 'failed',
      error: 'Insufficient credits',
      rounds: [],
      finalRanking: [],
      totalCostUsd: 0,
      totalCreditsUsed: 0,
      costsByProvider: undefined,
      totalRounds: 0,
      consensusScore: 0,
    }
  }

  // ============================================================================
  // ATOMIC CREDIT DEDUCTION (Pre-charge)
  // ============================================================================

  const deductionResult = await deductCredits(userId, estimatedCreditsMax)
  if (!deductionResult.success) {
    return {
      sessionId,
      status: 'failed',
      error: deductionResult.error ?? 'Failed to deduct credits',
      rounds: [],
      finalRanking: [],
      totalCostUsd: 0,
      totalCreditsUsed: 0,
      costsByProvider: undefined,
      totalRounds: 0,
      consensusScore: 0,
    }
  }

  // Credits successfully deducted - proceed with debate
  let refundIssued = false

  try {
    // Build initial context prompt
    const contextPrompt = buildContextPrompt(question, context)

    // Run rounds until consensus or max rounds
    for (let roundNum = 1; roundNum <= MAX_ROUNDS; roundNum++) {
      const roundMessages: DebateMessage[] = []

      // Execute round: each agent responds in order
      for (const agentKey of AGENT_ORDER) {
        const agent = QUOORUM_AGENTS[agentKey]
        if (!agent) continue

        // Build prompt with debate history
        const prompt = buildAgentPrompt(agent, question, contextPrompt, rounds, roundMessages)

        // Generate response
        const message = await generateAgentResponse({
          sessionId,
          round: roundNum,
          agent,
          prompt,
        })

        roundMessages.push(message)
        totalCost += message.costUsd

        // Callback for real-time updates
        if (onMessageGenerated) {
          await onMessageGenerated(message)
        }
      }

      // Check consensus after synthesizer responds
      const allMessages = [...rounds.flatMap((r) => r.messages), ...roundMessages]
      consensusResult = await checkConsensus(allMessages, roundNum, MAX_ROUNDS, question)

      const round: DebateRound = {
        round: roundNum,
        messages: roundMessages,
        consensusCheck: consensusResult,
      }

      rounds.push(round)

      // Callback for round completion
      if (onRoundComplete) {
        await onRoundComplete(round)
      }

      // Stop if consensus reached
      if (consensusResult.hasConsensus) {
        break
      }
    }

    // ============================================================================
    // CALCULATE ACTUAL CREDITS USED & REFUND DIFFERENCE
    // ============================================================================

    const actualCreditsUsed = convertUsdToCredits(totalCost)
    const creditsToRefund = estimatedCreditsMax - actualCreditsUsed

    if (creditsToRefund > 0) {
      const refundResult = await refundCredits(
        userId,
        creditsToRefund,
        sessionId,
        'Refund unused credits after debate completion'
      )
      refundIssued = refundResult.success
    }

    return {
      sessionId,
      status: 'completed',
      rounds,
      finalRanking: consensusResult?.topOptions ?? [],
      totalCostUsd: totalCost,
      totalCreditsUsed: actualCreditsUsed,
      costsByProvider: calculateCostsByProvider(rounds), // Denormalized analytics
      totalRounds: rounds.length,
      consensusScore: consensusResult?.consensusScore ?? 0,
    }
  } catch (error) {
    // ============================================================================
    // ROLLBACK: Refund all credits if debate fails mid-execution
    // ============================================================================

    if (!refundIssued) {
      const actualCreditsUsed = totalCost > 0 ? convertUsdToCredits(totalCost) : 0
      const creditsToRefund = estimatedCreditsMax - actualCreditsUsed

      await refundCredits(
        userId,
        creditsToRefund,
        sessionId,
        `Debate failed mid-execution: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    return {
      sessionId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error during debate',
      rounds,
      finalRanking: [],
      totalCostUsd: totalCost,
      totalCreditsUsed: convertUsdToCredits(totalCost),
      costsByProvider: rounds.length > 0 ? calculateCostsByProvider(rounds) : undefined,
      totalRounds: rounds.length,
      consensusScore: 0,
    }
  }
}

// ============================================================================
// SINGLE ROUND EXECUTION
// ============================================================================

export async function executeRound(
  sessionId: string,
  roundNum: number,
  question: string,
  context: string,
  previousRounds: DebateRound[]
): Promise<DebateRound> {
  const roundMessages: DebateMessage[] = []

  for (const agentKey of AGENT_ORDER) {
    const agent = QUOORUM_AGENTS[agentKey]
    if (!agent) continue

    const prompt = buildAgentPrompt(agent, question, context, previousRounds, roundMessages)

    const message = await generateAgentResponse({
      sessionId,
      round: roundNum,
      agent,
      prompt,
    })

    roundMessages.push(message)
  }

  return {
    round: roundNum,
    messages: roundMessages,
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

export async function generateAgentResponse(
  input: GenerateAgentResponseInput
): Promise<DebateMessage> {
  const { sessionId, round, agent, prompt } = input
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
    provider: agent.provider, // Denormalized for analytics
    modelId: agent.model, // Denormalized for analytics
    createdAt: new Date(),
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
  _question: string, // Included in contextPrompt already
  contextPrompt: string,
  previousRounds: DebateRound[],
  currentRoundMessages: DebateMessage[]
): string {
  const parts: string[] = []

  // System prompt for ultra-optimization
  parts.push(ULTRA_OPTIMIZED_PROMPT)

  // Agent role
  parts.push(`\nTU ROL: ${agent.name} (${agent.role})`)
  parts.push(agent.prompt)

  // Context
  parts.push(`\n--- CONTEXTO ---\n${contextPrompt}`)

  // Previous rounds summary (compressed)
  if (previousRounds.length > 0) {
    parts.push('\n--- DEBATE PREVIO ---')
    for (const round of previousRounds.slice(-3)) {
      // Only last 3 rounds
      for (const msg of round.messages) {
        parts.push(`R${round.round} ${getRoleEmoji(msg.agentKey)}: ${msg.content}`)
      }
    }
  }

  // Current round messages
  if (currentRoundMessages.length > 0) {
    parts.push('\n--- ESTA RONDA ---')
    for (const msg of currentRoundMessages) {
      parts.push(`${getRoleEmoji(msg.agentKey)}: ${msg.content}`)
    }
  }

  // Final instruction
  parts.push('\n--- TU RESPUESTA (max 15 tokens, ultra-comprimida) ---')

  return parts.join('\n')
}

// ============================================================================
// ANALYTICS HELPERS
// ============================================================================

/**
 * Calculate cost breakdown by AI provider
 * Aggregates costs, tokens, and message counts per provider
 */
function calculateCostsByProvider(
  rounds: DebateRound[]
): Record<
  string,
  {
    costUsd: number
    creditsUsed: number
    tokensUsed: number
    messagesCount: number
  }
> {
  const breakdown: Record<
    string,
    {
      costUsd: number
      creditsUsed: number
      tokensUsed: number
      messagesCount: number
    }
  > = {}

  for (const round of rounds) {
    for (const message of round.messages) {
      const provider = message.provider ?? 'unknown'

      if (!breakdown[provider]) {
        breakdown[provider] = {
          costUsd: 0,
          creditsUsed: 0,
          tokensUsed: 0,
          messagesCount: 0,
        }
      }

      breakdown[provider]!.costUsd += message.costUsd
      breakdown[provider]!.tokensUsed += message.tokensUsed
      breakdown[provider]!.messagesCount += 1
    }
  }

  // Calculate credits for each provider
  for (const provider in breakdown) {
    const data = breakdown[provider]
    if (data) {
      data.creditsUsed = convertUsdToCredits(data.costUsd)
    }
  }

  return breakdown
}
