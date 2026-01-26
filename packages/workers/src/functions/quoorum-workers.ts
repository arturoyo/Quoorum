/**
 * Quoorum Dynamic Expert System Workers
 *
 * Background jobs for the Quoorum system:
 * - quoorumDebateCompleted: Process completed debates, send notifications, update stats
 * - quoorumDebateFailed: Handle failed debates, send error notifications
 * - quoorumSendNotification: Dispatch notifications via in-app, email, push
 * - quoorumWeeklyDigest: Generate and send weekly Quoorum summaries (Monday 9 AM)
 * - quoorumScheduledReports: Run scheduled report generation
 * - quoorumGenerateReport: Generate a specific report
 * - quoorumExpertPerformanceUpdate: Recalculate expert ratings
 */

import { db } from '@quoorum/db'
import {
  quoorumDebates,
  quoorumExpertFeedback,
  quoorumExpertRatings,
  quoorumNotificationPreferences,
  quoorumNotifications,
  quoorumReports,
  quoorumScheduledReports,
  profiles,
} from '@quoorum/db/schema'
import { and, avg, count, desc, eq, gte, lt, sql } from 'drizzle-orm'
import { inngest } from '../client'
import { logger } from '../lib/logger'

// ============================================================================
// DEBATE COMPLETED WORKER
// ============================================================================

/**
 * Process completed debates
 * - Send notification to user
 * - Update debate analytics
 * - Trigger expert performance update if feedback exists
 */
export const quoorumDebateCompleted = inngest.createFunction(
  {
    id: 'quoorum-debate-completed',
    name: 'Quoorum: Debate Completed',
    retries: 3,
  },
  { event: 'quoorum/debate.completed' },
  async ({ event, step }) => {
    const { debateId, userId } = event.data

    // Step 1: Get debate details and resolve profile.id
    const { debate, profileId } = await step.run('get-debate-and-profile', async () => {
      const [debateResult] = await db.select().from(quoorumDebates).where(eq(quoorumDebates.id, debateId))

      if (!debateResult) {
        return { debate: null, profileId: null }
      }

      // IMPORTANT: quoorum_notifications.user_id references profiles.id, not users.id
      // The debate.userId is already profile.id (from quoorum_debates.user_id -> profiles.id)
      // But the event might pass users.id, so we use debate.userId which is correct
      const profileId = debateResult.userId

      return { debate: debateResult, profileId }
    })

    if (!debate || !profileId) {
      logger.warn('Debate not found for completion processing', { debateId, userId })
      return { success: false, reason: 'debate_not_found' }
    }

    // Step 2: Send in-app notification
    await step.run('send-notification', async () => {
      // Get consensus from final ranking
      const finalRanking = debate.finalRanking as Array<{ option: string; score: number }> | null
      const topOption = finalRanking?.[0]
      const consensusScore = debate.consensusScore ?? 0

      await db.insert(quoorumNotifications).values({
        userId: profileId, // Use profile.id from debate, not users.id from event
        type: 'debate_completed',
        priority: 'normal',
        debateId,
        title: 'Debate completado',
        message: topOption
          ? `Quoorum ha alcanzado consenso (${consensusScore.toFixed(0)}%): "${topOption.option.substring(0, 50)}..."`
          : `El debate "${debate.question.substring(0, 50)}..." ha sido completado`,
        actionUrl: `/quoorum/debates/${debateId}`,
        actionLabel: 'Ver resultados',
        channels: {
          inApp: { sent: true, sentAt: new Date().toISOString() },
        },
      })
    })

    // Step 3: Check if user wants email notification
    await step.run('check-email-notification', async () => {
      // IMPORTANT: quoorum_notification_preferences.user_id references profiles.id
      const [prefs] = await db
        .select()
        .from(quoorumNotificationPreferences)
        .where(eq(quoorumNotificationPreferences.userId, profileId))

      interface Prefs {
        debateCompleted?: { enabled: boolean; channels: string[] }
        emailEnabled?: boolean
      }
      const typedPrefs = prefs as Prefs | null

      if (typedPrefs?.debateCompleted?.enabled !== false) {
        if (
          typedPrefs?.debateCompleted?.channels?.includes('email') ||
          typedPrefs?.emailEnabled !== false
        ) {
          // TODO: Send email via Resend
          logger.info('Would send email notification for debate completion', { debateId, userId })
        }
      }
    })

    // Step 4: Update debate analytics
    await step.run('update-analytics', async () => {
      // Calculate total duration
      const durationMs = debate.completedAt
        ? new Date(debate.completedAt).getTime() - new Date(debate.createdAt).getTime()
        : null

      await db
        .update(quoorumDebates)
        .set({
          metadata: {
            ...((debate.metadata as Record<string, unknown>) ?? {}),
            processingDurationMs: durationMs,
            notificationSent: true,
            notificationSentAt: new Date().toISOString(),
          },
        })
        .where(eq(quoorumDebates.id, debateId))
    })

    logger.info('Quoorum debate completion processed', { debateId, userId })
    return { success: true, debateId }
  }
)

