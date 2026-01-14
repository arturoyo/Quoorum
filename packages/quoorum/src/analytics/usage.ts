/**
 * Usage Metrics
 */

import type { DebateResult } from '../types'
import type { UsageMetrics } from './types'
import { calculateDebateMetrics } from './metrics'

const DAYS_IN_MS = 24 * 60 * 60 * 1000

export function calculateUsageMetrics(
  debates: DebateResult[],
  period: { start: Date; end: Date }
): UsageMetrics {
  const metrics = calculateDebateMetrics(debates)
  
  const periodDays = Math.ceil(
    (period.end.getTime() - period.start.getTime()) / DAYS_IN_MS
  )

  return {
    period,
    debates: {
      total: metrics.totalDebates,
      completed: metrics.completedDebates,
      failed: metrics.failedDebates,
      avgPerDay: metrics.totalDebates / periodDays,
    },
    users: {
      total: 0, // Would count unique users
      active: 0,
      new: 0,
      returning: 0,
    },
    costs: {
      total: metrics.totalCost,
      avgPerDebate: metrics.avgCost,
      avgPerUser: 0,
    },
    performance: {
      avgDuration: metrics.avgDuration,
      avgQuality: metrics.avgQualityScore,
      avgConsensus: metrics.avgConsensusScore,
    },
  }
}
