/**
 * Final Synthesis Generator
 *
 * Genera una síntesis ejecutiva final después del debate.
 * Rol: "Secretario del Tribunal" que analiza el historial completo
 * y produce un informe estructurado con recomendación clara.
 */

import { getAIClient } from '@quoorum/ai'
import { quoorumLogger } from './logger'
import { calculateAICost } from './ai-cost-tracking'
import type { DebateRound, FinalSynthesis, FinalSynthesisOption } from './types'

// ============================================================================
// FINAL SYNTHESIS PROMPT
// ============================================================================

const FINAL_SYNTHESIS_PROMPT = `
Actúas como SECRETARIO DEL TRIBUNAL DE EXPERTOS.

Tu misión: Analizar el historial completo del debate y generar un informe ejecutivo estructurado.

# INSTRUCCIONES CRÍTICAS

## ROL
- Eres neutral, objetivo, basado en datos
- No tienes agenda propia
- Tu trabajo es sintetizar, no opinar

## TAREA
Analiza el debate completo y genera un informe ejecutivo que incluya:
1. Resumen ejecutivo (máx 200 palabras)
2. Top 3 opciones viables con % éxito, pros, cons, riesgos
3. Recomendación final justificada con próximos pasos

## ESPECIFICACIONES

### Para cada opción incluye:
- Nombre de la opción (conciso)
- % Éxito estimado (0-100, basado en consenso de expertos)
- Pros (máximo 3, los más importantes)
- Cons (máximo 3, los más críticos)
- Riesgos críticos (máximo 3, los dealbreakers)
- Implementación (1 frase: cómo ejecutar)

### Para la recomendación:
- Opción recomendada (debe estar en Top 3)
- Razonamiento (por qué esta sobre las otras)
- Próximos pasos (3-5 acciones concretas)

### Calidad del debate:
- Convergence Score (0-100): ¿Qué tan bien convergieron los expertos?
- Depth Score (0-100): ¿Qué tan profundo fue el análisis?
- Diversity Score (0-100): ¿Qué tan diversas fueron las perspectivas?

## CRITERIOS DE CALIDAD

[OK] HACER:
- Ignorar argumentos emocionales
- Enfocarse en datos y hechos mencionados
- Identificar patrones de consenso
- Señalar riesgos que TODOS los expertos mencionaron
- Ser honesto si no hay consenso claro

[ERROR] NO HACER:
- Inventar datos que no estén en el debate
- Favorecer a un agente sobre otro
- Usar jerga sin explicar
- Dar soluciones vagas ("depende", "puede funcionar")

## FORMATO DE RESPUESTA

DEBES responder EXACTAMENTE con este JSON (sin texto adicional):

\`\`\`json
{
  "summary": "Resumen ejecutivo del debate...",
  "top3Options": [
    {
      "option": "Nombre de Opción 1",
      "successRate": 85,
      "pros": ["Pro 1", "Pro 2", "Pro 3"],
      "cons": ["Con 1", "Con 2"],
      "criticalRisks": ["Riesgo 1", "Riesgo 2"],
      "implementation": "Cómo ejecutar en 1 frase"
    }
  ],
  "recommendation": {
    "option": "Opción 1",
    "reasoning": "Por qué recomendamos esta opción...",
    "nextSteps": [
      "Paso 1 concreto",
      "Paso 2 concreto",
      "Paso 3 concreto"
    ]
  },
  "debateQuality": {
    "convergenceScore": 85,
    "depthScore": 90,
    "diversityScore": 75
  }
}
\`\`\`

# DEBATE COMPLETO

Pregunta original:
{{QUESTION}}

Historial de rondas:
{{DEBATE_HISTORY}}

---

Genera el JSON ahora (sin explicaciones adicionales):
`

// ============================================================================
// DYNAMIC PROMPT LOADING
// ============================================================================

/**
 * Get final synthesis prompt with dynamic loading
 * Falls back to hardcoded prompt if not found in DB
 */
async function getFinalSynthesisPrompt(
  performanceLevel: 'economic' | 'balanced' | 'performance' = 'balanced'
): Promise<{ template: string; model: string; temperature: number; maxTokens: number }> {
  try {
    const { getPromptTemplate } = await import('./lib/prompt-manager');
    const resolvedPrompt = await getPromptTemplate('final-synthesis', {}, performanceLevel);

    return {
      template: resolvedPrompt.template,
      model: resolvedPrompt.model,
      temperature: resolvedPrompt.temperature,
      maxTokens: resolvedPrompt.maxTokens,
    };
  } catch {
    // Fallback to hardcoded config
    return {
      template: FINAL_SYNTHESIS_PROMPT,
      model: 'gpt-4o',
      temperature: 0.2,
      maxTokens: 2000,
    };
  }
}

