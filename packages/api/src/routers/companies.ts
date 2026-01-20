/**
 * Companies Router
 * Handles corporate intelligence - company context and master information
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import { companies } from '@quoorum/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { logger } from '../lib/logger'

// ═══════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════

const createCompanySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  context: z.string().min(10, 'Company context must be at least 10 characters'),
  industry: z.string().max(100).optional(),
  size: z.string().max(50).optional(),
  description: z.string().optional(),
})

const updateCompanySchema = createCompanySchema.partial().extend({
  id: z.string().uuid(),
})

// ═══════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════

export const companiesRouter = router({
  /**
   * Get user's company
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.userId, ctx.userId))
      .orderBy(desc(companies.createdAt))
      .limit(1)

    return company || null
  }),

  /**
   * Create company
   */
  create: protectedProcedure
    .input(createCompanySchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user already has a company
      const [existing] = await db
        .select()
        .from(companies)
        .where(eq(companies.userId, ctx.userId))
        .limit(1)

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You already have a company configured',
        })
      }

      const [company] = await db
        .insert(companies)
        .values({
          ...input,
          userId: ctx.userId,
        })
        .returning()

      logger.info('Company created', {
        companyId: company.id,
        userId: ctx.userId,
        name: company.name,
      })

      return company
    }),

  /**
   * Update company
   */
  update: protectedProcedure
    .input(updateCompanySchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Verify ownership
      const [existing] = await db
        .select({ id: companies.id })
        .from(companies)
        .where(and(eq(companies.id, id), eq(companies.userId, ctx.userId)))

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        })
      }

      const [updated] = await db
        .update(companies)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, id))
        .returning()

      logger.info('Company updated', {
        companyId: updated.id,
        userId: ctx.userId,
      })

      return updated
    }),

  /**
   * Delete company (and all departments)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [existing] = await db
        .select({ id: companies.id })
        .from(companies)
        .where(and(eq(companies.id, input.id), eq(companies.userId, ctx.userId)))

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        })
      }

      // Delete will cascade to departments
      await db.delete(companies).where(eq(companies.id, input.id))

      logger.info('Company deleted', {
        companyId: input.id,
        userId: ctx.userId,
      })

      return { success: true }
    }),
})
