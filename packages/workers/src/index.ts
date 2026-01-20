/**
 * Quoorum Workers - Main Export
 *
 * Exports all Inngest functions for registration.
 */

import {
  quoorumDebateCompleted,
  quoorumDebateFailed,
  quoorumSendNotification,
  quoorumWeeklyDigest,
  quoorumScheduledReportsWorker,
  quoorumGenerateReport,
  quoorumExpertPerformanceUpdate,
} from './functions/quoorum-workers'

import { nextjsAutoHealer, nextjsAutoHealerManual } from './functions/nextjs-auto-healer'

// Re-export inngest client from main export for easier access
export { inngest } from './client'

export {
  quoorumDebateCompleted,
  quoorumDebateFailed,
  quoorumSendNotification,
  quoorumWeeklyDigest,
  quoorumScheduledReportsWorker,
  quoorumGenerateReport,
  quoorumExpertPerformanceUpdate,
  nextjsAutoHealer,
  nextjsAutoHealerManual,
}

export const quoorumFunctions = [
  quoorumDebateCompleted,
  quoorumDebateFailed,
  quoorumSendNotification,
  quoorumWeeklyDigest,
  quoorumScheduledReportsWorker,
  quoorumGenerateReport,
  quoorumExpertPerformanceUpdate,
  nextjsAutoHealer,
  nextjsAutoHealerManual,
]
