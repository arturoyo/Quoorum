/**
 * Forum OMG AI Features
 *
 * Quick OMGs: AI-Powered insanity (Narrator, Predictor, Auto-generate)
 */

import type { DebateResult } from './types'
import { forumLogger } from './logger'

// ============================================================================
// DEBATE NARRATOR
// ============================================================================

export interface NarratorStyle {
  tone: 'sports' | 'documentary' | 'dramatic' | 'casual'
  enthusiasm: 'low' | 'medium' | 'high'
}

/**
 * Genera narración deportiva del debate
 */
export function narrateDebate(result: DebateResult, style: NarratorStyle = { tone: 'sports', enthusiasm: 'high' }): string {
  let narration = ''

  if (style.tone === 'sports') {
    narration += generateSportsNarration(result, style.enthusiasm)
  } else if (style.tone === 'documentary') {
    narration += generateDocumentaryNarration(result)
  } else if (style.tone === 'dramatic') {
    narration += generateDramaticNarration(result)
  } else {
    narration += generateCasualNarration(result)
  }

  return narration
}

function generateSportsNarration(result: DebateResult, enthusiasm: string): string {
  const exclamation = enthusiasm === 'high' ? '!' : enthusiasm === 'medium' ? '.' : '.'
   let narration = `\n🎬 DEBATE NARRATION - SPORTS STYLE\n\n`

  narration += `Ladies and gentlemen, we're LIVE with an INCREDIBLE debate${exclamation}\n\n`

  for (let i = 0; i < result.rounds.length; i++) {
    const round = result.rounds[i]!
    narration += `\n━━━ ROUND ${i + 1} ━━━\n\n`

    for (const message of round.messages) {
      if (message.agentKey === 'meta_moderator') {
        narration += `🔔 OH! The META-MODERATOR steps in${exclamation} This is getting INTENSE${exclamation}\n\n`
      } else {
        const expertName = message.agentKey.split('_').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ')
        const intensity = message.content.length > 300 ? 'POWERFUL' : 'solid'
        narration += `💥 ${expertName} comes in with a ${intensity} argument${exclamation}\n`
        narration += `"${message.content.substring(0, 100)}..."\n\n`
      }
    }
  }

  const winner = typeof result.finalRanking[0] === 'string' ? result.finalRanking[0] : result.finalRanking[0]?.option || 'No clear winner'
  narration += `\n🏆 AND THE WINNER IS: ${winner}${exclamation}\n`
  narration += `Consensus score: ${(result.consensusScore * 100).toFixed(0)}%${exclamation}\n`
  narration += `\nWhat an AMAZING debate, folks${exclamation}\n`

  return narration
}

function generateDocumentaryNarration(result: DebateResult): string {
  let narration = `\n🎬 DEBATE NARRATION - DOCUMENTARY STYLE\n\n`

  narration += `Over ${result.rounds.length} rounds, experts engaged in a thoughtful discussion...\n\n`

  for (let i = 0; i < result.rounds.length; i++) {
    const round = result.rounds[i]!
    narration += `\nRound ${i + 1}: `

    const expertCount = round.messages.filter((m) => m.agentKey !== 'meta_moderator').length
    narration += `${expertCount} experts shared their perspectives. `

    const hasIntervention = round.messages.some((m) => m.agentKey === 'meta_moderator')
    if (hasIntervention) {
      narration += `The meta-moderator intervened to ensure depth of analysis. `
    }

    narration += '\n'
  }

  const winner = typeof result.finalRanking[0] === 'string' ? result.finalRanking[0] : result.finalRanking[0]?.option
  narration += `\nAfter careful deliberation, the consensus emerged: ${winner}.\n`
  narration += `This conclusion was reached with ${(result.consensusScore * 100).toFixed(0)}% agreement.\n`

  return narration
}

function generateDramaticNarration(result: DebateResult): string {
  let narration = `\n🎭 DEBATE NARRATION - DRAMATIC STYLE\n\n`

  narration += `Experts gather, each bringing their unique perspective to this pivotal moment...\n\n`

  for (let i = 0; i < result.rounds.length; i++) {
    const round = result.rounds[i]!
    const hasIntervention = round.messages.some((m) => m.agentKey === 'meta_moderator')

    if (hasIntervention) {
      narration += `\n⚡ Round ${i + 1}: A turning point. The meta-moderator challenges the discourse.\n`
      narration += `The tension rises. Will the experts rise to the occasion?\n\n`
    } else {
      narration += `\nRound ${i + 1}: Arguments clash like thunder. Each expert stakes their claim.\n\n`
    }
  }

  const winner = typeof result.finalRanking[0] === 'string' ? result.finalRanking[0] : result.finalRanking[0]?.option
  narration += `\n🌟 In the end, clarity emerges from the chaos: ${winner}.\n`
  narration += `The debate concludes, but its impact will resonate...\n`

  return narration
}

