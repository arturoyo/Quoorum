'use client'

/**
 * ReportCard Component
 *
 * Displays a single report with status, metadata, and actions.
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, styles } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, Download, FileText, Share2, Trash2 } from 'lucide-react'
import {
  type Report,
  type ReportType,
  type ReportFormat,
  reportTypeLabels,
  formatLabels,
  statusConfig,
  formatFileSize,
} from '../types'

interface ReportCardProps {
  report: Report
  onDelete: () => void
  onShare: () => void
}

export function ReportCard({ report, onDelete, onShare }: ReportCardProps) {
  const StatusIcon = statusConfig[report.status]?.icon || Clock
  const timeAgo = formatDistanceToNow(new Date(report.createdAt), {
    addSuffix: true,
    locale: es,
  })

  return (
    <div className="rounded-lg border styles.colors.border.default styles.colors.bg.secondary p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-[#00a884]" />
            <h4 className="truncate text-sm font-medium text-[#e9edef]">{report.title}</h4>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="styles.colors.border.default text-xs styles.colors.text.tertiary">
              {reportTypeLabels[report.type as ReportType]}
            </Badge>
            <Badge variant="outline" className="styles.colors.border.default text-xs styles.colors.text.tertiary">
              {formatLabels[report.format as ReportFormat]?.label}
            </Badge>
            <Badge className={cn('text-xs', statusConfig[report.status]?.color)}>
              <StatusIcon
                className={cn('mr-1 h-3 w-3', report.status === 'generating' && 'animate-spin')}
              />
              {statusConfig[report.status]?.label}
            </Badge>
          </div>

          {report.description && (
            <p className="mt-2 text-xs styles.colors.text.tertiary">{report.description}</p>
          )}

          <div className="mt-2 flex items-center gap-4 text-xs styles.colors.text.tertiary">
            <span>{timeAgo}</span>
            {report.fileSize && <span>{formatFileSize(report.fileSize)}</span>}
          </div>

          {report.summary && report.summary.keyInsights && (
            <div className="mt-3 rounded styles.colors.bg.tertiary p-2">
              <p className="text-xs font-medium text-[#e9edef]">Insights clave:</p>
              <ul className="mt-1 space-y-1">
                {report.summary.keyInsights.slice(0, 2).map((insight, idx) => (
                  <li key={idx} className="text-xs styles.colors.text.tertiary">
                    • {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.errorMessage && (
            <div className="mt-2 rounded bg-red-500/10 p-2">
              <p className="text-xs text-red-400">{report.errorMessage}</p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          {report.status === 'completed' && report.fileUrl && (
            <a
              href={report.fileUrl}
              download={report.fileName}
              className="inline-flex h-8 items-center justify-center rounded-md border styles.colors.border.default styles.colors.bg.tertiary px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              <Download className="mr-1 h-4 w-4" />
              Descargar
            </a>
          )}
          {report.status === 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="h-8 styles.colors.text.tertiary hover:text-[#e9edef]"
            >
              <Share2 className="mr-1 h-4 w-4" />
              Compartir
            </Button>
          )}
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
