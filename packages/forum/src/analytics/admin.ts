/**
 * Admin Dashboard
 */

import type { DebateResult } from '../types'
import type { AdminDashboard } from './types'
import { calculateDebateMetrics } from './metrics'

const MAX_TOP_USERS = 10

export function generateAdminDashboard(
  allDebates: DebateResult[],
  userDebates: Map<string, DebateResult[]>
): AdminDashboard {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const debatesToday = allDebates.filter(_d => {
    // Would use actual createdAt
    return true
  }).length

  const totalCost = allDebates.reduce((sum, d) => sum + (d.totalCostUsd || 0), 0)
  const costToday = 0 // Would calculate from today's debates

  const metrics = calculateDebateMetrics(allDebates)

  // Top users
  const topUsers = Array.from(userDebates.entries())
    .map(([userId, debates]) => {
      const userMetrics = calculateDebateMetrics(debates)
      return {
        userId,
        debateCount: debates.length,
        totalCost: userMetrics.totalCost,
        avgConsensus: userMetrics.avgConsensusScore,
      }
    })
    .sort((a, b) => b.debateCount - a.debateCount)
    .slice(0, MAX_TOP_USERS)

  return {
    overview: {
      totalUsers: userDebates.size,
      activeUsers: userDebates.size, // Would filter by last 30 days
      totalDebates: allDebates.length,
      debatesToday,
      totalCost,
      costToday,
      avgConsensus: metrics.avgConsensusScore,
      avgQuality: metrics.avgQualityScore,
    },
    growth: {
      usersGrowth: 0, // Would calculate from historical data
      debatesGrowth: 0,
      revenueGrowth: 0,
    },
    topUsers,
    systemHealth: {
      avgResponseTime: 0, // Would track from actual requests
      errorRate: 0,
      cacheHitRate: 0,
      queueLength: 0,
    },
  }
}
