/**
 * Forum Agents Configuration
 *
 * Configuracion de los 4 agentes que participan en el debate
 * Configuración de providers via variables de entorno (ver config/agent-config.ts)
 */

import type { AgentConfig, AgentRole } from './types'
import { getAgentConfig } from './config/agent-config'

// ============================================================================
// AGENT CONFIGURATIONS
// ============================================================================

// Get provider configurations from environment (with free tier defaults)
const optimizerConfig = getAgentConfig('optimizer')
const criticConfig = getAgentConfig('critic')
const analystConfig = getAgentConfig('analyst')
const synthesizerConfig = getAgentConfig('synthesizer')

export const QUOORUM_AGENTS: Record<string, AgentConfig> = {
  optimizer: {
    key: 'optimizer',
    name: 'Optimista',
    role: 'optimizer',
    narrativeId: 'hermes', // Hermes - Dios de las Oportunidades
    prompt: `Eres un optimista estrategico. Tu rol:
- Maximiza upside, identifica oportunidades ocultas
- Defiende la accion sobre la paralisis
- Encuentra el camino mas ambicioso pero viable
- Argumenta por que SI funcionara`,
    provider: optimizerConfig.provider,
    model: optimizerConfig.model,
    temperature: optimizerConfig.temperature,
  },

  critic: {
    key: 'critic',
    name: 'Critico',
    role: 'critic',
    narrativeId: 'ares', // Ares - Dios de la Guerra
    prompt: `Eres un critico implacable. Tu rol:
- Pre-mortem: Por que fallara esto?
- Cuestiona TODOS los supuestos
- Devil's advocate brutal pero constructivo
- Identifica puntos ciegos y riesgos ocultos`,
    provider: criticConfig.provider,
    model: criticConfig.model,
    temperature: criticConfig.temperature,
  },

  analyst: {
    key: 'analyst',
    name: 'Analista',
    role: 'analyst',
    narrativeId: 'apolo', // Apolo - Dios de la Verdad
    prompt: `Eres un analista pragmatico. Tu rol:
- Evalua factibilidad real, no teorica
- Estima esfuerzo, recursos, tiempo
- Identifica blockers y dependencias
- Datos sobre opiniones`,
    provider: analystConfig.provider,
    model: analystConfig.model,
    temperature: analystConfig.temperature,
  },

  synthesizer: {
    key: 'synthesizer',
    name: 'Sintetizador',
    role: 'synthesizer',
    narrativeId: 'atenea', // Atenea - Diosa de la Sabiduría
    prompt: `Eres un sintetizador experto. Tu rol:
- Identifica patrones en el debate
- Extrae opciones viables del ruido
- Calcula % de exito realista
- Genera ranking final con pros/cons`,
    provider: synthesizerConfig.provider,
    model: synthesizerConfig.model,
    temperature: synthesizerConfig.temperature,
  },
}

// ============================================================================
// AGENT ORDER
// ============================================================================

// Orden de participacion en cada ronda
export const AGENT_ORDER: string[] = ['optimizer', 'critic', 'analyst', 'synthesizer']

// ============================================================================
// AGENT HELPERS
// ============================================================================

export function getAgent(key: string): AgentConfig | undefined {
  return QUOORUM_AGENTS[key]
}

export function getAgentsByRole(role: AgentRole): AgentConfig[] {
  return Object.values(QUOORUM_AGENTS).filter((agent) => agent.role === role)
}

export function getAllAgents(): AgentConfig[] {
  return Object.values(QUOORUM_AGENTS)
}

export function getAgentName(key: string): string {
  return QUOORUM_AGENTS[key]?.name ?? key
}

// ============================================================================
// COST ESTIMATION
// ============================================================================

// Precios por 1M tokens (input/output promedio)
const COST_PER_MILLION_TOKENS: Record<string, number> = {
  'deepseek-chat': 0.14,
  'claude-sonnet-4-20250514': 3.0,
  'gpt-4o': 2.5,
  'gpt-4o-mini': 0.15,
  'gemini-2.0-flash-exp': 0.0, // Free tier
  'gemini-1.5-flash': 0.075,
  'gemini-1.5-pro': 1.25,
}

export function estimateAgentCost(agent: AgentConfig, tokens: number): number {
  const costPerMillion = COST_PER_MILLION_TOKENS[agent.model] ?? 1.0
  return (tokens / 1_000_000) * costPerMillion
}

export function estimateDebateCost(avgTokensPerMessage: number, rounds: number): number {
  let totalCost = 0

  for (const agent of Object.values(QUOORUM_AGENTS)) {
    const agentTokens = avgTokensPerMessage * rounds
    totalCost += estimateAgentCost(agent, agentTokens)
  }

  return totalCost
}