// ============================================================================
// DEBATE FAILED WORKER
// ============================================================================

/**
 * Handle failed debates
 * - Send error notification to user
 * - Log failure for analytics
 */
export const quoorumDebateFailed = inngest.createFunction(
  {
    id: 'quoorum-debate-failed',
    name: 'Quoorum: Debate Failed',
    retries: 2,
  },
  { event: 'quoorum/debate.failed' },
  async ({ event, step }) => {
    const { debateId, userId, errorMessage } = event.data

    // Get debate to resolve profile.id
    const { debate, profileId } = await step.run('get-debate-and-profile', async () => {
      const [debateResult] = await db.select().from(quoorumDebates).where(eq(quoorumDebates.id, debateId))

      if (!debateResult) {
        return { debate: null, profileId: null }
      }

      // IMPORTANT: quoorum_notifications.user_id references profiles.id, not users.id
      // Use debate.userId which is already profile.id
      const profileId = debateResult.userId

      return { debate: debateResult, profileId }
    })

    if (!debate || !profileId) {
      logger.warn('Debate not found for failure processing', { debateId, userId })
      return { success: false, reason: 'debate_not_found' }
    }

    // Send failure notification
    await step.run('send-failure-notification', async () => {
      await db.insert(quoorumNotifications).values({
        userId: profileId, // Use profile.id from debate, not users.id from event
        type: 'debate_failed',
        priority: 'high',
        debateId,
        title: 'Error en debate',
        message: `El debate no pudo completarse: ${errorMessage.substring(0, 100)}`,
        actionUrl: `/quoorum/debates/${debateId}`,
        actionLabel: 'Ver detalles',
        channels: {
          inApp: { sent: true, sentAt: new Date().toISOString() },
        },
      })
    })

    logger.warn('Forum debate failure processed', { debateId, userId, errorMessage })
    return { success: true, debateId }
  }
)

// ============================================================================
// SEND NOTIFICATION WORKER
// ============================================================================

/**
 * Dispatch notifications via various channels
 * - In-app (always)
 * - Email (if enabled)
 * - Push (if enabled)
 */
