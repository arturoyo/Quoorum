'use client'

/**
 * ReportsViewer - Orchestrator Component
 *
 * Main component for viewing and managing Quoorum reports.
 * Uses modular sub-components for clean separation of concerns.
 *
 * All state management is centralized in useReportsViewer hook.
 */

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText } from 'lucide-react'
import { useReportsViewer } from './hooks/use-reports-viewer'
import {
  ReportCard,
  ScheduleCard,
  GenerateReportDialog,
  CreateScheduleDialog,
  ShareDialog,
  ReportsLoadingState,
  EmptyReportsState,
  EmptySchedulesState,
} from './components'
import type { ReportsViewerProps, Report, ScheduledReport } from './types'

export function ReportsViewer({ debateId, showSchedules = true }: ReportsViewerProps) {
  const {
    // Data
    reports,
    schedules,
    loadingReports,
    loadingSchedules,

    // UI State
    activeTab,
    setActiveTab,
    shareDialogOpen,
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
  } = useReportsViewer()

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
          <GenerateReportDialog debateId={debateId} onSuccess={handleReportsRefetch} />
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
                <ReportsLoadingState />
              ) : !reports || reports.length === 0 ? (
                <EmptyReportsState />
              ) : (
                reports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report as Report}
                    onDelete={() => handleDeleteReport(report.id)}
                    onShare={() => handleShare(report as Report)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="schedules" className="m-0 space-y-3">
              <div className="mb-4 flex justify-end">
                <CreateScheduleDialog onSuccess={handleSchedulesRefetch} />
              </div>
              {loadingSchedules ? (
                <ReportsLoadingState />
              ) : !schedules || schedules.length === 0 ? (
                <EmptySchedulesState>
                  <CreateScheduleDialog onSuccess={handleSchedulesRefetch} />
                </EmptySchedulesState>
              ) : (
                schedules.map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule as ScheduledReport}
                    onToggle={(active) => handleToggleSchedule(schedule.id, active)}
                    onDelete={() => handleDeleteSchedule(schedule.id)}
                    onRunNow={() => handleRunScheduleNow(schedule.id)}
                  />
                ))
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      ) : (
        <CardContent className="space-y-3">
          {loadingReports ? (
            <ReportsLoadingState />
          ) : !reports || reports.length === 0 ? (
            <EmptyReportsState />
          ) : (
            reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report as Report}
                onDelete={() => handleDeleteReport(report.id)}
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
          onOpenChange={handleShareDialogClose}
          onShared={handleShareComplete}
        />
      )}
    </Card>
  )
}
