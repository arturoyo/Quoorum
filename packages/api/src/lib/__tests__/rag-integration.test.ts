/**
 * RAG Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  injectRAGContext,
  extractSourceMetadata,
  calculateRAGQualityScore,
} from '../rag-integration'
import type { RAGInjectionResult } from '../rag-integration'

// Mock RAG search
vi.mock('../rag/search', () => ({
  getRelevantContext: vi.fn(),
}))

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

describe('RAG Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('inject RAGContext', () => {
    it('should inject RAG context successfully', async () => {
      const { getRelevantContext } = await import('../rag/search')

      const mockRAGContext = `[1] product-strategy.pdf (similarity: 85.3%)
This is relevant content from the document...

[2] market-research.txt (similarity: 78.5%)
More relevant content here...`

      vi.mocked(getRelevantContext).mockResolvedValue(mockRAGContext)

      const result = await injectRAGContext(
        'How should we price our new product?',
        'We are a B2B SaaS company',
        {
          userId: 'user-123',
          limit: 5,
        }
      )

      expect(result.ragUsed).toBe(true)
      expect(result.sourcesCount).toBe(2)
      expect(result.enrichedContext).toContain('Contexto del Usuario')
      expect(result.enrichedContext).toContain('Documentos Relevantes')
      expect(result.enrichedContext).toContain('product-strategy.pdf')
      expect(result.searchMetrics).toBeDefined()
      expect(result.searchMetrics?.resultsCount).toBe(2)
    })

    it('should handle case with no existing context', async () => {
      const { getRelevantContext } = await import('../rag/search')

      const mockRAGContext = `[1] guidelines.pdf (similarity: 90.0%)
Content here...`

      vi.mocked(getRelevantContext).mockResolvedValue(mockRAGContext)

      const result = await injectRAGContext('What are our guidelines?', undefined, {
        userId: 'user-123',
      })

      expect(result.ragUsed).toBe(true)
      expect(result.sourcesCount).toBe(1)
      expect(result.enrichedContext).toContain('Documentos Relevantes')
      expect(result.enrichedContext).not.toContain('Contexto del Usuario')
    })

    it('should handle no results found', async () => {
      const { getRelevantContext } = await import('../rag/search')

      vi.mocked(getRelevantContext).mockResolvedValue('No relevant context found.')

      const result = await injectRAGContext('Random question?', 'Some context', {
        userId: 'user-123',
      })

      expect(result.ragUsed).toBe(false)
      expect(result.sourcesCount).toBe(0)
      expect(result.enrichedContext).toBe('Some context')
      expect(result.ragContext).toBe('')
    })

    it('should handle RAG disabled', async () => {
      const result = await injectRAGContext('Question?', 'Context', {
        userId: 'user-123',
        enabled: false,
      })

      expect(result.ragUsed).toBe(false)
      expect(result.sourcesCount).toBe(0)
      expect(result.enrichedContext).toBe('Context')
    })

    it('should handle RAG search failure gracefully', async () => {
      const { getRelevantContext } = await import('../rag/search')

      vi.mocked(getRelevantContext).mockRejectedValue(new Error('Search failed'))

      const result = await injectRAGContext('Question?', 'Context', {
        userId: 'user-123',
      })

      expect(result.ragUsed).toBe(false)
      expect(result.sourcesCount).toBe(0)
      expect(result.enrichedContext).toBe('Context')
    })

    it('should pass correct options to search', async () => {
      const { getRelevantContext } = await import('../rag/search')

      vi.mocked(getRelevantContext).mockResolvedValue('No relevant context found.')

      await injectRAGContext('Question?', undefined, {
        userId: 'user-123',
        companyId: 'company-456',
        debateId: 'debate-789',
        limit: 10,
        minSimilarity: 0.7,
        hybridSearch: false,
        provider: 'ollama',
      })

      expect(getRelevantContext).toHaveBeenCalledWith('Question?', {
        userId: 'user-123',
        companyId: 'company-456',
        debateId: 'debate-789',
        limit: 10,
        minSimilarity: 0.7,
        hybridMode: false,
        provider: 'ollama',
      })
    })
  })

  describe('extractSourceMetadata', () => {
    it('should extract source metadata correctly', () => {
      const ragContext = `[1] document-1.pdf (similarity: 85.3%)
Content here...

[2] document-2.txt (similarity: 72.1%)
More content...

[3] document-3.md (similarity: 90.5%)
Even more...`

      const metadata = extractSourceMetadata(ragContext)

      expect(metadata).toHaveLength(3)
      expect(metadata[0]).toEqual({
        documentName: 'document-1.pdf',
        similarity: 85.3,
      })
      expect(metadata[1]).toEqual({
        documentName: 'document-2.txt',
        similarity: 72.1,
      })
      expect(metadata[2]).toEqual({
        documentName: 'document-3.md',
        similarity: 90.5,
      })
    })

    it('should handle no sources', () => {
      const metadata = extractSourceMetadata('No relevant context found.')
      expect(metadata).toHaveLength(0)
    })

    it('should handle empty string', () => {
      const metadata = extractSourceMetadata('')
      expect(metadata).toHaveLength(0)
    })
  })

  describe('calculateRAGQualityScore', () => {
    it('should calculate quality score correctly', () => {
      const result: RAGInjectionResult = {
        question: 'Test?',
        enrichedContext: 'Context with sources...',
        ragContext: `[1] doc1.pdf (similarity: 90.0%)
Long content here...

[2] doc2.txt (similarity: 80.0%)
More content...

[3] doc3.md (similarity: 70.0%)
Even more content...`,
        ragUsed: true,
        sourcesCount: 3,
        searchMetrics: {
          duration: 100,
          resultsCount: 3,
          provider: 'openai',
        },
      }

      const score = calculateRAGQualityScore(result)

      // Score should be based on:
      // - Average similarity: (90 + 80 + 70) / 3 = 80
      // - Source count: 3/5 = 0.6 = 60
      // - Context length: varies
      // Formula: 80 * 0.5 + 60 * 0.3 + contextScore * 0.2
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should return 0 when RAG not used', () => {
      const result: RAGInjectionResult = {
        question: 'Test?',
        enrichedContext: 'Context',
        ragContext: '',
        ragUsed: false,
        sourcesCount: 0,
      }

      const score = calculateRAGQualityScore(result)
      expect(score).toBe(0)
    })

    it('should return 0 when no sources', () => {
      const result: RAGInjectionResult = {
        question: 'Test?',
        enrichedContext: 'Context',
        ragContext: 'No relevant context found.',
        ragUsed: true,
        sourcesCount: 0,
      }

      const score = calculateRAGQualityScore(result)
      expect(score).toBe(0)
    })
  })
})
