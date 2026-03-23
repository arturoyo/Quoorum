/**
 * AI-Powered Worker Matcher
 *
 * Usa IA para hacer matching inteligente de profesionales considerando:
 * - Los departamentos ya seleccionados por IA
 * - El contexto completo de la empresa
 * - La pregunta específica y su análisis
 * - Las responsabilidades y expertise de cada profesional
 * - La sinergia entre profesionales
 */

import { getAIClient, parseAIJson } from '@quoorum/ai'
import type { QuestionAnalysis } from './question-analyzer'
import { quoorumLogger as logger } from './logger'

export interface AIWorkerMatch {
  /** Profesional */
  worker: {
    id: string
    name: string
    role: string
    expertise: string
    responsibilities?: string | null
    description?: string | null
    departmentIds: string[] // IDs de departamentos a los que pertenece
  }
  /** Score de matching (0-100) - porcentaje de afinidad */
  matchScore: number
  /** Razones del matching generadas por IA */
  reasons: string[]
  /** Sinergia con otros profesionales sugeridos */
  synergy?: string[]
}

export interface AIWorkerMatchingOptions {
  /** Número mínimo de profesionales a retornar */
  minWorkers?: number
  /** Número máximo de profesionales a retornar */
  maxWorkers?: number
  /** IDs de departamentos ya seleccionados (priorizar profesionales de estos) */
  selectedDepartmentIds?: string[]
  /** Contexto de la empresa */
  companyContext?: {
    name?: string
    industry?: string
    size?: string
    description?: string
    context?: string
  }
  /** Performance level for AI model selection */
  performanceLevel?: 'economic' | 'balanced' | 'performance'
}

/**
 * Hace matching inteligente de profesionales usando IA
 */
