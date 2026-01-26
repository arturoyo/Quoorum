/**
 * Consensus Timeline Visualization
 * 
 * Genera datos para visualizar cómo evoluciona el consenso a lo largo de las rondas.
 */

import type { DebateResult, DebateRound, DebateMessage, RankedOption } from '../types'
import { quoorumLogger } from '../logger'

// ============================================================================
// TYPES
// ============================================================================

export interface ConsensusPoint {
  round: number
  timestamp: Date
  topOption: string
  consensusScore: number // 0-1
  expertAlignment: Map<string, number> // Expert → alignment score (0-1)
  options: {
    option: string
    supportScore: number // 0-1
    expertSupporters: string[] // Expert IDs/Names
  }[]
  gapBetweenTopTwo: number // Difference between top and second option
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Genera timeline de consenso a partir de un debate
 */
export function generateConsensusTimeline(
  debate: DebateResult
): ConsensusPoint[] {
  quoorumLogger.info('Generating consensus timeline', {
    debateId: debate.sessionId,
    rounds: debate.rounds?.length || 0,
  })

  const points: ConsensusPoint[] = []

  // Process each round
  for (let i = 0; i < (debate.rounds?.length || 0); i++) {
    const round = debate.rounds![i]!
    const roundNumber = round.round || i + 1

    // Extract options mentioned in this round
    const options = extractOptionsFromRound(round)

    // Calculate expert alignment
    const expertAlignment = calculateExpertAlignment(round.messages || [])

    // Calculate consensus score
    const consensusScore = calculateConsensusScore(options, expertAlignment)

    // Find top option
    const topOption = options.length > 0 ? options[0]!.option : 'Sin consenso'
    const gapBetweenTopTwo =
      options.length >= 2
        ? options[0]!.supportScore - options[1]!.supportScore
        : 0

    points.push({
      round: roundNumber,
      timestamp: new Date(), // TODO: Use actual timestamp from round if available
      topOption,
      consensusScore,
      expertAlignment,
      options,
      gapBetweenTopTwo,
    })
  }

  return points
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extrae opciones mencionadas en una ronda
 */
function extractOptionsFromRound(
  round: DebateRound
): ConsensusPoint['options'] {
  const optionMap = new Map<string, { supporters: Set<string>; mentions: number }>()

  for (const message of round.messages || []) {
    const expertName = message.agentName || message.agentKey || 'Unknown'
    const options = extractOptionsFromMessage(message.content)

    for (const option of options) {
      if (!optionMap.has(option)) {
        optionMap.set(option, { supporters: new Set(), mentions: 0 })
      }
      const entry = optionMap.get(option)!
      entry.supporters.add(expertName)
      entry.mentions++
    }
  }

  // Convert to array and calculate support scores
  const result: ConsensusPoint['options'] = Array.from(optionMap.entries())
    .map(([option, data]) => ({
      option,
      supportScore: calculateSupportScore(data.supporters.size, data.mentions),
      expertSupporters: Array.from(data.supporters),
    }))
    .sort((a, b) => b.supportScore - a.supportScore)

  return result
}

/**
 * Extrae opciones mencionadas en un mensaje (simple keyword matching)
 */
function extractOptionsFromMessage(content: string): string[] {
  const options: string[] = []

  // Look for patterns like:
  // - "Opción A", "Opción B"
  // - "La primera opción", "La segunda opción"
  // - Numbered lists: "1.", "2.", "3."
  // - Bullet points with clear options

  // Pattern 1: "Opción X" or "opción X"
  const optionPattern = /(?:opción|opcion|option)\s+([A-Z]|\d+)/gi
  const matches = content.matchAll(optionPattern)
  for (const match of matches) {
    options.push(`Opción ${match[1]}`)
  }

  // Pattern 2: Numbered lists (1., 2., 3.)
  const numberedPattern = /^\s*\d+\.\s+(.+)$/gm
  const numberedMatches = content.matchAll(numberedPattern)
  for (const match of numberedMatches) {
    const option = match[1]?.trim()
    if (option && option.length < 100) {
      options.push(option)
    }
  }

  // Pattern 3: Bullet points with clear options
  const bulletPattern = /[-•]\s+(.+?)(?:\n|$)/g
  const bulletMatches = content.matchAll(bulletPattern)
  for (const match of bulletMatches) {
    const option = match[1]?.trim()
    if (option && option.length < 100 && !option.includes('.')) {
      options.push(option)
    }
  }

  return [...new Set(options)] // Remove duplicates
}

/**
 * Calcula alignment entre expertos (qué tan de acuerdo están)
 */
function calculateExpertAlignment(
  messages: DebateMessage[]
): Map<string, number> {
  const alignment = new Map<string, number>()

  // Simple heuristic: count how many experts mention similar keywords
  const keywordCounts = new Map<string, number>()
  const expertKeywords = new Map<string, Set<string>>()

  for (const message of messages) {
    const expertName = message.agentName || message.agentKey || 'Unknown'
    const keywords = extractKeywords(message.content)

    expertKeywords.set(expertName, keywords)

    for (const keyword of keywords) {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1)
    }
  }

  // Calculate alignment: % of keywords that are shared with others
  for (const [expert, keywords] of expertKeywords.entries()) {
    let sharedCount = 0
    for (const keyword of keywords) {
      if ((keywordCounts.get(keyword) || 0) > 1) {
        sharedCount++
      }
    }
    const alignmentScore = keywords.size > 0 ? sharedCount / keywords.size : 0
    alignment.set(expert, alignmentScore)
  }

  return alignment
}

/**
 * Extrae keywords importantes de un mensaje
 */
function extractKeywords(content: string): Set<string> {
  const keywords = new Set<string>()

  // Remove common stop words
  const stopWords = new Set([
    'el',
    'la',
    'de',
    'que',
    'y',
    'a',
    'en',
    'un',
    'es',
    'se',
    'no',
    'te',
    'lo',
    'le',
    'da',
    'su',
    'por',
    'son',
    'con',
    'para',
    'como',
    'pero',
    'más',
    'muy',
    'sin',
    'sobre',
    'también',
    'me',
    'hasta',
    'desde',
    'esta',
    'entre',
    'cuando',
    'todo',
    'esta',
    'ser',
    'son',
    'dos',
    'también',
    'fue',
    'había',
    'era',
    'muy',
    'años',
    'hasta',
    'desde',
    'está',
    'mi',
    'porque',
    'qué',
    'sólo',
    'han',
    'yo',
    'hay',
    'vez',
    'puede',
    'todos',
    'así',
    'nos',
    'ni',
    'parte',
    'tiene',
    'él',
    'uno',
    'donde',
    'bien',
    'tiempo',
    'mismo',
    'ese',
    'ahora',
    'cada',
    'e',
    'vida',
    'otro',
    'después',
    'te',
    'otros',
    'aunque',
    'esas',
    'esos',
    'estas',
    'estos',
    'estas',
    'estos',
    'estas',
    'estos',
    'estas',
    'estos',
  ])

  // Extract words (3+ characters, not stop words)
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w))

  // Count frequency and take top keywords
  const wordCounts = new Map<string, number>()
  for (const word of words) {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
  }

  // Take top 10 keywords
  const sorted = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  for (const [word] of sorted) {
    keywords.add(word)
  }

  return keywords
}

