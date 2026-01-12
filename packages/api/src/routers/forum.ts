/**
 * Forum Router - Dynamic Expert System
 *
 * Handles all Forum operations: debates, analytics, learning system,
 * custom experts, templates, sharing, and more.
 */

import { TRPCError } from '@trpc/server'
import { db } from '@quoorum/db'
import {
  adminRoles,
  adminUsers,
  forumCustomExperts,
  forumDebateComments,
  forumDebateLikes,
  forumDebates,
  forumDebateTemplates,
  forumExpertPerformance,
  profiles,
} from '@quoorum/db/schema'
import { runDynamicDebate } from '@quoorum/forum'
import { and, avg, count, desc, eq, like, or, sql, sum } from 'drizzle-orm'
import { z } from 'zod'
import { logger } from '../lib/logger'
import { protectedProcedure, router, expensiveRateLimitedProcedure } from '../trpc'

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
 * Admin middleware - Only admins can access Forum
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
 * Admin procedure with rate limiting for expensive operations (AI, Forum debates)
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
 * Forum Router
 */
export const forumRouter = router({
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

      let query = db.select().from(forumDebates)

      // Filters
      const conditions = []
      if (status) {
        conditions.push(eq(forumDebates.status, status))
      }
      if (search) {
        conditions.push(like(forumDebates.question, `%${search}%`))
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query
      }

      // Ordering
      switch (orderBy) {
        case 'quality':
          query = query.orderBy(desc(forumDebates.qualityMetrics)) as typeof query
          break
        case 'consensus':
          query = query.orderBy(desc(forumDebates.consensusScore)) as typeof query
          break
        case 'cost':
          query = query.orderBy(desc(forumDebates.totalCostUsd)) as typeof query
          break
        default:
          query = query.orderBy(desc(forumDebates.createdAt)) as typeof query
      }

      const debates = await query.limit(limit).offset(offset)

      return debates
    }),

  /**
   * Get debate by ID
   */
  get: adminProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const [debate] = await db.select().from(forumDebates).where(eq(forumDebates.id, input.id))

    if (!debate) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate no encontrado' })
    }

    // Increment view count
    await db
      .update(forumDebates)
      .set({ viewCount: sql`${forumDebates.viewCount} + 1` })
      .where(eq(forumDebates.id, input.id))

    return debate
  }),

  /**
   * Create and run new debate
   * ⚠️ EXPENSIVE OPERATION - Uses adminWithRateLimitProcedure
   */
  create: adminWithRateLimitProcedure
    .input(
      z.object({
        question: z.string().min(10).max(1000),
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
      const [debate] = await db
        .insert(forumDebates)
        .values({
          userId: ctx.user.id,
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
      runDebateAsync(debate.id, ctx.user.id, input.question, input.context, input.mode).catch(
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
        .select({ id: forumDebates.id })
        .from(forumDebates)
        .where(and(eq(forumDebates.id, input.id), eq(forumDebates.userId, ctx.user.id)))

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate no encontrado' })
      }

      await db
        .delete(forumDebates)
        .where(and(eq(forumDebates.id, input.id), eq(forumDebates.userId, ctx.user.id)))
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
        avgQuality: avg(sql<number>`(${forumDebates.qualityMetrics}->>'depth')::numeric`),
        avgConsensus: avg(forumDebates.consensusScore),
        totalCost: sum(forumDebates.totalCostUsd),
      })
      .from(forumDebates)
      .where(eq(forumDebates.status, 'completed'))

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
      .from(forumExpertPerformance)
      .orderBy(desc(forumExpertPerformance.avgQualityScore))
      .limit(20)

    return experts
  }),

  // ============================================
  // COMMENTS & LIKES
  // ============================================

  /**
   * Add comment to debate
   */
  addComment: adminProcedure
    .input(
      z.object({
        debateId: z.string().uuid(),
        content: z.string().min(1).max(2000),
        parentId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [comment] = await db
        .insert(forumDebateComments)
        .values({
          debateId: input.debateId,
          userId: ctx.user.id,
          content: input.content,
          parentId: input.parentId,
        })
        .returning()

      // Update comment count
      await db
        .update(forumDebates)
        .set({ commentCount: sql`${forumDebates.commentCount} + 1` })
        .where(eq(forumDebates.id, input.debateId))

      return comment
    }),

  /**
   * Get comments for debate
   */
  getComments: adminProcedure
    .input(z.object({ debateId: z.string().uuid() }))
    .query(async ({ input }) => {
      const comments = await db
        .select()
        .from(forumDebateComments)
        .where(eq(forumDebateComments.debateId, input.debateId))
        .orderBy(desc(forumDebateComments.createdAt))

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
        .from(forumDebateLikes)
        .where(
          and(
            eq(forumDebateLikes.debateId, input.debateId),
            eq(forumDebateLikes.userId, ctx.user.id)
          )
        )

      if (existing) {
        // Unlike
        await db
          .delete(forumDebateLikes)
          .where(
            and(
              eq(forumDebateLikes.debateId, input.debateId),
              eq(forumDebateLikes.userId, ctx.user.id)
            )
          )

        await db
          .update(forumDebates)
          .set({ likeCount: sql`${forumDebates.likeCount} - 1` })
          .where(eq(forumDebates.id, input.debateId))

        return { liked: false }
      } else {
        // Like
        await db.insert(forumDebateLikes).values({
          debateId: input.debateId,
          userId: ctx.user.id,
        })

        await db
          .update(forumDebates)
          .set({ likeCount: sql`${forumDebates.likeCount} + 1` })
          .where(eq(forumDebates.id, input.debateId))

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
        .insert(forumCustomExperts)
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
      .from(forumCustomExperts)
      .where(and(eq(forumCustomExperts.userId, ctx.user.id), eq(forumCustomExperts.isActive, true)))
      .orderBy(desc(forumCustomExperts.usageCount))

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
        .select({ id: forumCustomExperts.id })
        .from(forumCustomExperts)
        .where(and(eq(forumCustomExperts.id, id), eq(forumCustomExperts.userId, ctx.user.id)))

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Expert no encontrado' })
      }

      const [updated] = await db
        .update(forumCustomExperts)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(eq(forumCustomExperts.id, id), eq(forumCustomExperts.userId, ctx.user.id)))
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
        .select({ id: forumCustomExperts.id })
        .from(forumCustomExperts)
        .where(and(eq(forumCustomExperts.id, input.id), eq(forumCustomExperts.userId, ctx.user.id)))

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Expert no encontrado' })
      }

      // Soft delete
      await db
        .update(forumCustomExperts)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(forumCustomExperts.id, input.id), eq(forumCustomExperts.userId, ctx.user.id)))

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
        .insert(forumDebateTemplates)
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
        or(eq(forumDebateTemplates.isPublic, true), eq(forumDebateTemplates.createdBy, ctx.user.id)),
      ]

      if (input.industry) {
        conditions.push(eq(forumDebateTemplates.industry, input.industry))
      }
      if (input.category) {
        conditions.push(eq(forumDebateTemplates.category, input.category))
      }

      const templates = await db
        .select()
        .from(forumDebateTemplates)
        .where(and(...conditions))
        .orderBy(desc(forumDebateTemplates.usageCount))

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
        .select({ id: forumDebates.id })
        .from(forumDebates)
        .where(and(eq(forumDebates.id, input.debateId), eq(forumDebates.userId, ctx.user.id)))

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate no encontrado' })
      }

      // Generate random token
      const shareToken =
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      await db
        .update(forumDebates)
        .set({ shareToken, visibility: 'public' })
        .where(and(eq(forumDebates.id, input.debateId), eq(forumDebates.userId, ctx.user.id)))

      return { shareToken, url: `/forum/shared/${shareToken}` }
    }),

  /**
   * Get debate by share token (public access)
   */
  getByShareToken: protectedProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const [debate] = await db
        .select()
        .from(forumDebates)
        .where(and(eq(forumDebates.shareToken, input.token), eq(forumDebates.visibility, 'public')))

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
        .from(forumDebates)
        .where(and(eq(forumDebates.id, input.debateId), eq(forumDebates.userId, ctx.user.id)))

      if (!debate) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate no encontrado' })
      }

      if (debate.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'El debate ya fue iniciado' })
      }

      // Update status to in_progress
      await db
        .update(forumDebates)
        .set({ status: 'in_progress' })
        .where(and(eq(forumDebates.id, input.debateId), eq(forumDebates.userId, ctx.user.id)))

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
        .select({ id: forumDebates.id })
        .from(forumDebates)
        .where(and(eq(forumDebates.id, input.debateId), eq(forumDebates.userId, ctx.user.id)))

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate no encontrado' })
      }

      await db
        .update(forumDebates)
        .set({ status: 'cancelled', completedAt: new Date() })
        .where(and(eq(forumDebates.id, input.debateId), eq(forumDebates.userId, ctx.user.id)))

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
      //   .from(forumDebates)
      //   .where(eq(forumDebates.id, input.debateId))

      // if (!debate) {
      //   throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate no encontrado' })
      // }

      // // Generate PDF
      // const { generateDebatePDF } = await import('@quoorum/forum/pdf-export')
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
      const { AIAssistant } = await import('@quoorum/forum/ai-assistant')
      return AIAssistant.refineQuestion(input.question)
    }),

  /**
   * Suggest experts for question
   * ⚠️ EXPENSIVE OPERATION - Uses adminWithRateLimitProcedure
   */
  suggestExperts: adminWithRateLimitProcedure
    .input(z.object({ question: z.string() }))
    .mutation(async ({ input }) => {
      const { AIAssistant } = await import('@quoorum/forum/ai-assistant')
      return AIAssistant.suggestExperts(input.question)
    }),

  /**
   * Extract insights from debate
   * ⚠️ EXPENSIVE OPERATION - Uses adminWithRateLimitProcedure
   */
  extractInsights: adminWithRateLimitProcedure
    .input(z.object({ debateId: z.string() }))
    .query(async ({ input }) => {
      const { AIAssistant } = await import('@quoorum/forum/ai-assistant')
      return AIAssistant.extractInsights(input.debateId)
    }),

  /**
   * Generate smart summary
   * ⚠️ EXPENSIVE OPERATION - Uses adminWithRateLimitProcedure
   */
  generateSummary: adminWithRateLimitProcedure
    .input(z.object({ debateId: z.string() }))
    .query(async ({ input }) => {
      const { AIAssistant } = await import('@quoorum/forum/ai-assistant')
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
            id: forumDebateComments.id,
            debateId: forumDebateComments.debateId,
            userId: forumDebateComments.userId,
            content: forumDebateComments.content,
            parentId: forumDebateComments.parentId,
            createdAt: forumDebateComments.createdAt,
            updatedAt: forumDebateComments.updatedAt,
            authorName: profiles.fullName,
            authorAvatar: profiles.avatarUrl,
          })
          .from(forumDebateComments)
          .innerJoin(profiles, eq(forumDebateComments.userId, profiles.id))
          .where(eq(forumDebateComments.debateId, input.debateId))
          .orderBy(desc(forumDebateComments.createdAt))

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
          .insert(forumDebateComments)
          .values({
            debateId: input.debateId,
            userId: ctx.user.id,
            content: input.content,
            parentId: input.parentId,
          })
          .returning()

        // Update comment count
        await db
          .update(forumDebates)
          .set({ commentCount: sql`${forumDebates.commentCount} + 1` })
          .where(eq(forumDebates.id, input.debateId))

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
  userId: string,
  question: string,
  context?: {
    sources?: Array<{ type: string; content: string }>
    constraints?: string[]
    background?: string
  },
  mode?: 'static' | 'dynamic'
) {
  try {
    // Update status to in_progress
    await db
      .update(forumDebates)
      .set({ status: 'in_progress', startedAt: new Date() })
      .where(and(eq(forumDebates.id, debateId), eq(forumDebates.userId, userId)))

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
      // Real-time callbacks for WebSocket broadcasting
      onRoundComplete: async (round) => {
        try {
          const { broadcastDebateUpdate } = await import('@quoorum/forum/websocket-server')
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
          const { broadcastDebateUpdate } = await import('@quoorum/forum/websocket-server')
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
          const { broadcastDebateUpdate } = await import('@quoorum/forum/websocket-server')
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
      .update(forumDebates)
      .set({
        status: 'completed',
        completedAt: new Date(),
        consensusScore: result.consensusScore,
        totalRounds: result.rounds.length,
        totalCostUsd: calculateDebateCost(result as unknown as DebateResult),
        finalRanking: mappedRanking,
        rounds: result.rounds,
        experts: mappedExperts,
        qualityMetrics: result.qualityMetrics,
        interventions: result.interventions,
      })
      .where(and(eq(forumDebates.id, debateId), eq(forumDebates.userId, userId)))

    // Update expert performance
    if (result.experts) {
      for (const expert of result.experts) {
        await updateExpertPerformance(expert.id, result as unknown as DebateResult)
      }
    }
  } catch (error) {
    // Error running debate
    await db
      .update(forumDebates)
      .set({ status: 'failed', completedAt: new Date() })
      .where(and(eq(forumDebates.id, debateId), eq(forumDebates.userId, userId)))
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
    .from(forumExpertPerformance)
    .where(eq(forumExpertPerformance.expertId, expertId))

  if (existing) {
    // Update existing
    await db
      .update(forumExpertPerformance)
      .set({
        totalDebates: existing.totalDebates + 1,
        avgQualityScore: result.qualityMetrics?.depth ?? existing.avgQualityScore,
        avgConsensusScore: result.consensusScore ?? existing.avgConsensusScore,
        updatedAt: new Date(),
      })
      .where(eq(forumExpertPerformance.expertId, expertId))
  } else {
    // Create new
    await db.insert(forumExpertPerformance).values({
      expertId,
      totalDebates: 1,
      avgQualityScore: result.qualityMetrics?.depth ?? 0,
      avgConsensusScore: result.consensusScore ?? 0,
    })
  }
}
