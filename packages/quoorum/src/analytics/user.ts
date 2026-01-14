/**
 * User Analytics
 */

import type { DebateResult } from '../types'
import type { UserAnalytics } from './types'
import { calculateDebateMetrics } from './metrics'

const DAYS_IN_MS = 24 * 60 * 60 * 1000

export function calculateUserAnalytics(
  userId: string,
  debates: DebateResult[],
  period: { start: Date; end: Date }
): UserAnalytics {
  const metrics = calculateDebateMetrics(debates)

  // Calculate trends (compare with previous period)
  const periodDays = Math.ceil(
    (period.end.getTime() - period.start.getTime()) / DAYS_IN_MS
  )
  const debatesPerDay = debates.length / periodDays

  // For trends, would need historical data
  const trends = {
    debatesPerDay,
    consensusTrend: 0,
    costTrend: 0,
    qualityTrend: 0,
  }

  // Top questions
  const MIN_CONSENSUS = 0.7
  const MAX_TOP_QUESTIONS = 10
  
  const topQuestions = debates
    .filter(d => d.consensusScore >= MIN_CONSENSUS)
    .sort((a, b) => b.consensusScore - a.consensusScore)
    .slice(0, MAX_TOP_QUESTIONS)
    .map(d => ({
      question: d.question || 'Unknown',
      consensus: d.consensusScore,
      date: new Date(), // Would use actual createdAt
    }))

  // Cost breakdown
  const costByCategory: Record<string, number> = {}
  const costByMonth: Record<string, number> = {}

  for (const debate of debates) {
    const category = 'General' // Would come from debate metadata
    costByCategory[category] = (costByCategory[category] || 0) + (debate.totalCostUsd || 0)

    // Month would come from createdAt
    const month = new Date().toISOString().slice(0, 7)
    costByMonth[month] = (costByMonth[month] || 0) + (debate.totalCostUsd || 0)
  }

  return {
    userId,
    period,
    metrics,
    trends,
    topQuestions,
    costBreakdown: {
      byCategory: costByCategory,
      byMonth: costByMonth,
    },
  }
}
