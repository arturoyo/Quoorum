'use client'

/**
 * ScheduleCard Component
 *
 * Displays a scheduled report with toggle, run now, and delete actions.
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Play, Trash2 } from 'lucide-react'
import {
  type ScheduledReport,
  type ReportType,
  type ReportFormat,
  reportTypeLabels,
  formatLabels,
  frequencyLabels,
  getScheduleText,
} from '../types'

interface ScheduleCardProps {
  schedule: ScheduledReport
  onToggle: (active: boolean) => void
  onDelete: () => void
  onRunNow: () => void
}

export function ScheduleCard({ schedule, onToggle, onDelete, onRunNow }: ScheduleCardProps) {
  const nextRun = schedule.nextRunAt
    ? format(new Date(schedule.nextRunAt), "d 'de' MMMM, HH:mm", { locale: es })
    : 'No programado'

  return (
    <div className="rounded-lg border styles.colors.border.default styles.colors.bg.secondary p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-purple-400" />
            <h4 className="truncate text-sm font-medium text-[#e9edef]">{schedule.name}</h4>
            <Switch checked={schedule.isActive} onCheckedChange={onToggle} className="shrink-0" />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="styles.colors.border.default text-xs styles.colors.text.tertiary">
              {reportTypeLabels[schedule.type as ReportType]}
            </Badge>
            <Badge variant="outline" className="border-purple-500 text-xs text-purple-400">
              {frequencyLabels[schedule.schedule.frequency]}
            </Badge>
            <Badge variant="outline" className="styles.colors.border.default text-xs styles.colors.text.tertiary">
              {formatLabels[schedule.format as ReportFormat]?.label}
            </Badge>
          </div>

          <p className="mt-2 text-xs styles.colors.text.tertiary">{getScheduleText(schedule.schedule)}</p>

          <div className="mt-2 flex items-center gap-4 text-xs styles.colors.text.tertiary">
            <span>Próximo: {nextRun}</span>
            <span>Ejecuciones: {schedule.runCount}</span>
            {schedule.failCount > 0 && (
              <span className="text-red-400">Errores: {schedule.failCount}</span>
            )}
          </div>

          {schedule.deliveryMethod && (
            <div className="mt-2 flex items-center gap-2 text-xs styles.colors.text.tertiary">
              {schedule.deliveryMethod.email && <Badge variant="outline">Email</Badge>}
              {schedule.deliveryMethod.inApp && <Badge variant="outline">In-App</Badge>}
              {schedule.deliveryMethod.webhook && <Badge variant="outline">Webhook</Badge>}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onRunNow}
            disabled={!schedule.isActive}
            className="h-8 styles.colors.border.default styles.colors.bg.tertiary"
          >
            <Play className="mr-1 h-4 w-4" />
            Ejecutar Ahora
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 styles.colors.text.tertiary hover:text-red-400"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  )
}
