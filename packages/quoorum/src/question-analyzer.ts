/**
 * Question Analyzer
 *
 * Analiza una pregunta para identificar:
 * - Áreas de conocimiento necesarias
 * - Temáticas específicas
 * - Complejidad estimada
 * - Expertos recomendados
 */

import { getAIClient, parseAIJson } from '@quoorum/ai'

/**
 * Área de conocimiento identificada
 */
export interface KnowledgeArea {
  /** Nombre del área (e.g., "pricing", "marketing", "technical") */
  area: string
  /** Peso/relevancia del área (0-100) */
  weight: number
  /** Razón por la que es relevante */
  reasoning: string
}

/**
 * Temática específica identificada
 */
export interface Topic {
  /** Nombre de la temática (e.g., "SaaS", "B2B", "España") */
  name: string
  /** Relevancia de la temática (0-100) */
  relevance: number
}

/**
 * Resultado del análisis de pregunta
 */
export interface QuestionAnalysis {
  /** Pregunta original */
  question: string
  /** Áreas de conocimiento identificadas (ordenadas por peso) */
  areas: KnowledgeArea[]
  /** Temáticas específicas */
  topics: Topic[]
  /** Complejidad estimada (1-10) */
  complexity: number
  /** Tipo de decisión (strategic, tactical, operational) */
  decisionType: 'strategic' | 'tactical' | 'operational'
  /** Expertos recomendados (nombres) */
  recommendedExperts: string[]
  /** Reasoning del análisis */
  reasoning: string
}

/**
 * Analiza una pregunta para identificar áreas, temáticas y complejidad
 */
export async function analyzeQuestion(
  question: string,
  context?: string,
  performanceLevel: 'economic' | 'balanced' | 'performance' = 'balanced'
): Promise<QuestionAnalysis> {
  // Get prompt template from new system
  const { getPromptTemplate } = await import('@quoorum/quoorum/lib/prompt-manager');
  const resolvedPrompt = await getPromptTemplate(
    'analyze-question',
    {
      question,
      context: context || '',
    },
    performanceLevel
  );

  const fullPrompt = `${resolvedPrompt.systemPrompt || resolvedPrompt.template}

Pregunta: ${question}

${context ? `Contexto:\n${context}\n\n` : ''}Analiza esta pregunta e identifica las áreas de conocimiento, temáticas, complejidad y expertos recomendados.`

  const client = getAIClient()
  const response = await client.generate(fullPrompt, {
    modelId: resolvedPrompt.model,
    temperature: resolvedPrompt.temperature,
    maxTokens: resolvedPrompt.maxTokens,
  })

  // Parse JSON response
  const parsed = parseAIJson<Omit<QuestionAnalysis, 'question'>>(response.text)

  // Sort areas by weight (descending)
  const sortedAreas = parsed.areas.sort((a, b) => b.weight - a.weight)

  // Sort topics by relevance (descending)
  const sortedTopics = parsed.topics.sort((a, b) => b.relevance - a.relevance)

  return {
    question,
    areas: sortedAreas,
    topics: sortedTopics,
    complexity: parsed.complexity,
    decisionType: parsed.decisionType,
    recommendedExperts: parsed.recommendedExperts,
    reasoning: parsed.reasoning,
  }
}

/**
 * Obtiene las áreas principales (top N por peso)
 */
export function getTopAreas(analysis: QuestionAnalysis, count = 3): KnowledgeArea[] {
  return analysis.areas.slice(0, count)
}

/**
 * Obtiene las temáticas principales (top N por relevancia)
 */
export function getTopTopics(analysis: QuestionAnalysis, count = 5): Topic[] {
  return analysis.topics.slice(0, count)
}

/**
 * Determina si la pregunta es de alta complejidad
 */
export function isHighComplexity(analysis: QuestionAnalysis): boolean {
  return analysis.complexity >= 7
}

/**
 * Determina si la pregunta es estratégica
 */
export function isStrategic(analysis: QuestionAnalysis): boolean {
  return analysis.decisionType === 'strategic'
}

/**
 * Estima el número de rondas necesarias basándose en la complejidad
 */
export function estimateRounds(analysis: QuestionAnalysis): number {
  // Complejidad 1-3: 3-5 rondas
  // Complejidad 4-6: 5-10 rondas
  // Complejidad 7-10: 10-20 rondas
  if (analysis.complexity <= 3) {
    return 3 + Math.floor(Math.random() * 3) // 3-5
  } else if (analysis.complexity <= 6) {
    return 5 + Math.floor(Math.random() * 6) // 5-10
  } else {
    return 10 + Math.floor(Math.random() * 11) // 10-20
  }
}

/**
 * Genera un resumen del análisis para logging
 */
export function summarizeAnalysis(analysis: QuestionAnalysis): string {
  const topAreas = getTopAreas(analysis, 3)
    .map((a) => `${a.area} (${a.weight}%)`)
    .join(', ')

  const topTopics = getTopTopics(analysis, 3)
    .map((t) => t.name)
    .join(', ')

  return `Complejidad: ${analysis.complexity}/10 | Tipo: ${analysis.decisionType} | Áreas: ${topAreas} | Temáticas: ${topTopics}`
}
