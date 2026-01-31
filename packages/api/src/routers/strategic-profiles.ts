/**
 * Strategic Intelligence Profiles Router
 *
 * Unified API for managing all profile types:
 * - Experts, Professionals, Roles, ICP, Buyer Personas
 */

import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../trpc'
import { db } from '@quoorum/db'
import {
  strategicProfiles,
  profileRagDocuments,
  strategicProfileVersions,
  profileRelationships,
  type ProfileType,
  type ToneStyle,
  type MaturityLevel,
  type ContextRelevance,
  type RelationshipType,
} from '@quoorum/db/schema'
import { eq, and, desc, sql, inArray, or, like, ilike } from 'drizzle-orm'
import { logger } from '../lib/logger'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const aiConfigSchema = z.object({
  systemPrompt: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  responseFormat: z.enum(['text', 'json', 'structured']).optional(),
  tools: z.array(z.string()).optional(),
  fallbackModel: z.string().optional(),
})

const firmographicsSchema = z.object({
  employeeCount: z.string().optional(),
  revenue: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  triggerEvents: z.array(z.string()).optional(),
  governance: z
    .object({
      gdpr: z.boolean().optional(),
      iso42001: z.boolean().optional(),
      soc2: z.boolean().optional(),
      auditTrail: z.string().optional(),
    })
    .optional(),
  geographies: z.array(z.string()).optional(),
  fundingStage: z.string().optional(),
})

const psychographicsSchema = z.object({
  jobsToBeDone: z.string().optional(),
  motivations: z.array(z.string()).optional(),
  barriers: z.array(z.string()).optional(),
  channels: z.array(z.string()).optional(),
  professionalProfile: z
    .object({
      role: z.string().optional(),
      yearsExperience: z.number().optional(),
      responsibilities: z.array(z.string()).optional(),
      reportingStructure: z.string().optional(),
    })
    .optional(),
  decisionProcess: z
    .object({
      timeframe: z.string().optional(),
      stakeholders: z.array(z.string()).optional(),
      budget: z.string().optional(),
    })
    .optional(),
})

// ============================================================================
// ROUTER
// ============================================================================