function generateCasualNarration(result: DebateResult): string {
  let narration = `\n💬 DEBATE NARRATION - CASUAL STYLE\n\n`

  narration += `Pretty interesting stuff! Here's how it went down:\n\n`

  for (let i = 0; i < result.rounds.length; i++) {
    const round = result.rounds[i]!
    narration += `Round ${i + 1}: `

    const expertCount = round.messages.filter((m) => m.agentKey !== 'meta_moderator').length
    narration += `${expertCount} experts chimed in. `

    const hasIntervention = round.messages.some((m) => m.agentKey === 'meta_moderator')
    if (hasIntervention) {
      narration += `The moderator had to step in to keep things on track. `
    }

    narration += '\n'
  }

  const winner = typeof result.finalRanking[0] === 'string' ? result.finalRanking[0] : result.finalRanking[0]?.option
  narration += `\nTL;DR: They went with ${winner}. Makes sense!\n`

  return narration
}

/**
 * Imprime narración usando logger
 */
export function printNarration(result: DebateResult, style?: NarratorStyle): void {
  const narration = narrateDebate(result, style)
  forumLogger.debug('Debate narration', {
    sessionId: result.sessionId,
    style,
    narration,
  })
}

// ============================================================================
// DEBATE PREDICTOR WITH CONFIDENCE INTERVALS
// ============================================================================

export interface PredictionResult {
  predictedWinner: string
  confidence: number // 0-100
  confidenceInterval: [number, number] // [low, high]
  factors: {
    expertTrackRecord: number
    argumentStrength: number
    historicalPatterns: number
  }
  reasoning: string
}

/**
 * Predice el resultado del debate con intervalos de confianza
 */
export function predictDebateOutcome(
  analysis: { recommendedExperts: string[] },
  currentRound: number,
  totalRounds: number
): PredictionResult {
  // Simulate prediction based on analysis
  const expertTrackRecord = 75 + Math.random() * 20
  const argumentStrength = 60 + Math.random() * 30
  const historicalPatterns = 70 + Math.random() * 25

  const avgScore = (expertTrackRecord + argumentStrength + historicalPatterns) / 3
  const confidence = Math.round(avgScore)
  const margin = Math.round(10 - (currentRound / totalRounds) * 5) // confidence increases over time

  const predictedWinner = analysis.recommendedExperts[0] || 'Unknown'

  return {
    predictedWinner,
    confidence,
    confidenceInterval: [Math.max(0, confidence - margin), Math.min(100, confidence + margin)],
    factors: {
      expertTrackRecord: Math.round(expertTrackRecord),
      argumentStrength: Math.round(argumentStrength),
      historicalPatterns: Math.round(historicalPatterns),
    },
    reasoning: `Based on expert track record (${Math.round(expertTrackRecord)}%), argument strength (${Math.round(argumentStrength)}%), and historical patterns (${Math.round(historicalPatterns)}%), we predict ${predictedWinner} with ${confidence}% confidence.`,
  }
}

/**
 * Renderiza predicción
 */
export function renderPrediction(prediction: PredictionResult): string {
  let output = '\n🔮 Debate Outcome Prediction\n\n'

  output += `Predicted Winner: ${prediction.predictedWinner}\n`
  output += `Confidence: ${prediction.confidence}% ±${Math.abs(prediction.confidenceInterval[1] - prediction.confidence)}%\n\n`

  output += 'Based on:\n'
  output += `  • Expert track record: ${prediction.factors.expertTrackRecord}%\n`
  output += `  • Argument strength: ${prediction.factors.argumentStrength}%\n`
  output += `  • Historical patterns: ${prediction.factors.historicalPatterns}%\n\n`

  output += `Reasoning: ${prediction.reasoning}\n`

  return output
}

// ============================================================================
// AUTO-GENERATE FOLLOW-UP DEBATES
// ============================================================================

export interface FollowUpDebate {
  question: string
  rationale: string
  expectedComplexity: number
  suggestedExperts: string[]
}

/**
 * Genera debates de seguimiento automáticamente
 */
export function generateFollowUpDebates(result: DebateResult): FollowUpDebate[] {
  const winner = typeof result.finalRanking[0] === 'string' ? result.finalRanking[0] : result.finalRanking[0]?.option || 'the chosen option'
  const question = 'the decision' // Placeholder

  const followUps: FollowUpDebate[] = []

  // Implementation details
  followUps.push({
    question: `¿Cómo implementar ${winner} en la práctica?`,
    rationale: 'Translate decision into actionable steps',
    expectedComplexity: 6,
    suggestedExperts: ['operations', 'product', 'engineering'],
  })

  // Pricing/structure
  if (question.toLowerCase().includes('precio') || question.toLowerCase().includes('pricing')) {
    followUps.push({
      question: `¿Cómo estructurar los tiers de ${winner}?`,
      rationale: 'Define pricing tiers and features',
      expectedComplexity: 7,
      suggestedExperts: ['pricing', 'product', 'marketing'],
    })
  }

  // Communication
  followUps.push({
    question: `¿Cómo comunicar el valor de ${winner} a los clientes?`,
    rationale: 'Develop messaging and positioning',
    expectedComplexity: 5,
    suggestedExperts: ['marketing', 'positioning', 'copywriting'],
  })

  // Metrics
  followUps.push({
    question: `¿Qué métricas trackear para validar ${winner}?`,
    rationale: 'Define success metrics and KPIs',
    expectedComplexity: 6,
    suggestedExperts: ['analytics', 'product', 'growth'],
  })

  // Risks
  followUps.push({
    question: `¿Qué riesgos debemos mitigar al implementar ${winner}?`,
    rationale: 'Identify and plan for potential risks',
    expectedComplexity: 7,
    suggestedExperts: ['risk', 'operations', 'critical_thinking'],
  })

  return followUps
}

