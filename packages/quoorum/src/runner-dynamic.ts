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

// ============================================================================
// CORPORATE INTELLIGENCE TYPES
// ============================================================================

export interface CorporateContext {
  companyContext?: string // Layer 2: Mission, vision, values
  departmentContexts?: Array<{
    departmentName: string
    departmentContext: string // Layer 3: KPIs, processes, reports
    customPrompt?: string // Layer 4: Personality/style customization
  }>
  contextSummary?: string // Optional pre-formatted context for AI prompts
}

export interface RunDebateOptions {
  sessionId: string
  question: string
  context: LoadedContext
  corporateContext?: CorporateContext // NEW: Corporate Intelligence (4 layers)
  forceMode?: 'static' | 'dynamic' // Forzar modo específico
  executionStrategy?: 'sequential' | 'parallel' // Estrategia de ejecución de agentes dentro de una ronda
  selectedExpertIds?: string[] // IDs de expertos personalizados seleccionados por el usuario
  selectedDepartmentIds?: string[] // NEW: IDs de departamentos corporativos seleccionados
  onRoundComplete?: (round: DebateRound) => Promise<void>
  onMessageGenerated?: (message: DebateMessage) => Promise<void>
  onQualityCheck?: (quality: { round: number; score: number; issues: string[] }) => Promise<void>
  onIntervention?: (intervention: { round: number; type: string; prompt: string }) => Promise<void>
  onProgress?: (progress: { phase: string; message: string; progress: number; currentRound?: number; totalRounds?: number }) => Promise<void>
  // Callbacks to check debate state (paused, forceConsensus, additional context)
  checkDebateState?: () => Promise<{
    isPaused?: boolean
    forceConsensus?: boolean
    additionalContext?: string[]
  }>
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
    const debateMode = await determineDebateMode(
      question,
      forceMode,
      options.selectedExpertIds,
      options.selectedDepartmentIds
    )
    quoorumLogger.info('🎯 Debate Mode Determined', {
      mode: debateMode.mode,
      estimatedRounds: debateMode.estimatedRounds,
      reason: debateMode.reason,
      agentCount: debateMode.agents.length,
      sessionId
    })

