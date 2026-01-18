/**
 * Deals Router
 * 
 * CRUD operations for sales opportunities/deals.
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import { deals, clients } from '@quoorum/db/schema'
import { eq, and, desc, like, or } from 'drizzle-orm'

const dealStageEnum = z.enum([
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'commitment',
  'closed_won',
  'closed_lost',
])

const createDealSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(255),
  clientId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  stage: dealStageEnum.default('lead'),
  value: z.number().positive().optional(),
  currency: z.string().length(3).default('EUR'),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(), // Accepts ISO date string or yyyy-MM-dd format
  description: z.string().max(5000).optional(),
  notes: z.string().max(10000).optional(),
  metadata: z.record(z.unknown()).optional(),
})

const updateDealSchema = createDealSchema.partial().extend({
  id: z.string().uuid(),
})

const listDealsSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  stage: dealStageEnum.optional(),
  clientId: z.string().uuid().optional(),
  search: z.string().optional(),
})

export const dealsRouter = router({
  /**
   * List deals
   */
  list: protectedProcedure
    .input(listDealsSchema)
    .query(async ({ ctx, input }) => {
      const { limit, offset, stage, clientId, search } = input

      const conditions = [eq(deals.userId, ctx.user.id)]

      if (stage) {
        conditions.push(eq(deals.stage, stage))
      }

      if (clientId) {
        conditions.push(eq(deals.clientId, clientId))
      }

      if (search) {
        conditions.push(like(deals.name, `%${search}%`))
      }

      const results = await db
        .select()
        .from(deals)
        .where(and(...conditions))
        .orderBy(desc(deals.createdAt))
        .limit(limit)
        .offset(offset)

      return results
    }),

  /**
   * Get deal by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [deal] = await db
        .select()
        .from(deals)
        .where(and(eq(deals.id, input.id), eq(deals.userId, ctx.user.id)))
        .limit(1)

      if (!deal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Oportunidad no encontrada',
        })
      }

      return deal
    }),

  /**
   * Create new deal
   */
  create: protectedProcedure
    .input(createDealSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify client exists if provided
      if (input.clientId) {
        const [client] = await db
          .select({ id: clients.id })
          .from(clients)
          .where(and(eq(clients.id, input.clientId), eq(clients.userId, ctx.user.id)))
          .limit(1)

        if (!client) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Cliente no encontrado',
          })
        }
      }

      const [deal] = await db
        .insert(deals)
        .values({
          userId: ctx.user.id,
          name: input.name,
          clientId: input.clientId,
          ownerId: input.ownerId || ctx.user.id,
          stage: input.stage,
          value: input.value,
          currency: input.currency,
          probability: input.probability,
          expectedCloseDate: input.expectedCloseDate
            ? new Date(input.expectedCloseDate + (input.expectedCloseDate.includes('T') ? '' : 'T00:00:00'))
            : undefined,
          description: input.description,
          notes: input.notes,
          metadata: input.metadata,
        })
        .returning()

      return deal
    }),

  /**
   * Update deal
   */
  update: protectedProcedure
    .input(updateDealSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Verify ownership
      const [existing] = await db
        .select({ id: deals.id })
        .from(deals)
        .where(and(eq(deals.id, id), eq(deals.userId, ctx.user.id)))
        .limit(1)

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Oportunidad no encontrada',
        })
      }

      // Verify client exists if provided
      if (data.clientId) {
        const [client] = await db
          .select({ id: clients.id })
          .from(clients)
          .where(and(eq(clients.id, data.clientId), eq(clients.userId, ctx.user.id)))
          .limit(1)

        if (!client) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Cliente no encontrado',
          })
        }
      }

          const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      }

      if (data.name !== undefined) updateData.name = data.name
      if (data.clientId !== undefined) updateData.clientId = data.clientId
      if (data.ownerId !== undefined) updateData.ownerId = data.ownerId
      if (data.stage !== undefined) updateData.stage = data.stage
      if (data.value !== undefined) updateData.value = data.value
      if (data.currency !== undefined) updateData.currency = data.currency
      if (data.probability !== undefined) updateData.probability = data.probability
      if (data.expectedCloseDate !== undefined) {
        updateData.expectedCloseDate = data.expectedCloseDate
          ? new Date(data.expectedCloseDate + (data.expectedCloseDate.includes('T') ? '' : 'T00:00:00'))
          : null
      }
      if (data.description !== undefined) updateData.description = data.description
      if (data.notes !== undefined) updateData.notes = data.notes
      if (data.metadata !== undefined) updateData.metadata = data.metadata

      const [updated] = await db
        .update(deals)
        .set(updateData)
        .where(eq(deals.id, id))
        .returning()

      return updated
    }),

  /**
   * Delete deal (soft delete - set stage to closed_lost)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [existing] = await db
        .select({ id: deals.id })
        .from(deals)
        .where(and(eq(deals.id, input.id), eq(deals.userId, ctx.user.id)))
        .limit(1)

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Oportunidad no encontrada',
        })
      }

      // Soft delete: set stage to closed_lost
      await db
        .update(deals)
        .set({ stage: 'closed_lost', updatedAt: new Date() })
        .where(eq(deals.id, input.id))

      return { success: true }
    }),
})
