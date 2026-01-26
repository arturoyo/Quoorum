/**
 * Forum Notifications Router
 *
 * Handles Forum-related notifications and preferences.
 */

import { db } from '@quoorum/db'
import { quoorumNotificationPreferences, quoorumNotifications } from '@quoorum/db/schema'
import { and, count, desc, eq, lt } from 'drizzle-orm'
import { z } from 'zod'
import { adminProcedure, protectedProcedure, router } from '../trpc'

export const quoorumNotificationsRouter = router({
  /**
   * Get user's notifications
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        unreadOnly: z.boolean().default(false),
        type: z
          .enum([
            'debate_completed',
            'debate_failed',
            'new_comment',
            'comment_reply',
            'debate_shared',
            'consensus_reached',
            'expert_recommendation',
            'weekly_digest',
            'debate_reminder',
            'team_action',
            'process_phase_completed',
            'process_completed',
          ])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // IMPORTANT: quoorum_notifications.user_id references profiles.id, not users.id
      const conditions = [
        eq(quoorumNotifications.userId, ctx.userId), // Use profile.id, not users.id
        eq(quoorumNotifications.isArchived, false),
      ]

      if (input.unreadOnly) {
        conditions.push(eq(quoorumNotifications.isRead, false))
      }

      if (input.type) {
        conditions.push(eq(quoorumNotifications.type, input.type))
      }

      const notifications = await db
        .select()
        .from(quoorumNotifications)
        .where(and(...conditions))
        .orderBy(desc(quoorumNotifications.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      return notifications
    }),

  /**
   * Get unread count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    // IMPORTANT: quoorum_notifications.user_id references profiles.id, not users.id
    const [result] = await db
      .select({ count: count() })
      .from(quoorumNotifications)
      .where(
        and(
          eq(quoorumNotifications.userId, ctx.userId), // Use profile.id, not users.id
          eq(quoorumNotifications.isRead, false),
          eq(quoorumNotifications.isArchived, false)
        )
      )

    return result?.count ?? 0
  }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(quoorumNotifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(and(eq(quoorumNotifications.id, input.id), eq(quoorumNotifications.userId, ctx.userId)))

      return { success: true }
    }),

  /**
   * Mark all as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(quoorumNotifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(eq(quoorumNotifications.userId, ctx.userId), eq(quoorumNotifications.isRead, false)))

    return { success: true }
  }),

  /**
   * Archive notification
   */
  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(quoorumNotifications)
        .set({ isArchived: true })
        .where(and(eq(quoorumNotifications.id, input.id), eq(quoorumNotifications.userId, ctx.userId)))

      return { success: true }
    }),

  /**
   * Archive all read notifications
   */
  archiveAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(quoorumNotifications)
      .set({ isArchived: true })
      .where(and(eq(quoorumNotifications.userId, ctx.userId), eq(quoorumNotifications.isRead, true)))

    return { success: true }
  }),

  /**
   * Delete old notifications (> 30 days)
   */
  cleanupOld: protectedProcedure.mutation(async ({ ctx }) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const result = await db
      .delete(quoorumNotifications)
      .where(
        and(
          eq(quoorumNotifications.userId, ctx.userId),
          lt(quoorumNotifications.createdAt, thirtyDaysAgo)
        )
      )
      .returning({ id: quoorumNotifications.id })

    return { deletedCount: result.length }
  }),

  // ============================================
  // PREFERENCES
  // ============================================

  /**
   * Get notification preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const [prefs] = await db
      .select()
      .from(quoorumNotificationPreferences)
      .where(eq(quoorumNotificationPreferences.userId, ctx.userId))

    if (!prefs) {
      // Return defaults
      return {
        debateCompleted: { enabled: true, channels: ['in_app', 'email'] },
        newComment: { enabled: true, channels: ['in_app'] },
        debateShared: { enabled: true, channels: ['in_app', 'email'] },
        weeklyDigest: { enabled: true, dayOfWeek: 1, hour: 9 },
        emailEnabled: true,
        pushEnabled: true,
        quietHoursStart: null,
        quietHoursEnd: null,
        timezone: 'Europe/Madrid',
      }
    }

    return prefs
  }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        debateCompleted: z
          .object({
            enabled: z.boolean(),
            channels: z.array(z.enum(['in_app', 'email', 'push'])),
          })
          .optional(),
        newComment: z
          .object({
            enabled: z.boolean(),
            channels: z.array(z.enum(['in_app', 'email', 'push'])),
          })
          .optional(),
        debateShared: z
          .object({
            enabled: z.boolean(),
            channels: z.array(z.enum(['in_app', 'email', 'push'])),
          })
          .optional(),
        weeklyDigest: z
          .object({
            enabled: z.boolean(),
            dayOfWeek: z.number().min(0).max(6),
            hour: z.number().min(0).max(23),
          })
          .optional(),
        emailEnabled: z.boolean().optional(),
        pushEnabled: z.boolean().optional(),
        quietHoursStart: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .nullable()
          .optional(),
        quietHoursEnd: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .nullable()
          .optional(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await db
        .select({ id: quoorumNotificationPreferences.id })
        .from(quoorumNotificationPreferences)
        .where(eq(quoorumNotificationPreferences.userId, ctx.userId))

      if (existing) {
        const [updated] = await db
          .update(quoorumNotificationPreferences)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(quoorumNotificationPreferences.userId, ctx.userId))
          .returning()

        return updated
      }

      // Create new preferences
      const [created] = await db
        .insert(quoorumNotificationPreferences)
        .values({
          userId: ctx.userId,
          ...input,
        })
        .returning()

      return created
    }),

  // ============================================
  // INTERNAL: Create notification
  // ============================================

  /**
   * Create a notification (internal use)
   */
  create: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        type: z.enum([
          'debate_completed',
          'debate_failed',
          'new_comment',
          'comment_reply',
          'debate_shared',
          'consensus_reached',
          'expert_recommendation',
          'weekly_digest',
          'debate_reminder',
          'team_action',
        ]),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
        debateId: z.string().uuid().optional(),
        title: z.string(),
        message: z.string(),
        actionUrl: z.string().optional(),
        actionLabel: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        expiresAt: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [notification] = await db
        .insert(quoorumNotifications)
        .values({
          userId: input.userId,
          type: input.type,
          priority: input.priority,
          debateId: input.debateId,
          title: input.title,
          message: input.message,
          actionUrl: input.actionUrl,
          actionLabel: input.actionLabel,
          metadata: input.metadata,
          expiresAt: input.expiresAt,
          channels: {
            inApp: { sent: true, sentAt: new Date().toISOString() },
          },
        })
        .returning()

      return notification
    }),
})

