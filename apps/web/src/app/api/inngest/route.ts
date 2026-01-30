/**
 * Inngest API Route Handler
 *
 * Serves Inngest functions for background job processing.
 * This endpoint is called by Inngest to execute workers.
 */

import { serve } from 'inngest/next'
import { inngest } from '@quoorum/workers/client'
import {
  quoorumDebateCompleted,
  quoorumDebateFailed,
  quoorumSendNotification,
  quoorumWeeklyDigest,
  quoorumScheduledReportsWorker,
  quoorumGenerateReport,
  quoorumExpertPerformanceUpdate,
} from '@quoorum/workers/functions/quoorum-workers'
import {
  nextjsAutoHealer,
  nextjsAutoHealerManual,
} from '@quoorum/workers/functions/nextjs-auto-healer'
import {
  assignMonthlyCredits,
  checkMonthlyCreditsRenewals,
} from '@quoorum/workers/functions/monthly-credits-assignment'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    quoorumDebateCompleted,
    quoorumDebateFailed,
    quoorumSendNotification,
    quoorumWeeklyDigest,
    quoorumScheduledReportsWorker,
    quoorumGenerateReport,
    quoorumExpertPerformanceUpdate,
    nextjsAutoHealer,
    nextjsAutoHealerManual,
    assignMonthlyCredits,
    checkMonthlyCreditsRenewals,
  ],
} as Parameters<typeof serve>[0])
