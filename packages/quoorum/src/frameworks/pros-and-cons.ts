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

import type { AgentConfig } from '../agents.js'
import { getAIClient } from '@quoorum/ai'
import { quoorumLogger } from '../lib/logger.js'

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

const PROS_AGENT_CONFIG: AgentConfig = {
  provider: 'google',
  model: 'gemini-2.0-flash-exp',
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

const CONS_AGENT_CONFIG: AgentConfig = {
  provider: 'google',
  model: 'gemini-2.0-flash-exp',
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

const ANALYST_AGENT_CONFIG: AgentConfig = {
  provider: 'google',
  model: 'gemini-2.0-flash-exp',
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

const SYNTHESIZER_AGENT_CONFIG: AgentConfig = {
  provider: 'google',
  model: 'gemini-2.0-flash-exp',
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
// MAIN FUNCTION
// ============================================================================

export async function runProsAndCons(input: ProsAndConsInput): Promise<ProsAndConsOutput> {
  const startTime = Date.now()

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
        PROS_AGENT_CONFIG.systemPrompt,
        `${contextPrompt}\n\nOutput format:\n{\n  "pros": [\n    {\n      "title": "...",\n      "description": "...",\n      "weight": 80\n    }\n  ]\n}`,
        {
          modelId: PROS_AGENT_CONFIG.model,
          provider: PROS_AGENT_CONFIG.provider,
          temperature: PROS_AGENT_CONFIG.temperature,
          maxTokens: 2000,
        }
      ),

      // CONS (Critic)
      consClient.generateWithSystem(
        CONS_AGENT_CONFIG.systemPrompt,
        `${contextPrompt}\n\nOutput format:\n{\n  "cons": [\n    {\n      "title": "...",\n      "description": "...",\n      "weight": 70\n    }\n  ]\n}`,
        {
          modelId: CONS_AGENT_CONFIG.model,
          provider: CONS_AGENT_CONFIG.provider,
          temperature: CONS_AGENT_CONFIG.temperature,
          maxTokens: 2000,
        }
      ),

      // ANALYSIS (Analyst)
      analystClient.generateWithSystem(
        ANALYST_AGENT_CONFIG.systemPrompt,
        `${contextPrompt}\n\nOutput format:\n{\n  "feasibility": "...",\n  "contextNotes": "..."\n}`,
        {
          modelId: ANALYST_AGENT_CONFIG.model,
          provider: ANALYST_AGENT_CONFIG.provider,
          temperature: ANALYST_AGENT_CONFIG.temperature,
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
      SYNTHESIZER_AGENT_CONFIG.systemPrompt,
      synthesisPrompt,
      {
        modelId: SYNTHESIZER_AGENT_CONFIG.model,
        provider: SYNTHESIZER_AGENT_CONFIG.provider,
        temperature: SYNTHESIZER_AGENT_CONFIG.temperature,
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
    quoorumLogger.error('Failed to run Pros and Cons analysis', {
      error: error instanceof Error ? error.message : String(error),
      question: input.question,
    })
    throw error
  }
}
