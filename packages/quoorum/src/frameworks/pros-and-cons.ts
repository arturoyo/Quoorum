/**
 * Pros and Cons Framework
 *
 * Uses multi-agent debate to analyze the pros (advantages) and cons (disadvantages)
 * of a decision. Maps to existing agents:
 * - Optimizer → Identifies PROS (upside, benefits, advantages)
 * - Critic → Identifies CONS (downside, risks, disadvantages)
 * - Analyst → Evaluates feasibility and context
 * - Synthesizer → Creates balanced recommendation
 */

import type { AgentConfig } from '../agents'
import { getAIClient } from '@quoorum/ai'
import { quoorumLogger } from '../logger'
import { getAgentConfig } from '../config/agent-config'

// ============================================================================
// TYPES
// ============================================================================

export interface ProsAndConsInput {
  question: string
  context?: string
  userBackstory?: {
    role?: string
    industry?: string
    companyStage?: string
  }
}

export interface ProsAndConsOutput {
  question: string
  pros: Array<{
    title: string
    description: string
    weight: number // 0-100
  }>
  cons: Array<{
    title: string
    description: string
    weight: number // 0-100
  }>
  analysis: {
    feasibility: string
    contextNotes: string
  }
  recommendation: {
    decision: 'yes' | 'no' | 'conditional'
    rationale: string
    prosWeight: number // 0-100
    consWeight: number // 0-100
    confidence: number // 0-100
  }
  executionTimeMs: number
}

// ============================================================================
// AGENT CONFIGURATIONS
// ============================================================================

// Framework agent config type (partial AgentConfig with only needed fields)
type FrameworkAgentConfig = Pick<AgentConfig, 'provider' | 'model' | 'temperature'> & {
  systemPrompt: string
}

// Get centralized framework agent config (uses free tier by default)
const getFrameworkAgentConfig = (): Pick<AgentConfig, 'provider' | 'model' | 'temperature'> => {
  // Use optimizer config as base for frameworks (fast, creative)
  return getAgentConfig('optimizer')
}

const PROS_AGENT_CONFIG: FrameworkAgentConfig = {
  ...getFrameworkAgentConfig(),
  temperature: 0.6,
  systemPrompt: `Eres el OPTIMIZER, un experto en identificar ventajas y oportunidades.

Tu rol es analizar la decisión y encontrar TODOS los PROS (ventajas, beneficios, upside):
- Beneficios directos e indirectos
- Oportunidades que abre
- Ventajas competitivas
- Impacto positivo a corto y largo plazo
- Sinergias con otras iniciativas

Para cada PRO:
1. Título claro y conciso (max 8 palabras)
2. Descripción detallada (2-3 oraciones)
3. Weight (0-100): Qué tan importante/impactful es este PRO

Sé exhaustivo pero realista. No inventes beneficios, pero tampoco los minimices.

Output SOLO JSON válido sin texto adicional.`,
}

const CONS_AGENT_CONFIG: FrameworkAgentConfig = {
  ...getFrameworkAgentConfig(),
  temperature: 0.6,
  systemPrompt: `Eres el CRITIC, un experto en identificar riesgos y desventajas.

Tu rol es analizar la decisión y encontrar TODOS los CONS (desventajas, riesgos, downside):
- Riesgos directos e indirectos
- Costos (tiempo, dinero, oportunidad)
- Obstáculos y blockers
- Impacto negativo a corto y largo plazo
- Trade-offs y sacrificios necesarios

Para cada CON:
1. Título claro y conciso (max 8 palabras)
2. Descripción detallada (2-3 oraciones)
3. Weight (0-100): Qué tan crítico/severo es este CON

Sé exhaustivo pero realista. No exageres los riesgos, pero tampoco los minimices.

Output SOLO JSON válido sin texto adicional.`,
}

const ANALYST_AGENT_CONFIG: FrameworkAgentConfig = {
  ...getFrameworkAgentConfig(),
  temperature: 0.4,
  systemPrompt: `Eres el ANALYST, un experto en evaluar factibilidad y contexto.

Tu rol es analizar:
1. Feasibility: ¿Qué tan factible es ejecutar esta decisión?
   - Recursos necesarios
   - Timeline realista
   - Blockers potenciales
   - Dependencies

2. Context Notes: ¿Qué factores contextuales son relevantes?
   - Timing (¿es buen momento?)
   - Market conditions
   - Internal readiness
   - External factors

Sé práctico y objetivo. Provee insights que ayuden a tomar la decisión.

Output SOLO JSON válido sin texto adicional.`,
}

