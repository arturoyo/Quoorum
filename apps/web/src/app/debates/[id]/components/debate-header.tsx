/**
 * DebateHeader Component
 *
 * Shows breadcrumbs, title, status badge, consensus score, and interactive controls.
 */

import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, AlertTriangle, Clock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InteractiveControls } from '@/components/quoorum'
import { DebateTagsManager } from './debate-tags-manager'
import { getPatternLabel } from '../types'
import type { DebateStatus, StatusConfig } from '../types'

// Status badge config
const statusConfig: Record<DebateStatus, StatusConfig> = {
  draft: { label: 'Borrador', color: 'bg-gray-500', icon: Clock },
  pending: { label: 'Pendiente', color: 'bg-yellow-500', icon: Clock },
  in_progress: { label: 'En progreso', color: 'bg-blue-500', icon: Loader2 },
  completed: { label: 'Completado', color: 'bg-green-500', icon: CheckCircle2 },
  failed: { label: 'Fallido', color: 'bg-red-500', icon: AlertTriangle },
  cancelled: { label: 'Cancelado', color: 'bg-gray-500', icon: AlertTriangle },
}

interface DebateHeaderProps {
  debate: {
    id: string
    question: string
    status: string
    consensusScore?: number | null
    metadata?: {
      title?: string
      pattern?: string
      paused?: boolean
      tags?: string[]
      scenarioId?: string
      scenarioName?: string
    } | null
    rounds?: Array<{ messages?: unknown[] }> | null
    experts?: string[] | null
  }
}

export function DebateHeader({ debate }: DebateHeaderProps) {
  const status = debate.status as DebateStatus
  const StatusIcon = statusConfig[status]?.icon

  const displayTitle = debate.metadata?.title || debate.question
  const shortTitle = displayTitle.length > 140 ? `${displayTitle.slice(0, 140)}…` : displayTitle

  return (
    <div className="sticky top-0 z-10 border-b border-[var(--theme-border)] bg-[var(--theme-bg-primary)]/60 backdrop-blur-xl px-4">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5" />
      <div className="relative flex min-h-16 py-3 items-start md:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg md:text-xl font-semibold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent line-clamp-2 mb-2">
              {shortTitle}
            </h1>
            {debate.metadata?.scenarioId && (
              <Badge
                variant="outline"
                className="border-purple-500/30 bg-purple-500/10 text-purple-200 flex items-center gap-1 text-[11px]"
              >
                Escenario
                {debate.metadata?.scenarioName && ` · ${debate.metadata.scenarioName}`}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--theme-text-secondary)]">
            <Badge
              className={cn(
                'flex items-center gap-1',
                statusConfig[status]?.color,
                'text-white'
              )}
            >
              {StatusIcon && <StatusIcon className="h-3 w-3" />}
              {statusConfig[status]?.label}
            </Badge>
            {debate.metadata?.pattern && (
              <>
                <span>•</span>
                <Badge
                  variant="outline"
                  className="border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs"
                  title={`Estrategia: ${getPatternLabel(debate.metadata.pattern)}`}
                >
                  {getPatternLabel(debate.metadata.pattern)}
                </Badge>
              </>
            )}
            {debate.rounds && debate.rounds.length > 0 && (
              <>
                <span>•</span>
                <span>{debate.rounds.length} ronda{debate.rounds.length !== 1 ? 's' : ''}</span>
              </>
            )}
            {debate.experts && debate.experts.length > 0 && (
              <>
                <span>•</span>
                <Users className="h-3 w-3" />
                <span>{debate.experts.length} expertos</span>
              </>
            )}
          </div>
        </div>

        {/* Consensus Score */}
        {debate.consensusScore !== null && debate.consensusScore !== undefined && (
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="text-xs text-[var(--theme-text-secondary)]">Consenso</div>
            <div className="h-12 w-12 rounded-full border-4 border-white/10 bg-slate-950 flex items-center justify-center">
              {debate.consensusScore >= 0.7 ? (
                <CheckCircle2 className="h-6 w-6 text-purple-400" />
              ) : (
                <span className="text-sm font-bold text-white">
                  {(debate.consensusScore * 100).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tags Manager */}
      <div className="px-4 pb-2 border-t border-white/10 pt-2">
        <DebateTagsManager
          debateId={debate.id}
          currentTags={(debate.metadata?.tags as string[]) || []}
        />
      </div>

      {/* Interactive Controls */}
      <InteractiveControls
        debateId={debate.id}
        status={status}
        isPaused={debate.metadata?.paused === true}
        className="px-4 pb-3 border-t border-white/10 pt-3"
      />
    </div>
  )
}
