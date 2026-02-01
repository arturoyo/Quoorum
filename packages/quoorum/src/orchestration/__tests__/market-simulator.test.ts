/**
 * Unit Tests for Market Simulator Orchestration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  runMarketSimulation,
  type BuyerPersona,
  type MarketSimulationInput,
} from '../market-simulator'

// Mock AI client
vi.mock('@quoorum/ai', () => ({
  callAI: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      frictionScore: 5,
      rejectionArgument: 'Mocked friction analysis for this variant',
      jobAlignment: 7,
      barrierReduction: 6,
    }),
    usage: {
      inputTokens: 500,
      outputTokens: 200,
      totalTokens: 700,
    },
    model: 'gpt-4o-mini',
    finishReason: 'stop',
  }),
}))

// Mock logger
vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('Market Simulator Orchestration', () => {
  const mockBuyerPersona: BuyerPersona = {
    id: 'persona-1',
    name: 'CFO Fintech',
    psychographics: {
      jobsToBeDone: [
        'Reducir tiempo en decisiones estratégicas',
        'Mejorar ROI de consultoras',
      ],
      motivations: ['Eficiencia operacional', 'Control de costes'],
      barriers: ['Falta de tiempo', 'Desconfianza en soluciones black box'],
    },
  }

  const mockVariant = 'Toma decisiones estratégicas en minutos, sin consultoras'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // NOTE: evaluateVariantWithPersona and synthesizeResults are internal functions
  // We only test the public API (runMarketSimulation) which uses them internally

  describe('runMarketSimulation', () => {
    const mockInput: MarketSimulationInput = {
      variants: [
        'Toma decisiones estratégicas en minutos',
        'IA que debate por ti',
        'Convierte decisiones en insights',
      ],
      buyerPersonas: [
        {
          id: 'persona-1',
          name: 'CFO Fintech',
          psychographics: {
            jobsToBeDone: ['Reducir tiempo'],
            motivations: ['Eficiencia'],
            barriers: ['Falta de tiempo'],
          },
        },
        {
          id: 'persona-2',
          name: 'Product Manager',
          psychographics: {
            jobsToBeDone: ['Validar features'],
            motivations: ['Velocidad'],
            barriers: ['User research lento'],
          },
        },
      ],
      userId: 'user-123',
    }

    it('should return a complete simulation result', async () => {
      const result = await runMarketSimulation(mockInput)

      expect(result).toHaveProperty('winningVariant')
      expect(result).toHaveProperty('frictionMap')
      expect(result).toHaveProperty('synthesis')
      expect(result).toHaveProperty('costBreakdown')
      expect(result).toHaveProperty('executionTime')
    })

    it('should identify a winning variant', async () => {
      const result = await runMarketSimulation(mockInput)

      expect(result.winningVariant.index).toBeGreaterThanOrEqual(0)
      expect(result.winningVariant.index).toBeLessThan(mockInput.variants.length)
      expect(result.winningVariant.text).toBe(mockInput.variants[result.winningVariant.index])
    })

    it('should have consensus score between 0-100', async () => {
      const result = await runMarketSimulation(mockInput)

      expect(result.winningVariant.consensusScore).toBeGreaterThanOrEqual(0)
      expect(result.winningVariant.consensusScore).toBeLessThanOrEqual(100)
    })

    it('should have average friction between 1-10', async () => {
      const result = await runMarketSimulation(mockInput)

      expect(result.winningVariant.avgFriction).toBeGreaterThanOrEqual(1)
      expect(result.winningVariant.avgFriction).toBeLessThanOrEqual(10)
    })

    it('should evaluate all variant-persona combinations', async () => {
      const result = await runMarketSimulation(mockInput)

      const expectedCombinations = mockInput.variants.length * mockInput.buyerPersonas.length
      expect(result.frictionMap.length).toBe(expectedCombinations)
    })

    it('should track costs correctly', async () => {
      const result = await runMarketSimulation(mockInput)

      expect(result.costBreakdown.evaluationCost).toBeGreaterThan(0)
      expect(result.costBreakdown.synthesisCost).toBeGreaterThan(0)
      expect(result.costBreakdown.totalCost).toBe(
        result.costBreakdown.evaluationCost + result.costBreakdown.synthesisCost
      )
      expect(result.costBreakdown.totalTokens).toBeGreaterThan(0)
    })

    it('should measure execution time', async () => {
      const result = await runMarketSimulation(mockInput)

      expect(result.executionTime).toBeGreaterThanOrEqual(0) // Can be 0 with fast mocks
      expect(result.executionTime).toBeLessThan(120000) // Less than 2 minutes
    })

    it('should handle context parameter', async () => {
      const inputWithContext = {
        ...mockInput,
        context: 'Lanzamiento B2B SaaS para fintech',
      }

      const result = await runMarketSimulation(inputWithContext)

      expect(result).toBeDefined()
      expect(result.winningVariant).toBeDefined()
    })

    it('should handle minimum variants (2)', async () => {
      const minInput: MarketSimulationInput = {
        variants: ['Variante 1', 'Variante 2'],
        buyerPersonas: [mockInput.buyerPersonas[0]],
        userId: 'user-123',
      }

      const result = await runMarketSimulation(minInput)

      expect(result.frictionMap.length).toBe(2)
    })

    it('should handle maximum variants (5)', async () => {
      const maxInput: MarketSimulationInput = {
        variants: ['V1', 'V2', 'V3', 'V4', 'V5'],
        buyerPersonas: [mockInput.buyerPersonas[0]],
        userId: 'user-123',
      }

      const result = await runMarketSimulation(maxInput)

      expect(result.frictionMap.length).toBe(5)
    })

    it('should reject invalid input - no variants', async () => {
      const invalidInput = {
        ...mockInput,
        variants: [],
      }

      await expect(runMarketSimulation(invalidInput)).rejects.toThrow()
    })

    it('should reject invalid input - no personas', async () => {
      const invalidInput = {
        ...mockInput,
        buyerPersonas: [],
      }

      await expect(runMarketSimulation(invalidInput)).rejects.toThrow()
    })

    it('should include company context when provided', async () => {
      const inputWithCompany = {
        ...mockInput,
        companyId: 'company-456',
      }

      const result = await runMarketSimulation(inputWithCompany)

      expect(result).toBeDefined()
    })
  })

  // Edge cases and performance tests are covered by testing runMarketSimulation
})
