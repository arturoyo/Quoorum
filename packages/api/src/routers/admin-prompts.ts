import { protectedProcedure, publicProcedure, router } from '../trpc'
import { z } from 'zod'
import { db } from '@quoorum/db'
import { sql, eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { logger } from '../lib/logger'
import { clearPromptFromCache } from '../lib/get-system-prompt'
import { trackAICall } from '@quoorum/quoorum/ai-cost-tracking'

// Helper to check if user is admin
async function isUserAdmin(userId: string): Promise<boolean> {
  const { adminUsers } = await import('@quoorum/db/schema')
  const [adminUser] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.userId, userId))
    .limit(1)
  return !!adminUser
}

// Validation schemas
const systemPromptSchema = z.object({
  key: z.string().min(3).max(255),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(['debates', 'context', 'experts', 'departments', 'frameworks', 'narrative']),
  prompt: z.string().min(10),
  is_active: z.boolean().default(true),
  // New fields for debate flow
  phase: z.number().int().min(1).max(5).optional(),
  system_prompt: z.string().optional(),
  variables: z.array(z.string()).optional(),
  recommended_model: z.string().optional(),
  economic_model: z.string().optional(),
  balanced_model: z.string().optional(),
  performance_model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  order_in_phase: z.number().int().optional(),
})

