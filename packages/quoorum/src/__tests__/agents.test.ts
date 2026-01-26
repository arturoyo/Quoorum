/**
 * Tests for Forum Agents
 */

import { describe, it, expect } from 'vitest'
import {
  QUOORUM_AGENTS,
  AGENT_ORDER,
  getAgent,
  getAgentsByRole,
  getAllAgents,
  getAgentName,
  estimateAgentCost,
  estimateDebateCost,
} from '../agents'
import type { AgentRole } from '../types'

describe('Forum Agents', () => {
  describe('QUOORUM_AGENTS configuration', () => {
    it('should have 4 agents configured', () => {
      expect(Object.keys(QUOORUM_AGENTS)).toHaveLength(4)
    })

    it('should have all required agents', () => {
      expect(QUOORUM_AGENTS['optimizer']).toBeDefined()
      expect(QUOORUM_AGENTS['critic']).toBeDefined()
      expect(QUOORUM_AGENTS['analyst']).toBeDefined()
      expect(QUOORUM_AGENTS['synthesizer']).toBeDefined()
    })

    it('should have valid agent configurations', () => {
      Object.values(QUOORUM_AGENTS).forEach((agent) => {
        expect(agent.key).toBeTruthy()
        expect(agent.name).toBeTruthy()
        expect(agent.role).toBeTruthy()
        expect(agent.prompt).toBeTruthy()
        expect(agent.provider).toBeTruthy()
        expect(agent.model).toBeTruthy()
        expect(agent.temperature).toBeGreaterThanOrEqual(0)
        expect(agent.temperature).toBeLessThanOrEqual(1)
      })
    })

    it('should use correct providers', () => {
      // Default configuration uses free tier (google) or cost-optimized models
      // These can be overridden via environment variables
      expect(QUOORUM_AGENTS['optimizer']!.provider).toBe('google')
      expect(QUOORUM_AGENTS['critic']!.provider).toBe('google')
      expect(QUOORUM_AGENTS['analyst']!.provider).toBe('google')
      expect(QUOORUM_AGENTS['synthesizer']!.provider).toBe('openai')
    })

    it('should have appropriate temperatures', () => {
      // Optimizer should be more creative
      expect(QUOORUM_AGENTS['optimizer']!.temperature).toBeGreaterThan(0.5)

      // Critic should be balanced
      expect(QUOORUM_AGENTS['critic']!.temperature).toBe(0.5)

      // Analyst should be deterministic
      expect(QUOORUM_AGENTS['analyst']!.temperature).toBeLessThanOrEqual(0.3)

      // Synthesizer should be deterministic
      expect(QUOORUM_AGENTS['synthesizer']!.temperature).toBeLessThanOrEqual(0.3)
    })
  })

  describe('AGENT_ORDER', () => {
    it('should have 4 agents in order', () => {
      expect(AGENT_ORDER).toHaveLength(4)
    })

    it('should follow correct debate order', () => {
      expect(AGENT_ORDER[0]).toBe('optimizer')
      expect(AGENT_ORDER[1]).toBe('critic')
      expect(AGENT_ORDER[2]).toBe('analyst')
      expect(AGENT_ORDER[3]).toBe('synthesizer')
    })
  })

  describe('getAgent', () => {
    it('should return agent by key', () => {
      const agent = getAgent('optimizer')
      expect(agent).toBeDefined()
      expect(agent?.key).toBe('optimizer')
      expect(agent?.name).toBe('Optimista')
    })

    it('should return undefined for invalid key', () => {
      const agent = getAgent('invalid')
      expect(agent).toBeUndefined()
    })
  })

  describe('getAgentsByRole', () => {
    it('should return agents by role', () => {
      const optimizers = getAgentsByRole('optimizer' as AgentRole)
      expect(optimizers).toHaveLength(1)
      expect(optimizers[0]?.key).toBe('optimizer')
    })

    it('should return empty array for non-existent role', () => {
      const agents = getAgentsByRole('nonexistent' as AgentRole)
      expect(agents).toHaveLength(0)
    })
  })

  describe('getAllAgents', () => {
    it('should return all 4 agents', () => {
      const agents = getAllAgents()
      expect(agents).toHaveLength(4)
    })

    it('should return agents with all required properties', () => {
      const agents = getAllAgents()
      agents.forEach((agent) => {
        expect(agent.key).toBeTruthy()
        expect(agent.name).toBeTruthy()
        expect(agent.role).toBeTruthy()
        expect(agent.prompt).toBeTruthy()
      })
    })
  })

  describe('getAgentName', () => {
    it('should return agent name by key', () => {
      expect(getAgentName('optimizer')).toBe('Optimista')
      expect(getAgentName('critic')).toBe('Crítico')
      expect(getAgentName('analyst')).toBe('Analista')
      expect(getAgentName('synthesizer')).toBe('Sintetizador')
    })

    it('should return key for invalid agent', () => {
      expect(getAgentName('invalid')).toBe('invalid')
    })
  })

  describe('estimateAgentCost', () => {
    it('should estimate cost for google free tier agent', () => {
      // Default config uses gemini-2.0-flash-exp (free tier)
      const agent = QUOORUM_AGENTS['optimizer']!
      const cost = estimateAgentCost(agent, 1_000_000)
      expect(cost).toBe(0.0) // Free tier
    })

    it('should estimate cost for google free tier critic', () => {
      // Default config uses gemini-2.0-flash-exp (free tier)
      const agent = QUOORUM_AGENTS['critic']!
      const cost = estimateAgentCost(agent, 1_000_000)
      expect(cost).toBe(0.0) // Free tier
    })

    it('should estimate cost for openai synthesizer', () => {
      // Default config uses gpt-4o-mini
      const agent = QUOORUM_AGENTS['synthesizer']!
      const cost = estimateAgentCost(agent, 1_000_000)
      expect(cost).toBe(0.15) // gpt-4o-mini rate
    })

    it('should scale cost proportionally', () => {
      const agent = QUOORUM_AGENTS['optimizer']!
      const cost500k = estimateAgentCost(agent, 500_000)
      const cost1m = estimateAgentCost(agent, 1_000_000)
      expect(cost1m).toBe(cost500k * 2)
    })

    it('should handle zero tokens', () => {
      const agent = QUOORUM_AGENTS['optimizer']!
      const cost = estimateAgentCost(agent, 0)
      expect(cost).toBe(0)
    })
  })

  describe('estimateDebateCost', () => {
    it('should estimate total debate cost', () => {
      const cost = estimateDebateCost(100, 5)
      expect(cost).toBeGreaterThan(0)
    })

    it('should scale with number of rounds', () => {
      const cost5 = estimateDebateCost(100, 5)
      const cost10 = estimateDebateCost(100, 10)
      expect(cost10).toBeGreaterThan(cost5)
      expect(cost10).toBeCloseTo(cost5 * 2, 2)
    })

    it('should scale with tokens per message', () => {
      const cost100 = estimateDebateCost(100, 5)
      const cost200 = estimateDebateCost(200, 5)
      expect(cost200).toBeGreaterThan(cost100)
      expect(cost200).toBeCloseTo(cost100 * 2, 2)
    })

    it('should be zero for zero rounds', () => {
      const cost = estimateDebateCost(100, 0)
      expect(cost).toBe(0)
    })

    it('should be zero for zero tokens', () => {
      const cost = estimateDebateCost(0, 5)
      expect(cost).toBe(0)
    })

    it('should estimate realistic cost for typical debate', () => {
      // Typical debate: 50 tokens/message, 10 rounds
      const cost = estimateDebateCost(50, 10)

      // Should be less than $0.01 (very cheap)
      expect(cost).toBeLessThan(0.01)

      // Should be more than $0 (not free)
      expect(cost).toBeGreaterThan(0)
    })
  })
})
