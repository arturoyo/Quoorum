/**
 * Quoorum Router - Dynamic Expert System
 *
 * Handles all Quoorum operations: debates, analytics, learning system,
 * custom experts, templates, sharing, and more.
 */

import { TRPCError } from '@trpc/server'
import { db } from '@quoorum/db'
import {
  adminRoles,
  adminUsers,
  quoorumCustomExperts,
  quoorumDebateComments,
  quoorumDebateLikes,
  quoorumDebates,
  quoorumDebateTemplates,
  quoorumExpertPerformance,
  profiles,
} from '@quoorum/db/schema'
import { runDynamicDebate } from '@quoorum/quoorum'
import { and, avg, count, desc, eq, like, or, sql, sum } from 'drizzle-orm'
import { z } from 'zod'
import { logger } from '../lib/logger'
import { protectedProcedure, router, expensiveRateLimitedProcedure } from '../trpc'
import { inngest } from '../lib/inngest-client'

// ============================================
// TYPES (from schema jsonb $type definitions)
// ============================================

interface DebateContext {
  sources?: Array<{ type: string; content: string }>
  constraints?: string[]
  background?: string
  [key: string]: unknown
}

interface DebateRound {
  round: number
  messages: Array<{
    agentKey: string
    content: string
    timestamp?: string
  }>
}

interface RankingOption {
  option: string
  score: number
  reasoning?: string
}

interface DebateExpert {
  id: string
  name: string
  expertise: string[]
  matchScore?: number
}

interface QualityMetrics {
  depth: number
  diversity: number
  originality: number
  issues?: Array<{
    type: string
    severity: number
    description: string
  }>
}

interface Intervention {
  round: number
  type: string
  prompt: string
  wasEffective?: boolean
}

interface DebateResult {
  consensusScore?: number
  rounds: DebateRound[]
  experts?: DebateExpert[]
  finalRanking?: RankingOption[]
  qualityMetrics?: QualityMetrics
  interventions?: Intervention[]
}

/**
 * Admin middleware - Only admins can access Quoorum
 */
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const [adminUser] = await db
    .select({
      id: adminUsers.id,
      userId: adminUsers.userId,
      roleId: adminUsers.roleId,
    })
    .from(adminUsers)
    .innerJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
    .where(and(eq(adminUsers.userId, ctx.user.id), eq(adminUsers.isActive, true)))

  if (!adminUser) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Solo administradores pueden acceder a Forum',
    })
  }

  return next({ ctx: { ...ctx, adminUser } })
})

/**
 * Admin procedure with rate limiting for expensive operations (AI, Quoorum debates)
 */
const adminWithRateLimitProcedure = expensiveRateLimitedProcedure.use(async ({ ctx, next }) => {
  const [adminUser] = await db
    .select({
      id: adminUsers.id,
      userId: adminUsers.userId,
      roleId: adminUsers.roleId,
    })
    .from(adminUsers)
    .innerJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
    .where(and(eq(adminUsers.userId, ctx.user.id), eq(adminUsers.isActive, true)))

  if (!adminUser) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Solo administradores pueden acceder a Forum',
    })
  }

  return next({ ctx: { ...ctx, adminUser } })
})

/**
 * Quoorum Router
 */
