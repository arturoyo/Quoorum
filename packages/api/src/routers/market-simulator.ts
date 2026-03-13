/**
 * Market Simulator Router
 * API para Focus Group de IA
 */

import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import {
  marketSimulations,
  strategicProfiles,
  type FrictionScore,
} from '@quoorum/db/schema'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { runMarketSimulation, type BuyerPersona } from '@quoorum/quoorum/orchestration/market-simulator'
import { logger } from '../lib/logger'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const runSimulationSchema = z.object({
  variants: z.array(z.string().min(10).max(1000)).min(2).max(5),
  buyerPersonaIds: z.array(z.string().uuid()).min(1).max(10),
  context: z.string().max(2000).optional(),
})

// ============================================================================
// ROUTER
// ============================================================================

export const marketSimulatorRouter = router({

  /**
   * Ejecuta una simulación de mercado completa
   */
  runSimulation: protectedProcedure
    .input(runSimulationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        logger.info('[marketSimulator.runSimulation] Starting', {
          userId: ctx.userId,
          variants: input.variants.length,
          personas: input.buyerPersonaIds.length,
        })

        // 1. Fetch buyer personas from strategic_profiles
        const personas = await db.query.strategicProfiles.findMany({
          where: and(
            inArray(strategicProfiles.id, input.buyerPersonaIds),
            eq(strategicProfiles.type, 'buyer_persona'),
            eq(strategicProfiles.isActive, true)
          ),
        })

        if (personas.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No se encontraron Buyer Personas activas con los IDs proporcionados',
          })
        }

        if (personas.length !== input.buyerPersonaIds.length) {
          logger.warn('[marketSimulator.runSimulation] Some personas not found', {
            requested: input.buyerPersonaIds.length,
            found: personas.length,
          })
        }

        // 2. Transform to BuyerPersona format
        const buyerPersonas: BuyerPersona[] = personas.map(p => ({
          id: p.id,
          name: p.name,
          psychographics: p.psychographics || {},
        }))

        // 3. Run simulation
        const result = await runMarketSimulation({
          variants: input.variants,
          buyerPersonas,
          context: input.context,
          userId: ctx.userId,
          companyId: ctx.companyId || undefined,
        })

        // 4. Save to DB
        const [simulation] = await db.insert(marketSimulations).values({
          variants: input.variants,
          buyerPersonaIds: input.buyerPersonaIds,
          context: input.context,
          winningVariantIndex: result.winningVariant.index,
          winningVariantText: result.winningVariant.text,
          consensusScore: result.winningVariant.consensusScore.toFixed(2),
          avgFriction: result.winningVariant.avgFriction.toFixed(2),
          frictionMap: result.frictionMap as unknown as FrictionScore[],
          synthesis: result.synthesis,
          evaluationCostUsd: result.costBreakdown.evaluationCost.toFixed(6),
          synthesisCostUsd: result.costBreakdown.synthesisCost.toFixed(6),
          totalCostUsd: result.costBreakdown.totalCost.toFixed(6),
          tokensUsed: result.costBreakdown.totalTokens,
          executionTimeMs: result.executionTime,
          userId: ctx.userId,
          companyId: ctx.companyId,
        }).returning()

        logger.info('[marketSimulator.runSimulation] Completed', {
          simulationId: simulation.id,
          winningIndex: result.winningVariant.index,
          executionTime: result.executionTime,
          totalCost: result.costBreakdown.totalCost,
        })

        return {
          simulationId: simulation.id,
          result,
          personas: buyerPersonas.map(p => ({
            id: p.id,
            name: p.name,
          })),
        }
      } catch (error) {
        logger.error('[marketSimulator.runSimulation] Failed', { error })

        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al ejecutar la simulación de mercado',
        })
      }
    }),

  /**
   * Obtiene una simulación por ID
   */
  getSimulation: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const simulation = await db.query.marketSimulations.findFirst({
          where: eq(marketSimulations.id, input.id),
        })

        if (!simulation) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Simulación no encontrada',
          })
        }

        // Check access
        if (
          simulation.userId !== ctx.userId &&
          simulation.companyId !== ctx.companyId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No tienes acceso a esta simulación',
          })
        }

        // Fetch buyer personas info
        const personas = await db.query.strategicProfiles.findMany({
          where: inArray(strategicProfiles.id, simulation.buyerPersonaIds),
          columns: {
            id: true,
            name: true,
            slug: true,
            title: true,
          },
        })

        return {
          ...simulation,
          personas,
        }
      } catch (error) {
        logger.error('[marketSimulator.getSimulation] Failed', { error })

        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al obtener la simulación',
        })
      }
    }),

  /**
   * Lista simulaciones del usuario
   */
  listSimulations: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        const limit = input?.limit || 20
        const offset = input?.offset || 0

        const simulations = await db
          .select({
            id: marketSimulations.id,
            variants: marketSimulations.variants,
            buyerPersonaIds: marketSimulations.buyerPersonaIds,
            winningVariantIndex: marketSimulations.winningVariantIndex,
            winningVariantText: marketSimulations.winningVariantText,
            consensusScore: marketSimulations.consensusScore,
            avgFriction: marketSimulations.avgFriction,
            totalCostUsd: marketSimulations.totalCostUsd,
            createdAt: marketSimulations.createdAt,
          })
          .from(marketSimulations)
          .where(
            and(
              eq(marketSimulations.userId, ctx.userId),
              ctx.companyId
                ? eq(marketSimulations.companyId, ctx.companyId)
                : undefined
            )
          )
          .orderBy(desc(marketSimulations.createdAt))
          .limit(limit)
          .offset(offset)

        // Count total
        const [{ count }] = await db
          .select({ count: marketSimulations.id })
          .from(marketSimulations)
          .where(eq(marketSimulations.userId, ctx.userId))

        return {
          simulations,
          total: count || 0,
          limit,
          offset,
        }
      } catch (error) {
        logger.error('[marketSimulator.listSimulations] Failed', { error })

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al listar simulaciones',
        })
      }
    }),

  /**
   * Elimina una simulación
   */
  deleteSimulation: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const simulation = await db.query.marketSimulations.findFirst({
          where: eq(marketSimulations.id, input.id),
        })

        if (!simulation) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Simulación no encontrada',
          })
        }

        if (simulation.userId !== ctx.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No tienes permiso para eliminar esta simulación',
          })
        }

        await db
          .delete(marketSimulations)
          .where(eq(marketSimulations.id, input.id))

        logger.info('[marketSimulator.deleteSimulation] Deleted', {
          simulationId: input.id,
        })

        return { success: true }
      } catch (error) {
        logger.error('[marketSimulator.deleteSimulation] Failed', { error })

        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al eliminar la simulación',
        })
      }
    }),
})
