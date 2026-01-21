/**
 * SWOT Analysis Framework
 *
 * Uses multi-agent debate to analyze Strengths, Weaknesses, Opportunities, and Threats.
 * Maps to 4 specialized agents:
 * - Strengths Agent → Identifies internal STRENGTHS (what you do well)
 * - Weaknesses Agent → Identifies internal WEAKNESSES (what needs improvement)
 * - Opportunities Agent → Identifies external OPPORTUNITIES (market potential)
 * - Threats Agent → Identifies external THREATS (risks from environment)
 */

import type { AgentConfig } from '../agents.js'
import { getAIClient } from '@quoorum/ai'
import { quoorumLogger } from '../lib/logger.js'

// ============================================================================
// TYPES
// ============================================================================

export interface SWOTAnalysisInput {
  question: string
  context?: string
  userBackstory?: {
    role?: string
    industry?: string
    companyStage?: string
  }
}

export interface SWOTAnalysisOutput {
  question: string
  strengths: Array<{
    title: string
    description: string
    impact: number // 0-100
  }>
  weaknesses: Array<{
    title: string
    description: string
    severity: number // 0-100
  }>
  opportunities: Array<{
    title: string
    description: string
    potential: number // 0-100
  }>
  threats: Array<{
    title: string
    description: string
    risk: number // 0-100
  }>
  strategies: {
    soStrategies: string // Strengths + Opportunities
    woStrategies: string // Weaknesses + Opportunities
    stStrategies: string // Strengths + Threats
    wtStrategies: string // Weaknesses + Threats
  }
  executionTimeMs: number
}

// ============================================================================
// AGENT CONFIGURATIONS
// ============================================================================

const STRENGTHS_AGENT_CONFIG: AgentConfig = {
  provider: 'google',
  model: 'gemini-2.0-flash-exp',
  temperature: 0.6,
  systemPrompt: `Eres el STRENGTHS ANALYST, un experto en identificar fortalezas internas.

Tu rol es analizar la situación y encontrar TODAS las STRENGTHS (fortalezas internas):
- Ventajas competitivas únicas
- Recursos y capacidades destacadas
- Assets valiosos (equipo, tecnología, marca, etc.)
- Procesos eficientes
- Relaciones estratégicas sólidas

Para cada STRENGTH:
1. Título claro y conciso (max 8 palabras)
2. Descripción detallada (2-3 oraciones)
3. Impact (0-100): Qué tan significativo es este strength

Enfócate en factores INTERNOS que están bajo control.
Sé exhaustivo pero realista. No inventes fortalezas.

Output SOLO JSON válido sin texto adicional.`,
}

const WEAKNESSES_AGENT_CONFIG: AgentConfig = {
  provider: 'google',
  model: 'gemini-2.0-flash-exp',
  temperature: 0.6,
  systemPrompt: `Eres el WEAKNESSES ANALYST, un experto en identificar debilidades internas.

Tu rol es analizar la situación y encontrar TODAS las WEAKNESSES (debilidades internas):
- Recursos limitados o faltantes
- Capacidades insuficientes
- Procesos ineficientes
- Dependencias riesgosas
- Gaps de conocimiento o experiencia

Para cada WEAKNESS:
1. Título claro y conciso (max 8 palabras)
2. Descripción detallada (2-3 oraciones)
3. Severity (0-100): Qué tan crítica es esta debilidad

Enfócate en factores INTERNOS que están bajo control.
Sé exhaustivo pero constructivo. El objetivo es mejorar.

Output SOLO JSON válido sin texto adicional.`,
}

const OPPORTUNITIES_AGENT_CONFIG: AgentConfig = {
  provider: 'google',
  model: 'gemini-2.0-flash-exp',
  temperature: 0.6,
  systemPrompt: `Eres el OPPORTUNITIES ANALYST, un experto en identificar oportunidades externas.

Tu rol es analizar el entorno y encontrar TODAS las OPPORTUNITIES (oportunidades externas):
- Tendencias de mercado favorables
- Cambios regulatorios beneficiosos
- Nuevos segmentos o nichos
- Tecnologías emergentes
- Partnerships potenciales

Para cada OPPORTUNITY:
1. Título claro y conciso (max 8 palabras)
2. Descripción detallada (2-3 oraciones)
3. Potential (0-100): Qué tan grande es la oportunidad

Enfócate en factores EXTERNOS del entorno.
Sé visionario pero pragmático.

Output SOLO JSON válido sin texto adicional.`,
}

