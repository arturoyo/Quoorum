/**
 * Debate Metrics Calculation
 */

import type { DebateResult } from '../types'
import type { DebateMetrics } from './types'

export function calculateDebateMetrics(debates: DebateResult[]): DebateMetrics {
  if (debates.length === 0) {
    return {
      totalDebates: 0,
      completedDebates: 0,
      failedDebates: 0,
      avgConsensusScore: 0,
      avgQualityScore: 0,
      avgDuration: 0,
      avgCost: 0,
      totalCost: 0,
      avgRounds: 0,
      topExperts: [],
      topCategories: [],
      consensusDistribution: { high: 0, medium: 0, low: 0 },
      timeDistribution: { morning: 0, afternoon: 0, evening: 0, night: 0 },
    }
  }

  const completed = debates.filter(d => d.consensusScore !== undefined)
  const failed = debates.length - completed.length

  // Basic metrics
  const avgConsensusScore =
    completed.reduce((sum, d) => sum + d.consensusScore, 0) / completed.length

  // Quality score would come from quality analysis
  const avgQualityScore = 0

  // Duration would be calculated from timestamps
  const avgDuration = 0

  const totalCost = completed.reduce((sum, d) => sum + (d.totalCostUsd || 0), 0)
  const avgCost = totalCost / completed.length

  const avgRounds =
    completed.reduce((sum, d) => sum + (d.rounds?.length || 0), 0) / completed.length

  // Expert participation
  const expertStats = new Map<string, { count: number; totalQuality: number }>()
  for (const debate of completed) {
    if (!debate.experts) continue
    for (const expert of debate.experts) {
      const stats = expertStats.get(expert.name) || { count: 0, totalQuality: 0 }
      stats.count++
      stats.totalQuality += 0 // Would come from quality analysis
      expertStats.set(expert.name, stats)
    }
  }

  const topExperts = Array.from(expertStats.entries())
    .map(([name, stats]) => ({
      name,
      participations: stats.count,
      avgQuality: stats.totalQuality / stats.count,
    }))
    .sort((a, b) => b.participations - a.participations)
    .slice(0, 10)

  // Category distribution
  const categoryStats = new Map<string, number>()
  for (const _debate of completed) {
    const category = 'General' // Would come from debate metadata
    categoryStats.set(category, (categoryStats.get(category) || 0) + 1)
  }

  const topCategories = Array.from(categoryStats.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Consensus distribution
  const consensusDistribution = {
    high: completed.filter(d => d.consensusScore >= 0.9).length,
    medium: completed.filter(d => d.consensusScore >= 0.7 && d.consensusScore < 0.9).length,
    low: completed.filter(d => d.consensusScore < 0.7).length,
  }

  // Time distribution (would need createdAt timestamps)
  const timeDistribution = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  }

  return {
    totalDebates: debates.length,
    completedDebates: completed.length,
    failedDebates: failed,
    avgConsensusScore,
    avgQualityScore,
    avgDuration,
    avgCost,
    totalCost,
    avgRounds,
    topExperts,
    topCategories,
    consensusDistribution,
    timeDistribution,
  }
}
