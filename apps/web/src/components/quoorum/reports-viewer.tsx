'use client'
// @ts-nocheck

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Download,
  FileDown,
  FileText,
  Loader2,
  Play,
  Plus,
  Share2,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

// ============================================================================
// Types
// ============================================================================

interface ReportsViewerProps {
  debateId?: string
  showSchedules?: boolean
}

interface Report {
  id: string
  type: string
  title: string
  description: string | null
  format: string
  status: string
  fileUrl: string | null
  fileSize: number | null
  fileName: string | null
  createdAt: Date
  generatedAt: Date | null
  errorMessage: string | null
  shareToken: string | null
  expiresAt: Date | null
  summary: {
    totalDebates?: number
    avgConsensus?: number
    topExperts?: Array<{ name: string; rating: number }>
    keyInsights?: string[]
  } | null
}

interface ScheduledReport {
  id: string
  name: string
  type: string
  format: string
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly'
    dayOfWeek?: number
    dayOfMonth?: number
    hour: number
    timezone: string
  }
  deliveryMethod: {
    email?: boolean
    emailAddresses?: string[]
    inApp?: boolean
    webhook?: string
  }
  isActive: boolean
  lastRunAt: Date | null
  nextRunAt: Date | null
  runCount: number
  failCount: number
}

type ReportType =
  | 'single_debate'
  | 'weekly_summary'
  | 'monthly_summary'
  | 'expert_performance'
  | 'custom'

type ReportFormat = 'pdf' | 'html' | 'markdown'

const reportTypeLabels: Record<ReportType, string> = {
  single_debate: 'Debate Individual',
  weekly_summary: 'Resumen Semanal',
  monthly_summary: 'Resumen Mensual',
  expert_performance: 'Rendimiento de Expertos',
  custom: 'Personalizado',
}

const formatLabels: Record<ReportFormat, { label: string; icon: typeof FileText }> = {
  pdf: { label: 'PDF', icon: FileText },
  html: { label: 'HTML', icon: FileText },
  markdown: { label: 'Markdown', icon: FileText },
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: 'En progreso', color: 'bg-yellow-500/20 text-yellow-400', icon: Loader2 },
  generating: { label: 'En progreso', color: 'bg-yellow-500/20 text-yellow-400', icon: Loader2 },
  completed: { label: 'Completado', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  failed: { label: 'Error', color: 'bg-red-500/20 text-red-400', icon: AlertCircle },
}

const frequencyLabels: Record<string, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
}

const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// ============================================================================
// Sub-components
// ============================================================================

