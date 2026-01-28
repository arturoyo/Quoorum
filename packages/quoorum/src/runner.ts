/**
 * Forum Debate Runner
 *
 * Ejecuta debates multi-agente hasta alcanzar consenso
 */

import { getAIClient, retryWithBackoff } from '@quoorum/ai'
import { QUOORUM_AGENTS, AGENT_ORDER, estimateAgentCost } from './agents'
import { ULTRA_OPTIMIZED_PROMPT, estimateTokens, getRoleEmoji, compressInput, decompressOutput } from './ultra-language'
import { checkConsensus } from './consensus'
import { deductCredits, refundCredits, hasSufficientCredits } from './billing/credit-transactions'
import { convertUsdToCredits } from './analytics/cost'
import { selectTheme, assignDebateIdentities, type AssignedIdentity, type ThemeSelection } from './narrative/theme-engine'
import { determineAgentOrder, getActiveRuleDescription } from './router-engine'
import { generateFinalSynthesis } from './final-synthesis'
import { quoorumLogger } from './logger'
import { buildFourLayerPrompt, extractDepartmentContext } from './prompt-builder'
import type {
  DebateMessage,
  DebateRound,
  DebateResult,
  LoadedContext,
  ConsensusResult,
  AgentConfig,
  FinalSynthesis,
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
  corporateContext?: {
    companyContext?: string // Layer 2: Mission, vision, values
    departmentContexts?: Array<{
      departmentName: string
      departmentContext: string // Layer 3: KPIs, processes, reports
      customPrompt?: string // Layer 4: Personality/style customization
    }>
  }
  onRoundComplete?: (round: DebateRound) => Promise<void>
  onMessageGenerated?: (message: DebateMessage) => Promise<void>
}

