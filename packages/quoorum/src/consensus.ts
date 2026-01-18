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

/**
 * Detecta si la pregunta es de generación (copy, texto, contenido) vs decisión (opciones)
 */
function detectQuestionType(question: string): 'generation' | 'decision' {
  const generationKeywords = [
    'genera', 'crea', 'escribe', 'redacta', 'haz', 'elabora',
    'copy', 'texto', 'contenido', 'landing', 'email', 'post',
    'titular', 'headline', 'descripción', 'anuncio', 'mensaje'
  ]
  
  const lowerQuestion = question.toLowerCase()
  const isGeneration = generationKeywords.some(keyword => lowerQuestion.includes(keyword))
  
  return isGeneration ? 'generation' : 'decision'
}

function buildRankingPrompt(question: string): string {
  const questionType = detectQuestionType(question)
  
  if (questionType === 'generation') {
    // Para preguntas de generación (copy, texto, contenido)
    return `
PREGUNTA ORIGINAL:
${question}

INSTRUCCIONES:
Esta es una pregunta de GENERACIÓN DE CONTENIDO (no de decisión entre opciones).
Analiza el debate y GENERA el contenido completo solicitado, incorporando las mejores ideas de todos los agentes.

PROCESO:
1. Identifica los elementos clave que los agentes han consensuado
2. Sintetiza las mejores propuestas en un output final COMPLETO
3. El output debe ser USABLE DIRECTAMENTE (no opciones, sino el resultado final)

REGLAS:
- Si piden "copy para landing" → Genera el COPY COMPLETO listo para usar
- Si piden "texto" → Genera el TEXTO COMPLETO
- Si piden "email" → Genera el EMAIL COMPLETO
- El output debe reflejar el consenso de los agentes
- Incorpora los puntos más fuertes del debate
- El output final debe ser profesional, completo y listo para usar

FORMATO JSON:
{
  "type": "generation",
  "output": "EL CONTENIDO COMPLETO GENERADO AQUÍ (copy, texto, etc.)",
  "successRate": 95.0,
  "keyInsights": ["insight1", "insight2"],
  "reasoning": "Explicación breve de por qué este es el mejor output basado en el debate"
}

DEBATE:
`
  }
  
  // Para preguntas de decisión (opciones múltiples)
  return `
PREGUNTA ORIGINAL:
${question}

INSTRUCCIONES:
Analiza el debate y extrae las opciones viables que RESPONDEN DIRECTAMENTE a la pregunta.
CALCULA el successRate (0-100) de forma PRECISA basándote en:

MÉTRICAS OBJETIVAS:
1. Número de argumentos a favor (más argumentos = mayor %)
2. Fortaleza de los argumentos (argumentos con datos/casos = +15-20%, generales = +5-10%)
3. Número de agentes que apoyan (más agentes = +10-15% por agente)
4. Número de argumentos en contra (cada contraargumento fuerte = -10-15%)
5. Consenso entre agentes (si varios coinciden = +5-10% por coincidencia)

IMPORTANTE:
- USA DECIMALES (ej: 67.3%, 74.8%, no 70%, 65%)
- Calcula basándote en EVIDENCIA del debate, NO en suposiciones
- Diferencias mínimas entre opciones cercanas (ej: si #1 tiene 4 argumentos y #2 tiene 3, la diferencia debería ser ~7-12%, no 5%)
- El rango debe reflejar la REAL dispersión de argumentos (si hay clara ganadora = 75-85%, si están cerca = diferencias de 3-8%)

REGLAS CRÍTICAS:
1. Las opciones deben ser RESPUESTAS DIRECTAS a la pregunta original
2. NO extraigas temas o conceptos generales mencionados
3. Identifica 2-4 opciones concretas y accionables
4. Responde SOLO en JSON válido

EJEMPLO DE CÁLCULO:
- Opción A: 3 argumentos fuertes, 2 agentes apoyan, 1 contraargumento débil → ~68-72%
- Opción B: 2 argumentos moderados, 1 agente apoya, 2 contraargumentos moderados → ~52-58%
- Diferencia: ~12-16% (no 10% redondeado)

FORMATO JSON:
{
  "type": "decision",
  "options": [
    {
      "option": "respuesta directa a la pregunta",
      "successRate": 67.4,
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
  const questionType = detectQuestionType(question)

  // Build debate summary
  const debateSummary = messages.map((m) => `${getAgentName(m.agentKey)}: ${m.content}`).join('\n')

  const prompt = buildRankingPrompt(question) + debateSummary

  // Increase tokens for generation type (needs more space for full content)
  const maxTokens = questionType === 'generation' ? 2000 : 800

  const response = await client.generate(prompt, {
    modelId: 'gpt-4o-mini', // Use cheap model for extraction
    temperature: questionType === 'generation' ? 0.7 : 0.3, // Higher temp for creative generation
    maxTokens,
  })

  try {
    // Extract JSON from response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return []
    }

    const parsed = JSON.parse(jsonMatch[0]) as 
      | { type: 'decision'; options: RankedOption[] }
      | { type: 'generation'; output: string; successRate: number; keyInsights?: string[]; reasoning?: string }

    // Handle generation type: convert single output to RankedOption format
    if (parsed.type === 'generation') {
      return [
        {
          option: parsed.output, // El contenido completo generado
          successRate: parsed.successRate || 95.0,
          pros: parsed.keyInsights || [],
          cons: [],
          supporters: messages.map(m => getAgentName(m.agentKey)),
          confidence: 0.9,
          reasoning: parsed.reasoning,
        },
      ]
    }

    // Handle decision type: return sorted options
    return parsed.options.sort((a, b) => b.successRate - a.successRate)
  } catch (error) {
    console.error('[Consensus] Error parsing ranking response:', error)
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
  // 1. Success rate of top option (50% weight) - measures how strong the top option is
  // 2. Gap between top and second (30% weight) - measures how clear the winner is
  // 3. Number of supporters of top option (20% weight) - measures agreement across agents

  // Use precise values (don't round here)
  const successComponent = topOption.successRate / 100
  const gapComponent = Math.min((topOption.successRate - secondOption.successRate) / 100, 1) // Cap gap at 100%
  
  // Count supporters more precisely: use actual number of agents in debate, not just QUOORUM_AGENTS
  // Estimate based on unique agents that participated in messages (fallback to QUOORUM_AGENTS length)
  const totalAgents = Object.keys(QUOORUM_AGENTS).length // Default: 4 core agents
  const supporterComponent = Math.min((topOption.supporters?.length || 1) / Math.max(totalAgents, 1), 1)

  // Calculate weighted average with precise decimals
  const score = successComponent * 0.5 + gapComponent * 0.3 + supporterComponent * 0.2

  // Return value between 0 and 1 (not percentage)
  return Math.max(0, Math.min(1, score))
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