export async function matchWorkersWithAI(
  question: string,
  questionAnalysis: QuestionAnalysis,
  availableWorkers: Array<{
    id: string
    name: string
    role: string
    expertise: string
    responsibilities?: string | null
    description?: string | null
    departmentIds: string[] // IDs de departamentos a los que pertenece
  }>,
  options: AIWorkerMatchingOptions = {}
): Promise<AIWorkerMatch[]> {
  const {
    minWorkers = 2,
    maxWorkers = 5,
    selectedDepartmentIds = [],
    companyContext,
    performanceLevel = 'balanced',
  } = options

  try {
    // Preparar información de profesionales para la IA
    const workersInfo = availableWorkers.map((worker) => ({
      id: worker.id,
      name: worker.name,
      role: worker.role,
      expertise: worker.expertise,
      responsibilities: worker.responsibilities || '',
      description: worker.description || '',
      departmentIds: worker.departmentIds,
      belongsToSelectedDepartments: selectedDepartmentIds.length > 0
        ? worker.departmentIds.some((deptId) => selectedDepartmentIds.includes(deptId))
        : false,
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

    const selectedDepartmentsStr = selectedDepartmentIds.length > 0
      ? `
DEPARTAMENTOS YA SELECCIONADOS:
${selectedDepartmentIds.join(', ')}
IMPORTANTE: Prioriza profesionales que pertenecen a estos departamentos, pero también considera otros si tienen expertise relevante.
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
${selectedDepartmentsStr}
PROFESIONALES DISPONIBLES:
${JSON.stringify(workersInfo, null, 2)}

Selecciona los ${minWorkers}-${maxWorkers} profesionales más relevantes para esta pregunta, considerando:
1. Si hay departamentos seleccionados, prioriza profesionales de esos departamentos
2. Qué profesionales tienen expertise relevante para responder la pregunta
3. Qué profesionales deben estar involucrados para una decisión informada
4. El contexto específico de la empresa
5. Diversidad de roles y perspectivas

Calcula un porcentaje de afinidad (0-100%) para cada profesional basado en:
- Relevancia con departamentos seleccionados (bonus si pertenece a departamentos seleccionados)
- Match entre su expertise y las áreas de la pregunta
- Impacto de la decisión en su área de trabajo
`

    // Get prompt template from new system
    const { getPromptTemplate } = await import('@quoorum/quoorum/lib/prompt-manager');
    const resolvedPrompt = await getPromptTemplate(
      'match-workers',
      {
        question,
        questionAnalysis: JSON.stringify(questionAnalysis),
        companyContext: companyContext ? JSON.stringify(companyContext) : '',
        workersInfo: JSON.stringify(workersInfo),
        selectedDepartmentIds: selectedDepartmentIds.join(', '),
      },
      performanceLevel
    );

    const aiClient = getAIClient()
    const response = await aiClient.generate(userPrompt, {
      systemPrompt: resolvedPrompt.systemPrompt || resolvedPrompt.template,
      modelId: resolvedPrompt.model,
      temperature: resolvedPrompt.temperature,
      maxTokens: resolvedPrompt.maxTokens,
    })

    logger.info('[AI Worker Matcher] AI response received', {
      responseLength: response.text.length,
      selectedDepartmentIds: selectedDepartmentIds.length,
    })

    // Parsear respuesta JSON
    const parsed = parseAIJson<{
      selectedWorkers: Array<{
        workerId: string
        matchScore: number
        reasons: string[]
        synergy?: string[]
      }>
      reasoning: string
      teamComposition: string
    }>(response.text)

    if (!parsed || !parsed.selectedWorkers || !Array.isArray(parsed.selectedWorkers)) {
      throw new Error('Invalid AI response format')
    }

    // Convertir a AIWorkerMatch[]
    const matches: AIWorkerMatch[] = []

    for (const selected of parsed.selectedWorkers) {
      const worker = availableWorkers.find((w) => w.id === selected.workerId)
      if (!worker) {
        logger.warn('[AI Worker Matcher] Worker not found', { workerId: selected.workerId })
        continue
      }

      matches.push({
        worker: {
          id: worker.id,
          name: worker.name,
          role: worker.role,
          expertise: worker.expertise,
          responsibilities: worker.responsibilities,
          description: worker.description,
          departmentIds: worker.departmentIds,
        },
        matchScore: Math.min(100, Math.max(0, selected.matchScore)),
        reasons: selected.reasons || [],
        synergy: selected.synergy,
      })
    }

    // Asegurar mínimo de profesionales
    if (matches.length < minWorkers) {
      logger.warn('[AI Worker Matcher] Not enough workers selected, adding more', {
        current: matches.length,
        required: minWorkers,
      })

      // Añadir profesionales adicionales basados en análisis de keywords (fallback)
      const existingIds = new Set(matches.map((m) => m.worker.id))
      const remaining = availableWorkers.filter((w) => !existingIds.has(w.id))

      // Priorizar profesionales de departamentos seleccionados
      const scored = remaining.map((worker) => {
        let score = 0

        // Bonus si pertenece a departamentos seleccionados
        if (selectedDepartmentIds.length > 0) {
          const belongsToSelected = worker.departmentIds.some((deptId) =>
            selectedDepartmentIds.includes(deptId)
          )
          if (belongsToSelected) {
            score += 40 // Bonus significativo
          }
        }

        // Match basado en expertise y áreas
        for (const area of questionAnalysis.areas) {
          const expertiseLower = worker.expertise.toLowerCase()
          const areaLower = area.area.toLowerCase()
          if (expertiseLower.includes(areaLower) || areaLower.includes(expertiseLower)) {
            score += area.weight * 30
          }
        }

        return { worker, score }
      })

      scored.sort((a, b) => b.score - a.score)

      const needed = minWorkers - matches.length
      for (let i = 0; i < needed && i < scored.length; i++) {
        matches.push({
          worker: {
            id: scored[i]!.worker.id,
            name: scored[i]!.worker.name,
            role: scored[i]!.worker.role,
            expertise: scored[i]!.worker.expertise,
            responsibilities: scored[i]!.worker.responsibilities,
            description: scored[i]!.worker.description,
            departmentIds: scored[i]!.worker.departmentIds,
          },
          matchScore: Math.round(scored[i]!.score),
          reasons: ['Añadido para cumplir mínimo de profesionales'],
        })
      }
    }

    // Limitar a máximo
    matches.sort((a, b) => b.matchScore - a.matchScore)
    const finalMatches = matches.slice(0, maxWorkers)

    logger.info('[AI Worker Matcher] Final matches', {
      count: finalMatches.length,
      workers: finalMatches.map((m) => ({
        id: m.worker.id,
        name: m.worker.name,
        role: m.worker.role,
        matchScore: m.matchScore,
        departmentIds: m.worker.departmentIds,
      })),
      reasoning: parsed.reasoning,
    })

    return finalMatches
  } catch (error) {
    logger.error(
      '[AI Worker Matcher] Error in AI matching, falling back to keyword-based matching',
      error instanceof Error ? error : undefined,
      { error: String(error) }
    )

    // Fallback a matching basado en keywords
    const matches = matchWorkersKeywordBased(availableWorkers, questionAnalysis, selectedDepartmentIds)

    // Convertir a AIWorkerMatch
    return matches.map((match) => ({
      worker: match.worker,
      matchScore: match.matchScore,
      reasons: match.reasons,
    }))
  }
}

/**
 * Helper: Matching basado en keywords (fallback)
 */
function matchWorkersKeywordBased(
  workers: Array<{
    id: string
    name: string
    role: string
    expertise: string
    responsibilities?: string | null
    description?: string | null
    departmentIds: string[]
  }>,
  analysis: QuestionAnalysis,
  selectedDepartmentIds: string[] = []
): Array<{
  worker: typeof workers[0]
  matchScore: number
  reasons: string[]
}> {
  const matches: Array<{
    worker: typeof workers[0]
    matchScore: number
    reasons: string[]
  }> = []

  // Score each worker
  for (const worker of workers) {
    let score = 0
    const reasons: string[] = []

    // Bonus si pertenece a departamentos seleccionados
    if (selectedDepartmentIds.length > 0) {
      const belongsToSelected = worker.departmentIds.some((deptId) =>
        selectedDepartmentIds.includes(deptId)
      )
      if (belongsToSelected) {
        score += 40
        reasons.push('Pertenece a departamentos seleccionados')
      }
    }

    // Match basado en expertise
    const expertiseLower = worker.expertise.toLowerCase()
    const responsibilitiesLower = (worker.responsibilities || '').toLowerCase()
    const fullText = `${expertiseLower} ${responsibilitiesLower}`.toLowerCase()

    // Check matches in areas
    for (const area of analysis.areas) {
      const areaLower = area.area.toLowerCase()
      if (fullText.includes(areaLower) || areaLower.includes(expertiseLower)) {
        const areaScore = area.weight * 30
        score += areaScore
        reasons.push(`Expertise en ${area.area} (${Math.round(area.weight * 100)}%)`)
      }
    }

    // Check matches in topics
    for (const topic of (analysis.topics || [])) {
      const topicLower = topic.name.toLowerCase()
      if (fullText.includes(topicLower)) {
        const topicScore = topic.relevance * 20
        score += topicScore
        reasons.push(`Conocimiento en ${topic.name}`)
      }
    }

    // Only include if score > 0
    if (score > 0) {
      matches.push({
        worker,
        matchScore: Math.min(100, Math.round(score)),
        reasons,
      })
    }
  }

  // Sort by score (descending)
  matches.sort((a, b) => b.matchScore - a.matchScore)

  // Return top 2-5 workers
  return matches.slice(0, 5)
}