export const quoorumSendNotification = inngest.createFunction(
  {
    id: 'quoorum-send-notification',
    name: 'Quoorum: Send Notification',
    retries: 3,
  },
  { event: 'quoorum/send-notification' },
  async ({ event, step }) => {
    const { userId, type, debateId, title, message, priority, actionUrl, actionLabel, metadata } =
      event.data

    // Step 1: Check user preferences
    const prefs = await step.run('get-preferences', async () => {
      const [result] = await db
        .select()
        .from(quoorumNotificationPreferences)
        .where(eq(quoorumNotificationPreferences.userId, userId))

      return result
    })

    // Step 2: Check quiet hours
    const inQuietHours = await step.run('check-quiet-hours', async () => {
      if (!prefs?.quietHoursStart || !prefs?.quietHoursEnd) return false

      const now = new Date()
      const timezone = prefs.timezone || 'Europe/Madrid'

      // Simple quiet hours check (would need proper timezone handling in production)
      const currentHour = now.getHours()
      const startHour = parseInt(prefs.quietHoursStart.split(':')[0] || '22', 10)
      const endHour = parseInt(prefs.quietHoursEnd.split(':')[0] || '8', 10)

      if (startHour > endHour) {
        // Overnight quiet hours (e.g., 22:00 - 08:00)
        return currentHour >= startHour || currentHour < endHour
      }
      return currentHour >= startHour && currentHour < endHour
    })

    // If in quiet hours and not urgent, delay notification
    if (inQuietHours && priority !== 'urgent') {
      logger.info('Notification delayed due to quiet hours', { userId, type })
      // In a real implementation, we'd reschedule for after quiet hours
      return { success: true, delayed: true, reason: 'quiet_hours' }
    }

    // Step 3: Create in-app notification
    await step.run('create-notification', async () => {
      await db.insert(quoorumNotifications).values({
        userId,
        type,
        priority: priority ?? 'normal',
        debateId,
        title,
        message,
        actionUrl,
        actionLabel,
        metadata,
        channels: {
          inApp: { sent: true, sentAt: new Date().toISOString() },
        },
      })
    })

    // Step 4: Send email if enabled
    const emailEnabled = prefs?.emailEnabled !== false
    if (emailEnabled) {
      await step.run('send-email', async () => {
        // TODO: Integrate with Resend for email notifications
        logger.info('Would send email notification', { userId, type, title })
      })
    }

    // Step 5: Send push if enabled
    const pushEnabled = prefs?.pushEnabled !== false
    if (pushEnabled) {
      await step.run('send-push', async () => {
        // TODO: Integrate with web push notifications
        logger.info('Would send push notification', { userId, type, title })
      })
    }

    logger.info('Quoorum notification dispatched', { userId, type, title })
    return { success: true }
  }
)

// ============================================================================
// WEEKLY DIGEST WORKER
// ============================================================================

/**
 * Generate and send weekly Forum summaries
 * Runs every Monday at 9 AM
 */
export const quoorumWeeklyDigest = inngest.createFunction(
  {
    id: 'forum-weekly-digest',
    name: 'Quoorum: Weekly Digest',
    retries: 2,
  },
  { cron: '0 9 * * 1' }, // Every Monday at 9 AM
  async ({ step }) => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Step 1: Get all users with Forum access who have weekly digest enabled
    const usersToNotify = await step.run('get-users', async () => {
      const results = await db
        .select({
          userId: profiles.id,
          email: profiles.email,
          name: profiles.fullName,
        })
        .from(profiles)
        .leftJoin(
          quoorumNotificationPreferences,
          eq(profiles.id, quoorumNotificationPreferences.userId)
        )
        .where(eq(profiles.role, 'user'))
        .limit(1000)

      // Filter users with weekly digest enabled (default true)
      return results.filter((u) => u.userId)
    })

    logger.info('Generating weekly digests', { userCount: usersToNotify.length })

    // Step 2: For each user, generate digest
    for (const user of usersToNotify) {
      await step.run(`generate-digest-${user.userId}`, async () => {
        // Get user's debates from past week
        const [debateStats] = await db
          .select({
            total: count(),
            completed: sql<number>`count(*) filter (where ${quoorumDebates.status} = 'completed')`,
            avgConsensus: avg(quoorumDebates.consensusScore),
          })
          .from(quoorumDebates)
          .where(and(eq(quoorumDebates.userId, user.userId), gte(quoorumDebates.createdAt, oneWeekAgo)))

        const totalDebates = debateStats?.total ?? 0

        if (totalDebates === 0) {
          // Skip users with no activity
          return
        }

        const completedDebates = debateStats?.completed ?? 0
        const avgConsensus = debateStats?.avgConsensus
          ? Number(debateStats.avgConsensus).toFixed(0)
          : 'N/A'

        // Create digest notification
        await db.insert(quoorumNotifications).values({
          userId: user.userId,
          type: 'weekly_digest',
          priority: 'low',
          title: 'Resumen semanal de Quoorum',
          message: `Esta semana: ${totalDebates} debates creados, ${completedDebates} completados. Consenso promedio: ${avgConsensus}%`,
          actionUrl: '/quoorum/analytics',
          actionLabel: 'Ver analytics',
          channels: {
            inApp: { sent: true, sentAt: new Date().toISOString() },
          },
        })
      })
    }

    logger.info('Weekly digest generation completed', { usersProcessed: usersToNotify.length })
    return { success: true, usersProcessed: usersToNotify.length }
  }
)

