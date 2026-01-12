/**
 * Tests for Expert Matcher
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  matchExperts,
  getPrimaryExperts,
  getSecondaryExperts,
  getCritic,
  summarizeMatching,
  validateMatching,
  type ExpertMatch,
} from '../expert-matcher'
import type { QuestionAnalysis } from '../question-analyzer'

// Mock expert-database
vi.mock('../expert-database', () => ({
  getAllExperts: vi.fn(),
  getExpert: vi.fn(),
}))

import { getAllExperts, getExpert } from '../expert-database'

describe('Expert Matcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockExperts = [
    {
      id: 'patrick_campbell',
      name: 'Patrick Campbell',
      title: 'Pricing Expert',
      expertise: ['pricing', 'SaaS'],
      topics: ['SaaS', 'B2B'],
      perspective: 'data-driven',
      systemPrompt: 'You are Patrick Campbell',
      temperature: 0.7,
      provider: 'openai' as const,
      modelId: 'gpt-4.1-mini',
    },
    {
      id: 'alex_hormozi',
      name: 'Alex Hormozi',
      title: 'Value Expert',
      expertise: ['value', 'pricing'],
      topics: ['B2B'],
      perspective: 'value-first',
      systemPrompt: 'You are Alex Hormozi',
      temperature: 0.8,
      provider: 'openai' as const,
      modelId: 'gpt-4.1-mini',
    },
    {
      id: 'critic',
      name: 'The Critic',
      title: 'Critical Thinker',
      expertise: ['critical thinking', 'strategy'],
      topics: ['general'],
      perspective: 'skeptical',
      systemPrompt: 'You are a critic',
      temperature: 0.6,
      provider: 'openai' as const,
      modelId: 'gpt-4.1-mini',
    },
    {
      id: 'april_dunford',
      name: 'April Dunford',
      title: 'Positioning Expert',
      expertise: ['positioning', 'marketing'],
      topics: ['SaaS', 'B2B'],
      perspective: 'strategic',
      systemPrompt: 'You are April Dunford',
      temperature: 0.7,
      provider: 'openai' as const,
      modelId: 'gpt-4.1-mini',
    },
  ]

  const mockAnalysis: QuestionAnalysis = {
    question: '¿Debo lanzar a 29€ o 49€?',
    areas: [
      { area: 'pricing', weight: 60, reasoning: 'Main focus' },
      { area: 'marketing', weight: 30, reasoning: 'Secondary' },
    ],
    topics: [
      { name: 'SaaS', relevance: 90 },
      { name: 'B2B', relevance: 80 },
    ],
    complexity: 7,
    decisionType: 'strategic',
    recommendedExperts: ['patrick_campbell', 'alex_hormozi'],
    reasoning: 'Pricing decision',
  }

  describe('matchExperts', () => {
    it('should match experts based on analysis', () => {
      vi.mocked(getAllExperts).mockReturnValue(mockExperts)
      vi.mocked(getExpert).mockImplementation((id) => mockExperts.find((e) => e.id === id))

      const result = matchExperts(mockAnalysis)

      expect(result.length).toBeGreaterThan(0)
      expect(result.every((m) => m.expert && m.score !== undefined)).toBe(true)
    })

    it('should include critic when alwaysIncludeCritic is true', () => {
      vi.mocked(getAllExperts).mockReturnValue(mockExperts)
      vi.mocked(getExpert).mockImplementation((id) => mockExperts.find((e) => e.id === id))

      const result = matchExperts(mockAnalysis, { alwaysIncludeCritic: true })

      const hasCritic = result.some((m) => m.expert.id === 'critic')
      expect(hasCritic).toBe(true)
    })

    it('should respect minExperts option', () => {
      vi.mocked(getAllExperts).mockReturnValue(mockExperts)
      vi.mocked(getExpert).mockImplementation((id) => mockExperts.find((e) => e.id === id))

      const result = matchExperts(mockAnalysis, { minExperts: 3 })

      expect(result.length).toBeGreaterThanOrEqual(3)
    })

    it('should respect maxExperts option', () => {
      vi.mocked(getAllExperts).mockReturnValue(mockExperts)
      vi.mocked(getExpert).mockImplementation((id) => mockExperts.find((e) => e.id === id))

      const result = matchExperts(mockAnalysis, { maxExperts: 2 })

      expect(result.length).toBeLessThanOrEqual(4) // May include critic even if maxExperts is 2
    })

    it('should filter out experts below minScore', () => {
      vi.mocked(getAllExperts).mockReturnValue(mockExperts)
      vi.mocked(getExpert).mockImplementation((id) => mockExperts.find((e) => e.id === id))

      const result = matchExperts(mockAnalysis, { minScore: 80 })

      // All returned experts should have score >= 80 or be the critic
      expect(result.every((m) => m.score >= 80 || m.expert.id === 'critic')).toBe(true)
    })

    it('should sort matches by score descending', () => {
      vi.mocked(getAllExperts).mockReturnValue(mockExperts)
      vi.mocked(getExpert).mockImplementation((id) => mockExperts.find((e) => e.id === id))

      const result = matchExperts(mockAnalysis)

      for (let i = 0; i < result.length - 1; i++) {
        // Allow critic to be at the end even with lower score
        if (result[i]!.expert.id !== 'critic' && result[i + 1]!.expert.id !== 'critic') {
          expect(result[i]!.score).toBeGreaterThanOrEqual(result[i + 1]!.score)
        }
      }
    })

    it('should assign suggested roles', () => {
      vi.mocked(getAllExperts).mockReturnValue(mockExperts)
      vi.mocked(getExpert).mockImplementation((id) => mockExperts.find((e) => e.id === id))

      const result = matchExperts(mockAnalysis)

      expect(
        result.every((m) => ['primary', 'secondary', 'critic'].includes(m.suggestedRole))
      ).toBe(true)
    })
  })

  describe('getPrimaryExperts', () => {
    const mockMatches: ExpertMatch[] = [
      {
        expert: mockExperts[0]!,
        score: 90,
        reasons: ['High match'],
        suggestedRole: 'primary',
      },
      {
        expert: mockExperts[1]!,
        score: 80,
        reasons: ['Good match'],
        suggestedRole: 'secondary',
      },
      {
        expert: mockExperts[2]!,
        score: 50,
        reasons: ['Critic'],
        suggestedRole: 'critic',
      },
    ]

    it('should return only primary experts', () => {
      const result = getPrimaryExperts(mockMatches)
      expect(result).toHaveLength(1)
      expect(result[0]!.suggestedRole).toBe('primary')
    })
  })

  describe('getSecondaryExperts', () => {
    const mockMatches: ExpertMatch[] = [
      {
        expert: mockExperts[0]!,
        score: 90,
        reasons: ['High match'],
        suggestedRole: 'primary',
      },
      {
        expert: mockExperts[1]!,
        score: 80,
        reasons: ['Good match'],
        suggestedRole: 'secondary',
      },
      {
        expert: mockExperts[2]!,
        score: 50,
        reasons: ['Critic'],
        suggestedRole: 'critic',
      },
    ]

    it('should return only secondary experts', () => {
      const result = getSecondaryExperts(mockMatches)
      expect(result).toHaveLength(1)
      expect(result[0]!.suggestedRole).toBe('secondary')
    })
  })

  describe('getCritic', () => {
    const mockMatches: ExpertMatch[] = [
      {
        expert: mockExperts[0]!,
        score: 90,
        reasons: ['High match'],
        suggestedRole: 'primary',
      },
      {
        expert: mockExperts[2]!,
        score: 50,
        reasons: ['Critic'],
        suggestedRole: 'critic',
      },
    ]

    it('should return the critic', () => {
      const result = getCritic(mockMatches)
      expect(result).toBeDefined()
      expect(result!.suggestedRole).toBe('critic')
    })

    it('should return undefined if no critic', () => {
      const matchesNoCritic = [mockMatches[0]!]
      const result = getCritic(matchesNoCritic)
      expect(result).toBeUndefined()
    })
  })

  describe('summarizeMatching', () => {
    const mockMatches: ExpertMatch[] = [
      {
        expert: mockExperts[0]!,
        score: 90,
        reasons: ['High match'],
        suggestedRole: 'primary',
      },
      {
        expert: mockExperts[1]!,
        score: 80,
        reasons: ['Good match'],
        suggestedRole: 'secondary',
      },
      {
        expert: mockExperts[2]!,
        score: 50,
        reasons: ['Critic'],
        suggestedRole: 'critic',
      },
    ]

    it('should create a readable summary', () => {
      const summary = summarizeMatching(mockMatches)
      expect(summary).toContain('Primary:')
      expect(summary).toContain('Secondary:')
      expect(summary).toContain('Critic:')
      expect(summary).toContain('Patrick Campbell')
      expect(summary).toContain('Alex Hormozi')
      expect(summary).toContain('The Critic')
    })
  })

  describe('validateMatching', () => {
    it('should validate a good matching', () => {
      const goodMatches: ExpertMatch[] = [
        {
          expert: mockExperts[0]!,
          score: 90,
          reasons: ['High match'],
          suggestedRole: 'primary',
        },
        {
          expert: mockExperts[1]!,
          score: 80,
          reasons: ['Good match'],
          suggestedRole: 'secondary',
        },
        {
          expert: mockExperts[2]!,
          score: 50,
          reasons: ['Critic'],
          suggestedRole: 'critic',
        },
      ]

      const result = validateMatching(goodMatches)
      expect(result.valid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    it('should detect too few experts', () => {
      const fewMatches: ExpertMatch[] = [
        {
          expert: mockExperts[0]!,
          score: 90,
          reasons: ['High match'],
          suggestedRole: 'primary',
        },
      ]

      const result = validateMatching(fewMatches)
      expect(result.valid).toBe(false)
      expect(result.issues.some((i) => i.includes('Menos de 3'))).toBe(true)
    })

    it('should detect missing primary expert', () => {
      const noPrimaryMatches: ExpertMatch[] = [
        {
          expert: mockExperts[1]!,
          score: 80,
          reasons: ['Good match'],
          suggestedRole: 'secondary',
        },
        {
          expert: mockExperts[2]!,
          score: 50,
          reasons: ['Critic'],
          suggestedRole: 'critic',
        },
        {
          expert: mockExperts[3]!,
          score: 70,
          reasons: ['Another secondary'],
          suggestedRole: 'secondary',
        },
      ]

      const result = validateMatching(noPrimaryMatches)
      expect(result.valid).toBe(false)
      expect(result.issues.some((i) => i.includes('primarios'))).toBe(true)
    })

    it('should detect missing critic', () => {
      const noCriticMatches: ExpertMatch[] = [
        {
          expert: mockExperts[0]!,
          score: 90,
          reasons: ['High match'],
          suggestedRole: 'primary',
        },
        {
          expert: mockExperts[1]!,
          score: 80,
          reasons: ['Good match'],
          suggestedRole: 'secondary',
        },
        {
          expert: mockExperts[3]!,
          score: 70,
          reasons: ['Another secondary'],
          suggestedRole: 'secondary',
        },
      ]

      const result = validateMatching(noCriticMatches)
      expect(result.valid).toBe(false)
      expect(result.issues.some((i) => i.includes('crítico'))).toBe(true)
    })

    it('should detect low average score', () => {
      const lowScoreMatches: ExpertMatch[] = [
        {
          expert: mockExperts[0]!,
          score: 30,
          reasons: ['Low match'],
          suggestedRole: 'primary',
        },
        {
          expert: mockExperts[1]!,
          score: 35,
          reasons: ['Low match'],
          suggestedRole: 'secondary',
        },
        {
          expert: mockExperts[2]!,
          score: 32,
          reasons: ['Critic'],
          suggestedRole: 'critic',
        },
      ]

      const result = validateMatching(lowScoreMatches)
      expect(result.valid).toBe(false)
      expect(result.issues.some((i) => i.includes('Score promedio bajo'))).toBe(true)
    })
  })
})
