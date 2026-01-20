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

// Environment variable configuration with optimized multi-provider defaults
// Mitología Griega: Cada dios usa el modelo IA más eficiente para su rol
const ENV_CONFIG = {
  optimizer: {
    // Hermes (Dios de las Oportunidades) - Rápido y técnico
    provider: (process.env.OPTIMIZER_PROVIDER || 'openai') as AgentConfig['provider'],
    model: process.env.OPTIMIZER_MODEL || 'gpt-4o-mini',
    temperature: parseFloat(process.env.OPTIMIZER_TEMPERATURE || '0.7'),
  },
  critic: {
    // Ares (Dios de la Guerra) - Confrontacional y veloz
    provider: (process.env.CRITIC_PROVIDER || 'groq') as AgentConfig['provider'],
    model: process.env.CRITIC_MODEL || 'llama3-70b-8192',
    temperature: parseFloat(process.env.CRITIC_TEMPERATURE || '0.5'),
  },
  analyst: {
    // Apolo (Dios de la Verdad) - Lógico y basado en datos
    provider: (process.env.ANALYST_PROVIDER || 'deepseek') as AgentConfig['provider'],
    model: process.env.ANALYST_MODEL || 'deepseek-chat',
    temperature: parseFloat(process.env.ANALYST_TEMPERATURE || '0.3'),
  },
  synthesizer: {
    // Atenea (Diosa de la Sabiduría) - Sabio y conclusivo
    provider: (process.env.SYNTHESIZER_PROVIDER || 'anthropic') as AgentConfig['provider'],
    model: process.env.SYNTHESIZER_MODEL || 'claude-3-5-sonnet-20241022',
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
 * Uses optimized multi-provider setup with free/cheap models
 */
export function getFreeTierConfig(): typeof ENV_CONFIG {
  return {
    optimizer: { provider: 'google', model: 'gemini-2.0-flash-exp', temperature: 0.7 }, // Free
    critic: { provider: 'google', model: 'gemini-2.0-flash-exp', temperature: 0.5 }, // Free
    analyst: { provider: 'deepseek', model: 'deepseek-chat', temperature: 0.3 }, // Cheapest paid
    synthesizer: { provider: 'google', model: 'gemini-2.0-flash-exp', temperature: 0.3 }, // Free
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
  // getPaidTierConfig(role) returns ReturnType<typeof getAgentConfig> when role is provided
  return getPaidTierConfig(role) as ReturnType<typeof getAgentConfig>
}
