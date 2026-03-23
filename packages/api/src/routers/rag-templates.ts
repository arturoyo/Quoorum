/**
 * RAG Templates Router
 *
 * Provides API for:
 * - Listing templates by category/industry
 * - Importing templates as documents
 * - Rating & feedback
 * - Usage tracking
 */

import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import {
  ragTemplates,
  ragTemplateUsage,
  vectorDocuments,
  vectorChunks,
} from '@quoorum/db/schema'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { logger } from '../lib/logger'
import { processDocument } from '../lib/rag/document-processor'
import { chunkDocument } from '../lib/rag/chunking'
import { generateEmbedding } from '@quoorum/ai/embeddings'
import { trackRAGUsage } from '../lib/rag/analytics-helper'

export const ragTemplatesRouter = router({
  /**
   * List all active templates
   */
  list: protectedProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          industry: z.string().optional(),
          featuredOnly: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      try {
        const filters = [eq(ragTemplates.isActive, true)]

        if (input?.category) {
          filters.push(eq(ragTemplates.category, input.category))
        }

        if (input?.industry) {
          filters.push(eq(ragTemplates.industry, input.industry))
        }

        if (input?.featuredOnly) {
          filters.push(eq(ragTemplates.isFeatured, true))
        }

        const templates = await db
          .select()
          .from(ragTemplates)
          .where(and(...filters))
          .orderBy(
            desc(ragTemplates.isFeatured),
            desc(ragTemplates.usageCount)
          )

        return templates
      } catch (error) {
        logger.error('[ragTemplates.list] Failed to list templates', {
          error: error instanceof Error ? error.message : String(error),
        })

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list templates',
        })
      }
    }),

  /**
   * Get template by slug
   */
  getBySlug: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const template = await db.query.ragTemplates.findFirst({
          where: eq(ragTemplates.slug, input.slug),
        })

        if (!template) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found',
          })
        }

        return template
      } catch (error) {
        logger.error('[ragTemplates.getBySlug] Failed', { error })

        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get template',
        })
      }
    }),

  /**
   * Import template as documents
   *
   * Creates vector documents from template files
   */
  importTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string().uuid(),
        companyId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get template
        const template = await db.query.ragTemplates.findFirst({
          where: eq(ragTemplates.id, input.templateId),
        })

        if (!template) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found',
          })
        }

        const templateFiles = template.templateFiles as Array<{
          filename: string
          content: string
          type: 'pdf' | 'txt' | 'md' | 'docx'
        }>

        const createdDocuments = []

        // Process each file in template
        for (const file of templateFiles) {
          // 1. Process document
          const processed = processDocument(
            file.content,
            file.filename,
            file.type,
            file.content.length
          )

          // 2. Create document record
          const [document] = await db
            .insert(vectorDocuments)
            .values({
              userId: ctx.userId,
              companyId: input.companyId || null,
              fileName: file.filename,
              fileType: file.type,
              fileSize: file.content.length,
              metadata: {
                ...processed.metadata,
                sourceTemplate: template.slug,
                tags: template.tags || [],
              },
            })
            .returning()

          if (!document) {
            throw new Error('Failed to create document record')
          }

          // 3. Chunk document
          const chunks = await chunkDocument(processed.content, {
            strategy: 'recursive',
            chunkSize: 1000,
            chunkOverlap: 200,
          })

          // 4. Generate embeddings
          let successCount = 0

          for (const chunk of chunks) {
            try {
              const { embedding, dimensions } = await generateEmbedding(
                chunk.content,
                {
                  userId: ctx.userId,
                }
              )

              await db.insert(vectorChunks).values({
                documentId: document.id,
                userId: ctx.userId,
                companyId: input.companyId || null,
                content: chunk.content,
                embedding,
                dimensions,
                metadata: chunk.metadata,
              })

              successCount++
            } catch (chunkError) {
              logger.error('[ragTemplates.importTemplate] Chunk failed', {
                error:
                  chunkError instanceof Error
                    ? chunkError.message
                    : String(chunkError),
              })
            }
          }

          createdDocuments.push({
            documentId: document.id,
            fileName: file.filename,
            chunkCount: successCount,
          })
        }

        // Track usage
        await db.insert(ragTemplateUsage).values({
          templateId: input.templateId,
          userId: ctx.userId,
          documentsCreated: createdDocuments.length,
        })

        // Update template usage count
        await db
          .update(ragTemplates)
          .set({
            usageCount: (template.usageCount || 0) + 1,
          })
          .where(eq(ragTemplates.id, input.templateId))

        // Track analytics
        await trackRAGUsage({
          userId: ctx.userId,
          companyId: input.companyId,
          eventType: 'document_upload',
          metadata: {
            source: 'template',
            templateId: input.templateId,
            templateSlug: template.slug,
            documentsCreated: createdDocuments.length,
          },
        })

        logger.info('[ragTemplates.importTemplate] Template imported', {
          templateId: input.templateId,
          documentsCreated: createdDocuments.length,
        })

        return {
          success: true,
          documentsCreated: createdDocuments,
          templateName: template.name,
        }
      } catch (error) {
        logger.error('[ragTemplates.importTemplate] Failed to import', {
          error: error instanceof Error ? error.message : String(error),
        })

        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to import template',
        })
      }
    }),

  /**
   * Rate template
   */
  rateTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string().uuid(),
        rating: z.number().min(1).max(5),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Find user's usage record
        const usage = await db.query.ragTemplateUsage.findFirst({
          where: and(
            eq(ragTemplateUsage.templateId, input.templateId),
            eq(ragTemplateUsage.userId, ctx.userId)
          ),
        })

        if (!usage) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You must import this template before rating it',
          })
        }

        // Update rating
        await db
          .update(ragTemplateUsage)
          .set({
            rating: input.rating,
            feedback: input.feedback || null,
          })
          .where(eq(ragTemplateUsage.id, usage.id))

        // Recalculate template average rating
        const allRatings = await db
          .select({ rating: ragTemplateUsage.rating })
          .from(ragTemplateUsage)
          .where(eq(ragTemplateUsage.templateId, input.templateId))

        const validRatings = allRatings
          .map((r) => r.rating)
          .filter((r): r is number => r !== null)

        const avgRating =
          validRatings.length > 0
            ? validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length
            : null

        await db
          .update(ragTemplates)
          .set({ avgRating })
          .where(eq(ragTemplates.id, input.templateId))

        return { success: true, avgRating }
      } catch (error) {
        logger.error('[ragTemplates.rateTemplate] Failed', { error })

        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to rate template',
        })
      }
    }),

  /**
   * Get template categories
   */
  getCategories: protectedProcedure.query(async () => {
    try {
      const categories = await db
        .selectDistinct({ category: ragTemplates.category })
        .from(ragTemplates)
        .where(eq(ragTemplates.isActive, true))

      return categories.map((c) => c.category)
    } catch (error) {
      logger.error('[ragTemplates.getCategories] Failed', { error })
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get categories',
      })
    }
  }),

  /**
   * Get template industries
   */
  getIndustries: protectedProcedure.query(async () => {
    try {
      const industries = await db
        .selectDistinct({ industry: ragTemplates.industry })
        .from(ragTemplates)
        .where(eq(ragTemplates.isActive, true))

      return industries
        .map((i) => i.industry)
        .filter((i): i is string => i !== null)
    } catch (error) {
      logger.error('[ragTemplates.getIndustries] Failed', { error })
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get industries',
      })
    }
  }),
})
