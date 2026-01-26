/**
 * AI-Powered Expert Matcher
 *
 * Usa IA para hacer matching inteligente de expertos considerando:
 * - El contexto completo de la empresa
 * - La pregunta específica
 * - Las especialidades de cada experto
 * - La sinergia entre expertos
 */

import { getAIClient, parseAIJson } from '@quoorum/ai'
import { getAllExperts, getExpert, type ExpertProfile } from './expert-database'
import type { QuestionAnalysis } from './question-analyzer'
import { quoorumLogger as logger } from './logger'

export interface AIExpertMatch {
  /** Perfil del experto */
  expert: ExpertProfile
  /** Score de matching (0-100) */
  score: number
  /** Razones del matching generadas por IA */
  reasons: string[]
  /** Rol sugerido en el debate */
  suggestedRole: 'primary' | 'secondary' | 'critic'
  /** Sinergia con otros expertos sugeridos */
  synergy?: string[]
}

export interface AIExpertMatchingOptions {
  /** Número mínimo de expertos a retornar */
  minExperts?: number
  /** Número máximo de expertos a retornar */
  maxExperts?: number
  /** Incluir siempre al crítico */
  alwaysIncludeCritic?: boolean
  /** Solo seleccionar expertos de empresa */
  companyOnly?: boolean
  /** Contexto de la empresa (industry, size, stage, etc.) */
  companyContext?: {
    name?: string
    industry?: string
    size?: string
    description?: string
    context?: string
  }
}

/**
 * Prompt del sistema para matching inteligente de expertos
 */
const AI_EXPERT_MATCHER_PROMPT = `Eres un experto en selección de equipos de expertos para debates estratégicos.

Tu tarea es analizar una pregunta de negocio y el contexto de una empresa, y seleccionar los expertos más adecuados de una base de datos.

CRITERIOS DE SELECCIÓN:
1. **Relevancia directa**: El experto debe tener expertise específico relacionado con la pregunta
2. **Contexto de empresa**: Considera la industria, tamaño, etapa y situación específica de la empresa
3. **Diversidad de perspectivas**: Selecciona expertos que aporten diferentes ángulos (optimista, crítico, analítico, estratégico)
4. **Sinergia entre expertos**: Los expertos deben complementarse entre sí, no duplicarse
5. **Complejidad de la pregunta**: Para preguntas complejas, incluye más expertos con perspectivas diversas

IMPORTANTE:
- Siempre incluye un crítico (The Critic) para pensamiento crítico
- Selecciona 4-7 expertos en total
- Prioriza expertos con expertise específico sobre la pregunta
- Considera el contexto de la empresa (startup vs enterprise, SaaS vs e-commerce, etc.)
- Explica claramente por qué cada experto es relevante

Responde SOLO con un JSON válido con esta estructura:
{
  "selectedExperts": [
    {
      "expertId": "string (ID del experto)",
      "score": number (0-100),
      "reasons": ["razón 1", "razón 2"],
      "role": "primary" | "secondary" | "critic",
      "synergy": ["expertId1", "expertId2"] // IDs de expertos con los que tiene sinergia
    }
  ],
  "reasoning": "Explicación general de por qué se seleccionaron estos expertos",
  "teamComposition": "Descripción de cómo estos expertos trabajan juntos"
}

NO incluyas markdown, solo JSON puro.`

/**
 * Hace matching inteligente de expertos usando IA
 */
