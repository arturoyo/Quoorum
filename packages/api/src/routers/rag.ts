/**
 * RAG Router - Document Management & Vector Search
 *
 * Provides API for managing user documents in the RAG system:
 * - Upload documents (PDF, TXT, MD, DOCX)
 * - List uploaded documents
 * - Delete documents
 * - Test search functionality
 * - Manage embedding providers
 */

import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import {
  vectorDocuments,
  vectorChunks,
  embeddingProviders,
  embeddingPreferences,
} from '@quoorum/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { logger } from '../lib/logger'
import { processDocument } from '../lib/rag/document-processor'
import { chunkDocument } from '../lib/rag/chunking'
import { generateEmbedding } from '@quoorum/ai/embeddings'
import { semanticSearch, hybridSearch } from '../lib/rag/search'
import { trackRAGUsage } from '../lib/rag/analytics-helper'

// ============================================================================
// DOCUMENTS
// ============================================================================

export const ragRouter = router({
  /**
   * Upload a document
   *
   * Processes, chunks, and embeds a document for RAG search.
   */
  uploadDocument: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.enum(['pdf', 'txt', 'md', 'docx']),
        content: z.string(), // Base64 or plain text
        tags: z.array(z.string()).optional(),
        companyId: z.string().uuid().optional(),
        debateId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        logger.info('[rag.uploadDocument] Starting upload', {
          fileName: input.fileName,
          fileType: input.fileType,
          userId: ctx.userId,
        })

        // 1. Process document
        const processed = processDocument(
          input.content,
          input.fileName,
          input.fileType,
          input.content.length
        )

        logger.info('[rag.uploadDocument] Document processed', {
          charCount: processed.metadata.charCount,
          tokenCount: processed.metadata.tokenCount,
          paragraphCount: processed.metadata.paragraphCount,
        })

        // 2. Create document record
        const [document] = await db
          .insert(vectorDocuments)
          .values({
            userId: ctx.userId,
            companyId: input.companyId || null,
            debateId: input.debateId || null,
            fileName: input.fileName,
            fileType: input.fileType,
            fileSize: input.content.length,
            metadata: {
              ...processed.metadata,
              tags: input.tags || [],
            },
          })
          .returning()

        if (!document) {
          throw new Error('Failed to create document record')
        }

        logger.info('[rag.uploadDocument] Document record created', {
          documentId: document.id,
        })

        // 3. Chunk document
        const chunks = await chunkDocument(processed.content, {
          strategy: 'recursive', // Use recursive for best results
          chunkSize: 1000,
          chunkOverlap: 200,
        })

        logger.info('[rag.uploadDocument] Document chunked', {
          chunkCount: chunks.length,
        })

        // 4. Generate embeddings for each chunk
        let successCount = 0
        let failCount = 0

        for (const chunk of chunks) {
          try {
            // Generate embedding
            const { embedding, dimensions, cost } = await generateEmbedding(
              chunk.content,
              {
                userId: ctx.userId,
              }
            )

            // Save chunk with embedding
            await db.insert(vectorChunks).values({
              documentId: document.id,
              userId: ctx.userId,
              companyId: input.companyId || null,
              debateId: input.debateId || null,
              content: chunk.content,
              embedding,
              dimensions,
              metadata: chunk.metadata,
            })

            successCount++
          } catch (chunkError) {
            logger.error('[rag.uploadDocument] Failed to process chunk', {
              error:
                chunkError instanceof Error
                  ? chunkError.message
                  : String(chunkError),
              chunkIndex: chunk.index,
            })
            failCount++
          }
        }

        logger.info('[rag.uploadDocument] Upload complete', {
          documentId: document.id,
          totalChunks: chunks.length,
          successCount,
          failCount,
        })

        // Track upload analytics
        await trackRAGUsage({
          userId: ctx.userId,
          companyId: input.companyId,
          eventType: 'document_upload',
          documentId: document.id,
          debateId: input.debateId,
          metadata: {
            fileName: input.fileName,
            fileType: input.fileType,
            fileSize: input.content.length,
            chunksCreated: successCount,
            chunksFailed: failCount,
          },
        })

        return {
          documentId: document.id,
          fileName: document.fileName,
          chunkCount: successCount,
          failedChunks: failCount,
        }
      } catch (error) {
        logger.error('[rag.uploadDocument] Upload failed', {
          error: error instanceof Error ? error.message : String(error),
          fileName: input.fileName,
        })

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upload document',
        })
      }
    }),

  /**
   * List documents
   *
   * Returns all documents uploaded by the user.
   */
  listDocuments: protectedProcedure
    .input(
      z
        .object({
          companyId: z.string().uuid().optional(),
          debateId: z.string().uuid().optional(),
          limit: z.number().min(1).max(100).optional().default(50),
          offset: z.number().min(0).optional().default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        const filters = [eq(vectorDocuments.userId, ctx.userId)]

        if (input?.companyId) {
          filters.push(eq(vectorDocuments.companyId, input.companyId))
        }

        if (input?.debateId) {
          filters.push(eq(vectorDocuments.debateId, input.debateId))
        }

        const documents = await db
          .select({
            id: vectorDocuments.id,
            fileName: vectorDocuments.fileName,
            fileType: vectorDocuments.fileType,
            fileSize: vectorDocuments.fileSize,
            uploadedAt: vectorDocuments.uploadedAt,
            metadata: vectorDocuments.metadata,
            chunkCount: sql<number>`(
              SELECT COUNT(*)
              FROM vector_chunks
              WHERE vector_chunks.document_id = ${vectorDocuments.id}
            )`,
          })
          .from(vectorDocuments)
          .where(and(...filters))
          .orderBy(desc(vectorDocuments.uploadedAt))
          .limit(input?.limit || 50)
          .offset(input?.offset || 0)

        return documents
      } catch (error) {
        logger.error('[rag.listDocuments] Failed to list documents', {
          error: error instanceof Error ? error.message : String(error),
        })

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list documents',
        })
      }
    }),

  /**
   * Delete document
   *
   * Removes document and all its chunks.
   */
  deleteDocument: protectedProcedure
    .input(
      z.object({
        documentId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const [document] = await db
          .select()
          .from(vectorDocuments)
          .where(
            and(
              eq(vectorDocuments.id, input.documentId),
              eq(vectorDocuments.userId, ctx.userId)
            )
          )
          .limit(1)

        if (!document) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Document not found',
          })
        }

        // Delete chunks (cascade will handle this, but explicit is better)
        await db
          .delete(vectorChunks)
          .where(eq(vectorChunks.documentId, input.documentId))

        // Delete document
        await db
          .delete(vectorDocuments)
          .where(eq(vectorDocuments.id, input.documentId))

        logger.info('[rag.deleteDocument] Document deleted', {
          documentId: input.documentId,
          fileName: document.fileName,
        })

        return { success: true }
      } catch (error) {
        logger.error('[rag.deleteDocument] Failed to delete document', {
          error: error instanceof Error ? error.message : String(error),
        })

        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete document',
        })
      }
    }),

  /**
   * Test search
   *
   * Tests semantic search functionality.
   */
  testSearch: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        companyId: z.string().uuid().optional(),
        debateId: z.string().uuid().optional(),
        limit: z.number().min(1).max(20).optional().default(5),
        minSimilarity: z.number().min(0).max(1).optional().default(0.5),
        hybridMode: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const searchFn = input.hybridMode ? hybridSearch : semanticSearch

        const startTime = Date.now()

        const { results, metrics } = await searchFn(input.query, {
          userId: ctx.userId,
          companyId: input.companyId,
          debateId: input.debateId,
          limit: input.limit,
          minSimilarity: input.minSimilarity,
        })

        const duration = Date.now() - startTime

        // Calculate average similarity
        const avgSimilarity = results.length > 0
          ? results.reduce((sum, r) => sum + r.similarity, 0) / results.length
          : 0

        // Track search analytics
        await trackRAGUsage({
          userId: ctx.userId,
          companyId: input.companyId,
          eventType: 'manual_search',
          debateId: input.debateId,
          queryText: input.query,
          resultsCount: results.length,
          avgSimilarity,
          searchDurationMs: duration,
          metadata: {
            hybridMode: input.hybridMode,
            minSimilarity: input.minSimilarity,
            limit: input.limit,
          },
        })

        return {
          results,
          metrics,
        }
      } catch (error) {
        logger.error('[rag.testSearch] Search failed', {
          error: error instanceof Error ? error.message : String(error),
        })

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Search failed',
        })
      }
    }),

  // ============================================================================
  // PROVIDERS
  // ============================================================================

  /**
   * List embedding providers
   *
   * Returns available embedding providers.
   */
  listProviders: protectedProcedure.query(async () => {
    try {
      const providers = await db
        .select()
        .from(embeddingProviders)
        .where(eq(embeddingProviders.isActive, true))
        .orderBy(embeddingProviders.name)

      return providers
    } catch (error) {
      logger.error('[rag.listProviders] Failed to list providers', {
        error: error instanceof Error ? error.message : String(error),
      })

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to list providers',
      })
    }
  }),

  /**
   * Get user's embedding preference
   */
  getPreference: protectedProcedure.query(async ({ ctx }) => {
    try {
      const [preference] = await db
        .select()
        .from(embeddingPreferences)
        .where(eq(embeddingPreferences.userId, ctx.userId))
        .limit(1)

      return preference || null
    } catch (error) {
      logger.error('[rag.getPreference] Failed to get preference', {
        error: error instanceof Error ? error.message : String(error),
      })

      return null
    }
  }),

  /**
   * Set user's embedding preference
   */
  setPreference: protectedProcedure
    .input(
      z.object({
        providerId: z.string().uuid(),
        model: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify provider exists
        const [provider] = await db
          .select()
          .from(embeddingProviders)
          .where(eq(embeddingProviders.id, input.providerId))
          .limit(1)

        if (!provider) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Provider not found',
          })
        }

        // Upsert preference
        const [preference] = await db
          .insert(embeddingPreferences)
          .values({
            userId: ctx.userId,
            providerId: input.providerId,
            preferredModel: input.model || null,
          })
          .onConflictDoUpdate({
            target: embeddingPreferences.userId,
            set: {
              providerId: input.providerId,
              preferredModel: input.model || null,
              updatedAt: new Date(),
            },
          })
          .returning()

        return preference
      } catch (error) {
        logger.error('[rag.setPreference] Failed to set preference', {
          error: error instanceof Error ? error.message : String(error),
        })

        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to set preference',
        })
      }
    }),

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get RAG statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const [stats] = await db.execute(sql`
        SELECT
          COUNT(DISTINCT vd.id) as document_count,
          COUNT(vc.id) as chunk_count,
          COALESCE(SUM(vd.file_size), 0) as total_size,
          COUNT(DISTINCT vd.file_type) as file_type_count
        FROM vector_documents vd
        LEFT JOIN vector_chunks vc ON vc.document_id = vd.id
        WHERE vd.user_id = ${ctx.userId}
      `)

      return stats || {
        document_count: 0,
        chunk_count: 0,
        total_size: 0,
        file_type_count: 0,
      }
    } catch (error) {
      logger.error('[rag.getStats] Failed to get stats', {
        error: error instanceof Error ? error.message : String(error),
      })

      return {
        document_count: 0,
        chunk_count: 0,
        total_size: 0,
        file_type_count: 0,
      }
    }
  }),
})
