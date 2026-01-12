/**
 * Forum Reports Router
 *
 * Handles PDF exports and scheduled reports.
 */

import { TRPCError } from '@trpc/server'
import { db } from '@forum/db'
import { forumDebates, forumReports, forumScheduledReports } from '@forum/db/schema'
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

export const forumReportsRouter = router({
  // ============================================
  // REPORT GENERATION
  // ============================================

  /**
   * Generate a single debate report
   */
  generateDebateReport: protectedProcedure
    .input(
      z.object({
        debateId: z.string().uuid(),
        format: z.enum(['pdf', 'html', 'markdown']).default('pdf'),
        includeExperts: z.boolean().default(true),
        includeMetrics: z.boolean().default(true),
        includeCharts: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify debate exists
      const [debate] = await db
        .select()
        .from(forumDebates)
        .where(eq(forumDebates.id, input.debateId))

      if (!debate) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Debate no encontrado' })
      }

      // Create report record
      const [report] = await db
        .insert(forumReports)
        .values({
          userId: ctx.user.id,
          type: 'single_debate',
          title: `Reporte: ${debate.question.substring(0, 50)}...`,
          format: input.format,
          status: 'pending',
          parameters: {
            debateIds: [input.debateId],
            includeExperts: input.includeExperts,
            includeMetrics: input.includeMetrics,
            includeCharts: input.includeCharts,
          },
        })
        .returning()

      if (!report) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error creando reporte' })
      }

      // Generate report asynchronously
      // NOTE: In Vercel Serverless, we must await this or use a queue (Inngest/QStash).
      // For now, we await it to ensure completion, even if it adds latency.
      await generateReportAsync(report.id)

      return report
    }),

  /**
   * Generate weekly summary report
   */
  generateWeeklySummary: protectedProcedure
    .input(
      z.object({
        dateFrom: z.string().datetime(),
        dateTo: z.string().datetime(),
        format: z.enum(['pdf', 'html', 'markdown']).default('pdf'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const from = new Date(input.dateFrom)
      const to = new Date(input.dateTo)

      // Get debates in date range
      const debates = await db
        .select({ id: forumDebates.id })
        .from(forumDebates)
        .where(
          and(
            eq(forumDebates.userId, ctx.user.id),
            gte(forumDebates.createdAt, from),
            lte(forumDebates.createdAt, to),
            eq(forumDebates.status, 'completed')
          )
        )

      if (debates.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No hay debates en el rango de fechas seleccionado',
        })
      }

      // Create report record
      const [report] = await db
        .insert(forumReports)
        .values({
          userId: ctx.user.id,
          type: 'weekly_summary',
          title: `Resumen Semanal: ${from.toLocaleDateString('es-ES')} - ${to.toLocaleDateString('es-ES')}`,
          format: input.format,
          status: 'pending',
          parameters: {
            debateIds: debates.map((d) => d.id),
            dateFrom: input.dateFrom,
            dateTo: input.dateTo,
            includeExperts: true,
            includeMetrics: true,
          },
        })
        .returning()

      if (!report) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error creando reporte' })
      }

      // Generate report asynchronously
      // NOTE: In Vercel Serverless, we must await this or use a queue (Inngest/QStash).
      // For now, we await it to ensure completion, even if it adds latency.
      await generateReportAsync(report.id)

      return report
    }),

  /**
   * Generate custom report
   */
  generateCustomReport: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        debateIds: z.array(z.string().uuid()),
        format: z.enum(['pdf', 'html', 'markdown']).default('pdf'),
        includeExperts: z.boolean().default(true),
        includeMetrics: z.boolean().default(true),
        includeCharts: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify all debates exist
      const debates = await db
        .select({ id: forumDebates.id })
        .from(forumDebates)
        .where(inArray(forumDebates.id, input.debateIds))

      if (debates.length !== input.debateIds.length) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Algunos debates no existen' })
      }

      // Create report record
      const [report] = await db
        .insert(forumReports)
        .values({
          userId: ctx.user.id,
          type: 'custom',
          title: input.title,
          format: input.format,
          status: 'pending',
          parameters: {
            debateIds: input.debateIds,
            includeExperts: input.includeExperts,
            includeMetrics: input.includeMetrics,
            includeCharts: input.includeCharts,
          },
        })
        .returning()

      if (!report) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error creando reporte' })
      }

      // Generate report asynchronously
      // NOTE: In Vercel Serverless, we must await this or use a queue (Inngest/QStash).
      // For now, we await it to ensure completion, even if it adds latency.
      await generateReportAsync(report.id)

      return report
    }),

  /**
   * Get report by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [report] = await db
        .select()
        .from(forumReports)
        .where(and(eq(forumReports.id, input.id), eq(forumReports.userId, ctx.user.id)))

      if (!report) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Reporte no encontrado' })
      }

      return report
    }),

  /**
   * List user's reports
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        type: z
          .enum([
            'single_debate',
            'weekly_summary',
            'monthly_summary',
            'deal_analysis',
            'expert_performance',
            'custom',
          ])
          .optional(),
        status: z.enum(['pending', 'generating', 'completed', 'failed']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(forumReports.userId, ctx.user.id)]

      if (input.type) {
        conditions.push(eq(forumReports.type, input.type))
      }

      if (input.status) {
        conditions.push(eq(forumReports.status, input.status))
      }

      const reports = await db
        .select()
        .from(forumReports)
        .where(and(...conditions))
        .orderBy(desc(forumReports.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      return reports
    }),

  /**
   * Delete report
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(forumReports)
        .where(and(eq(forumReports.id, input.id), eq(forumReports.userId, ctx.user.id)))

      return { success: true }
    }),

  /**
   * Share report (generate share token)
   */
  share: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        expiresInDays: z.number().min(1).max(30).default(7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const shareToken =
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays)

      const [updated] = await db
        .update(forumReports)
        .set({
          shareToken,
          expiresAt,
        })
        .where(and(eq(forumReports.id, input.id), eq(forumReports.userId, ctx.user.id)))
        .returning()

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Reporte no encontrado' })
      }

      return { shareToken, expiresAt, url: `/forum/reports/shared/${shareToken}` }
    }),

  /**
   * Get shared report (public)
   */
  getShared: protectedProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
    const [report] = await db
      .select()
      .from(forumReports)
      .where(and(eq(forumReports.shareToken, input.token), eq(forumReports.status, 'completed')))

    if (!report) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Reporte no encontrado' })
    }

    if (report.expiresAt && report.expiresAt < new Date()) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'El enlace ha expirado' })
    }

    return report
  }),

  // ============================================
  // SCHEDULED REPORTS
  // ============================================

  /**
   * Create scheduled report
   */
  createSchedule: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        type: z.enum(['weekly_summary', 'monthly_summary', 'expert_performance']),
        format: z.enum(['pdf', 'html', 'markdown']).default('pdf'),
        schedule: z.object({
          frequency: z.enum(['daily', 'weekly', 'monthly']),
          dayOfWeek: z.number().min(0).max(6).optional(),
          dayOfMonth: z.number().min(1).max(31).optional(),
          hour: z.number().min(0).max(23),
          timezone: z.string().default('Europe/Madrid'),
        }),
        deliveryMethod: z.object({
          email: z.boolean().default(true),
          emailAddresses: z.array(z.string().email()).optional(),
          inApp: z.boolean().default(true),
          webhook: z.string().url().optional(),
        }),
        parameters: z
          .object({
            includeExperts: z.boolean().default(true),
            includeMetrics: z.boolean().default(true),
            includeCharts: z.boolean().default(false),
            debateFilter: z
              .object({
                status: z.array(z.string()).optional(),
                minConsensus: z.number().min(0).max(1).optional(),
              })
              .optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Calculate next run time
      const nextRunAt = calculateNextRunTime(input.schedule)

      const [schedule] = await db
        .insert(forumScheduledReports)
        .values({
          userId: ctx.user.id,
          name: input.name,
          type: input.type,
          format: input.format,
          schedule: input.schedule,
          deliveryMethod: input.deliveryMethod,
          parameters: input.parameters,
          nextRunAt,
        })
        .returning()

      return schedule
    }),

  /**
   * List scheduled reports
   */
  listSchedules: protectedProcedure.query(async ({ ctx }) => {
    const schedules = await db
      .select()
      .from(forumScheduledReports)
      .where(eq(forumScheduledReports.userId, ctx.user.id))
      .orderBy(desc(forumScheduledReports.createdAt))

    return schedules
  }),

  /**
   * Update scheduled report
   */
  updateSchedule: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        isActive: z.boolean().optional(),
        schedule: z
          .object({
            frequency: z.enum(['daily', 'weekly', 'monthly']),
            dayOfWeek: z.number().min(0).max(6).optional(),
            dayOfMonth: z.number().min(1).max(31).optional(),
            hour: z.number().min(0).max(23),
            timezone: z.string(),
          })
          .optional(),
        deliveryMethod: z
          .object({
            email: z.boolean(),
            emailAddresses: z.array(z.string().email()).optional(),
            inApp: z.boolean(),
            webhook: z.string().url().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      // Calculate new next run time if schedule changed
      let nextRunAt: Date | undefined
      if (updateData.schedule) {
        nextRunAt = calculateNextRunTime(updateData.schedule)
      }

      const [updated] = await db
        .update(forumScheduledReports)
        .set({
          ...updateData,
          nextRunAt,
          updatedAt: new Date(),
        })
        .where(and(eq(forumScheduledReports.id, id), eq(forumScheduledReports.userId, ctx.user.id)))
        .returning()

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Programación no encontrada' })
      }

      return updated
    }),

  /**
   * Delete scheduled report
   */
  deleteSchedule: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(forumScheduledReports)
        .where(
          and(eq(forumScheduledReports.id, input.id), eq(forumScheduledReports.userId, ctx.user.id))
        )

      return { success: true }
    }),

  /**
   * Run scheduled report manually
   */
  runScheduleNow: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [schedule] = await db
        .select()
        .from(forumScheduledReports)
        .where(
          and(eq(forumScheduledReports.id, input.id), eq(forumScheduledReports.userId, ctx.user.id))
        )

      if (!schedule) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Programación no encontrada' })
      }

      // Create report based on schedule
      const [report] = await db
        .insert(forumReports)
        .values({
          userId: ctx.user.id,
          type: schedule.type,
          title: `${schedule.name} - ${new Date().toLocaleDateString('es-ES')}`,
          format: schedule.format,
          status: 'pending',
          parameters: schedule.parameters,
        })
        .returning()

      if (!report) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error creando reporte' })
      }

      // Update schedule
      await db
        .update(forumScheduledReports)
        .set({
          lastRunAt: new Date(),
          lastReportId: report.id,
          runCount: sql`${forumScheduledReports.runCount} + 1`,
          nextRunAt: calculateNextRunTime(
            schedule.schedule as {
              frequency: 'daily' | 'weekly' | 'monthly'
              dayOfWeek?: number
              dayOfMonth?: number
              hour: number
              timezone: string
            }
          ),
        })
        .where(eq(forumScheduledReports.id, input.id))

      // Generate report asynchronously
      // NOTE: In Vercel Serverless, we must await this or use a queue (Inngest/QStash).
      // For now, we await it to ensure completion, even if it adds latency.
      await generateReportAsync(report.id)

      return report
    }),
})