    // 2. Run debate with selected mode
    // Note: Now all debates use dynamic mode structure (combines core agents + experts)
    const result = await runDynamicDebate({
      sessionId,
      question,
      context,
      corporateContext: options.corporateContext,
      agents: debateMode.agents,
      agentOrder: debateMode.agentOrder,
      maxRounds: debateMode.estimatedRounds,
      executionStrategy: options.executionStrategy || 'sequential', // Default to sequential (debate behavior)
      onRoundComplete,
      onMessageGenerated,
      onQualityCheck,
      onIntervention,
      onProgress,
      checkDebateState: options.checkDebateState,
    })

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
  forceMode?: 'static' | 'dynamic',
  selectedExpertIds?: string[],
  selectedDepartmentIds?: string[]
): Promise<DebateMode> {
  // Always analyze question to get expert matches
  const analysis = await analyzeQuestion(question)
  const estimatedRounds = estimateRoundsNeeded(analysis.complexity, analysis.areas.length)

  // If user selected custom experts or departments, use those instead of automatic matching
  let expertMatches: Array<{ expert: ExpertProfile; score: number; reasons: string[]; suggestedRole: 'primary' | 'secondary' | 'critic' }> = []

  // Load corporate departments if selected
  if (selectedDepartmentIds && selectedDepartmentIds.length > 0) {
    try {
      const { db } = await import('@quoorum/db')
      const { departments } = await import('@quoorum/db/schema')
      const { inArray } = await import('drizzle-orm')

      const selectedDepartments = await db
        .select()
        .from(departments)
        .where(inArray(departments.id, selectedDepartmentIds))

      // Convert departments to ExpertProfile format (with Layer 4 customization)
      expertMatches = selectedDepartments.map((dept) => {
        // Combine basePrompt + customPrompt (Layer 4)
        const finalPrompt = dept.customPrompt
          ? `${dept.basePrompt}\n\n[ESTILO PERSONALIZADO]\n${dept.customPrompt}`
          : dept.basePrompt

        const expertProfile: ExpertProfile = {
          id: dept.id,
          name: dept.name,
          title: dept.name,
          expertise: [dept.type], // Use department type as expertise area
          topics: [],
          perspective: dept.description || dept.departmentContext.substring(0, 200),
          systemPrompt: finalPrompt, // Layer 1 (Technical) + Layer 4 (Personality)
          temperature: parseFloat(dept.temperature || '0.7'),
          provider: 'google', // Default provider for departments
          modelId: 'gemini-2.0-flash-exp',
        }

        return {
          expert: expertProfile,
          score: 100, // High score for user-selected departments
          reasons: ['Departamento corporativo seleccionado'],
          suggestedRole: dept.agentRole as 'primary' | 'secondary' | 'critic' || 'primary',
        }
      })

      quoorumLogger.info('Loaded corporate departments', {
        departmentIds: selectedDepartmentIds,
        departmentCount: selectedDepartments.length,
      })
    } catch (error) {
      quoorumLogger.warn('Failed to load corporate departments, falling back to automatic matching', {
        error: error instanceof Error ? error.message : String(error),
        selectedDepartmentIds,
      })
    }
  }

  // Load custom experts if selected (and no departments were selected, or as addition)
  if (selectedExpertIds && selectedExpertIds.length > 0) {
    // Load custom experts from database
    // NOTE: This requires DB access, so we'll need to pass a callback or load them in the API layer
    // For now, we'll load them here but this might need to be refactored
    try {
      const { db } = await import('@quoorum/db')
      const { experts } = await import('@quoorum/db/schema')
      const { inArray } = await import('drizzle-orm')

      const customExperts = await db
        .select()
        .from(experts)
        .where(inArray(experts.id, selectedExpertIds))

      // Convert DB experts to ExpertProfile format
      expertMatches = customExperts.map((expert) => {
        // Parse expertise: can be comma-separated string or single string
        const expertiseList = expert.expertise
          ? (expert.expertise.includes(',') ? expert.expertise.split(',').map(e => e.trim()) : [expert.expertise])
          : []

        const expertProfile: ExpertProfile = {
          id: expert.id,
          name: expert.name,
          title: expert.expertise || expert.name,
          expertise: expertiseList,
          topics: [],
          perspective: expert.description || expert.expertise || '',
          systemPrompt: expert.systemPrompt,
          temperature: expert.aiConfig.temperature ?? 0.7,
          // Cast provider to ExpertProfile type (groq not supported in ExpertProfile yet)
          provider: (expert.aiConfig.provider === 'groq' ? 'google' : expert.aiConfig.provider) as ExpertProfile['provider'],
          modelId: expert.aiConfig.model,
        }

        return {
          expert: expertProfile,
          score: 100, // High score for user-selected experts
          reasons: ['Seleccionado por el usuario'],
          suggestedRole: 'primary' as const,
        }
      })
    } catch (error) {
      quoorumLogger.warn('Failed to load custom experts, falling back to automatic matching', {
        error: error instanceof Error ? error.message : String(error),
        selectedExpertIds,
      })
      // Fall back to automatic matching on error
    }
  }

  // If no custom experts selected or loading failed, use automatic matching
  if (expertMatches.length === 0) {
    // Get expert matches (try to get 3-5 top experts)
    // Note: forceMode is ignored now - we always combine core agents + experts
    expertMatches = matchExperts(analysis, { 
      minExperts: 0, // Don't require minimum - we always have the 4 core agents
      maxExperts: 5, // Limit to 5 to avoid too many agents per round
      minScore: 30, // Only include experts with decent match score
      alwaysIncludeCritic: false, // We already have core critic agent
    })
  }

  // Combine: Always include 4 core agents + add relevant experts
  // Order: Optimista → Expertos especializados → Crítico → Analista → Sintetizador
  const expertAgents = expertMatches
    .slice(0, 5) // Limit to top 5 experts
    .map((m) => expertToAgentConfig(m.expert))

  // Combine agents: core + experts
  // We'll place experts between optimizer and critic to give them early voice
  const combinedAgents: AgentConfig[] = []
  const combinedOrder: string[] = []

  // Start with Optimista (fixed)
  combinedAgents.push(QUOORUM_AGENTS.optimizer)
  combinedOrder.push('optimizer')

  // Add expert specialists (inserted after optimizer)
  expertAgents.forEach((expertAgent) => {
    // Avoid duplicates (e.g., if "critic" expert matches, skip it as we have core critic)
    const isDuplicate = ['optimizer', 'critic', 'analyst', 'synthesizer'].includes(expertAgent.key)
    if (!isDuplicate) {
      combinedAgents.push(expertAgent)
      combinedOrder.push(expertAgent.key)
    }
  })

  // Continue with core agents (skip optimizer as we already added it)
  combinedAgents.push(QUOORUM_AGENTS.critic)
  combinedOrder.push('critic')

  combinedAgents.push(QUOORUM_AGENTS.analyst)
  combinedOrder.push('analyst')

  // Always end with Synthesizer (fixed at the end)
  combinedAgents.push(QUOORUM_AGENTS.synthesizer)
  combinedOrder.push('synthesizer')

  const totalAgents = combinedAgents.length
  const expertCount = expertAgents.filter(a => !['optimizer', 'critic', 'analyst', 'synthesizer'].includes(a.key)).length

  return {
    mode: 'dynamic', // Always use dynamic mode structure now (combines core + experts)
    reason: `Hybrid mode: ${totalAgents} agents (4 core + ${expertCount} specialists). Complexity: ${analysis.complexity}, areas: ${analysis.areas.length}`,
    agents: combinedAgents,
    agentOrder: combinedOrder,
    estimatedRounds,
  }
}

