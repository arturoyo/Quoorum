'use client'

import Link from 'next/link'
import {
  Users,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Flame,
  Target,
  MessageCircle,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import type { BaseWidgetProps } from '@/lib/shared-types'

interface QuoorumInsightsWidgetProps extends BaseWidgetProps {
  compact?: boolean
}

/**
 * Urgency badge colors
 */
const URGENCY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-[#8696a0]/20', text: 'text-[#8696a0]', label: 'Bajo' },
  medium: { bg: 'bg-[#00a884]/20', text: 'text-[#00a884]', label: 'Medio' },
  high: { bg: 'bg-[#f59e0b]/20', text: 'text-[#f59e0b]', label: 'Alto' },
  critical: { bg: 'bg-[#ef4444]/20', text: 'text-[#ef4444]', label: 'Crítico' },
}

/**
 * Response approach icons
 */
const APPROACH_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  empathetic: { icon: MessageCircle, color: '#00a884' },
  assertive: { icon: Target, color: '#f59e0b' },
  consultative: { icon: Lightbulb, color: '#53bdeb' },
  direct: { icon: TrendingUp, color: '#22c55e' },
}

export function QuoorumInsightsWidget({ compact = false, className }: QuoorumInsightsWidgetProps) {
  const {
    data: recent,
    isLoading: recentLoading,
    error: recentError,
  } = api.quoorumInsights.getRecent.useQuery({ limit: compact ? 3 : 5 })

  const { data: stats } = api.quoorumInsights.getStats.useQuery()

  if (recentLoading) {
    return (
      <div className={cn('rounded-xl border border-[#2a3942] bg-[#202c33] p-4', className)}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="mt-4 space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (recentError) {
    return (
      <div className={cn('rounded-xl border border-[#2a3942] bg-[#202c33] p-4', className)}>
        <div className="flex items-center gap-2 text-[#8696a0]">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-sm">Error cargando insights</span>
        </div>
      </div>
    )
  }

  const hasConsultations = recent && recent.length > 0

  if (compact) {
    return (
      <Link
        href="/dashboard/forum-insights"
        prefetch={false}
        className={cn(
          'group flex items-center gap-3 rounded-xl border border-[#2a3942] bg-gradient-to-r from-purple-500/10 to-[#00a884]/5 p-3 transition-all hover:border-purple-500/30 hover:from-purple-500/20',
          className
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
          <Users className="h-5 w-5 text-purple-400" />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-medium text-[#e9edef]">Forum IA</p>
          <p className="text-[11px] text-[#8696a0]">
            {stats?.totalConsultations ?? 0} consultas este mes
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-[#8696a0] opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
    )
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-[#00a884]/5 to-purple-500/5 p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
            <Users className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-[#e9edef]">Forum IA</p>
            <p className="text-[11px] text-[#8696a0]">Asesoría estratégica</p>
          </div>
        </div>
        <Link
          href="/dashboard/forum-insights"
          className="flex items-center gap-1 text-[11px] text-purple-400 hover:underline"
        >
          Ver todo
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-[#111b21]/50 p-2 text-center">
            <p className="text-[16px] font-semibold text-purple-400">{stats.totalConsultations}</p>
            <p className="text-[9px] text-[#8696a0]">Consultas</p>
          </div>
          <div className="rounded-lg bg-[#111b21]/50 p-2 text-center">
            <p className="text-[16px] font-semibold text-[#f59e0b]">
              {stats.urgencyBreakdown.high + stats.urgencyBreakdown.critical}
            </p>
            <p className="text-[9px] text-[#8696a0]">Alta Urgencia</p>
          </div>
          <div className="rounded-lg bg-[#111b21]/50 p-2 text-center">
            <p className="text-[16px] font-semibold text-[#00a884]">
              {stats.averageConfidence ?? '-'}%
            </p>
            <p className="text-[9px] text-[#8696a0]">Confianza</p>
          </div>
        </div>
      )}

      {/* Top Triggers */}
      {stats && stats.topTriggers.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[#8696a0]">
            Triggers frecuentes
          </p>
          <div className="flex flex-wrap gap-1.5">
            {stats.topTriggers.slice(0, 4).map((t) => (
              <span
                key={t.trigger}
                className="inline-flex items-center gap-1 rounded-full bg-[#111b21]/50 px-2 py-0.5 text-[10px] text-[#8696a0]"
              >
                <Flame className="h-2.5 w-2.5 text-[#f59e0b]" />
                {formatTrigger(t.trigger)}
                <span className="font-medium text-[#e9edef]">({t.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Consultations */}
      {hasConsultations && (
        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#8696a0]">
            Consultas recientes
          </p>
          {recent.slice(0, 3).map((consultation) => (
            <div
              key={consultation.id}
              className="rounded-lg bg-[#111b21]/50 p-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-[#e9edef]">
                    {consultation.clientName ?? 'Cliente desconocido'}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-[#8696a0]">
                    {consultation.originalMessage.slice(0, 60)}
                    {consultation.originalMessage.length > 60 ? '...' : ''}
                  </p>
                </div>
                <UrgencyBadge urgency={consultation.urgency} />
              </div>

              {/* Approach + Strategy */}
              <div className="mt-2 flex items-center gap-2">
                {consultation.responseApproach && (
                  <ApproachBadge approach={consultation.responseApproach} />
                )}
                {consultation.recommendHumanEscalation && (
                  <span className="flex items-center gap-1 rounded-full bg-[#ef4444]/20 px-2 py-0.5 text-[9px] text-[#ef4444]">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    Escalación
                  </span>
                )}
              </div>

              {/* Timestamp */}
              <p className="mt-1.5 text-[9px] text-[#8696a0]">
                {formatRelativeTime(new Date(consultation.createdAt))}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!hasConsultations && (
        <div className="mt-4 flex flex-col items-center justify-center rounded-lg bg-[#111b21]/50 py-6 text-center">
          <BarChart3 className="h-8 w-8 text-purple-400/50" />
          <p className="mt-2 text-[12px] text-[#8696a0]">Sin consultas aún</p>
          <p className="text-[10px] text-[#8696a0]/70">
            Forum te asesora automáticamente en conversaciones complejas
          </p>
        </div>
      )}

      {/* Human Escalations Alert */}
      {stats && stats.humanEscalationsRecommended > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#ef4444]/10 p-2 text-[11px] text-[#ef4444]">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            {stats.humanEscalationsRecommended} escalación
            {stats.humanEscalationsRecommended > 1 ? 'es' : ''} recomendada
            {stats.humanEscalationsRecommended > 1 ? 's' : ''} este mes
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Urgency badge component
 */
function UrgencyBadge({ urgency }: { urgency: string }) {
  const defaultConfig = { bg: 'bg-[#8696a0]/20', text: 'text-[#8696a0]', label: 'Bajo' }
  const config = URGENCY_COLORS[urgency] ?? defaultConfig
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium',
        config.bg,
        config.text
      )}
    >
      {config.label}
    </span>
  )
}

/**
 * Response approach badge
 */
function ApproachBadge({ approach }: { approach: string }) {
  const config = APPROACH_ICONS[approach]
  if (!config) return null

  const Icon = config.icon
  const labels: Record<string, string> = {
    empathetic: 'Empático',
    assertive: 'Asertivo',
    consultative: 'Consultivo',
    direct: 'Directo',
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px]"
      style={{ backgroundColor: `${config.color}20`, color: config.color }}
    >
      <Icon className="h-2.5 w-2.5" />
      {labels[approach]}
    </span>
  )
}

/**
 * Format trigger key to readable label
 */
function formatTrigger(trigger: string): string {
  const labels: Record<string, string> = {
    price_negotiation: 'Precio',
    competitor_mention: 'Competencia',
    objection_complex: 'Objeción',
    high_value_client: 'VIP',
    escalation_risk: 'Riesgo',
    contract_terms: 'Contrato',
    strategic_decision: 'Estratégico',
    churn_signal: 'Churn',
  }
  return labels[trigger] ?? trigger.replace('_', ' ')
}
