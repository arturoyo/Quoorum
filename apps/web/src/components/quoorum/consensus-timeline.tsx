'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { api } from '@/lib/trpc/client'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, styles } from '@/lib/utils'

interface ConsensusTimelineProps {
  debateId: string
}

export function ConsensusTimeline({ debateId }: ConsensusTimelineProps) {
  const { data: timeline, isLoading } = api.debates.getConsensusTimeline.useQuery(
    { debateId },
    { enabled: !!debateId }
  )

  const chartData = useMemo(() => {
    if (!timeline) return []

    return timeline.map((point) => ({
      round: point.round,
      consensus: Math.round(point.consensusScore * 100),
      topOption: point.topOption.substring(0, 30),
    }))
  }, [timeline])

  if (isLoading) {
    return (
      <Card className={styles.card.base}>
        <CardHeader>
          <CardTitle className={styles.colors.text.primary}>Evolución del Consenso</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className={cn("h-[300px] w-full", styles.colors.bg.tertiary)} />
        </CardContent>
      </Card>
    )
  }

  if (!timeline || timeline.length === 0) {
    return null
  }

  return (
    <Card className={styles.card.base}>
      <CardHeader>
        <CardTitle className={styles.colors.text.primary}>Evolución del Consenso</CardTitle>
        <CardDescription className={styles.colors.text.secondary}>
          Cómo evoluciona el consenso a lo largo de las rondas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
            <XAxis
              dataKey="round"
              stroke="var(--theme-text-secondary)"
              label={{ value: 'Ronda', position: 'insideBottom', offset: -5, fill: 'var(--theme-text-secondary)' }}
            />
            <YAxis
              stroke="var(--theme-text-secondary)"
              domain={[0, 100]}
              label={{
                value: 'Consenso %',
                angle: -90,
                position: 'insideLeft',
                fill: 'var(--theme-text-secondary)',
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--theme-bg-secondary)',
                border: '1px solid var(--theme-border)',
                color: 'var(--theme-text-secondary)',
              }}
              labelStyle={{ color: 'var(--theme-text-primary)' }}
            />
            <Legend wrapperStyle={{ color: 'var(--theme-text-secondary)' }} />
            <Line
              type="monotone"
              dataKey="consensus"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Consenso %"
              dot={{ fill: '#8b5cf6', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Timeline de opciones */}
        <div className="mt-4 space-y-2">
          {timeline.map((point, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-4 p-2 rounded",
                styles.colors.border.default,
                styles.colors.bg.tertiary,
                "border"
              )}
            >
              <span className={cn("text-sm w-16", styles.colors.text.tertiary)}>Ronda {point.round}</span>
              <span className={cn("font-medium flex-1", styles.colors.text.primary)}>{point.topOption}</span>
              <span className="text-purple-400 font-semibold">
                {Math.round(point.consensusScore * 100)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