// ============================================================================
// SCHEDULED REPORTS WORKER
// ============================================================================

/**
 * Process scheduled report generation
 * Runs every hour to check for due reports
 */
export const quoorumScheduledReportsWorker = inngest.createFunction(
  {
    id: 'forum-scheduled-reports',
    name: 'Quoorum: Scheduled Reports',
    retries: 2,
  },
  { cron: '0 * * * *' }, // Every hour
  async ({ step }) => {
    const now = new Date()

    // Step 1: Find due scheduled reports
    const dueReports = await step.run('find-due-reports', async () => {
      return await db
        .select()
        .from(quoorumScheduledReports)
        .where(
          and(eq(quoorumScheduledReports.isActive, true), lt(quoorumScheduledReports.nextRunAt, now))
        )
        .limit(50)
    })

    logger.info('Processing scheduled reports', { count: dueReports.length })

    // Step 2: Process each due report
    for (const schedule of dueReports) {
      await step.run(`process-schedule-${schedule.id}`, async () => {
        try {
          // Create report record
          const [report] = await db
            .insert(quoorumReports)
            .values({
              userId: schedule.userId,
              type: schedule.type,
              title: `${schedule.name} - ${now.toLocaleDateString('es-ES')}`,
              format: schedule.format,
              status: 'pending',
              parameters: schedule.parameters ?? {},
            })
            .returning()

          // Trigger report generation
          await inngest.send({
            name: 'forum/generate-report',
            data: {
              reportId: report.id,
              userId: schedule.userId,
            },
          })

          // Calculate next run time
          const nextRunAt = calculateNextRunTime(schedule.schedule)

          // Update schedule
          await db
            .update(quoorumScheduledReports)
            .set({
              lastRunAt: now,
              lastReportId: report.id,
              nextRunAt,
              runCount: (schedule.runCount ?? 0) + 1,
            })
            .where(eq(quoorumScheduledReports.id, schedule.id))
        } catch (error) {
          // Increment fail count
          await db
            .update(quoorumScheduledReports)
            .set({
              failCount: (schedule.failCount ?? 0) + 1,
            })
            .where(eq(quoorumScheduledReports.id, schedule.id))

          logger.error('Failed to process scheduled report', { scheduleId: schedule.id, error })
        }
      })
    }

    return { success: true, processed: dueReports.length }
  }
)

// ============================================================================
// GENERATE REPORT WORKER
// ============================================================================

/**
 * Generate a specific Forum report
 * Called by scheduled reports or manual generation
 */
