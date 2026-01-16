/**
 * Agent Configuration with Environment Variable Support
 *
 * Centralizes AI provider and model configuration for debate agents.
 * Allows overriding via environment variables while maintaining sensible defaults.
 */

import { z } from 'zod'
import type { AgentConfig } from '../types'

// Zod schema for validation
const AgentProviderConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'groq', 'deepseek']),
  model: z.string().min(1),
  temperature: z.number().min(0).max(1),
})

// Environment variable configuration with defaults (Free Tiers)
const ENV_CONFIG = {
  optimizer: {
    provider: (process.env.OPTIMIZER_PROVIDER || 'google') as AgentConfig['provider'],
    model: process.env.OPTIMIZER_MODEL || 'gemini-2.0-flash-exp',
    temperature: parseFloat(process.env.OPTIMIZER_TEMPERATURE || '0.7'),
  },
  critic: {
    provider: (process.env.CRITIC_PROVIDER || 'google') as AgentConfig['provider'],
    model: process.env.CRITIC_MODEL || 'gemini-2.0-flash-exp',
    temperature: parseFloat(process.env.CRITIC_TEMPERATURE || '0.5'),
  },
  analyst: {
    provider: (process.env.ANALYST_PROVIDER || 'google') as AgentConfig['provider'],
    model: process.env.ANALYST_MODEL || 'gemini-2.0-flash-exp',
    temperature: parseFloat(process.env.ANALYST_TEMPERATURE || '0.3'),
  },
  synthesizer: {
    provider: (process.env.SYNTHESIZER_PROVIDER || 'google') as AgentConfig['provider'],
    model: process.env.SYNTHESIZER_MODEL || 'gemini-2.0-flash-exp',
    temperature: parseFloat(process.env.SYNTHESIZER_TEMPERATURE || '0.3'),
  },
}

/**
 * Get agent provider configuration
 * @param agentKey - Agent key (optimizer, critic, analyst, synthesizer)
 * @returns Validated agent configuration
 */
export function getAgentConfig(
  agentKey: 'optimizer' | 'critic' | 'analyst' | 'synthesizer'
): Pick<AgentConfig, 'provider' | 'model' | 'temperature'> {
  const config = ENV_CONFIG[agentKey]

  // Validate configuration
  try {
    return AgentProviderConfigSchema.parse(config)
  } catch (error) {
    console.error(`Invalid configuration for agent "${agentKey}":`, error)
    // Fall back to safe defaults (Gemini Free Tier)
    return {
      provider: 'google',
      model: 'gemini-2.0-flash-exp',
      temperature: agentKey === 'optimizer' ? 0.7 : agentKey === 'critic' ? 0.5 : 0.3,
    }
  }
}

/**
 * Get all agent configurations
 */
export function getAllAgentConfigs(): Record<
  'optimizer' | 'critic' | 'analyst' | 'synthesizer',
  ReturnType<typeof getAgentConfig>
> {
  return {
    optimizer: getAgentConfig('optimizer'),
    critic: getAgentConfig('critic'),
    analyst: getAgentConfig('analyst'),
    synthesizer: getAgentConfig('synthesizer'),
  }
}

/**
 * Get recommended free tier configuration
 * (Useful for documentation and testing)
 */
export function getFreeTierConfig(): typeof ENV_CONFIG {
  return {
    optimizer: { provider: 'google', model: 'gemini-2.0-flash-exp', temperature: 0.7 },
    critic: { provider: 'google', model: 'gemini-2.0-flash-exp', temperature: 0.5 },
    analyst: { provider: 'google', model: 'gemini-2.0-flash-exp', temperature: 0.3 },
    synthesizer: { provider: 'google', model: 'gemini-2.0-flash-exp', temperature: 0.3 },
  }
}

/**
 * Get paid tier configuration (better quality, higher cost)
 */
export function getPaidTierConfig(): typeof ENV_CONFIG {
  return {
    optimizer: { provider: 'openai', model: 'gpt-4o', temperature: 0.7 },
    critic: { provider: 'anthropic', model: 'claude-sonnet-4-20250514', temperature: 0.5 },
    analyst: { provider: 'deepseek', model: 'deepseek-chat', temperature: 0.3 },
    synthesizer: { provider: 'openai', model: 'gpt-4o', temperature: 0.3 },
  }
}