export const quoorumRouter = router({
  // ============================================
  // DEBATES - CRUD OPERATIONS
  // ============================================

  /**
   * List debates with filters
   */
  list: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        orderBy: z.enum(['recent', 'quality', 'consensus', 'cost']).default('recent'),
        status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { limit, offset, orderBy, status, search } = input

      let query = db.select().from(quoorumDebates)

      // Filters
      const conditions = []
      if (status) {
        conditions.push(eq(quoorumDebates.status, status))
      }
      if (search) {
        conditions.push(like(quoorumDebates.question, `%${search}%`))
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query
      }

      // Ordering
      switch (orderBy) {
        case 'quality':
          query = query.orderBy(desc(quoorumDebates.qualityMetrics)) as typeof query
          break
        case 'consensus':
          query = query.orderBy(desc(quoorumDebates.consensusScore)) as typeof query
          break
        case 'cost':
          query = query.orderBy(desc(quoorumDebates.totalCostUsd)) as typeof query
          break
        default:
          query = query.orderBy(desc(quoorumDebates.createdAt)) as typeof query
      }

      const debates = await query.limit(limit).offset(offset)

      return debates
    }),

  /**
   * Get debate by ID
   */
  get: adminProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const [debate] = await db.select().from(quoorumDebates).where(eq(quoorumDebates.id, input.id))

    if (!debate) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate no encontrado' })
    }

    // Increment view count
    await db
      .update(quoorumDebates)
      .set({ viewCount: sql`${quoorumDebates.viewCount} + 1` })
      .where(eq(quoorumDebates.id, input.id))

    return debate
  }),

  /**
   * Create and run new debate
   * ⚠️ EXPENSIVE OPERATION - Uses adminWithRateLimitProcedure
   */
  create: adminWithRateLimitProcedure
    .input(
      z.object({
        question: z.string().min(10).max(5000, "La pregunta no puede exceder 5000 caracteres"),
        context: z
          .object({
            sources: z.array(z.object({ type: z.string(), content: z.string() })).optional(),
            constraints: z.array(z.string()).optional(),
            background: z.string().optional(),
          })
          .optional(),
        mode: z.enum(['static', 'dynamic']).optional(),
        visibility: z.enum(['private', 'team', 'public']).default('private'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create debate record
      // IMPORTANT: quoorum_debates.user_id references profiles.id, not users.id
      const [debate] = await db
        .insert(quoorumDebates)
        .values({
          userId: ctx.userId, // Use profile.id, not users.id
          question: input.question,
          context: input.context,
          mode: input.mode ?? 'dynamic',
          status: 'pending',
          visibility: input.visibility,
        })
        .returning()

      if (!debate) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error creating debate' })
      }

      // Run debate asynchronously with proper error handling
      // IMPORTANT: Pass profile.id (ctx.userId) to runDebateAsync
      runDebateAsync(debate.id, ctx.userId, input.question, input.context, input.mode).catch(
        (error: unknown) => {
          logger.error(
            'Error running debate from create',
            error instanceof Error ? error : new Error(String(error)),
            { debateId: debate.id }
          )
        }
      )

      return debate
    }),

  /**
   * Delete debate
   * Security: Only debate owner can delete (ownership boundary between admins)
   */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [existing] = await db
        .select({ id: quoorumDebates.id })
        .from(quoorumDebates)
        .where(and(eq(quoorumDebates.id, input.id), eq(quoorumDebates.userId, ctx.user.id)))

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate no encontrado' })
      }

      await db
        .delete(quoorumDebates)
        .where(and(eq(quoorumDebates.id, input.id), eq(quoorumDebates.userId, ctx.user.id)))
      return { success: true }
    }),

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Get overall analytics
   */
  analytics: adminProcedure.query(async () => {
    const [stats] = await db
      .select({
        totalDebates: count(),
        avgQuality: avg(sql<number>`(${quoorumDebates.qualityMetrics}->>'depth')::numeric`),
        avgConsensus: avg(quoorumDebates.consensusScore),
        totalCost: sum(quoorumDebates.totalCostUsd),
      })
      .from(quoorumDebates)
      .where(eq(quoorumDebates.status, 'completed'))

    return {
      totalDebates: stats?.totalDebates ?? 0,
      avgQuality: Number(stats?.avgQuality ?? 0),
      avgConsensus: Number(stats?.avgConsensus ?? 0),
      totalCost: Number(stats?.totalCost ?? 0),
    }
  }),

  /**
   * Get expert performance leaderboard
   */
  expertLeaderboard: adminProcedure.query(async () => {
    const experts = await db
      .select()
      .from(quoorumExpertPerformance)
      .orderBy(desc(quoorumExpertPerformance.avgQualityScore))
      .limit(20)

    return experts
  }),

  // ============================================
  // COMMENTS & LIKES
  // ============================================

  /**
   * Add comment to debate
   */
  addComment: protectedProcedure
    .input(
      z.object({
        debateId: z.string().uuid(),
        content: z.string().min(1).max(2000),
        parentId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [comment] = await db
        .insert(quoorumDebateComments)
        .values({
          debateId: input.debateId,
          userId: ctx.user.id,
          content: input.content,
          parentId: input.parentId,
        })
        .returning()

      // Update comment count
      await db
        .update(quoorumDebates)
        .set({ commentCount: sql`${quoorumDebates.commentCount} + 1` })
        .where(eq(quoorumDebates.id, input.debateId))

      return comment
    }),

  /**
   * Get comments for debate
   */
  getComments: protectedProcedure
    .input(z.object({ debateId: z.string().uuid() }))
    .query(async ({ input }) => {
      const comments = await db
        .select()
        .from(quoorumDebateComments)
        .where(eq(quoorumDebateComments.debateId, input.debateId))
        .orderBy(desc(quoorumDebateComments.createdAt))

      return comments
    }),

  /**
   * Toggle like on debate
   */
  toggleLike: adminProcedure
    .input(z.object({ debateId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if already liked
      const [existing] = await db
        .select()
        .from(quoorumDebateLikes)
        .where(
          and(
            eq(quoorumDebateLikes.debateId, input.debateId),
            eq(quoorumDebateLikes.userId, ctx.user.id)
          )
        )

      if (existing) {
        // Unlike
        await db
          .delete(quoorumDebateLikes)
          .where(
            and(
              eq(quoorumDebateLikes.debateId, input.debateId),
              eq(quoorumDebateLikes.userId, ctx.user.id)
            )
          )

        await db
          .update(quoorumDebates)
          .set({ likeCount: sql`${quoorumDebates.likeCount} - 1` })
          .where(eq(quoorumDebates.id, input.debateId))

        return { liked: false }
      } else {
        // Like
        await db.insert(quoorumDebateLikes).values({
          debateId: input.debateId,
          userId: ctx.user.id,
        })

        await db
          .update(quoorumDebates)
          .set({ likeCount: sql`${quoorumDebates.likeCount} + 1` })
          .where(eq(quoorumDebates.id, input.debateId))

        return { liked: true }
      }
    }),

  // ============================================
  // CUSTOM EXPERTS (Premium Feature)
  // ============================================

  /**
   * Create custom expert
   */
  createCustomExpert: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        expertise: z.array(z.string()).min(1),
        philosophy: z.string().min(10),
        approach: z.string().min(10),
        style: z.string().min(10),
        trainingDocs: z
          .array(
            z.object({
              title: z.string(),
              content: z.string(),
              source: z.string().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [expert] = await db
        .insert(quoorumCustomExperts)
        .values({
          userId: ctx.user.id,
          name: input.name,
          expertise: input.expertise,
          philosophy: input.philosophy,
          approach: input.approach,
          style: input.style,
          trainingDocs: input.trainingDocs,
        })
        .returning()

      return expert
    }),

  /**
   * List custom experts
   */
  listCustomExperts: adminProcedure.query(async ({ ctx }) => {
    const experts = await db
      .select()
      .from(quoorumCustomExperts)
      .where(and(eq(quoorumCustomExperts.userId, ctx.user.id), eq(quoorumCustomExperts.isActive, true)))
      .orderBy(desc(quoorumCustomExperts.usageCount))

    return experts
  }),

  /**
   * Update custom expert
   */
  updateCustomExpert: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        expertise: z.array(z.string()).min(1).optional(),
        philosophy: z.string().min(10).optional(),
        approach: z.string().min(10).optional(),
        style: z.string().min(10).optional(),
        trainingDocs: z
          .array(
            z.object({
              title: z.string(),
              content: z.string(),
              source: z.string().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      // Verify ownership
      const [existing] = await db
        .select({ id: quoorumCustomExperts.id })
        .from(quoorumCustomExperts)
        .where(and(eq(quoorumCustomExperts.id, id), eq(quoorumCustomExperts.userId, ctx.user.id)))

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Expert no encontrado' })
      }

      const [updated] = await db
        .update(quoorumCustomExperts)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(eq(quoorumCustomExperts.id, id), eq(quoorumCustomExperts.userId, ctx.user.id)))
        .returning()

      return updated
    }),

  /**
   * Delete custom expert (soft delete)
   */
  deleteCustomExpert: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [existing] = await db
        .select({ id: quoorumCustomExperts.id })
        .from(quoorumCustomExperts)
        .where(and(eq(quoorumCustomExperts.id, input.id), eq(quoorumCustomExperts.userId, ctx.user.id)))

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Expert no encontrado' })
      }

      // Soft delete
      await db
        .update(quoorumCustomExperts)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(quoorumCustomExperts.id, input.id), eq(quoorumCustomExperts.userId, ctx.user.id)))

      return { success: true }
    }),

  // ============================================
  // TEMPLATES (Industry-Specific)
  // ============================================

  /**
   * Create debate template
   */
  createTemplate: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        industry: z.string().optional(),
        category: z.string().optional(),
        questionTemplate: z.string().min(10),
        suggestedExperts: z.array(z.string()).optional(),
        defaultContext: z
          .object({
            constraints: z.array(z.string()).optional(),
            background: z.string().optional(),
          })
          .optional(),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [template] = await db
        .insert(quoorumDebateTemplates)
        .values({
          ...input,
          createdBy: ctx.user.id,
        })
        .returning()

      return template
    }),

  /**
   * List templates
   */
  listTemplates: adminProcedure
    .input(
      z.object({
        industry: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        or(eq(quoorumDebateTemplates.isPublic, true), eq(quoorumDebateTemplates.createdBy, ctx.user.id)),
      ]

      if (input.industry) {
        conditions.push(eq(quoorumDebateTemplates.industry, input.industry))
      }
      if (input.category) {
        conditions.push(eq(quoorumDebateTemplates.category, input.category))
      }

      const templates = await db
        .select()
        .from(quoorumDebateTemplates)
        .where(and(...conditions))
        .orderBy(desc(quoorumDebateTemplates.usageCount))

      return templates
    }),

  // ============================================
  // SHARING
  // ============================================

  /**
   * Generate share link for debate
   */
  generateShareLink: adminProcedure
    .input(z.object({ debateId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [existing] = await db
        .select({ id: quoorumDebates.id })
        .from(quoorumDebates)
        .where(and(eq(quoorumDebates.id, input.debateId), eq(quoorumDebates.userId, ctx.user.id)))

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate no encontrado' })
      }

      // Generate random token
      const shareToken =
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      await db
        .update(quoorumDebates)
        .set({ shareToken, visibility: 'public' })
        .where(and(eq(quoorumDebates.id, input.debateId), eq(quoorumDebates.userId, ctx.user.id)))

      return { shareToken, url: `/quoorum/shared/${shareToken}` }
    }),

  /**
   * Get debate by share token (public access)
   */
  getByShareToken: protectedProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const [debate] = await db
        .select()
        .from(quoorumDebates)
        .where(and(eq(quoorumDebates.shareToken, input.token), eq(quoorumDebates.visibility, 'public')))

      if (!debate) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate no encontrado o no público' })
      }

      return debate
    }),

  /**
   * Start debate execution
   */
  start: adminProcedure
    .input(z.object({ debateId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [debate] = await db
        .select()
        .from(quoorumDebates)
        .where(and(eq(quoorumDebates.id, input.debateId), eq(quoorumDebates.userId, ctx.user.id)))

      if (!debate) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate no encontrado' })
      }

      if (debate.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'El debate ya fue iniciado' })
      }

      // Update status to in_progress
      await db
        .update(quoorumDebates)
        .set({ status: 'in_progress' })
        .where(and(eq(quoorumDebates.id, input.debateId), eq(quoorumDebates.userId, ctx.user.id)))

      // Run debate asynchronously with userId for security
      runDebateAsync(
        input.debateId,
        ctx.user.id,
        debate.question,
        (debate.context as DebateContext | null) ?? undefined,
        debate.mode
      ).catch((error: unknown) => {
        logger.error(
          'Error running debate',
          error instanceof Error ? error : new Error(String(error)),
          {
            debateId: input.debateId,
          }
        )
      })

      return { success: true, debateId: input.debateId }
    }),

  /**
   * Cancel debate
   */
  cancel: adminProcedure
    .input(z.object({ debateId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [existing] = await db
        .select({ id: quoorumDebates.id })
        .from(quoorumDebates)
        .where(and(eq(quoorumDebates.id, input.debateId), eq(quoorumDebates.userId, ctx.user.id)))

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate no encontrado' })
      }

      await db
        .update(quoorumDebates)
        .set({ status: 'cancelled', completedAt: new Date() })
        .where(and(eq(quoorumDebates.id, input.debateId), eq(quoorumDebates.userId, ctx.user.id)))

      return { success: true }
    }),

  /**
   * Export debate to PDF
   * TEMPORARILY DISABLED: Module dependency issue with html-pdf-node
   */
  exportPDF: adminProcedure
    .input(z.object({ debateId: z.string().uuid() }))
    .mutation(async ({ input: _input }) => {
      // const [debate] = await db
      //   .select()
      //   .from(quoorumDebates)
      //   .where(eq(quoorumDebates.id, input.debateId))

      // if (!debate) {
      //   throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate no encontrado' })
      // }

      // // Generate PDF
      // const { generateDebatePDF } = await import("@quoorum/quoorum/pdf-export')
      // const debateResult = {
      //   sessionId: debate.id,
      //   question: debate.question,
      //   consensusScore: debate.consensusScore ?? 0,
      //   rounds: (debate.rounds as DebateRound[] | null) ?? [],
      //   finalRanking: (debate.finalRanking as RankingOption[] | null)?.map(r => ({
      //     option: r.option,
      //     score: r.score,
      //     reasoning: r.reasoning,
      //   })) ?? [],
      //   experts: (debate.experts as DebateExpert[] | null)?.map(e => ({
      //     id: e.id,
      //     name: e.name,
      //     specializations: e.expertise,
      //   })) ?? [],
      //   qualityMetrics: (debate.qualityMetrics as QualityMetrics | null) ?? { depth: 0, diversity: 0, originality: 0 },
      //   interventions: (debate.interventions as Intervention[] | null) ?? [],
      // }
      // const experts = (debate.experts as DebateExpert[] | null)?.map(e => ({
      //   id: e.id,
      //   name: e.name,
      //   role: 'expert',
      //   persona: '',
      //   archetype: '',
      //   specializations: e.expertise,
      //   communicationStyle: {},
      //   decisionBias: {},
      //   cognitiveProfile: {},
      // })) ?? []
      // const pdfBuffer = await generateDebatePDF(debateResult as any, experts as any, {})

      // // Convert buffer to base64 for return
      // return { pdf: pdfBuffer.toString('base64') }

      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Exportación PDF temporalmente deshabilitada. Contacta soporte.',
      })
    }),

  // ============================================================================
  // AI ASSISTANT ENDPOINTS
  // ============================================================================

  /**
   * Refine question with AI
   * ⚠️ EXPENSIVE OPERATION - Uses adminWithRateLimitProcedure
   */
  refineQuestion: adminWithRateLimitProcedure
    .input(z.object({ question: z.string() }))
    .mutation(async ({ input }) => {
      const { AIAssistant } = await import("@quoorum/quoorum/ai-assistant")
      return AIAssistant.refineQuestion(input.question)
    }),

  /**
   * Suggest experts for question
   * ⚠️ EXPENSIVE OPERATION - Uses adminWithRateLimitProcedure
   */
  suggestExperts: adminWithRateLimitProcedure
    .input(z.object({ question: z.string() }))
    .mutation(async ({ input }) => {
      const { AIAssistant } = await import("@quoorum/quoorum/ai-assistant")
      return AIAssistant.suggestExperts(input.question)
    }),

  /**
   * Extract insights from debate
   * ⚠️ EXPENSIVE OPERATION - Uses adminWithRateLimitProcedure
   */
  extractInsights: adminWithRateLimitProcedure
    .input(z.object({ debateId: z.string() }))
    .query(async ({ input }) => {
      const { AIAssistant } = await import("@quoorum/quoorum/ai-assistant")
      return AIAssistant.extractInsights(input.debateId)
    }),

  /**
   * Generate smart summary
   * ⚠️ EXPENSIVE OPERATION - Uses adminWithRateLimitProcedure
   */
  generateSummary: adminWithRateLimitProcedure
    .input(z.object({ debateId: z.string() }))
    .query(async ({ input }) => {
      const { AIAssistant } = await import("@quoorum/quoorum/ai-assistant")
      return AIAssistant.generateSmartSummary(input.debateId)
    }),

  // ============================================================================
  // SUB-ROUTERS (for frontend compatibility)
  // ============================================================================

  /**
   * Comments sub-router
   */
  comments: router({
    /**
     * List comments for a debate (alias for getComments)
     */
    list: adminProcedure
      .input(z.object({ debateId: z.string().uuid() }))
      .query(async ({ input }) => {
        const comments = await db
          .select({
            id: quoorumDebateComments.id,
            debateId: quoorumDebateComments.debateId,
            userId: quoorumDebateComments.userId,
            content: quoorumDebateComments.content,
            parentId: quoorumDebateComments.parentId,
            createdAt: quoorumDebateComments.createdAt,
            updatedAt: quoorumDebateComments.updatedAt,
            authorName: profiles.fullName,
            authorAvatar: profiles.avatarUrl,
          })
          .from(quoorumDebateComments)
          .innerJoin(profiles, eq(quoorumDebateComments.userId, profiles.id))
          .where(eq(quoorumDebateComments.debateId, input.debateId))
          .orderBy(desc(quoorumDebateComments.createdAt))

        return comments.map((c) => ({
          id: c.id,
          debateId: c.debateId,
          userId: c.userId,
          content: c.content,
          parentId: c.parentId,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          author: {
            name: c.authorName || 'Unknown',
            avatar: c.authorAvatar || '',
          },
          mentions: [] as string[],
        }))
      }),

    /**
     * Create comment for a debate (alias for addComment)
     */
    create: adminProcedure
      .input(
        z.object({
          debateId: z.string().uuid(),
          content: z.string().min(1).max(2000),
          parentId: z.string().uuid().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [comment] = await db
          .insert(quoorumDebateComments)
          .values({
            debateId: input.debateId,
            userId: ctx.user.id,
            content: input.content,
            parentId: input.parentId,
          })
          .returning()

        // Update comment count
        await db
          .update(quoorumDebates)
          .set({ commentCount: sql`${quoorumDebates.commentCount} + 1` })
          .where(eq(quoorumDebates.id, input.debateId))

        return comment
      }),
  }),

  /**
   * Team sub-router (admin users management)
   */
  team: router({
    /**
     * List team members (admin users)
     */
    list: adminProcedure.query(async () => {
      const teamMembers = await db
        .select({
          id: adminUsers.id,
          userId: adminUsers.userId,
          roleId: adminUsers.roleId,
          roleName: adminRoles.name,
          isActive: adminUsers.isActive,
          createdAt: adminUsers.createdAt,
          name: profiles.fullName,
          avatar: profiles.avatarUrl,
        })
        .from(adminUsers)
        .innerJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
        .innerJoin(profiles, eq(adminUsers.userId, profiles.id))
        .where(eq(adminUsers.isActive, true))
        .orderBy(desc(adminUsers.createdAt))

      return teamMembers
    }),
  }),
})

