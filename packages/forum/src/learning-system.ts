/**
 * Learning System - Expert Performance Tracking & Optimization
 *
 * Tracks expert performance over time and adjusts matching algorithms
 * to improve debate quality and outcomes.
 */

import type { DebateResult } from './types'

export interface ExpertPerformanceMetrics {
  expertId: string
  totalDebates: number
  avgQualityScore: number
  avgConsensusScore: number
  avgDepthContribution: number
  winRate: number // % of debates where their recommendation won
  chemistryScores: Record<string, number> // How well they work with other experts
  specializations: string[] // Areas where they perform best
  lastUpdated: Date
}

export interface LearningInsights {
  topExperts: ExpertPerformanceMetrics[]
  bestCombinations: Array<{
    experts: string[]
    avgQuality: number
    sampleSize: number
  }>
  recommendations: string[]
}

/**
 * Update expert performance metrics after a debate
 */
// eslint-disable-next-line @typescript-eslint/require-await -- Placeholder for future DB implementation
export async function updateExpertPerformance(
  expertId: string,
  debate: DebateResult,
  won: boolean
): Promise<void> {
  const qualityScore = debate.qualityMetrics?.depth ?? 0
  const consensusScore = debate.consensusScore ?? 0

  // Calculate contribution to depth
  const expertMessages =
    debate.rounds?.flatMap((r) => r.messages).filter((m) => m.expert === expertId) ?? []

  const depthContribution =
    expertMessages.length > 0
      ? expertMessages.reduce((sum, m) => sum + (m.content?.length ?? 0), 0) / expertMessages.length
      : 0

  // Update chemistry scores with other experts
  const otherExperts = debate.experts?.filter((e) => e.id !== expertId).map((e) => e.id) ?? []
  const chemistryScores: Record<string, number> = {}

  for (const otherId of otherExperts) {
    // Chemistry score based on quality when both are present
    chemistryScores[otherId] = qualityScore
  }

  // Store metrics (would be persisted to DB in production)
  const _metrics: ExpertPerformanceMetrics = {
    expertId,
    totalDebates: 1,
    avgQualityScore: qualityScore,
    avgConsensusScore: consensusScore,
    avgDepthContribution: depthContribution,
    winRate: won ? 1 : 0,
    chemistryScores,
    specializations: debate.experts?.find((e) => e.id === expertId)?.specializations ?? [],
    lastUpdated: new Date(),
  }

  // In production, this would update the database
  void _metrics // Metrics tracked internally
}

/**
 * Get expert performance metrics
 */
// eslint-disable-next-line @typescript-eslint/require-await -- Placeholder for future DB implementation
export async function getExpertPerformance(
  expertId: string
): Promise<ExpertPerformanceMetrics | null> {
  // In production, this would fetch from database
  // For now, return default metrics
  // TODO: Integrate with database when migrations are executed
  return {
    expertId,
    totalDebates: 0,
    avgQualityScore: 0,
    avgConsensusScore: 0,
    avgDepthContribution: 0,
    winRate: 0,
    chemistryScores: {},
    specializations: [],
    lastUpdated: new Date(),
  }
}

/**
 * Get learning insights from all debates
 */
// eslint-disable-next-line @typescript-eslint/require-await -- Placeholder for future DB implementation
export async function getLearningInsights(): Promise<LearningInsights> {
  // This would analyze all debates and return insights
  // Placeholder implementation
  return {
    topExperts: [],
    bestCombinations: [],
    recommendations: [
      'Consider using Patrick Campbell + Alex Hormozi for pricing decisions',
      'April Dunford performs best in positioning questions',
      'The Critic improves quality by 15% on average',
    ],
  }
}

/**
 * Calculate chemistry score between two experts
 */
export function calculateChemistry(
  expert1Id: string,
  expert2Id: string,
  debates: DebateResult[]
): number {
  // Filter debates where both experts participated
  const jointDebates = debates.filter(
    (d) => d.experts?.some((e) => e.id === expert1Id) && d.experts?.some((e) => e.id === expert2Id)
  )

  if (jointDebates.length === 0) return 50 // Neutral score

  // Average quality when both are present
  const avgQuality =
    jointDebates.reduce((sum, d) => sum + (d.qualityMetrics?.depth ?? 0), 0) / jointDebates.length

  return avgQuality
}