const SYNTHESIZER_AGENT_CONFIG: FrameworkAgentConfig = {
  ...getFrameworkAgentConfig(),
  temperature: 0.3,
  systemPrompt: `Eres el SYNTHESIZER, un experto en crear recomendaciones balanceadas.

Tu rol es sintetizar los PROS y CONS en una recomendación clara:

1. Decision: 'yes' | 'no' | 'conditional'
   - yes: Los pros superan significativamente a los cons
   - no: Los cons superan significativamente a los pros
   - conditional: Depende de ciertas condiciones

2. Rationale: Explica el razonamiento detrás de la recomendación (3-4 oraciones)
   - Qué pros pesaron más
   - Qué cons son más preocupantes
   - Por qué la balanza se inclina hacia un lado
   - Qué condiciones aplican (si es conditional)

3. Weights:
   - prosWeight: 0-100 (peso agregado de todos los pros)
   - consWeight: 0-100 (peso agregado de todos los cons)
   - confidence: 0-100 (qué tan seguro estás de la recomendación)

Sé claro, directo, y útil. El usuario necesita una guía clara para decidir.

Output SOLO JSON válido sin texto adicional.`,
}

// ============================================================================
// DYNAMIC PROMPT LOADING
// ============================================================================

/**
 * Get Pros and Cons agent configs with dynamic prompts from the system
 * Falls back to hardcoded prompts if not found in DB
 */
