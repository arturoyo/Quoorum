/**
 * Context Files Router
 * 
 * CRUD operations for user context files (text documents that provide
 * additional context to debates about the user's project, company, etc.)
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import { userContextFiles } from '@quoorum/db/schema'
import { eq, and, desc, like, or } from 'drizzle-orm'

// ============================================================================
// SCHEMAS
// ============================================================================

const createContextFileSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(255),
  description: z.string().max(1000).optional(),
  content: z.string().min(10, 'El contenido debe tener al menos 10 caracteres').max(500000), // ~500KB text limit
  contentType: z.string().default('text/plain'),
  tags: z.string().optional(),
  order: z.number().int().min(0).default(0),
})

const updateContextFileSchema = createContextFileSchema.partial().extend({
  id: z.string().uuid(),
})

const listContextFilesSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  activeOnly: z.boolean().default(true),
  search: z.string().optional(),
})

// ============================================================================
// ROUTER
// ============================================================================

export const contextFilesRouter = router({
  /**
   * List user's context files
   */
  list: protectedProcedure
    .input(listContextFilesSchema)
    .query(async ({ ctx, input }) => {
      // FK references profiles.id
      const conditions = [eq(userContextFiles.userId, ctx.userId)]

      if (input.activeOnly) {
        conditions.push(eq(userContextFiles.isActive, true))
      }

      if (input.search) {
        conditions.push(
          or(
            like(userContextFiles.name, `%${input.search}%`),
            like(userContextFiles.description || '', `%${input.search}%`),
            like(userContextFiles.content, `%${input.search}%`)
          )!
        )
      }

      const results = await db
        .select()
        .from(userContextFiles)
        .where(and(...conditions))
        .orderBy(desc(userContextFiles.order), desc(userContextFiles.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      // Calculate file size if not set (backward compatibility)
      const resultsWithSize = results.map((file) => ({
        ...file,
        fileSize: file.fileSize || Buffer.byteLength(file.content || '', 'utf8'),
      }))

      return resultsWithSize
    }),

  /**
   * Get context file by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [file] = await db
        .select()
        .from(userContextFiles)
        .where(
          and(
            eq(userContextFiles.id, input.id),
            eq(userContextFiles.userId, ctx.userId) // FK references profiles.id
          )
        )
        .limit(1)

      if (!file) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Archivo de contexto no encontrado',
        })
      }

      return {
        ...file,
        fileSize: file.fileSize || Buffer.byteLength(file.content || '', 'utf8'),
      }
    }),

  /**
   * Get all active context files content (for debate inclusion)
   */
  getActiveContent: protectedProcedure.query(async ({ ctx }) => {
    const files = await db
      .select({
        name: userContextFiles.name,
        content: userContextFiles.content,
        order: userContextFiles.order,
      })
      .from(userContextFiles)
      .where(
        and(
          eq(userContextFiles.userId, ctx.userId), // FK references profiles.id
          eq(userContextFiles.isActive, true)
        )
      )
      .orderBy(userContextFiles.order, userContextFiles.createdAt)

    // Combine all active context files into a single string
    const combinedContext = files
      .map((file) => `## ${file.name}\n\n${file.content}`)
      .join('\n\n---\n\n')

    return {
      files: files.map((f) => ({
        name: f.name,
        order: f.order || 0,
      })),
      combinedContext,
      totalFiles: files.length,
    }
  }),

  /**
   * Create new context file
   */
  create: protectedProcedure
    .input(createContextFileSchema)
    .mutation(async ({ ctx, input }) => {
      const fileSize = Buffer.byteLength(input.content, 'utf8')

      const [file] = await db
        .insert(userContextFiles)
        .values({
          userId: ctx.userId, // FK references profiles.id
          name: input.name,
          description: input.description,
          content: input.content,
          contentType: input.contentType,
          tags: input.tags,
          order: input.order,
          fileSize,
          isActive: true,
        })
        .returning()

      return file
    }),

  /**
   * Update existing context file
   */
  update: protectedProcedure
    .input(updateContextFileSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Verify ownership
      const [existing] = await db
        .select({ id: userContextFiles.id })
        .from(userContextFiles)
        .where(
          and(
            eq(userContextFiles.id, id),
            eq(userContextFiles.userId, ctx.userId) // FK references profiles.id
          )
        )

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Archivo de contexto no encontrado',
        })
      }

      // Calculate file size if content is being updated
      const updateData: Partial<typeof userContextFiles.$inferInsert> = {
        ...data,
        updatedAt: new Date(),
      }

      if (data.content) {
        updateData.fileSize = Buffer.byteLength(data.content, 'utf8')
      }

      const [updated] = await db
        .update(userContextFiles)
        .set(updateData)
        .where(eq(userContextFiles.id, id))
        .returning()

      return updated
    }),

  /**
   * Delete context file (soft delete by setting isActive = false)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [existing] = await db
        .select({ id: userContextFiles.id })
        .from(userContextFiles)
        .where(
          and(
            eq(userContextFiles.id, input.id),
            eq(userContextFiles.userId, ctx.userId) // FK references profiles.id
          )
        )

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Archivo de contexto no encontrado',
        })
      }

      // Soft delete
      await db
        .update(userContextFiles)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(userContextFiles.id, input.id))

      return { success: true }
    }),

  /**
   * Toggle active status
   */
  toggleActive: protectedProcedure
    .input(z.object({ id: z.string().uuid(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [existing] = await db
        .select({ id: userContextFiles.id })
        .from(userContextFiles)
        .where(
          and(
            eq(userContextFiles.id, input.id),
            eq(userContextFiles.userId, ctx.userId) // FK references profiles.id
          )
        )

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Archivo de contexto no encontrado',
        })
      }

      const [updated] = await db
        .update(userContextFiles)
        .set({
          isActive: input.isActive,
          updatedAt: new Date(),
        })
        .where(eq(userContextFiles.id, input.id))
        .returning()

      return updated
    }),
})
