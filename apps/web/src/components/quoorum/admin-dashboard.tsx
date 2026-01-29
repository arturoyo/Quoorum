/**
 * Admin Dashboard
 * 
 * Comprehensive admin dashboard for forum analytics
 */

'use client'

import React from 'react'

// ============================================================================
// TYPES
// ============================================================================

interface AdminDashboardProps {
  overview: {
    totalUsers: number
    activeUsers: number
    totalDebates: number
    debatesToday: number
    totalCost: number
    costToday: number
    avgConsensus: number
    avgQuality: number
  }
  growth: {
    usersGrowth: number
    debatesGrowth: number
    revenueGrowth: number
  }
  topUsers: Array<{
    userId: string
    debateCount: number
    totalCost: number
    avgConsensus: number
  }>
}

// ============================================================================
// ADMIN DASHBOARD
// ============================================================================

export function AdminDashboard({ overview, growth, topUsers }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={overview.totalUsers}
          subtitle={`${overview.activeUsers} active`}
          trend={growth.usersGrowth}
          icon="👥"
        />
        <StatCard
          title="Total Debates"
          value={overview.totalDebates}
          subtitle={`${overview.debatesToday} today`}
          trend={growth.debatesGrowth}
          icon="💬"
        />
        <StatCard
          title="Total Cost"
          value={`$${overview.totalCost.toFixed(2)}`}
          subtitle={`$${overview.costToday.toFixed(2)} today`}
          trend={growth.revenueGrowth}
          icon="💰"
        />
        <StatCard
          title="Avg Consensus"
          value={`${(overview.avgConsensus * 100).toFixed(0)}%`}
          subtitle={`Quality: ${(overview.avgQuality * 100).toFixed(0)}%`}
          icon="[INFO]"
        />
      </div>

      {/* Top Users */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-[var(--theme-text-primary)] mb-4">Top Users</h3>
        <div className="space-y-3">
          {topUsers.map((user, i) => (
            <div
              key={user.userId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-[var(--theme-text-secondary)]">#{i + 1}</span>
                <div>
                  <div className="font-medium text-[var(--theme-text-primary)]">{user.userId}</div>
                  <div className="text-sm text-[var(--theme-text-tertiary)]">
                    {user.debateCount} debates • ${user.totalCost.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-[var(--theme-text-primary)]">
                  {(user.avgConsensus * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-[var(--theme-text-tertiary)]">avg consensus</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts would go here */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPlaceholder title="Debates Over Time" />
        <ChartPlaceholder title="Cost Breakdown" />
      </div>
    </div>
  )
}

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
}: {
  title: string
  value: string | number
  subtitle: string
  trend?: number
  icon: string
}) {
  const trendColor = trend && trend > 0 ? 'text-green-600' : 'text-red-600'
  const trendIcon = trend && trend > 0 ? '↑' : '↓'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend !== undefined && (
          <span className={`text-sm font-medium ${trendColor}`}>
            {trendIcon} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-[var(--theme-text-primary)] mb-1">{value}</div>
      <div className="text-sm text-[var(--theme-text-tertiary)]">{title}</div>
      <div className="text-xs text-[var(--theme-text-secondary)] mt-1">{subtitle}</div>
    </div>
  )
}

// ============================================================================
// CHART PLACEHOLDER
// ============================================================================

function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-[var(--theme-text-primary)] mb-4">{title}</h3>
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-[var(--theme-text-secondary)] text-sm">Chart visualization</div>
      </div>
    </div>
  )
}

// ============================================================================
// COST TRACKING TABLE
// ============================================================================

export function CostTrackingTable({
  costs,
}: {
  costs: Array<{
    date: string
    operation: string
    model: string
    tokens: number
    cost: number
  }>
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-[var(--theme-text-primary)]">Cost Tracking</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--theme-text-tertiary)] uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--theme-text-tertiary)] uppercase">
                Operation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--theme-text-tertiary)] uppercase">
                Model
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[var(--theme-text-tertiary)] uppercase">
                Tokens
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[var(--theme-text-tertiary)] uppercase">
                Cost
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {costs.map((cost, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-[var(--theme-text-primary)]">{cost.date}</td>
                <td className="px-6 py-4 text-sm text-[var(--theme-text-primary)]">{cost.operation}</td>
                <td className="px-6 py-4 text-sm text-[var(--theme-text-tertiary)]">{cost.model}</td>
                <td className="px-6 py-4 text-sm text-[var(--theme-text-tertiary)] text-right">
                  {cost.tokens.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-[var(--theme-text-primary)] text-right">
                  ${cost.cost.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================================
// USAGE METRICS
// ============================================================================

export function UsageMetricsPanel({
  metrics,
}: {
  metrics: {
    period: { start: Date; end: Date }
    debates: { total: number; completed: number; failed: number; avgPerDay: number }
    costs: { total: number; avgPerDebate: number }
    performance: { avgDuration: number; avgQuality: number; avgConsensus: number }
  }
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[var(--theme-text-primary)]">Usage Metrics</h3>
        <div className="text-sm text-[var(--theme-text-tertiary)]">
          {metrics.period.start.toLocaleDateString()} -{' '}
          {metrics.period.end.toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Debates */}
        <div>
          <h4 className="text-sm font-medium text-[var(--theme-text-tertiary)] mb-3">Debates</h4>
          <div className="space-y-2">
            <MetricRow label="Total" value={metrics.debates.total} />
            <MetricRow label="Completed" value={metrics.debates.completed} />
            <MetricRow label="Failed" value={metrics.debates.failed} />
            <MetricRow label="Avg/Day" value={metrics.debates.avgPerDay.toFixed(1)} />
          </div>
        </div>

        {/* Costs */}
        <div>
          <h4 className="text-sm font-medium text-[var(--theme-text-tertiary)] mb-3">Costs</h4>
          <div className="space-y-2">
            <MetricRow label="Total" value={`$${metrics.costs.total.toFixed(2)}`} />
            <MetricRow label="Per Debate" value={`$${metrics.costs.avgPerDebate.toFixed(2)}`} />
          </div>
        </div>

        {/* Performance */}
        <div>
          <h4 className="text-sm font-medium text-[var(--theme-text-tertiary)] mb-3">Performance</h4>
          <div className="space-y-2">
            <MetricRow label="Avg Duration" value={`${(metrics.performance.avgDuration / 60).toFixed(1)}m`} />
            <MetricRow label="Avg Quality" value={`${(metrics.performance.avgQuality * 100).toFixed(0)}%`} />
            <MetricRow label="Avg Consensus" value={`${(metrics.performance.avgConsensus * 100).toFixed(0)}%`} />
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--theme-text-tertiary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--theme-text-primary)]">{value}</span>
    </div>
  )
}
