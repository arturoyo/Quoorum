/**
 * Forum Agents Configuration
 *
 * Configuracion de los 4 agentes que participan en el debate
 */

import type { AgentConfig, AgentRole } from './types'

// ============================================================================
// AGENT CONFIGURATIONS
// ============================================================================

export const FORUM_AGENTS: Record<string, AgentConfig> = {
  optimizer: {
    key: 'optimizer',
    name: 'Optimista',
    role: 'optimizer',
    prompt: `Eres un optimista estrategico. Tu rol:
- Maximiza upside, identifica oportunidades ocultas
- Defiende la accion sobre la paralisis
- Encuentra el camino mas ambicioso pero viable
- Argumenta por que SI funcionara`,
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.7,
  },

  critic: {
    key: 'critic',
    name: 'Critico',
    role: 'critic',
    prompt: `Eres un critico implacable. Tu rol:
- Pre-mortem: Por que fallara esto?
- Cuestiona TODOS los supuestos
- Devil's advocate brutal pero constructivo
- Identifica puntos ciegos y riesgos ocultos`,
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    temperature: 0.5,
  },

  analyst: {
    key: 'analyst',
    name: 'Analista',
    role: 'analyst',
    prompt: `Eres un analista pragmatico. Tu rol:
- Evalua factibilidad real, no teorica
- Estima esfuerzo, recursos, tiempo
- Identifica blockers y dependencias
- Datos sobre opiniones`,
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.3,
  },

  synthesizer: {
    key: 'synthesizer',
    name: 'Sintetizador',
    role: 'synthesizer',
    prompt: `Eres un sintetizador experto. Tu rol:
- Identifica patrones en el debate
- Extrae opciones viables del ruido
- Calcula % de exito realista
- Genera ranking final con pros/cons`,
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.3,
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
  return FORUM_AGENTS[key]
}

export function getAgentsByRole(role: AgentRole): AgentConfig[] {
  return Object.values(FORUM_AGENTS).filter((agent) => agent.role === role)
}

export function getAllAgents(): AgentConfig[] {
  return Object.values(FORUM_AGENTS)
}

export function getAgentName(key: string): string {
  return FORUM_AGENTS[key]?.name ?? key
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
}

export function estimateAgentCost(agent: AgentConfig, tokens: number): number {
  const costPerMillion = COST_PER_MILLION_TOKENS[agent.model] ?? 1.0
  return (tokens / 1_000_000) * costPerMillion
}

export function estimateDebateCost(avgTokensPerMessage: number, rounds: number): number {
  let totalCost = 0

  for (const agent of Object.values(FORUM_AGENTS)) {
    const agentTokens = avgTokensPerMessage * rounds
    totalCost += estimateAgentCost(agent, agentTokens)
  }

  return totalCost
}
