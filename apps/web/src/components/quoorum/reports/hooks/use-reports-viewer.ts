'use client'

/**
 * useReportsViewer Hook
 *
 * Centralized state management for the Reports Viewer component.
 * Handles queries, mutations, and UI state.
 */

import { useState, useCallback } from 'react'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'
import type { Report } from '../types'

export function useReportsViewer() {
  // ═══════════════════════════════════════════════════════════
  // UI STATE
  // ═══════════════════════════════════════════════════════════
  const [activeTab, setActiveTab] = useState<'reports' | 'schedules'>('reports')
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  // ═══════════════════════════════════════════════════════════
  // QUERIES
  // ═══════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════
  // MUTATIONS
  // ═══════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleShare = useCallback((report: Report) => {
    setSelectedReport(report)
    setShareDialogOpen(true)
  }, [])

  const handleDeleteReport = useCallback((id: string) => {
    deleteReport.mutate({ id })
  }, [deleteReport])

  const handleToggleSchedule = useCallback((id: string, active: boolean) => {
    updateSchedule.mutate({ id, isActive: active })
  }, [updateSchedule])

  const handleDeleteSchedule = useCallback((id: string) => {
    deleteSchedule.mutate({ id })
  }, [deleteSchedule])

  const handleRunScheduleNow = useCallback((id: string) => {
    runScheduleNow.mutate({ id })
  }, [runScheduleNow])

  const handleReportsRefetch = useCallback(() => {
    void refetchReports()
  }, [refetchReports])

  const handleSchedulesRefetch = useCallback(() => {
    void refetchSchedules()
  }, [refetchSchedules])

  const handleShareDialogClose = useCallback(() => {
    setShareDialogOpen(false)
  }, [])

  const handleShareComplete = useCallback(() => {
    void refetchReports()
    setSelectedReport(null)
  }, [refetchReports])

  return {
    // Data
    reports,
    schedules,
    loadingReports,
    loadingSchedules,

    // UI State
    activeTab,
    setActiveTab,
    shareDialogOpen,
    setShareDialogOpen,
    selectedReport,

    // Handlers
    handleShare,
    handleDeleteReport,
    handleToggleSchedule,
    handleDeleteSchedule,
    handleRunScheduleNow,
    handleReportsRefetch,
    handleSchedulesRefetch,
    handleShareDialogClose,
    handleShareComplete,
  }
}
