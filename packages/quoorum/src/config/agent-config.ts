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
 * Optimizes model selection per role for cost/quality balance
 *
 * @param role - Agent role (optional, returns config for specific role)
 * @returns Model configuration optimized for the role
 */
export function getPaidTierConfig(
  role?: 'optimizer' | 'critic' | 'analyst' | 'synthesizer'
): typeof ENV_CONFIG | ReturnType<typeof getAgentConfig> {
  // Full config for all agents
  const fullConfig = {
    // Optimizer: Fast iteration, creative options (medium cost)
    optimizer: { provider: 'openai' as const, model: 'gpt-4o-mini', temperature: 0.7 },

    // Critic: Deep analysis of risks (medium cost)
    critic: { provider: 'google' as const, model: 'gemini-2.0-flash-exp', temperature: 0.5 },

    // Analyst: Data-driven insights (medium-high cost)
    analyst: { provider: 'openai' as const, model: 'gpt-4o', temperature: 0.3 },

    // Synthesizer: Strategic synthesis (PREMIUM - highest cost)
    synthesizer: { provider: 'anthropic' as const, model: 'claude-sonnet-4-20250514', temperature: 0.3 },
  }

  // Return specific role config if requested
  if (role) {
    return fullConfig[role]
  }

  return fullConfig
}

/**
 * Get configuration based on user tier
 * Free/Starter → Cost-optimized models (all Gemini free tier)
 * Pro/Business → Quality-optimized models (premium for synthesis)
 *
 * @param userTier - User subscription tier
 * @param role - Agent role
 * @returns Optimized configuration for tier and role
 */
export function getConfigByUserTier(
  userTier: 'free' | 'starter' | 'pro' | 'business',
  role: 'optimizer' | 'critic' | 'analyst' | 'synthesizer'
): ReturnType<typeof getAgentConfig> {
  // Free/Starter users get free tier across all agents
  if (userTier === 'free' || userTier === 'starter') {
    return getFreeTierConfig()[role]
  }

  // Pro/Business users get optimized paid tier per role
  return getPaidTierConfig(role)
}
