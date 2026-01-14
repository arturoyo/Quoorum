/**
 * Forum Expert Feedback Router
 *
 * Handles user ratings and feedback on expert contributions.
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import {
  forumExpertFeedback,
  forumExpertRatings,
  quoorumDebates,
} from '@quoorum/db/schema'
import { eq, and, desc, sql, avg, count } from 'drizzle-orm'

export const quoorumFeedbackRouter = router({
  /**
   * Submit feedback for an expert in a debate
   */
  submit: protectedProcedure
    .input(
      z.object({
        debateId: z.string().uuid(),
        expertId: z.string(),
        rating: z.number().min(1).max(5),
        sentiment: z.enum(['helpful', 'neutral', 'unhelpful']),
        comment: z.string().max(1000).optional(),
        insightfulness: z.number().min(1).max(5).optional(),
        relevance: z.number().min(1).max(5).optional(),
        clarity: z.number().min(1).max(5).optional(),
        actionability: z.number().min(1).max(5).optional(),
        wasFollowed: z.boolean().optional(),
        wasSuccessful: z.boolean().optional(),
        outcomeNotes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify debate exists and user has access
      const [debate] = await db
        .select({ id: quoorumDebates.id, userId: quoorumDebates.userId })
        .from(quoorumDebates)
        .where(eq(quoorumDebates.id, input.debateId))

      if (!debate) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate no encontrado' })
      }

      // Check if user already submitted feedback for this expert in this debate
      const [existing] = await db
        .select({ id: forumExpertFeedback.id })
        .from(forumExpertFeedback)
        .where(
          and(
            eq(forumExpertFeedback.debateId, input.debateId),
            eq(forumExpertFeedback.expertId, input.expertId),
            eq(forumExpertFeedback.userId, ctx.user.id)
          )
        )

      if (existing) {
        // Update existing feedback
        const [updated] = await db
          .update(forumExpertFeedback)
          .set({
            rating: input.rating,
            sentiment: input.sentiment,
            comment: input.comment,
            insightfulness: input.insightfulness,
            relevance: input.relevance,
            clarity: input.clarity,
            actionability: input.actionability,
            wasFollowed: input.wasFollowed,
            wasSuccessful: input.wasSuccessful,
            outcomeNotes: input.outcomeNotes,
            updatedAt: new Date(),
          })
          .where(eq(forumExpertFeedback.id, existing.id))
          .returning()

        // Recalculate aggregated ratings
        await recalculateExpertRatings(input.expertId)

        return updated
      }

      // Create new feedback
      const [feedback] = await db
        .insert(forumExpertFeedback)
        .values({
          userId: ctx.user.id,
          debateId: input.debateId,
          expertId: input.expertId,
          rating: input.rating,
          sentiment: input.sentiment,
          comment: input.comment,
          insightfulness: input.insightfulness,
          relevance: input.relevance,
          clarity: input.clarity,
          actionability: input.actionability,
          wasFollowed: input.wasFollowed,
          wasSuccessful: input.wasSuccessful,
          outcomeNotes: input.outcomeNotes,
        })
        .returning()

      // Recalculate aggregated ratings
      await recalculateExpertRatings(input.expertId)

      return feedback
    }),

  /**
   * Get user's feedback for a debate
   */
  getByDebate: protectedProcedure
    .input(z.object({ debateId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const feedback = await db
        .select()
        .from(forumExpertFeedback)
        .where(
          and(
            eq(forumExpertFeedback.debateId, input.debateId),
            eq(forumExpertFeedback.userId, ctx.user.id)
          )
        )

      return feedback
    }),

  /**
   * Get aggregated ratings for an expert
   */
  getExpertRatings: protectedProcedure
    .input(z.object({ expertId: z.string() }))
    .query(async ({ input }) => {
      const [ratings] = await db
        .select()
        .from(forumExpertRatings)
        .where(eq(forumExpertRatings.expertId, input.expertId))

      if (!ratings) {
        return null
      }

      return {
        ...ratings,
        avgRating: ratings.avgRating ? ratings.avgRating / 100 : null,
        avgInsightfulness: ratings.avgInsightfulness ? ratings.avgInsightfulness / 100 : null,
        avgRelevance: ratings.avgRelevance ? ratings.avgRelevance / 100 : null,
        avgClarity: ratings.avgClarity ? ratings.avgClarity / 100 : null,
        avgActionability: ratings.avgActionability ? ratings.avgActionability / 100 : null,
      }
    }),

  /**
   * Get top rated experts
   */
  getTopExperts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const experts = await db
        .select()
        .from(forumExpertRatings)
        .where(sql`${forumExpertRatings.totalRatings} >= 5`) // Min 5 ratings
        .orderBy(desc(forumExpertRatings.avgRating))
        .limit(input.limit)

      return experts.map((e) => ({
        ...e,
        avgRating: e.avgRating ? e.avgRating / 100 : null,
      }))
    }),

  /**
   * Get user's feedback history
   */
  getMyFeedback: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const feedback = await db
        .select()
        .from(forumExpertFeedback)
        .where(eq(forumExpertFeedback.userId, ctx.user.id))
        .orderBy(desc(forumExpertFeedback.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      return feedback
    }),

  /**
   * Delete feedback
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [feedback] = await db
        .select({ id: forumExpertFeedback.id, expertId: forumExpertFeedback.expertId })
        .from(forumExpertFeedback)
        .where(
          and(
            eq(forumExpertFeedback.id, input.id),
            eq(forumExpertFeedback.userId, ctx.user.id)
          )
        )

      if (!feedback) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Feedback no encontrado' })
      }

      await db
        .delete(forumExpertFeedback)
        .where(
          and(
            eq(forumExpertFeedback.id, input.id),
            eq(forumExpertFeedback.userId, ctx.user.id)
          )
        )

      // Recalculate aggregated ratings
      await recalculateExpertRatings(feedback.expertId)

      return { success: true }
    }),
})

/**
 * Helper: Recalculate aggregated expert ratings
 */
