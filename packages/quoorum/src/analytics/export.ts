/**
 * Analytics Export
 */

import type { UserAnalytics, AdminDashboard } from './types'

export function exportAnalyticsReport(
  analytics: UserAnalytics | AdminDashboard,
  format: 'json' | 'csv'
): string {
  if (format === 'json') {
    return JSON.stringify(analytics, null, 2)
  }

  // CSV export (simplified)
  if ('overview' in analytics) {
    // Admin dashboard
    const lines = [
      'Metric,Value',
      `Total Users,${analytics.overview.totalUsers}`,
      `Active Users,${analytics.overview.activeUsers}`,
      `Total Debates,${analytics.overview.totalDebates}`,
      `Total Cost,$${analytics.overview.totalCost.toFixed(2)}`,
      `Avg Consensus,${(analytics.overview.avgConsensus * 100).toFixed(1)}%`,
    ]
    return lines.join('\n')
  } else {
    // User analytics
    const lines = [
      'Metric,Value',
      `Total Debates,${analytics.metrics.totalDebates}`,
      `Avg Consensus,${(analytics.metrics.avgConsensusScore * 100).toFixed(1)}%`,
      `Total Cost,$${analytics.metrics.totalCost.toFixed(2)}`,
      `Avg Quality,${(analytics.metrics.avgQualityScore * 100).toFixed(1)}%`,
    ]
    return lines.join('\n')
  }
}
