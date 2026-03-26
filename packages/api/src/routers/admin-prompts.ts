import { adminProcedure, publicProcedure, router } from '../trpc'
import { z } from 'zod'
import { db } from '@quoorum/db'
import { sql } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { logger } from '../lib/logger'
import { clearPromptFromCache } from '../lib/get-system-prompt'
import { trackAICall } from '@quoorum/quoorum/ai-cost-tracking'

// Validation schemas
const systemPromptSchema = z.object({
  key: z.string().min(3).max(255),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(['debates', 'context', 'experts', 'departments', 'frameworks', 'narrative']),
  prompt: z.string().min(10),
  is_active: z.boolean().default(true),
})

function extractRows<T = Record<string, unknown>>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[]
  }

  if (result && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows?: unknown }).rows
    return Array.isArray(rows) ? (rows as T[]) : []
  }

  return []
}

function buildUpdateAssignments(updates: Record<string, unknown>) {
  const entries = Object.entries(updates).filter(([, value]) => value !== undefined)
  if (entries.length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'No hay cambios para aplicar',
    })
  }

  return entries
    .map(([key, value]) => sql`${sql.identifier(key)} = ${value}`)
    .reduce((acc, curr) => sql`${acc}, ${curr}`)
}

export const adminPromptsRouter = router({
  // Get all prompts (admin only)
  list: adminProcedure
    .query(async () => {
      try {
        const result = await db.execute(sql`
          SELECT id, key, name, description, category, prompt, is_active, version, created_at, updated_at
          FROM system_prompts
          ORDER BY category, name
        `)

        return extractRows(result)
      } catch (error) {
        logger.error('[adminPromptsRouter.list] Error fetching prompts', { error })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al obtener los prompts',
        })
      }
    }),

  // Get prompts by category
  getByCategory: adminProcedure
    .input(z.object({
      category: z.enum(['debates', 'context', 'experts', 'departments', 'frameworks', 'narrative']),
    }))
    .query(async ({ input }) => {
      try {
        const result = await db.execute(sql`
          SELECT id, key, name, description, category, prompt, is_active, version
          FROM system_prompts
          WHERE category = ${input.category} AND is_active = true
          ORDER BY name
        `)

        return extractRows(result)
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
        const rows = extractRows(result)

        if (rows.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Prompt con clave "${input.key}" no encontrado`,
          })
        }

        return rows[0]
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
  create: adminProcedure
    .input(systemPromptSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const adminUserId = ctx.userId
        if (!adminUserId) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Usuario no autenticado' })
        }

        // Check if key already exists
        const existing = await db.execute(sql`
          SELECT id FROM system_prompts WHERE key = ${input.key} LIMIT 1
        `)
        const existingRows = extractRows(existing)

        if (existingRows.length > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Ya existe un prompt con esta clave',
          })
        }

        const result = await db.execute(sql`
          INSERT INTO system_prompts (key, name, description, category, prompt, created_by)
          VALUES (${input.key}, ${input.name}, ${input.description || null}, ${input.category}, ${input.prompt}, ${adminUserId})
          RETURNING id, key, name, category, created_at
        `)
        const rows = extractRows(result)

        logger.info('[adminPromptsRouter.create] Prompt creado', {
          key: input.key,
          category: input.category,
        })

        return rows[0] ?? null
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
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        updates: systemPromptSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const adminUserId = ctx.userId
        if (!adminUserId) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Usuario no autenticado' })
        }

        // Build update query dynamically
        const updates = {
          ...input.updates,
          updated_at: new Date(),
          updated_by: adminUserId,
          version: sql`version + 1`,
        }

        const result = await db.execute(sql`
          UPDATE system_prompts
          SET 
            ${buildUpdateAssignments(updates)}
          WHERE id = ${input.id}
          RETURNING id, key, name, version, updated_at
        `)
        const rows = extractRows(result)

        if (rows.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Prompt no encontrado',
          })
        }

        // Clear cache for this prompt so it's reloaded immediately
        const promptRow = rows[0] as Record<string, unknown>
        const promptKey = typeof promptRow.key === 'string' ? promptRow.key : String(promptRow.key || '')
        if (promptKey) {
          clearPromptFromCache(promptKey)
        }

        logger.info('[adminPromptsRouter.update] Prompt actualizado', {
          promptId: input.id,
          updatedBy: adminUserId,
          key: promptKey,
        })

        return rows[0]
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
  delete: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const adminUserId = ctx.userId
        if (!adminUserId) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Usuario no autenticado' })
        }

        const result = await db.execute(sql`
          UPDATE system_prompts 
          SET is_active = false, updated_at = now(), updated_by = ${adminUserId}
          WHERE id = ${input.id}
          RETURNING id
        `)
        const rows = extractRows(result)

        if (rows.length === 0) {
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
  test: adminProcedure
    .input(
      z.object({
        promptId: z.string().uuid().optional(),
        key: z.string().optional(),
        testInput: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const adminUserId = ctx.userId
        if (!adminUserId) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Usuario no autenticado' })
        }

        // Get the prompt
        let promptData: Record<string, unknown> | undefined
        if (input.promptId) {
          const result = await db.execute(sql`
            SELECT prompt FROM system_prompts WHERE id = ${input.promptId} LIMIT 1
          `)
          promptData = extractRows(result)[0]
        } else if (input.key) {
          const result = await db.execute(sql`
            SELECT prompt FROM system_prompts WHERE key = ${input.key} LIMIT 1
          `)
          promptData = extractRows(result)[0]
        }

        const promptText =
          typeof promptData?.prompt === 'string' ? promptData.prompt : undefined

        if (!promptText) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Prompt no encontrado',
          })
        }

        // Test with AI client
        const { getAIClient } = await import('@quoorum/ai')
        const aiClient = getAIClient()
        const startTime = Date.now()

        try {
          const response = await aiClient.generate(input.testInput, {
            systemPrompt: promptText,
            modelId: 'claude-3-5-sonnet-20241022',
            maxTokens: 500,
          })
          const responseText = response.text

          // Track AI cost
          void trackAICall({
            userId: adminUserId,
            operationType: 'generic_ai_call',
            provider: 'anthropic',
            modelId: 'claude-3-5-sonnet-20241022',
            promptTokens: 0,
            completionTokens: Math.ceil(responseText.length / 4),
            latencyMs: Date.now() - startTime,
            success: true,
            inputSummary: input.testInput.substring(0, 500),
            outputSummary: responseText.substring(0, 500),
          })

          logger.info('[adminPromptsRouter.test] Prompt probado exitosamente')

          return {
            success: true,
            response: responseText.substring(0, 1000), // First 1000 chars as preview
            fullLength: responseText.length,
          }
        } catch (error) {
          // Track failed AI call
          void trackAICall({
            userId: adminUserId,
            operationType: 'generic_ai_call',
            provider: 'anthropic',
            modelId: 'claude-3-5-sonnet-20241022',
            promptTokens: 0,
            completionTokens: 0,
            latencyMs: Date.now() - startTime,
            success: false,
            errorMessage: error instanceof Error ? error.message : String(error),
            inputSummary: input.testInput.substring(0, 500),
          })

          logger.error('[adminPromptsRouter.test] Error', { error })
          throw error instanceof TRPCError
            ? error
            : new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error al probar el prompt',
              })
        }
      } catch (error) {
        logger.error('[adminPromptsRouter.test] Error general', { error })
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Error al probar el prompt',
            })
      }
    }),
})
