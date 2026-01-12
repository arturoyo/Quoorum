/**
 * Tests for Question Analyzer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  analyzeQuestion,
  getTopAreas,
  getTopTopics,
  isHighComplexity,
  isStrategic,
  estimateRounds,
  summarizeAnalysis,
  type QuestionAnalysis,
} from '../question-analyzer'

// Mock @forum/ai
vi.mock('@forum/ai', () => ({
  getAIClient: vi.fn(),
}))

import { getAIClient } from '@forum/ai'

describe('Question Analyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('analyzeQuestion', () => {
    it('should analyze a pricing question correctly', async () => {
      const mockResponse = {
        areas: [
          { area: 'pricing', weight: 60, reasoning: 'Main focus' },
          { area: 'marketing', weight: 30, reasoning: 'Secondary' },
          { area: 'technical', weight: 10, reasoning: 'Minor' },
        ],
        topics: [
          { name: 'SaaS', relevance: 90 },
          { name: 'B2B', relevance: 80 },
        ],
        complexity: 7,
        decisionType: 'strategic' as const,
        recommendedExperts: ['patrick_campbell', 'alex_hormozi', 'tomasz_tunguz'],
        reasoning: 'Pricing is strategic decision',
      }

      const mockClient = {
        generate: vi.fn().mockResolvedValue({
          text: JSON.stringify(mockResponse),
          usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        }),
      }
      vi.mocked(getAIClient).mockReturnValue(mockClient as never)

      const result = await analyzeQuestion('¿Debo lanzar a 29€ o 49€?')

      expect(result.question).toBe('¿Debo lanzar a 29€ o 49€?')
      expect(result.areas).toHaveLength(3)
      expect(result.areas[0]!.area).toBe('pricing')
      expect(result.areas[0]!.weight).toBe(60)
      expect(result.complexity).toBe(7)
      expect(result.decisionType).toBe('strategic')
    })

    it('should sort areas by weight descending', async () => {
      const mockResponse = {
        areas: [
          { area: 'technical', weight: 10, reasoning: 'Minor' },
          { area: 'pricing', weight: 60, reasoning: 'Main' },
          { area: 'marketing', weight: 30, reasoning: 'Secondary' },
        ],
        topics: [],
        complexity: 5,
        decisionType: 'tactical' as const,
        recommendedExperts: [],
        reasoning: 'Test',
      }

      const mockClient = {
        generate: vi.fn().mockResolvedValue({
          text: JSON.stringify(mockResponse),
          usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        }),
      }
      vi.mocked(getAIClient).mockReturnValue(mockClient as never)

      const result = await analyzeQuestion('Test question')

      expect(result.areas[0]!.weight).toBe(60)
      expect(result.areas[1]!.weight).toBe(30)
      expect(result.areas[2]!.weight).toBe(10)
    })

    it('should sort topics by relevance descending', async () => {
      const mockResponse = {
        areas: [],
        topics: [
          { name: 'España', relevance: 50 },
          { name: 'SaaS', relevance: 90 },
          { name: 'B2B', relevance: 70 },
        ],
        complexity: 5,
        decisionType: 'tactical' as const,
        recommendedExperts: [],
        reasoning: 'Test',
      }

      const mockClient = {
        generate: vi.fn().mockResolvedValue({
          text: JSON.stringify(mockResponse),
          usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        }),
      }
      vi.mocked(getAIClient).mockReturnValue(mockClient as never)

      const result = await analyzeQuestion('Test question')

      expect(result.topics[0]!.relevance).toBe(90)
      expect(result.topics[1]!.relevance).toBe(70)
      expect(result.topics[2]!.relevance).toBe(50)
    })

    it('should include context in prompt when provided', async () => {
      const mockResponse = {
        areas: [],
        topics: [],
        complexity: 5,
        decisionType: 'tactical' as const,
        recommendedExperts: [],
        reasoning: 'Test',
      }

      const mockClient = {
        generate: vi.fn().mockResolvedValue({
          text: JSON.stringify(mockResponse),
          usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        }),
      }
      vi.mocked(getAIClient).mockReturnValue(mockClient as never)

      await analyzeQuestion('Test question', 'Custom context')

      expect(mockClient.generate).toHaveBeenCalledWith(
        expect.stringContaining('Custom context'),
        expect.any(Object)
      )
    })
  })

  describe('getTopAreas', () => {
    const mockAnalysis: QuestionAnalysis = {
      question: 'Test',
      areas: [
        { area: 'pricing', weight: 60, reasoning: 'Main' },
        { area: 'marketing', weight: 30, reasoning: 'Secondary' },
        { area: 'technical', weight: 10, reasoning: 'Minor' },
        { area: 'legal', weight: 5, reasoning: 'Minimal' },
      ],
      topics: [],
      complexity: 5,
      decisionType: 'tactical',
      recommendedExperts: [],
      reasoning: 'Test',
    }

    it('should return top 3 areas by default', () => {
      const result = getTopAreas(mockAnalysis)
      expect(result).toHaveLength(3)
      expect(result[0]!.area).toBe('pricing')
      expect(result[1]!.area).toBe('marketing')
      expect(result[2]!.area).toBe('technical')
    })

    it('should return custom number of areas', () => {
      const result = getTopAreas(mockAnalysis, 2)
      expect(result).toHaveLength(2)
      expect(result[0]!.area).toBe('pricing')
      expect(result[1]!.area).toBe('marketing')
    })
  })

  describe('getTopTopics', () => {
    const mockAnalysis: QuestionAnalysis = {
      question: 'Test',
      areas: [],
      topics: [
        { name: 'SaaS', relevance: 90 },
        { name: 'B2B', relevance: 80 },
        { name: 'España', relevance: 70 },
      ],
      complexity: 5,
      decisionType: 'tactical',
      recommendedExperts: [],
      reasoning: 'Test',
    }

    it('should return top 5 topics by default', () => {
      const result = getTopTopics(mockAnalysis)
      expect(result).toHaveLength(3) // Only 3 topics in mock
    })

    it('should return custom number of topics', () => {
      const result = getTopTopics(mockAnalysis, 2)
      expect(result).toHaveLength(2)
      expect(result[0]!.name).toBe('SaaS')
      expect(result[1]!.name).toBe('B2B')
    })
  })

  describe('isHighComplexity', () => {
    it('should return true for complexity >= 7', () => {
      const analysis: QuestionAnalysis = {
        question: 'Test',
        areas: [],
        topics: [],
        complexity: 7,
        decisionType: 'strategic',
        recommendedExperts: [],
        reasoning: 'Test',
      }
      expect(isHighComplexity(analysis)).toBe(true)
    })

    it('should return false for complexity < 7', () => {
      const analysis: QuestionAnalysis = {
        question: 'Test',
        areas: [],
        topics: [],
        complexity: 6,
        decisionType: 'tactical',
        recommendedExperts: [],
        reasoning: 'Test',
      }
      expect(isHighComplexity(analysis)).toBe(false)
    })
  })

  describe('isStrategic', () => {
    it('should return true for strategic decisions', () => {
      const analysis: QuestionAnalysis = {
        question: 'Test',
        areas: [],
        topics: [],
        complexity: 7,
        decisionType: 'strategic',
        recommendedExperts: [],
        reasoning: 'Test',
      }
      expect(isStrategic(analysis)).toBe(true)
    })

    it('should return false for non-strategic decisions', () => {
      const analysis: QuestionAnalysis = {
        question: 'Test',
        areas: [],
        topics: [],
        complexity: 5,
        decisionType: 'tactical',
        recommendedExperts: [],
        reasoning: 'Test',
      }
      expect(isStrategic(analysis)).toBe(false)
    })
  })

  describe('estimateRounds', () => {
    it('should estimate 3-5 rounds for low complexity', () => {
      const analysis: QuestionAnalysis = {
        question: 'Test',
        areas: [],
        topics: [],
        complexity: 3,
        decisionType: 'operational',
        recommendedExperts: [],
        reasoning: 'Test',
      }
      const rounds = estimateRounds(analysis)
      expect(rounds).toBeGreaterThanOrEqual(3)
      expect(rounds).toBeLessThanOrEqual(5)
    })

    it('should estimate 5-10 rounds for medium complexity', () => {
      const analysis: QuestionAnalysis = {
        question: 'Test',
        areas: [],
        topics: [],
        complexity: 5,
        decisionType: 'tactical',
        recommendedExperts: [],
        reasoning: 'Test',
      }
      const rounds = estimateRounds(analysis)
      expect(rounds).toBeGreaterThanOrEqual(5)
      expect(rounds).toBeLessThanOrEqual(10)
    })

    it('should estimate 10-20 rounds for high complexity', () => {
      const analysis: QuestionAnalysis = {
        question: 'Test',
        areas: [],
        topics: [],
        complexity: 8,
        decisionType: 'strategic',
        recommendedExperts: [],
        reasoning: 'Test',
      }
      const rounds = estimateRounds(analysis)
      expect(rounds).toBeGreaterThanOrEqual(10)
      expect(rounds).toBeLessThanOrEqual(20)
    })
  })

  describe('summarizeAnalysis', () => {
    it('should create a readable summary', () => {
      const analysis: QuestionAnalysis = {
        question: 'Test',
        areas: [
          { area: 'pricing', weight: 60, reasoning: 'Main' },
          { area: 'marketing', weight: 30, reasoning: 'Secondary' },
        ],
        topics: [
          { name: 'SaaS', relevance: 90 },
          { name: 'B2B', relevance: 80 },
        ],
        complexity: 7,
        decisionType: 'strategic',
        recommendedExperts: [],
        reasoning: 'Test',
      }

      const summary = summarizeAnalysis(analysis)

      expect(summary).toContain('Complejidad: 7/10')
      expect(summary).toContain('Tipo: strategic')
      expect(summary).toContain('pricing (60%)')
      expect(summary).toContain('SaaS')
    })
  })
})
