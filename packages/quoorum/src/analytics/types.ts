/**
 * Analytics Types
 */

export interface DebateMetrics {
  totalDebates: number
  completedDebates: number
  failedDebates: number
  avgConsensusScore: number
  avgQualityScore: number
  avgDuration: number // seconds
  avgCost: number // USD
  totalCost: number // USD
  avgRounds: number
  topExperts: Array<{ name: string; participations: number; avgQuality: number }>
  topCategories: Array<{ category: string; count: number }>
  consensusDistribution: {
    high: number // 90%+
    medium: number // 70-90%
    low: number // <70%
  }
  timeDistribution: {
    morning: number // 6-12
    afternoon: number // 12-18
    evening: number // 18-24
    night: number // 0-6
  }
}

export interface UserAnalytics {
  userId: string
  period: { start: Date; end: Date }
  metrics: DebateMetrics
  trends: {
    debatesPerDay: number
    consensusTrend: number // % change
    costTrend: number // % change
    qualityTrend: number // % change
  }
  topQuestions: Array<{ question: string; consensus: number; date: Date }>
  costBreakdown: {
    byCategory: Record<string, number>
    byMonth: Record<string, number>
  }
}

export interface AdminDashboard {
  overview: {
    totalUsers: number
    activeUsers: number // last 30 days
    totalDebates: number
    debatesToday: number
    totalCost: number
    costToday: number
    avgConsensus: number
    avgQuality: number
  }
  growth: {
    usersGrowth: number // % change
    debatesGrowth: number // % change
    revenueGrowth: number // % change (if applicable)
  }
  topUsers: Array<{
    userId: string
    debateCount: number
    totalCost: number
    avgConsensus: number
  }>
  systemHealth: {
    avgResponseTime: number
    errorRate: number
    cacheHitRate: number
    queueLength: number
  }
}

export interface CostBreakdown {
  total: number
  byModel: Record<string, number>
  byOperation: Record<string, number>
  byUser: Record<string, number>
  byDate: Record<string, number>
}

export interface UsageMetrics {
  period: { start: Date; end: Date }
  debates: {
    total: number
    completed: number
    failed: number
    avgPerDay: number
  }
  users: {
    total: number
    active: number
    new: number
    returning: number
  }
  costs: {
    total: number
    avgPerDebate: number
    avgPerUser: number
  }
  performance: {
    avgDuration: number
    avgQuality: number
    avgConsensus: number
  }
}
