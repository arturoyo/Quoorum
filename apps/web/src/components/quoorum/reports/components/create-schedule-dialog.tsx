'use client'

/**
 * CreateScheduleDialog Component
 *
 * Dialog for creating scheduled reports with frequency and delivery options.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
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
import { api } from '@/lib/trpc/client'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { type ReportFormat, type ScheduleFrequency, dayLabels } from '../types'

interface CreateScheduleDialogProps {
  onSuccess: () => void
}

type ScheduleReportType = 'weekly_summary' | 'monthly_summary' | 'expert_performance'

export function CreateScheduleDialog({ onSuccess }: CreateScheduleDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<ScheduleReportType>('weekly_summary')
  const [format, setFormat] = useState<ReportFormat>('pdf')
  const [frequency, setFrequency] = useState<ScheduleFrequency>('weekly')
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
      <DialogContent className="border-[#2a3942] bg-[#202c33] text-[#e9edef]">
        <DialogHeader className="border-b-0 pb-0">
          <DialogTitle>Crear Informe Programado</DialogTitle>
          <DialogDescription className="text-[#8696a0]">
            Configura un informe que se generará automáticamente
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
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
            <Select value={type} onValueChange={(v) => setType(v as ScheduleReportType)}>
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
            <Select value={frequency} onValueChange={(v) => setFrequency(v as ScheduleFrequency)}>
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
        </DialogBody>

        <DialogFooter className="border-t-0 pt-0">
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
