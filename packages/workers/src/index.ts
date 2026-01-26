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
import {
  sendWhatsappInvite,
  sendEmailInvite,
  batchSendEmailInvites,
} from './functions/referral-invites'
import {
  assignMonthlyCredits,
  checkMonthlyCreditsRenewals,
} from './functions/monthly-credits-assignment'

// Re-export inngest client from main export for easier access
export { inngest } from './client'

// Re-export email utilities
export {
  sendEmail,
  sendReferralInviteEmail,
  sendTeamInvitationEmail,
} from './lib/email'

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
  // Referral invites
  sendWhatsappInvite,
  sendEmailInvite,
  batchSendEmailInvites,
  // Monthly credits assignment
  assignMonthlyCredits,
  checkMonthlyCreditsRenewals,
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
  // Referral invites
  sendWhatsappInvite,
  sendEmailInvite,
  batchSendEmailInvites,
  // Monthly credits assignment
  assignMonthlyCredits,
  checkMonthlyCreditsRenewals,
]
