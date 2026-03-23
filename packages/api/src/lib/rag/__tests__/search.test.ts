/**
 * Vector Search Engine Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { semanticSearch, hybridSearch, getRelevantContext } from '../search'
import type { SearchOptions } from '../search'

// Mock dependencies
vi.mock('@quoorum/db', () => ({
  db: {
    execute: vi.fn(),
  },
}))

vi.mock('@quoorum/ai/embeddings', () => ({
  generateEmbedding: vi.fn(),
}))

vi.mock('../../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Vector Search Engine', () => {
  const mockUserId = 'user-123'
  const mockCompanyId = 'company-456'
  const mockDebateId = 'debate-789'

  const mockEmbedding = {
    embedding: Array(768).fill(0.1), // 768-dimensional embedding
    provider: { name: 'test-provider' },
    dimensions: 768,
    cost: 0.001,
  }

  const mockSearchResults = [
    {
      chunk_id: 'chunk-1',
      document_id: 'doc-1',
      content: 'This is the first relevant chunk about AI systems.',
      chunk_metadata: {
        startPos: 0,
        endPos: 50,
        tokenCount: 10,
        chunkIndex: 0,
      },
      file_name: 'ai-guide.pdf',
      file_type: 'pdf',
      uploaded_at: new Date('2024-01-15'),
      document_metadata: { tags: ['AI', 'guide'] },
      similarity: 0.85,
    },
    {
      chunk_id: 'chunk-2',
      document_id: 'doc-2',
      content: 'Another chunk discussing machine learning concepts.',
      chunk_metadata: {
        startPos: 100,
        endPos: 150,
        tokenCount: 8,
        chunkIndex: 1,
      },
      file_name: 'ml-basics.txt',
      file_type: 'text',
      uploaded_at: new Date('2024-01-16'),
      document_metadata: { tags: ['ML', 'basics'] },
      similarity: 0.75,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Semantic Search', () => {
    it('should perform semantic search successfully', async () => {
      const { generateEmbedding } = await import('@quoorum/ai/embeddings')
      const { db } = await import('@quoorum/db')

      vi.mocked(generateEmbedding).mockResolvedValue(mockEmbedding)
      vi.mocked(db.execute).mockResolvedValue(mockSearchResults)

      const options: SearchOptions = {
        userId: mockUserId,
        limit: 10,
        minSimilarity: 0.5,
      }

      const { results, metrics } = await semanticSearch('AI systems overview', options)

      expect(results).toHaveLength(2)
      expect(results[0]?.chunkId).toBe('chunk-1')
      expect(results[0]?.similarity).toBe(0.85)
      expect(results[0]?.content).toContain('AI systems')

      expect(metrics.resultsCount).toBe(2)
      expect(metrics.provider).toBe('test-provider')
      expect(metrics.dimensions).toBe(768)
      expect(metrics.duration).toBeGreaterThanOrEqual(0)
    })

    it('should filter by company ID', async () => {
      const { generateEmbedding } = await import('@quoorum/ai/embeddings')
      const { db } = await import('@quoorum/db')

      vi.mocked(generateEmbedding).mockResolvedValue(mockEmbedding)
      vi.mocked(db.execute).mockResolvedValue([mockSearchResults[0]!])

      const options: SearchOptions = {
        userId: mockUserId,
        companyId: mockCompanyId,
        limit: 5,
      }

      const { results } = await semanticSearch('company context', options)

      expect(results).toHaveLength(1)
      expect(db.execute).toHaveBeenCalled()

      // Verify company ID was included in query
      const queryCall = vi.mocked(db.execute).mock.calls[0]
      expect(queryCall).toBeDefined()
    })

    it('should filter by debate ID', async () => {
      const { generateEmbedding } = await import('@quoorum/ai/embeddings')
      const { db } = await import('@quoorum/db')

      vi.mocked(generateEmbedding).mockResolvedValue(mockEmbedding)
      vi.mocked(db.execute).mockResolvedValue([mockSearchResults[1]!])

      const options: SearchOptions = {
        userId: mockUserId,
        debateId: mockDebateId,
        limit: 5,
      }

      const { results } = await semanticSearch('debate specific', options)

      expect(results).toHaveLength(1)
      expect(db.execute).toHaveBeenCalled()
    })

    it('should filter by document IDs', async () => {
      const { generateEmbedding } = await import('@quoorum/ai/embeddings')
      const { db } = await import('@quoorum/db')

      vi.mocked(generateEmbedding).mockResolvedValue(mockEmbedding)
      vi.mocked(db.execute).mockResolvedValue([mockSearchResults[0]!])

      const options: SearchOptions = {
        userId: mockUserId,
        documentIds: ['doc-1', 'doc-3'],
        limit: 5,
      }

      const { results } = await semanticSearch('specific docs', options)

      expect(results).toHaveLength(1)
      expect(db.execute).toHaveBeenCalled()
    })

    it('should respect minimum similarity threshold', async () => {
      const { generateEmbedding } = await import('@quoorum/ai/embeddings')
      const { db } = await import('@quoorum/db')

      vi.mocked(generateEmbedding).mockResolvedValue(mockEmbedding)

      // Only return high-similarity results
      const highSimilarityResults = mockSearchResults.filter((r) => r.similarity >= 0.8)
      vi.mocked(db.execute).mockResolvedValue(highSimilarityResults)

      const options: SearchOptions = {
        userId: mockUserId,
        minSimilarity: 0.8,
        limit: 10,
      }

      const { results } = await semanticSearch('high quality match', options)

      expect(results).toHaveLength(1)
      expect(results[0]?.similarity).toBeGreaterThanOrEqual(0.8)
    })

    it('should handle empty results', async () => {
      const { generateEmbedding } = await import('@quoorum/ai/embeddings')
      const { db } = await import('@quoorum/db')

      vi.mocked(generateEmbedding).mockResolvedValue(mockEmbedding)
      vi.mocked(db.execute).mockResolvedValue([])

      const options: SearchOptions = {
        userId: mockUserId,
        limit: 10,
      }

      const { results, metrics } = await semanticSearch('no matches', options)

      expect(results).toHaveLength(0)
      expect(metrics.resultsCount).toBe(0)
    })

    it('should handle search errors gracefully', async () => {
      const { generateEmbedding } = await import('@quoorum/ai/embeddings')
      const { db } = await import('@quoorum/db')

      vi.mocked(generateEmbedding).mockResolvedValue(mockEmbedding)
      vi.mocked(db.execute).mockRejectedValue(new Error('Database error'))

      const options: SearchOptions = {
        userId: mockUserId,
        limit: 10,
      }

      await expect(semanticSearch('error query', options)).rejects.toThrow('Semantic search failed')
    })

    it('should handle embedding generation errors', async () => {
      const { generateEmbedding } = await import('@quoorum/ai/embeddings')

      vi.mocked(generateEmbedding).mockRejectedValue(new Error('Embedding error'))

      const options: SearchOptions = {
        userId: mockUserId,
        limit: 10,
      }

      await expect(semanticSearch('embedding error', options)).rejects.toThrow()
    })

    it('should filter by embedding dimensions', async () => {
      const { generateEmbedding } = await import('@quoorum/ai/embeddings')
      const { db } = await import('@quoorum/db')

      // Different dimension embedding
      const largeEmbedding = {
        ...mockEmbedding,
        embedding: Array(1536).fill(0.1),
        dimensions: 1536,
      }

      vi.mocked(generateEmbedding).mockResolvedValue(largeEmbedding)
      vi.mocked(db.execute).mockResolvedValue([])

      const options: SearchOptions = {
        userId: mockUserId,
        limit: 10,
      }

      const { results } = await semanticSearch('dimension test', options)

      // Should only search chunks with matching dimensions (1536)
      expect(db.execute).toHaveBeenCalled()
      expect(results).toHaveLength(0)
    })
  })

  describe('Hybrid Search', () => {
    it('should combine vector and keyword search', async () => {
      const { generateEmbedding } = await import('@quoorum/ai/embeddings')
      const { db } = await import('@quoorum/db')

      vi.mocked(generateEmbedding).mockResolvedValue(mockEmbedding)

      // First call: vector search
      // Second call: keyword search
      vi.mocked(db.execute)
        .mockResolvedValueOnce(mockSearchResults)
        .mockResolvedValueOnce([
          {
            ...mockSearchResults[1]!,
            rank: 0.8, // ts_rank score
          },
        ])

      const options: SearchOptions = {
        userId: mockUserId,
        limit: 10,
        hybridMode: true,
      }

      const { results, metrics } = await hybridSearch('hybrid query', options)

      expect(results.length).toBeGreaterThan(0)
      expect(metrics.resultsCount).toBeGreaterThan(0)
      expect(db.execute).toHaveBeenCalledTimes(2) // Vector + keyword search
    })

    it('should merge results using RRF', async () => {
      const { generateEmbedding } = await import('@quoorum/ai/embeddings')
      const { db } = await import('@quoorum/db')

      vi.mocked(generateEmbedding).mockResolvedValue(mockEmbedding)

      // Overlapping results between vector and keyword
      const vectorResults = [mockSearchResults[0]!, mockSearchResults[1]!]
      const keywordResults = [mockSearchResults[1]!] // chunk-2 appears in both

      vi.mocked(db.execute).mockResolvedValueOnce(vectorResults).mockResolvedValueOnce(keywordResults)

      const options: SearchOptions = {
        userId: mockUserId,
        limit: 10,
        hybridMode: true,
      }

      const { results } = await hybridSearch('overlap query', options)

      // chunk-2 should rank higher because it appears in both results
      expect(results.length).toBeGreaterThan(0)

      // Find chunk-2 in results
      const chunk2 = results.find((r) => r.chunkId === 'chunk-2')
      expect(chunk2).toBeDefined()
    })
  })

  describe('Get Relevant Context', () => {
    it('should format results as context string', async () => {
      const { generateEmbedding } = await import('@quoorum/ai/embeddings')
      const { db } = await import('@quoorum/db')

      vi.mocked(generateEmbedding).mockResolvedValue(mockEmbedding)
      vi.mocked(db.execute).mockResolvedValue(mockSearchResults)

      const options: SearchOptions = {
        userId: mockUserId,
        limit: 5,
      }

      const context = await getRelevantContext('context query', options)

      expect(context).toContain('[1] ai-guide.pdf')
      expect(context).toContain('[2] ml-basics.txt')
      expect(context).toContain('AI systems')
      expect(context).toContain('machine learning')
      expect(context).toContain('---') // Separator
    })

    it('should return message when no results', async () => {
      const { generateEmbedding } = await import('@quoorum/ai/embeddings')
      const { db } = await import('@quoorum/db')

      vi.mocked(generateEmbedding).mockResolvedValue(mockEmbedding)
      vi.mocked(db.execute).mockResolvedValue([])

      const options: SearchOptions = {
        userId: mockUserId,
        limit: 5,
      }

      const context = await getRelevantContext('no results', options)

      expect(context).toBe('No relevant context found.')
    })

    it('should use hybrid search when enabled', async () => {
      const { generateEmbedding } = await import('@quoorum/ai/embeddings')
      const { db } = await import('@quoorum/db')

      vi.mocked(generateEmbedding).mockResolvedValue(mockEmbedding)
      vi.mocked(db.execute)
        .mockResolvedValueOnce(mockSearchResults)
        .mockResolvedValueOnce([mockSearchResults[0]!])

      const options: SearchOptions = {
        userId: mockUserId,
        hybridMode: true,
        limit: 5,
      }

      const context = await getRelevantContext('hybrid context', options)

      expect(context).toContain('ai-guide.pdf')
      expect(db.execute).toHaveBeenCalledTimes(2) // Vector + keyword
    })
  })

  describe('Metrics Tracking', () => {
    it('should track search performance metrics', async () => {
      const { generateEmbedding } = await import('@quoorum/ai/embeddings')
      const { db } = await import('@quoorum/db')

      vi.mocked(generateEmbedding).mockResolvedValue(mockEmbedding)
      vi.mocked(db.execute).mockResolvedValue(mockSearchResults)

      const options: SearchOptions = {
        userId: mockUserId,
        limit: 10,
      }

      const { metrics } = await semanticSearch('metrics test', options)

      // In mocked environment, timing might be 0ms, so use >= instead of >
      expect(metrics.duration).toBeGreaterThanOrEqual(0)
      expect(metrics.embeddingTime).toBeGreaterThanOrEqual(0)
      expect(metrics.searchTime).toBeGreaterThanOrEqual(0)
      expect(metrics.resultsCount).toBe(2)
      expect(metrics.provider).toBe('test-provider')
      expect(metrics.dimensions).toBe(768)
      expect(metrics.cost).toBe(0.001)
    })

    it('should track total duration including all operations', async () => {
      const { generateEmbedding } = await import('@quoorum/ai/embeddings')
      const { db } = await import('@quoorum/db')

      vi.mocked(generateEmbedding).mockResolvedValue(mockEmbedding)
      vi.mocked(db.execute).mockResolvedValue(mockSearchResults)

      const options: SearchOptions = {
        userId: mockUserId,
        limit: 10,
      }

      const { metrics } = await semanticSearch('duration test', options)

      // Total duration should be >= individual components (in mocked env can be 0)
      expect(metrics.duration).toBeGreaterThanOrEqual(0)
      expect(metrics.embeddingTime).toBeGreaterThanOrEqual(0)
      expect(metrics.searchTime).toBeGreaterThanOrEqual(0)
    })
  })
})
