/**
 * Reports Viewer Types & Constants
 *
 * Types, interfaces, and constants for the Quoorum reports system.
 */

import { CheckCircle, Loader2, AlertCircle, Clock, FileText } from 'lucide-react'
import type { quoorumReportTypeEnum } from '@quoorum/db/schema'

// ═══════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════

export interface ReportsViewerProps {
  debateId?: string
  showSchedules?: boolean
}

export interface Report {
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

export interface ScheduledReport {
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

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

// Infer type from DB enum (single source of truth)
// Includes: 'single_debate' | 'weekly_summary' | 'monthly_summary' | 'deal_analysis' | 'expert_performance' | 'custom'
export type ReportType = (typeof quoorumReportTypeEnum.enumValues)[number]

export type ReportFormat = 'pdf' | 'html' | 'markdown'

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly'

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

export const reportTypeLabels: Record<ReportType, string> = {
  single_debate: 'Debate Individual',
  weekly_summary: 'Resumen Semanal',
  monthly_summary: 'Resumen Mensual',
  deal_analysis: 'Análisis de Operación',
  expert_performance: 'Rendimiento de Expertos',
  custom: 'Personalizado',
}

export const formatLabels: Record<ReportFormat, { label: string; icon: typeof FileText }> = {
  pdf: { label: 'PDF', icon: FileText },
  html: { label: 'HTML', icon: FileText },
  markdown: { label: 'Markdown', icon: FileText },
}

export const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: 'En progreso', color: 'bg-yellow-500/20 text-yellow-400', icon: Loader2 },
  generating: { label: 'En progreso', color: 'bg-yellow-500/20 text-yellow-400', icon: Loader2 },
  completed: { label: 'Completado', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  failed: { label: 'Error', color: 'bg-red-500/20 text-red-400', icon: AlertCircle },
}

export const frequencyLabels: Record<string, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
}

export const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getScheduleText(schedule: ScheduledReport['schedule']): string {
  const { frequency, dayOfWeek, dayOfMonth, hour } = schedule
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
