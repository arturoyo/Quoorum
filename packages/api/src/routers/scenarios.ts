/**
 * Scenarios Router
 *
 * CRUD operations for Decision Playbooks (Escenarios de Oro)
 * Admin-only for creating/editing, public for listing active scenarios
 */

import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { eq, and, desc, isNull, or, ilike, inArray, sql } from 'drizzle-orm'
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc'
import { db } from '@quoorum/db'
import { scenarios, scenarioUsage, profiles } from '@quoorum/db'
import { logger } from '../lib/logger'
import { scenarioConfigSchema } from '@quoorum/quoorum/scenarios/types'

// ============================================
// SCHEMAS
// ============================================

const createScenarioSchema = scenarioConfigSchema.omit({ id: true, createdAt: true, updatedAt: true, usageCount: true, avgQualityScore: true })

const updateScenarioSchema = scenarioConfigSchema.partial().extend({
  id: z.string().uuid(),
})

const listScenariosSchema = z.object({
  segment: z.enum(['entrepreneur', 'sme', 'corporate']).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  minTier: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
})

// ============================================
// ROUTER
// ============================================

export const scenariosRouter = router({
  /**
   * List active scenarios (public)
   */
  list: publicProcedure
    .input(listScenariosSchema)
    .query(async ({ ctx, input }) => {
      const { segment, status, minTier, search, limit, cursor } = input

      // Base visibility: escenarios públicos y activos; si hay usuario, incluir los suyos
      const publicActive = and(
        eq(scenarios.isPublic, true),
        eq(scenarios.status, 'active')
      )

      const conditions = ctx.userId
        ? [or(publicActive, eq(scenarios.createdBy, ctx.userId))]
        : [publicActive]

      if (segment) {
        conditions.push(eq(scenarios.segment, segment))
      }

      if (status) {
        // Si no hay usuario, solo permitimos estado sobre los públicos activos; el filtro extra aplica sobre el set visible
        conditions.push(eq(scenarios.status, status))
      }

      if (minTier) {
        conditions.push(eq(scenarios.minTier, minTier))
      }

      if (search) {
        // Case-insensitive match on name or description
        conditions.push(
          or(
            ilike(scenarios.name, `%${search}%`),
            ilike(scenarios.description, `%${search}%`)
          )
        )
      }

      if (cursor) {
        conditions.push(sql`${scenarios.createdAt} < (SELECT created_at FROM scenarios WHERE id = ${cursor})`)
      }

      const results = await db
        .select()
        .from(scenarios)
        .where(and(...conditions))
        .orderBy(desc(scenarios.usageCount), desc(scenarios.createdAt))
        .limit(limit + 1)

      let nextCursor: string | undefined
      if (results.length > limit) {
        const nextItem = results.pop()
        nextCursor = nextItem?.id
      }

      return {
        items: results,
        nextCursor,
      }
    }),

  /**
   * Get scenario by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [scenario] = await db
        .select()
        .from(scenarios)
        .where(
          and(
            eq(scenarios.id, input.id),
            // Only show if public+active or user's own
            or(
              and(
                eq(scenarios.isPublic, true),
                eq(scenarios.status, 'active')
              ),
              eq(scenarios.createdBy, ctx.userId)
            )
          )
        )
        .limit(1)

      if (!scenario) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Escenario no encontrado',
        })
      }

      return scenario
    }),

  /**
   * Create scenario (admin only)
   */
  create: adminProcedure
    .input(createScenarioSchema)
    .mutation(async ({ ctx, input }) => {
      logger.info('Creating scenario', {
        userId: ctx.userId,
        name: input.name,
        segment: input.segment,
      })

      const [newScenario] = await db
        .insert(scenarios)
        .values({
          ...input,
          createdBy: ctx.userId,
        })
        .returning()

      if (!newScenario) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al crear el escenario',
        })
      }

      return newScenario
    }),

  /**
   * Update scenario (admin only, or creator)
   */
  update: protectedProcedure
    .input(updateScenarioSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Check if user is admin or creator
      const [existing] = await db
        .select({ createdBy: scenarios.createdBy })
        .from(scenarios)
        .where(eq(scenarios.id, id))
        .limit(1)

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Escenario no encontrado',
        })
      }

      // Check permissions (admin or creator)
      const isAdmin = ctx.user.role === 'admin'
      const isCreator = existing.createdBy === ctx.userId

      if (!isAdmin && !isCreator) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No tienes permisos para editar este escenario',
        })
      }

      const [updated] = await db
        .update(scenarios)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(scenarios.id, id))
        .returning()

      if (!updated) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al actualizar el escenario',
        })
      }

      return updated
    }),

  /**
   * Delete scenario (admin only)
   */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Soft delete: set status to archived
      const [updated] = await db
        .update(scenarios)
        .set({
          status: 'archived',
          updatedAt: new Date(),
        })
        .where(eq(scenarios.id, input.id))
        .returning()

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Escenario no encontrado',
        })
      }

      return { success: true }
    }),

  /**
   * Track scenario usage (called when a debate uses a scenario)
   */
  trackUsage: protectedProcedure
    .input(
      z.object({
        scenarioId: z.string().uuid(),
        debateId: z.string().uuid(),
        variablesUsed: z.record(z.string()).optional(),
        successMetricsExtracted: z.record(z.unknown()).optional(),
        qualityScore: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Increment usage count
      await db
        .update(scenarios)
        .set({
          usageCount: sql`${scenarios.usageCount} + 1`,
        })
        .where(eq(scenarios.id, input.scenarioId))

      // Create usage record
      const [usage] = await db
        .insert(scenarioUsage)
        .values({
          scenarioId: input.scenarioId,
          debateId: input.debateId,
          userId: ctx.userId,
          variablesUsed: input.variablesUsed || {},
          successMetricsExtracted: input.successMetricsExtracted || {},
          qualityScore: input.qualityScore,
        })
        .returning()

      return usage
    }),
})
