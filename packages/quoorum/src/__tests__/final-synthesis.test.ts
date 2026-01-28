/**
 * Final Synthesis Tests
 *
 * Tests para el generador de síntesis ejecutiva final
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateFinalSynthesis, extractSynthesisInsights } from '../final-synthesis'
import type { DebateRound, DebateMessage, FinalSynthesis } from '../types'

// ============================================================================
// MOCKS
// ============================================================================

// Mock del AI client
vi.mock('@quoorum/ai', () => ({
  getAIClient: vi.fn(() => ({
    generate: vi.fn(),
  })),
}))

// Mock del logger
vi.mock('../logger', () => ({
  quoorumLogger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock cost calculation
vi.mock('../analytics/cost', () => ({
  calculateTokenCost: () => 0.015, // Mock cost
}))

import { getAIClient } from '@quoorum/ai'

// ============================================================================
// TEST HELPERS
// ============================================================================

function createMockMessage(
  content: string,
  agentName: string = 'Optimista',
  agentKey: string = 'optimizer'
): DebateMessage {
  return {
    id: crypto.randomUUID(),
    sessionId: 'test-session',
    round: 1,
    agentKey,
    agentName,
    content,
    isCompressed: true,
    tokensUsed: 50,
    costUsd: 0.001,
    createdAt: new Date(),
  }
}

function createMockRound(roundNum: number, messages: DebateMessage[]): DebateRound {
  return {
    round: roundNum,
    messages,
    consensusCheck: {
      hasConsensus: false,
      consensusScore: 0.7,
      topOptions: [
        {
          option: 'Opción A',
          successRate: 75,
          pros: ['Pro 1', 'Pro 2'],
          cons: ['Con 1'],
          supporters: ['optimizer', 'analyst'],
          confidence: 0.75,
        },
      ],
      shouldContinue: true,
      reasoning: 'Test consensus',
    },
  }
}

const mockSynthesis: FinalSynthesis = {
  summary: 'Este es un resumen ejecutivo del debate donde se analizaron 3 opciones principales.',
  top3Options: [
    {
      option: 'Opción A',
      successRate: 85,
      pros: ['Fácil implementación', 'Bajo costo', 'Alto impacto'],
      cons: ['Requiere tiempo', 'Dependencia externa'],
      criticalRisks: ['Riesgo de mercado', 'Riesgo técnico'],
      implementation: 'Contratar equipo y ejecutar en 3 meses',
    },
    {
      option: 'Opción B',
      successRate: 70,
      pros: ['Rápido', 'Probado'],
      cons: ['Costoso', 'Limitado'],
      criticalRisks: ['Escalabilidad'],
      implementation: 'Usar solución existente',
    },
    {
      option: 'Opción C',
      successRate: 60,
      pros: ['Innovador'],
      cons: ['Riesgoso', 'Incierto'],
      criticalRisks: ['Adopción', 'Tecnología nueva'],
      implementation: 'Proyecto piloto primero',
    },
  ],
  recommendation: {
    option: 'Opción A',
    reasoning:
      'Ofrece el mejor balance entre riesgo y beneficio según el análisis de los expertos',
    nextSteps: [
      'Formar equipo de proyecto',
      'Definir KPIs y métricas',
      'Crear roadmap detallado',
      'Aprobar presupuesto',
    ],
  },
  debateQuality: {
    convergenceScore: 85,
    depthScore: 90,
    diversityScore: 75,
  },
}

// ============================================================================
// GENERATE FINAL SYNTHESIS TESTS
// ============================================================================

describe('generateFinalSynthesis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate synthesis successfully', async () => {
    const mockGenerate = vi.fn().mockResolvedValue({
      text: JSON.stringify(mockSynthesis),
      usage: { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 },
    })

    vi.mocked(getAIClient).mockReturnValue({
      generate: mockGenerate,
    } as any)

    const rounds: DebateRound[] = [
      createMockRound(1, [
        createMockMessage('Propongo Opción A', 'Optimista'),
        createMockMessage('Riesgos de Opción A', 'Crítico', 'critic'),
      ]),
    ]

    const result = await generateFinalSynthesis('test-session', '¿Cuál es la mejor estrategia?', rounds)

    expect(result).not.toBeNull()
    expect(result?.synthesis).toMatchObject(mockSynthesis)
    expect(result?.costUsd).toBeGreaterThan(0)
    expect(result?.tokensUsed).toBe(1500)
    expect(result?.provider).toBe('openai')
    expect(result?.model).toBe('gpt-4o')
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.stringContaining('SECRETARIO DEL TRIBUNAL'),
      expect.objectContaining({
        modelId: 'gpt-4o',
        temperature: 0.2,
        maxTokens: 2000,
      })
    )
  })

  it('should include question in prompt', async () => {
    const mockGenerate = vi.fn().mockResolvedValue({
      text: JSON.stringify(mockSynthesis),
    })

    vi.mocked(getAIClient).mockReturnValue({
      generate: mockGenerate,
    } as any)

    const rounds: DebateRound[] = [createMockRound(1, [createMockMessage('Test')])]
    const question = '¿Invertir en IA o blockchain?'

    await generateFinalSynthesis('test-session', question, rounds)

    const promptUsed = mockGenerate.mock.calls[0]?.[0] as string
    expect(promptUsed).toContain(question)
  })

  it('should include all rounds in debate history', async () => {
    const mockGenerate = vi.fn().mockResolvedValue({
      text: JSON.stringify(mockSynthesis),
    })

    vi.mocked(getAIClient).mockReturnValue({
      generate: mockGenerate,
    } as any)

    const rounds: DebateRound[] = [
      createMockRound(1, [createMockMessage('Mensaje ronda 1')]),
      createMockRound(2, [createMockMessage('Mensaje ronda 2')]),
      createMockRound(3, [createMockMessage('Mensaje ronda 3')]),
    ]

    await generateFinalSynthesis('test-session', 'Pregunta test', rounds)

    const promptUsed = mockGenerate.mock.calls[0]?.[0] as string
    expect(promptUsed).toContain('Ronda 1')
    expect(promptUsed).toContain('Ronda 2')
    expect(promptUsed).toContain('Ronda 3')
    expect(promptUsed).toContain('Mensaje ronda 1')
    expect(promptUsed).toContain('Mensaje ronda 2')
    expect(promptUsed).toContain('Mensaje ronda 3')
  })

  it('should handle JSON with markdown code blocks', async () => {
    const jsonWithMarkdown = '```json\n' + JSON.stringify(mockSynthesis) + '\n```'

    const mockGenerate = vi.fn().mockResolvedValue({
      text: jsonWithMarkdown,
    })

    vi.mocked(getAIClient).mockReturnValue({
      generate: mockGenerate,
    } as any)

    const rounds: DebateRound[] = [createMockRound(1, [createMockMessage('Test')])]

    const result = await generateFinalSynthesis('test-session', 'Pregunta', rounds)

    expect(result).not.toBeNull()
    expect(result?.synthesis).toMatchObject(mockSynthesis)
  })

  it('should return null on AI client error', async () => {
    const mockGenerate = vi.fn().mockRejectedValue(new Error('AI API error'))

    vi.mocked(getAIClient).mockReturnValue({
      generate: mockGenerate,
    } as any)

    const rounds: DebateRound[] = [createMockRound(1, [createMockMessage('Test')])]

    const result = await generateFinalSynthesis('test-session', 'Pregunta', rounds)

    expect(result).toBeNull()
  })

  it('should return null on JSON parse error', async () => {
    const mockGenerate = vi.fn().mockResolvedValue({
      text: 'Invalid JSON {{{',
    })

    vi.mocked(getAIClient).mockReturnValue({
      generate: mockGenerate,
    } as any)

    const rounds: DebateRound[] = [createMockRound(1, [createMockMessage('Test')])]

    const result = await generateFinalSynthesis('test-session', 'Pregunta', rounds)

    expect(result).toBeNull()
  })

  it('should handle empty rounds array', async () => {
    const mockGenerate = vi.fn().mockResolvedValue({
      text: JSON.stringify(mockSynthesis),
    })

    vi.mocked(getAIClient).mockReturnValue({
      generate: mockGenerate,
    } as any)

    const result = await generateFinalSynthesis('test-session', 'Pregunta', [])

    expect(result).not.toBeNull()
    expect(mockGenerate).toHaveBeenCalled()
  })

  it('should include consensus data in prompt when available', async () => {
    const mockGenerate = vi.fn().mockResolvedValue({
      text: JSON.stringify(mockSynthesis),
    })

    vi.mocked(getAIClient).mockReturnValue({
      generate: mockGenerate,
    } as any)

    const rounds: DebateRound[] = [
      {
        round: 1,
        messages: [createMockMessage('Test')],
        consensusCheck: {
          hasConsensus: false,
          consensusScore: 0.8,
          topOptions: [
            {
              option: 'Test Option',
              successRate: 80,
              pros: [],
              cons: [],
              supporters: [],
              confidence: 0.8,
            },
          ],
          shouldContinue: true,
          reasoning: 'Test',
        },
      },
    ]

    await generateFinalSynthesis('test-session', 'Pregunta', rounds)

    const promptUsed = mockGenerate.mock.calls[0]?.[0] as string
    expect(promptUsed).toContain('Consenso:')
    expect(promptUsed).toContain('Test Option')
    expect(promptUsed).toContain('80%')
  })

  it('should use correct model configuration', async () => {
    const mockGenerate = vi.fn().mockResolvedValue({
      text: JSON.stringify(mockSynthesis),
    })

    vi.mocked(getAIClient).mockReturnValue({
      generate: mockGenerate,
    } as any)

    const rounds: DebateRound[] = [createMockRound(1, [createMockMessage('Test')])]

    await generateFinalSynthesis('test-session', 'Pregunta', rounds)

    expect(mockGenerate).toHaveBeenCalledWith(expect.any(String), {
      modelId: 'gpt-4o',
      temperature: 0.2,
      maxTokens: 2000,
      responseFormat: 'json',
    })
  })
})

// ============================================================================
// EXTRACT SYNTHESIS INSIGHTS TESTS
// ============================================================================

describe('extractSynthesisInsights', () => {
  it('should extract correct insights from synthesis', () => {
    const insights = extractSynthesisInsights(mockSynthesis)

    expect(insights.recommendation).toBe('Opción A')
    expect(insights.successRate).toBe(85)
    expect(insights.nextStep).toBe('Formar equipo de proyecto')
    expect(insights.quality).toBe('Excelente') // avg: (85+90+75)/3 = 83.33 → "Excelente"
  })

  it('should calculate quality as "Excelente" for avg >= 80', () => {
    const synthesis: FinalSynthesis = {
      ...mockSynthesis,
      debateQuality: {
        convergenceScore: 85,
        depthScore: 85,
        diversityScore: 80,
      },
    }

    const insights = extractSynthesisInsights(synthesis)
    expect(insights.quality).toBe('Excelente')
  })

  it('should calculate quality as "Bueno" for 60 <= avg < 80', () => {
    const synthesis: FinalSynthesis = {
      ...mockSynthesis,
      debateQuality: {
        convergenceScore: 70,
        depthScore: 70,
        diversityScore: 65,
      },
    }

    const insights = extractSynthesisInsights(synthesis)
    expect(insights.quality).toBe('Bueno')
  })

  it('should calculate quality as "Mejorable" for avg < 60', () => {
    const synthesis: FinalSynthesis = {
      ...mockSynthesis,
      debateQuality: {
        convergenceScore: 50,
        depthScore: 55,
        diversityScore: 45,
      },
    }

    const insights = extractSynthesisInsights(synthesis)
    expect(insights.quality).toBe('Mejorable')
  })

  it('should handle recommendation not in top3Options', () => {
    const synthesis: FinalSynthesis = {
      ...mockSynthesis,
      recommendation: {
        ...mockSynthesis.recommendation,
        option: 'Opción D', // No existe en top3Options
      },
    }

    const insights = extractSynthesisInsights(synthesis)

    // Should fallback to first option
    expect(insights.recommendation).toBe('Opción D')
    expect(insights.successRate).toBe(85) // From first option
  })

  it('should handle empty nextSteps array', () => {
    const synthesis: FinalSynthesis = {
      ...mockSynthesis,
      recommendation: {
        ...mockSynthesis.recommendation,
        nextSteps: [],
      },
    }

    const insights = extractSynthesisInsights(synthesis)
    expect(insights.nextStep).toBe('No next steps defined')
  })

  it('should correctly round average quality score', () => {
    const synthesis: FinalSynthesis = {
      ...mockSynthesis,
      debateQuality: {
        convergenceScore: 79,
        depthScore: 80,
        diversityScore: 81,
      },
    }

    const insights = extractSynthesisInsights(synthesis)
    // avg = (79+80+81)/3 = 80.0 → "Excelente"
    expect(insights.quality).toBe('Excelente')
  })

  it('should find correct option by name match', () => {
    const synthesis: FinalSynthesis = {
      ...mockSynthesis,
      recommendation: {
        ...mockSynthesis.recommendation,
        option: 'Opción B',
      },
    }

    const insights = extractSynthesisInsights(synthesis)
    expect(insights.recommendation).toBe('Opción B')
    expect(insights.successRate).toBe(70) // From Opción B
  })
})

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Final Synthesis Integration', () => {
  it('should handle complete synthesis flow', async () => {
    const mockGenerate = vi.fn().mockResolvedValue({
      text: JSON.stringify(mockSynthesis),
    })

    vi.mocked(getAIClient).mockReturnValue({
      generate: mockGenerate,
    } as any)

    const rounds: DebateRound[] = [
      createMockRound(1, [
        createMockMessage('Propongo A', 'Optimista'),
        createMockMessage('Riesgos de A', 'Crítico', 'critic'),
        createMockMessage('Análisis de A', 'Analista', 'analyst'),
        createMockMessage('Consenso en A', 'Sintetizador', 'synthesizer'),
      ]),
    ]

    // Generate synthesis
    const result = await generateFinalSynthesis(
      'test-session',
      '¿Cuál es la mejor opción?',
      rounds
    )
    const synthesis = result?.synthesis

    expect(synthesis).not.toBeNull()

    // Extract insights
    const insights = extractSynthesisInsights(synthesis!)

    expect(insights.recommendation).toBeTruthy()
    expect(insights.successRate).toBeGreaterThan(0)
    expect(insights.nextStep).toBeTruthy()
    expect(insights.quality).toBeTruthy()
  })

  it('should gracefully handle AI failures without breaking', async () => {
    const mockGenerate = vi.fn().mockRejectedValue(new Error('API timeout'))

    vi.mocked(getAIClient).mockReturnValue({
      generate: mockGenerate,
    } as any)

    const rounds: DebateRound[] = [createMockRound(1, [createMockMessage('Test')])]

    // Should not throw, should return null
    const synthesis = await generateFinalSynthesis('test-session', 'Pregunta', rounds)

    expect(synthesis).toBeNull()
    expect(mockGenerate).toHaveBeenCalled()
  })
})
