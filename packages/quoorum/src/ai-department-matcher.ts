/**
 * AI-Powered Department Matcher
 *
 * Usa IA para hacer matching inteligente de departamentos considerando:
 * - El contexto completo de la empresa
 * - La pregunta específica y su análisis
 * - Las responsabilidades de cada departamento
 * - La sinergia entre departamentos
 */

import { getAIClient, parseAIJson } from '@quoorum/ai'
import type { QuestionAnalysis } from './question-analyzer'
import { quoorumLogger as logger } from './logger'

export interface AIDepartmentMatch {
  /** Departamento */
  department: {
    id: string
    name: string
    type: string
    departmentContext: string
    basePrompt: string
    icon?: string | null
    agentRole: string
  }
  /** Score de matching (0-100) - porcentaje de afinidad */
  matchScore: number
  /** Razones del matching generadas por IA */
  reasons: string[]
  /** Sinergia con otros departamentos sugeridos */
  synergy?: string[]
}

export interface AIDepartmentMatchingOptions {
  /** Número mínimo de departamentos a retornar */
  minDepartments?: number
  /** Número máximo de departamentos a retornar */
  maxDepartments?: number
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
 * Hace matching inteligente de departamentos usando IA
 */
export async function matchDepartmentsWithAI(
  question: string,
  questionAnalysis: QuestionAnalysis,
  availableDepartments: Array<{
    id: string
    name: string
    type: string
    departmentContext: string
    basePrompt: string
    icon?: string | null
    agentRole: string
  }>,
  options: AIDepartmentMatchingOptions = {}
): Promise<AIDepartmentMatch[]> {
  const {
    minDepartments = 3,
    maxDepartments = 5,
    companyContext,
    performanceLevel = 'balanced',
  } = options

  try {
    // Preparar información de departamentos para la IA
    const departmentsInfo = availableDepartments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      type: dept.type,
      responsibilities: dept.departmentContext,
      role: dept.agentRole,
      description: dept.basePrompt.substring(0, 200), // Primeros 200 caracteres del prompt
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
DEPARTAMENTOS DISPONIBLES:
${JSON.stringify(departmentsInfo, null, 2)}

Selecciona los ${minDepartments}-${maxDepartments} departamentos más relevantes para esta pregunta, considerando:
1. Qué departamentos se verán afectados por esta decisión
2. Qué departamentos tienen expertise relevante para responder
3. Qué departamentos deben estar involucrados para una decisión informada
4. El contexto específico de la empresa

Calcula un porcentaje de afinidad (0-100%) para cada departamento basado en qué tan directamente se relaciona con la pregunta.
`

    // Get prompt template from new system
    const { getPromptTemplate } = await import('@quoorum/quoorum/lib/prompt-manager');
    const resolvedPrompt = await getPromptTemplate(
      'match-departments',
      {
        question,
        questionAnalysis: JSON.stringify(questionAnalysis),
        companyContext: companyContext ? JSON.stringify(companyContext) : '',
        departmentsInfo: JSON.stringify(departmentsInfo),
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

    logger.info('[AI Department Matcher] AI response received', {
      responseLength: response.text.length,
    })

    // Parsear respuesta JSON
    const parsed = parseAIJson<{
      selectedDepartments: Array<{
        departmentId: string
        matchScore: number
        reasons: string[]
        synergy?: string[]
      }>
      reasoning: string
      teamComposition: string
    }>(response.text)

    if (!parsed || !parsed.selectedDepartments || !Array.isArray(parsed.selectedDepartments)) {
      throw new Error('Invalid AI response format')
    }

    // Convertir a AIDepartmentMatch[]
    const matches: AIDepartmentMatch[] = []

    for (const selected of parsed.selectedDepartments) {
      const department = availableDepartments.find((d) => d.id === selected.departmentId)
      if (!department) {
        logger.warn('[AI Department Matcher] Department not found', { departmentId: selected.departmentId })
        continue
      }

      matches.push({
        department,
        matchScore: Math.min(100, Math.max(0, selected.matchScore)),
        reasons: selected.reasons || [],
        synergy: selected.synergy,
      })
    }

    // Asegurar mínimo de departamentos
    if (matches.length < minDepartments) {
      logger.warn('[AI Department Matcher] Not enough departments selected, adding more', {
        current: matches.length,
        required: minDepartments,
      })

      // Añadir departamentos adicionales basados en análisis de keywords (fallback)
      const existingIds = new Set(matches.map((m) => m.department.id))
      const remaining = availableDepartments.filter((d) => !existingIds.has(d.id))

      // Ordenar por relevancia basada en áreas de expertise
      const scored = remaining.map((dept) => {
        let score = 0
        for (const area of questionAnalysis.areas) {
          // Match basado en tipo de departamento y áreas
          const typeMatch = getDepartmentTypeRelevance(dept.type, area.area)
          if (typeMatch) {
            score += area.weight * 50
          }
        }
        return { department: dept, score }
      })

      scored.sort((a, b) => b.score - a.score)

      const needed = minDepartments - matches.length
      for (let i = 0; i < needed && i < scored.length; i++) {
        matches.push({
          department: scored[i]!.department,
          matchScore: Math.round(scored[i]!.score),
          reasons: ['Añadido para cumplir mínimo de departamentos'],
        })
      }
    }

    // Limitar a máximo
    matches.sort((a, b) => b.matchScore - a.matchScore)
    const finalMatches = matches.slice(0, maxDepartments)

    logger.info('[AI Department Matcher] Final matches', {
      count: finalMatches.length,
      departments: finalMatches.map((m) => ({
        id: m.department.id,
        name: m.department.name,
        type: m.department.type,
        matchScore: m.matchScore,
      })),
      reasoning: parsed.reasoning,
    })

    return finalMatches
  } catch (error) {
    logger.error(
      '[AI Department Matcher] Error in AI matching, falling back to keyword-based matching',
      error instanceof Error ? error : undefined,
      { error: String(error) }
    )

    // Fallback a matching basado en keywords
    const matches = matchDepartmentsKeywordBased(availableDepartments, questionAnalysis)

    // Convertir a AIDepartmentMatch
    return matches.map((match) => ({
      department: match.department,
      matchScore: match.matchScore,
      reasons: match.reasons,
    }))
  }
}

/**
 * Helper: Matching basado en keywords (fallback)
 */
function matchDepartmentsKeywordBased(
  departments: Array<{
    id: string
    name: string
    type: string
    departmentContext: string
    basePrompt: string
    icon?: string | null
    agentRole: string
  }>,
  analysis: QuestionAnalysis
): Array<{
  department: typeof departments[0]
  matchScore: number
  reasons: string[]
}> {
  const matches: Array<{
    department: typeof departments[0]
    matchScore: number
    reasons: string[]
  }> = []

  // Keywords mapping for department types
  const departmentKeywords: Record<string, string[]> = {
    finance: ['finanzas', 'financiero', 'presupuesto', 'costos', 'gastos', 'inversión', 'roi', 'ebitda', 'cash flow', 'revenue', 'budget'],
    marketing: ['marketing', 'publicidad', 'promoción', 'brand', 'marca', 'audiencia', 'clientes', 'adquisición', 'conversión', 'cac', 'ltv'],
    operations: ['operaciones', 'procesos', 'logística', 'eficiencia', 'escalabilidad', 'producción', 'cadena', 'suministro'],
    hr: ['recursos humanos', 'rrhh', 'talent', 'equipo', 'contratación', 'cultura', 'empleados', 'retention', 'onboarding'],
    sales: ['ventas', 'comercial', 'pipeline', 'deals', 'clientes', 'prospección', 'cierre', 'revenue', 'mrr', 'arr'],
    product: ['producto', 'product', 'roadmap', 'funcionalidad', 'feature', 'usuario', 'ux', 'adopción', 'nps'],
    engineering: ['ingeniería', 'técnico', 'desarrollo', 'código', 'arquitectura', 'infraestructura', 'deuda técnica', 'devops'],
    customer_success: ['customer success', 'satisfacción', 'retention', 'churn', 'soporte', 'onboarding', 'adopción'],
    legal: ['legal', 'compliance', 'regulatorio', 'contratos', 'riesgo legal', 'propiedad intelectual', 'privacidad'],
  }

  // Score each department
  for (const dept of departments) {
    let score = 0
    const reasons: string[] = []

    // Match based on department type keywords
    const keywords = departmentKeywords[dept.type] || []
    const questionLower = analysis.areas.map((a) => a.area).join(' ').toLowerCase()
    const topicsLower = (analysis.topics || []).map((t) => t.name).join(' ').toLowerCase()
    const fullText = `${questionLower} ${topicsLower}`.toLowerCase()

    // Check keyword matches in areas
    for (const area of analysis.areas) {
      for (const keyword of keywords) {
        if (area.area.toLowerCase().includes(keyword) || keyword.includes(area.area.toLowerCase())) {
          const areaScore = area.weight * 50 // 50 points max for area match
          score += areaScore
          reasons.push(`Área "${area.area}" relacionada con ${dept.name} (${Math.round(area.weight * 100)}%)`)
          break
        }
      }
    }

    // Check keyword matches in topics
    for (const topic of (analysis.topics || [])) {
      for (const keyword of keywords) {
        if (topic.name.toLowerCase().includes(keyword) || keyword.includes(topic.name.toLowerCase())) {
          const topicScore = topic.relevance * 30 // 30 points max for topic match
          score += topicScore
          reasons.push(`Temática "${topic.name}" relacionada con ${dept.name}`)
          break
        }
      }
    }

    // Check direct keyword matches in full text
    for (const keyword of keywords) {
      if (fullText.includes(keyword)) {
        score += 20 // Bonus for direct keyword match
        reasons.push(`Menciona "${keyword}" relacionado con ${dept.name}`)
        break
      }
    }

    // Bonus for strategic decisions (all departments relevant)
    if (analysis.decisionType === 'strategic') {
      score += 10
      reasons.push('Decisión estratégica - todos los departamentos relevantes')
    }

    // Only include if score > 0
    if (score > 0) {
      matches.push({
        department: dept,
        matchScore: Math.min(100, Math.round(score)),
        reasons,
      })
    }
  }

  // Sort by score (descending)
  matches.sort((a, b) => b.matchScore - a.matchScore)

  // Return top 3-5 departments
  return matches.slice(0, 5)
}

/**
 * Helper: Relevancia de tipo de departamento para un área
 */
function getDepartmentTypeRelevance(deptType: string, area: string): boolean {
  const relevanceMap: Record<string, string[]> = {
    finance: ['pricing', 'cost', 'budget', 'financial', 'roi', 'revenue'],
    marketing: ['marketing', 'brand', 'acquisition', 'customer', 'audience'],
    operations: ['operations', 'process', 'efficiency', 'scalability'],
    hr: ['team', 'hiring', 'talent', 'culture', 'employee'],
    sales: ['sales', 'revenue', 'pipeline', 'deals', 'customer'],
    product: ['product', 'feature', 'user', 'roadmap'],
    engineering: ['technical', 'development', 'architecture', 'infrastructure'],
    customer_success: ['customer', 'retention', 'satisfaction', 'support'],
    legal: ['legal', 'compliance', 'risk', 'contract'],
  }

  const keywords = relevanceMap[deptType] || []
  const areaLower = area.toLowerCase()

  return keywords.some((keyword) => areaLower.includes(keyword) || keyword.includes(areaLower))
}