export const quoorumGenerateReport = inngest.createFunction(
  {
    id: 'forum-generate-report',
    name: 'Quoorum: Generate Report',
    retries: 3,
  },
  { event: 'quoorum/generate-report' },
  async ({ event, step }) => {
    const { reportId, userId } = event.data

    // Step 1: Get report details
    const report = await step.run('get-report', async () => {
      const [result] = await db.select().from(quoorumReports).where(eq(quoorumReports.id, reportId))

      return result
    })

    if (!report) {
      logger.warn('Report not found', { reportId })
      return { success: false, reason: 'report_not_found' }
    }

    // Step 2: Mark as generating
    await step.run('mark-generating', async () => {
      await db
        .update(quoorumReports)
        .set({ status: 'generating' })
        .where(eq(quoorumReports.id, reportId))
    })

    try {
      // Step 3: Gather report data based on type
      const reportData = await step.run('gather-data', async () => {
        const params = report.parameters as Record<string, unknown> | null
        const data: Record<string, unknown> = {}

        if (report.type === 'weekly_summary' || report.type === 'monthly_summary') {
          const daysBack = report.type === 'weekly_summary' ? 7 : 30
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - daysBack)

          const [stats] = await db
            .select({
              totalDebates: count(),
              avgConsensus: avg(quoorumDebates.consensusScore),
            })
            .from(quoorumDebates)
            .where(and(eq(quoorumDebates.userId, userId), gte(quoorumDebates.createdAt, startDate)))

          data.period = { start: startDate, end: new Date() }
          data.totalDebates = stats?.totalDebates ?? 0
          data.avgConsensus = stats?.avgConsensus ? Number(stats.avgConsensus) : 0
        }

        if (report.type === 'expert_performance') {
          const expertStats = await db
            .select()
            .from(quoorumExpertRatings)
            .orderBy(desc(quoorumExpertRatings.avgRating))
            .limit(10)

          data.topExperts = expertStats
        }

        return data
      })

      // Step 4: Generate report content
      await step.run('generate-content', async () => {
        // TODO: Use AI to generate formatted report
        // For now, store summary data

        const summary = {
          totalDebates: reportData.totalDebates as number | undefined,
          avgConsensus: reportData.avgConsensus as number | undefined,
          topExperts: (
            reportData.topExperts as Array<{ expertId: string; avgRating: number }> | undefined
          )?.map((e) => ({
            name: e.expertId,
            rating: (e.avgRating ?? 0) / 100,
          })),
          keyInsights: [
            `Período analizado: ${report.type === 'weekly_summary' ? '7 días' : '30 días'}`,
            `Total de debates: ${(reportData.totalDebates as number | undefined) ?? 0}`,
            `Consenso promedio: ${((reportData.avgConsensus as number | undefined) ?? 0).toFixed(1)}%`,
          ],
        }

        await db
          .update(quoorumReports)
          .set({
            status: 'completed',
            generatedAt: new Date(),
            summary,
            // In production: fileUrl, fileSize, fileName would be set after upload
          })
          .where(eq(quoorumReports.id, reportId))
      })

      // Step 5: Send notification
      await step.run('notify-user', async () => {
        await db.insert(quoorumNotifications).values({
          userId,
          type: 'debate_completed',
          priority: 'normal',
          title: 'Informe generado',
          message: `Tu informe "${report.title}" está listo para descargar`,
          actionUrl: `/quoorum/reports/${reportId}`,
          actionLabel: 'Ver informe',
          channels: {
            inApp: { sent: true, sentAt: new Date().toISOString() },
          },
        })
      })

      logger.info('Report generated successfully', { reportId, userId })
      return { success: true, reportId }
    } catch (error) {
      // Mark as failed
      await step.run('mark-failed', async () => {
        await db
          .update(quoorumReports)
          .set({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          })
          .where(eq(quoorumReports.id, reportId))
      })

      logger.error('Report generation failed', { reportId, error })
      throw error
    }
  }
)

// ============================================================================
// EXPERT PERFORMANCE UPDATE WORKER
// ============================================================================

/**
 * Recalculate expert performance ratings
 * Called after feedback is submitted or periodically
 */
