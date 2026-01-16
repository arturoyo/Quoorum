/**
 * Notifications Router
 * Handles user notifications for debate events
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { logger } from "../lib/logger.js";
import { db } from "@quoorum/db";
import { quoorumNotifications } from "@quoorum/db/schema";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface Notification {
  id: string;
  type: 'debate_completed' | 'debate_failed';
  title: string;
  message: string;
  debateId?: string;
  read: boolean;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

async function getUserNotifications(userId: string, limit?: number): Promise<Notification[]> {
  const notifications = await db
    .select()
    .from(quoorumNotifications)
    .where(eq(quoorumNotifications.userId, userId))
    .orderBy(desc(quoorumNotifications.createdAt))
    .limit(limit || 50);

  return notifications
    .filter(n => n.type === 'debate_completed' || n.type === 'debate_failed')
    .map(n => ({
      id: n.id,
      type: n.type as 'debate_completed' | 'debate_failed',
      title: n.title,
      message: n.message,
      debateId: n.debateId || undefined,
      read: n.isRead,
      createdAt: n.createdAt,
    }));
}

async function addNotification(userId: string, notification: Omit<Notification, 'id' | 'createdAt'>) {
  const [newNotification] = await db
    .insert(quoorumNotifications)
    .values({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      debateId: notification.debateId || null,
      isRead: notification.read,
    })
    .returning();

  if (!newNotification) {
    throw new Error('Failed to create notification');
  }

  logger.info('Notification created', {
    userId,
    type: notification.type,
    notificationId: newNotification.id,
  });

  return {
    id: newNotification.id,
    type: newNotification.type as 'debate_completed' | 'debate_failed',
    title: newNotification.title,
    message: newNotification.message,
    debateId: newNotification.debateId || undefined,
    read: newNotification.isRead,
    createdAt: newNotification.createdAt,
  };
}

// ═══════════════════════════════════════════════════════════
// PUBLIC FUNCTIONS (for use by other routers/workers)
// ═══════════════════════════════════════════════════════════

export async function notifyDebateCompleted(userId: string, debateId: string, consensusScore: number) {
  return addNotification(userId, {
    type: 'debate_completed',
    title: 'Debate completado',
    message: `Tu debate ha finalizado con un ${Math.round(consensusScore * 100)}% de consenso`,
    debateId,
    read: false,
  });
}

export async function notifyDebateFailed(userId: string, debateId: string) {
  return addNotification(userId, {
    type: 'debate_failed',
    title: 'Error en debate',
    message: 'Tu debate ha fallado durante la ejecución',
    debateId,
    read: false,
  });
}

// ═══════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════

export const notificationsRouter = router({
  /**
   * List user's notifications
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.unreadOnly) {
        const unreadNotifications = await db
          .select()
          .from(quoorumNotifications)
          .where(
            and(
              eq(quoorumNotifications.userId, ctx.user.id),
              eq(quoorumNotifications.isRead, false)
            )
          )
          .orderBy(desc(quoorumNotifications.createdAt))
          .limit(input.limit);

        return unreadNotifications
          .filter(n => n.type === 'debate_completed' || n.type === 'debate_failed')
          .map(n => ({
            id: n.id,
            type: n.type as 'debate_completed' | 'debate_failed',
            title: n.title,
            message: n.message,
            debateId: n.debateId || undefined,
            read: n.isRead,
            createdAt: n.createdAt,
          }));
      }

      return getUserNotifications(ctx.user.id, input.limit);
    }),

  /**
   * Get unread count
   */
  unreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const count = await db
        .select({ count: quoorumNotifications.id })
        .from(quoorumNotifications)
        .where(
          and(
            eq(quoorumNotifications.userId, ctx.user.id),
            eq(quoorumNotifications.isRead, false)
          )
        );

      return count.length;
    }),

  /**
   * Mark notification as read
   */
  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db
        .update(quoorumNotifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(quoorumNotifications.id, input.id),
            eq(quoorumNotifications.userId, ctx.user.id)
          )
        )
        .returning();

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notificación no encontrada",
        });
      }

      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const result = await db
        .update(quoorumNotifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(quoorumNotifications.userId, ctx.user.id),
            eq(quoorumNotifications.isRead, false)
          )
        )
        .returning();

      return { success: true, count: result.length };
    }),

  /**
   * Delete a notification
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db
        .delete(quoorumNotifications)
        .where(
          and(
            eq(quoorumNotifications.id, input.id),
            eq(quoorumNotifications.userId, ctx.user.id)
          )
        )
        .returning();

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notificación no encontrada",
        });
      }

      return { success: true };
    }),

  /**
   * Clear all notifications
   */
  clearAll: protectedProcedure
    .mutation(async ({ ctx }) => {
      await db
        .delete(quoorumNotifications)
        .where(eq(quoorumNotifications.userId, ctx.user.id));

      return { success: true };
    }),
});