const THREATS_AGENT_CONFIG: AgentConfig = {
  provider: 'google',
  model: 'gemini-2.0-flash-exp',
  temperature: 0.6,
  systemPrompt: `Eres el THREATS ANALYST, un experto en identificar amenazas externas.

Tu rol es analizar el entorno y encontrar TODAS las THREATS (amenazas externas):
- Competencia creciente
- Cambios regulatorios adversos
- Disrupciones tecnológicas
- Cambios en preferencias de consumidores
- Riesgos macroeconómicos

Para cada THREAT:
1. Título claro y conciso (max 8 palabras)
2. Descripción detallada (2-3 oraciones)
3. Risk (0-100): Qué tan probable/severa es la amenaza

Enfócate en factores EXTERNOS del entorno.
Sé realista pero no catastrófico.

Output SOLO JSON válido sin texto adicional.`,
}

const STRATEGIST_AGENT_CONFIG: AgentConfig = {
  provider: 'google',
  model: 'gemini-2.0-flash-exp',
  temperature: 0.4,
  systemPrompt: `Eres el STRATEGIST, un experto en crear estrategias SWOT accionables.

Tu rol es sintetizar las 4 dimensiones SWOT en estrategias concretas:

1. SO Strategies (Strengths + Opportunities):
   - Cómo usar tus fortalezas para aprovechar oportunidades
   - Estrategias ofensivas de crecimiento

2. WO Strategies (Weaknesses + Opportunities):
   - Cómo superar debilidades para aprovechar oportunidades
   - Estrategias de mejora

3. ST Strategies (Strengths + Threats):
   - Cómo usar tus fortalezas para defenderte de amenazas
   - Estrategias defensivas

4. WT Strategies (Weaknesses + Threats):
   - Cómo mitigar debilidades ante amenazas
   - Estrategias de supervivencia

Para cada cuadrante, provee 2-3 estrategias concretas y accionables.
Sé específico y práctico. Evita generalidades.

Output SOLO JSON válido sin texto adicional.`,
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function runSWOTAnalysis(input: SWOTAnalysisInput): Promise<SWOTAnalysisOutput> {
  const startTime = Date.now()

  quoorumLogger.info('Starting SWOT Analysis', {
    question: input.question,
    hasContext: !!input.context,
    hasBackstory: !!input.userBackstory,
  })

  try {
    // Build context prompt
    let contextPrompt = `Situación a analizar: "${input.question}"\n\n`

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

    contextPrompt += `Analiza desde tu perspectiva especializada.`

    // Get AI clients
    const strengthsClient = getAIClient()
    const weaknessesClient = getAIClient()
    const opportunitiesClient = getAIClient()
    const threatsClient = getAIClient()
    const strategistClient = getAIClient()

    // Run agents in parallel (SWOT dimensions)
    const [strengthsResponse, weaknessesResponse, opportunitiesResponse, threatsResponse] =
      await Promise.all([
        // STRENGTHS
        strengthsClient.generateWithSystem(
          STRENGTHS_AGENT_CONFIG.systemPrompt,
          `${contextPrompt}\n\nOutput format:\n{\n  "strengths": [\n    {\n      "title": "...",\n      "description": "...",\n      "impact": 85\n    }\n  ]\n}`,
          {
            modelId: STRENGTHS_AGENT_CONFIG.model,
            provider: STRENGTHS_AGENT_CONFIG.provider,
            temperature: STRENGTHS_AGENT_CONFIG.temperature,
            maxTokens: 2000,
          }
        ),

        // WEAKNESSES
        weaknessesClient.generateWithSystem(
          WEAKNESSES_AGENT_CONFIG.systemPrompt,
          `${contextPrompt}\n\nOutput format:\n{\n  "weaknesses": [\n    {\n      "title": "...",\n      "description": "...",\n      "severity": 70\n    }\n  ]\n}`,
          {
            modelId: WEAKNESSES_AGENT_CONFIG.model,
            provider: WEAKNESSES_AGENT_CONFIG.provider,
            temperature: WEAKNESSES_AGENT_CONFIG.temperature,
            maxTokens: 2000,
          }
        ),

        // OPPORTUNITIES
        opportunitiesClient.generateWithSystem(
          OPPORTUNITIES_AGENT_CONFIG.systemPrompt,
          `${contextPrompt}\n\nOutput format:\n{\n  "opportunities": [\n    {\n      "title": "...",\n      "description": "...",\n      "potential": 80\n    }\n  ]\n}`,
          {
            modelId: OPPORTUNITIES_AGENT_CONFIG.model,
            provider: OPPORTUNITIES_AGENT_CONFIG.provider,
            temperature: OPPORTUNITIES_AGENT_CONFIG.temperature,
            maxTokens: 2000,
          }
        ),

        // THREATS
        threatsClient.generateWithSystem(
          THREATS_AGENT_CONFIG.systemPrompt,
          `${contextPrompt}\n\nOutput format:\n{\n  "threats": [\n    {\n      "title": "...",\n      "description": "...",\n      "risk": 65\n    }\n  ]\n}`,
          {
            modelId: THREATS_AGENT_CONFIG.model,
            provider: THREATS_AGENT_CONFIG.provider,
            temperature: THREATS_AGENT_CONFIG.temperature,
            maxTokens: 2000,
          }
        ),
      ])

    // Parse responses
    const strengthsData = JSON.parse(strengthsResponse.text) as {
      strengths: SWOTAnalysisOutput['strengths']
    }
    const weaknessesData = JSON.parse(weaknessesResponse.text) as {
      weaknesses: SWOTAnalysisOutput['weaknesses']
    }
    const opportunitiesData = JSON.parse(opportunitiesResponse.text) as {
      opportunities: SWOTAnalysisOutput['opportunities']
    }
    const threatsData = JSON.parse(threatsResponse.text) as {
      threats: SWOTAnalysisOutput['threats']
    }

    // Synthesize strategies
    const strategiesPrompt = `Situación: "${input.question}"

STRENGTHS identificadas (${strengthsData.strengths.length}):
${strengthsData.strengths.map((s, i) => `${i + 1}. ${s.title} (impact: ${s.impact})\n   ${s.description}`).join('\n\n')}

WEAKNESSES identificadas (${weaknessesData.weaknesses.length}):
${weaknessesData.weaknesses.map((w, i) => `${i + 1}. ${w.title} (severity: ${w.severity})\n   ${w.description}`).join('\n\n')}

OPPORTUNITIES identificadas (${opportunitiesData.opportunities.length}):
${opportunitiesData.opportunities.map((o, i) => `${i + 1}. ${o.title} (potential: ${o.potential})\n   ${o.description}`).join('\n\n')}

THREATS identificadas (${threatsData.threats.length}):
${threatsData.threats.map((t, i) => `${i + 1}. ${t.title} (risk: ${t.risk})\n   ${t.description}`).join('\n\n')}

Crea estrategias accionables para cada cuadrante SWOT.

Output format:
{
  "soStrategies": "SO (Strengths + Opportunities):\n1. ...\n2. ...",
  "woStrategies": "WO (Weaknesses + Opportunities):\n1. ...\n2. ...",
  "stStrategies": "ST (Strengths + Threats):\n1. ...\n2. ...",
  "wtStrategies": "WT (Weaknesses + Threats):\n1. ...\n2. ..."
}`

    const strategiesResponse = await strategistClient.generateWithSystem(
      STRATEGIST_AGENT_CONFIG.systemPrompt,
      strategiesPrompt,
      {
        modelId: STRATEGIST_AGENT_CONFIG.model,
        provider: STRATEGIST_AGENT_CONFIG.provider,
        temperature: STRATEGIST_AGENT_CONFIG.temperature,
        maxTokens: 1500,
      }
    )

    const strategies = JSON.parse(strategiesResponse.text) as SWOTAnalysisOutput['strategies']

    const executionTimeMs = Date.now() - startTime

    quoorumLogger.info('SWOT Analysis completed', {
      strengthsCount: strengthsData.strengths.length,
      weaknessesCount: weaknessesData.weaknesses.length,
      opportunitiesCount: opportunitiesData.opportunities.length,
      threatsCount: threatsData.threats.length,
      executionTimeMs,
    })

    return {
      question: input.question,
      strengths: strengthsData.strengths,
      weaknesses: weaknessesData.weaknesses,
      opportunities: opportunitiesData.opportunities,
      threats: threatsData.threats,
      strategies,
      executionTimeMs,
    }
  } catch (error) {
    quoorumLogger.error('Failed to run SWOT Analysis', {
      error: error instanceof Error ? error.message : String(error),
      question: input.question,
    })
    throw error
  }
}