function expertToAgentConfig(expert: ExpertProfile): AgentConfig {
  return {
    key: expert.id,
    name: expert.name,
    role: 'analyst', // Default role for dynamic experts
    prompt: expert.systemPrompt,
    provider: expert.provider, // Use expert's configured provider
    model: expert.modelId, // Use expert's configured model
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
  corporateContext?: CorporateContext
  maxRounds: number
  onRoundComplete?: (round: DebateRound) => Promise<void>
  onMessageGenerated?: (message: DebateMessage) => Promise<void>
}): Promise<DebateResult> {
  const { sessionId, question, context, corporateContext, maxRounds, onRoundComplete, onMessageGenerated } = options

  const rounds: DebateRound[] = []
  let totalCost = 0
  let consensusResult: ConsensusResult | undefined

  const contextPrompt = buildContextPrompt(question, context, corporateContext)

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

      // Skip agent if it failed (null means it was skipped due to quota/balance issues)
      if (!message) {
        quoorumLogger.warn(`Agent ${agentKey} skipped in round ${roundNum} (static mode)`, { sessionId, round: roundNum })
        continue
      }

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
  corporateContext?: CorporateContext
  agents: AgentConfig[]
  agentOrder: string[]
  maxRounds: number
  executionStrategy?: 'sequential' | 'parallel' // Estrategia de ejecución dentro de una ronda
  onRoundComplete?: (round: DebateRound) => Promise<void>
  onMessageGenerated?: (message: DebateMessage) => Promise<void>
  onQualityCheck?: (quality: { round: number; score: number; issues: string[] }) => Promise<void>
  onIntervention?: (intervention: { round: number; type: string; prompt: string }) => Promise<void>
  onProgress?: (progress: { phase: string; message: string; progress: number; currentRound?: number; totalRounds?: number }) => Promise<void>
  checkDebateState?: () => Promise<{ isPaused?: boolean; forceConsensus?: boolean; additionalContext?: string[] }>
}): Promise<DebateResult> {
  const {
    sessionId,
    question,
    context,
    corporateContext,
    agents,
    agentOrder,
    maxRounds,
    executionStrategy = 'sequential', // Default: debate behavior (agents see each other's responses)
    onRoundComplete,
    onMessageGenerated,
    onQualityCheck,
    onIntervention,
    onProgress,
    checkDebateState,
  } = options

  const rounds: DebateRound[] = []
  let totalCost = 0
  let consensusResult: ConsensusResult | undefined
  let interventionFrequency = 5
  let shouldForceConsensus = false

  let contextPrompt = buildContextPrompt(question, context, corporateContext)
  const agentsMap = new Map(agents.map((a) => [a.key, a]))

  quoorumLogger.info(`Starting dynamic debate with ${maxRounds} estimated rounds`, { sessionId, agentCount: agents.length })

  for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
    // Check debate state (paused, forceConsensus, additional context) before each round
    if (checkDebateState) {
      const state = await checkDebateState()
      
      // If paused, stop debate execution (it will remain in_progress status)
      if (state.isPaused === true) {
        quoorumLogger.info(`Debate paused at round ${roundNum}`, { sessionId })
        return {
          sessionId,
          status: 'running', // Keep running (paused state is in metadata)
          rounds,
          finalRanking: consensusResult?.topOptions ?? [],
          totalCostUsd: totalCost,
          totalRounds: rounds.length,
          consensusScore: consensusResult?.consensusScore ?? 0,
        }
      }

      // If forceConsensus is true, mark to finish after this round
      if (state.forceConsensus === true && !shouldForceConsensus) {
        quoorumLogger.info(`Force consensus requested at round ${roundNum}`, { sessionId })
        shouldForceConsensus = true
      }

      // Add additional context if provided
      if (state.additionalContext && state.additionalContext.length > 0) {
        const newContext = state.additionalContext.join('\n\n')
        contextPrompt += `\n\n[Contexto adicional añadido por el usuario]\n${newContext}`
        quoorumLogger.info(`Additional context added at round ${roundNum}`, { 
          sessionId, 
          contextLength: newContext.length 
        })
      }
    }

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

    // Execute round with selected experts (sequential or parallel)
    let criticalAgentFailures = 0
    const criticalAgents = ['analyst', 'synthesizer']
    
    if (executionStrategy === 'parallel') {
      // PARALLEL: Execute all agents simultaneously (faster but agents don't see each other's responses in same round)
      const agentPromises = agentOrder.map(async (agentKey) => {
        const agent = agentsMap.get(agentKey)
        if (!agent) return null

        const prompt = buildAgentPrompt(agent, question, contextPrompt, rounds, []) // Empty currentRoundMessages for parallel

        const message = await generateAgentResponse({
          sessionId,
          round: roundNum,
          agent,
          prompt,
        })

        return { agentKey, message }
      })

      const results = await Promise.all(agentPromises)

      for (const result of results) {
        if (!result) continue

        const { agentKey, message } = result

        // Skip agent if it failed
        if (!message) {
          if (criticalAgents.includes(agentKey)) {
            criticalAgentFailures++
          }
          quoorumLogger.warn(`Agent ${agentKey} skipped in round ${roundNum}`, { sessionId, round: roundNum })
          continue
        }

        roundMessages.push(message)
        totalCost += message.costUsd

        // Track critical agent failures
        if (message.isError && criticalAgents.includes(agentKey)) {
          criticalAgentFailures++
        }

        if (onMessageGenerated) {
          await onMessageGenerated(message)
        }
      }
    } else {
      // SEQUENTIAL: Execute agents in order (agents can see previous agents' responses in same round)
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

        // Skip agent if it failed (null means it was skipped due to quota/balance issues)
        if (!message) {
          if (criticalAgents.includes(agentKey)) {
            criticalAgentFailures++
          }
          quoorumLogger.warn(`Agent ${agentKey} skipped in round ${roundNum}`, { sessionId, round: roundNum })
          continue // Don't add message to round, agent is silently skipped
        }

        roundMessages.push(message)
        totalCost += message.costUsd

        // Track critical agent failures (only for actual errors, not skipped)
        if (message.isError && criticalAgents.includes(agentKey)) {
          criticalAgentFailures++
        }

        if (onMessageGenerated) {
          await onMessageGenerated(message)
        }
      }
    }

    // If critical agents are consistently failing, log warning but continue
    // (The debate can still provide value with remaining agents)
    if (criticalAgentFailures > 0) {
      quoorumLogger.warn(`Critical agent failures in round ${roundNum}`, {
        sessionId,
        round: roundNum,
        failures: criticalAgentFailures,
        totalAgents: agentOrder.length
      })
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

    if (consensusResult.hasConsensus || shouldForceConsensus) {
      if (shouldForceConsensus) {
        quoorumLogger.info(`Force consensus triggered at round ${roundNum}`, { sessionId })
      }
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

async function generateAgentResponse(input: GenerateAgentResponseInput): Promise<DebateMessage | null> {
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
    
    // Check if it's a recoverable error (quota/balance) - AI client already tried all fallbacks
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
      // The AI client already tried all fallbacks, so we can't recover
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

function buildContextPrompt(question: string, context: LoadedContext, corporateContext?: CorporateContext): string {
  const parts: string[] = [`PREGUNTA: ${question}`]

  // Layer 2: Company Context (Master - Mission, Vision, Values)
  if (corporateContext?.companyContext) {
    parts.push(`\n[CONTEXTO EMPRESARIAL]\n${corporateContext.companyContext}`)
  }

  // Layer 3: Department Context (Specific - KPIs, Processes, Reports)
  if (corporateContext?.departmentContexts && corporateContext.departmentContexts.length > 0) {
    parts.push('\n[CONTEXTOS DEPARTAMENTALES]')
    for (const dept of corporateContext.departmentContexts) {
      parts.push(`\n${dept.departmentName}:\n${dept.departmentContext}`)
    }
  }

  // Regular context sources
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
