/**
 * Quoorum Public API Router
 *
 * Public API endpoints for Quoorum integrations.
 * Requires API key authentication for external access.
 *
 * Endpoints:
 * - POST /api/quoorum/debates - Create a new debate
 * - GET /api/quoorum/debates/:id - Get debate details
 * - GET /api/quoorum/debates/:id/status - Get debate status
 * - POST /api/quoorum/webhooks - Register a webhook
 * - DELETE /api/quoorum/webhooks/:id - Remove a webhook
 * - GET /api/quoorum/webhooks - List webhooks
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import {
  quoorumDebates,
  quoorumWebhooks,
  quoorumApiKeys,
} from '@quoorum/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { inngest } from '../lib/inngest-client'
import { logger } from '../lib/logger'
import { createHmac, randomBytes } from 'crypto'

// Simple nanoid alternative
function generateId(size = 21): string {
  return randomBytes(size).toString('base64url').slice(0, size)
}

// ============================================================================
// Schemas
// ============================================================================

const createDebateSchema = z.object({
  question: z.string().min(10).max(5000, "La pregunta no puede exceder 5000 caracteres"),
  context: z.string().max(5000).optional(),
  category: z.string().max(50).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  callbackUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    'debate.created',
    'debate.started',
    'debate.completed',
    'debate.failed',
    'expert.responded',
    'consensus.reached',
  ])),
  secret: z.string().min(16).max(64).optional(),
  name: z.string().max(100).optional(),
})

const updateWebhookSchema = webhookSchema.partial().extend({
  id: z.string().uuid(),
  enabled: z.boolean().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate webhook signature for payload verification
 */
function signWebhookPayload(payload: unknown, secret: string): string {
  const stringPayload = JSON.stringify(payload)
  return createHmac('sha256', secret).update(stringPayload).digest('hex')
}

/**
 * Send webhook notification
 */
async function sendWebhook(
  webhook: { url: string; secret: string | null },
  event: string,
  data: unknown
): Promise<boolean> {
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Quoorum-Event': event,
    'X-Quoorum-Timestamp': payload.timestamp,
  }

  if (webhook.secret) {
    headers['X-Quoorum-Signature'] = `sha256=${signWebhookPayload(payload, webhook.secret)}`
  }

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10s timeout
    })

    return response.ok
  } catch (error) {
    logger.error('Webhook delivery failed', error instanceof Error ? error : undefined, { url: webhook.url, event })
    return false
  }
}

// ============================================================================
// Public API Router
// ============================================================================

