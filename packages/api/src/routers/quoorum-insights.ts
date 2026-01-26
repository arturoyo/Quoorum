/**
 * Quoorum Insights Router
 *
 * Provides API endpoints for Quoorum consultation insights (Phase 2).
 * Shows when Quoorum was consulted during complex decision-making scenarios and the advice given.
 */

import { z } from 'zod'
import { eq, and, desc, gte, count, sql } from 'drizzle-orm'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import { quoorumConsultations, clients } from '@quoorum/db/schema'
import { logger } from '../lib/logger'

export const quoorumInsightsRouter = router({
  /**
   * Get recent Quoorum consultations for the dashboard widget
   */
  getRecent: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(20).default(5),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        const limit = input?.limit ?? 5

        const consultations = await db
          .select({
            id: quoorumConsultations.id,
            originalMessage: quoorumConsultations.originalMessage,
            triggers: quoorumConsultations.triggers,
            urgency: quoorumConsultations.urgency,
            strategy: quoorumConsultations.strategy,
            responseApproach: quoorumConsultations.responseApproach,
            recommendHumanEscalation: quoorumConsultations.recommendHumanEscalation,
            adviceConfidence: quoorumConsultations.adviceConfidence,
            createdAt: quoorumConsultations.createdAt,
            clientId: quoorumConsultations.clientId,
            clientName: clients.name,
          })
          .from(quoorumConsultations)
          .leftJoin(clients, eq(quoorumConsultations.clientId, clients.id))
          .where(eq(quoorumConsultations.userId, ctx.userId))
          .orderBy(desc(quoorumConsultations.createdAt))
          .limit(limit)

        return consultations
      } catch (error) {
        // Si la tabla no existe o hay un error de DB, retornar array vacío
        // Esto permite que el widget funcione aunque la tabla no esté creada
        logger.error('Quoorum Insights: Error fetching recent consultations', error as Error, {
          userId: ctx.userId,
        })
        return []
      }
    }),

  /**
   * Get Quoorum consultation stats for the dashboard
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Get stats for last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Total consultations
      const [totalResult] = await db
        .select({ count: count() })
        .from(quoorumConsultations)
        .where(
          and(
            eq(quoorumConsultations.userId, ctx.userId),
            gte(quoorumConsultations.createdAt, thirtyDaysAgo)
          )
        )

      // Consultations by urgency
      const urgencyStats = await db
        .select({
          urgency: quoorumConsultations.urgency,
          count: count(),
        })
        .from(quoorumConsultations)
        .where(
          and(
            eq(quoorumConsultations.userId, ctx.userId),
            gte(quoorumConsultations.createdAt, thirtyDaysAgo)
          )
        )
        .groupBy(quoorumConsultations.urgency)

      // Most common triggers
      const triggerStats = await db
        .select({
          triggers: quoorumConsultations.triggers,
        })
        .from(quoorumConsultations)
        .where(
          and(
            eq(quoorumConsultations.userId, ctx.userId),
            gte(quoorumConsultations.createdAt, thirtyDaysAgo)
          )
        )

      // Count trigger occurrences
      const triggerCounts: Record<string, number> = {}
      for (const row of triggerStats) {
        const triggers = row.triggers as string[] | null
        if (triggers) {
          for (const trigger of triggers) {
            triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1
          }
        }
      }

      // Sort triggers by count
      const topTriggers = Object.entries(triggerCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([trigger, count]) => ({ trigger, count }))

      // Human escalations recommended
      const [escalationsResult] = await db
        .select({ count: count() })
        .from(quoorumConsultations)
        .where(
          and(
            eq(quoorumConsultations.userId, ctx.userId),
            eq(quoorumConsultations.recommendHumanEscalation, true),
            gte(quoorumConsultations.createdAt, thirtyDaysAgo)
          )
        )

      // Average confidence
      const [avgConfidence] = await db
        .select({
          avg: sql<string>`AVG(${quoorumConsultations.adviceConfidence})`,
        })
        .from(quoorumConsultations)
        .where(
          and(
            eq(quoorumConsultations.userId, ctx.userId),
            gte(quoorumConsultations.createdAt, thirtyDaysAgo)
          )
        )

      return {
        totalConsultations: totalResult?.count ?? 0,
        urgencyBreakdown: {
          low: urgencyStats.find((s) => s.urgency === 'low')?.count ?? 0,
          medium: urgencyStats.find((s) => s.urgency === 'medium')?.count ?? 0,
          high: urgencyStats.find((s) => s.urgency === 'high')?.count ?? 0,
          critical: urgencyStats.find((s) => s.urgency === 'critical')?.count ?? 0,
        },
        topTriggers,
        humanEscalationsRecommended: escalationsResult?.count ?? 0,
        averageConfidence: avgConfidence?.avg ? Math.round(Number(avgConfidence.avg)) : null,
      }
    } catch (error) {
      // Si la tabla no existe o hay un error de DB, retornar stats vacíos
      // Esto permite que el widget funcione aunque la tabla no esté creada
      logger.error('Quoorum Insights: Error fetching stats', error as Error, {
        userId: ctx.userId,
      })
      return {
        totalConsultations: 0,
        urgencyBreakdown: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0,
        },
        topTriggers: [],
        humanEscalationsRecommended: 0,
        averageConfidence: null,
      }
    }
  }),

  /**
   * Store a new Quoorum consultation (called after response generation)
   */
  store: protectedProcedure
    .input(
      z.object({
        clientId: z.string().uuid().optional(),
        conversationId: z.string().uuid().optional(),
        originalMessage: z.string(),
        triggers: z.array(z.string()),
        urgency: z.enum(['low', 'medium', 'high', 'critical']),
        complexityConfidence: z.number().optional(),
        strategy: z.string().optional(),
        responseApproach: z.enum(['empathetic', 'assertive', 'consultative', 'direct']).optional(),
        talkingPoints: z.array(z.string()).optional(),
        avoidSaying: z.array(z.string()).optional(),
        risksToAddress: z.array(z.string()).optional(),
        opportunitiesToLeverage: z.array(z.string()).optional(),
        negotiationGuidance: z
          .object({
            idealOutcome: z.string().optional(),
            fallbackPosition: z.string().optional(),
            leveragePoints: z.array(z.string()).optional(),
          })
          .optional(),
        recommendHumanEscalation: z.boolean().default(false),
        escalationReason: z.string().optional(),
        adviceConfidence: z.number().optional(),
        processingTimeMs: z.number().optional(),
        clientContext: z
          .object({
            pipelineStatus: z.string().optional(),
            intentScore: z.number().optional(),
            sentimentScore: z.number().optional(),
            discType: z.string().optional(),
            isVIP: z.boolean().optional(),
            clientValue: z.number().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [consultation] = await db
        .insert(quoorumConsultations)
        .values({
          userId: ctx.userId,
          clientId: input.clientId,
          conversationId: input.conversationId,
          originalMessage: input.originalMessage,
          triggers: input.triggers,
          urgency: input.urgency,
          complexityConfidence: input.complexityConfidence,
          strategy: input.strategy,
          responseApproach: input.responseApproach,
          talkingPoints: input.talkingPoints,
          avoidSaying: input.avoidSaying,
          risksToAddress: input.risksToAddress,
          opportunitiesToLeverage: input.opportunitiesToLeverage,
          negotiationGuidance: input.negotiationGuidance,
          recommendHumanEscalation: input.recommendHumanEscalation,
          escalationReason: input.escalationReason,
          adviceConfidence: input.adviceConfidence,
          processingTimeMs: input.processingTimeMs,
          clientContext: input.clientContext,
        })
        .returning({ id: quoorumConsultations.id })

      return consultation
    }),

  /**
   * Get consultation by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [consultation] = await db
        .select()
        .from(quoorumConsultations)
        .where(and(eq(quoorumConsultations.id, input.id), eq(quoorumConsultations.userId, ctx.userId)))

      return consultation ?? null
    }),

  /**
   * Rate a Quoorum consultation (user feedback)
   */
  rate: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        rating: z.number().min(1).max(5),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(quoorumConsultations)
        .set({
          userRating: input.rating,
          userFeedback: input.feedback,
        })
        .where(and(eq(quoorumConsultations.id, input.id), eq(quoorumConsultations.userId, ctx.userId)))
        .returning({ id: quoorumConsultations.id })

      return updated ?? null
    }),
})