/**
 * Helper: Send notification to user
 * Can be imported and used by other parts of the system
 */
export async function sendForumNotification(params: {
  userId: string
  type:
    | 'debate_completed'
    | 'debate_failed'
    | 'new_comment'
    | 'comment_reply'
    | 'debate_shared'
    | 'consensus_reached'
    | 'expert_recommendation'
    | 'weekly_digest'
    | 'debate_reminder'
    | 'team_action'
    | 'process_phase_completed'
    | 'process_completed'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  debateId?: string
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  // Check user preferences (for future use with email/push)
  const [_prefs] = await db
    .select()
    .from(quoorumNotificationPreferences)
    .where(eq(quoorumNotificationPreferences.userId, params.userId))

  // Default to enabled if no preferences set
  const channels: {
    inApp?: { sent: boolean; sentAt?: string }
    email?: { sent: boolean; sentAt?: string }
    push?: { sent: boolean; sentAt?: string }
  } = {}

  // Always send in-app
  channels.inApp = { sent: true, sentAt: new Date().toISOString() }

  // TODO: Send email if enabled
  // TODO: Send push if enabled

  await db.insert(quoorumNotifications).values({
    userId: params.userId,
    type: params.type,
    priority: params.priority ?? 'normal',
    debateId: params.debateId,
    title: params.title,
    message: params.message,
    actionUrl: params.actionUrl,
    actionLabel: params.actionLabel,
    metadata: params.metadata,
    channels,
  })
}

/**
 * Helper: Notify debate completed
 * Convenience wrapper for debate completion notifications
 */
export async function notifyDebateCompleted(
  userId: string,
  debateId: string,
  consensusScore: number
): Promise<void> {
  await sendForumNotification({
    userId,
    type: 'debate_completed',
    priority: 'normal',
    debateId,
    title: 'Debate completado',
    message: `Tu debate ha finalizado con un ${Math.round(consensusScore * 100)}% de consenso`,
    actionUrl: `/quoorum/${debateId}`,
    actionLabel: 'Ver debate',
    metadata: { consensusScore },
  })
}

/**
 * Helper: Notify debate failed
 * Convenience wrapper for debate failure notifications
 */
export async function notifyDebateFailed(userId: string, debateId: string): Promise<void> {
  await sendForumNotification({
    userId,
    type: 'debate_failed',
    priority: 'high',
    debateId,
    title: 'Error en debate',
    message: 'Tu debate ha fallado durante la ejecución',
    actionUrl: `/quoorum/${debateId}`,
    actionLabel: 'Ver detalles',
  })
}
