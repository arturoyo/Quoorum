/**
 * Router Engine Tests
 *
 * Tests para el sistema de workflows condicionales
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  detectDebateCondition,
  determineAgentOrder,
  getActiveRuleDescription,
  DEBATE_ROUTER_CONFIG,
} from '../router-engine'
import type { DebateMessage, DebateRound, RankedOption, RouterCondition } from '../types'

// ============================================================================
// TEST HELPERS
// ============================================================================

function createMockMessage(
  content: string,
  agentKey: string = 'optimizer',
  round: number = 1
): DebateMessage {
  return {
    id: crypto.randomUUID(),
    sessionId: 'test-session',
    round,
    agentKey,
    agentName: agentKey,
    content,
    isCompressed: true,
    tokensUsed: 50,
    costUsd: 0.001,
    createdAt: new Date(),
  }
}

function createMockRound(
  roundNum: number,
  messages: DebateMessage[],
  topOptions?: RankedOption[]
): DebateRound {
  return {
    round: roundNum,
    messages,
    consensusCheck: topOptions
      ? {
          hasConsensus: false,
          consensusScore: 0.5,
          topOptions,
          shouldContinue: true,
          reasoning: 'Test consensus',
        }
      : undefined,
  }
}

function createMockOption(option: string, successRate: number): RankedOption {
  return {
    option,
    successRate,
    pros: [],
    cons: [],
    supporters: [],
    confidence: successRate / 100,
  }
}

// ============================================================================
// DETECT DEBATE CONDITION TESTS
// ============================================================================

describe('detectDebateCondition', () => {
  it('should return "default" when no last message', () => {
    const condition = detectDebateCondition(undefined, [], undefined)
    expect(condition).toBe('default')
  })

  it('should detect HIGH CONFIDENCE from keywords', () => {
    const message = createMockMessage('Claro, esta opción es definitivamente la mejor')
    const condition = detectDebateCondition(message, [], undefined)
    expect(condition).toBe('high_confidence')
  })

  it('should detect HIGH CONFIDENCE with "obviamente"', () => {
    const message = createMockMessage('Obviamente debemos proceder con esta estrategia')
    const condition = detectDebateCondition(message, [], undefined)
    expect(condition).toBe('high_confidence')
  })

  it('should detect HIGH CONFIDENCE with "sin duda"', () => {
    const message = createMockMessage('Sin duda es la mejor alternativa')
    const condition = detectDebateCondition(message, [], undefined)
    expect(condition).toBe('high_confidence')
  })

  it('should detect NEEDS DATA from "falta" keyword', () => {
    const message = createMockMessage('Falta información sobre el mercado')
    const condition = detectDebateCondition(message, [], undefined)
    expect(condition).toBe('needs_data')
  })

  it('should detect NEEDS DATA from "necesito" keyword', () => {
    const message = createMockMessage('Necesito más datos para decidir')
    const condition = detectDebateCondition(message, [], undefined)
    expect(condition).toBe('needs_data')
  })

  it('should detect NEEDS DATA from "depende" keyword', () => {
    const message = createMockMessage('Depende de los datos que tengamos')
    const condition = detectDebateCondition(message, [], undefined)
    expect(condition).toBe('needs_data')
  })

  it('should detect STRONG AGREEMENT when top option >= 80%', () => {
    const message = createMockMessage('Análisis completado')
    const consensus = {
      topOptions: [createMockOption('Opción A', 85), createMockOption('Opción B', 60)],
    }
    const condition = detectDebateCondition(message, [], consensus)
    expect(condition).toBe('strong_agreement')
  })

  it('should detect STRONG DISAGREEMENT when options are balanced (gap < 10%)', () => {
    const message = createMockMessage('Análisis completado')
    const consensus = {
      topOptions: [createMockOption('Opción A', 52), createMockOption('Opción B', 48)],
    }
    const condition = detectDebateCondition(message, [], consensus)
    expect(condition).toBe('strong_disagreement')
  })

  it('should detect STALEMATE when same top option for 2+ rounds', () => {
    const rounds: DebateRound[] = [
      createMockRound(1, [createMockMessage('msg1')], [createMockOption('Opción A', 70)]),
      createMockRound(2, [createMockMessage('msg2')], [createMockOption('Opción A', 72)]),
      createMockRound(3, [createMockMessage('msg3')], [createMockOption('Opción A', 71)]),
    ]
    const message = createMockMessage('Seguimos con Opción A')
    const condition = detectDebateCondition(message, rounds, undefined)
    expect(condition).toBe('stalemate')
  })

  it('should NOT detect stalemate with different top options', () => {
    const rounds: DebateRound[] = [
      createMockRound(1, [createMockMessage('msg1')], [createMockOption('Opción A', 70)]),
      createMockRound(2, [createMockMessage('msg2')], [createMockOption('Opción B', 72)]),
      createMockRound(3, [createMockMessage('msg3')], [createMockOption('Opción A', 75)]),
    ]
    const message = createMockMessage('Cambio de opción')
    const condition = detectDebateCondition(message, rounds, undefined)
    expect(condition).not.toBe('stalemate')
  })

  it('should prioritize HIGH CONFIDENCE over other conditions', () => {
    const message = createMockMessage('Definitivamente necesito más datos')
    // Contiene "definitivamente" (high confidence) y "necesito datos" (needs_data)
    const condition = detectDebateCondition(message, [], undefined)
    expect(condition).toBe('high_confidence') // high_confidence se evalúa primero
  })

  it('should return "default" when no conditions match', () => {
    const message = createMockMessage('Esto es una respuesta neutral sin keywords')
    const condition = detectDebateCondition(message, [], undefined)
    expect(condition).toBe('default')
  })
})

// ============================================================================
// DETERMINE AGENT ORDER TESTS
// ============================================================================

describe('determineAgentOrder', () => {
  it('should return default order when no conditions match', () => {
    const order = determineAgentOrder(undefined, [], undefined)
    expect(order).toEqual(['optimizer', 'critic', 'analyst', 'synthesizer'])
  })

  it('should return HIGH CONFIDENCE order', () => {
    const message = createMockMessage('Claro, esta es la mejor opción')
    const order = determineAgentOrder(message, [], undefined)
    expect(order).toEqual(['critic', 'analyst', 'synthesizer'])
  })

  it('should return LOW CONFIDENCE order', () => {
    const message = createMockMessage('Necesito más información para decidir')
    const order = determineAgentOrder(message, [], undefined)
    // LOW_CONFIDENCE/NEEDS_DATA uses analyst-first order without critic
    expect(order).toEqual(['analyst', 'optimizer', 'synthesizer'])
  })

  it('should return STRONG AGREEMENT order (double critic)', () => {
    const message = createMockMessage('Análisis completado')
    const consensus = {
      topOptions: [createMockOption('Opción A', 85)],
    }
    const order = determineAgentOrder(message, [], consensus)
    expect(order).toEqual(['critic', 'critic', 'analyst', 'synthesizer'])
  })

  it('should return STRONG DISAGREEMENT order', () => {
    const message = createMockMessage('Análisis completado')
    const consensus = {
      topOptions: [createMockOption('Opción A', 52), createMockOption('Opción B', 48)],
    }
    const order = determineAgentOrder(message, [], consensus)
    expect(order).toEqual(['analyst', 'synthesizer', 'optimizer'])
  })

  it('should return NEEDS DATA order', () => {
    const message = createMockMessage('Falta información clave')
    const order = determineAgentOrder(message, [], undefined)
    expect(order).toEqual(['analyst', 'optimizer', 'synthesizer'])
  })

  it('should return STALEMATE order', () => {
    const rounds: DebateRound[] = [
      createMockRound(1, [createMockMessage('msg1')], [createMockOption('Opción A', 70)]),
      createMockRound(2, [createMockMessage('msg2')], [createMockOption('Opción A', 72)]),
      createMockRound(3, [createMockMessage('msg3')], [createMockOption('Opción A', 71)]),
    ]
    const message = createMockMessage('Seguimos igual')
    const order = determineAgentOrder(message, rounds, undefined)
    expect(order).toEqual(['optimizer', 'synthesizer', 'critic'])
  })

  it('should accept custom config', () => {
    const customConfig = {
      defaultOrder: ['synthesizer', 'optimizer'] as const,
      rules: [
        {
          condition: 'high_confidence' as RouterCondition,
          agentOrder: ['critic'] as const,
          description: 'Custom rule',
        },
      ],
    }
    const message = createMockMessage('Definitivamente')
    const order = determineAgentOrder(message, [], undefined, customConfig)
    expect(order).toEqual(['critic'])
  })
})

// ============================================================================
// GET ACTIVE RULE DESCRIPTION TESTS
// ============================================================================

describe('getActiveRuleDescription', () => {
  it('should return default description when no condition matches', () => {
    const description = getActiveRuleDescription(undefined, [], undefined)
    expect(description).toBe('Usando orden estándar de debate')
  })

  it('should return HIGH CONFIDENCE description', () => {
    const message = createMockMessage('Claro, es la mejor opción')
    const description = getActiveRuleDescription(message, [], undefined)
    expect(description).toBe('Alta confianza detectada → El Crítico ataca para validar')
  })

  it('should return NEEDS DATA description', () => {
    const message = createMockMessage('Necesito más datos')
    const description = getActiveRuleDescription(message, [], undefined)
    expect(description).toBe('Falta información → Analyst recopila, luego evalúa opciones')
  })

  it('should return STRONG AGREEMENT description', () => {
    const message = createMockMessage('Análisis completado')
    const consensus = {
      topOptions: [createMockOption('Opción A', 85)],
    }
    const description = getActiveRuleDescription(message, [], consensus)
    expect(description).toBe('Consenso temprano → Doble crítica para evitar groupthink')
  })

  it('should return STRONG DISAGREEMENT description', () => {
    const message = createMockMessage('Análisis completado')
    const consensus = {
      topOptions: [createMockOption('Opción A', 51), createMockOption('Opción B', 49)],
    }
    const description = getActiveRuleDescription(message, [], consensus)
    expect(description).toBe('Desacuerdo fuerte → Mediación y búsqueda de middle ground')
  })

  it('should return STALEMATE description', () => {
    const rounds: DebateRound[] = [
      createMockRound(1, [createMockMessage('msg1')], [createMockOption('Opción A', 70)]),
      createMockRound(2, [createMockMessage('msg2')], [createMockOption('Opción A', 72)]),
      createMockRound(3, [createMockMessage('msg3')], [createMockOption('Opción A', 71)]),
    ]
    const message = createMockMessage('Seguimos igual')
    const description = getActiveRuleDescription(message, rounds, undefined)
    expect(description).toBe('Debate estancado → Nueva perspectiva para romper empate')
  })
})

// ============================================================================
// ROUTER CONFIG TESTS
// ============================================================================

describe('DEBATE_ROUTER_CONFIG', () => {
  it('should have default order defined', () => {
    expect(DEBATE_ROUTER_CONFIG.defaultOrder).toBeDefined()
    expect(DEBATE_ROUTER_CONFIG.defaultOrder.length).toBeGreaterThan(0)
  })

  it('should have rules array', () => {
    expect(Array.isArray(DEBATE_ROUTER_CONFIG.rules)).toBe(true)
    expect(DEBATE_ROUTER_CONFIG.rules.length).toBeGreaterThan(0)
  })

  it('should have all expected rules', () => {
    const conditions = DEBATE_ROUTER_CONFIG.rules.map((r) => r.condition)
    expect(conditions).toContain('high_confidence')
    expect(conditions).toContain('low_confidence')
    expect(conditions).toContain('strong_agreement')
    expect(conditions).toContain('strong_disagreement')
    expect(conditions).toContain('needs_data')
    expect(conditions).toContain('stalemate')
  })

  it('should have description for each rule', () => {
    DEBATE_ROUTER_CONFIG.rules.forEach((rule) => {
      expect(rule.description).toBeDefined()
      expect(rule.description.length).toBeGreaterThan(0)
    })
  })

  it('should have valid agent order for each rule', () => {
    const validAgents = ['optimizer', 'critic', 'analyst', 'synthesizer']
    DEBATE_ROUTER_CONFIG.rules.forEach((rule) => {
      expect(Array.isArray(rule.agentOrder)).toBe(true)
      expect(rule.agentOrder.length).toBeGreaterThan(0)
      rule.agentOrder.forEach((agent) => {
        expect(validAgents).toContain(agent)
      })
    })
  })
})

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Router Engine Integration', () => {
  it('should handle complete debate flow with changing conditions', () => {
    // Round 1: Normal start
    let order = determineAgentOrder(undefined, [], undefined)
    expect(order).toEqual(['optimizer', 'critic', 'analyst', 'synthesizer'])

    // Round 2: High confidence detected
    const round1 = createMockRound(1, [
      createMockMessage('Definitivamente debemos ir por esta opción'),
    ])
    order = determineAgentOrder(round1.messages[0]!, [round1], undefined)
    expect(order).toEqual(['critic', 'analyst', 'synthesizer'])

    // Round 3: Strong agreement
    const round2 = createMockRound(2, [createMockMessage('Concordamos en A')], [
      createMockOption('Opción A', 85),
    ])
    order = determineAgentOrder(round2.messages[0]!, [round1, round2], round2.consensusCheck)
    expect(order).toEqual(['critic', 'critic', 'analyst', 'synthesizer'])

    // Round 4: Needs more data
    const round3 = createMockRound(3, [createMockMessage('Falta información crítica')])
    order = determineAgentOrder(round3.messages[0]!, [round1, round2, round3], undefined)
    expect(order).toEqual(['analyst', 'optimizer', 'synthesizer'])
  })

  it('should maintain consistency across multiple calls with same input', () => {
    const message = createMockMessage('Claro que sí')
    const rounds: DebateRound[] = []

    const order1 = determineAgentOrder(message, rounds, undefined)
    const order2 = determineAgentOrder(message, rounds, undefined)
    const order3 = determineAgentOrder(message, rounds, undefined)

    expect(order1).toEqual(order2)
    expect(order2).toEqual(order3)
  })

  it('should handle edge case: empty message content', () => {
    const message = createMockMessage('')
    const condition = detectDebateCondition(message, [], undefined)
    expect(condition).toBe('default')
  })

  it('should handle edge case: very long message with multiple keywords', () => {
    const message = createMockMessage(
      'Claro que necesito más datos pero definitivamente creo que falta información aunque obviamente podemos decidir'
    )
    // Should detect high_confidence first (earliest check)
    const condition = detectDebateCondition(message, [], undefined)
    expect(condition).toBe('high_confidence')
  })
})
