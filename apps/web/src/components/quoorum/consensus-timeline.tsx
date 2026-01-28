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
      <Card className="border-[#2a3942] bg-[#111b21]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-text-primary)]">Evolución del Consenso</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full bg-[#202c33]" />
        </CardContent>
      </Card>
    )
  }

  if (!timeline || timeline.length === 0) {
    return null
  }

  return (
    <Card className="border-[#2a3942] bg-[#111b21]">
      <CardHeader>
        <CardTitle className="text-[var(--theme-text-primary)]">Evolución del Consenso</CardTitle>
        <CardDescription className="text-[#aebac1]">
          Cómo evoluciona el consenso a lo largo de las rondas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3942" />
            <XAxis
              dataKey="round"
              stroke="#aebac1"
              label={{ value: 'Ronda', position: 'insideBottom', offset: -5, fill: '#aebac1' }}
            />
            <YAxis
              stroke="#aebac1"
              domain={[0, 100]}
              label={{
                value: 'Consenso %',
                angle: -90,
                position: 'insideLeft',
                fill: '#aebac1',
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111b21',
                border: '1px solid #2a3942',
                color: '#aebac1',
              }}
              labelStyle={{ color: '#ffffff' }}
            />
            <Legend wrapperStyle={{ color: '#aebac1' }} />
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
              className="flex items-center gap-4 p-2 rounded border border-[#2a3942] bg-[#202c33]"
            >
              <span className="text-sm text-[#8696a0] w-16">Ronda {point.round}</span>
              <span className="text-[var(--theme-text-primary)] font-medium flex-1">{point.topOption}</span>
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
