import { protectedProcedure, publicProcedure, router } from '@/trpc'
import { z } from 'zod'
import { db } from '@quoorum/db'
import { sql, eq, and } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { logger } from '@/lib/logger'

// Validation schemas
const systemPromptSchema = z.object({
  key: z.string().min(3).max(255),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(['debates', 'context', 'experts', 'departments', 'frameworks', 'narrative']),
  prompt: z.string().min(10),
  is_active: z.boolean().default(true),
})

export const adminPromptsRouter = router({
  // Get all prompts (admin only)
  list: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Check if user is admin
        const { profiles } = await import('@quoorum/db/schema')
        const [profile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, ctx.userId))
          .limit(1)

        if (!profile?.isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Solo administradores pueden acceder a los prompts del sistema',
          })
        }

        // Get all prompts from custom SQL since we're using raw SQL
        const result = await db.execute(sql`
          SELECT id, key, name, description, category, prompt, is_active, version, created_at, updated_at
          FROM system_prompts
          ORDER BY category, name
        `)

        return result.rows || []
      } catch (error) {
        logger.error('[adminPromptsRouter.list] Error fetching prompts', { error })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al obtener los prompts',
        })
      }
    }),

  // Get prompts by category
  getByCategory: protectedProcedure
    .input(z.object({
      category: z.enum(['debates', 'context', 'experts', 'departments', 'frameworks', 'narrative']),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { profiles } = await import('@quoorum/db/schema')
        const [profile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, ctx.userId))
          .limit(1)

        if (!profile?.isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Solo administradores pueden acceder',
          })
        }

        const result = await db.execute(sql`
          SELECT id, key, name, description, category, prompt, is_active, version
          FROM system_prompts
          WHERE category = ${input.category} AND is_active = true
          ORDER BY name
        `)

        return result.rows || []
      } catch (error) {
        logger.error('[adminPromptsRouter.getByCategory] Error', { error })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al obtener los prompts',
        })
      }
    }),

  // Get single prompt by key
  getByKey: publicProcedure
    .input(z.object({
      key: z.string().min(3),
    }))
    .query(async ({ input }) => {
      try {
        const result = await db.execute(sql`
          SELECT id, key, name, prompt
          FROM system_prompts
          WHERE key = ${input.key} AND is_active = true
          LIMIT 1
        `)

        if (!result.rows || result.rows.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Prompt con clave "${input.key}" no encontrado`,
          })
        }

        return result.rows[0]
      } catch (error) {
        logger.error('[adminPromptsRouter.getByKey] Error', { error, key: input.key })
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Error al obtener el prompt',
            })
      }
    }),

  // Create new prompt (admin only)
  create: protectedProcedure
    .input(systemPromptSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { profiles } = await import('@quoorum/db/schema')
        const [profile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, ctx.userId))
          .limit(1)

        if (!profile?.isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Solo administradores pueden crear prompts',
          })
        }

        // Check if key already exists
        const existing = await db.execute(sql`
          SELECT id FROM system_prompts WHERE key = ${input.key} LIMIT 1
        `)

        if (existing.rows && existing.rows.length > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Ya existe un prompt con esta clave',
          })
        }

        const result = await db.execute(sql`
          INSERT INTO system_prompts (key, name, description, category, prompt, created_by)
          VALUES (${input.key}, ${input.name}, ${input.description || null}, ${input.category}, ${input.prompt}, ${profile.userId})
          RETURNING id, key, name, category, created_at
        `)

        logger.info('[adminPromptsRouter.create] Prompt creado', {
          key: input.key,
          category: input.category,
        })

        return result.rows?.[0]
      } catch (error) {
        logger.error('[adminPromptsRouter.create] Error', { error })
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Error al crear el prompt',
            })
      }
    }),

  // Update prompt (admin only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        updates: systemPromptSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { profiles } = await import('@quoorum/db/schema')
        const [profile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, ctx.userId))
          .limit(1)

        if (!profile?.isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Solo administradores pueden actualizar prompts',
          })
        }

        // Build update query dynamically
        const updates = {
          ...input.updates,
          updated_at: new Date(),
          updated_by: profile.userId,
          version: sql`version + 1`,
        }

        const result = await db.execute(sql`
          UPDATE system_prompts
          SET 
            ${Object.entries(updates)
              .filter(([key]) => key !== 'id')
              .map(([key, value]) => sql`${sql.identifier(key)} = ${value}`)
              .reduce((acc, curr) => sql`${acc}, ${curr}`)}
          WHERE id = ${input.id}
          RETURNING id, key, name, version, updated_at
        `)

        if (!result.rows || result.rows.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Prompt no encontrado',
          })
        }

        logger.info('[adminPromptsRouter.update] Prompt actualizado', {
          promptId: input.id,
          updatedBy: profile.userId,
        })

        return result.rows[0]
      } catch (error) {
        logger.error('[adminPromptsRouter.update] Error', { error })
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Error al actualizar el prompt',
            })
      }
    }),

  // Delete prompt (admin only - soft delete via is_active)
  delete: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { profiles } = await import('@quoorum/db/schema')
        const [profile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, ctx.userId))
          .limit(1)

        if (!profile?.isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Solo administradores pueden eliminar prompts',
          })
        }

        const result = await db.execute(sql`
          UPDATE system_prompts
          SET is_active = false, updated_at = now(), updated_by = ${profile.userId}
          WHERE id = ${input.id}
          RETURNING id
        `)

        if (!result.rows || result.rows.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Prompt no encontrado',
          })
        }

        logger.info('[adminPromptsRouter.delete] Prompt eliminado', {
          promptId: input.id,
        })

        return { success: true }
      } catch (error) {
        logger.error('[adminPromptsRouter.delete] Error', { error })
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Error al eliminar el prompt',
            })
      }
    }),

  // Test prompt with sample input
  test: protectedProcedure
    .input(
      z.object({
        promptId: z.string().uuid().optional(),
        key: z.string().optional(),
        testInput: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { profiles } = await import('@quoorum/db/schema')
        const [profile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, ctx.userId))
          .limit(1)

        if (!profile?.isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Solo administradores pueden probar prompts',
          })
        }

        // Get the prompt
        let promptData
        if (input.promptId) {
          const result = await db.execute(sql`
            SELECT prompt FROM system_prompts WHERE id = ${input.promptId} LIMIT 1
          `)
          promptData = result.rows?.[0]
        } else if (input.key) {
          const result = await db.execute(sql`
            SELECT prompt FROM system_prompts WHERE key = ${input.key} LIMIT 1
          `)
          promptData = result.rows?.[0]
        }

        if (!promptData) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Prompt no encontrado',
          })
        }

        // Test with AI client
        const { getAIClient } = await import('@quoorum/ai')
        const aiClient = getAIClient()

        const response = await aiClient.generateWithSystemPrompt(
          promptData.prompt,
          input.testInput,
          {
            model: 'claude-3-5-sonnet-20241022',
            maxTokens: 500,
          }
        )

        logger.info('[adminPromptsRouter.test] Prompt probado exitosamente')

        return {
          success: true,
          response: response.substring(0, 1000), // First 1000 chars as preview
          fullLength: response.length,
        }
      } catch (error) {
        logger.error('[adminPromptsRouter.test] Error', { error })
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Error al probar el prompt',
            })
      }
    }),
})