async function getProsAndConsAgentConfigs(
  performanceLevel: 'economic' | 'balanced' | 'performance' = 'balanced'
): Promise<{
  pros: FrameworkAgentConfig
  cons: FrameworkAgentConfig
  analyst: FrameworkAgentConfig
  synthesizer: FrameworkAgentConfig
}> {
  try {
    const { getPromptTemplate } = await import('../lib/prompt-manager');

    const [prosPrompt, consPrompt, analystPrompt, synthesizerPrompt] =
      await Promise.all([
        getPromptTemplate('framework-proscons-pros', {}, performanceLevel),
        getPromptTemplate('framework-proscons-cons', {}, performanceLevel),
        getPromptTemplate('framework-proscons-analyst', {}, performanceLevel),
        getPromptTemplate('framework-proscons-synthesizer', {}, performanceLevel),
      ]);

    return {
      pros: { ...PROS_AGENT_CONFIG, systemPrompt: prosPrompt.template },
      cons: { ...CONS_AGENT_CONFIG, systemPrompt: consPrompt.template },
      analyst: { ...ANALYST_AGENT_CONFIG, systemPrompt: analystPrompt.template },
      synthesizer: { ...SYNTHESIZER_AGENT_CONFIG, systemPrompt: synthesizerPrompt.template },
    };
  } catch {
    // Fallback to hardcoded configs
    return {
      pros: PROS_AGENT_CONFIG,
      cons: CONS_AGENT_CONFIG,
      analyst: ANALYST_AGENT_CONFIG,
      synthesizer: SYNTHESIZER_AGENT_CONFIG,
    };
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function runProsAndCons(
  input: ProsAndConsInput,
  performanceLevel: 'economic' | 'balanced' | 'performance' = 'balanced'
): Promise<ProsAndConsOutput> {
  const startTime = Date.now()

  // Get dynamic agent configs
  const agentConfigs = await getProsAndConsAgentConfigs(performanceLevel);

  quoorumLogger.info('Starting Pros and Cons analysis', {
    question: input.question,
    hasContext: !!input.context,
    hasBackstory: !!input.userBackstory,
  })

  try {
    // Build context prompt
    let contextPrompt = `Decisión a analizar: "${input.question}"\n\n`

    if (input.context) {
      contextPrompt += `Contexto adicional:\n${input.context}\n\n`
    }

    if (input.userBackstory) {
      const { role, industry, companyStage } = input.userBackstory
      if (role || industry || companyStage) {
        contextPrompt += `Usuario:\n`
        if (role) contextPrompt += `- Rol: ${role}\n`
        if (industry) contextPrompt += `- Industria: ${industry}\n`
        if (companyStage) contextPrompt += `- Etapa: ${companyStage}\n`
        contextPrompt += `\n`
      }
    }

    contextPrompt += `Analiza la decisión desde tu perspectiva especializada.`

    // Get AI clients
    const prosClient = getAIClient()
    const consClient = getAIClient()
    const analystClient = getAIClient()
    const synthesizerClient = getAIClient()

    // Run agents in parallel (except synthesizer, which needs the others)
    const [prosResponse, consResponse, analysisResponse] = await Promise.all([
      // PROS (Optimizer)
      prosClient.generateWithSystem(
        agentConfigs.pros.systemPrompt,
        `${contextPrompt}\n\nOutput format:\n{\n  "pros": [\n    {\n      "title": "...",\n      "description": "...",\n      "weight": 80\n    }\n  ]\n}`,
        {
          modelId: agentConfigs.pros.model,
          temperature: agentConfigs.pros.temperature,
          maxTokens: 2000,
        }
      ),

      // CONS (Critic)
      consClient.generateWithSystem(
        agentConfigs.cons.systemPrompt,
        `${contextPrompt}\n\nOutput format:\n{\n  "cons": [\n    {\n      "title": "...",\n      "description": "...",\n      "weight": 70\n    }\n  ]\n}`,
        {
          modelId: agentConfigs.cons.model,
          temperature: agentConfigs.cons.temperature,
          maxTokens: 2000,
        }
      ),

      // ANALYSIS (Analyst)
      analystClient.generateWithSystem(
        agentConfigs.analyst.systemPrompt,
        `${contextPrompt}\n\nOutput format:\n{\n  "feasibility": "...",\n  "contextNotes": "..."\n}`,
        {
          modelId: agentConfigs.analyst.model,
          temperature: agentConfigs.analyst.temperature,
          maxTokens: 1500,
        }
      ),
    ])

    // Parse responses
    const prosData = JSON.parse(prosResponse.text) as { pros: ProsAndConsOutput['pros'] }
    const consData = JSON.parse(consResponse.text) as { cons: ProsAndConsOutput['cons'] }
    const analysisData = JSON.parse(analysisResponse.text) as ProsAndConsOutput['analysis']

    // Synthesize recommendation
    const synthesisPrompt = `Decisión: "${input.question}"

PROS identificados (${prosData.pros.length}):
${prosData.pros.map((p, i) => `${i + 1}. ${p.title} (weight: ${p.weight})\n   ${p.description}`).join('\n\n')}

CONS identificados (${consData.cons.length}):
${consData.cons.map((c, i) => `${i + 1}. ${c.title} (weight: ${c.weight})\n   ${c.description}`).join('\n\n')}

Análisis de factibilidad:
${analysisData.feasibility}

Contexto:
${analysisData.contextNotes}

Crea una recomendación balanceada.

Output format:
{
  "decision": "yes" | "no" | "conditional",
  "rationale": "...",
  "prosWeight": 70,
  "consWeight": 60,
  "confidence": 75
}`

    const synthesisResponse = await synthesizerClient.generateWithSystem(
      agentConfigs.synthesizer.systemPrompt,
      synthesisPrompt,
      {
        modelId: agentConfigs.synthesizer.model,
        temperature: agentConfigs.synthesizer.temperature,
        maxTokens: 1000,
      }
    )

    const recommendation = JSON.parse(synthesisResponse.text) as ProsAndConsOutput['recommendation']

    const executionTimeMs = Date.now() - startTime

    quoorumLogger.info('Pros and Cons analysis completed', {
      prosCount: prosData.pros.length,
      consCount: consData.cons.length,
      decision: recommendation.decision,
      executionTimeMs,
    })

    return {
      question: input.question,
      pros: prosData.pros,
      cons: consData.cons,
      analysis: analysisData,
      recommendation,
      executionTimeMs,
    }
  } catch (error) {
    quoorumLogger.error('Failed to run Pros and Cons analysis', undefined, {
      errorMessage: error instanceof Error ? error.message : String(error),
      question: input.question,
    })
    throw error
  }
}
