/**
 * Forum Enhancements
 *
 * Quick WOWs consolidados: AI-powered features, gamification, predictive analytics
 */

import type { DebateResult, DebateRound, DebateMessage } from './types'
import type { QuestionAnalysis } from './question-analyzer'
import type { QualityAnalysis } from './quality-monitor'

// ============================================================================
// AI-POWERED: AUTO-SUMMARY
// ============================================================================

export interface DebateSummary {
  emoji: string
  title: string
  recommendation: string
  pros: string[]
  cons: string[]
  confidence: number
  topOptions: Array<{
    option: string
    score: number
    supporters: number
  }>
}

/**
 * Genera resumen ejecutivo del debate con emojis
 */
export function generateAutoSummary(result: DebateResult): DebateSummary {
  const topOption =
    typeof result.finalRanking[0] === 'string'
      ? result.finalRanking[0]
      : result.finalRanking[0]?.option || 'No consensus'
  const confidence = result.consensusScore

  // Extract pros/cons from messages (simplified)
  const allMessages = result.rounds.flatMap((r) => r.messages)
  const pros = extractPros(allMessages)
  const cons = extractCons(allMessages)

  return {
    emoji: confidence >= 90 ? '🎯' : confidence >= 70 ? '✅' : '🤔',
    title: 'Debate Summary',
    recommendation: topOption,
    pros,
    cons,
    confidence,
    topOptions: result.finalRanking.slice(0, 3).map((opt, i) => ({
      option: typeof opt === 'string' ? opt : opt.option,
      score: 100 - i * 15, // Simplified scoring
      supporters: Math.max(1, result.rounds.length - i),
    })),
  }
}

function extractPros(messages: DebateMessage[]): string[] {
  // Simplified: look for positive keywords
  const pros: string[] = []
  const keywords = ['benefit', 'advantage', 'pro:', 'positive', 'strength']

  for (const msg of messages) {
    for (const keyword of keywords) {
      if (msg.content.toLowerCase().includes(keyword)) {
        const sentences = msg.content.split(/[.!?]/)
        const relevant = sentences.find((s) => s.toLowerCase().includes(keyword))
        if (relevant && relevant.trim().length > 10) {
          pros.push(relevant.trim().substring(0, 100))
          break
        }
      }
    }
    if (pros.length >= 3) break
  }

  return pros.length > 0
    ? pros
    : ['Clear value proposition', 'Strong market fit', 'Scalable approach']
}

function extractCons(messages: DebateMessage[]): string[] {
  // Simplified: look for negative keywords
  const cons: string[] = []
  const keywords = ['risk', 'concern', 'con:', 'negative', 'weakness', 'challenge']

  for (const msg of messages) {
    for (const keyword of keywords) {
      if (msg.content.toLowerCase().includes(keyword)) {
        const sentences = msg.content.split(/[.!?]/)
        const relevant = sentences.find((s) => s.toLowerCase().includes(keyword))
        if (relevant && relevant.trim().length > 10) {
          cons.push(relevant.trim().substring(0, 100))
          break
        }
      }
    }
    if (cons.length >= 3) break
  }

  return cons.length > 0
    ? cons
    : ['Requires validation', 'Market uncertainty', 'Resource constraints']
}

/**
 * Formatea el resumen como texto con emojis
 */
export function formatSummary(summary: DebateSummary): string {
  const lines = [
    `${summary.emoji} ${summary.title}`,
    '',
    `🎯 Recomendación: ${summary.recommendation}`,
    `📊 Confidence: ${summary.confidence}%`,
    '',
    '✅ Pros:',
    ...summary.pros.map((p) => `  • ${p}`),
    '',
    '⚠️ Cons:',
    ...summary.cons.map((c) => `  • ${c}`),
    '',
    '📈 Top Options:',
    ...summary.topOptions.map(
      (o) =>
        `  ${o.score >= 80 ? '🥇' : o.score >= 60 ? '🥈' : '🥉'} ${o.option} (${o.score}%, ${o.supporters} supporters)`
    ),
  ]

  return lines.join('\n')
}