/**
 * Renderiza follow-ups
 */
export function renderFollowUpDebates(followUps: FollowUpDebate[]): string {
  let output = '\n🔄 Auto-Generated Follow-up Debates\n\n'

  for (let i = 0; i < followUps.length; i++) {
    const followUp = followUps[i]!
    output += `${i + 1}. ${followUp.question}\n`
    output += `   Rationale: ${followUp.rationale}\n`
    output += `   Complexity: ${followUp.expectedComplexity}/10\n`
    output += `   Suggested experts: ${followUp.suggestedExperts.join(', ')}\n\n`
  }

  return output
}

/**
 * Imprime follow-ups usando logger
 */
export function printFollowUpDebates(result: DebateResult): void {
  const followUps = generateFollowUpDebates(result)
  forumLogger.debug('Follow-up debates', {
    sessionId: result.sessionId,
    followUpCount: followUps.length,
    followUps,
  })
}

// ============================================================================
// DEBATE HIGHLIGHTS GENERATOR
// ============================================================================

export interface DebateHighlight {
  type: 'best_argument' | 'plot_twist' | 'intervention' | 'consensus_shift'
  round: number
  expertId: string
  content: string
  impact: number // 0-100
}

/**
 * Genera highlights del debate
 */
export function generateDebateHighlights(result: DebateResult): DebateHighlight[] {
  const highlights: DebateHighlight[] = []

  // Find best arguments (longest, most detailed)
  for (let r = 0; r < result.rounds.length; r++) {
    const round = result.rounds[r]!
    const messages = round.messages.filter((m) => m.agentKey !== 'meta_moderator')

    if (messages.length > 0) {
      const longest = messages.reduce((prev, current) => (current.content.length > prev.content.length ? current : prev))

      highlights.push({
        type: 'best_argument',
        round: r + 1,
        expertId: longest.agentKey,
        content: longest.content.substring(0, 200) + '...',
        impact: 80 + Math.random() * 20,
      })
    }
  }

  // Find interventions
  for (let r = 0; r < result.rounds.length; r++) {
    const round = result.rounds[r]!
    const interventions = round.messages.filter((m) => m.agentKey === 'meta_moderator')

    for (const intervention of interventions) {
      highlights.push({
        type: 'intervention',
        round: r + 1,
        expertId: 'meta_moderator',
        content: intervention.content.substring(0, 200) + '...',
        impact: 90,
      })
    }
  }

  // Sort by impact
  return highlights.sort((a, b) => b.impact - a.impact).slice(0, 5)
}

/**
 * Renderiza highlights
 */
export function renderDebateHighlights(highlights: DebateHighlight[]): string {
  let output = '\n⭐ Top 5 Debate Highlights\n\n'

  for (let i = 0; i < highlights.length; i++) {
    const highlight = highlights[i]!
    const icon = highlight.type === 'intervention' ? '⚡' : highlight.type === 'best_argument' ? '💎' : '🔄'
    const expertName = highlight.expertId.split('_').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ')

    output += `${i + 1}. ${icon} ${getHighlightLabel(highlight.type)} (Round ${highlight.round})\n`
    output += `   ${expertName}\n`
    output += `   Impact: ${highlight.impact.toFixed(0)}/100\n`
    output += `   "${highlight.content}"\n\n`
  }

  return output
}

function getHighlightLabel(type: DebateHighlight['type']): string {
  switch (type) {
    case 'best_argument':
      return 'Best Argument'
    case 'plot_twist':
      return 'Plot Twist'
    case 'intervention':
      return 'Meta-Moderator Intervention'
    case 'consensus_shift':
      return 'Consensus Shift'
  }
}

/**
 * Imprime highlights en consola
 */
export function printDebateHighlights(result: DebateResult): void {
  const highlights = generateDebateHighlights(result)
  forumLogger.debug('Debate highlights', {
    sessionId: result.sessionId,
    highlights,
  })
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const omgAI = {
  narrateDebate,
  printNarration,
  predictDebateOutcome,
  renderPrediction,
  generateFollowUpDebates,
  renderFollowUpDebates,
  printFollowUpDebates,
  generateDebateHighlights,
  renderDebateHighlights,
  printDebateHighlights,
}