export const strategicProfilesRouter = router({
  /**
   * List profiles with advanced filtering
   */
  list: protectedProcedure
    .input(
      z
        .object({
          type: z
            .enum(['expert', 'professional', 'role', 'icp', 'buyer_persona'])
            .optional(),
          category: z.string().optional(),
          industries: z.array(z.string()).optional(),
          tags: z.array(z.string()).optional(),
          search: z.string().optional(),
          isGlobal: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
          companyId: z.string().uuid().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        const filters = [eq(strategicProfiles.isActive, true)]

        // Type filter
        if (input?.type) {
          filters.push(eq(strategicProfiles.type, input.type))
        }

        // Category filter
        if (input?.category) {
          filters.push(eq(strategicProfiles.category, input.category))
        }

        // Global/Company filter
        if (input?.isGlobal !== undefined) {
          filters.push(eq(strategicProfiles.isGlobal, input.isGlobal))
        }

        if (input?.isFeatured) {
          filters.push(eq(strategicProfiles.isFeatured, true))
        }

        if (input?.companyId) {
          filters.push(eq(strategicProfiles.companyId, input.companyId))
        } else if (!input?.isGlobal) {
          // User's own profiles
          filters.push(eq(strategicProfiles.userId, ctx.userId))
        }

        // Search
        if (input?.search) {
          filters.push(
            or(
              ilike(strategicProfiles.name, `%${input.search}%`),
              ilike(strategicProfiles.description, `%${input.search}%`)
            )!
          )
        }

        const profiles = await db
          .select()
          .from(strategicProfiles)
          .where(and(...filters))
          .orderBy(
            desc(strategicProfiles.isFeatured),
            desc(strategicProfiles.usageCount)
          )
          .limit(input?.limit || 50)
          .offset(input?.offset || 0)

        return profiles
      } catch (error) {
        logger.error('[strategicProfiles.list] Failed', { error })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list profiles',
        })
      }
    }),

  /**
   * Get profile by ID or slug
   */
  get: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        slug: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        if (!input.id && !input.slug) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Must provide either id or slug',
          })
        }

        const profile = await db.query.strategicProfiles.findFirst({
          where: input.id
            ? eq(strategicProfiles.id, input.id)
            : eq(strategicProfiles.slug, input.slug!),
          with: {
            ragDocuments: {
              with: {
                document: true,
              },
            },
            parentProfile: true,
            childProfiles: true,
          },
        })

        if (!profile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Profile not found',
          })
        }

        // Check access
        if (
          !profile.isGlobal &&
          profile.userId !== ctx.userId &&
          profile.companyId !== ctx.companyId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No access to this profile',
          })
        }

        return profile
      } catch (error) {
        logger.error('[strategicProfiles.get] Failed', { error })

        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get profile',
        })
      }
    }),

  /**
   * Create new profile
   */
  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(['expert', 'professional', 'role', 'icp', 'buyer_persona']),
        name: z.string().min(1).max(255),
        slug: z.string().min(1).max(100),
        title: z.string().max(500).optional(),
        description: z.string().optional(),
        category: z.string().max(100).optional(),
        specialization: z.string().max(255).optional(),

        // Behavioral
        objective: z.string().optional(),
        toneStyles: z
          .array(
            z.enum([
              'analytical',
              'skeptical',
              'optimistic',
              'pragmatic',
              'visionary',
              'direct',
              'empathetic',
              'assertive',
            ])
          )
          .optional(),
        autonomyLevel: z.number().min(1).max(10).optional(),
        behaviorRules: z.string().optional(),

        // Knowledge
        expertiseAreas: z.array(z.string()).optional(),
        industries: z.array(z.string()).optional(),
        maturityLevel: z
          .enum(['startup', 'growth', 'enterprise', 'legacy'])
          .optional(),
        biasesToMitigate: z.array(z.string()).optional(),
        decisionStyle: z.string().max(50).optional(),
        successMetrics: z.array(z.string()).optional(),

        // Type-specific
        aiConfig: aiConfigSchema.optional(),
        firmographics: firmographicsSchema.optional(),
        psychographics: psychographicsSchema.optional(),

        // Relationships
        parentProfileId: z.string().uuid().optional(),

        // Settings
        isGlobal: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check slug uniqueness
        const existing = await db.query.strategicProfiles.findFirst({
          where: eq(strategicProfiles.slug, input.slug),
        })

        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Slug already exists',
          })
        }

        const [profile] = await db
          .insert(strategicProfiles)
          .values({
            ...input,
            userId: ctx.userId,
            companyId: ctx.companyId || null,
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
          })
          .returning()

        logger.info('[strategicProfiles.create] Profile created', {
          profileId: profile.id,
          type: profile.type,
        })

        return profile
      } catch (error) {
        logger.error('[strategicProfiles.create] Failed', { error })

        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create profile',
        })
      }
    }),

  /**
   * Update profile
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        aiConfig: aiConfigSchema.optional(),
        firmographics: firmographicsSchema.optional(),
        psychographics: psychographicsSchema.optional(),
        toneStyles: z.array(z.string()).optional(),
        autonomyLevel: z.number().min(1).max(10).optional(),
        expertiseAreas: z.array(z.string()).optional(),
        industries: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        changeReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, changeReason, ...updateData } = input

        // Verify ownership
        const profile = await db.query.strategicProfiles.findFirst({
          where: eq(strategicProfiles.id, id),
        })

        if (!profile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Profile not found',
          })
        }

        if (
          profile.userId !== ctx.userId &&
          profile.companyId !== ctx.companyId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No access to update this profile',
          })
        }

        // Update profile (trigger will auto-create version)
        const [updated] = await db
          .update(strategicProfiles)
          .set({
            ...updateData,
            updatedBy: ctx.userId,
          })
          .where(eq(strategicProfiles.id, id))
          .returning()

        logger.info('[strategicProfiles.update] Profile updated', {
          profileId: id,
          changeReason,
        })

        return updated
      } catch (error) {
        logger.error('[strategicProfiles.update] Failed', { error })

        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        })
      }
    }),

  /**
   * Delete profile
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const profile = await db.query.strategicProfiles.findFirst({
          where: eq(strategicProfiles.id, input.id),
        })

        if (!profile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Profile not found',
          })
        }

        if (
          profile.userId !== ctx.userId &&
          profile.companyId !== ctx.companyId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No access to delete this profile',
          })
        }

        await db
          .delete(strategicProfiles)
          .where(eq(strategicProfiles.id, input.id))

        logger.info('[strategicProfiles.delete] Profile deleted', {
          profileId: input.id,
        })

        return { success: true }
      } catch (error) {
        logger.error('[strategicProfiles.delete] Failed', { error })

        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete profile',
        })
      }
    }),

  /**
   * Link RAG document to profile
   */
  linkDocument: protectedProcedure
    .input(
      z.object({
        profileId: z.string().uuid(),
        documentId: z.string().uuid(),
        relevance: z
          .enum([
            'core',
            'supplementary',
            'case_study',
            'industry_data',
            'compliance',
          ])
          .default('supplementary'),
        importanceScore: z.number().min(0).max(1).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [link] = await db
          .insert(profileRagDocuments)
          .values({
            ...input,
            addedBy: ctx.userId,
          })
          .returning()

        return link
      } catch (error) {
        logger.error('[strategicProfiles.linkDocument] Failed', { error })

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to link document',
        })
      }
    }),

  /**
   * Get profile versions (audit trail)
   */
  getVersions: protectedProcedure
    .input(z.object({ profileId: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const versions = await db
          .select()
          .from(strategicProfileVersions)
          .where(eq(strategicProfileVersions.profileId, input.profileId))
          .orderBy(desc(strategicProfileVersions.version))

        return versions
      } catch (error) {
        logger.error('[strategicProfiles.getVersions] Failed', { error })

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get versions',
        })
      }
    }),

  /**
   * Get stats by type
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const stats = await db.execute(sql`
        SELECT
          type,
          COUNT(*) as count,
          AVG(usage_count) as avg_usage,
          AVG(avg_rating) as avg_rating
        FROM strategic_profiles
        WHERE is_active = true
          AND (user_id = ${ctx.userId} OR company_id = ${ctx.companyId} OR is_global = true)
        GROUP BY type
      `)

      return stats
    } catch (error) {
      logger.error('[strategicProfiles.getStats] Failed', { error })

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get stats',
      })
    }
  }),
})