function ReportCard({
  report,
  onDelete,
  onShare,
}: {
  report: Report
  onDelete: () => void
  onShare: () => void
}) {
  const StatusIcon = statusConfig[report.status]?.icon || Clock
  const timeAgo = formatDistanceToNow(new Date(report.createdAt), {
    addSuffix: true,
    locale: es,
  })

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="rounded-lg border border-[#2a3942] bg-[#111b21] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-[#00a884]" />
            <h4 className="truncate text-sm font-medium text-[#e9edef]">{report.title}</h4>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-[#2a3942] text-xs text-[#8696a0]">
              {reportTypeLabels[report.type as ReportType]}
            </Badge>
            <Badge variant="outline" className="border-[#2a3942] text-xs text-[#8696a0]">
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
            <p className="mt-2 text-xs text-[#8696a0]">{report.description}</p>
          )}

          <div className="mt-2 flex items-center gap-4 text-xs text-[#8696a0]">
            <span>{timeAgo}</span>
            {report.fileSize && <span>{formatFileSize(report.fileSize)}</span>}
          </div>

          {report.summary && report.summary.keyInsights && (
            <div className="mt-3 rounded bg-[#202c33] p-2">
              <p className="text-xs font-medium text-[#e9edef]">Insights clave:</p>
              <ul className="mt-1 space-y-1">
                {report.summary.keyInsights.slice(0, 2).map((insight, idx) => (
                  <li key={idx} className="text-xs text-[#8696a0]">
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
              className="inline-flex h-8 items-center justify-center rounded-md border border-[#2a3942] bg-[#202c33] px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
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
              className="h-8 text-[#8696a0] hover:text-[#e9edef]"
            >
              <Share2 className="mr-1 h-4 w-4" />
              Compartir
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 text-[#8696a0] hover:text-red-400"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  )
}

function ScheduleCard({
  schedule,
  onToggle,
  onDelete,
  onRunNow,
}: {
  schedule: ScheduledReport
  onToggle: (active: boolean) => void
  onDelete: () => void
  onRunNow: () => void
}) {
  const nextRun = schedule.nextRunAt
    ? format(new Date(schedule.nextRunAt), "d 'de' MMMM, HH:mm", { locale: es })
    : 'No programado'

  const scheduleText = () => {
    const { frequency, dayOfWeek, dayOfMonth, hour } = schedule.schedule
    const hourStr = `${hour.toString().padStart(2, '0')}:00`

    if (frequency === 'daily') {
      return `Todos los días a las ${hourStr}`
    }
    if (frequency === 'weekly') {
      return `Cada ${dayLabels[dayOfWeek ?? 1]} a las ${hourStr}`
    }
    if (frequency === 'monthly') {
      return `Día ${dayOfMonth} de cada mes a las ${hourStr}`
    }
    return ''
  }

  return (
    <div className="rounded-lg border border-[#2a3942] bg-[#111b21] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-purple-400" />
            <h4 className="truncate text-sm font-medium text-[#e9edef]">{schedule.name}</h4>
            <Switch checked={schedule.isActive} onCheckedChange={onToggle} className="shrink-0" />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-[#2a3942] text-xs text-[#8696a0]">
              {reportTypeLabels[schedule.type as ReportType]}
            </Badge>
            <Badge variant="outline" className="border-purple-500 text-xs text-purple-400">
              {frequencyLabels[schedule.schedule.frequency]}
            </Badge>
            <Badge variant="outline" className="border-[#2a3942] text-xs text-[#8696a0]">
              {formatLabels[schedule.format as ReportFormat]?.label}
            </Badge>
          </div>

          <p className="mt-2 text-xs text-[#8696a0]">{scheduleText()}</p>

          <div className="mt-2 flex items-center gap-4 text-xs text-[#8696a0]">
            <span>Próximo: {nextRun}</span>
            <span>Ejecuciones: {schedule.runCount}</span>
            {schedule.failCount > 0 && (
              <span className="text-red-400">Errores: {schedule.failCount}</span>
            )}
          </div>

          {schedule.deliveryMethod && (
            <div className="mt-2 flex items-center gap-2 text-xs text-[#8696a0]">
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
            className="h-8 border-[#2a3942] bg-[#202c33]"
          >
            <Play className="mr-1 h-4 w-4" />
            Ejecutar Ahora
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 text-[#8696a0] hover:text-red-400"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  )
}

function GenerateReportDialog({
  debateId,
  onSuccess,
}: {
  debateId?: string
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<ReportType>(debateId ? 'single_debate' : 'weekly_summary')
  const [format, setFormat] = useState<ReportFormat>('pdf')

  const generateDebateReport = api.quoorumReports.generateDebateReport.useMutation({
    onSuccess: () => {
      toast.success('Generando informe...')
      setOpen(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const generateWeeklySummary = api.quoorumReports.generateWeeklySummary.useMutation({
    onSuccess: () => {
      toast.success('Generando resumen semanal...')
      setOpen(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const generateCustomReport = api.quoorumReports.generateCustomReport.useMutation({
    onSuccess: () => {
      toast.success('Generando informe personalizado...')
      setOpen(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleGenerate = () => {
    if (type === 'single_debate' && debateId) {
      generateDebateReport.mutate({
        debateId,
        format,
      })
    } else if (type === 'weekly_summary') {
      const now = new Date()
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      generateWeeklySummary.mutate({
        dateFrom: lastWeek.toISOString(),
        dateTo: now.toISOString(),
        format,
      })
    } else {
      toast.error('Tipo de reporte no soportado aún')
    }
  }

  const isPending =
    generateDebateReport.isPending ||
    generateWeeklySummary.isPending ||
    generateCustomReport.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#00a884] hover:bg-[#00a884]/90">
          <Plus className="mr-2 h-4 w-4" />
          Generar Informe
        </Button>
      </DialogTrigger>
      <DialogContent className="border-[#2a3942] bg-[#202c33] text-[#e9edef]">
        <DialogHeader>
          <DialogTitle>Generar Nuevo Informe</DialogTitle>
          <DialogDescription className="text-[#8696a0]">
            Configura las opciones para tu informe del Quoorum
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Informe</Label>
            <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
              <SelectTrigger className="border-[#2a3942] bg-[#111b21]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {debateId && <SelectItem value="single_debate">Debate Individual</SelectItem>}
                <SelectItem value="weekly_summary">Resumen Semanal</SelectItem>
                <SelectItem value="monthly_summary">Resumen Mensual</SelectItem>
                <SelectItem value="expert_performance">Rendimiento de Expertos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Formato</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ReportFormat)}>
              <SelectTrigger className="border-[#2a3942] bg-[#111b21]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Contenido incluido</Label>
            <p className="rounded-lg border border-dashed border-[#2a3942] bg-[#111b21] p-3 text-sm text-[#8696a0]">
              El informe incluirá automáticamente el resumen, métricas principales y visualizaciones
              estándar según el tipo seleccionado.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-[#2a3942] bg-[#111b21]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isPending}
            className="bg-[#00a884] hover:bg-[#00a884]/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Generar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreateScheduleDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<'weekly_summary' | 'monthly_summary' | 'expert_performance'>('weekly_summary')
  const [format, setFormat] = useState<ReportFormat>('pdf')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [dayOfWeek, setDayOfWeek] = useState<number>(1) // Monday
  const [dayOfMonth, setDayOfMonth] = useState<number>(1)
  const [hour, setHour] = useState<number>(9)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [inAppEnabled, setInAppEnabled] = useState(true)

  const createSchedule = api.quoorumReports.createSchedule.useMutation({
    onSuccess: () => {
      toast.success('Informe programado creado')
      setOpen(false)
      setName('')
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    createSchedule.mutate({
      name: name.trim(),
      type,
      format,
      schedule: {
        frequency,
        dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
        hour,
        timezone: 'Europe/Madrid',
      },
      deliveryMethod: {
        email: emailEnabled,
        inApp: inAppEnabled,
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Programación
        </Button>
      </DialogTrigger>
      <DialogContent className="border-[#2a3942] bg-[#202c33] text-[#e9edef] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Informe Programado</DialogTitle>
          <DialogDescription className="text-[#8696a0]">
            Configura un informe que se generará automáticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nombre del informe</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Resumen Semanal Ventas"
              className="border-[#2a3942] bg-[#111b21]"
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Informe</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger className="border-[#2a3942] bg-[#111b21]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly_summary">Resumen Semanal</SelectItem>
                <SelectItem value="monthly_summary">Resumen Mensual</SelectItem>
                <SelectItem value="expert_performance">Rendimiento de Expertos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Formato</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ReportFormat)}>
              <SelectTrigger className="border-[#2a3942] bg-[#111b21]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Frecuencia</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
              <SelectTrigger className="border-[#2a3942] bg-[#111b21]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency === 'weekly' && (
            <div className="space-y-2">
              <Label>Día de la semana</Label>
              <Select value={dayOfWeek.toString()} onValueChange={(v) => setDayOfWeek(Number(v))}>
                <SelectTrigger className="border-[#2a3942] bg-[#111b21]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dayLabels.map((day, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {frequency === 'monthly' && (
            <div className="space-y-2">
              <Label>Día del mes</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className="border-[#2a3942] bg-[#111b21]"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Hora (24h)</Label>
            <Input
              type="number"
              min="0"
              max="23"
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="border-[#2a3942] bg-[#111b21]"
            />
          </div>

          <div className="space-y-3">
            <Label>Métodos de entrega</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8696a0]">Email</span>
              <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8696a0]">In-App</span>
              <Switch checked={inAppEnabled} onCheckedChange={setInAppEnabled} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-[#2a3942] bg-[#111b21]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createSchedule.isPending || !name.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {createSchedule.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Crear Programación
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ShareDialog({
  id,
  shareToken,
  open,
  onOpenChange,
  onShared,
}: {
  id: string
  shareToken: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onShared?: () => void
}) {
  const [copied, setCopied] = useState(false)

  const shareReport = api.quoorumReports.share.useMutation({
    onSuccess: () => {
      toast.success('Enlace de compartir generado')
      onShared?.()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const shareUrl = shareToken
    ? `${window.location.origin}/quoorum/reports/shared/${shareToken}`
    : null

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerateLink = () => {
    shareReport.mutate({ id, expiresInDays: 7 })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#2a3942] bg-[#202c33] text-[#e9edef]">
        <DialogHeader>
          <DialogTitle>Compartir Informe</DialogTitle>
          <DialogDescription className="text-[#8696a0]">
            Genera un enlace para compartir este informe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {shareUrl ? (
            <div className="space-y-2">
              <Label>Enlace para compartir</Label>
              <div className="flex gap-2">
                <Input readOnly value={shareUrl} className="border-[#2a3942] bg-[#111b21]" />
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="shrink-0 border-[#2a3942] bg-[#111b21]"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#8696a0]">Este enlace expira en 7 días</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2a3942] py-8">
              <Share2 className="h-10 w-10 text-[#8696a0]" />
              <p className="mt-3 text-sm text-[#8696a0]">
                Genera un enlace para compartir este informe
              </p>
              <Button
                onClick={handleGenerateLink}
                disabled={shareReport.isPending}
                className="mt-4 bg-[#00a884] hover:bg-[#00a884]/90"
              >
                {shareReport.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" />
                )}
                Generar Enlace
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#2a3942] bg-[#111b21]"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ReportsViewer({ debateId, showSchedules = true }: ReportsViewerProps) {
  const [activeTab, setActiveTab] = useState<'reports' | 'schedules'>('reports')
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  const {
    data: reports,
    isLoading: loadingReports,
    refetch: refetchReports,
  } = api.quoorumReports.list.useQuery({ limit: 50 })

  const {
    data: schedules,
    isLoading: loadingSchedules,
    refetch: refetchSchedules,
  } = api.quoorumReports.listSchedules.useQuery()

  const deleteReport = api.quoorumReports.delete.useMutation({
    onSuccess: () => {
      toast.success('Informe eliminado')
      void refetchReports()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const updateSchedule = api.quoorumReports.updateSchedule.useMutation({
    onSuccess: () => {
      toast.success('Programación actualizada')
      void refetchSchedules()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const deleteSchedule = api.quoorumReports.deleteSchedule.useMutation({
    onSuccess: () => {
      toast.success('Programación eliminada')
      void refetchSchedules()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const runScheduleNow = api.quoorumReports.runScheduleNow.useMutation({
    onSuccess: () => {
      toast.success('Informe en generación')
      void refetchReports()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleShare = (report: Report) => {
    setSelectedReport(report)
    setShareDialogOpen(true)
  }

  return (
    <Card className="border-[#2a3942] bg-[#202c33]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-[#e9edef]">
              <FileText className="h-5 w-5 text-[#00a884]" />
              Informes del Quoorum
            </CardTitle>
            <CardDescription className="text-[#8696a0]">
              Genera y gestiona informes de tus debates
            </CardDescription>
          </div>
          <GenerateReportDialog debateId={debateId} onSuccess={() => void refetchReports()} />
        </div>
      </CardHeader>

      {showSchedules ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="mx-6 w-auto">
            <TabsTrigger value="reports">Informes</TabsTrigger>
            <TabsTrigger value="schedules">
              Programados
              {schedules && schedules.length > 0 && (
                <Badge className="ml-2 bg-purple-500">{schedules.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <CardContent className="pt-4">
            <TabsContent value="reports" className="m-0 space-y-3">
              {loadingReports ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#8696a0]" />
                </div>
              ) : !reports || reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2a3942] py-12 text-center">
                  <FileText className="h-12 w-12 text-[#8696a0]" />
                  <p className="mt-4 text-[#8696a0]">No hay informes generados</p>
                  <p className="text-sm text-[#8696a0]">
                    Genera tu primer informe para ver los resultados aquí
                  </p>
                </div>
              ) : (
                reports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report as Report}
                    onDelete={() => deleteReport.mutate({ id: report.id })}
                    onShare={() => handleShare(report as Report)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="schedules" className="m-0 space-y-3">
              <div className="mb-4 flex justify-end">
                <CreateScheduleDialog onSuccess={() => void refetchSchedules()} />
              </div>
              {loadingSchedules ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#8696a0]" />
                </div>
              ) : !schedules || schedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2a3942] py-12 text-center">
                  <Calendar className="h-12 w-12 text-[#8696a0]" />
                  <p className="mt-4 text-[#8696a0]">No hay informes programados</p>
                  <p className="text-sm text-[#8696a0]">
                    Configura informes automáticos semanales o mensuales
                  </p>
                  <CreateScheduleDialog onSuccess={() => void refetchSchedules()} />
                </div>
              ) : (
                schedules.map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule as ScheduledReport}
                    onToggle={(active) =>
                      updateSchedule.mutate({ id: schedule.id, isActive: active })
                    }
                    onDelete={() => deleteSchedule.mutate({ id: schedule.id })}
                    onRunNow={() => runScheduleNow.mutate({ id: schedule.id })}
                  />
                ))
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      ) : (
        <CardContent className="space-y-3">
          {loadingReports ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#8696a0]" />
            </div>
          ) : !reports || reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2a3942] py-12 text-center">
              <FileText className="h-12 w-12 text-[#8696a0]" />
              <p className="mt-4 text-[#8696a0]">No hay informes generados</p>
            </div>
          ) : (
            reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report as Report}
                onDelete={() => deleteReport.mutate({ id: report.id })}
                onShare={() => handleShare(report as Report)}
              />
            ))
          )}
        </CardContent>
      )}

      {selectedReport && (
        <ShareDialog
          id={selectedReport.id}
          shareToken={selectedReport.shareToken}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          onShared={() => {
            void refetchReports()
            setSelectedReport(null)
          }}
        />
      )}
    </Card>
  )
}