/**
 * Calcula support score para una opción
 */
function calculateSupportScore(
  uniqueSupporters: number,
  totalMentions: number
): number {
  // Normalize: more supporters and mentions = higher score
  const supporterScore = Math.min(uniqueSupporters / 5, 1) // Max 5 experts
  const mentionScore = Math.min(totalMentions / 10, 1) // Max 10 mentions
  return (supporterScore * 0.6 + mentionScore * 0.4)
}

/**
 * Calcula consensus score para una ronda
 */
function calculateConsensusScore(
  options: ConsensusPoint['options'],
  expertAlignment: Map<string, number>
): number {
  if (options.length === 0) {
    return 0
  }

  // Factor 1: Gap between top two options (larger gap = more consensus)
  const gapScore = options.length >= 2
    ? Math.min((options[0]!.supportScore - options[1]!.supportScore) * 2, 1)
    : 1

  // Factor 2: Expert alignment (how much experts agree)
  const alignmentValues = Array.from(expertAlignment.values())
  const avgAlignment =
    alignmentValues.length > 0
      ? alignmentValues.reduce((a, b) => a + b, 0) / alignmentValues.length
      : 0

  // Factor 3: Top option support score
  const topOptionScore = options[0]!.supportScore

  // Weighted average
  return gapScore * 0.4 + avgAlignment * 0.3 + topOptionScore * 0.3
}
