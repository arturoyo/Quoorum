/**
 * Pattern Scoring
 *
 * Calculates scores for each pattern based on detected signals.
 */

import type { PatternType, QuerySignal } from './types'

// ============================================================================
// TYPES
// ============================================================================

export interface PatternScore {
  pattern: PatternType
  score: number
  reasoning: string
}

// ============================================================================
// PATTERN SCORING LOGIC
// ============================================================================

/**
 * Calculate scores for each pattern based on detected signals
 */
export function calculatePatternScores(
  signals: QuerySignal[],
  optionCount: number,
  factors: string[]
): PatternScore[] {
  const scores: PatternScore[] = []

  // Simple - for simple questions with no special signals
  const activeSignals = signals.filter(s => s.detected)
  if (activeSignals.length === 0 || (activeSignals.length === 1 && activeSignals[0]?.type === 'validation')) {
    scores.push({
      pattern: 'simple',
      score: 0.8,
      reasoning: 'Pregunta directa sin complejidad especial',
    })
  } else {
    scores.push({
      pattern: 'simple',
      score: 0.3,
      reasoning: 'Pregunta tiene señales de complejidad',
    })
  }

  // Tournament - for multiple options to compare
  if (optionCount >= 3) {
    scores.push({
      pattern: 'tournament',
      score: 0.9,
      reasoning: `${optionCount} opciones detectadas - torneo para eliminación`,
    })
  } else if (signals.find(s => s.type === 'multiple_options' && s.detected)) {
    scores.push({
      pattern: 'tournament',
      score: 0.75,
      reasoning: 'Múltiples opciones a comparar',
    })
  }

  // Adversarial - for binary choices or high-risk decisions
  const binarySignal = signals.find(s => s.type === 'binary_choice' && s.detected)
  const highRiskSignal = signals.find(s => s.type === 'high_risk' && s.detected)
  if (binarySignal && highRiskSignal) {
    scores.push({
      pattern: 'adversarial',
      score: 0.95,
      reasoning: 'Decisión binaria de alto riesgo - necesita debate adversarial',
    })
  } else if (binarySignal) {
    scores.push({
      pattern: 'adversarial',
      score: 0.7,
      reasoning: 'Decisión binaria - adversarial para explorar ambos lados',
    })
  }

  // Parallel - for multiple independent factors
  if (factors.length >= 3) {
    scores.push({
      pattern: 'parallel',
      score: 0.85,
      reasoning: `${factors.length} factores independientes - paralelo para eficiencia`,
    })
  } else if (signals.find(s => s.type === 'multiple_factors' && s.detected)) {
    scores.push({
      pattern: 'parallel',
      score: 0.7,
      reasoning: 'Múltiples factores a considerar',
    })
  }

  // Hierarchical - for broad topics
  if (signals.find(s => s.type === 'broad_topic' && s.detected)) {
    scores.push({
      pattern: 'hierarchical',
      score: 0.85,
      reasoning: 'Tema amplio que requiere desglose jerárquico',
    })
  }

  // Iterative - for optimization questions
  if (signals.find(s => s.type === 'optimization' && s.detected)) {
    scores.push({
      pattern: 'iterative',
      score: 0.75,
      reasoning: 'Pregunta de optimización - iterar hasta calidad',
    })
  }

  // Ensemble - for high uncertainty / high risk without clear options
  if (highRiskSignal && !binarySignal && optionCount === 0) {
    scores.push({
      pattern: 'ensemble',
      score: 0.8,
      reasoning: 'Alto riesgo sin opciones claras - ensemble para robustez',
    })
  }

  // Conditional - for exploration questions
  if (signals.find(s => s.type === 'exploration' && s.detected)) {
    scores.push({
      pattern: 'conditional',
      score: 0.65,
      reasoning: 'Exploración con posibles bifurcaciones',
    })
  }

  // Sequential - fallback for complex questions
  if (factors.length >= 2 && scores.every(s => s.score < 0.8)) {
    scores.push({
      pattern: 'sequential',
      score: 0.6,
      reasoning: 'Múltiples aspectos que se construyen uno sobre otro',
    })
  }

  return scores.sort((a, b) => b.score - a.score)
}

/**
 * Get available patterns for manual selection
 */
export function getAvailablePatterns(): Array<{
  pattern: PatternType
  name: string
  description: string
  bestFor: string
}> {
  return [
    {
      pattern: 'simple',
      name: 'Simple',
      description: 'Un único debate sin subdivisión',
      bestFor: 'Preguntas directas y sencillas',
    },
    {
      pattern: 'sequential',
      name: 'Secuencial',
      description: 'Debates en cadena, cada uno hereda del anterior',
      bestFor: 'Decisiones que se construyen paso a paso',
    },
    {
      pattern: 'parallel',
      name: 'Paralelo',
      description: 'Múltiples debates simultáneos, luego síntesis',
      bestFor: 'Aspectos independientes de un mismo tema',
    },
    {
      pattern: 'tournament',
      name: 'Torneo',
      description: 'Opciones compiten en eliminatorias',
      bestFor: 'Comparar múltiples opciones (A vs B vs C)',
    },
    {
      pattern: 'adversarial',
      name: 'Adversarial',
      description: 'Defensor vs Atacante + Juez',
      bestFor: 'Decisiones críticas que necesitan stress-test',
    },
    {
      pattern: 'iterative',
      name: 'Iterativo',
      description: 'Refinar hasta alcanzar umbral de calidad',
      bestFor: 'Optimización y mejora continua',
    },
    {
      pattern: 'ensemble',
      name: 'Ensemble',
      description: 'Múltiples perspectivas independientes agregadas',
      bestFor: 'Alta incertidumbre, necesita robustez',
    },
    {
      pattern: 'hierarchical',
      name: 'Jerárquico',
      description: 'Visión general → Detalle en cada área',
      bestFor: 'Temas amplios que necesitan desglose',
    },
    {
      pattern: 'conditional',
      name: 'Condicional',
      description: 'Bifurcaciones según resultados',
      bestFor: 'Exploración con caminos alternativos',
    },
  ]
}
