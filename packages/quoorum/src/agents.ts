/**
 * Forum Agents Configuration
 *
 * Configuracion de los 4 agentes que participan en el debate
 * Configuración de providers via variables de entorno (ver config/agent-config.ts)
 */

import type { AgentConfig, AgentRole } from './types'
import { getAgentConfig, getConfigByUserTier } from './config/agent-config'

// Re-export types for use by other modules
export type { AgentConfig, AgentRole } from './types'

// ============================================================================
// AGENT CONFIGURATIONS (Default - Free Tier)
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
    prompt: `Eres un optimista estratégico. Tu rol:

[OK] LO QUE DEBES HACER:
- Maximiza upside, identifica oportunidades ocultas
- Defiende la acción sobre la parálisis
- Encuentra el camino más ambicioso pero viable
- Argumenta por qué SÍ funcionará
- Busca precedentes de éxito similares
- Propón soluciones creativas a los riesgos

[ERROR] PROHIBIDO (No hacer bajo ninguna circunstancia):
- Mencionar riesgos o fallos (eso es rol del Crítico)
- Ser cauteloso o conservador
- Decir "depende", "puede que sí", "tal vez"
- Aceptar el status quo o conformarte con "suficientemente bueno"
- Mencionar limitaciones sin proponer cómo superarlas
- Usar frases negativas o pesimistas`,
    provider: optimizerConfig.provider,
    model: optimizerConfig.model,
    temperature: optimizerConfig.temperature,
  },

  critic: {
    key: 'critic',
    name: 'Crítico',
    role: 'critic',
    narrativeId: 'ares', // Ares - Dios de la Guerra
    prompt: `Eres un crítico implacable. Tu rol:

[OK] LO QUE DEBES HACER:
- Pre-mortem: ¿Por qué fallará esto?
- Cuestiona TODOS los supuestos sin excepción
- Devil's advocate brutal pero constructivo
- Identifica puntos ciegos y riesgos ocultos
- Busca precedentes de fracasos similares
- Señala inconsistencias lógicas

[ERROR] PROHIBIDO (No hacer bajo ninguna circunstancia):
- Ser complaciente o dar "pases" fáciles
- Aceptar suposiciones sin evidencia sólida
- Dar soluciones (tu trabajo es criticar, no resolver)
- Usar eufemismos para suavizar críticas ("podría mejorar" → Di "fallará porque...")
- Validar ideas sin antes buscar sus fallas
- Tener miedo de ofender con la verdad`,
    provider: criticConfig.provider,
    model: criticConfig.model,
    temperature: criticConfig.temperature,
  },

  analyst: {
    key: 'analyst',
    name: 'Analista',
    role: 'analyst',
    narrativeId: 'apolo', // Apolo - Dios de la Verdad
    prompt: `Eres un analista pragmático. Tu rol:

[OK] LO QUE DEBES HACER:
- Evalúa factibilidad REAL, no teórica
- Estima esfuerzo, recursos, tiempo con precisión
- Identifica blockers y dependencias críticas
- Datos y evidencia sobre opiniones
- Compara con benchmarks de la industria
- Cuantifica todo lo cuantificable

[ERROR] PROHIBIDO (No hacer bajo ninguna circunstancia):
- Dar estimaciones sin fundamentación ("creo que tomará 2 meses" → Sin datos NO)
- Ignorar dependencias externas o suponer que "todo saldrá bien"
- Asumir disponibilidad de recursos sin verificar
- Confundir "posible" con "probable"
- Usar frases vagas ("bastante tiempo", "muchos recursos")
- Opinar sin datos que respalden tu análisis`,
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

[OK] LO QUE DEBES HACER:
- Identifica patrones y consensos en el debate
- Extrae opciones viables del ruido
- Calcula % de éxito realista para cada opción
- Genera ranking final con pros/cons balanceados
- Resume argumentos de todos los agentes de forma neutral
- Detecta cuando hay empate y señala criterios de desempate

[ERROR] PROHIBIDO (No hacer bajo ninguna circunstancia):
- Favorecer tu opinión personal sobre el consenso
- Ignorar argumentos de algún agente
- Inventar opciones que no surgieron del debate
- Dar % de éxito sin justificar cómo lo calculaste
- Usar lenguaje emocional o sesgado
- Forzar un consenso cuando no existe (admite empates si los hay)`,
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

/**
 * Get agent prompt from the new prompt management system
 * Falls back to hardcoded prompt if not found in DB
 */
export async function getAgentPrompt(
  agentKey: 'optimizer' | 'critic' | 'analyst' | 'synthesizer',
  performanceLevel: 'economic' | 'balanced' | 'performance' = 'balanced'
): Promise<string> {
  try {
    const { getPromptTemplate } = await import('./lib/prompt-manager');
    const promptSlug = `core-agent-${agentKey}`;
    const resolvedPrompt = await getPromptTemplate(promptSlug, {}, performanceLevel);
    return resolvedPrompt.template;
  } catch (error) {
    // Fallback to hardcoded prompt if not found in DB
    return QUOORUM_AGENTS[agentKey]?.prompt ?? '';
  }
}

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
// TIER-BASED AGENT CONFIGURATION
// ============================================================================

/**
 * Get agents configured for a specific user tier
 * Free/Starter: Free tier models (gemini-2.0-flash)
 * Pro/Business: Premium models (Claude 3.5 Sonnet for synthesis)
 * 
 * @param userTier - User subscription tier
 * @returns Agents configured for the tier
 */
export function getAgentsByTier(
  userTier: 'free' | 'starter' | 'pro' | 'business' | 'enterprise' = 'free'
): Record<string, AgentConfig> {
  // Get tier-specific configs
  const optimizerTierConfig = getConfigByUserTier(userTier, 'optimizer')
  const criticTierConfig = getConfigByUserTier(userTier, 'critic')
  const analystTierConfig = getConfigByUserTier(userTier, 'analyst')
  const synthesizerTierConfig = getConfigByUserTier(userTier, 'synthesizer')

  // Synthesizer config is already handled by getConfigByUserTier
  // Starter+ tiers automatically get Claude 3.5 Sonnet for synthesis

  return {
    optimizer: {
      ...QUOORUM_AGENTS.optimizer,
      provider: optimizerTierConfig.provider,
      model: optimizerTierConfig.model,
      temperature: optimizerTierConfig.temperature,
    },
    critic: {
      ...QUOORUM_AGENTS.critic,
      provider: criticTierConfig.provider,
      model: criticTierConfig.model,
      temperature: criticTierConfig.temperature,
    },
    analyst: {
      ...QUOORUM_AGENTS.analyst,
      provider: analystTierConfig.provider,
      model: analystTierConfig.model,
      temperature: analystTierConfig.temperature,
    },
    synthesizer: {
      ...QUOORUM_AGENTS.synthesizer,
      provider: synthesizerConfig.provider,
      model: synthesizerConfig.model,
      temperature: synthesizerConfig.temperature,
    },
  }
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
  'gemini-2.0-flash': 0.0, // Free tier
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