/**
 * Helper: Run debate asynchronously
 */
async function runDebateAsync(
  debateId: string,
  userId: string, // This is profileId (from ctx.userId)
  question: string,
  context?: {
    sources?: Array<{ type: string; content: string }>
    constraints?: string[]
    background?: string
  },
  mode?: 'static' | 'dynamic'
) {
  try {
    // ============================================================================
    // CONVERT PROFILE ID TO USERS ID (for credit transactions)
    // ============================================================================
    // IMPORTANT: userId parameter is profileId, but credit functions need users.id
    // profiles.userId references users.id, so we need to get it from the profile
    const [profile] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1)

    if (!profile) {
      logger.error('Profile not found for credit deduction', { profileId: userId, debateId })
      await db
        .update(quoorumDebates)
        .set({ 
          status: 'failed', 
          completedAt: new Date(),
          metadata: { error: 'Profile not found' }
        })
        .where(eq(quoorumDebates.id, debateId))
      return
    }

    const usersId = profile.userId // This is users.id (for credit transactions)

    // Pre-flight check: Estimate max credits needed
    // Average debate: 5 rounds * 4 agents * 500 tokens * $0.0001/token = $0.10 = 35 credits
    // Conservative estimate: 20 rounds max = $0.40 = 140 credits
    const estimatedCreditsMax = 140
    
    // ============================================================================
    // CHECK 1: Monthly Credit Limit (Plan-based limit)
    // ============================================================================
    const { checkMonthlyCreditLimit } = await import('../lib/monthly-credits-limit')
    const monthlyCheck = await checkMonthlyCreditLimit(usersId, estimatedCreditsMax)
    
    if (!monthlyCheck.allowed) {
      // Update debate to failed status with clear error message
      await db
        .update(quoorumDebates)
        .set({ 
          status: 'failed', 
          completedAt: new Date(),
          metadata: {
            error: 'Monthly credit limit exceeded',
            errorDetails: monthlyCheck.reason || `Monthly limit: ${monthlyCheck.limit.toLocaleString()}, Used: ${monthlyCheck.used.toLocaleString()}`,
          }
        })
        .where(and(eq(quoorumDebates.id, debateId), eq(quoorumDebates.userId, userId)))
      
      logger.error('Debate failed: Monthly credit limit exceeded', {
        debateId,
        profileId: userId,
        usersId,
        limit: monthlyCheck.limit,
        used: monthlyCheck.used,
        requested: estimatedCreditsMax,
      })
      return // Exit early, don't start debate
    }
    
    // ============================================================================
    // CHECK 2: Available Credits Balance
    // ============================================================================
    const { hasSufficientCredits } = await import('@quoorum/quoorum/billing/credit-transactions')
    const hasBalance = await hasSufficientCredits(usersId, estimatedCreditsMax)
    
    if (!hasBalance) {
      // Update debate to failed status with clear error message
      await db
        .update(quoorumDebates)
        .set({ 
          status: 'failed', 
          completedAt: new Date(),
          metadata: {
            error: 'Insufficient credits',
            errorDetails: `Required: ${estimatedCreditsMax} credits`,
          }
        })
        .where(and(eq(quoorumDebates.id, debateId), eq(quoorumDebates.userId, userId)))
      
      logger.error('Debate failed: Insufficient credits', {
        debateId,
        userId,
        requiredCredits: estimatedCreditsMax,
      })
      return // Exit early, don't start debate
    }

    // ============================================================================
    // ATOMIC CREDIT DEDUCTION (Pre-charge)
    // ============================================================================
    // Deduct estimated credits BEFORE starting debate execution
    const { deductCredits, refundCredits, convertUsdToCredits } = await import('@quoorum/quoorum/billing/credit-transactions')
    const deductionResult = await deductCredits(
      usersId, // Use users.id, not profileId
      estimatedCreditsMax,
      debateId,
      'debate_execution',
      `Debate execution - estimated max cost: ${estimatedCreditsMax} credits`
    )
    
    if (!deductionResult.success) {
      // Update debate to failed status
      await db
        .update(quoorumDebates)
        .set({ 
          status: 'failed', 
          completedAt: new Date(),
          metadata: {
            error: 'Failed to deduct credits',
            errorDetails: deductionResult.error ?? 'Credit deduction failed',
          }
        })
        .where(and(eq(quoorumDebates.id, debateId), eq(quoorumDebates.userId, userId)))
      
      logger.error('Debate failed: Credit deduction failed', {
        debateId,
        userId,
        error: deductionResult.error,
      })
      return // Exit early, don't start debate
    }

    // Update status to in_progress (only after credit deduction succeeds)
    await db
      .update(quoorumDebates)
      .set({ status: 'in_progress', startedAt: new Date() })
      .where(and(eq(quoorumDebates.id, debateId), eq(quoorumDebates.userId, userId)))

    // Track if refund was issued (to avoid double refund on error)
    let refundIssued = false

    try {
      // Get user tier for model selection
      const { getUserTier } = await import('../lib/user-tier')
      const userTier = await getUserTier(userId)

      // Run debate with real-time callbacks
      // Map context sources to LoadedContext format
      type ContextSourceType = 'manual' | 'internet' | 'repo'
      const loadedContext = {
        sources: (context?.sources ?? []).map((s) => ({
          type: (s.type === 'internet' || s.type === 'repo' ? s.type : 'manual') as ContextSourceType,
          content: s.content,
        })),
        combinedContext: context?.background ?? '',
      }

      const result = await runDynamicDebate({
      sessionId: debateId,
      question,
      context: loadedContext,
      forceMode: mode === 'static' ? 'static' : 'dynamic',
      userTier, // Pass user tier for model selection
      // Real-time callbacks for WebSocket broadcasting
      onRoundComplete: async (round) => {
        try {
          const { broadcastDebateUpdate } = await import("@quoorum/quoorum/websocket-server")
          broadcastDebateUpdate({
            debateId,
            type: 'round_complete',
            payload: round,
          })
        } catch {
          // WebSocket not available, that's ok
        }
      },
      onQualityCheck: async (quality) => {
        try {
          const { broadcastDebateUpdate } = await import("@quoorum/quoorum/websocket-server")
          broadcastDebateUpdate({
            debateId,
            type: 'quality_check',
            payload: quality,
          })
        } catch {
          // WebSocket not available, that's ok
        }
      },
      onIntervention: async (intervention) => {
        try {
          const { broadcastDebateUpdate } = await import("@quoorum/quoorum/websocket-server")
          broadcastDebateUpdate({
            debateId,
            type: 'intervention',
            payload: intervention,
          })
        } catch {
          // WebSocket not available, that's ok
        }
      },
    })

    // ============================================================================
    // CALCULATE ACTUAL CREDITS USED & REFUND DIFFERENCE
    // ============================================================================
    const actualCreditsUsed = convertUsdToCredits(result.totalCostUsd)
    const creditsToRefund = estimatedCreditsMax - actualCreditsUsed

    if (creditsToRefund > 0) {
      const refundResult = await refundCredits(
        usersId, // Use users.id, not profileId
        creditsToRefund,
        debateId,
        'refund',
        'Refund unused credits after debate completion'
      )
      refundIssued = refundResult.success
      
      if (refundResult.success) {
        logger.info('Credits refunded after debate completion', {
          debateId,
          userId,
          refunded: creditsToRefund,
          actualUsed: actualCreditsUsed,
          estimated: estimatedCreditsMax,
        })
      }
    }

    // ============================================================================
    // UPDATE MONTHLY USAGE TRACKING
    // ============================================================================
    const { updateMonthlyUsage } = await import('../lib/monthly-credits-limit')
    await updateMonthlyUsage(
      userId,
      actualCreditsUsed,
      result.totalCostUsd,
      result.rounds.reduce((sum, round) => 
        sum + (round.messages.reduce((msgSum, msg) => msgSum + (msg.tokensUsed || 0), 0)), 0
      )
    )

    // Map result types to database types
    const mappedExperts = result.experts?.map((e) => ({
      id: e.id,
      name: e.name,
      expertise: e.specializations ?? [],
      matchScore: undefined,
    }))

    const mappedRanking = result.finalRanking?.map((r) => ({
      option: r.option,
      score: r.score ?? 0,
      reasoning: r.reasoning,
    }))

    // Update debate with results
    await db
      .update(quoorumDebates)
      .set({
        status: 'completed',
        completedAt: new Date(),
        consensusScore: result.consensusScore,
        totalRounds: result.rounds.length,
        totalCostUsd: calculateDebateCost(result as unknown as DebateResult),
        totalCreditsUsed: actualCreditsUsed, // Actual credits consumed (calculated from USD cost)
        costsByProvider: result.costsByProvider, // Cost breakdown by provider
        themeId: result.themeId, // Narrative theme used (e.g., 'greek-mythology', 'education', 'generic')
        themeConfidence: result.themeConfidence, // Theme selection confidence score (0-1)
        finalRanking: mappedRanking,
        rounds: result.rounds,
        experts: mappedExperts,
        qualityMetrics: result.qualityMetrics,
        interventions: result.interventions,
      })
      .where(and(eq(quoorumDebates.id, debateId), eq(quoorumDebates.userId, userId)))

    // Update expert performance
    if (result.experts) {
      for (const expert of result.experts) {
        await updateExpertPerformance(expert.id, result as unknown as DebateResult)
      }
    }

    // Trigger completion notification
    try {
      await inngest.send({
        name: 'quoorum/debate.completed',
        data: { debateId, userId },
      })
    } catch (error) {
      logger.error('Failed to send debate completion event', error instanceof Error ? error : new Error(String(error)), { debateId, userId })
    }
    } catch (error) {
      // Error running debate
      await db
        .update(quoorumDebates)
        .set({ status: 'failed', completedAt: new Date() })
        .where(and(eq(quoorumDebates.id, debateId), eq(quoorumDebates.userId, userId)))
    }
  } catch (error) {
    // Outer catch: handle any errors in credit check or other setup
    logger.error('Debate async execution failed', error instanceof Error ? error : new Error(String(error)), {
      debateId,
      userId,
    })
    await db
      .update(quoorumDebates)
      .set({
        status: 'failed',
        completedAt: new Date(),
        metadata: {
          error: 'Unexpected error',
          errorDetails: error instanceof Error ? error.message : String(error),
        }
      })
      .where(and(eq(quoorumDebates.id, debateId), eq(quoorumDebates.userId, userId)))
  }
}