// ============================================================================
// AI-POWERED: SENTIMENT ANALYSIS
// ============================================================================

export interface SentimentAnalysis {
  round: number
  overall: 'positive' | 'neutral' | 'negative'
  score: number // -1 to 1
  emoji: string
  experts: Array<{
    expertId: string
    sentiment: 'positive' | 'neutral' | 'negative'
    score: number
  }>
}

/**
 * Analiza el sentimiento del debate por ronda
 */
export function analyzeSentiment(round: DebateRound): SentimentAnalysis {
  const expertSentiments = round.messages.map((msg) => {
    const score = calculateSentimentScore(msg.content)
    const sentiment: 'positive' | 'neutral' | 'negative' =
      score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral'
    return {
      expertId: msg.agentKey,
      sentiment,
      score,
    }
  })

  const avgScore = expertSentiments.reduce((sum, e) => sum + e.score, 0) / expertSentiments.length

  return {
    round: round.round,
    overall: avgScore > 0.2 ? 'positive' : avgScore < -0.2 ? 'negative' : 'neutral',
    score: avgScore,
    emoji: avgScore > 0.2 ? '😊' : avgScore < -0.2 ? '😟' : '😐',
    experts: expertSentiments,
  }
}

function calculateSentimentScore(text: string): number {
  const positive = ['good', 'great', 'excellent', 'strong', 'benefit', 'advantage', 'recommend']
  const negative = ['bad', 'poor', 'weak', 'risk', 'concern', 'problem', 'challenge']

  const lower = text.toLowerCase()
  let score = 0

  for (const word of positive) {
    if (lower.includes(word)) score += 0.1
  }
  for (const word of negative) {
    if (lower.includes(word)) score -= 0.1
  }

  return Math.max(-1, Math.min(1, score))
}

// ============================================================================
// AI-POWERED: CONFIDENCE SCORE
// ============================================================================

export interface ConfidenceScore {
  option: string
  confidence: number // 0-100
  emoji: string
  supportingExperts: number
  totalExperts: number
  evidenceStrength: 'high' | 'medium' | 'low'
  reasoning: string
}

/**
 * Calcula confidence score por opción
 */
export function calculateConfidenceScores(result: DebateResult): ConfidenceScore[] {
  return result.finalRanking.slice(0, 3).map((opt, index) => {
    const option = typeof opt === 'string' ? opt : opt.option
    const confidence = Math.max(30, result.consensusScore - index * 15)
    const supportingExperts = Math.max(1, result.rounds.length - index)
    const totalExperts = result.rounds[0]?.messages.length || 4

    return {
      option,
      confidence,
      emoji: confidence >= 80 ? '🟢' : confidence >= 60 ? '🟡' : '🟠',
      supportingExperts,
      totalExperts,
      evidenceStrength: confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low',
      reasoning: generateConfidenceReasoning(confidence, supportingExperts, totalExperts),
    }
  })
}

function generateConfidenceReasoning(
  confidence: number,
  supporting: number,
  total: number
): string {
  const ratio = supporting / total
  if (confidence >= 80 && ratio >= 0.8) {
    return 'Strong consensus with robust evidence'
  }
  if (confidence >= 60 && ratio >= 0.6) {
    return 'Moderate consensus with good support'
  }
  return 'Limited consensus, requires further validation'
}

// ============================================================================
// GAMIFICATION: BADGES
// ============================================================================

export type BadgeType =
  | 'deep_thinker'
  | 'diverse_perspectives'
  | 'fast_consensus'
  | 'quality_master'
  | 'expert_collector'
  | 'consensus_speedrunner'

export interface Badge {
  type: BadgeType
  emoji: string
  title: string
  description: string
  earned: boolean
  progress?: number
  requirement?: number
}

/**
 * Calcula badges ganados en un debate
 */
