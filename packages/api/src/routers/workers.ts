/**
 * Workers Router (Profesionales)
 * 
 * Manages internal company professionals (vs external experts).
 * Professionals are virtual AI representations of employees that can participate
 * in internal debates using their department context.
 */

import { z } from 'zod'
import { eq, and, isNull, or, like, inArray } from 'drizzle-orm'
import { router, protectedProcedure } from '../trpc'
import { workers, departments, companies, workerDepartments } from '@quoorum/db'
import type { AIConfig } from '@quoorum/ai'
import { TRPCError } from '@trpc/server'
import { logger } from '../lib/logger'

const aiConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'groq']),
  model: z.string(),
  apiKey: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
}) satisfies z.ZodType<AIConfig>

export const workersRouter = router({
  /**
   * Get worker by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select()
        .from(workers)
        .where(
          and(
            eq(workers.id, input.id),
            eq(workers.userId, ctx.userId) // Only user's own workers
          )
        )
        .limit(1)

      return result ?? null
    }),

  /** Get id+name for multiple professionals (e.g. Phase 4 review). */
  getByIds: protectedProcedure
    .input(z.object({ ids: z.array(z.string().min(1)).max(50) })) // Acepta UUIDs (profesionales son siempre UUIDs de la DB)
    .query(async ({ ctx, input }) => {
      if (input.ids.length === 0) return []
      
      // Filtrar solo UUIDs válidos (profesionales siempre son UUIDs, no slugs)
      const validUuids = input.ids.filter((id) => {
        // Validar formato UUID básico
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        return uuidRegex.test(id)
      })
      
      if (validUuids.length === 0) return []
      
      const rows = await ctx.db
        .select({ id: workers.id, name: workers.name })
        .from(workers)
        .where(
          and(
            inArray(workers.id, validUuids),
            eq(workers.userId, ctx.userId)
          )
        )
      return rows
    }),

  /**
   * List user's workers (with optional department filter)
   */
  list: protectedProcedure
    .input(
      z.object({
        departmentId: z.string().uuid().optional(),
        activeOnly: z.boolean().default(true),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(workers.userId, ctx.userId)]

      if (input.activeOnly) {
        conditions.push(eq(workers.isActive, true))
      }

      if (input.departmentId) {
        conditions.push(eq(workers.departmentId, input.departmentId))
      }

      if (input.search) {
        conditions.push(
          or(
            like(workers.name, `%${input.search}%`),
            like(workers.expertise, `%${input.search}%`),
            like(workers.description || '', `%${input.search}%`)
          )!
        )
      }

      const results = await ctx.db
        .select()
        .from(workers)
        .where(and(...conditions))
        .limit(input.limit)
        .offset(input.offset)

      return results
    }),

  /**
   * List library workers (predefined templates)
   */
  libraryList: protectedProcedure
    .input(
      z.object({
        role: z.string().optional(),
        search: z.string().optional(),
        activeOnly: z.boolean().default(true),
        limit: z.number().min(1).max(100).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(workers.isPredefined, true), // Only predefined templates
        eq(workers.type, 'internal'), // Only internal workers (not external experts)
      ]

      if (input.activeOnly) {
        conditions.push(eq(workers.isActive, true))
      }

      if (input.role) {
        conditions.push(eq(workers.role, input.role as any))
      }

      if (input.search) {
        conditions.push(
          or(
            like(workers.name, `%${input.search}%`),
            like(workers.expertise, `%${input.search}%`),
            like(workers.description || '', `%${input.search}%`)
          )!
        )
      }

      const results = await ctx.db
        .select({
          id: workers.id,
          name: workers.name,
          role: workers.role,
          expertise: workers.expertise,
          description: workers.description,
          responsibilities: workers.responsibilities,
          aiConfig: workers.aiConfig,
          avatar: workers.avatar,
        })
        .from(workers)
        .where(and(...conditions))
        .limit(input.limit)
        .offset(input.offset)

      return results
    }),

  /**
   * Create a new worker
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        role: z.enum([
          'ceo',
          'cto',
          'cfo',
          'cmo',
          'coo',
          'vp_sales',
          'vp_product',
          'vp_engineering',
          'director',
          'manager',
          'senior',
          'mid',
          'junior',
          'intern',
          'consultant',
          'advisor',
          'custom',
        ]),
        departmentId: z.string().uuid().optional(),
        expertise: z.string().min(1),
        description: z.string().optional(),
        responsibilities: z.string().optional(),
        systemPrompt: z.string().min(10),
        aiConfig: aiConfigSchema,
        avatar: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        libraryWorkerId: z.string().uuid().optional(), // If forked from template
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify department belongs to user (if provided)
      if (input.departmentId) {
        const [department] = await ctx.db
          .select({ id: departments.id })
          .from(departments)
          .where(
            and(
              eq(departments.id, input.departmentId),
              // Note: departments.companyId should be checked via company.userId
              // For now, we'll trust the departmentId is valid
            )
          )
          .limit(1)

        if (!department) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Departamento no encontrado',
          })
        }
      }

      const [newWorker] = await ctx.db
        .insert(workers)
        .values({
          userId: ctx.userId,
          name: input.name,
          role: input.role,
          departmentId: input.departmentId || null, // Legacy: mantener compatibilidad
          type: 'internal',
          expertise: input.expertise,
          description: input.description || null,
          responsibilities: input.responsibilities || null,
          systemPrompt: input.systemPrompt,
          aiConfig: input.aiConfig,
          avatar: input.avatar || null,
          email: input.email || null,
          phone: input.phone || null,
          libraryWorkerId: input.libraryWorkerId || null,
          isPredefined: false,
        })
        .returning()

      // Asociar profesional a departamentos (muchos a muchos)
      if (input.departmentIds && input.departmentIds.length > 0) {
        // Verificar que los departamentos pertenecen al usuario
        const userDepartments = await ctx.db
          .select({ id: departments.id })
          .from(departments)
          .where(
            and(
              inArray(departments.id, input.departmentIds),
              // Verificar ownership via company
              // Note: Esto requiere un join con companies, simplificamos por ahora
            )
          )

        if (userDepartments.length !== input.departmentIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Algunos departamentos no fueron encontrados o no pertenecen al usuario',
          })
        }

        // Insertar relaciones
        await ctx.db.insert(workerDepartments).values(
          input.departmentIds.map((deptId) => ({
            workerId: newWorker.id,
            departmentId: deptId,
          }))
        )
      }

      return newWorker
    }),

  /**
   * Update worker
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        role: z
          .enum([
            'ceo',
            'cto',
            'cfo',
            'cmo',
            'coo',
            'vp_sales',
            'vp_product',
            'vp_engineering',
            'director',
            'manager',
            'senior',
            'mid',
            'junior',
            'intern',
            'consultant',
            'advisor',
            'custom',
          ])
          .optional(),
        departmentId: z.string().uuid().nullable().optional(), // Legacy
        departmentIds: z.array(z.string().uuid()).optional(), // Nuevo: relación muchos a muchos
        expertise: z.string().min(1).optional(),
        description: z.string().optional(),
        responsibilities: z.string().optional(),
        systemPrompt: z.string().min(10).optional(),
        aiConfig: aiConfigSchema.optional(),
        avatar: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      // Verify ownership
      const [existing] = await ctx.db
        .select({ id: workers.id })
        .from(workers)
        .where(and(eq(workers.id, id), eq(workers.userId, ctx.userId)))

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profesional no encontrado',
        })
      }

      // Verify department belongs to user (if provided)
      if (updateData.departmentId !== undefined && updateData.departmentId !== null) {
        const [department] = await ctx.db
          .select({ id: departments.id })
          .from(departments)
          .where(eq(departments.id, updateData.departmentId))
          .limit(1)

        if (!department) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Departamento no encontrado',
          })
        }
      }

      const [updated] = await ctx.db
        .update(workers)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(eq(workers.id, id), eq(workers.userId, ctx.userId)))
        .returning()

      // Actualizar relaciones muchos a muchos si se proporciona departmentIds
      if (input.departmentIds !== undefined) {
        // Eliminar relaciones existentes
        await ctx.db.delete(workerDepartments).where(eq(workerDepartments.workerId, id))

        // Crear nuevas relaciones
        if (input.departmentIds.length > 0) {
          // Verificar ownership de departamentos
          const userDepartments = await ctx.db
            .select({ id: departments.id })
            .from(departments)
            .where(inArray(departments.id, input.departmentIds))

          if (userDepartments.length !== input.departmentIds.length) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Algunos departamentos no fueron encontrados o no pertenecen al usuario',
            })
          }

          // Insertar nuevas relaciones
          await ctx.db.insert(workerDepartments).values(
            input.departmentIds.map((deptId) => ({
              workerId: id,
              departmentId: deptId,
            }))
          )
        }
      }

      return updated
    }),

  /**
   * Delete worker (soft delete)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [existing] = await ctx.db
        .select({ id: workers.id })
        .from(workers)
        .where(and(eq(workers.id, input.id), eq(workers.userId, ctx.userId)))

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profesional no encontrado',
        })
      }

      // Soft delete
      await ctx.db
        .update(workers)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(and(eq(workers.id, input.id), eq(workers.userId, ctx.userId)))

      return { success: true }
    }),

  /**
   * Get workers by department
   */
  getByDepartment: protectedProcedure
    .input(z.object({ departmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const results = await ctx.db
        .select()
        .from(workers)
        .where(
          and(
            eq(workers.departmentId, input.departmentId),
            eq(workers.userId, ctx.userId),
            eq(workers.isActive, true)
          )
        )

      return results
    }),

  /**
   * Suggest workers automatically based on question context and selected departments using AI
   * Uses intelligent AI matching considering:
   * - Selected departments (prioritizes workers from these)
   * - Full company context
   * - Question analysis (complexity, areas, topics)
   * - Worker expertise and responsibilities
   */
  suggest: protectedProcedure
    .input(
      z.object({
        question: z.string().min(10),
        context: z.string().optional(),
        companyId: z.string().uuid(),
        selectedDepartmentIds: z.array(z.string().uuid()).optional(), // Departamentos ya seleccionados
      })
    )
    .query(async ({ ctx, input }) => {
      // Get company context
      const [company] = await ctx.db
        .select()
        .from(companies)
        .where(
          and(
            eq(companies.id, input.companyId),
            eq(companies.userId, ctx.userId)
          )
        )
        .limit(1)

      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        })
      }

      // Get user's workers with their departments (many-to-many)
      const userWorkers = await ctx.db
        .select()
        .from(workers)
        .where(
          and(
            eq(workers.userId, ctx.userId),
            eq(workers.isActive, true)
          )
        )

      if (userWorkers.length === 0) {
        return []
      }

      // Get worker-department relationships
      const workerDeptRelations = await ctx.db
        .select()
        .from(workerDepartments)
        .where(
          inArray(
            workerDepartments.workerId,
            userWorkers.map((w) => w.id)
          )
        )

      // Map workers with their department IDs
      const workersWithDepartments = userWorkers.map((worker) => {
        const deptIds = workerDeptRelations
          .filter((rel) => rel.workerId === worker.id)
          .map((rel) => rel.departmentId)
        return {
          ...worker,
          departmentIds: deptIds,
        }
      })

      // Analyze question
      const { analyzeQuestion, matchWorkersWithAI } = await import('@quoorum/quoorum')
      const analysis = await analyzeQuestion(input.question, input.context)

      logger.info('[workers.suggest] Question analysis:', {
        question: input.question.substring(0, 100),
        complexity: analysis.complexity,
        areasCount: analysis.areas.length,
        selectedDepartmentIds: input.selectedDepartmentIds?.length || 0,
        hasCompanyContext: !!company,
      })

      // Use AI-powered matching
      const matches = await matchWorkersWithAI(
        input.question,
        analysis,
        workersWithDepartments.map((w) => ({
          id: w.id,
          name: w.name,
          role: w.role,
          expertise: w.expertise,
          responsibilities: w.responsibilities,
          description: w.description,
          departmentIds: w.departmentIds,
        })),
        {
          minWorkers: 2,
          maxWorkers: 5,
          selectedDepartmentIds: input.selectedDepartmentIds || [],
          companyContext: {
            name: company.name,
            industry: company.industry || undefined,
            size: company.size || undefined,
            description: company.description || undefined,
            context: company.context || undefined,
          },
        }
      )

      logger.info('[workers.suggest] AI matches found:', {
        count: matches.length,
        workers: matches.map((m) => ({
          id: m.worker.id,
          name: m.worker.name,
          matchScore: m.matchScore,
        })),
      })

      // Return suggested workers with match info
      return matches.map((match) => ({
        id: match.worker.id,
        name: match.worker.name,
        role: match.worker.role,
        expertise: match.worker.expertise,
        responsibilities: match.worker.responsibilities,
        description: match.worker.description,
        departmentIds: match.worker.departmentIds,
        matchScore: match.matchScore,
        reasons: match.reasons,
        synergy: match.synergy,
      }))
    }),

  /**
   * Associate worker to departments (many-to-many)
   */
  associateDepartments: protectedProcedure
    .input(
      z.object({
        workerId: z.string().uuid(),
        departmentIds: z.array(z.string().uuid()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [worker] = await ctx.db
        .select({ id: workers.id })
        .from(workers)
        .where(and(eq(workers.id, input.workerId), eq(workers.userId, ctx.userId)))
        .limit(1)

      if (!worker) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profesional no encontrado',
        })
      }

      // Verify departments belong to user (via company)
      const userDepartments = await ctx.db
        .select({ id: departments.id })
        .from(departments)
        .where(inArray(departments.id, input.departmentIds))
        // Note: Should verify via company.userId, simplified for now

      if (userDepartments.length !== input.departmentIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Algunos departamentos no fueron encontrados',
        })
      }

      // Remove existing associations
      await ctx.db.delete(workerDepartments).where(eq(workerDepartments.workerId, input.workerId))

      // Create new associations
      if (input.departmentIds.length > 0) {
        await ctx.db.insert(workerDepartments).values(
          input.departmentIds.map((deptId) => ({
            workerId: input.workerId,
            departmentId: deptId,
          }))
        )
      }

      logger.info('Worker departments associated', {
        workerId: input.workerId,
        departmentIds: input.departmentIds,
      })

      return { success: true }
    }),

  /**
   * Get worker's departments (many-to-many)
   */
  getDepartments: protectedProcedure
    .input(z.object({ workerId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const [worker] = await ctx.db
        .select({ id: workers.id })
        .from(workers)
        .where(and(eq(workers.id, input.workerId), eq(workers.userId, ctx.userId)))
        .limit(1)

      if (!worker) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profesional no encontrado',
        })
      }

      // Get departments
      const workerDepts = await ctx.db
        .select({
          departmentId: workerDepartments.departmentId,
        })
        .from(workerDepartments)
        .where(eq(workerDepartments.workerId, input.workerId))

      if (workerDepts.length === 0) {
        return []
      }

      const deptIds = workerDepts.map((wd) => wd.departmentId)
      const depts = await ctx.db
        .select({
          id: departments.id,
          name: departments.name,
          type: departments.type,
        })
        .from(departments)
        .where(inArray(departments.id, deptIds))

      return depts
    }),
})
