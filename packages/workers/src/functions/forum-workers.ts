// @ts-nocheck
/**
 * Forum Dynamic Expert System Workers
 *
 * Background jobs for the Forum system:
 * - forumDebateCompleted: Process completed debates, send notifications, update stats
 * - forumDebateFailed: Handle failed debates, send error notifications
 * - forumSendNotification: Dispatch notifications via in-app, email, push
 * - forumWeeklyDigest: Generate and send weekly Forum summaries (Monday 9 AM)
 * - forumScheduledReports: Run scheduled report generation
 * - forumGenerateReport: Generate a specific report
 * - forumExpertPerformanceUpdate: Recalculate expert ratings
 */

import { db } from '@quoorum/db'
import {
  forumDebates,
  forumExpertFeedback,
  forumExpertRatings,
  forumNotificationPreferences,
  forumNotifications,
  forumReports,
  forumScheduledReports,
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
export const forumDebateCompleted = inngest.createFunction(
  {
    id: 'forum-debate-completed',
    name: 'Forum: Debate Completed',
    retries: 3,
  },
  { event: 'forum/debate.completed' },
  async ({ event, step }) => {
    const { debateId, userId } = event.data

    // Step 1: Get debate details
    const debate = await step.run('get-debate', async () => {
      const [result] = await db.select().from(forumDebates).where(eq(forumDebates.id, debateId))

      return result
    })

    if (!debate) {
      logger.warn('Debate not found for completion processing', { debateId })
      return { success: false, reason: 'debate_not_found' }
    }

    // Step 2: Send in-app notification
    await step.run('send-notification', async () => {
      // Get consensus from final ranking
      const finalRanking = debate.finalRanking as Array<{ option: string; score: number }> | null
      const topOption = finalRanking?.[0]
      const consensusScore = debate.consensusScore ?? 0

      await db.insert(forumNotifications).values({
        userId,
        type: 'debate_completed',
        priority: 'normal',
        debateId,
        title: 'Debate completado',
        message: topOption
          ? `El Forum ha alcanzado consenso (${consensusScore.toFixed(0)}%): "${topOption.option.substring(0, 50)}..."`
          : `El debate "${debate.question.substring(0, 50)}..." ha sido completado`,
        actionUrl: `/forum/debates/${debateId}`,
        actionLabel: 'Ver resultados',
        channels: {
          inApp: { sent: true, sentAt: new Date().toISOString() },
        },
      })
    })

    // Step 3: Check if user wants email notification
    await step.run('check-email-notification', async () => {
      const [prefs] = await db
        .select()
        .from(forumNotificationPreferences)
        .where(eq(forumNotificationPreferences.userId, userId))

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
        .update(forumDebates)
        .set({
          metadata: {
            ...((debate.metadata as Record<string, unknown>) ?? {}),
            processingDurationMs: durationMs,
            notificationSent: true,
            notificationSentAt: new Date().toISOString(),
          },
        })
        .where(eq(forumDebates.id, debateId))
    })

    logger.info('Forum debate completion processed', { debateId, userId })
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
export const forumDebateFailed = inngest.createFunction(
  {
    id: 'forum-debate-failed',
    name: 'Forum: Debate Failed',
    retries: 2,
  },
  { event: 'forum/debate.failed' },
  async ({ event, step }) => {
    const { debateId, userId, errorMessage } = event.data

    // Send failure notification
    await step.run('send-failure-notification', async () => {
      await db.insert(forumNotifications).values({
        userId,
        type: 'debate_failed',
        priority: 'high',
        debateId,
        title: 'Error en debate',
        message: `El debate no pudo completarse: ${errorMessage.substring(0, 100)}`,
        actionUrl: `/forum/debates/${debateId}`,
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
export const forumSendNotification = inngest.createFunction(
  {
    id: 'forum-send-notification',
    name: 'Forum: Send Notification',
    retries: 3,
  },
  { event: 'forum/send-notification' },
  async ({ event, step }) => {
    const { userId, type, debateId, title, message, priority, actionUrl, actionLabel, metadata } =
      event.data

    // Step 1: Check user preferences
    const prefs = await step.run('get-preferences', async () => {
      const [result] = await db
        .select()
        .from(forumNotificationPreferences)
        .where(eq(forumNotificationPreferences.userId, userId))

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
      await db.insert(forumNotifications).values({
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

    logger.info('Forum notification dispatched', { userId, type, title })
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
export const forumWeeklyDigest = inngest.createFunction(
  {
    id: 'forum-weekly-digest',
    name: 'Forum: Weekly Digest',
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
          forumNotificationPreferences,
          eq(profiles.id, forumNotificationPreferences.userId)
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
            completed: sql<number>`count(*) filter (where ${forumDebates.status} = 'completed')`,
            avgConsensus: avg(forumDebates.consensusScore),
          })
          .from(forumDebates)
          .where(and(eq(forumDebates.userId, user.userId), gte(forumDebates.createdAt, oneWeekAgo)))

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
        await db.insert(forumNotifications).values({
          userId: user.userId,
          type: 'weekly_digest',
          priority: 'low',
          title: 'Resumen semanal del Forum',
          message: `Esta semana: ${totalDebates} debates creados, ${completedDebates} completados. Consenso promedio: ${avgConsensus}%`,
          actionUrl: '/forum/analytics',
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
export const forumScheduledReportsWorker = inngest.createFunction(
  {
    id: 'forum-scheduled-reports',
    name: 'Forum: Scheduled Reports',
    retries: 2,
  },
  { cron: '0 * * * *' }, // Every hour
  async ({ step }) => {
    const now = new Date()

    // Step 1: Find due scheduled reports
    const dueReports = await step.run('find-due-reports', async () => {
      return await db
        .select()
        .from(forumScheduledReports)
        .where(
          and(eq(forumScheduledReports.isActive, true), lt(forumScheduledReports.nextRunAt, now))
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
            .insert(forumReports)
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
            .update(forumScheduledReports)
            .set({
              lastRunAt: now,
              lastReportId: report.id,
              nextRunAt,
              runCount: (schedule.runCount ?? 0) + 1,
            })
            .where(eq(forumScheduledReports.id, schedule.id))
        } catch (error) {
          // Increment fail count
          await db
            .update(forumScheduledReports)
            .set({
              failCount: (schedule.failCount ?? 0) + 1,
            })
            .where(eq(forumScheduledReports.id, schedule.id))

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
export const forumGenerateReport = inngest.createFunction(
  {
    id: 'forum-generate-report',
    name: 'Forum: Generate Report',
    retries: 3,
  },
  { event: 'forum/generate-report' },
  async ({ event, step }) => {
    const { reportId, userId } = event.data

    // Step 1: Get report details
    const report = await step.run('get-report', async () => {
      const [result] = await db.select().from(forumReports).where(eq(forumReports.id, reportId))

      return result
    })

    if (!report) {
      logger.warn('Report not found', { reportId })
      return { success: false, reason: 'report_not_found' }
    }

    // Step 2: Mark as generating
    await step.run('mark-generating', async () => {
      await db
        .update(forumReports)
        .set({ status: 'generating' })
        .where(eq(forumReports.id, reportId))
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
              avgConsensus: avg(forumDebates.consensusScore),
            })
            .from(forumDebates)
            .where(and(eq(forumDebates.userId, userId), gte(forumDebates.createdAt, startDate)))

          data.period = { start: startDate, end: new Date() }
          data.totalDebates = stats?.totalDebates ?? 0
          data.avgConsensus = stats?.avgConsensus ? Number(stats.avgConsensus) : 0
        }

        if (report.type === 'expert_performance') {
          const expertStats = await db
            .select()
            .from(forumExpertRatings)
            .orderBy(desc(forumExpertRatings.avgRating))
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
          .update(forumReports)
          .set({
            status: 'completed',
            generatedAt: new Date(),
            summary,
            // In production: fileUrl, fileSize, fileName would be set after upload
          })
          .where(eq(forumReports.id, reportId))
      })

      // Step 5: Send notification
      await step.run('notify-user', async () => {
        await db.insert(forumNotifications).values({
          userId,
          type: 'debate_completed',
          priority: 'normal',
          title: 'Informe generado',
          message: `Tu informe "${report.title}" está listo para descargar`,
          actionUrl: `/forum/reports/${reportId}`,
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
          .update(forumReports)
          .set({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          })
          .where(eq(forumReports.id, reportId))
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
export const forumExpertPerformanceUpdate = inngest.createFunction(
  {
    id: 'forum-expert-performance-update',
    name: 'Forum: Expert Performance Update',
    retries: 2,
    debounce: {
      key: 'event.data.expertId',
      period: '5m', // Debounce updates within 5 minutes
    },
  },
  { event: 'forum/expert-performance-update' },
  async ({ event, step }) => {
    const { expertId } = event.data

    await step.run('recalculate-ratings', async () => {
      // Get all feedback for this expert
      const feedbackData = await db
        .select({
          avgRating: avg(forumExpertFeedback.rating),
          avgInsightfulness: avg(forumExpertFeedback.insightfulness),
          avgRelevance: avg(forumExpertFeedback.relevance),
          avgClarity: avg(forumExpertFeedback.clarity),
          avgActionability: avg(forumExpertFeedback.actionability),
          totalRatings: count(),
          positiveCount: sql<number>`count(*) filter (where ${forumExpertFeedback.sentiment} = 'positive')`,
          followedCount: sql<number>`count(*) filter (where ${forumExpertFeedback.wasFollowed} = true)`,
          successfulCount: sql<number>`count(*) filter (where ${forumExpertFeedback.wasSuccessful} = true)`,
        })
        .from(forumExpertFeedback)
        .where(eq(forumExpertFeedback.expertId, expertId))

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
        .insert(forumExpertRatings)
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
          target: forumExpertRatings.expertId,
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
// WHATSAPP FORUM DEBATE WORKER
// ============================================================================

/**
 * Run Forum debate triggered from WhatsApp and send results back
 * - Runs the debate using ForumSystem
 * - Sends completion message back to WhatsApp conversation
 */
export const forumWhatsAppDebate = inngest.createFunction(
  {
    id: 'forum-whatsapp-debate',
    name: 'Forum: WhatsApp Debate',
    retries: 2,
    concurrency: {
      key: 'event.data.userId',
      limit: 2, // Max 2 concurrent debates per user
    },
  },
  { event: 'forum/whatsapp-debate.created' },
  async ({ event, step }) => {
    const { debateId, userId, conversationId, question } = event.data

    // Step 1: Update debate status to in_progress
    await step.run('start-debate', async () => {
      await db
        .update(forumDebates)
        .set({
          status: 'in_progress',
          startedAt: new Date(),
        })
        .where(eq(forumDebates.id, debateId))
    })

    try {
      // Step 2: Run the debate using ForumSystem
      const result = await step.run('run-debate', async () => {
        // Dynamic import to avoid circular dependencies
        const { ForumSystem } = await import('@quoorum/forum')

        const forumSystem = new ForumSystem({
          maxRounds: 3,
          consensusThreshold: 0.7,
        })

        const debateResult = await forumSystem.runDebate(question, {
          userId,
          channel: 'whatsapp',
        })

        return debateResult
      })

      // Step 3: Update debate with results
      await step.run('save-results', async () => {
        await db
          .update(forumDebates)
          .set({
            status: 'completed',
            completedAt: new Date(),
            consensusScore: result.consensusScore,
            finalRanking: result.ranking,
            synthesizedConclusion: result.conclusion,
            metadata: {
              source: 'whatsapp_command',
              conversationId,
              roundCount: result.rounds?.length ?? 0,
              expertCount: result.experts?.length ?? 0,
            },
          })
          .where(eq(forumDebates.id, debateId))
      })

      // Step 4: Format and send results back to WhatsApp
      await step.run('send-whatsapp-response', async () => {
        // TODO: WhatsApp service not yet migrated to @forum
        // const { createWhatsAppService } = await import('@quoorum/whatsapp')
        // const whatsappService = createWhatsAppService()
        const whatsappService = { sendTextMessage: async (_id: string, _msg: string) => {} }

        // Format the response
        const consensusEmoji =
          result.consensusScore >= 0.9 ? '🎯' : result.consensusScore >= 0.7 ? '✅' : '⚠️'
        const topOption = result.ranking?.[0]

        let response = `${consensusEmoji} *Debate completado*\n\n`
        response += `*Tu pregunta:*\n"${question.substring(0, 100)}${question.length > 100 ? '...' : ''}"\n\n`
        response += `*Consenso:* ${(result.consensusScore * 100).toFixed(0)}%\n\n`

        if (topOption) {
          response += `*Recomendación principal:*\n${topOption.option}\n\n`
        }

        if (result.conclusion) {
          response += `*Conclusión:*\n${result.conclusion.substring(0, 500)}${result.conclusion.length > 500 ? '...' : ''}\n\n`
        }

        // Add top 3 options if available
        if (result.ranking && result.ranking.length > 1) {
          response += `*Ranking de opciones:*\n`
          result.ranking.slice(0, 3).forEach((opt, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'
            response += `${medal} ${opt.option.substring(0, 60)}${opt.option.length > 60 ? '...' : ''}\n`
          })
          response += '\n'
        }

        response += `_Ver detalles completos en la app: /forum/debates/${debateId}_`

        await whatsappService.sendTextMessage(conversationId, response)
      })

      // Step 5: Trigger completion notification
      await step.run('trigger-completion', async () => {
        await inngest.send({
          name: 'forum/debate.completed',
          data: { debateId, userId },
        })
      })

      logger.info('WhatsApp Forum debate completed', { debateId, userId, conversationId })
      return { success: true, debateId, consensusScore: result.consensusScore }
    } catch (error) {
      // Handle failure
      await step.run('handle-failure', async () => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        // Update debate status
        await db
          .update(forumDebates)
          .set({
            status: 'failed',
            errorMessage,
          })
          .where(eq(forumDebates.id, debateId))

        // Send error message to WhatsApp
        try {
          // TODO: WhatsApp service not yet migrated to @forum
          // const { createWhatsAppService } = await import('@quoorum/whatsapp')
          // const whatsappService = createWhatsAppService()
          // await whatsappService.sendTextMessage(
          //   conversationId,
          //   `❌ *Error en el debate*\n\nNo se pudo completar el debate.\n\n_${errorMessage.substring(0, 100)}_\n\nIntenta de nuevo con /forum [pregunta]`
          // )
          logger.warn('WhatsApp error notification skipped - service not available', { conversationId })
        } catch {
          logger.error('Failed to send WhatsApp error message', { debateId })
        }

        // Trigger failure notification
        await inngest.send({
          name: 'forum/debate.failed',
          data: { debateId, userId, errorMessage },
        })
      })

      logger.error('WhatsApp Forum debate failed', { debateId, userId, error })
      throw error
    }
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