async function recalculateExpertRatings(expertId: string): Promise<void> {
  const [stats] = await db
    .select({
      totalRatings: count(),
      avgRating: avg(forumExpertFeedback.rating),
      avgInsightfulness: avg(forumExpertFeedback.insightfulness),
      avgRelevance: avg(forumExpertFeedback.relevance),
      avgClarity: avg(forumExpertFeedback.clarity),
      avgActionability: avg(forumExpertFeedback.actionability),
      helpfulCount: sql<number>`count(*) filter (where ${forumExpertFeedback.sentiment} = 'helpful')`,
      neutralCount: sql<number>`count(*) filter (where ${forumExpertFeedback.sentiment} = 'neutral')`,
      unhelpfulCount: sql<number>`count(*) filter (where ${forumExpertFeedback.sentiment} = 'unhelpful')`,
      followedCount: sql<number>`count(*) filter (where ${forumExpertFeedback.wasFollowed} = true)`,
      successCount: sql<number>`count(*) filter (where ${forumExpertFeedback.wasSuccessful} = true)`,
    })
    .from(forumExpertFeedback)
    .where(eq(forumExpertFeedback.expertId, expertId))

  if (!stats || stats.totalRatings === 0) {
    // Delete ratings record if no feedback
    await db.delete(forumExpertRatings).where(eq(forumExpertRatings.expertId, expertId))
    return
  }

  // Upsert ratings record
  await db
    .insert(forumExpertRatings)
    .values({
      expertId,
      totalRatings: stats.totalRatings,
      avgRating: stats.avgRating ? Math.round(Number(stats.avgRating) * 100) : null,
      avgInsightfulness: stats.avgInsightfulness ? Math.round(Number(stats.avgInsightfulness) * 100) : null,
      avgRelevance: stats.avgRelevance ? Math.round(Number(stats.avgRelevance) * 100) : null,
      avgClarity: stats.avgClarity ? Math.round(Number(stats.avgClarity) * 100) : null,
      avgActionability: stats.avgActionability ? Math.round(Number(stats.avgActionability) * 100) : null,
      helpfulCount: stats.helpfulCount,
      neutralCount: stats.neutralCount,
      unhelpfulCount: stats.unhelpfulCount,
      followedCount: stats.followedCount,
      successCount: stats.successCount,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: forumExpertRatings.expertId,
      set: {
        totalRatings: stats.totalRatings,
        avgRating: stats.avgRating ? Math.round(Number(stats.avgRating) * 100) : null,
        avgInsightfulness: stats.avgInsightfulness ? Math.round(Number(stats.avgInsightfulness) * 100) : null,
        avgRelevance: stats.avgRelevance ? Math.round(Number(stats.avgRelevance) * 100) : null,
        avgClarity: stats.avgClarity ? Math.round(Number(stats.avgClarity) * 100) : null,
        avgActionability: stats.avgActionability ? Math.round(Number(stats.avgActionability) * 100) : null,
        helpfulCount: stats.helpfulCount,
        neutralCount: stats.neutralCount,
        unhelpfulCount: stats.unhelpfulCount,
        followedCount: stats.followedCount,
        successCount: stats.successCount,
        updatedAt: new Date(),
      },
    })
}
