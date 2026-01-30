'use client'

/**
 * GenerateReportDialog Component
 *
 * Dialog for generating new reports with type and format selection.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/trpc/client'
import { FileDown, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { ReportType, ReportFormat } from '../types'

interface GenerateReportDialogProps {
  debateId?: string
  onSuccess: () => void
}

export function GenerateReportDialog({ debateId, onSuccess }: GenerateReportDialogProps) {
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
      <DialogContent className="styles.colors.border.default styles.colors.bg.tertiary text-[#e9edef]">
        <DialogHeader>
          <DialogTitle>Generar Nuevo Informe</DialogTitle>
          <DialogDescription className="styles.colors.text.tertiary">
            Configura las opciones para tu informe del Quoorum
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Informe</Label>
            <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
              <SelectTrigger className="styles.colors.border.default styles.colors.bg.secondary">
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
              <SelectTrigger className="styles.colors.border.default styles.colors.bg.secondary">
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
            <p className="rounded-lg border border-dashed styles.colors.border.default styles.colors.bg.secondary p-3 text-sm styles.colors.text.tertiary">
              El informe incluirá automáticamente el resumen, métricas principales y visualizaciones
              estándar según el tipo seleccionado.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="styles.colors.border.default styles.colors.bg.secondary"
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
