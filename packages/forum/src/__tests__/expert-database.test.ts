/**
 * Tests for Expert Database
 */

import { describe, it, expect } from 'vitest'
import {
  getExpert,
  getAllExperts,
  getExpertsByExpertise,
  getExpertsByTopic,
  getExpertsByIds,
  getExpertCount,
} from '../expert-database'

describe('Expert Database', () => {
  describe('getExpert', () => {
    it('should return expert by ID', () => {
      const expert = getExpert('april_dunford')
      expect(expert).toBeDefined()
      expect(expert?.name).toBe('April Dunford')
      expect(expert?.title).toBe('Positioning Expert')
    })

    it('should return undefined for non-existent expert', () => {
      const expert = getExpert('non_existent')
      expect(expert).toBeUndefined()
    })
  })

  describe('getAllExperts', () => {
    it('should return all experts', () => {
      const experts = getAllExperts()
      expect(experts.length).toBeGreaterThan(0)
      expect(experts.every((e) => e.id && e.name && e.expertise)).toBe(true)
    })

    it('should include all key experts', () => {
      const experts = getAllExperts()
      const expertIds = experts.map((e) => e.id)

      expect(expertIds).toContain('april_dunford')
      expect(expertIds).toContain('patrick_campbell')
      expect(expertIds).toContain('alex_hormozi')
      expect(expertIds).toContain('critic')
    })
  })

  describe('getExpertsByExpertise', () => {
    it('should find experts by exact expertise match', () => {
      const experts = getExpertsByExpertise('pricing')
      expect(experts.length).toBeGreaterThan(0)
      expect(experts.some((e) => e.id === 'patrick_campbell')).toBe(true)
    })

    it('should find experts by partial expertise match', () => {
      const experts = getExpertsByExpertise('market')
      expect(experts.length).toBeGreaterThan(0)
      expect(experts.some((e) => e.expertise.some((ex) => ex.includes('marketing')))).toBe(true)
    })

    it('should be case insensitive', () => {
      const experts1 = getExpertsByExpertise('PRICING')
      const experts2 = getExpertsByExpertise('pricing')
      expect(experts1.length).toBe(experts2.length)
    })

    it('should return empty array for non-existent expertise', () => {
      const experts = getExpertsByExpertise('nonexistent123')
      expect(experts).toEqual([])
    })
  })

  describe('getExpertsByTopic', () => {
    it('should find experts by exact topic match', () => {
      const experts = getExpertsByTopic('SaaS')
      expect(experts.length).toBeGreaterThan(0)
    })

    it('should find experts by partial topic match', () => {
      const experts = getExpertsByTopic('B2B')
      expect(experts.length).toBeGreaterThan(0)
    })

    it('should be case insensitive', () => {
      const experts1 = getExpertsByTopic('SAAS')
      const experts2 = getExpertsByTopic('saas')
      expect(experts1.length).toBe(experts2.length)
    })

    it('should return empty array for non-existent topic', () => {
      const experts = getExpertsByTopic('nonexistent123')
      expect(experts).toEqual([])
    })
  })

  describe('getExpertsByIds', () => {
    it('should return experts for valid IDs', () => {
      const experts = getExpertsByIds(['april_dunford', 'patrick_campbell'])
      expect(experts).toHaveLength(2)
      expect(experts[0]?.id).toBe('april_dunford')
      expect(experts[1]?.id).toBe('patrick_campbell')
    })

    it('should filter out invalid IDs', () => {
      const experts = getExpertsByIds(['april_dunford', 'invalid_id', 'patrick_campbell'])
      expect(experts).toHaveLength(2)
      expect(experts.every((e) => e.id !== 'invalid_id')).toBe(true)
    })

    it('should return empty array for all invalid IDs', () => {
      const experts = getExpertsByIds(['invalid1', 'invalid2'])
      expect(experts).toEqual([])
    })

    it('should return empty array for empty input', () => {
      const experts = getExpertsByIds([])
      expect(experts).toEqual([])
    })
  })

  describe('getExpertCount', () => {
    it('should return correct count of experts', () => {
      const count = getExpertCount()
      const allExperts = getAllExperts()
      expect(count).toBe(allExperts.length)
      expect(count).toBeGreaterThan(10) // Should have at least 10 experts
    })
  })

  describe('EXPERT_DATABASE structure', () => {
    it('should have valid structure for all experts', () => {
      const experts = getAllExperts()

      for (const expert of experts) {
        // Required fields
        expect(expert.id).toBeDefined()
        expect(expert.name).toBeDefined()
        expect(expert.title).toBeDefined()
        expect(expert.expertise).toBeDefined()
        expect(expert.topics).toBeDefined()
        expect(expert.perspective).toBeDefined()
        expect(expert.systemPrompt).toBeDefined()
        expect(expert.temperature).toBeDefined()
        expect(expert.provider).toBeDefined()
        expect(expert.modelId).toBeDefined()

        // Type checks
        expect(typeof expert.id).toBe('string')
        expect(typeof expert.name).toBe('string')
        expect(typeof expert.title).toBe('string')
        expect(Array.isArray(expert.expertise)).toBe(true)
        expect(Array.isArray(expert.topics)).toBe(true)
        expect(typeof expert.perspective).toBe('string')
        expect(typeof expert.systemPrompt).toBe('string')
        expect(typeof expert.temperature).toBe('number')
        expect(['openai', 'anthropic', 'deepseek']).toContain(expert.provider)
        expect(typeof expert.modelId).toBe('string')

        // Value checks
        expect(expert.expertise.length).toBeGreaterThan(0)
        expect(expert.topics.length).toBeGreaterThan(0)
        expect(expert.temperature).toBeGreaterThanOrEqual(0)
        expect(expert.temperature).toBeLessThanOrEqual(1)
        expect(expert.systemPrompt.length).toBeGreaterThan(50)
      }
    })

    it('should have unique expert IDs', () => {
      const experts = getAllExperts()
      const ids = experts.map((e) => e.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have critic expert', () => {
      const critic = getExpert('critic')
      expect(critic).toBeDefined()
      expect(critic?.expertise).toContain('critical thinking')
    })

    it('should have key domain experts', () => {
      // Go-to-Market
      expect(getExpert('april_dunford')).toBeDefined()
      expect(getExpert('peep_laja')).toBeDefined()
      expect(getExpert('steli_efti')).toBeDefined()

      // Pricing
      expect(getExpert('patrick_campbell')).toBeDefined()
      expect(getExpert('alex_hormozi')).toBeDefined()
      expect(getExpert('tomasz_tunguz')).toBeDefined()

      // Product
      expect(getExpert('rahul_vohra')).toBeDefined()
      expect(getExpert('lenny_rachitsky')).toBeDefined()

      // Growth
      expect(getExpert('brian_balfour')).toBeDefined()

      // AI
      expect(getExpert('andrej_karpathy')).toBeDefined()
      expect(getExpert('simon_willison')).toBeDefined()
    })
  })
})
