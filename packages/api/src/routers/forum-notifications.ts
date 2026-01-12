/**
 * Forum Notifications Router
 *
 * Handles Forum-related notifications and preferences.
 */

import { db } from '@forum/db'
import { forumNotificationPreferences, forumNotifications } from '@forum/db/schema'
import { and, count, desc, eq, lt } from 'drizzle-orm'
import { z } from 'zod'
import { adminProcedure, protectedProcedure, router } from '../trpc'

export const forumNotificationsRouter = router({
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
          ])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(forumNotifications.userId, ctx.user.id),
        eq(forumNotifications.isArchived, false),
      ]

      if (input.unreadOnly) {
        conditions.push(eq(forumNotifications.isRead, false))
      }

      if (input.type) {
        conditions.push(eq(forumNotifications.type, input.type))
      }

      const notifications = await db
        .select()
        .from(forumNotifications)
        .where(and(...conditions))
        .orderBy(desc(forumNotifications.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      return notifications
    }),

  /**
   * Get unread count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const [result] = await db
      .select({ count: count() })
      .from(forumNotifications)
      .where(
        and(
          eq(forumNotifications.userId, ctx.user.id),
          eq(forumNotifications.isRead, false),
          eq(forumNotifications.isArchived, false)
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
        .update(forumNotifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(and(eq(forumNotifications.id, input.id), eq(forumNotifications.userId, ctx.user.id)))

      return { success: true }
    }),

  /**
   * Mark all as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(forumNotifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(eq(forumNotifications.userId, ctx.user.id), eq(forumNotifications.isRead, false)))

    return { success: true }
  }),

  /**
   * Archive notification
   */
  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(forumNotifications)
        .set({ isArchived: true })
        .where(and(eq(forumNotifications.id, input.id), eq(forumNotifications.userId, ctx.user.id)))

      return { success: true }
    }),

  /**
   * Archive all read notifications
   */
  archiveAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(forumNotifications)
      .set({ isArchived: true })
      .where(and(eq(forumNotifications.userId, ctx.user.id), eq(forumNotifications.isRead, true)))

    return { success: true }
  }),

  /**
   * Delete old notifications (> 30 days)
   */
  cleanupOld: protectedProcedure.mutation(async ({ ctx }) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const result = await db
      .delete(forumNotifications)
      .where(
        and(
          eq(forumNotifications.userId, ctx.user.id),
          lt(forumNotifications.createdAt, thirtyDaysAgo)
        )
      )
      .returning({ id: forumNotifications.id })

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
      .from(forumNotificationPreferences)
      .where(eq(forumNotificationPreferences.userId, ctx.user.id))

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
        .select({ id: forumNotificationPreferences.id })
        .from(forumNotificationPreferences)
        .where(eq(forumNotificationPreferences.userId, ctx.user.id))

      if (existing) {
        const [updated] = await db
          .update(forumNotificationPreferences)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(forumNotificationPreferences.userId, ctx.user.id))
          .returning()

        return updated
      }

      // Create new preferences
      const [created] = await db
        .insert(forumNotificationPreferences)
        .values({
          userId: ctx.user.id,
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
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [notification] = await db
        .insert(forumNotifications)
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
    .from(forumNotificationPreferences)
    .where(eq(forumNotificationPreferences.userId, params.userId))

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

  await db.insert(forumNotifications).values({
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
