/**
 * Forum Public API Router
 *
 * Public API endpoints for Forum integrations.
 * Requires API key authentication for external access.
 *
 * Endpoints:
 * - POST /api/forum/debates - Create a new debate
 * - GET /api/forum/debates/:id - Get debate details
 * - GET /api/forum/debates/:id/status - Get debate status
 * - POST /api/forum/webhooks - Register a webhook
 * - DELETE /api/forum/webhooks/:id - Remove a webhook
 * - GET /api/forum/webhooks - List webhooks
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import {
  forumDebates,
  forumWebhooks,
  forumApiKeys,
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
  question: z.string().min(10).max(1000),
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
    'X-Wallie-Event': event,
    'X-Wallie-Timestamp': payload.timestamp,
  }

  if (webhook.secret) {
    headers['X-Wallie-Signature'] = `sha256=${signWebhookPayload(payload, webhook.secret)}`
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

export const forumPublicApiRouter = router({
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
      const keyPrefix = 'wf_' // wallie forum
      const keyValue = generateId(32)
      const fullKey = `${keyPrefix}${keyValue}`

      // Hash the key for storage (we'll only show the full key once)
      const hashedKey = createHmac('sha256', 'wallie-forum-api')
        .update(fullKey)
        .digest('hex')

      const [apiKey] = await db
        .insert(forumApiKeys)
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
        id: forumApiKeys.id,
        name: forumApiKeys.name,
        keyPrefix: forumApiKeys.keyPrefix,
        scopes: forumApiKeys.scopes,
        lastUsedAt: forumApiKeys.lastUsedAt,
        expiresAt: forumApiKeys.expiresAt,
        createdAt: forumApiKeys.createdAt,
        isActive: forumApiKeys.isActive,
      })
      .from(forumApiKeys)
      .where(eq(forumApiKeys.userId, ctx.user.id))
      .orderBy(desc(forumApiKeys.createdAt))

    return keys
  }),

  /**
   * Revoke API key
   */
  revokeApiKey: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(forumApiKeys)
        .set({ isActive: false, revokedAt: new Date() })
        .where(
          and(
            eq(forumApiKeys.id, input.id),
            eq(forumApiKeys.userId, ctx.user.id)
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
        .insert(forumDebates)
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
        name: 'forum/whatsapp-debate.created',
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
        .from(forumWebhooks)
        .where(
          and(
            eq(forumWebhooks.userId, ctx.user.id),
            eq(forumWebhooks.isActive, true)
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
        .from(forumDebates)
        .where(
          and(
            eq(forumDebates.id, input.id),
            eq(forumDebates.userId, ctx.user.id)
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
          id: forumDebates.id,
          status: forumDebates.status,
          consensusScore: forumDebates.consensusScore,
          completedAt: forumDebates.completedAt,
        })
        .from(forumDebates)
        .where(
          and(
            eq(forumDebates.id, input.id),
            eq(forumDebates.userId, ctx.user.id)
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
      const conditions = [eq(forumDebates.userId, ctx.user.id)]

      if (input.status) {
        conditions.push(eq(forumDebates.status, input.status))
      }

      const debates = await db
        .select({
          id: forumDebates.id,
          question: forumDebates.question,
          status: forumDebates.status,
          consensusScore: forumDebates.consensusScore,
          createdAt: forumDebates.createdAt,
          completedAt: forumDebates.completedAt,
        })
        .from(forumDebates)
        .where(and(...conditions))
        .orderBy(desc(forumDebates.createdAt))
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
        .select({ count: forumWebhooks.id })
        .from(forumWebhooks)
        .where(eq(forumWebhooks.userId, ctx.user.id))

      if (existingCount.length >= 10) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Maximum 10 webhooks allowed',
        })
      }

      // Generate secret if not provided
      const secret = input.secret ?? generateId(32)

      const [webhook] = await db
        .insert(forumWebhooks)
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
        id: forumWebhooks.id,
        name: forumWebhooks.name,
        url: forumWebhooks.url,
        events: forumWebhooks.events,
        isActive: forumWebhooks.isActive,
        lastTriggeredAt: forumWebhooks.lastTriggeredAt,
        failCount: forumWebhooks.failCount,
        createdAt: forumWebhooks.createdAt,
      })
      .from(forumWebhooks)
      .where(eq(forumWebhooks.userId, ctx.user.id))
      .orderBy(desc(forumWebhooks.createdAt))

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
        .update(forumWebhooks)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(forumWebhooks.id, id),
            eq(forumWebhooks.userId, ctx.user.id)
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
        .delete(forumWebhooks)
        .where(
          and(
            eq(forumWebhooks.id, input.id),
            eq(forumWebhooks.userId, ctx.user.id)
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
        .from(forumWebhooks)
        .where(
          and(
            eq(forumWebhooks.id, input.id),
            eq(forumWebhooks.userId, ctx.user.id)
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
          message: 'This is a test webhook from Wallie Forum API',
          timestamp: new Date().toISOString(),
        }
      )

      return { success, message: success ? 'Webhook test successful' : 'Webhook test failed' }
    }),
})