/**
 * Helper: Calculate next run time based on schedule
 */
function calculateNextRunTime(schedule: {
  frequency: 'daily' | 'weekly' | 'monthly'
  dayOfWeek?: number
  dayOfMonth?: number
  hour: number
  timezone: string
}): Date {
  const now = new Date()
  const next = new Date()

  // Set hour
  next.setHours(schedule.hour, 0, 0, 0)

  // If already past today's scheduled time, move to next day
  if (next <= now) {
    next.setDate(next.getDate() + 1)
  }

  switch (schedule.frequency) {
    case 'daily':
      // Already set
      break
    case 'weekly':
      // Move to next occurrence of dayOfWeek
      const targetDay = schedule.dayOfWeek ?? 1 // Default Monday
      const currentDay = next.getDay()
      const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7
      next.setDate(next.getDate() + daysUntilTarget)
      break
    case 'monthly':
      // Move to dayOfMonth
      const targetDate = schedule.dayOfMonth ?? 1
      next.setDate(targetDate)
      if (next <= now) {
        next.setMonth(next.getMonth() + 1)
      }
      break
  }

  return next
}

/**
 * Helper: Generate report asynchronously
 */
async function generateReportAsync(reportId: string): Promise<void> {
  try {
    // Get report details first to verify it exists and get userId for security
    const [report] = await db.select().from(forumReports).where(eq(forumReports.id, reportId))

    if (!report) return

    // Update status to generating (defense in depth: include userId filter)
    await db
      .update(forumReports)
      .set({ status: 'generating' })
      .where(and(eq(forumReports.id, reportId), eq(forumReports.userId, report.userId)))

    // Get debates
    const debateIds = (report.parameters as { debateIds?: string[] })?.debateIds ?? []
    const debates =
      debateIds.length > 0
        ? await db.select().from(forumDebates).where(inArray(forumDebates.id, debateIds))
        : []

    // Calculate summary
    const completedDebates = debates.filter((d) => d.status === 'completed')
    const avgConsensus =
      completedDebates.length > 0
        ? completedDebates.reduce((sum, d) => sum + (d.consensusScore ?? 0), 0) /
          completedDebates.length
        : 0

    // TODO: Generate actual PDF/HTML based on format
    // For now, just update with summary

    await db
      .update(forumReports)
      .set({
        status: 'completed',
        generatedAt: new Date(),
        summary: {
          totalDebates: debates.length,
          avgConsensus,
          keyInsights: completedDebates.slice(0, 3).map((d) => d.question.substring(0, 100)),
        },
        // TODO: Set fileUrl after uploading to storage
      })
      .where(eq(forumReports.id, reportId))
  } catch (error) {
    // Update status to failed
    await db
      .update(forumReports)
      .set({
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      .where(eq(forumReports.id, reportId))
  }
}