export const quoorumExpertPerformanceUpdate = inngest.createFunction(
  {
    id: 'forum-expert-performance-update',
    name: 'Quoorum: Expert Performance Update',
    retries: 2,
    debounce: {
      key: 'event.data.expertId',
      period: '5m', // Debounce updates within 5 minutes
    },
  },
  { event: 'quoorum/expert-performance-update' },
  async ({ event, step }) => {
    const { expertId } = event.data

    await step.run('recalculate-ratings', async () => {
      // Get all feedback for this expert
      const feedbackData = await db
        .select({
          avgRating: avg(quoorumExpertFeedback.rating),
          avgInsightfulness: avg(quoorumExpertFeedback.insightfulness),
          avgRelevance: avg(quoorumExpertFeedback.relevance),
          avgClarity: avg(quoorumExpertFeedback.clarity),
          avgActionability: avg(quoorumExpertFeedback.actionability),
          totalRatings: count(),
          positiveCount: sql<number>`count(*) filter (where ${quoorumExpertFeedback.sentiment} = 'positive')`,
          followedCount: sql<number>`count(*) filter (where ${quoorumExpertFeedback.wasFollowed} = true)`,
          successfulCount: sql<number>`count(*) filter (where ${quoorumExpertFeedback.wasSuccessful} = true)`,
        })
        .from(quoorumExpertFeedback)
        .where(eq(quoorumExpertFeedback.expertId, expertId))

      const stats = feedbackData[0]
      if (!stats || stats.totalRatings === 0) return

      // Calculate weighted score (1-500 for precision)
      const avgRating = Number(stats.avgRating ?? 0)
      const avgInsight = Number(stats.avgInsightfulness ?? avgRating)
      const avgRelevance = Number(stats.avgRelevance ?? avgRating)
      const avgClarity = Number(stats.avgClarity ?? avgRating)
      const avgAction = Number(stats.avgActionability ?? avgRating)

      const weightedScore = Math.round(
        (avgRating * 0.3 +
          avgInsight * 0.2 +
          avgRelevance * 0.2 +
          avgClarity * 0.15 +
          avgAction * 0.15) *
          100
      )

      // Upsert expert rating
      await db
        .insert(quoorumExpertRatings)
        .values({
          expertId,
          totalRatings: stats.totalRatings,
          avgRating: weightedScore,
          avgInsightfulness: Math.round(avgInsight * 100),
          avgRelevance: Math.round(avgRelevance * 100),
          avgClarity: Math.round(avgClarity * 100),
          avgActionability: Math.round(avgAction * 100),
          positiveRatio: Math.round((stats.positiveCount / stats.totalRatings) * 100),
          followedRatio:
            stats.followedCount > 0
              ? Math.round((stats.followedCount / stats.totalRatings) * 100)
              : null,
          successRatio:
            stats.successfulCount > 0
              ? Math.round((stats.successfulCount / stats.totalRatings) * 100)
              : null,
          lastFeedbackAt: new Date(),
        })
        .onConflictDoUpdate({
          target: quoorumExpertRatings.expertId,
          set: {
            totalRatings: stats.totalRatings,
            avgRating: weightedScore,
            avgInsightfulness: Math.round(avgInsight * 100),
            avgRelevance: Math.round(avgRelevance * 100),
            avgClarity: Math.round(avgClarity * 100),
            avgActionability: Math.round(avgAction * 100),
            positiveRatio: Math.round((stats.positiveCount / stats.totalRatings) * 100),
            followedRatio:
              stats.followedCount > 0
                ? Math.round((stats.followedCount / stats.totalRatings) * 100)
                : null,
            successRatio:
              stats.successfulCount > 0
                ? Math.round((stats.successfulCount / stats.totalRatings) * 100)
                : null,
            lastFeedbackAt: new Date(),
          },
        })
    })

    logger.info('Expert performance updated', { expertId })
    return { success: true, expertId }
  }
)


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly'
  dayOfWeek?: number
  dayOfMonth?: number
  hour: number
  timezone?: string
}

function calculateNextRunTime(schedule: ScheduleConfig): Date {
  const now = new Date()
  const next = new Date()

  // Set hour
  next.setHours(schedule.hour, 0, 0, 0)

  // If time already passed today, move to next occurrence
  if (next <= now) {
    if (schedule.frequency === 'daily') {
      next.setDate(next.getDate() + 1)
    } else if (schedule.frequency === 'weekly') {
      next.setDate(next.getDate() + 7)
    } else if (schedule.frequency === 'monthly') {
      next.setMonth(next.getMonth() + 1)
    }
  }

  // Adjust for day of week (weekly)
  if (schedule.frequency === 'weekly' && schedule.dayOfWeek !== undefined) {
    const currentDay = next.getDay()
    const daysUntil = (schedule.dayOfWeek - currentDay + 7) % 7
    next.setDate(next.getDate() + daysUntil)
  }

  // Adjust for day of month (monthly)
  if (schedule.frequency === 'monthly' && schedule.dayOfMonth !== undefined) {
    next.setDate(Math.min(schedule.dayOfMonth, 28)) // Cap at 28 for safety
  }

  return next
}
