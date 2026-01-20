/**
 * Expert Matcher
 *
 * Hace matching automático entre una pregunta analizada y los expertos más adecuados.
 * Usa scoring basado en áreas, temáticas y complejidad.
 */

import type { QuestionAnalysis } from './question-analyzer'
import { getAllExperts, getExpert, type ExpertProfile } from './expert-database'

/**
 * Resultado del matching de un experto
 */
export interface ExpertMatch {
  /** Perfil del experto */
  expert: ExpertProfile
  /** Score de matching (0-100) */
  score: number
  /** Razones del matching */
  reasons: string[]
  /** Rol sugerido en el debate */
  suggestedRole: 'primary' | 'secondary' | 'critic'
}

/**
 * Opciones de matching
 */
export interface MatchingOptions {
  /** Número mínimo de expertos a retornar */
  minExperts?: number
  /** Número máximo de expertos a retornar */
  maxExperts?: number
  /** Score mínimo para incluir un experto */
  minScore?: number
  /** Incluir siempre al crítico */
  alwaysIncludeCritic?: boolean
}

/**
 * Hace matching entre una pregunta analizada y expertos
 */
export function matchExperts(
  analysis: QuestionAnalysis,
  options: MatchingOptions = {}
): ExpertMatch[] {
  const { minExperts = 4, maxExperts = 7, minScore = 30, alwaysIncludeCritic = true } = options

  const allExperts = getAllExperts()
  const matches: ExpertMatch[] = []

  // Calculate score for each expert
  for (const expert of allExperts) {
    const match = scoreExpert(expert, analysis)
    if (match.score >= minScore) {
      matches.push(match)
    }
  }

  // Sort by score (descending)
  matches.sort((a, b) => b.score - a.score)

  // Always include critic if requested
  if (alwaysIncludeCritic) {
    const criticMatch = matches.find((m) => m.expert.id === 'critic')
    if (!criticMatch) {
      const critic = getExpert('critic')
      if (critic) {
        matches.push({
          expert: critic,
          score: 50, // Base score for critic
          reasons: ['Pensamiento crítico siempre necesario'],
          suggestedRole: 'critic',
        })
      }
    }
  }

  // Ensure we have at least minExperts
  let selectedMatches = matches.slice(0, maxExperts)
  if (selectedMatches.length < minExperts) {
    // Add more experts even if below minScore
    const additionalExperts = matches.slice(selectedMatches.length, minExperts)
    selectedMatches = [...selectedMatches, ...additionalExperts]
  }

  // Assign roles
  return assignRoles(selectedMatches)
}

/**
 * Calcula el score de matching para un experto
 */
function scoreExpert(expert: ExpertProfile, analysis: QuestionAnalysis): ExpertMatch {
  let score = 0
  const reasons: string[] = []

  // Score based on expertise match with areas
  for (const area of analysis.areas) {
    const areaMatch = expert.expertise.some(
      (e) =>
        e.toLowerCase().includes(area.area.toLowerCase()) ||
        area.area.toLowerCase().includes(e.toLowerCase())
    )
    if (areaMatch) {
      const areaScore = area.weight * 60 // 60 points max for expertise match (weight is 0-1)
      score += areaScore
      reasons.push(`Expertise en ${area.area} (${Math.round(area.weight * 100)}%)`)
    }
  }

  // Score based on topic match
  for (const topic of analysis.topics) {
    const topicMatch = expert.topics.some(
      (t) =>
        t.toLowerCase().includes(topic.name.toLowerCase()) ||
        topic.name.toLowerCase().includes(t.toLowerCase())
    )
    if (topicMatch) {
      const topicScore = topic.relevance * 30 // 30 points max for topic match (relevance is 0-1)
      score += topicScore
      reasons.push(`Conocimiento en ${topic.name}`)
    }
  }

  // Bonus for strategic decisions
  if (analysis.decisionType === 'strategic' && expert.expertise.includes('strategy')) {
    score += 10
    reasons.push('Experto en decisiones estratégicas')
  }

  // Bonus for high complexity
  if (analysis.complexity >= 7 && expert.id === 'critic') {
    score += 15
    reasons.push('Crítico necesario para alta complejidad')
  }

  // Determine suggested role
  let suggestedRole: 'primary' | 'secondary' | 'critic' = 'secondary'
  if (expert.id === 'critic') {
    suggestedRole = 'critic'
  } else if (score >= 60) {
    suggestedRole = 'primary'
  }

  return {
    expert,
    score: Math.min(100, Math.round(score)),
    reasons,
    suggestedRole,
  }
}

/**
 * Asigna roles a los expertos seleccionados
 */
function assignRoles(matches: ExpertMatch[]): ExpertMatch[] {
  // Critic always gets critic role
  const criticIndex = matches.findIndex((m) => m.expert.id === 'critic')
  if (criticIndex !== -1) {
    matches[criticIndex]!.suggestedRole = 'critic'
  }

  // Top 2-3 experts get primary role
  const primaryCount = Math.min(3, Math.floor(matches.length / 2))
  for (let i = 0; i < primaryCount; i++) {
    if (matches[i] && matches[i]!.expert.id !== 'critic') {
      matches[i]!.suggestedRole = 'primary'
    }
  }

  // Rest get secondary role
  for (let i = primaryCount; i < matches.length; i++) {
    if (matches[i] && matches[i]!.expert.id !== 'critic') {
      matches[i]!.suggestedRole = 'secondary'
    }
  }

  return matches
}

/**
 * Obtiene los expertos primarios (top contributors)
 */
export function getPrimaryExperts(matches: ExpertMatch[]): ExpertMatch[] {
  return matches.filter((m) => m.suggestedRole === 'primary')
}

/**
 * Obtiene los expertos secundarios (supporting voices)
 */
export function getSecondaryExperts(matches: ExpertMatch[]): ExpertMatch[] {
  return matches.filter((m) => m.suggestedRole === 'secondary')
}

/**
 * Obtiene el crítico
 */
export function getCritic(matches: ExpertMatch[]): ExpertMatch | undefined {
  return matches.find((m) => m.suggestedRole === 'critic')
}

/**
 * Genera un resumen del matching para logging
 */
export function summarizeMatching(matches: ExpertMatch[]): string {
  const primary = getPrimaryExperts(matches)
  const secondary = getSecondaryExperts(matches)
  const critic = getCritic(matches)

  const primaryNames = primary.map((m) => m.expert.name).join(', ')
  const secondaryNames = secondary.map((m) => m.expert.name).join(', ')
  const criticName = critic?.expert.name || 'None'

  return `Primary: ${primaryNames} | Secondary: ${secondaryNames} | Critic: ${criticName}`
}

/**
 * Valida que el matching sea adecuado
 */
export function validateMatching(matches: ExpertMatch[]): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []

  // Check minimum experts
  if (matches.length < 3) {
    issues.push('Menos de 3 expertos seleccionados')
  }

  // Check if we have at least one primary
  const primaryCount = getPrimaryExperts(matches).length
  if (primaryCount === 0) {
    issues.push('No hay expertos primarios')
  }

  // Check if we have a critic
  const hasCritic = getCritic(matches) !== undefined
  if (!hasCritic) {
    issues.push('No hay crítico asignado')
  }

  // Check score distribution
  const avgScore = matches.reduce((sum, m) => sum + m.score, 0) / matches.length
  if (avgScore < 40) {
    issues.push(`Score promedio bajo (${Math.round(avgScore)})`)
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}
