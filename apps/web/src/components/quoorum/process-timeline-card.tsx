'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn, styles } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import type { ProcessTimeline } from '@quoorum/db/schema'

interface ProcessTimelineCardProps {
  process: ProcessTimeline
}

export function ProcessTimelineCard({ process }: ProcessTimelineCardProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'in_progress':
        return 'secondary'
      case 'paused':
        return 'outline'
      case 'failed':
        return 'destructive'
      case 'cancelled':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-purple-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 styles.colors.text.tertiary" />
    }
  }

  return (
    <Card className="styles.colors.bg.secondary styles.colors.border.default hover:border-purple-500/30 transition-colors">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getStatusIcon(process.status)}
            <h3 className="styles.colors.text.primary font-medium text-sm">{process.processName}</h3>
          </div>
          <Badge variant={getStatusBadgeVariant(process.status)} className="text-xs">
            {process.status === 'in_progress' ? 'En progreso' : 
             process.status === 'completed' ? 'Completado' :
             process.status === 'paused' ? 'Pausado' :
             process.status === 'failed' ? 'Fallido' :
             process.status === 'cancelled' ? 'Cancelado' : process.status}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs styles.colors.text.secondary mb-2">
            <span>Fase {process.currentPhase} de {process.totalPhases}</span>
            <span className="font-medium">{process.progressPercent}%</span>
          </div>
          <Progress 
            value={process.progressPercent} 
            className="h-2 styles.colors.bg.input"
          />
        </div>

        {/* Phases List */}
        <div className="space-y-3">
          {Array.isArray(process.phases) && process.phases.map((phase, index) => {
            const phaseStatus = phase.status || 'pending'
            const isActive = phase.phaseNumber === process.currentPhase
            const isCompleted = phaseStatus === 'completed'
            const isPending = phaseStatus === 'pending'

            return (
              <div key={phase.phaseNumber || index} className="flex items-start gap-3">
                {/* Phase Number/Icon */}
                <div
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                    isCompleted && 'bg-green-500 text-white',
                    isActive && !isCompleted && 'bg-purple-500 text-white ring-2 ring-purple-500/50',
                    isPending && 'styles.colors.bg.input styles.colors.text.tertiary border styles.colors.border.default',
                    phaseStatus === 'skipped' && 'styles.colors.bg.input styles.colors.text.tertiary opacity-50'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    phase.phaseNumber || index + 1
                  )}
                </div>

                {/* Phase Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCompleted && 'text-white',
                      isActive && !isCompleted && 'text-purple-400',
                      isPending && 'styles.colors.text.tertiary',
                      phaseStatus === 'skipped' && 'styles.colors.text.tertiary line-through'
                    )}
                  >
                    {phase.name}
                  </p>
                  {phase.description && (
                    <p className="text-xs styles.colors.text.tertiary mt-1 line-clamp-2">
                      {phase.description}
                    </p>
                  )}
                  {phase.completedAt && (
                    <p className="text-xs styles.colors.text.tertiary mt-1">
                      Completado {formatDistanceToNow(new Date(phase.completedAt), { addSuffix: true, locale: es })}
                    </p>
                  )}
                  {phase.startedAt && !phase.completedAt && (
                    <p className="text-xs text-purple-400 mt-1">
                      En progreso desde {formatDistanceToNow(new Date(phase.startedAt), { addSuffix: true, locale: es })}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t styles.colors.border.default">
          <p className="text-xs styles.colors.text.tertiary">
            Iniciado {formatDistanceToNow(new Date(process.startedAt), { addSuffix: true, locale: es })}
            {process.completedAt && (
              <> • Completado {formatDistanceToNow(new Date(process.completedAt), { addSuffix: true, locale: es })}</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
