/**
 * Forum Consensus Detection
 *
 * Detecta cuando los agentes han llegado a un consenso y extrae el ranking final
 */

import { getAIClient } from '@quoorum/ai'
import { QUOORUM_AGENTS, getAgentName } from './agents'
import type { DebateMessage, RankedOption, ConsensusResult } from './types'

// ============================================================================
// CONSENSUS DETECTION
// ============================================================================

export async function checkConsensus(
  messages: DebateMessage[],
  round: number,
  maxRounds: number,
  question: string
): Promise<ConsensusResult> {
  // Extract options and analyze debate
  const options = await rankOptions(messages, question)

  console.log(`[Consensus Check] Round ${round}/${maxRounds}:`, {
    optionsFound: options.length,
    topOption: options[0]?.option,
    topSuccessRate: options[0]?.successRate,
  })

  if (options.length === 0) {
    return {
      hasConsensus: false,
      consensusScore: 0,
      topOptions: [],
      shouldContinue: round < maxRounds,
      reasoning: 'No se identificaron opciones viables todavia',
    }
  }

  const topOption = options[0]
  const secondOption = options[1]

  // Safety check for topOption (already checked options.length > 0 above)
  if (!topOption) {
    return {
      hasConsensus: false,
      consensusScore: 0,
      topOptions: [],
      shouldContinue: round < maxRounds,
      reasoning: 'Error: No se pudo determinar la opcion principal',
    }
  }

  // Consensus criteria
  const hasStrongConsensus = topOption.successRate >= 70
  const hasLargeGap = secondOption ? topOption.successRate - secondOption.successRate >= 30 : true
  const reachedMaxRounds = round >= maxRounds
  const hasMinimumRounds = round >= Math.min(3, maxRounds) // At least 3 rounds (or maxRounds if less)

  // CRITICAL: Don't stop on first round unless maxRounds is 1
  // Even if we have strong consensus or large gap, need minimum rounds for deliberation
  const hasConsensus = (hasStrongConsensus || hasLargeGap) && hasMinimumRounds || reachedMaxRounds

  const consensusScore = calculateConsensusScore(options)

  console.log(`[Consensus Decision] Round ${round}/${maxRounds}:`, {
    hasStrongConsensus,
    hasLargeGap,
    hasMinimumRounds: `${hasMinimumRounds} (need >= ${Math.min(3, maxRounds)})`,
    reachedMaxRounds,
    hasConsensus,
    decision: hasConsensus ? '🛑 STOP' : '➡️ CONTINUE',
  })

  return {
    hasConsensus,
    consensusScore,
    topOptions: options,
    shouldContinue: !hasConsensus && round < maxRounds,
    reasoning: generateReasoning(hasConsensus, round, options, {
      hasStrongConsensus,
      hasLargeGap,
      reachedMaxRounds,
      hasMinimumRounds,
    }),
  }
}

// ============================================================================
// OPTION RANKING
// ============================================================================

function buildRankingPrompt(question: string): string {
  return `
PREGUNTA ORIGINAL:
${question}

INSTRUCCIONES:
Analiza el debate y extrae las opciones viables que RESPONDEN DIRECTAMENTE a la pregunta.

REGLAS CRÍTICAS:
1. Las opciones deben ser RESPUESTAS DIRECTAS a la pregunta original
2. NO extraigas temas o conceptos generales mencionados
3. Identifica 2-4 opciones concretas y accionables
4. Calcula % de éxito basado en los argumentos del debate
5. Responde SOLO en JSON válido

EJEMPLO:
- Pregunta: "¿Qué es mejor ChatGPT o Perplexity para programar?"
- Opciones: ["ChatGPT", "Perplexity", "Usar ambos según contexto"]
- NO válido: ["OpenSource", "A/B Testing"] (estos no responden la pregunta)

FORMATO JSON:
{
  "options": [
    {
      "option": "respuesta directa a la pregunta",
      "successRate": 75,
      "pros": ["pro1", "pro2"],
      "cons": ["con1"],
      "supporters": ["Optimista", "Analista"],
      "confidence": 0.8
    }
  ]
}

DEBATE:
`
}

export async function rankOptions(messages: DebateMessage[], question: string): Promise<RankedOption[]> {
  if (messages.length === 0) return []

  const client = getAIClient()

  // Build debate summary
  const debateSummary = messages.map((m) => `${getAgentName(m.agentKey)}: ${m.content}`).join('\n')

  const prompt = buildRankingPrompt(question) + debateSummary

  const response = await client.generate(prompt, {
    modelId: 'gpt-4o-mini', // Use cheap model for extraction
    temperature: 0.2,
    maxTokens: 500,
  })

  try {
    // Extract JSON from response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return []
    }

    const parsed = JSON.parse(jsonMatch[0]) as { options: RankedOption[] }
    return parsed.options.sort((a, b) => b.successRate - a.successRate)
  } catch {
    // If JSON parsing fails, return empty
    return []
  }
}

// ============================================================================
// CONSENSUS SCORE
// ============================================================================

export function calculateConsensusScore(options: RankedOption[]): number {
  if (options.length === 0) return 0

  const topOption = options[0]
  if (!topOption) return 0

  if (options.length === 1) return topOption.successRate / 100

  const secondOption = options[1]
  if (!secondOption) return topOption.successRate / 100

  // Score based on:
  // 1. Success rate of top option (50% weight)
  // 2. Gap between top and second (30% weight)
  // 3. Number of supporters of top option (20% weight)

  const successComponent = topOption.successRate / 100
  const gapComponent = (topOption.successRate - secondOption.successRate) / 100
  const supporterComponent = topOption.supporters.length / Object.keys(QUOORUM_AGENTS).length

  return successComponent * 0.5 + gapComponent * 0.3 + supporterComponent * 0.2
}

// ============================================================================
// REASONING GENERATION
// ============================================================================

interface ConsensusFlags {
  hasStrongConsensus: boolean
  hasLargeGap: boolean
  reachedMaxRounds: boolean
  hasMinimumRounds: boolean
}

function generateReasoning(
  hasConsensus: boolean,
  round: number,
  options: RankedOption[],
  flags: ConsensusFlags
): string {
  if (options.length === 0) {
    return 'Debate en progreso, aun no hay opciones claras.'
  }

  const topOption = options[0]
  if (!topOption) {
    return 'Error: No se pudo determinar la opcion principal.'
  }

  if (!hasConsensus) {
    // If no consensus yet because minimum rounds not reached
    if ((flags.hasStrongConsensus || flags.hasLargeGap) && !flags.hasMinimumRounds) {
      return `Round ${round}: ${topOption.option} lidera con ${topOption.successRate}% pero continuamos deliberando (mínimo 3 rondas).`
    }
    return `Round ${round}: ${topOption.option} lidera con ${topOption.successRate}% pero el debate continua.`
  }

  const reasons: string[] = []

  if (flags.hasStrongConsensus) {
    reasons.push(`consenso fuerte (${topOption.successRate}% exito)`)
  }

  if (flags.hasLargeGap && options.length > 1) {
    const secondOption = options[1]
    if (secondOption) {
      const gap = topOption.successRate - secondOption.successRate
      reasons.push(`ventaja clara (+${gap}% sobre segunda opcion)`)
    }
  }

  if (flags.reachedMaxRounds) {
    reasons.push(`limite de rondas alcanzado (${round})`)
  }

  return `CONSENSO: "${topOption.option}" - ${reasons.join(', ')}`
}