export function calculateBadges(result: DebateResult, qualityHistory: QualityAnalysis[]): Badge[] {
  const avgQuality =
    qualityHistory.reduce((sum, q) => sum + q.overallQuality, 0) / qualityHistory.length
  const avgDepth = qualityHistory.reduce((sum, q) => sum + q.depthScore, 0) / qualityHistory.length
  const avgDiversity =
    qualityHistory.reduce((sum, q) => sum + q.diversityScore, 0) / qualityHistory.length

  return [
    {
      type: 'deep_thinker',
      emoji: '✨',
      title: 'Deep Thinker',
      description: 'Depth score > 85',
      earned: avgDepth > 85,
      progress: avgDepth,
      requirement: 85,
    },
    {
      type: 'diverse_perspectives',
      emoji: '🌈',
      title: 'Diverse Perspectives',
      description: 'All viewpoints covered',
      earned: avgDiversity > 80,
      progress: avgDiversity,
      requirement: 80,
    },
    {
      type: 'fast_consensus',
      emoji: '⚡',
      title: 'Fast Consensus',
      description: 'Reached in < 5 rounds',
      earned: result.totalRounds < 5,
      progress: result.totalRounds,
      requirement: 5,
    },
    {
      type: 'quality_master',
      emoji: '🏅',
      title: 'Quality Master',
      description: 'Quality > 80',
      earned: avgQuality > 80,
      progress: avgQuality,
      requirement: 80,
    },
  ]
}

// ============================================================================
// GAMIFICATION: LEADERBOARD
// ============================================================================

export interface ExpertStats {
  expertId: string
  expertName: string
  debatesCount: number
  avgConsensus: number
  avgQuality: number
  totalCost: number
  rank: number
  emoji: string
}

/**
 * Genera leaderboard de expertos (requiere histórico)
 */
export function generateLeaderboard(debates: DebateResult[]): ExpertStats[] {
  const stats = new Map<string, ExpertStats>()

  // Aggregate stats (simplified - in real app, track per expert)
  for (const debate of debates) {
    const experts = new Set(debate.rounds.flatMap((r) => r.messages.map((m) => m.agentKey)))

    for (const expertId of experts) {
      if (!stats.has(expertId)) {
        stats.set(expertId, {
          expertId,
          expertName: expertId.replace(/_/g, ' '),
          debatesCount: 0,
          avgConsensus: 0,
          avgQuality: 0,
          totalCost: 0,
          rank: 0,
          emoji: '👤',
        })
      }

      const stat = stats.get(expertId)!
      stat.debatesCount++
      stat.avgConsensus =
        (stat.avgConsensus * (stat.debatesCount - 1) + debate.consensusScore) / stat.debatesCount
      stat.totalCost += debate.totalCostUsd / experts.size
    }
  }

  // Sort and rank
  const sorted = Array.from(stats.values()).sort((a, b) => b.avgConsensus - a.avgConsensus)

  sorted.forEach((stat, i) => {
    stat.rank = i + 1
    stat.emoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '👤'
  })

  return sorted
}

// ============================================================================
// PREDICTIVE: OUTCOME PREDICTOR
// ============================================================================

export interface OutcomePrediction {
  likelyOutcome: string
  confidence: number
  expectedRounds: { min: number; max: number; avg: number }
  estimatedCost: { min: number; max: number; avg: number }
  consensusProbability: number
  reasoning: string
}

/**
 * Predice el resultado del debate basado en análisis de pregunta
 */
export function predictOutcome(analysis: QuestionAnalysis): OutcomePrediction {
  const complexity = analysis.complexity
  const areaCount = analysis.areas.length

  // Simple heuristics
  const expectedRounds = Math.min(20, Math.max(3, complexity + areaCount))
  const estimatedCost = expectedRounds * 0.04
  const consensusProbability = Math.max(50, 100 - complexity * 5)

  return {
    likelyOutcome: analysis.recommendedExperts[0] || 'Unknown',
    confidence: Math.max(60, 100 - complexity * 3),
    expectedRounds: {
      min: Math.max(1, expectedRounds - 2),
      max: expectedRounds + 3,
      avg: expectedRounds,
    },
    estimatedCost: {
      min: estimatedCost * 0.7,
      max: estimatedCost * 1.3,
      avg: estimatedCost,
    },
    consensusProbability,
    reasoning: generatePredictionReasoning(complexity, areaCount),
  }
}

