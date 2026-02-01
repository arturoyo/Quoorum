/**
 * Market Simulator - Focus Group de IA
 *
 * Sistema que permite evaluar variantes de mensajes/copy usando
 * Buyer Personas como jueces dialécticos.
 */

import { callAI } from '@quoorum/ai'
import type { AIProvider } from '@quoorum/ai'

// ============================================================================
// TYPES
// ============================================================================

export interface BuyerPersona {
  id: string
  name: string
  psychographics: {
    jobsToBeDone?: string
    motivations?: string[]
    barriers?: string[]
    professionalProfile?: {
      role?: string
      yearsExperience?: number
      responsibilities?: string[]
    }
  }
}

export interface MarketSimulationInput {
  variants: string[]                    // ["Variante A", "Variante B", ...]
  buyerPersonas: BuyerPersona[]         // Buyer Personas from strategic_profiles
  context?: string                      // Contexto adicional del mercado
  userId?: string                       // Para cost tracking
  companyId?: string                    // Para cost tracking
}

export interface FrictionScore {
  personaId: string
  personaName: string
  variantIndex: number
  frictionScore: number                 // 1-10 (1=sin fricción, 10=rechazo total)
  rejectionArgument: string             // Por qué la rechaza
  alignment: {
    jobsToBeDone: number                // 1-10 (qué tan bien resuelve el JTBD)
    barrierReduction: number            // 1-10 (qué tanto reduce las barreras)
  }
  rawResponse?: string                  // Respuesta completa del agente
}

export interface MarketSimulationResult {
  winningVariant: {
    index: number
    text: string
    consensusScore: number              // Score promedio de aceptación
    avgFriction: number                 // Fricción promedio
  }
  frictionMap: FrictionScore[]
  synthesis: string                     // Análisis de Claude sobre el ganador
  costBreakdown: {
    evaluationCost: number
    synthesisCost: number
    totalCost: number
    totalTokens: number
  }
  executionTime: number                 // ms
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Evalúa una variante desde la perspectiva de un Buyer Persona
 */
async function evaluateVariant(
  variant: string,
  buyerPersona: BuyerPersona,
  variantIndex: number,
  context?: string
): Promise<FrictionScore> {

  const psycho = buyerPersona.psychographics

  const prompt = `Eres ${buyerPersona.name}.

TU CONTEXTO COMO BUYER PERSONA:
- Job to be Done: ${psycho.jobsToBeDone || 'No especificado'}
- Motivaciones principales: ${psycho.motivations?.join(', ') || 'No especificadas'}
- Barreras de Adopción: ${psycho.barriers?.join(', ') || 'No especificadas'}
${psycho.professionalProfile?.role ? `- Tu rol: ${psycho.professionalProfile.role}` : ''}
${context ? `\nCONTEXTO DEL MERCADO:\n${context}` : ''}

VARIANTE A EVALUAR:
"${variant}"

INSTRUCCIONES CRÍTICAS:
No elijas la que más te guste. Tu trabajo es analizar OBJETIVAMENTE:

1. FRICCIÓN MENTAL (1-10):
   ¿Qué nivel de resistencia te genera este mensaje?
   - 1-3: Me habla directamente, resuena con mis necesidades
   - 4-6: Neutro, ni me atrae ni me repele
   - 7-10: Me genera dudas, confusión o rechazo

2. ALINEACIÓN CON JOB TO BE DONE (1-10):
   ¿Qué tan bien este mensaje comunica que resuelve tu problema principal?

3. REDUCCIÓN DE BARRERAS (1-10):
   ¿Este mensaje reduce tus miedos o aumenta tu confianza en la solución?

4. ARGUMENTO DE RECHAZO:
   Si tuvieras que rechazar esta opción, ¿por qué lo harías?
   Sé específico: ¿Qué palabra, frase o concepto te genera fricción?

Sé HIPER-CRÍTICO. Busca fallos en el lenguaje, promesas vacías, jerga innecesaria.

RESPONDE EXCLUSIVAMENTE CON ESTE JSON (sin markdown, sin explicaciones):
{
  "frictionScore": <número 1-10>,
  "rejectionArgument": "<tu crítica específica>",
  "jobAlignment": <número 1-10>,
  "barrierReduction": <número 1-10>
}`

  try {
    const result = await callAI({
      provider: 'openai' as AIProvider,
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user' as const,
        content: prompt
      }],
      temperature: 0.7,
      maxTokens: 500,
      responseFormat: 'json_object'
    })

    const parsed = JSON.parse(result.text)

    return {
      personaId: buyerPersona.id,
      personaName: buyerPersona.name,
      variantIndex,
      frictionScore: parsed.frictionScore,
      rejectionArgument: parsed.rejectionArgument,
      alignment: {
        jobsToBeDone: parsed.jobAlignment,
        barrierReduction: parsed.barrierReduction
      },
      rawResponse: result.text
    }
  } catch (error) {
    console.error('[evaluateVariant] Error:', error)

    // Fallback: respuesta por defecto
    return {
      personaId: buyerPersona.id,
      personaName: buyerPersona.name,
      variantIndex,
      frictionScore: 5,
      rejectionArgument: 'Error al evaluar variante',
      alignment: {
        jobsToBeDone: 5,
        barrierReduction: 5
      }
    }
  }
}

/**
 * Sintetiza el ganador usando Claude
 */
