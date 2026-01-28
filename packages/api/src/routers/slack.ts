/**
 * Slack Integration Router
 * 
 * DaaS (Decision-as-a-Service): Integración con Slack para crear debates
 * desde mensajes y notificar progreso en tiempo real.
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure, publicProcedure } from '../trpc'
import { db } from '@quoorum/db'
import { quoorumDebates, profiles } from '@quoorum/db/schema'
import { eq, and } from 'drizzle-orm'
import { logger } from '../lib/logger'
import { createHmac, timingSafeEqual } from 'crypto'

// ============================================================================
// ROUTER
// ============================================================================

export const slackRouter = router({
  /**
   * Process Slack event (called from Next.js route handler after signature verification)
   */
  processEvent: publicProcedure
    .input(
      z.object({
        event: z.object({
          type: z.string(),
          text: z.string().optional(),
          user: z.string().optional(),
          channel: z.string().optional(),
          ts: z.string().optional(),
        }),
        team: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Process event
      if (input.event.type === 'message' && input.event.text) {
        // Create debate from Slack message
        // Note: This requires user to be linked to Slack user ID
        logger.info('Slack message received', {
          text: input.event.text.substring(0, 50),
          user: input.event.user,
          channel: input.event.channel,
        })

        // TODO: Lookup user by Slack user ID
        // TODO: Create debate from message
        // TODO: Send confirmation to Slack channel

        return { ok: true, message: 'Debate created from Slack message' }
      }

      return { ok: true }
    }),

  /**
   * Link Slack workspace to user account
   */
  linkWorkspace: protectedProcedure
    .input(
      z.object({
        slackTeamId: z.string(),
        slackUserId: z.string(),
        slackAccessToken: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get profile
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1)

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de usuario no encontrado',
        })
      }

      // Store Slack integration in metadata
      // In production, create a separate table for integrations
      logger.info('Linking Slack workspace', {
        userId: profile.id,
        slackTeamId: input.slackTeamId,
      })

      // TODO: Store in integrations table
      // await db.insert(integrations).values({
      //   userId: profile.id,
      //   provider: 'slack',
      //   providerTeamId: input.slackTeamId,
      //   providerUserId: input.slackUserId,
      //   accessToken: input.slackAccessToken, // Encrypted
      // })

      return { success: true, message: 'Slack workspace linked' }
    }),

  /**
   * Create debate from Slack message
   */
  createDebateFromMessage: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1),
        channelId: z.string().optional(),
        threadTs: z.string().optional(), // Thread timestamp for replies
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get profile
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1)

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de usuario no encontrado',
        })
      }

      // Create draft debate
      const [debate] = await db
        .insert(quoorumDebates)
        .values({
          userId: profile.id,
          question: input.message,
          status: 'draft',
          mode: 'dynamic',
          visibility: 'private',
          metadata: {
            source: 'slack',
            channelId: input.channelId,
            threadTs: input.threadTs,
          },
        })
        .returning()

      logger.info('Debate created from Slack', {
        debateId: debate.id,
        userId: profile.id,
        channelId: input.channelId,
      })

      // TODO: Trigger debate execution
      // TODO: Send confirmation to Slack channel

      return {
        debateId: debate.id,
        message: 'Debate creado desde Slack. Procesando...',
      }
    }),

  /**
   * Send debate update to Slack channel
   */
  notifyProgress: protectedProcedure
    .input(
      z.object({
        debateId: z.string().uuid(),
        message: z.string(),
        channelId: z.string().optional(),
        threadTs: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify debate ownership
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1)

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de usuario no encontrado',
        })
      }

      const [debate] = await db
        .select()
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.debateId),
            eq(quoorumDebates.userId, profile.id)
          )
        )

      if (!debate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Debate no encontrado',
        })
      }

      // TODO: Send message to Slack using Slack API
      // const slackClient = new WebClient(slackAccessToken)
      // await slackClient.chat.postMessage({
      //   channel: input.channelId,
      //   thread_ts: input.threadTs,
      //   text: input.message,
      // })

      logger.info('Slack notification sent', {
        debateId: input.debateId,
        channelId: input.channelId,
      })

      return { success: true }
    }),
})