export const adminPromptsRouter = router({
  // Get all prompts (admin only) with optional phase filter
  list: protectedProcedure
    .input(z.object({
      phase: z.number().int().min(1).max(5).optional(),
      category: z.string().optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      try {
        // Check if user is admin
        if (!(await isUserAdmin(ctx.userId))) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Solo administradores pueden acceder a los prompts del sistema',
          })
        }

        // Build WHERE clause dynamically
        const conditions: string[] = ['1=1']
        const params: any[] = []

        if (input?.phase !== undefined) {
          params.push(input.phase)
          conditions.push(`phase = $${params.length}`)
        }

        if (input?.category) {
          params.push(input.category)
          conditions.push(`category = $${params.length}`)
        }

        if (input?.isActive !== undefined) {
          params.push(input.isActive)
          conditions.push(`is_active = $${params.length}`)
        }

        const whereClause = conditions.join(' AND ')

        // Get all prompts with new fields
        const query = `
          SELECT
            id, key, name, description, category, prompt, is_active, version,
            created_at, updated_at,
            phase, system_prompt, variables,
            recommended_model, economic_model, balanced_model, performance_model,
            temperature, max_tokens, order_in_phase
          FROM system_prompts
          WHERE ${whereClause}
          ORDER BY
            COALESCE(phase, 999),
            COALESCE(order_in_phase, 999),
            category, name
        `

        const result = await db.execute(sql.raw(query, params))

        return result
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
        if (!(await isUserAdmin(ctx.userId))) {
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

        return result
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

        if (!result || result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Prompt con clave "${input.key}" no encontrado`,
          })
        }

        return result[0]
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
        if (!(await isUserAdmin(ctx.userId))) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Solo administradores pueden crear prompts',
          })
        }

        // Check if key already exists
        const existing = await db.execute(sql`
          SELECT id FROM system_prompts WHERE key = ${input.key} LIMIT 1
        `)

        if (existing && existing.length > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Ya existe un prompt con esta clave',
          })
        }

        const result = await db.execute(sql`
          INSERT INTO system_prompts (key, name, description, category, prompt, created_by)
          VALUES (${input.key}, ${input.name}, ${input.description || null}, ${input.category}, ${input.prompt}, ${ctx.userId})
          RETURNING id, key, name, category, created_at
        `)

        logger.info('[adminPromptsRouter.create] Prompt creado', {
          key: input.key,
          category: input.category,
        })

        return result?.[0]
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

  // Update prompt (admin only) - creates version snapshot before updating
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        updates: systemPromptSchema.partial(),
        changeReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!(await isUserAdmin(ctx.userId))) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Solo administradores pueden actualizar prompts',
          })
        }

        // 1. Get current prompt state for version snapshot
        const currentPrompt = await db.execute(sql`
          SELECT *
          FROM system_prompts
          WHERE id = ${input.id}
          LIMIT 1
        `)

        if (!currentPrompt || currentPrompt.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Prompt no encontrado',
          })
        }

        const current = currentPrompt[0] as Record<string, any>

        // 2. Create version snapshot before updating
        await db.execute(sql`
          INSERT INTO system_prompt_versions (
            prompt_id, version, prompt, system_prompt,
            recommended_model, economic_model, balanced_model, performance_model,
            temperature, max_tokens,
            changed_by, change_reason
          ) VALUES (
            ${input.id},
            ${current.version || 1},
            ${current.prompt || ''},
            ${current.system_prompt || null},
            ${current.recommended_model || null},
            ${current.economic_model || null},
            ${current.balanced_model || null},
            ${current.performance_model || null},
            ${current.temperature || null},
            ${current.max_tokens || null},
            ${ctx.userId},
            ${input.changeReason || 'Actualización manual'}
          )
        `)

        // 3. Build update query dynamically
        const updates = {
          ...input.updates,
          updated_at: new Date(),
          updated_by: ctx.userId,
          version: sql`version + 1`,
        }

        const result = await db.execute(sql`
          UPDATE system_prompts
          SET
            ${Object.entries(updates)
              .filter(([key]) => key !== 'id' && key !== 'changeReason')
              .map(([key, value]) => sql`${sql.identifier(key)} = ${value}`)
              .reduce((acc, curr) => sql`${acc}, ${curr}`)}
          WHERE id = ${input.id}
          RETURNING id, key, name, version, updated_at
        `)

        if (!result || result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Prompt no encontrado después de actualizar',
          })
        }

        // 4. Clear both caches
        const promptRow = result[0] as Record<string, unknown>
        const promptKey = typeof promptRow.key === 'string' ? promptRow.key : String(promptRow.key || '')
        if (promptKey) {
          clearPromptFromCache(promptKey)

          // Also clear prompt-manager cache
          try {
            const { invalidatePromptCache } = await import('@quoorum/quoorum/lib/prompt-manager')
            invalidatePromptCache(promptKey)
          } catch (error) {
            logger.warn('[adminPromptsRouter.update] Could not invalidate prompt-manager cache', { error })
          }
        }

        logger.info('[adminPromptsRouter.update] Prompt actualizado', {
          promptId: input.id,
          updatedBy: ctx.userId,
          key: promptKey,
          newVersion: promptRow.version,
        })

        return result[0]
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
        if (!(await isUserAdmin(ctx.userId))) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Solo administradores pueden eliminar prompts',
          })
        }

        const result = await db.execute(sql`
          UPDATE system_prompts
          SET is_active = false, updated_at = now(), updated_by = ${ctx.userId}
          WHERE id = ${input.id}
          RETURNING id
        `)

        if (!result || result.length === 0) {
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
        if (!(await isUserAdmin(ctx.userId))) {
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
          promptData = result?.[0]
        } else if (input.key) {
          const result = await db.execute(sql`
            SELECT prompt FROM system_prompts WHERE key = ${input.key} LIMIT 1
          `)
          promptData = result?.[0]
        }

        if (!promptData) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Prompt no encontrado',
          })
        }

        // Test with AI client
        const { getAIClient } = await import('@quoorum/ai')
        const aiClient = getAIClient() as any
        const startTime = Date.now()

        try {
          const response = await aiClient.generateWithSystem(
            promptData.prompt,
            input.testInput,
            {
              model: 'claude-3-5-sonnet-20241022',
              maxTokens: 500,
            }
          )

          // Track AI cost
          void trackAICall({
            userId: ctx.userId,
            operationType: 'generic_ai_call',
            provider: 'anthropic',
            modelId: 'claude-3-5-sonnet-20241022',
            promptTokens: 0, // getAIClient doesn't return usage yet
            completionTokens: response.length / 4, // Rough estimate: 4 chars per token
            latencyMs: Date.now() - startTime,
            success: true,
            inputSummary: input.testInput.substring(0, 500),
            outputSummary: response.substring(0, 500),
          })

          logger.info('[adminPromptsRouter.test] Prompt probado exitosamente')

          return {
            success: true,
            response: response.substring(0, 1000), // First 1000 chars as preview
            fullLength: response.length,
          }
        } catch (error) {
          // Track failed AI call
          void trackAICall({
            userId: ctx.userId,
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

  // Get version history for a prompt
  getVersions: protectedProcedure
    .input(z.object({
      promptId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        if (!(await isUserAdmin(ctx.userId))) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Solo administradores pueden ver el historial',
          })
        }

        const result = await db.execute(sql`
          SELECT
            v.id,
            v.prompt_id,
            v.version,
            v.prompt,
            v.system_prompt,
            v.recommended_model,
            v.economic_model,
            v.balanced_model,
            v.performance_model,
            v.temperature,
            v.max_tokens,
            v.change_reason,
            v.created_at,
            v.changed_by
          FROM system_prompt_versions v
          WHERE v.prompt_id = ${input.promptId}
          ORDER BY v.version DESC
        `)

        return result
      } catch (error) {
        logger.error('[adminPromptsRouter.getVersions] Error', { error })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al obtener el historial de versiones',
        })
      }
    }),

  // Revert prompt to a previous version
  revert: protectedProcedure
    .input(z.object({
      promptId: z.string().uuid(),
      version: z.number().int().positive(),
      changeReason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (!(await isUserAdmin(ctx.userId))) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Solo administradores pueden revertir prompts',
          })
        }

        // 1. Get the version snapshot to revert to
        const versionData = await db.execute(sql`
          SELECT *
          FROM system_prompt_versions
          WHERE prompt_id = ${input.promptId}
            AND version = ${input.version}
          LIMIT 1
        `)

        if (!versionData || versionData.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Versión no encontrada',
          })
        }

        const snapshot = versionData[0] as Record<string, any>

        // 2. Get current prompt to create snapshot before reverting
        const currentPrompt = await db.execute(sql`
          SELECT *
          FROM system_prompts
          WHERE id = ${input.promptId}
          LIMIT 1
        `)

        if (!currentPrompt || currentPrompt.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Prompt no encontrado',
          })
        }

        const current = currentPrompt[0] as Record<string, any>

        // 3. Create snapshot of current state
        await db.execute(sql`
          INSERT INTO system_prompt_versions (
            prompt_id, version, prompt, system_prompt,
            recommended_model, economic_model, balanced_model, performance_model,
            temperature, max_tokens,
            changed_by, change_reason
          ) VALUES (
            ${input.promptId},
            ${current.version || 1},
            ${current.prompt || ''},
            ${current.system_prompt || null},
            ${current.recommended_model || null},
            ${current.economic_model || null},
            ${current.balanced_model || null},
            ${current.performance_model || null},
            ${current.temperature || null},
            ${current.max_tokens || null},
            ${ctx.userId},
            ${`Revertido a v${input.version}: ${input.changeReason}`}
          )
        `)

        // 4. Update prompt to reverted version
        const updated = await db.execute(sql`
          UPDATE system_prompts
          SET
            prompt = ${snapshot.prompt || current.prompt},
            system_prompt = ${snapshot.system_prompt || current.system_prompt},
            recommended_model = ${snapshot.recommended_model || current.recommended_model},
            economic_model = ${snapshot.economic_model || current.economic_model},
            balanced_model = ${snapshot.balanced_model || current.balanced_model},
            performance_model = ${snapshot.performance_model || current.performance_model},
            temperature = ${snapshot.temperature || current.temperature},
            max_tokens = ${snapshot.max_tokens || current.max_tokens},
            version = version + 1,
            updated_at = NOW(),
            updated_by = ${ctx.userId}
          WHERE id = ${input.promptId}
          RETURNING id, key, name, version, updated_at
        `)

        if (!updated || updated.length === 0) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error al revertir el prompt',
          })
        }

        // 5. Clear caches
        const promptKey = typeof current.key === 'string' ? current.key : String(current.key || '')
        if (promptKey) {
          clearPromptFromCache(promptKey)

          try {
            const { invalidatePromptCache } = await import('@quoorum/quoorum/lib/prompt-manager')
            invalidatePromptCache(promptKey)
          } catch (error) {
            logger.warn('[adminPromptsRouter.revert] Could not invalidate prompt-manager cache', { error })
          }
        }

        logger.info('[adminPromptsRouter.revert] Prompt revertido', {
          promptId: input.promptId,
          fromVersion: current.version,
          toVersion: input.version,
          revertedBy: ctx.userId,
        })

        return updated[0]
      } catch (error) {
        logger.error('[adminPromptsRouter.revert] Error', { error })
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Error al revertir el prompt',
            })
      }
    }),
})