async function synthesizeWinner(
  variants: string[],
  frictionMap: FrictionScore[]
): Promise<{ winningIndex: number; synthesis: string }> {

  // Agrupar scores por variante
  const scoresByVariant = variants.map((variant, idx) => {
    const variantScores = frictionMap.filter(f => f.variantIndex === idx)

    return {
      variant,
      index: idx,
      avgFriction: average(variantScores.map(f => f.frictionScore)),
      avgJobAlignment: average(variantScores.map(f => f.alignment.jobsToBeDone)),
      avgBarrierReduction: average(variantScores.map(f => f.alignment.barrierReduction)),
      critiques: variantScores
    }
  })

  const prompt = `Eres un experto en Psicología del Consumidor y Copywriting.

Analiza los resultados de un Focus Group de IA que evaluó ${variants.length} variantes de mensaje:

${scoresByVariant.map((v, i) => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VARIANTE ${i + 1}: "${v.variant}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MÉTRICAS PROMEDIO:
- Fricción Mental: ${v.avgFriction.toFixed(1)}/10
- Alineación con JTBD: ${v.avgJobAlignment.toFixed(1)}/10
- Reducción de Barreras: ${v.avgBarrierReduction.toFixed(1)}/10

CRÍTICAS DE BUYER PERSONAS:
${v.critiques.map(c => `
  • ${c.personaName}:
    - Fricción: ${c.frictionScore}/10
    - Argumento de rechazo: "${c.rejectionArgument}"
    - Alineación JTBD: ${c.alignment.jobsToBeDone}/10
    - Reduce barreras: ${c.alignment.barrierReduction}/10
`).join('\n')}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TU TAREA:

1. Determina cuál variante genera MENOS RESISTENCIA COLECTIVA
2. Explica POR QUÉ desde una perspectiva de:
   - Psicología del consumidor
   - Teoría de Jobs to be Done
   - Reducción de fricción en toma de decisiones
3. Identifica patrones en las críticas (¿qué palabras/conceptos generan rechazo?)
4. Sugiere 1-2 mejoras concretas para la variante ganadora

IMPORTANTE:
- No te bases solo en el número más bajo de fricción
- Considera el balance entre JTBD alignment y barrier reduction
- Sé específico en tu análisis (cita frases exactas)
- Longitud: 200-300 palabras`

  try {
    const result = await callAI({
      provider: 'anthropic' as AIProvider,
      model: 'claude-3-5-sonnet-20241022',
      messages: [{
        role: 'user' as const,
        content: prompt
      }],
      temperature: 0.5,
      maxTokens: 1000
    })

    // Determinar ganador por menor fricción promedio
    const winner = scoresByVariant.reduce((min, curr) =>
      curr.avgFriction < min.avgFriction ? curr : min
    )

    return {
      winningIndex: winner.index,
      synthesis: result.text
    }
  } catch (error) {
    console.error('[synthesizeWinner] Error:', error)

    // Fallback: elegir por menor fricción
    const winner = scoresByVariant.reduce((min, curr) =>
      curr.avgFriction < min.avgFriction ? curr : min
    )

    return {
      winningIndex: winner.index,
      synthesis: 'Error al generar síntesis. La variante ganadora tiene la menor fricción promedio.'
    }
  }
}

/**
 * Ejecuta la simulación completa de mercado
 */
export async function runMarketSimulation(
  input: MarketSimulationInput
): Promise<MarketSimulationResult> {

  const startTime = Date.now()

  const { variants, buyerPersonas, context } = input

  // Validaciones
  if (variants.length < 2) {
    throw new Error('Se requieren al menos 2 variantes para comparar')
  }

  if (variants.length > 5) {
    throw new Error('Máximo 5 variantes por simulación')
  }

  if (buyerPersonas.length === 0) {
    throw new Error('Se requiere al menos 1 Buyer Persona')
  }

  if (buyerPersonas.length > 10) {
    throw new Error('Máximo 10 Buyer Personas por simulación')
  }

  console.log('[MarketSimulator] Starting simulation:', {
    variants: variants.length,
    personas: buyerPersonas.length
  })

  // PASO 1: Evaluar cada variante por cada persona (paralelo)
  const evaluationPromises: Promise<FrictionScore>[] = []

  for (let vIdx = 0; vIdx < variants.length; vIdx++) {
    for (const persona of buyerPersonas) {
      evaluationPromises.push(
        evaluateVariant(variants[vIdx], persona, vIdx, context)
      )
    }
  }

  const frictionMap = await Promise.all(evaluationPromises)

  console.log('[MarketSimulator] Evaluations completed:', frictionMap.length)

  // PASO 2: Sintetizar ganador con Claude
  const { winningIndex, synthesis } = await synthesizeWinner(variants, frictionMap)

  // PASO 3: Calcular scores
  const winnerScores = frictionMap.filter(f => f.variantIndex === winningIndex)
  const avgFriction = average(winnerScores.map(s => s.frictionScore))
  const consensusScore = 10 - avgFriction // Invertir: menos fricción = más consenso

  // PASO 4: Cost breakdown (aproximado - mejorar con real tracking)
  const evaluationCost = frictionMap.length * 0.001 // ~$0.001 por evaluación con gpt-4o-mini
  const synthesisCost = 0.005 // ~$0.005 por síntesis con Claude
  const totalCost = evaluationCost + synthesisCost
  const totalTokens = frictionMap.length * 400 + 800 // Estimado

  const executionTime = Date.now() - startTime

  console.log('[MarketSimulator] Simulation completed:', {
    winningIndex,
    avgFriction: avgFriction.toFixed(2),
    consensusScore: consensusScore.toFixed(2),
    executionTime: `${executionTime}ms`,
    totalCost: `$${totalCost.toFixed(4)}`
  })

  return {
    winningVariant: {
      index: winningIndex,
      text: variants[winningIndex],
      consensusScore,
      avgFriction
    },
    frictionMap,
    synthesis,
    costBreakdown: {
      evaluationCost,
      synthesisCost,
      totalCost,
      totalTokens
    },
    executionTime
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
}
