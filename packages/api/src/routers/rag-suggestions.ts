/**
 * RAG Smart Suggestions Router
 *
 * AI-powered suggestions for what documents to upload
 * based on user's debate history and patterns
 */

import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import { quoorumDebates, vectorDocuments } from '@quoorum/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { logger } from '../logger'
import { callAI } from '@quoorum/ai'

export const ragSuggestionsRouter = router({
  /**
   * Get smart suggestions for documents to upload
   *
   * Analyzes user's debate history and suggests document types
   */
  getSuggestions: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Get user's recent debates
      const recentDebates = await db
        .select({
          id: quoorumDebates.id,
          question: quoorumDebates.question,
          category: quoorumDebates.category,
          context: quoorumDebates.context,
          createdAt: quoorumDebates.createdAt,
        })
        .from(quoorumDebates)
        .where(eq(quoorumDebates.userId, ctx.userId))
        .orderBy(desc(quoorumDebates.createdAt))
        .limit(10)

      // Get existing documents
      const existingDocs = await db
        .select({
          fileName: vectorDocuments.fileName,
          fileType: vectorDocuments.fileType,
        })
        .from(vectorDocuments)
        .where(eq(vectorDocuments.userId, ctx.userId))

      if (recentDebates.length === 0) {
        // No debate history - return generic suggestions
        return {
          suggestions: [
            {
              title: 'Company Overview',
              description:
                'Upload a document describing your company mission, values, and strategy',
              category: 'general',
              priority: 'high',
              reasoning:
                'Having company context helps debates align with your business goals',
            },
            {
              title: 'Product Documentation',
              description:
                'Upload product specs, feature lists, or roadmap documents',
              category: 'product',
              priority: 'high',
              reasoning:
                'Product context improves decision-making around features and strategy',
            },
            {
              title: 'Market Research',
              description: 'Upload competitive analysis or market research reports',
              category: 'market',
              priority: 'medium',
              reasoning: 'Market insights help with strategic decisions',
            },
          ],
          analysisUsed: false,
        }
      }

      // Use AI to analyze debate patterns
      const debatesContext = recentDebates
        .map(
          (d) =>
            `- Question: "${d.question}"\n  Category: ${d.category || 'N/A'}\n  Date: ${d.createdAt.toISOString().split('T')[0]}`
        )
        .join('\n')

      const existingDocsContext =
        existingDocs.length > 0
          ? `\n\nExisting documents:\n${existingDocs.map((d) => `- ${d.fileName} (${d.fileType})`).join('\n')}`
          : '\n\nNo existing documents uploaded yet.'

      const prompt = `You are an AI assistant that helps users improve their decision-making by suggesting relevant documents to upload to their knowledge base.

Analyze the user's recent debate topics and suggest 3-5 specific types of documents they should upload to improve their debates.

User's recent debates:
${debatesContext}
${existingDocsContext}

For each suggestion, provide:
1. A clear title (e.g., "Financial Projections", "Customer Feedback Summary")
2. A specific description of what document to create/upload
3. A category (general, product, finance, legal, market, hr, operations)
4. Priority (high, medium, low)
5. Reasoning (why this document would be valuable)

Consider:
- What information gaps exist in their current knowledge base?
- What documents would make their debates more data-driven?
- What industry-specific documents are missing?
- What stage of business are they in based on debate topics?

Respond in JSON format:
{
  "suggestions": [
    {
      "title": "Document Title",
      "description": "Specific description",
      "category": "category",
      "priority": "high|medium|low",
      "reasoning": "Why this helps"
    }
  ]
}`

      const response = await callAI({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        responseFormat: { type: 'json_object' },
      })

      const result = JSON.parse(response.content)

      logger.info('[ragSuggestions.getSuggestions] Suggestions generated', {
        userId: ctx.userId,
        suggestionsCount: result.suggestions?.length || 0,
      })

      return {
        suggestions: result.suggestions || [],
        analysisUsed: true,
      }
    } catch (error) {
      logger.error('[ragSuggestions.getSuggestions] Failed', {
        error: error instanceof Error ? error.message : String(error),
      })

      // Fallback to generic suggestions on error
      return {
        suggestions: [
          {
            title: 'Company Overview',
            description:
              'Upload a document describing your company mission, values, and strategy',
            category: 'general',
            priority: 'high',
            reasoning:
              'Having company context helps debates align with your business goals',
          },
          {
            title: 'Product Documentation',
            description:
              'Upload product specs, feature lists, or roadmap documents',
            category: 'product',
            priority: 'high',
            reasoning:
              'Product context improves decision-making around features and strategy',
          },
        ],
        analysisUsed: false,
        error: 'Failed to generate AI suggestions, showing defaults',
      }
    }
  }),

  /**
   * Get document coverage analysis
   *
   * Analyzes what types of documents are well-covered vs missing
   */
  getCoverageAnalysis: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Get document stats by metadata tags/categories
      const docs = await db
        .select({
          fileName: vectorDocuments.fileName,
          fileType: vectorDocuments.fileType,
          metadata: vectorDocuments.metadata,
        })
        .from(vectorDocuments)
        .where(eq(vectorDocuments.userId, ctx.userId))

      // Categorize documents
      const categories = {
        general: 0,
        product: 0,
        finance: 0,
        legal: 0,
        market: 0,
        hr: 0,
        operations: 0,
        technical: 0,
      }

      docs.forEach((doc) => {
        const fileName = doc.fileName.toLowerCase()
        const metadata = doc.metadata as any

        // Simple keyword-based categorization
        if (
          fileName.includes('product') ||
          fileName.includes('feature') ||
          fileName.includes('roadmap')
        ) {
          categories.product++
        } else if (
          fileName.includes('finance') ||
          fileName.includes('budget') ||
          fileName.includes('revenue')
        ) {
          categories.finance++
        } else if (
          fileName.includes('legal') ||
          fileName.includes('contract') ||
          fileName.includes('agreement')
        ) {
          categories.legal++
        } else if (
          fileName.includes('market') ||
          fileName.includes('competitive') ||
          fileName.includes('research')
        ) {
          categories.market++
        } else if (fileName.includes('hr') || fileName.includes('employee')) {
          categories.hr++
        } else if (
          fileName.includes('ops') ||
          fileName.includes('operations') ||
          fileName.includes('process')
        ) {
          categories.operations++
        } else if (
          fileName.includes('tech') ||
          fileName.includes('api') ||
          fileName.includes('architecture')
        ) {
          categories.technical++
        } else {
          categories.general++
        }
      })

      // Calculate coverage percentages
      const total = docs.length
      const coverage = Object.entries(categories).map(([category, count]) => ({
        category,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))

      // Identify gaps (categories with 0 or low coverage)
      const gaps = coverage
        .filter((c) => c.count === 0 || c.percentage < 10)
        .map((c) => c.category)

      return {
        totalDocuments: total,
        coverage,
        gaps,
        wellCovered: coverage
          .filter((c) => c.percentage >= 20)
          .map((c) => c.category),
      }
    } catch (error) {
      logger.error('[ragSuggestions.getCoverageAnalysis] Failed', { error })

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to analyze coverage',
      })
    }
  }),
})
