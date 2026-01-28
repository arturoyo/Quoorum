/**
 * Process Timeline Router
 *
 * Manages multi-phase processes with progress tracking:
 * - Create processes with phases
 * - Advance through phases
 * - Track progress percentage
 * - List active/completed processes
 */

import { db } from '@quoorum/db'
import { processTimeline, profiles } from '@quoorum/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { protectedProcedure, router } from '../trpc'
import { sendForumNotification } from './quoorum-notifications'

// ============================================================
// Schemas
// ============================================================

const processPhaseSchema = z.object({
  phaseNumber: z.number().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped']).default('pending'),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

const createProcessSchema = z.object({
  processType: z.string().min(1).max(100),
  processId: z.string().uuid().optional(),
  processName: z.string().min(1).max(200),
  totalPhases: z.number().min(1).max(20),
  phases: z.array(processPhaseSchema).min(1),
  metadata: z.record(z.unknown()).optional(),
})

const advancePhaseSchema = z.object({
  processId: z.string().uuid(),
  phaseNumber: z.number().min(1),
  metadata: z.record(z.unknown()).optional(),
})

// ============================================================
// Router
// ============================================================

export const processTimelineRouter = router({
  /**
   * List user's processes
   */
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['in_progress', 'completed', 'paused', 'failed', 'cancelled']).optional(),
        processType: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // IMPORTANT: process_timeline.user_id references profiles.id, not users.id
      // Find profile for this user
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1)

      if (!profile) {
        // If profile doesn't exist, return empty list (user has no processes yet)
        return []
      }

      const profileId = profile.id // Use profile.id for foreign key

      const conditions = [eq(processTimeline.userId, profileId)]

      if (input.status) {
        conditions.push(eq(processTimeline.status, input.status))
      }

      if (input.processType) {
        conditions.push(eq(processTimeline.processType, input.processType))
      }

      const processes = await db
        .select()
        .from(processTimeline)
        .where(and(...conditions))
        .orderBy(desc(processTimeline.startedAt))
        .limit(input.limit)
        .offset(input.offset)

      return processes
    }),

  /**
   * Get process by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // IMPORTANT: process_timeline.user_id references profiles.id, not users.id
      // Find profile for this user
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1)

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de usuario no encontrado',
        })
      }

      const profileId = profile.id // Use profile.id for foreign key

      const [process] = await db
        .select()
        .from(processTimeline)
        .where(and(eq(processTimeline.id, input.id), eq(processTimeline.userId, profileId)))

      if (!process) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proceso no encontrado',
        })
      }

      return process
    }),

  /**
   * Create new process
   */
  create: protectedProcedure.input(createProcessSchema).mutation(async ({ ctx, input }) => {
    // IMPORTANT: process_timeline.user_id references profiles.id, not users.id
    // Find profile for this user
    const [profile] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, ctx.user.email))
      .limit(1)

    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Perfil de usuario no encontrado',
      })
    }

    const profileId = profile.id // Use profile.id for foreign key

    // Validate phases match totalPhases
    if (input.phases.length !== input.totalPhases) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'El número de fases debe coincidir con totalPhases',
      })
    }

    // Validate phase numbers are sequential
    const phaseNumbers = input.phases.map((p) => p.phaseNumber).sort((a, b) => a - b)
    for (let i = 0; i < phaseNumbers.length; i++) {
      if (phaseNumbers[i] !== i + 1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Los números de fase deben ser secuenciales empezando desde 1',
        })
      }
    }

    // Set first phase as in_progress
    const phases = input.phases.map((phase, index) => ({
      ...phase,
      status: index === 0 ? ('in_progress' as const) : ('pending' as const),
      startedAt: index === 0 ? new Date().toISOString() : undefined,
    }))

    const [newProcess] = await db
      .insert(processTimeline)
      .values({
        userId: profileId,
        processType: input.processType,
        processId: input.processId,
        processName: input.processName,
        totalPhases: input.totalPhases,
        currentPhase: 1,
        progressPercent: Math.round((1 / input.totalPhases) * 100),
        status: 'in_progress',
        phases,
        metadata: input.metadata,
      })
      .returning()

    return newProcess
  }),

  /**
   * Advance to next phase
   */
  advancePhase: protectedProcedure.input(advancePhaseSchema).mutation(async ({ ctx, input }) => {
    // IMPORTANT: process_timeline.user_id references profiles.id, not users.id
    // Find profile for this user
    const [profile] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, ctx.user.email))
      .limit(1)

    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Perfil de usuario no encontrado',
      })
    }

    const profileId = profile.id // Use profile.id for foreign key

    // Get current process
    const [process] = await db
      .select()
      .from(processTimeline)
      .where(and(eq(processTimeline.id, input.processId), eq(processTimeline.userId, profileId)))

    if (!process) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Proceso no encontrado',
      })
    }

    if (process.status !== 'in_progress') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'El proceso no está en progreso',
      })
    }

    // Validate phase number
    if (input.phaseNumber < 1 || input.phaseNumber > process.totalPhases) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Número de fase inválido',
      })
    }

    if (input.phaseNumber <= process.currentPhase) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No se puede avanzar a una fase anterior',
      })
    }

    // Update phases
    const updatedPhases = process.phases.map((phase) => {
      if (phase.phaseNumber === process.currentPhase) {
        // Mark current phase as completed
        return {
          ...phase,
          status: 'completed' as const,
          completedAt: new Date().toISOString(),
        }
      }
      if (phase.phaseNumber === input.phaseNumber) {
        // Mark new phase as in_progress
        return {
          ...phase,
          status: 'in_progress' as const,
          startedAt: new Date().toISOString(),
        }
      }
      return phase
    })

    // Calculate new progress
    const newProgressPercent = Math.round((input.phaseNumber / process.totalPhases) * 100)
    const isCompleted = input.phaseNumber === process.totalPhases

    // Update process
    const [updated] = await db
      .update(processTimeline)
      .set({
        currentPhase: input.phaseNumber,
        progressPercent: newProgressPercent,
        status: isCompleted ? 'completed' : 'in_progress',
        phases: updatedPhases,
        completedAt: isCompleted ? new Date() : undefined,
        updatedAt: new Date(),
        metadata: input.metadata ? { ...process.metadata, ...input.metadata } : process.metadata,
      })
      .where(eq(processTimeline.id, input.processId))
      .returning()

    // Send notification for important phases (1, milestones, or completion)
    const isMilestonePhase = input.phaseNumber === 1 || 
                             input.phaseNumber === Math.ceil(process.totalPhases / 2) ||
                             input.phaseNumber === process.totalPhases

    if (isMilestonePhase || isCompleted) {
      const notificationType = isCompleted ? 'process_completed' : 'process_phase_completed'
      const currentPhaseData = updatedPhases.find(p => p.phaseNumber === input.phaseNumber)
      
      await sendForumNotification({
        userId: process.userId,
        type: notificationType,
        priority: isCompleted ? 'high' : 'normal',
        title: isCompleted 
          ? `${process.processName} - Completado [OK]`
          : `${process.processName} - Fase ${input.phaseNumber}/${process.totalPhases}`,
        message: isCompleted
          ? `Has completado todas las fases del proceso "${process.processName}"`
          : `Has completado: ${currentPhaseData?.name || `Fase ${input.phaseNumber}`}`,
        actionUrl: `/processes/${process.id}`,
        actionLabel: 'Ver proceso',
        metadata: {
          processId: process.id,
          processType: process.processType,
          phaseNumber: input.phaseNumber,
          totalPhases: process.totalPhases,
          progressPercent: newProgressPercent,
        },
      })
    }

    return updated
  }),

  /**
   * Update process status (pause, resume, cancel, etc.)
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        processId: z.string().uuid(),
        status: z.enum(['in_progress', 'completed', 'paused', 'failed', 'cancelled']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // IMPORTANT: process_timeline.user_id references profiles.id, not users.id
      // Find profile for this user
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1)

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de usuario no encontrado',
        })
      }

      const profileId = profile.id // Use profile.id for foreign key

      const [process] = await db
        .select()
        .from(processTimeline)
        .where(and(eq(processTimeline.id, input.processId), eq(processTimeline.userId, profileId)))

      if (!process) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proceso no encontrado',
        })
      }

      const [updated] = await db
        .update(processTimeline)
        .set({
          status: input.status,
          completedAt: input.status === 'completed' ? new Date() : process.completedAt,
          updatedAt: new Date(),
        })
        .where(eq(processTimeline.id, input.processId))
        .returning()

      return updated
    }),

  /**
   * Delete process
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // IMPORTANT: process_timeline.user_id references profiles.id, not users.id
      // Find profile for this user
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.email, ctx.user.email))
        .limit(1)

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de usuario no encontrado',
        })
      }

      const profileId = profile.id // Use profile.id for foreign key

      // Verify ownership before deleting
      const [existing] = await db
        .select({ id: processTimeline.id })
        .from(processTimeline)
        .where(and(eq(processTimeline.id, input.id), eq(processTimeline.userId, profileId)))

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proceso no encontrado',
        })
      }

      await db
        .delete(processTimeline)
        .where(and(eq(processTimeline.id, input.id), eq(processTimeline.userId, profileId)))

      return { success: true }
    }),
})