/**
 * Helper: Calculate debate cost
 */
function calculateDebateCost(result: DebateResult): number {
  // Estimate cost based on:
  // - Number of rounds
  // - Number of experts
  // - Average message length
  // - Model used (assume GPT-4 pricing: $0.03/1K input tokens, $0.06/1K output tokens)

  const rounds = result.rounds?.length ?? 0
  const experts = result.experts?.length ?? 4
  const avgMessageLength = 500 // characters
  const avgTokens = avgMessageLength / 4 // rough estimate: 1 token ≈ 4 characters

  // Input tokens: question + context + previous messages
  const inputTokensPerRound = avgTokens * experts * 2 // context + previous messages
  const outputTokensPerRound = avgTokens * experts // responses

  const totalInputTokens = inputTokensPerRound * rounds
  const totalOutputTokens = outputTokensPerRound * rounds

  const inputCost = (totalInputTokens / 1000) * 0.03
  const outputCost = (totalOutputTokens / 1000) * 0.06

  return Number((inputCost + outputCost).toFixed(4))
}

/**
 * Helper: Update expert performance metrics
 */
async function updateExpertPerformance(expertId: string, result: DebateResult): Promise<void> {
  // Get or create expert performance record
  const [existing] = await db
    .select()
    .from(quoorumExpertPerformance)
    .where(eq(quoorumExpertPerformance.expertId, expertId))

  if (existing) {
    // Update existing
    await db
      .update(quoorumExpertPerformance)
      .set({
        totalDebates: existing.totalDebates + 1,
        avgQualityScore: result.qualityMetrics?.depth ?? existing.avgQualityScore,
        avgConsensusScore: result.consensusScore ?? existing.avgConsensusScore,
        updatedAt: new Date(),
      })
      .where(eq(quoorumExpertPerformance.expertId, expertId))
  } else {
    // Create new
    await db.insert(quoorumExpertPerformance).values({
      expertId,
      totalDebates: 1,
      avgQualityScore: result.qualityMetrics?.depth ?? 0,
      avgConsensusScore: result.consensusScore ?? 0,
    })
  }
}