export const quoorumPublicApiRouter = router({
  // ============================================
  // API KEY MANAGEMENT
  // ============================================

  /**
   * Generate a new API key
   */
  generateApiKey: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      expiresAt: z.date().optional(),
      scopes: z.array(z.enum([
        'debates:read',
        'debates:write',
        'webhooks:read',
        'webhooks:write',
      ])).default(['debates:read', 'debates:write']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Generate a secure API key
      const keyPrefix = 'q_' // quoorum
      const keyValue = generateId(32)
      const fullKey = `${keyPrefix}${keyValue}`

      // Hash the key for storage (we'll only show the full key once)
      const hashedKey = createHmac('sha256', 'quoorum-api')
        .update(fullKey)
        .digest('hex')

      const [apiKey] = await db
        .insert(quoorumApiKeys)
        .values({
          userId: ctx.user.id,
          name: input.name,
          keyHash: hashedKey,
          keyPrefix: fullKey.substring(0, 10) + '...',
          scopes: input.scopes,
          expiresAt: input.expiresAt,
        })
        .returning()

      if (!apiKey) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create API key',
        })
      }

      return {
        id: apiKey.id,
        key: fullKey, // Only returned once!
        name: apiKey.name,
        scopes: apiKey.scopes,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
        message: 'Guarda esta API key de forma segura. No podrás verla de nuevo.',
      }
    }),

  /**
   * List API keys
   */
  listApiKeys: protectedProcedure.query(async ({ ctx }) => {
    const keys = await db
      .select({
        id: quoorumApiKeys.id,
        name: quoorumApiKeys.name,
        keyPrefix: quoorumApiKeys.keyPrefix,
        scopes: quoorumApiKeys.scopes,
        lastUsedAt: quoorumApiKeys.lastUsedAt,
        expiresAt: quoorumApiKeys.expiresAt,
        createdAt: quoorumApiKeys.createdAt,
        isActive: quoorumApiKeys.isActive,
      })
      .from(quoorumApiKeys)
      .where(eq(quoorumApiKeys.userId, ctx.user.id))
      .orderBy(desc(quoorumApiKeys.createdAt))

    return keys
  }),

  /**
   * Revoke API key
   */
  revokeApiKey: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(quoorumApiKeys)
        .set({ isActive: false, revokedAt: new Date() })
        .where(
          and(
            eq(quoorumApiKeys.id, input.id),
            eq(quoorumApiKeys.userId, ctx.user.id)
          )
        )

      return { success: true }
    }),

  // ============================================
  // DEBATE API
  // ============================================

  /**
   * Create a debate via API
   */
  createDebate: protectedProcedure
    .input(createDebateSchema)
    .mutation(async ({ ctx, input }) => {
      const [debate] = await db
        .insert(quoorumDebates)
        .values({
          userId: ctx.user.id,
          question: input.question,
          context: input.context ? { background: input.context } : undefined,
          status: 'pending',
          metadata: {
            ...input.metadata,
            source: 'public_api',
            channel: 'api',
            callbackUrl: input.callbackUrl,
            priority: input.priority,
          },
        })
        .returning()

      if (!debate) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create debate',
        })
      }

      // Trigger the debate to run
      await inngest.send({
        name: 'quoorum/debate.created',
        data: {
          debateId: debate.id,
          userId: ctx.user.id,
          conversationId: '', // No WhatsApp conversation
          question: input.question,
        },
      })

      // Trigger webhooks for debate.created
      const webhooks = await db
        .select()
        .from(quoorumWebhooks)
        .where(
          and(
            eq(quoorumWebhooks.userId, ctx.user.id),
            eq(quoorumWebhooks.isActive, true)
          )
        )

      for (const webhook of webhooks) {
        const events = webhook.events as string[] | null
        if (events?.includes('debate.created')) {
          // Fire webhook with proper error handling (non-blocking)
          sendWebhook(
            { url: webhook.url, secret: webhook.secret },
            'debate.created',
            {
              debateId: debate.id,
              question: input.question,
              status: 'pending',
              createdAt: debate.createdAt,
            }
          ).catch((error: unknown) => {
            logger.error(
              'Webhook delivery error',
              error instanceof Error ? error : new Error(String(error)),
              { webhookId: webhook.id, debateId: debate.id }
            )
          })
        }
      }

      return {
        id: debate.id,
        question: debate.question,
        status: debate.status,
        createdAt: debate.createdAt,
        estimatedCompletion: '2-3 minutes',
      }
    }),

  /**
   * Get debate details
   */
  getDebate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [debate] = await db
        .select()
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
          )
        )

      if (!debate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Debate not found',
        })
      }

      // Extract error message from metadata if present
      const metadata = debate.metadata as Record<string, unknown> | null
      const errorMessage = metadata?.['error'] as string | undefined

      return {
        id: debate.id,
        question: debate.question,
        context: debate.context,
        status: debate.status,
        consensusScore: debate.consensusScore,
        rounds: debate.rounds,
        ranking: debate.finalRanking,
        createdAt: debate.createdAt,
        startedAt: debate.startedAt,
        completedAt: debate.completedAt,
        errorMessage,
      }
    }),

  /**
   * Get debate status (lightweight poll endpoint)
   */
  getDebateStatus: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [debate] = await db
        .select({
          id: quoorumDebates.id,
          status: quoorumDebates.status,
          consensusScore: quoorumDebates.consensusScore,
          completedAt: quoorumDebates.completedAt,
        })
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.id, input.id),
            eq(quoorumDebates.userId, ctx.user.id)
          )
        )

      if (!debate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Debate not found',
        })
      }

      return debate
    }),

  /**
   * List recent debates
   */
  listDebates: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      status: z.enum(['pending', 'in_progress', 'completed', 'failed']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const conditions = [eq(quoorumDebates.userId, ctx.user.id)]

      if (input.status) {
        conditions.push(eq(quoorumDebates.status, input.status))
      }

      const debates = await db
        .select({
          id: quoorumDebates.id,
          question: quoorumDebates.question,
          status: quoorumDebates.status,
          consensusScore: quoorumDebates.consensusScore,
          createdAt: quoorumDebates.createdAt,
          completedAt: quoorumDebates.completedAt,
        })
        .from(quoorumDebates)
        .where(and(...conditions))
        .orderBy(desc(quoorumDebates.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      return debates
    }),

  // ============================================
  // WEBHOOK MANAGEMENT
  // ============================================

  /**
   * Register a webhook
   */
  createWebhook: protectedProcedure
    .input(webhookSchema)
    .mutation(async ({ ctx, input }) => {
      // Check webhook limit (max 10 per user)
      const existingCount = await db
        .select({ count: quoorumWebhooks.id })
        .from(quoorumWebhooks)
        .where(eq(quoorumWebhooks.userId, ctx.user.id))

      if (existingCount.length >= 10) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Maximum 10 webhooks allowed',
        })
      }

      // Generate secret if not provided
      const secret = input.secret ?? generateId(32)

      const [webhook] = await db
        .insert(quoorumWebhooks)
        .values({
          userId: ctx.user.id,
          name: input.name ?? 'Webhook',
          url: input.url,
          events: input.events,
          secret,
        })
        .returning()

      if (!webhook) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create webhook',
        })
      }

      return {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        secret, // Only returned on creation
        createdAt: webhook.createdAt,
      }
    }),

  /**
   * List webhooks
   */
  listWebhooks: protectedProcedure.query(async ({ ctx }) => {
    const webhooks = await db
      .select({
        id: quoorumWebhooks.id,
        name: quoorumWebhooks.name,
        url: quoorumWebhooks.url,
        events: quoorumWebhooks.events,
        isActive: quoorumWebhooks.isActive,
        lastTriggeredAt: quoorumWebhooks.lastTriggeredAt,
        failCount: quoorumWebhooks.failCount,
        createdAt: quoorumWebhooks.createdAt,
      })
      .from(quoorumWebhooks)
      .where(eq(quoorumWebhooks.userId, ctx.user.id))
      .orderBy(desc(quoorumWebhooks.createdAt))

    return webhooks
  }),

  /**
   * Update webhook
   */
  updateWebhook: protectedProcedure
    .input(updateWebhookSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input

      const [webhook] = await db
        .update(quoorumWebhooks)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(quoorumWebhooks.id, id),
            eq(quoorumWebhooks.userId, ctx.user.id)
          )
        )
        .returning()

      if (!webhook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook not found',
        })
      }

      return webhook
    }),

  /**
   * Delete webhook
   */
  deleteWebhook: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(quoorumWebhooks)
        .where(
          and(
            eq(quoorumWebhooks.id, input.id),
            eq(quoorumWebhooks.userId, ctx.user.id)
          )
        )

      return { success: true }
    }),

  /**
   * Test webhook (sends a test event)
   */
  testWebhook: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [webhook] = await db
        .select()
        .from(quoorumWebhooks)
        .where(
          and(
            eq(quoorumWebhooks.id, input.id),
            eq(quoorumWebhooks.userId, ctx.user.id)
          )
        )

      if (!webhook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook not found',
        })
      }

      const success = await sendWebhook(
        { url: webhook.url, secret: webhook.secret },
        'test',
        {
          message: 'This is a test webhook from Quoorum API',
          timestamp: new Date().toISOString(),
        }
      )

      return { success, message: success ? 'Webhook test successful' : 'Webhook test failed' }
    }),
})
