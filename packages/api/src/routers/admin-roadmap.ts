/**
 * Admin Roadmap Router
 *
 * CRUD for roadmap items, accessible only by admin users.
 * Tracks project tasks, blockers, and completed milestones.
 */

import { z } from 'zod'
import { eq, and, desc, sql } from 'drizzle-orm'
import { router, adminProcedure } from '../trpc'
import { db } from '@quoorum/db'
import { roadmapItems } from '@quoorum/db'
import { TRPCError } from '@trpc/server'

// ============================================================================
// SCHEMAS
// ============================================================================

const listSchema = z.object({
  status: z.enum(['planned', 'in_progress', 'completed', 'blocked']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  category: z.enum(['feature', 'bugfix', 'infra', 'docs']).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
})

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'blocked']).default('planned'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  category: z.enum(['feature', 'bugfix', 'infra', 'docs']).default('feature'),
  dueDate: z.string().datetime().optional().nullable(),
})

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['planned', 'in_progress', 'completed', 'blocked']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  category: z.enum(['feature', 'bugfix', 'infra', 'docs']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
})

// ============================================================================
// PRIORITY ORDER MAPPING (for sorting: critical > high > medium > low)
// ============================================================================

const PRIORITY_ORDER = sql`CASE ${roadmapItems.priority}
  WHEN 'critical' THEN 4
  WHEN 'high' THEN 3
  WHEN 'medium' THEN 2
  WHEN 'low' THEN 1
  ELSE 0
END`

// ============================================================================
// ROUTER
// ============================================================================

export const adminRoadmapRouter = router({
  /**
   * List roadmap items with optional filters, ordered by priority desc then created_at desc
   */
  list: adminProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      const conditions = []

      if (input.status) {
        conditions.push(eq(roadmapItems.status, input.status))
      }

      if (input.priority) {
        conditions.push(eq(roadmapItems.priority, input.priority))
      }

      if (input.category) {
        conditions.push(eq(roadmapItems.category, input.category))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const results = await db
        .select()
        .from(roadmapItems)
        .where(whereClause)
        .orderBy(desc(PRIORITY_ORDER), desc(roadmapItems.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      const [total] = await db
        .select({ count: sql<number>`count(*)` })
        .from(roadmapItems)
        .where(whereClause)

      return {
        items: results,
        total: Number(total?.count || 0),
        limit: input.limit,
        offset: input.offset,
      }
    }),

  /**
   * Create a new roadmap item
   */
  create: adminProcedure
    .input(createSchema)
    .mutation(async ({ input }) => {
      const [item] = await db
        .insert(roadmapItems)
        .values({
          title: input.title,
          description: input.description || null,
          status: input.status,
          priority: input.priority,
          category: input.category,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        })
        .returning()

      return item
    }),

  /**
   * Update a roadmap item by id (partial update)
   */
  update: adminProcedure
    .input(updateSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      }

      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.status !== undefined) updateData.status = data.status
      if (data.priority !== undefined) updateData.priority = data.priority
      if (data.category !== undefined) updateData.category = data.category
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null

      const [updated] = await db
        .update(roadmapItems)
        .set(updateData)
        .where(eq(roadmapItems.id, id))
        .returning()

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Roadmap item not found',
        })
      }

      return updated
    }),

  /**
   * Delete a roadmap item by id
   */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [deleted] = await db
        .delete(roadmapItems)
        .where(eq(roadmapItems.id, input.id))
        .returning()

      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Roadmap item not found',
        })
      }

      return { success: true }
    }),

  /**
   * Get counts by status for the stats bar
   */
  stats: adminProcedure.query(async () => {
    const results = await db
      .select({
        status: roadmapItems.status,
        count: sql<number>`count(*)`,
      })
      .from(roadmapItems)
      .groupBy(roadmapItems.status)

    const stats: Record<string, number> = {
      planned: 0,
      in_progress: 0,
      completed: 0,
      blocked: 0,
    }

    for (const row of results) {
      stats[row.status] = Number(row.count)
    }

    return {
      ...stats,
      total: Object.values(stats).reduce((a, b) => a + b, 0),
    }
  }),
})