// ============================================================================
// SYNTHESIS GENERATOR
// ============================================================================

/**
 * Result of final synthesis generation including cost info
 */
export interface FinalSynthesisResult {
  synthesis: FinalSynthesis
  costUsd: number
  tokensUsed: number
  provider: string
  model: string
}

export async function generateFinalSynthesis(
  sessionId: string,
  question: string,
  rounds: DebateRound[],
  performanceLevel: 'economic' | 'balanced' | 'performance' = 'balanced'
): Promise<FinalSynthesisResult | null> {
  try {
    quoorumLogger.info('[Final Synthesis] Starting synthesis generation', {
      sessionId,
      totalRounds: rounds.length,
      totalMessages: rounds.reduce((sum, r) => sum + r.messages.length, 0),
    })

    // Get dynamic prompt config
    const promptConfig = await getFinalSynthesisPrompt(performanceLevel);

    // Build debate history summary
    const debateHistory = rounds
      .map((round, idx) => {
        const messages = round.messages
          .map(msg => `  - ${msg.agentName}: ${msg.content}`)
          .join('\n')

        const consensus = round.consensusCheck
          ? `\n  Consenso: ${round.consensusCheck.topOptions.map(o => `${o.option} (${o.successRate}%)`).join(', ')}`
          : ''

        return `Ronda ${idx + 1}:\n${messages}${consensus}`
      })
      .join('\n\n')

    // Build final prompt with variables
    const finalPrompt = promptConfig.template
      .replace('{{QUESTION}}', question)
      .replace('{{DEBATE_HISTORY}}', debateHistory)

    // Generate synthesis with model from config
    const client = getAIClient()
    const response = await client.generate(finalPrompt, {
      modelId: promptConfig.model,
      temperature: promptConfig.temperature,
      maxTokens: promptConfig.maxTokens,
    })

    // Parse JSON response
    const synthesisText = response.text.trim()

    // Remove markdown code blocks if present
    const jsonText = synthesisText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const synthesis: FinalSynthesis = JSON.parse(jsonText)

    // Calculate cost for tracking
    const tokensUsed = (response.usage?.promptTokens || 0) + (response.usage?.completionTokens || 0)

    // Detect provider from model ID
    const provider = promptConfig.model.includes('gpt')
      ? 'openai'
      : promptConfig.model.includes('claude')
      ? 'anthropic'
      : 'google';

    const { costUsdTotal: costUsd } = calculateAICost(
      provider,
      promptConfig.model,
      response.usage?.promptTokens || 0,
      response.usage?.completionTokens || 0
    )

    quoorumLogger.info('[Final Synthesis] Synthesis generated successfully', {
      sessionId,
      topOption: synthesis.recommendation.option,
      qualityScores: synthesis.debateQuality,
      tokensUsed,
      costUsd,
      model: promptConfig.model,
      provider,
    })

    return {
      synthesis,
      costUsd,
      tokensUsed,
      provider,
      model: promptConfig.model,
    }

  } catch (error) {
    quoorumLogger.error('[Final Synthesis] Failed to generate synthesis', error instanceof Error ? error : new Error(String(error)), {
      sessionId,
    })

    // Return null instead of throwing - debate can continue without synthesis
    return null
  }
}

/**
 * Helper: Extract key insights from synthesis for quick display
 */
export function extractSynthesisInsights(synthesis: FinalSynthesis): {
  recommendation: string
  successRate: number
  nextStep: string
  quality: string
} {
  const recommendedOption = synthesis.top3Options.find(
    o => o.option === synthesis.recommendation.option
  ) ?? synthesis.top3Options[0]!

  const avgQuality = Math.round(
    (synthesis.debateQuality.convergenceScore +
      synthesis.debateQuality.depthScore +
      synthesis.debateQuality.diversityScore) / 3
  )

  return {
    recommendation: synthesis.recommendation.option,
    successRate: recommendedOption.successRate,
    nextStep: synthesis.recommendation.nextSteps[0] ?? 'No next steps defined',
    quality: avgQuality >= 80 ? 'Excelente' : avgQuality >= 60 ? 'Bueno' : 'Mejorable',
  }
}