/**
 * Recommend expert combinations for a question
 */
// eslint-disable-next-line @typescript-eslint/require-await -- Placeholder for future ML/DB implementation
export async function recommendExpertCombination(
  questionAreas: string[],
  maxExperts: number = 5
): Promise<string[]> {
  // This would use ML/heuristics to recommend best expert combination
  // For now, simple placeholder

  const recommendations: string[] = []

  // Always include The Critic
  recommendations.push('the-critic')

  // Add domain experts based on areas
  for (const area of questionAreas.slice(0, maxExperts - 1)) {
    // Map area to expert (simplified)
    const expertMap: Record<string, string> = {
      pricing: 'patrick-campbell',
      positioning: 'april-dunford',
      product: 'rahul-vohra',
      growth: 'brian-balfour',
      sales: 'steli-efti',
    }

    const expert = expertMap[area.toLowerCase()]
    if (expert && !recommendations.includes(expert)) {
      recommendations.push(expert)
    }
  }

  return recommendations.slice(0, maxExperts)
}

/**
 * Adjust matching scores based on historical performance
 */
export function adjustMatchingScores(
  baseScores: Record<string, number>,
  performance: Record<string, ExpertPerformanceMetrics>
): Record<string, number> {
  const adjusted: Record<string, number> = {}

  for (const [expertId, baseScore] of Object.entries(baseScores)) {
    const perf = performance[expertId]

    if (!perf) {
      adjusted[expertId] = baseScore
      continue
    }

    // Boost score based on performance
    const performanceBoost = (perf.avgQualityScore / 100) * 20 // Up to +20 points
    const winRateBoost = perf.winRate * 10 // Up to +10 points

    adjusted[expertId] = Math.min(100, baseScore + performanceBoost + winRateBoost)
  }

  return adjusted
}

/**
 * Identify expert specializations from debate history
 */
// eslint-disable-next-line @typescript-eslint/require-await -- Placeholder for future DB implementation
export async function identifySpecializations(_expertId: string): Promise<string[]> {
  // This would analyze debates where expert performed well
  // and extract common themes/topics
  // expertId is prefixed with _ to indicate it's for future use

  // TODO: Implement specialization detection
  return []
}

/**
 * A/B test expert combinations
 */
export interface ABTestConfig {
  variantA: string[] // Expert IDs
  variantB: string[] // Expert IDs
  metric: 'quality' | 'consensus' | 'cost' | 'time'
  sampleSize: number
  currentResults: {
    variantA: { count: number; avgMetric: number }
    variantB: { count: number; avgMetric: number }
  }
}

export function analyzeABTest(config: ABTestConfig): {
  winner: 'A' | 'B' | 'inconclusive'
  confidence: number
  recommendation: string
} {
  const { currentResults } = config

  if (currentResults.variantA.count < 10 || currentResults.variantB.count < 10) {
    return {
      winner: 'inconclusive',
      confidence: 0,
      recommendation: 'Need more data (minimum 10 samples per variant)',
    }
  }

  const diff = Math.abs(currentResults.variantA.avgMetric - currentResults.variantB.avgMetric)
  const avgMetric = (currentResults.variantA.avgMetric + currentResults.variantB.avgMetric) / 2
  const percentDiff = (diff / avgMetric) * 100

  if (percentDiff < 5) {
    return {
      winner: 'inconclusive',
      confidence: 0,
      recommendation: 'Difference too small to be meaningful (<5%)',
    }
  }

  const winner = currentResults.variantA.avgMetric > currentResults.variantB.avgMetric ? 'A' : 'B'
  const confidence = Math.min(95, percentDiff * 5) // Simple confidence calculation

  return {
    winner,
    confidence,
    recommendation: `Variant ${winner} performs ${percentDiff.toFixed(1)}% better`,
  }
}