function generatePredictionReasoning(complexity: number, areaCount: number): string {
  if (complexity >= 8) {
    return 'High complexity suggests extended debate with multiple perspectives needed'
  }
  if (areaCount > 3) {
    return 'Multiple knowledge areas require diverse expert input'
  }
  return 'Moderate complexity should lead to relatively quick consensus'
}

// ============================================================================
// PREDICTIVE: QUESTION QUALITY SCORER
// ============================================================================

export interface QuestionQuality {
  score: number // 0-10
  emoji: string
  strengths: string[]
  improvements: string[]
  suggestions: string[]
}

/**
 * Evalúa la calidad de una pregunta
 */
export function scoreQuestionQuality(question: string): QuestionQuality {
  let score = 5 // Base score

  const strengths: string[] = []
  const improvements: string[] = []
  const suggestions: string[] = []

  // Check length
  if (question.length > 50) {
    score += 1
    strengths.push('Clear and specific')
  } else {
    improvements.push('Could be more specific')
  }

  // Check for question mark
  if (question.includes('?')) {
    score += 1
    strengths.push('Properly formatted as question')
  }

  // Check for context keywords
  const contextKeywords = ['wallie', 'porque', 'cómo', 'cuándo', 'dónde']
  if (contextKeywords.some((k) => question.toLowerCase().includes(k))) {
    score += 1
    strengths.push('Has context')
  } else {
    improvements.push('Could include more context')
    suggestions.push('Add context about Wallie or your situation')
  }

  // Check for options
  if (question.includes(' o ') || question.includes(',')) {
    score += 1
    strengths.push('Includes options to evaluate')
  } else {
    suggestions.push('Consider providing specific options to evaluate')
  }

  // Check for constraints
  const constraintKeywords = ['budget', 'tiempo', 'recursos', 'plazo']
  if (constraintKeywords.some((k) => question.toLowerCase().includes(k))) {
    score += 1
    strengths.push('Includes constraints')
  } else {
    suggestions.push('Add constraints (budget, timeline, resources)')
  }

  score = Math.min(10, Math.max(1, score))

  return {
    score,
    emoji: score >= 8 ? '🟢' : score >= 6 ? '🟡' : '🟠',
    strengths,
    improvements,
    suggestions,
  }
}

// ============================================================================
// PREDICTIVE: SMART FOLLOW-UP QUESTIONS
// ============================================================================

/**
 * Genera preguntas de seguimiento inteligentes
 */
export function generateFollowUpQuestions(
  result: DebateResult,
  analysis: QuestionAnalysis
): string[] {
  const topOption = result.finalRanking[0]
  const primaryArea = analysis.areas[0]?.area

  // Early return if no top option
  if (!topOption) {
    return ['¿Qué datos adicionales necesito para tomar esta decisión?']
  }

  const optionText = topOption.option
  const followUps: string[] = []

  // Based on primary area
  if (primaryArea === 'pricing') {
    followUps.push(`¿Cómo estructurar los tiers de pricing para ${optionText}?`)
    followUps.push(`¿Qué estrategia de descuentos usar para ${optionText}?`)
  } else if (primaryArea === 'marketing') {
    followUps.push(`¿Qué canales de marketing priorizar para ${optionText}?`)
    followUps.push(`¿Cómo medir el éxito de ${optionText}?`)
  } else if (primaryArea === 'product') {
    followUps.push(`¿Qué features incluir en ${optionText}?`)
    followUps.push(`¿Cómo validar ${optionText} con usuarios?`)
  }

  // Based on consensus
  if (result.consensusScore < 80) {
    followUps.push('¿Qué datos adicionales necesito para tomar esta decisión?')
  }

  // Generic
  followUps.push(`¿Cuál es el roadmap de implementación para ${optionText}?`)
  followUps.push(`¿Qué riesgos debo mitigar al implementar ${optionText}?`)

  return followUps.slice(0, 3)
}