export async function runDebate(options: RunDebateOptions): Promise<DebateResult> {
  const { sessionId, userId, question, context, corporateContext, onRoundComplete, onMessageGenerated } = options

  const rounds: DebateRound[] = []
  let totalCost = 0
  let consensusResult: ConsensusResult | undefined

  // ============================================================================
  // THEME SELECTION & IDENTITY ASSIGNMENT
  // ============================================================================

  // Select narrative theme based on question
  const themeSelection = selectTheme(question, context.combinedContext)

  // Assign identities to all agents
  const agentConfigs = AGENT_ORDER.map((agentKey) => {
    const agent = QUOORUM_AGENTS[agentKey]!
    return {
      role: agent.role,
      provider: agent.provider,
      modelId: agent.model,
    }
  })

  const { identities } = assignDebateIdentities(agentConfigs, question, context.combinedContext)

  // Create identity map for easy lookup
  const identityMap = new Map<string, AssignedIdentity>()
  identities.forEach((identity) => {
    const agentKey = AGENT_ORDER.find((key) => QUOORUM_AGENTS[key]?.role === identity.role)
    if (agentKey) {
      identityMap.set(agentKey, identity)
    }
  })

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
      themeId: themeSelection.themeId,
      themeConfidence: themeSelection.confidence,
    }
  }

  // ============================================================================
  // ATOMIC CREDIT DEDUCTION (Pre-charge)
  // ============================================================================

  const deductionResult = await deductCredits(
    userId,
    estimatedCreditsMax,
    sessionId, // Use sessionId as debateId
    'debate_execution',
    `Debate execution - estimated max cost: ${estimatedCreditsMax} credits`
  )
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
      themeId: themeSelection.themeId,
      themeConfidence: themeSelection.confidence,
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

      // ============================================================================
      // DYNAMIC AGENT ORDER (Router Engine)
      // ============================================================================

      // Determine agent order based on previous round's context
      const lastMessage = rounds.length > 0
        ? rounds[rounds.length - 1]?.messages[rounds[rounds.length - 1]!.messages.length - 1]
        : undefined

      const agentOrder = determineAgentOrder(
        lastMessage,
        rounds,
        consensusResult
      )

      const routerDescription = getActiveRuleDescription(lastMessage, rounds, consensusResult)

      quoorumLogger.info(`[Round ${roundNum}] Router strategy`, {
        agentOrder,
        reasoning: routerDescription,
      })

      // Execute round: each agent responds in order (DYNAMIC)
      for (const agentRole of agentOrder) {
        // Find agent by role
        const agentKey = Object.keys(QUOORUM_AGENTS).find(
          key => QUOORUM_AGENTS[key]?.role === agentRole
        )
        if (!agentKey) continue

        const agent = QUOORUM_AGENTS[agentKey]
        if (!agent) continue

        // Get assigned identity for this agent
        const identity = identityMap.get(agentKey)

        // Build prompt with debate history (4-layer system)
        const prompt = buildAgentPrompt(agent, question, contextPrompt, rounds, roundMessages, corporateContext)

        // Generate response with identity
        const message = await generateAgentResponse({
          sessionId,
          round: roundNum,
          agent,
          prompt,
          identity, // Pass narrative identity
        })

        // Skip agent if it failed (null means it was skipped due to quota/balance issues)
        if (!message) {
          quoorumLogger.warn(`Agent ${agentKey} skipped in round ${roundNum}`, { sessionId, round: roundNum })
          continue
        }

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
    // GENERATE FINAL SYNTHESIS (Executive Summary)
    // ============================================================================

    let finalSynthesis: FinalSynthesis | null = null

    try {
      quoorumLogger.info('[Debate] Generating final synthesis...', { sessionId })
      const synthesisResult = await generateFinalSynthesis(sessionId, question, rounds)

      if (synthesisResult) {
        finalSynthesis = synthesisResult.synthesis
        quoorumLogger.info('[Debate] Final synthesis completed', {
          sessionId,
          recommendation: finalSynthesis.recommendation.option,
          quality: finalSynthesis.debateQuality,
        })

        // Create virtual message for synthesis phase (for cost tracking)
        const synthesisMessage: DebateMessage = {
          agentKey: 'synthesis',
          agentName: 'Secretario del Tribunal',
          content: `Síntesis ejecutiva generada: ${finalSynthesis.recommendation.option}`,
          provider: synthesisResult.provider as any,
          model: synthesisResult.model,
          tokensUsed: synthesisResult.tokensUsed,
          costUsd: synthesisResult.costUsd,
          timestamp: new Date(),
          phase: 'synthesis', // Track synthesis phase cost
        }

        // Add synthesis as a virtual round for cost tracking
        rounds.push({
          round: rounds.length + 1,
          messages: [synthesisMessage],
        })
      }
    } catch (error) {
      // Don't fail the whole debate if synthesis fails
      quoorumLogger.error('[Debate] Failed to generate final synthesis', error instanceof Error ? error : new Error(String(error)), { sessionId })
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
      finalSynthesis: finalSynthesis ?? undefined, // NEW: Executive synthesis
      totalCostUsd: totalCost,
      totalCreditsUsed: actualCreditsUsed,
      costsByProvider: calculateCostsByProvider(rounds), // Denormalized analytics
      totalRounds: rounds.length,
      consensusScore: consensusResult?.consensusScore ?? 0,
      themeId: themeSelection.themeId,
      themeConfidence: themeSelection.confidence,
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
        sessionId, // Use sessionId as debateId
        'debate_failed',
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
      themeId: themeSelection.themeId,
      themeConfidence: themeSelection.confidence,
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
  previousRounds: DebateRound[],
  corporateContext?: {
    companyContext?: string
    departmentContexts?: Array<{
      departmentName: string
      departmentContext: string
      customPrompt?: string
    }>
  }
): Promise<DebateRound> {
  const roundMessages: DebateMessage[] = []

  for (const agentKey of AGENT_ORDER) {
    const agent = QUOORUM_AGENTS[agentKey]
    if (!agent) continue

    const prompt = buildAgentPrompt(agent, question, context, previousRounds, roundMessages, corporateContext)

    const message = await generateAgentResponse({
      sessionId,
      round: roundNum,
      agent,
      prompt,
    })

    // Skip null messages (agent failed)
    if (message) {
      roundMessages.push(message)
    }
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
  identity?: AssignedIdentity // Narrative identity for this agent
}

export async function generateAgentResponse(
  input: GenerateAgentResponseInput
): Promise<DebateMessage | null> {
  const { sessionId, round, agent, prompt, identity } = input
  
  try {
    const client = getAIClient()

    // ═══════════════════════════════════════════════════════════
    // INPUT COMPRESSION: Comprimir prompt antes de enviar a IA
    // ═══════════════════════════════════════════════════════════
    const originalTokens = estimateTokens(prompt)
    const compressedPrompt = originalTokens > 200 
      ? await compressInput(prompt) // Solo comprimir si es largo (>200 tokens)
      : prompt

    const compressedTokens = estimateTokens(compressedPrompt)
    const tokensSaved = originalTokens - compressedTokens

    if (tokensSaved > 50) {
      quoorumLogger.debug(`[Compression] Input compressed: ${originalTokens} → ${compressedTokens} tokens (saved ${tokensSaved})`, {
        sessionId,
        agentName: agent.name,
        round,
      })
    }

    // ═══════════════════════════════════════════════════════════
    // RETRY LOGIC: Handle transient errors (network, timeout, etc.)
    // ═══════════════════════════════════════════════════════════
    const response = await retryWithBackoff(
      async () => {
        return await client.generate(compressedPrompt, {
          modelId: agent.model,
          temperature: agent.temperature,
          maxTokens: MAX_TOKENS_PER_MESSAGE,
        })
      },
      {
        maxRetries: 3,
        initialDelay: 1000, // 1s
        maxDelay: 16000, // 16s
        backoffMultiplier: 2,
        jitter: true, // ±25% random variation
        retryableErrors: [
          'ECONNRESET',
          'ETIMEDOUT',
          'ENOTFOUND',
          'ECONNREFUSED',
          'timeout',
          'network',
          'connection',
        ],
      }
    )

    // ═══════════════════════════════════════════════════════════
    // OUTPUT DECOMPRESSION: Descomprimir respuesta para mostrar al usuario
    // ═══════════════════════════════════════════════════════════
    const compressedContent = response.text.trim()
    const expandedContent = await decompressOutput(compressedContent)

    // Calcular tokens usados (usar el comprimido para cálculo de costo)
    const tokensUsed = response.usage?.totalTokens ?? estimateTokens(compressedContent)
    const costUsd = estimateAgentCost(agent, tokensUsed)

    return {
      id: crypto.randomUUID(),
      sessionId,
      round,
      agentKey: agent.key,
      agentName: identity?.displayNameUser ?? agent.name, // Use narrative name or fallback to technical name
      narrativeId: identity?.characterId, // Character ID for UI (e.g., 'atenea', 'arturo')
      content: expandedContent, // Mostrar versión expandida al usuario
      compressedContent, // Guardar versión comprimida para análisis
      isCompressed: true,
      tokensUsed,
      costUsd,
      provider: agent.provider, // Denormalized for analytics
      modelId: agent.model, // Denormalized for analytics
      createdAt: new Date(),
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Check if it's a quota/balance error - AI client already tried all fallbacks
    const isQuotaError = 
      errorMessage.includes("quota") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("429") ||
      errorMessage.includes("insufficient balance") ||
      errorMessage.includes("Insufficient Balance") ||
      errorMessage.includes("insufficient funds") ||
      errorMessage.includes("balance") ||
      errorMessage.includes("All AI providers failed");

    if (isQuotaError) {
      // Silently skip this agent - don't add it to the round
      quoorumLogger.warn(`Agent ${agent.name} skipped due to quota/balance issues (all fallbacks exhausted)`, {
        sessionId,
        agentName: agent.name,
        provider: agent.provider,
        model: agent.model,
      })
      return null // Return null to indicate agent should be skipped
    }

    // For non-quota errors, log but still skip to avoid breaking debate flow
    quoorumLogger.error(`Agent ${agent.name} failed with non-quota error`, new Error(errorMessage), {
      sessionId,
      agentName: agent.name,
      provider: agent.provider,
      model: agent.model,
    })
    
    return null // Skip agent to avoid showing error messages to user
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
  currentRoundMessages: DebateMessage[],
  corporateContext?: {
    companyContext?: string
    departmentContexts?: Array<{
      departmentName: string
      departmentContext: string
      customPrompt?: string
    }>
  }
): string {
  const parts: string[] = []

  // System prompt for ultra-optimization
  parts.push(ULTRA_OPTIMIZED_PROMPT)

  // ============================================================================
  // 4-LAYER PROMPT SYSTEM
  // ============================================================================
  // Extract department context for this agent
  const deptContext = extractDepartmentContext(corporateContext?.departmentContexts)

  // Build 4-layer prompt (Layer 1-4)
  const fourLayerPrompt = buildFourLayerPrompt(agent, {
    companyContext: corporateContext?.companyContext,
    departmentContext: deptContext.departmentContext,
    customPrompt: deptContext.customPrompt,
  })

  parts.push(fourLayerPrompt)

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
