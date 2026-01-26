/**
 * Tests for Forum Consensus Detection
 */

import { describe, it, expect, vi } from 'vitest'
import { calculateConsensusScore } from '../consensus'
import type { RankedOption } from '../types'

// Mock @quoorum/ai
vi.mock('@quoorum/ai', () => ({
  getAIClient: vi.fn(() => ({
    generate: vi.fn(),
  })),
}))

describe('Forum Consensus', () => {
  describe('calculateConsensusScore', () => {
    it('should return 0 for empty options', () => {
      const score = calculateConsensusScore([])
      expect(score).toBe(0)
    })

    it('should return success rate for single option', () => {
      const options: RankedOption[] = [
        {
          option: 'Option A',
          successRate: 80,
          pros: ['pro1'],
          cons: ['con1'],
          supporters: ['Optimista', 'Analista'],
          confidence: 0.8,
        },
      ]
      const score = calculateConsensusScore(options)
      expect(score).toBe(0.8)
    })

    it('should calculate score based on success rate, gap, and supporters', () => {
      const options: RankedOption[] = [
        {
          option: 'Option A',
          successRate: 80,
          pros: ['pro1'],
          cons: ['con1'],
          supporters: ['Optimista', 'Analista'],
          confidence: 0.8,
        },
        {
          option: 'Option B',
          successRate: 50,
          pros: ['pro1'],
          cons: ['con1'],
          supporters: ['Critico'],
          confidence: 0.5,
        },
      ]
      const score = calculateConsensusScore(options)

      // Score = 0.8 * 0.5 (success) + 0.3 * 0.3 (gap) + 0.5 * 0.2 (supporters)
      // Score = 0.4 + 0.09 + 0.1 = 0.59
      expect(score).toBeCloseTo(0.59, 2)
    })

    it('should give higher score for strong consensus', () => {
      const strongConsensus: RankedOption[] = [
        {
          option: 'Option A',
          successRate: 90,
          pros: ['pro1'],
          cons: [],
          supporters: ['Optimista', 'Analista', 'Critico'],
          confidence: 0.9,
        },
        {
          option: 'Option B',
          successRate: 40,
          pros: [],
          cons: ['con1'],
          supporters: ['Sintetizador'],
          confidence: 0.4,
        },
      ]

      const weakConsensus: RankedOption[] = [
        {
          option: 'Option A',
          successRate: 60,
          pros: ['pro1'],
          cons: ['con1'],
          supporters: ['Optimista'],
          confidence: 0.6,
        },
        {
          option: 'Option B',
          successRate: 55,
          pros: ['pro1'],
          cons: ['con1'],
          supporters: ['Analista', 'Critico'],
          confidence: 0.55,
        },
      ]

      const strongScore = calculateConsensusScore(strongConsensus)
      const weakScore = calculateConsensusScore(weakConsensus)

      expect(strongScore).toBeGreaterThan(weakScore)
    })

    it('should handle options with no supporters', () => {
      const options: RankedOption[] = [
        {
          option: 'Option A',
          successRate: 70,
          pros: ['pro1'],
          cons: ['con1'],
          supporters: [],
          confidence: 0.7,
        },
        {
          option: 'Option B',
          successRate: 50,
          pros: ['pro1'],
          cons: ['con1'],
          supporters: [],
          confidence: 0.5,
        },
      ]
      const score = calculateConsensusScore(options)

      // Score = 0.7 * 0.5 (success) + 0.2 * 0.3 (gap) + (1/4) * 0.2 (supporters default to 1)
      // Score = 0.35 + 0.06 + 0.05 = 0.46
      // Note: Empty supporters array defaults to 1 in the implementation
      expect(score).toBeCloseTo(0.46, 2)
    })

    it('should be between 0 and 1', () => {
      const options: RankedOption[] = [
        {
          option: 'Option A',
          successRate: 100,
          pros: ['pro1'],
          cons: [],
          supporters: ['Optimista', 'Analista', 'Critico', 'Sintetizador'],
          confidence: 1.0,
        },
        {
          option: 'Option B',
          successRate: 0,
          pros: [],
          cons: ['con1'],
          supporters: [],
          confidence: 0,
        },
      ]
      const score = calculateConsensusScore(options)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })
  })

  // Note: checkConsensus and rankOptions tests would require mocking the AI client
  // and are better suited for integration tests. For now, we focus on pure functions.
})
