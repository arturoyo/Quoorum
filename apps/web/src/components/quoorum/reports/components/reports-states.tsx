'use client'

/**
 * Reports State Components
 *
 * Loading and empty states for reports and schedules lists.
 */

import { Calendar, FileText, Loader2 } from 'lucide-react'

// ═══════════════════════════════════════════════════════════
// LOADING STATE
// ═══════════════════════════════════════════════════════════

export function ReportsLoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-[#8696a0]" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// EMPTY REPORTS STATE
// ═══════════════════════════════════════════════════════════

export function EmptyReportsState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2a3942] py-12 text-center">
      <FileText className="h-12 w-12 text-[#8696a0]" />
      <p className="mt-4 text-[#8696a0]">No hay informes generados</p>
      <p className="text-sm text-[#8696a0]">
        Genera tu primer informe para ver los resultados aquí
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// EMPTY SCHEDULES STATE
// ═══════════════════════════════════════════════════════════

interface EmptySchedulesStateProps {
  children?: React.ReactNode
}

export function EmptySchedulesState({ children }: EmptySchedulesStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2a3942] py-12 text-center">
      <Calendar className="h-12 w-12 text-[#8696a0]" />
      <p className="mt-4 text-[#8696a0]">No hay informes programados</p>
      <p className="text-sm text-[#8696a0]">
        Configura informes automáticos semanales o mensuales
      </p>
      {children}
    </div>
  )
}
