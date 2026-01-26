/**
 * Agent Configuration with Environment Variable Support
 *
 * Centralizes AI provider and model configuration for debate agents.
 * Allows overriding via environment variables while maintaining sensible defaults.
 */

import { z } from 'zod'
import type { AgentConfig } from '../types'
import { quoorumLogger } from '../logger'

// Zod schema for validation
const AgentProviderConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'groq', 'deepseek']),
  model: z.string().min(1),
  temperature: z.number().min(0).max(1),
})

// Environment variable configuration with optimized multi-provider defaults
// Mitología Griega: Cada dios usa el modelo IA más eficiente para su rol
// ⚡ OPTIMIZACIÓN: Modelos más baratos cuando es posible, sin sacrificar calidad crítica
const ENV_CONFIG = {
  optimizer: {
    // Hermes (Dios de las Oportunidades) - Rápido y técnico
    // Free tier OK para optimización (no requiere alta precisión)
    provider: (process.env.OPTIMIZER_PROVIDER || 'google') as AgentConfig['provider'],
    model: process.env.OPTIMIZER_MODEL || 'gemini-2.0-flash-exp', // Free tier
    temperature: parseFloat(process.env.OPTIMIZER_TEMPERATURE || '0.7'),
  },
  critic: {
    // Ares (Dios de la Guerra) - Confrontacional y veloz
    // Free tier OK para crítica (puede ser más agresivo)
    provider: (process.env.CRITIC_PROVIDER || 'google') as AgentConfig['provider'],
    model: process.env.CRITIC_MODEL || 'gemini-2.0-flash-exp', // Free tier
    temperature: parseFloat(process.env.CRITIC_TEMPERATURE || '0.5'),
  },
  analyst: {
    // Apolo (Dios de la Verdad) - Lógico y basado en datos
    // Free tier OK para análisis básico (puede usar datos del contexto)
    provider: (process.env.ANALYST_PROVIDER || 'google') as AgentConfig['provider'],
    model: process.env.ANALYST_MODEL || 'gemini-2.0-flash-exp', // Free tier
    temperature: parseFloat(process.env.ANALYST_TEMPERATURE || '0.3'),
  },
  synthesizer: {
    // Atenea (Diosa de la Sabiduría) - Sabio y conclusivo
    // ⚡ OPTIMIZADO: gpt-4o-mini es más barato que claude-sonnet pero mejor que gemini para síntesis
    // Costo: $0.15/1M tokens vs $3.0/1M tokens (claude-sonnet) = 95% más barato
    provider: (process.env.SYNTHESIZER_PROVIDER || 'openai') as AgentConfig['provider'],
    model: process.env.SYNTHESIZER_MODEL || 'gpt-4o-mini', // Optimized: mejor calidad/precio que gemini para síntesis
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
    quoorumLogger.error(`Invalid configuration for agent "${agentKey}"`, error instanceof Error ? error : undefined, { agentKey })
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
  userTier: 'free' | 'starter' | 'pro' | 'business' | 'enterprise',
  role: 'optimizer' | 'critic' | 'analyst' | 'synthesizer'
): ReturnType<typeof getAgentConfig> {
  // Free tier: All free tier models
  if (userTier === 'free') {
    return getFreeTierConfig()[role]
  }

  // Starter tier: Free tier models + Claude 3.5 Sonnet for synthesis (as promised)
  if (userTier === 'starter') {
    if (role === 'synthesizer') {
      return { provider: 'anthropic' as const, model: 'claude-3-5-sonnet-20241022', temperature: 0.3 }
    }
    return getFreeTierConfig()[role]
  }

  // Pro/Business/Enterprise: Optimized paid tier per role
  // ⚡ OPTIMIZADO: Usar modelos más baratos cuando es posible, pero premium para síntesis
  const paidConfig = {
    // Optimizer: Free tier OK (no requiere alta precisión)
    optimizer: { provider: 'google' as const, model: 'gemini-2.0-flash-exp', temperature: 0.7 },
    
    // Critic: Free tier OK (puede ser más agresivo)
    critic: { provider: 'google' as const, model: 'gemini-2.0-flash-exp', temperature: 0.5 },
    
    // Analyst: Free tier OK (usa datos del contexto)
    analyst: { provider: 'google' as const, model: 'gemini-2.0-flash-exp', temperature: 0.3 },
    
    // Synthesizer: Claude 3.5 Sonnet (premium model for synthesis as promised)
    synthesizer: { provider: 'anthropic' as const, model: 'claude-3-5-sonnet-20241022', temperature: 0.3 },
  }
  
  return paidConfig[role] as ReturnType<typeof getAgentConfig>
}
