/**
 * Forum-Deals Integration Router
 *
 * Links Forum debates to sales opportunities/deals.
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import {
  forumDealLinks,
  forumDealRecommendations,
  quoorumDebates,
  deals,
} from '@quoorum/db/schema'
import { eq, and, desc, inArray } from 'drizzle-orm'

export const quoorumDealsRouter = router({
  // ============================================
  // DEAL LINKS
  // ============================================

  /**
   * Link a debate to a deal
   */
  linkDebate: protectedProcedure
    .input(
      z.object({
        debateId: z.string().uuid(),
        dealId: z.string().uuid(),
        context: z.enum([
          'pricing_strategy',
          'negotiation_tactics',
          'objection_handling',
          'proposal_review',
          'competitor_analysis',
          'closing_strategy',
          'risk_assessment',
          'value_proposition',
          'general',
        ]).default('general'),
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify debate exists and user has access
      const [debate] = await db
        .select({ id: quoorumDebates.id })
        .from(quoorumDebates)
        .where(eq(quoorumDebates.id, input.debateId))

      if (!debate) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate no encontrado' })
      }

      // Verify deal exists and user owns it
      const [deal] = await db
        .select({ id: deals.id })
        .from(deals)
        .where(
          and(
            eq(deals.id, input.dealId),
            eq(deals.userId, ctx.user.id)
          )
        )

      if (!deal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Oportunidad no encontrada' })
      }

      // Check if link already exists
      const [existing] = await db
        .select({ id: forumDealLinks.id })
        .from(forumDealLinks)
        .where(
          and(
            eq(forumDealLinks.debateId, input.debateId),
            eq(forumDealLinks.dealId, input.dealId)
          )
        )

      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Este debate ya está vinculado a esta oportunidad' })
      }

      const [link] = await db
        .insert(forumDealLinks)
        .values({
          userId: ctx.user.id,
          debateId: input.debateId,
          dealId: input.dealId,
          context: input.context,
          notes: input.notes,
        })
        .returning()

      return link
    }),

  /**
   * Unlink a debate from a deal
   */
  unlinkDebate: protectedProcedure
    .input(z.object({ linkId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(forumDealLinks)
        .where(
          and(
            eq(forumDealLinks.id, input.linkId),
            eq(forumDealLinks.userId, ctx.user.id)
          )
        )

      return { success: true }
    }),

  /**
   * Get debates linked to a deal
   */
  getDebatesByDeal: protectedProcedure
    .input(z.object({ dealId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the deal
      const [deal] = await db
        .select({ id: deals.id })
        .from(deals)
        .where(
          and(
            eq(deals.id, input.dealId),
            eq(deals.userId, ctx.user.id)
          )
        )

      if (!deal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Oportunidad no encontrada' })
      }

      const links = await db
        .select({
          link: forumDealLinks,
          debate: quoorumDebates,
        })
        .from(forumDealLinks)
        .innerJoin(quoorumDebates, eq(forumDealLinks.debateId, quoorumDebates.id))
        .where(eq(forumDealLinks.dealId, input.dealId))
        .orderBy(desc(forumDealLinks.createdAt))

      return links
    }),

  /**
   * Get deals linked to a debate
   */
  getDealsByDebate: protectedProcedure
    .input(z.object({ debateId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const links = await db
        .select({
          link: forumDealLinks,
          deal: deals,
        })
        .from(forumDealLinks)
        .innerJoin(deals, eq(forumDealLinks.dealId, deals.id))
        .where(
          and(
            eq(forumDealLinks.debateId, input.debateId),
            eq(forumDealLinks.userId, ctx.user.id)
          )
        )
        .orderBy(desc(forumDealLinks.createdAt))

      return links
    }),

  /**
   * Update link influence after deal closes
   */
  updateInfluence: protectedProcedure
    .input(
      z.object({
        linkId: z.string().uuid(),
        influence: z.enum(['decisive', 'significant', 'moderate', 'minimal', 'none', 'unknown']),
        influenceNotes: z.string().max(500).optional(),
        recommendationFollowed: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(forumDealLinks)
        .set({
          influence: input.influence,
          influenceNotes: input.influenceNotes,
          recommendationFollowed: input.recommendationFollowed,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(forumDealLinks.id, input.linkId),
            eq(forumDealLinks.userId, ctx.user.id)
          )
        )
        .returning()

      return updated
    }),

  // ============================================
  // DEAL RECOMMENDATIONS
  // ============================================

  /**
   * Get recommendations for a deal
   */
  getRecommendations: protectedProcedure
    .input(z.object({ dealId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const recommendations = await db
        .select()
        .from(forumDealRecommendations)
        .where(
          and(
            eq(forumDealRecommendations.dealId, input.dealId),
            eq(forumDealRecommendations.userId, ctx.user.id),
            eq(forumDealRecommendations.isActive, true)
          )
        )
        .orderBy(desc(forumDealRecommendations.createdAt))

      return recommendations
    }),

  /**
   * Generate recommendations for a deal based on past debates
   */
  generateRecommendations: protectedProcedure
    .input(z.object({ dealId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get deal info
      const [deal] = await db
        .select()
        .from(deals)
        .where(
          and(
            eq(deals.id, input.dealId),
            eq(deals.userId, ctx.user.id)
          )
        )

      if (!deal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Oportunidad no encontrada' })
      }

      // Get linked debates
      const linkedDebates = await db
        .select({ debate: quoorumDebates })
        .from(forumDealLinks)
        .innerJoin(quoorumDebates, eq(forumDealLinks.debateId, quoorumDebates.id))
        .where(
          and(
            eq(forumDealLinks.dealId, input.dealId),
            eq(quoorumDebates.status, 'completed')
          )
        )

      // Get similar completed debates based on stage
      const similarDebates = await db
        .select()
        .from(quoorumDebates)
        .where(eq(quoorumDebates.status, 'completed'))
        .limit(10)
        .orderBy(desc(quoorumDebates.createdAt))

      // TODO: Use AI to generate recommendations based on deal context and past debates
      // For now, create a placeholder recommendation

      const allDebateIds = [
        ...linkedDebates.map((d) => d.debate.id),
        ...similarDebates.map((d) => d.id),
      ].slice(0, 5)

      const [recommendation] = await db
        .insert(forumDealRecommendations)
        .values({
          userId: ctx.user.id,
          dealId: input.dealId,
          recommendation: `Basado en ${allDebateIds.length} debates anteriores, se recomienda enfocarse en el valor diferencial del producto para esta oportunidad en etapa ${deal.stage}.`,
          confidence: 'medium',
          basedOnDebates: allDebateIds,
          suggestedActions: [
            {
              action: 'Revisar debates vinculados para estrategia de negociación',
              priority: 'high' as const,
              reasoning: 'Los debates previos contienen insights relevantes para esta etapa',
            },
            {
              action: 'Considerar crear un nuevo debate sobre objeciones específicas',
              priority: 'medium' as const,
              reasoning: 'Puede haber objeciones no cubiertas en debates anteriores',
            },
          ],
          riskFactors: [
            {
              factor: 'Competencia activa en la cuenta',
              severity: 'medium' as const,
              mitigation: 'Diferenciarse con propuesta de valor única',
            },
          ],
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        })
        .returning()

      return recommendation
    }),

  /**
   * Dismiss a recommendation
   */
  dismissRecommendation: protectedProcedure
    .input(
      z.object({
        recommendationId: z.string().uuid(),
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(forumDealRecommendations)
        .set({
          isActive: false,
          dismissedAt: new Date(),
          dismissReason: input.reason,
        })
        .where(
          and(
            eq(forumDealRecommendations.id, input.recommendationId),
            eq(forumDealRecommendations.userId, ctx.user.id)
          )
        )

      return { success: true }
    }),

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Get debate-deal influence stats
   */
  getInfluenceStats: protectedProcedure.query(async ({ ctx }) => {
    const links = await db
      .select({
        influence: forumDealLinks.influence,
        recommendationFollowed: forumDealLinks.recommendationFollowed,
      })
      .from(forumDealLinks)
      .where(eq(forumDealLinks.userId, ctx.user.id))

    const stats = {
      total: links.length,
      decisive: links.filter((l) => l.influence === 'decisive').length,
      significant: links.filter((l) => l.influence === 'significant').length,
      moderate: links.filter((l) => l.influence === 'moderate').length,
      minimal: links.filter((l) => l.influence === 'minimal').length,
      none: links.filter((l) => l.influence === 'none').length,
      unknown: links.filter((l) => l.influence === 'unknown' || !l.influence).length,
      recommendationsFollowed: links.filter((l) => l.recommendationFollowed === true).length,
      recommendationsIgnored: links.filter((l) => l.recommendationFollowed === false).length,
    }

    return stats
  }),

  /**
   * Get deals that could benefit from Forum
   */
  getSuggestedDeals: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get deals in negotiation stages without linked debates
      const dealsInNegotiation = await db
        .select()
        .from(deals)
        .where(
          and(
            eq(deals.userId, ctx.user.id),
            inArray(deals.stage, ['negotiation', 'proposal', 'commitment'])
          )
        )
        .orderBy(desc(deals.value))
        .limit(input.limit * 2)

      // Filter out deals that already have linked debates
      const linkedDealIds = await db
        .select({ dealId: forumDealLinks.dealId })
        .from(forumDealLinks)
        .where(eq(forumDealLinks.userId, ctx.user.id))

      const linkedSet = new Set(linkedDealIds.map((d) => d.dealId))
      const suggestedDeals = dealsInNegotiation
        .filter((d) => !linkedSet.has(d.id))
        .slice(0, input.limit)

      return suggestedDeals.map((deal) => ({
        ...deal,
        suggestion: deal.stage === 'negotiation'
          ? 'Crear debate sobre estrategia de negociación'
          : deal.stage === 'proposal'
            ? 'Crear debate sobre propuesta de valor'
            : 'Crear debate sobre cierre de venta',
      }))
    }),

  /**
   * List all user's deals (for linking from debate UI)
   */
  listDeals: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const allDeals = await db
        .select({
          id: deals.id,
          name: deals.name,
          title: deals.name, // Alias for compatibility
          stage: deals.stage,
          value: deals.value,
          clientId: deals.clientId,
        })
        .from(deals)
        .where(eq(deals.userId, ctx.user.id))
        .orderBy(desc(deals.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      return allDeals
    }),
})
