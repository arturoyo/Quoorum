/**
 * RAG Analytics Router
 *
 * Provides API for:
 * - Tracking RAG usage and performance
 * - Calculating quality scores
 * - Analytics dashboard data
 * - Document sharing with teams
 * - ROI metrics
 */

import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import {
  ragUsageAnalytics,
  ragQualityScores,
  ragDocumentPerformance,
  ragDocumentShares,
  vectorDocuments,
  quoorumDebates,
} from '@quoorum/db/schema'
import { eq, and, desc, sql, gte, lte, inArray } from 'drizzle-orm'
import { logger } from '../lib/logger'

// ============================================================================
// USAGE TRACKING
// ============================================================================

export const ragAnalyticsRouter = router({
  /**
   * Track RAG usage event
   *
   * Records usage analytics for measuring ROI
   */
  trackUsage: protectedProcedure
    .input(
      z.object({
        eventType: z.enum([
          'document_upload',
          'search',
          'debate_injection',
          'manual_search',
        ]),
        debateId: z.string().uuid().optional(),
        documentId: z.string().uuid().optional(),
        queryText: z.string().optional(),
        resultsCount: z.number().optional(),
        avgSimilarity: z.number().optional(),
        searchDurationMs: z.number().optional(),
        tokensUsed: z.number().optional(),
        estimatedCost: z.number().optional(),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [analytic] = await db
          .insert(ragUsageAnalytics)
          .values({
            userId: ctx.userId,
            companyId: ctx.companyId || null,
            eventType: input.eventType,
            debateId: input.debateId || null,
            documentId: input.documentId || null,
            queryText: input.queryText || null,
            resultsCount: input.resultsCount || null,
            avgSimilarity: input.avgSimilarity || null,
            searchDurationMs: input.searchDurationMs || null,
            tokensUsed: input.tokensUsed || 0,
            estimatedCost: input.estimatedCost || 0,
            metadata: input.metadata || {},
          })
          .returning()

        return { success: true, analyticId: analytic.id }
      } catch (error) {
        logger.error('[ragAnalytics.trackUsage] Failed to track usage', {
          error: error instanceof Error ? error.message : String(error),
        })

        // Don't throw - analytics failures shouldn't break main flow
        return { success: false }
      }
    }),

  /**
   * Record user feedback on RAG result
   */
  recordFeedback: protectedProcedure
    .input(
      z.object({
        analyticId: z.string().uuid(),
        clickedResult: z.boolean().optional(),
        rating: z.number().min(1).max(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await db
          .update(ragUsageAnalytics)
          .set({
            userClickedResult: input.clickedResult,
            userRating: input.rating,
          })
          .where(
            and(
              eq(ragUsageAnalytics.id, input.analyticId),
              eq(ragUsageAnalytics.userId, ctx.userId)
            )
          )

        return { success: true }
      } catch (error) {
        logger.error('[ragAnalytics.recordFeedback] Failed', { error })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to record feedback',
        })
      }
    }),

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  /**
   * Calculate quality score for a debate's RAG usage
   */
  calculateQualityScore: protectedProcedure
    .input(
      z.object({
        debateId: z.string().uuid(),
        userSatisfaction: z.number().min(1).max(5).optional(),
        userFoundHelpful: z.boolean().optional(),
        userComments: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get debate info
        const debate = await db.query.quoorumDebates.findFirst({
          where: and(
            eq(quoorumDebates.id, input.debateId),
            eq(quoorumDebates.userId, ctx.userId)
          ),
        })

        if (!debate) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Debate not found',
          })
        }

        // Calculate metrics from RAG usage
        const usageStats = await db
          .select({
            sourcesUsed: sql<number>`COUNT(DISTINCT ${ragUsageAnalytics.documentId})`,
            avgSimilarity: sql<number>`AVG(${ragUsageAnalytics.avgSimilarity})`,
            totalSearches: sql<number>`COUNT(*)`,
          })
          .from(ragUsageAnalytics)
          .where(
            and(
              eq(ragUsageAnalytics.debateId, input.debateId),
              eq(ragUsageAnalytics.eventType, 'debate_injection')
            )
          )
          .then((rows) => rows[0])

        // Calculate scores (0-1 scale)
        const relevanceScore = Math.min(
          (usageStats?.avgSimilarity || 0) / 0.9,
          1
        ) // Normalize to 0-1
        const usageScore = Math.min((usageStats?.sourcesUsed || 0) / 5, 1) // Max 5 sources
        const impactScore = input.userFoundHelpful ? 0.8 : 0.4 // User feedback

        // Weighted average
        const overallScore =
          relevanceScore * 0.4 + usageScore * 0.3 + impactScore * 0.3

        // Store quality score
        const [qualityScore] = await db
          .insert(ragQualityScores)
          .values({
            debateId: input.debateId,
            userId: ctx.userId,
            relevanceScore,
            usageScore,
            impactScore,
            overallScore,
            sourcesUsed: usageStats?.sourcesUsed || 0,
            sourcesCited: 0, // TODO: Implement citation tracking
            userSatisfaction: input.userSatisfaction || null,
            userFoundHelpful: input.userFoundHelpful || null,
            userComments: input.userComments || null,
            calculationMethod: 'auto',
          })
          .returning()

        return {
          qualityScoreId: qualityScore.id,
          relevanceScore,
          usageScore,
          impactScore,
          overallScore,
        }
      } catch (error) {
        logger.error(
          '[ragAnalytics.calculateQualityScore] Failed to calculate',
          { error }
        )

        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to calculate quality score',
        })
      }
    }),

  /**
   * Get quality scores for user's debates
   */
  getQualityScores: protectedProcedure
    .input(
      z
        .object({
          debateId: z.string().uuid().optional(),
          limit: z.number().min(1).max(100).optional().default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        const filters = [eq(ragQualityScores.userId, ctx.userId)]

        if (input?.debateId) {
          filters.push(eq(ragQualityScores.debateId, input.debateId))
        }

        const scores = await db
          .select()
          .from(ragQualityScores)
          .where(and(...filters))
          .orderBy(desc(ragQualityScores.createdAt))
          .limit(input?.limit || 20)

        return scores
      } catch (error) {
        logger.error('[ragAnalytics.getQualityScores] Failed', { error })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get quality scores',
        })
      }
    }),

  // ============================================================================
  // ANALYTICS DASHBOARD
  // ============================================================================

  /**
   * Get RAG analytics dashboard data
   */
  getDashboard: protectedProcedure
    .input(
      z
        .object({
          dateFrom: z.date().optional(),
          dateTo: z.date().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        const dateFrom = input?.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        const dateTo = input?.dateTo || new Date()

        // Overall stats
        const overallStats = await db
          .select({
            totalDocuments: sql<number>`COUNT(DISTINCT ${vectorDocuments.id})`,
            totalSearches: sql<number>`COUNT(DISTINCT CASE WHEN ${ragUsageAnalytics.eventType} = 'search' THEN ${ragUsageAnalytics.id} END)`,
            totalDebatesEnhanced: sql<number>`COUNT(DISTINCT ${ragUsageAnalytics.debateId})`,
            avgQualityScore: sql<number>`AVG(${ragQualityScores.overallScore})`,
            totalCost: sql<number>`SUM(${ragUsageAnalytics.estimatedCost})`,
          })
          .from(vectorDocuments)
          .leftJoin(
            ragUsageAnalytics,
            eq(ragUsageAnalytics.userId, ctx.userId)
          )
          .leftJoin(ragQualityScores, eq(ragQualityScores.userId, ctx.userId))
          .where(eq(vectorDocuments.userId, ctx.userId))
          .then((rows) => rows[0])

        // Daily usage trend
        const dailyUsage = await db.execute(sql`
          SELECT
            DATE(created_at) as date,
            COUNT(*) as count,
            AVG(avg_similarity) as avg_similarity
          FROM ${ragUsageAnalytics}
          WHERE user_id = ${ctx.userId}
            AND created_at >= ${dateFrom}
            AND created_at <= ${dateTo}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `)

        // Top performing documents
        const topDocuments = await db
          .select({
            documentId: vectorDocuments.id,
            fileName: vectorDocuments.fileName,
            retrievals: ragDocumentPerformance.totalRetrievals,
            avgSimilarity: ragDocumentPerformance.avgSimilarity,
            relevanceScore: ragDocumentPerformance.relevanceScore,
          })
          .from(vectorDocuments)
          .leftJoin(
            ragDocumentPerformance,
            eq(ragDocumentPerformance.documentId, vectorDocuments.id)
          )
          .where(eq(vectorDocuments.userId, ctx.userId))
          .orderBy(desc(ragDocumentPerformance.relevanceScore))
          .limit(10)

        // Recent activity
        const recentActivity = await db
          .select({
            id: ragUsageAnalytics.id,
            eventType: ragUsageAnalytics.eventType,
            queryText: ragUsageAnalytics.queryText,
            resultsCount: ragUsageAnalytics.resultsCount,
            createdAt: ragUsageAnalytics.createdAt,
          })
          .from(ragUsageAnalytics)
          .where(eq(ragUsageAnalytics.userId, ctx.userId))
          .orderBy(desc(ragUsageAnalytics.createdAt))
          .limit(20)

        return {
          overallStats,
          dailyUsage,
          topDocuments,
          recentActivity,
        }
      } catch (error) {
        logger.error('[ragAnalytics.getDashboard] Failed to get dashboard', {
          error: error instanceof Error ? error.message : String(error),
        })

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get dashboard data',
        })
      }
    }),

  /**
   * Get ROI metrics
   */
  getROI: protectedProcedure.query(async ({ ctx }) => {
    try {
      const roi = await db.execute(sql`
        SELECT
          COUNT(DISTINCT vd.id) as documents_uploaded,
          COUNT(DISTINCT rua.debate_id) as debates_enhanced,
          AVG(rqs.overall_score) as avg_quality_score,
          AVG(rqs.user_satisfaction) as avg_satisfaction,
          SUM(rua.tokens_used) as total_tokens_used,
          SUM(rua.estimated_cost) as total_cost
        FROM profiles u
        LEFT JOIN vector_documents vd ON vd.user_id = u.id
        LEFT JOIN rag_usage_analytics rua ON rua.user_id = u.id
        LEFT JOIN rag_quality_scores rqs ON rqs.user_id = u.id
        WHERE u.id = ${ctx.userId}
        GROUP BY u.id
      `)

      return roi[0] || {
        documents_uploaded: 0,
        debates_enhanced: 0,
        avg_quality_score: null,
        avg_satisfaction: null,
        total_tokens_used: 0,
        total_cost: 0,
      }
    } catch (error) {
      logger.error('[ragAnalytics.getROI] Failed', { error })
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get ROI metrics',
      })
    }
  }),

  // ============================================================================
  // DOCUMENT PERFORMANCE
  // ============================================================================

  /**
   * Get document performance metrics
   */
  getDocumentPerformance: protectedProcedure
    .input(
      z.object({
        documentId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const document = await db.query.vectorDocuments.findFirst({
          where: and(
            eq(vectorDocuments.id, input.documentId),
            eq(vectorDocuments.userId, ctx.userId)
          ),
        })

        if (!document) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Document not found',
          })
        }

        // Get or create performance record
        let performance = await db.query.ragDocumentPerformance.findFirst({
          where: eq(ragDocumentPerformance.documentId, input.documentId),
        })

        if (!performance) {
          // Create initial performance record
          const [newPerf] = await db
            .insert(ragDocumentPerformance)
            .values({
              documentId: input.documentId,
            })
            .returning()

          performance = newPerf
        }

        // Get usage history
        const usageHistory = await db
          .select({
            date: sql<string>`DATE(${ragUsageAnalytics.createdAt})`,
            searches: sql<number>`COUNT(*)`,
            avgSimilarity: sql<number>`AVG(${ragUsageAnalytics.avgSimilarity})`,
          })
          .from(ragUsageAnalytics)
          .where(eq(ragUsageAnalytics.documentId, input.documentId))
          .groupBy(sql`DATE(${ragUsageAnalytics.createdAt})`)
          .orderBy(sql`DATE(${ragUsageAnalytics.createdAt}) DESC`)
          .limit(30)

        return {
          performance,
          usageHistory,
          document,
        }
      } catch (error) {
        logger.error(
          '[ragAnalytics.getDocumentPerformance] Failed to get performance',
          { error }
        )

        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get document performance',
        })
      }
    }),

  // ============================================================================
  // DOCUMENT SHARING
  // ============================================================================

  /**
   * Share document with team member or company
   */
  shareDocument: protectedProcedure
    .input(
      z.object({
        documentId: z.string().uuid(),
        shareWithUser: z.string().uuid().optional(),
        shareWithCompany: z.string().uuid().optional(),
        canView: z.boolean().default(true),
        canEdit: z.boolean().default(false),
        canReshare: z.boolean().default(false),
        shareNote: z.string().optional(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const document = await db.query.vectorDocuments.findFirst({
          where: and(
            eq(vectorDocuments.id, input.documentId),
            eq(vectorDocuments.userId, ctx.userId)
          ),
        })

        if (!document) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Document not found',
          })
        }

        // Must share with either user or company
        if (!input.shareWithUser && !input.shareWithCompany) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Must specify shareWithUser or shareWithCompany',
          })
        }

        // Create share
        const [share] = await db
          .insert(ragDocumentShares)
          .values({
            documentId: input.documentId,
            sharedBy: ctx.userId,
            sharedWithUser: input.shareWithUser || null,
            sharedWithCompany: input.shareWithCompany || null,
            canView: input.canView,
            canEdit: input.canEdit,
            canReshare: input.canReshare,
            shareNote: input.shareNote || null,
            expiresAt: input.expiresAt || null,
          })
          .returning()

        logger.info('[ragAnalytics.shareDocument] Document shared', {
          shareId: share.id,
          documentId: input.documentId,
        })

        return share
      } catch (error) {
        logger.error('[ragAnalytics.shareDocument] Failed to share', { error })

        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to share document',
        })
      }
    }),

  /**
   * List documents shared with user
   */
  getSharedWithMe: protectedProcedure.query(async ({ ctx }) => {
    try {
      const filters = [eq(ragDocumentShares.sharedWithUser, ctx.userId)]

      if (ctx.companyId) {
        filters.push(eq(ragDocumentShares.sharedWithCompany, ctx.companyId))
      }

      const shares = await db.query.ragDocumentShares.findMany({
        where: and(...filters),
        with: {
          document: true,
          sharedBy: {
            columns: {
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: desc(ragDocumentShares.createdAt),
      })

      return shares
    } catch (error) {
      logger.error('[ragAnalytics.getSharedWithMe] Failed', { error })
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get shared documents',
      })
    }
  }),

  /**
   * Revoke document share
   */
  revokeShare: protectedProcedure
    .input(
      z.object({
        shareId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership (only share creator can revoke)
        const share = await db.query.ragDocumentShares.findFirst({
          where: and(
            eq(ragDocumentShares.id, input.shareId),
            eq(ragDocumentShares.sharedBy, ctx.userId)
          ),
        })

        if (!share) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Share not found',
          })
        }

        await db
          .delete(ragDocumentShares)
          .where(eq(ragDocumentShares.id, input.shareId))

        return { success: true }
      } catch (error) {
        logger.error('[ragAnalytics.revokeShare] Failed', { error })

        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to revoke share',
        })
      }
    }),
})
