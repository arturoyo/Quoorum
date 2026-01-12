/**
 * Admin Forum Router
 * ==================
 *
 * Sistema de deliberacion multi-agente para decisiones estrategicas
 * Solo accesible para administradores
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import {
  adminUsers,
  adminRoles,
  forumSessions,
  forumMessages,
  forumContextSources,
} from '@quoorum/db/schema'
import { eq, and, desc, count } from 'drizzle-orm'
import {
  runDebate,
  loadContext,
  FORUM_AGENTS,
  getAllAgents,
  estimateDebateCost,
  CreateSessionSchema,
  type DebateRound,
  type DebateMessage,
} from '@quoorum/forum'

// ============================================================
// Admin Middleware
// ============================================================

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const [adminUser] = await db
    .select({
      id: adminUsers.id,
      userId: adminUsers.userId,
      roleId: adminUsers.roleId,
      roleSlug: adminRoles.slug,
      rolePermissions: adminRoles.permissions,
    })
    .from(adminUsers)
    .innerJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
    .where(and(eq(adminUsers.userId, ctx.user.id), eq(adminUsers.isActive, true)))

  if (!adminUser) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No tienes permisos de administrador' })
  }

  const permissions = (adminUser.rolePermissions as string[]) || []

  return next({
    ctx: {
      ...ctx,
      adminUser: { ...adminUser, permissions },
    },
  })
})

// ============================================================
// Router
// ============================================================

export const adminForumRouter = router({
  // ============================================
  // AGENT INFO
  // ============================================

  /**
   * Obtener lista de agentes disponibles
   */
  getAgents: adminProcedure.query(() => {
    return getAllAgents()
  }),

  /**
   * Estimar costo de un debate
   */
  estimateCost: adminProcedure
    .input(
      z.object({
        estimatedRounds: z.number().min(1).max(20).default(5),
        avgTokensPerMessage: z.number().min(10).max(500).default(50),
      })
    )
    .query(({ input }) => {
      return {
        estimatedCostUsd: estimateDebateCost(input.avgTokensPerMessage, input.estimatedRounds),
        agents: Object.values(FORUM_AGENTS).map((a) => ({
          key: a.key,
          name: a.name,
          provider: a.provider,
          model: a.model,
        })),
      }
    }),

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  /**
   * Listar sesiones de debate
   */
  listSessions: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
        status: z.enum(['running', 'completed', 'failed', 'all']).default('all'),
      })
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit
      const conditions = [eq(forumSessions.userId, ctx.user.id)]

      if (input.status !== 'all') {
        conditions.push(eq(forumSessions.status, input.status))
      }

      const items = await db
        .select()
        .from(forumSessions)
        .where(and(...conditions))
        .orderBy(desc(forumSessions.createdAt))
        .limit(input.limit)
        .offset(offset)

      const [countResult] = await db
        .select({ count: count() })
        .from(forumSessions)
        .where(and(...conditions))

      return {
        items,
        total: countResult?.count ?? 0,
        page: input.page,
        totalPages: Math.ceil((countResult?.count ?? 0) / input.limit),
      }
    }),

  /**
   * Obtener una sesion por ID
   */
  getSession: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [session] = await db
        .select()
        .from(forumSessions)
        .where(and(eq(forumSessions.id, input.id), eq(forumSessions.userId, ctx.user.id)))

      if (!session) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Sesion no encontrada' })
      }

      // Get messages
      const messages = await db
        .select()
        .from(forumMessages)
        .where(eq(forumMessages.sessionId, input.id))
        .orderBy(forumMessages.round, forumMessages.createdAt)

      // Get context sources
      const contextSources = await db
        .select()
        .from(forumContextSources)
        .where(eq(forumContextSources.sessionId, input.id))

      // Group messages by round
      const rounds: DebateRound[] = []
      let currentRound = 0
      let currentMessages: DebateMessage[] = []

      for (const msg of messages) {
        if (msg.round !== currentRound) {
          if (currentMessages.length > 0) {
            rounds.push({ round: currentRound, messages: currentMessages })
          }
          currentRound = msg.round
          currentMessages = []
        }
        currentMessages.push({
          id: msg.id,
          sessionId: msg.sessionId,
          round: msg.round,
          agentKey: msg.agentKey,
          agentName: msg.agentName ?? msg.agentKey,
          content: msg.content,
          isCompressed: msg.isCompressed ?? true,
          tokensUsed: msg.tokensUsed ?? 0,
          costUsd: Number(msg.costUsd ?? 0),
          createdAt: msg.createdAt,
        })
      }
      if (currentMessages.length > 0) {
        rounds.push({ round: currentRound, messages: currentMessages })
      }

      return {
        session,
        rounds,
        contextSources,
      }
    }),

  /**
   * Crear nueva sesion de debate
   */
  createSession: adminProcedure.input(CreateSessionSchema).mutation(async ({ ctx, input }) => {
    // Create session record
    const [session] = await db
      .insert(forumSessions)
      .values({
        userId: ctx.user.id,
        question: input.question,
        manualContext: input.manualContext,
        useInternet: input.useInternet,
        useRepo: input.useRepo,
        repoPath: input.repoPath,
        status: 'running',
      })
      .returning()

    if (!session) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error al crear sesion' })
    }

    return session
  }),

  /**
   * Ejecutar debate (despues de crear sesion)
   */
  runDebate: adminProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get session
      const [session] = await db
        .select()
        .from(forumSessions)
        .where(and(eq(forumSessions.id, input.sessionId), eq(forumSessions.userId, ctx.user.id)))

      if (!session) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Sesion no encontrada' })
      }

      if (session.status !== 'running') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Sesion ya ha sido ejecutada' })
      }

      try {
        // Load context
        const context = await loadContext({
          question: session.question,
          manualContext: session.manualContext ?? undefined,
          useInternet: session.useInternet ?? false,
          useRepo: session.useRepo ?? false,
          repoPath: session.repoPath ?? undefined,
        })

        // Save context sources
        for (const source of context.sources) {
          await db.insert(forumContextSources).values({
            sessionId: session.id,
            sourceType: source.type,
            content: source.content,
            sourceData: source.metadata,
          })
        }

        // Run debate
        const result = await runDebate({
          sessionId: session.id,
          question: session.question,
          context,
          onMessageGenerated: async (message) => {
            // Save each message to DB in real-time
            await db.insert(forumMessages).values({
              id: message.id,
              sessionId: message.sessionId,
              round: message.round,
              agentKey: message.agentKey,
              agentName: message.agentName,
              content: message.content,
              isCompressed: message.isCompressed,
              tokensUsed: message.tokensUsed,
              costUsd: String(message.costUsd),
            })
          },
        })

        // Update session with results
        await db
          .update(forumSessions)
          .set({
            status: 'completed',
            totalRounds: result.totalRounds,
            consensusScore: String(result.consensusScore),
            finalRanking: result.finalRanking,
            totalCostUsd: String(result.totalCostUsd),
            completedAt: new Date(),
          })
          .where(eq(forumSessions.id, session.id))

        return result
      } catch (error) {
        // Mark session as failed
        await db
          .update(forumSessions)
          .set({
            status: 'failed',
            completedAt: new Date(),
          })
          .where(eq(forumSessions.id, session.id))

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Error ejecutando debate',
        })
      }
    }),

  /**
   * Eliminar sesion
   */
  deleteSession: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Delete messages first (foreign key constraint)
      await db.delete(forumMessages).where(eq(forumMessages.sessionId, input.id))

      // Delete context sources
      await db.delete(forumContextSources).where(eq(forumContextSources.sessionId, input.id))

      // Delete session
      const result = await db
        .delete(forumSessions)
        .where(and(eq(forumSessions.id, input.id), eq(forumSessions.userId, ctx.user.id)))
        .returning()

      if (result.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Sesion no encontrada' })
      }

      return { success: true }
    }),

  // ============================================
  // STATS
  // ============================================

  /**
   * Estadisticas de uso del Forum
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [stats] = await db
      .select({
        totalSessions: count(),
      })
      .from(forumSessions)
      .where(eq(forumSessions.userId, ctx.user.id))

    const [completedStats] = await db
      .select({
        count: count(),
      })
      .from(forumSessions)
      .where(and(eq(forumSessions.userId, ctx.user.id), eq(forumSessions.status, 'completed')))

    // Get recent sessions
    const recentSessions = await db
      .select()
      .from(forumSessions)
      .where(eq(forumSessions.userId, ctx.user.id))
      .orderBy(desc(forumSessions.createdAt))
      .limit(5)

    return {
      totalSessions: stats?.totalSessions ?? 0,
      completedSessions: completedStats?.count ?? 0,
      recentSessions,
    }
  }),
})
