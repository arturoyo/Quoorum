/**
 * Router Engine - Conditional Workflow System
 *
 * Determina el orden de agentes dinámicamente según el contexto del debate.
 * Implementa la lógica de "Routers" del curso: decisiones condicionales
 * basadas en la respuesta del agente anterior.
 */

import type {
  DebateMessage,
  DebateRound,
  RouterCondition,
  RouterConfig,
  RouterRule,
  AgentRole,
  RankedOption,
} from './types'
import { quoorumLogger } from './logger'

// ============================================================================
// ROUTER CONFIGURATION
// ============================================================================

/**
 * Configuración de routers condicionales
 * Cada regla define: condición → orden de agentes
 */
export const DEBATE_ROUTER_CONFIG: RouterConfig = {
  defaultOrder: ['optimizer', 'critic', 'analyst', 'synthesizer'],

  rules: [
    // Alta confianza → Escalate to Critic for reality check
    {
      condition: 'high_confidence',
      agentOrder: ['critic', 'analyst', 'synthesizer'],
      description: 'Alta confianza detectada → El Crítico ataca para validar',
    },

    // Baja confianza → Need more data and analysis
    {
      condition: 'low_confidence',
      agentOrder: ['analyst', 'optimizer', 'critic', 'synthesizer'],
      description: 'Baja confianza → Analyst primero para recopilar datos',
    },

    // Fuerte acuerdo → Devil\'s Advocate mode
    {
      condition: 'strong_agreement',
      agentOrder: ['critic', 'critic', 'analyst', 'synthesizer'],
      description: 'Consenso temprano → Doble crítica para evitar groupthink',
    },

    // Fuerte desacuerdo → Need synthesis and mediation
    {
      condition: 'strong_disagreement',
      agentOrder: ['analyst', 'synthesizer', 'optimizer'],
      description: 'Desacuerdo fuerte → Mediación y búsqueda de middle ground',
    },

    // Faltan datos → Prioritize analysis
    {
      condition: 'needs_data',
      agentOrder: ['analyst', 'optimizer', 'synthesizer'],
      description: 'Falta información → Analyst recopila, luego evalúa opciones',
    },

    // Estancamiento → Force new perspective
    {
      condition: 'stalemate',
      agentOrder: ['optimizer', 'synthesizer', 'critic'],
      description: 'Debate estancado → Nueva perspectiva para romper empate',
    },
  ],
}

// ============================================================================
// CONDITION DETECTION
// ============================================================================

/**
 * Detecta la condición actual del debate basándose en el último mensaje
 */
export function detectDebateCondition(
  lastMessage: DebateMessage | undefined,
  rounds: DebateRound[],
  lastConsensus?: { topOptions: RankedOption[] }
): RouterCondition {
  // No hay mensaje previo → usar orden por defecto
  if (!lastMessage) {
    return 'default'
  }

  const messageContent = lastMessage.content.toLowerCase()

  // 1. Check for high confidence
  // Asumimos que si el mensaje es corto y afirmativo, hay alta confianza
  // (En producción, deberíamos extraer confidence del propio mensaje)
  const confidenceKeywords = ['claro', 'obviamente', 'definitivamente', 'sin duda', 'seguro']
  const hasHighConfidence = confidenceKeywords.some(kw => messageContent.includes(kw))

  if (hasHighConfidence) {
    quoorumLogger.info('[Router] HIGH CONFIDENCE detected', {
      agent: lastMessage.agentKey,
      snippet: messageContent.slice(0, 50)
    })
    return 'high_confidence'
  }

  // 2. Check for low confidence / needs data
  const uncertaintyKeywords = ['no estoy seguro', 'falta', 'necesito', 'datos', 'información', 'depende', 'tal vez']
  const needsData = uncertaintyKeywords.some(kw => messageContent.includes(kw))

  if (needsData) {
    quoorumLogger.info('[Router] NEEDS DATA detected', {
      agent: lastMessage.agentKey,
      snippet: messageContent.slice(0, 50)
    })
    return 'needs_data'
  }

  // 3. Check consensus status
  if (lastConsensus?.topOptions && lastConsensus.topOptions.length > 0) {
    const topOption = lastConsensus.topOptions[0]!
    const secondOption = lastConsensus.topOptions[1]

    // Strong agreement
    if (topOption.successRate >= 80) {
      quoorumLogger.info('[Router] STRONG AGREEMENT detected', {
        topSuccessRate: topOption.successRate
      })
      return 'strong_agreement'
    }

    // Strong disagreement (options very balanced)
    if (secondOption && Math.abs(topOption.successRate - secondOption.successRate) < 10) {
      quoorumLogger.info('[Router] STRONG DISAGREEMENT detected', {
        gap: Math.abs(topOption.successRate - secondOption.successRate)
      })
      return 'strong_disagreement'
    }
  }

  // 4. Check for stalemate (same top option for 2+ rounds)
  if (rounds.length >= 3) {
    const last3Rounds = rounds.slice(-3)
    const topOptions = last3Rounds
      .map(r => r.consensusCheck?.topOptions[0]?.option)
      .filter(Boolean)

    if (topOptions.length >= 2 && topOptions[0] === topOptions[1]) {
      quoorumLogger.info('[Router] STALEMATE detected', {
        stalledOption: topOptions[0]
      })
      return 'stalemate'
    }
  }

  // Default
  return 'default'
}

/**
 * Determina el orden de agentes según la condición detectada
 */
export function determineAgentOrder(
  lastMessage: DebateMessage | undefined,
  rounds: DebateRound[],
  lastConsensus?: { topOptions: RankedOption[] },
  config: RouterConfig = DEBATE_ROUTER_CONFIG
): AgentRole[] {
  const condition = detectDebateCondition(lastMessage, rounds, lastConsensus)

  // Buscar regla que coincida con la condición
  const matchedRule = config.rules.find(rule => rule.condition === condition)

  if (matchedRule) {
    quoorumLogger.info('[Router] Applying rule', {
      condition,
      description: matchedRule.description,
      agentOrder: matchedRule.agentOrder,
    })
    return matchedRule.agentOrder
  }

  // Fallback a orden por defecto
  quoorumLogger.info('[Router] Using default order', { condition })
  return config.defaultOrder
}

/**
 * Helper para obtener la descripción de la regla aplicada
 */
export function getActiveRuleDescription(
  lastMessage: DebateMessage | undefined,
  rounds: DebateRound[],
  lastConsensus?: { topOptions: RankedOption[] }
): string {
  const condition = detectDebateCondition(lastMessage, rounds, lastConsensus)
  const matchedRule = DEBATE_ROUTER_CONFIG.rules.find(rule => rule.condition === condition)
  return matchedRule?.description ?? 'Usando orden estándar de debate'
}