export async function matchExpertsWithAI(
  question: string,
  questionAnalysis: QuestionAnalysis,
  availableExperts: ExpertProfile[],
  options: AIExpertMatchingOptions = {}
): Promise<AIExpertMatch[]> {
  const {
    minExperts = 4,
    maxExperts = 7,
    alwaysIncludeCritic = true,
    companyContext,
  } = options

  try {
    // Preparar información de expertos para la IA
    const expertsInfo = availableExperts.map((expert) => ({
      id: expert.id,
      name: expert.name,
      title: expert.title,
      expertise: expert.expertise,
      topics: expert.topics,
      description: expert.description || '',
      perspective: expert.perspective || '',
    }))

    // Construir prompt con contexto completo
    const companyContextStr = companyContext
      ? `
CONTEXTO DE LA EMPRESA:
- Nombre: ${companyContext.name || 'No especificado'}
- Industria: ${companyContext.industry || 'No especificado'}
- Tamaño: ${companyContext.size || 'No especificado'}
- Descripción: ${companyContext.description || 'No especificado'}
- Contexto adicional: ${companyContext.context || 'No especificado'}
`
      : ''

    const userPrompt = `
PREGUNTA DEL DEBATE:
"${question}"

ANÁLISIS DE LA PREGUNTA:
- Complejidad: ${questionAnalysis.complexity}/10
- Tipo de decisión: ${questionAnalysis.decisionType}
- Áreas identificadas: ${questionAnalysis.areas.map((a) => `${a.area} (${Math.round(a.weight * 100)}%)`).join(', ')}
- Temáticas: ${questionAnalysis.topics?.map((t) => t.name).join(', ') || 'N/A'}
${companyContextStr}
EXPERTOS DISPONIBLES:
${JSON.stringify(expertsInfo, null, 2)}

Selecciona los ${minExperts}-${maxExperts} expertos más adecuados para esta pregunta, considerando el contexto de la empresa y la complejidad de la decisión.
${alwaysIncludeCritic ? 'IMPORTANTE: Siempre incluye "critic" (The Critic) en la selección.' : ''}
`

    const aiClient = getAIClient()
    const response = await aiClient.generate(userPrompt, {
      systemPrompt: AI_EXPERT_MATCHER_PROMPT,
      modelId: 'gemini-2.0-flash-exp', // Free tier, sin cuota
      temperature: 0.7, // Creativo pero consistente
      maxTokens: 2000,
    })

    logger.info('[AI Expert Matcher] AI response received', {
      responseLength: response.text.length,
    })

    // Parsear respuesta JSON
    const parsed = parseAIJson<{
      selectedExperts: Array<{
        expertId: string
        score: number
        reasons: string[]
        role: 'primary' | 'secondary' | 'critic'
        synergy?: string[]
      }>
      reasoning: string
      teamComposition: string
    }>(response.text)

    if (!parsed || !parsed.selectedExperts || !Array.isArray(parsed.selectedExperts)) {
      throw new Error('Invalid AI response format')
    }

    // Convertir a AIExpertMatch[]
    const matches: AIExpertMatch[] = []

    for (const selected of parsed.selectedExperts) {
      const expert = getExpert(selected.expertId)
      if (!expert) {
        logger.warn('[AI Expert Matcher] Expert not found', { expertId: selected.expertId })
        continue
      }

      matches.push({
        expert,
        score: Math.min(100, Math.max(0, selected.score)),
        reasons: selected.reasons || [],
        suggestedRole: selected.role,
        synergy: selected.synergy,
      })
    }

    // Asegurar que tenemos al crítico si se requiere
    if (alwaysIncludeCritic && !matches.find((m) => m.expert.id === 'critic')) {
      const critic = getExpert('critic')
      if (critic) {
        matches.push({
          expert: critic,
          score: 50,
          reasons: ['Pensamiento crítico siempre necesario para debates complejos'],
          suggestedRole: 'critic',
        })
      }
    }

    // Asegurar mínimo de expertos
    if (matches.length < minExperts) {
      logger.warn('[AI Expert Matcher] Not enough experts selected, adding more', {
        current: matches.length,
        required: minExperts,
      })

      // Añadir expertos adicionales basados en análisis de keywords (fallback)
      const existingIds = new Set(matches.map((m) => m.expert.id))
      const remaining = availableExperts.filter((e) => !existingIds.has(e.id))

      // Ordenar por relevancia basada en áreas de expertise
      const scored = remaining.map((expert) => {
        let score = 0
        for (const area of questionAnalysis.areas) {
          const match = expert.expertise.some(
            (e) =>
              e.toLowerCase().includes(area.area.toLowerCase()) ||
              area.area.toLowerCase().includes(e.toLowerCase())
          )
          if (match) {
            score += area.weight * 50
          }
        }
        return { expert, score }
      })

      scored.sort((a, b) => b.score - a.score)

      const needed = minExperts - matches.length
      for (let i = 0; i < needed && i < scored.length; i++) {
        matches.push({
          expert: scored[i]!.expert,
          score: Math.round(scored[i]!.score),
          reasons: ['Añadido para cumplir mínimo de expertos'],
          suggestedRole: 'secondary',
        })
      }
    }

    // Limitar a máximo
    matches.sort((a, b) => b.score - a.score)
    const finalMatches = matches.slice(0, maxExperts)

    logger.info('[AI Expert Matcher] Final matches', {
      count: finalMatches.length,
      experts: finalMatches.map((m) => ({
        id: m.expert.id,
        name: m.expert.name,
        score: m.score,
        role: m.suggestedRole,
      })),
      reasoning: parsed.reasoning,
    })

    return finalMatches
  } catch (error) {
    logger.error(
      '[AI Expert Matcher] Error in AI matching, falling back to keyword-based matching',
      error instanceof Error ? error : undefined,
      { error: String(error) }
    )

    // Fallback a matching basado en keywords
    const { matchExperts } = await import('./expert-matcher')
    const keywordMatches = matchExperts(questionAnalysis, {
      minExperts,
      maxExperts,
      minScore: 30,
      alwaysIncludeCritic,
      companyOnly: options.companyOnly,
    })

    // Convertir a AIExpertMatch
    return keywordMatches.map((match) => ({
      expert: match.expert,
      score: match.score,
      reasons: match.reasons,
      suggestedRole: match.suggestedRole,
    }))
  }
}
