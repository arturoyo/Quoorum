/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * Advanced Charts & Visualizations
 *
 * AMAZING-level data visualization
 */

'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// ============================================================================
// COLORS
// ============================================================================

const COLORS = {
  primary: '#00a884',
  secondary: '#0088cc',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
}

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.purple,
  COLORS.pink,
  COLORS.indigo,
  COLORS.warning,
]

// ============================================================================
// CONSENSUS TREND CHART
// ============================================================================

export function ConsensusTrendChart({
  data,
}: {
  data: { round: number; consensus: number; quality: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorConsensus" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8} />
            <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="round" label={{ value: 'Round', position: 'insideBottom', offset: -5 }} />
        <YAxis label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="consensus"
          stroke={COLORS.primary}
          fillOpacity={1}
          fill="url(#colorConsensus)"
          name="Consensus"
        />
        <Area
          type="monotone"
          dataKey="quality"
          stroke={COLORS.secondary}
          fillOpacity={1}
          fill="url(#colorQuality)"
          name="Quality"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ============================================================================
// EXPERT CONTRIBUTION CHART
// ============================================================================

export function ExpertContributionChart({
  data,
}: {
  data: { name: string; interventions: number; avgQuality: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={150} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Bar
          dataKey="interventions"
          fill={COLORS.primary}
          name="Interventions"
          radius={[0, 8, 8, 0]}
        />
        <Bar
          dataKey="avgQuality"
          fill={COLORS.secondary}
          name="Avg Quality"
          radius={[0, 8, 8, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ============================================================================
// DEBATE CATEGORY DISTRIBUTION
// ============================================================================

export function CategoryDistributionChart({
  data,
}: {
  data: { category: string; count: number; percentage: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ category, percentage }) => `${category}: ${percentage}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="count"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ============================================================================
// PERFORMANCE RADAR CHART
// ============================================================================

export function PerformanceRadarChart({
  data,
}: {
  data: {
    metric: string
    value: number
    fullMark: number
  }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: '#6b7280', fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280' }} />
        <Radar
          name="Performance"
          dataKey="value"
          stroke={COLORS.primary}
          fill={COLORS.primary}
          fillOpacity={0.6}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

// ============================================================================
// COST BREAKDOWN CHART
// ============================================================================

export function CostBreakdownChart({
  data,
}: {
  data: { date: string; cost: number; debates: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }} />
        <YAxis
          yAxisId="right"
          orientation="right"
          label={{ value: 'Debates', angle: 90, position: 'insideRight' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="cost"
          stroke={COLORS.primary}
          strokeWidth={2}
          dot={{ fill: COLORS.primary, r: 4 }}
          name="Cost"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="debates"
          stroke={COLORS.secondary}
          strokeWidth={2}
          dot={{ fill: COLORS.secondary, r: 4 }}
          name="Debates"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ============================================================================
// HEATMAP (Custom Implementation)
// ============================================================================

export function ActivityHeatmap({
  data,
}: {
  data: { day: string; hour: number; activity: number }[]
}) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getColor = (activity: number) => {
    if (activity === 0) return '#f3f4f6'
    if (activity < 3) return '#d1fae5'
    if (activity < 6) return '#6ee7b7'
    if (activity < 10) return '#34d399'
    return '#059669'
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col justify-around gap-1 py-8">
            {days.map((day) => (
              <div key={day} className="flex h-6 items-center text-xs text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex-1">
            {/* Hour labels */}
            <div className="mb-1 flex gap-1">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center text-xs text-gray-600"
                  style={{ minWidth: '20px' }}
                >
                  {hour % 3 === 0 ? hour : ''}
                </div>
              ))}
            </div>

            {/* Grid */}
            {days.map((day) => (
              <div key={day} className="mb-1 flex gap-1">
                {hours.map((hour) => {
                  const cell = data.find((d) => d.day === day && d.hour === hour)
                  const activity = cell?.activity || 0

                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="h-6 flex-1 cursor-pointer rounded transition-colors hover:ring-2 hover:ring-primary"
                      style={{
                        backgroundColor: getColor(activity),
                        minWidth: '20px',
                      }}
                      title={`${day} ${hour}:00 - ${activity} debates`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 2, 5, 8, 12].map((val) => (
              <div
                key={val}
                className="h-4 w-4 rounded"
                style={{ backgroundColor: getColor(val) }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// METRIC CARDS WITH SPARKLINES
// ============================================================================

export function MetricCardWithSparkline({
  title,
  value,
  change,
  data,
  format = 'number',
}: {
  title: string
  value: number
  change: number
  data: number[]
  format?: 'number' | 'currency' | 'percentage'
}) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `$${val.toFixed(2)}`
      case 'percentage':
        return `${val.toFixed(1)}%`
      default:
        return val.toString()
    }
  }

  const isPositive = change >= 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{formatValue(value)}</p>
        </div>
        <div
          className={`rounded px-2 py-1 text-sm font-medium ${
            isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
        </div>
      </div>

      {/* Sparkline */}
      <ResponsiveContainer width="100%" height={60}>
        <AreaChart data={data.map((val, i) => ({ value: val, index: i }))}>
          <defs>
            <linearGradient id={`sparkline-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={COLORS.primary}
            fill={`url(#sparkline-${title})`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
