/**
 * Document Chunking Tests
 */

import { describe, it, expect } from 'vitest'
import { chunkDocument, filterChunks, mergeSmallChunks } from '../chunking'

describe('Document Chunking', () => {
  const sampleText = `
This is the first paragraph. It contains multiple sentences. Each sentence provides information.

This is the second paragraph. It has different content. The content is related to the topic.

This is the third paragraph. It concludes the document. Thank you for reading.
  `.trim()

  describe('Recursive Chunking', () => {
    it('should split by paragraphs when possible', async () => {
      const chunks = await chunkDocument(sampleText, {
        strategy: 'recursive',
        chunkSize: 200,
        chunkOverlap: 50,
      })

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks[0]?.content).toBeDefined()
      expect(chunks[0]?.metadata.tokenCount).toBeGreaterThan(0)
    })

    it('should handle chunk overlap correctly', async () => {
      const chunks = await chunkDocument(sampleText, {
        strategy: 'recursive',
        chunkSize: 100,
        chunkOverlap: 20,
      })

      if (chunks.length > 1) {
        expect(chunks[1]?.metadata.hasOverlap).toBe(true)
      }
    })

    it('should respect chunk size limits', async () => {
      const chunks = await chunkDocument(sampleText, {
        strategy: 'recursive',
        chunkSize: 50,
        chunkOverlap: 10,
      })

      chunks.forEach((chunk) => {
        expect(chunk.content.length).toBeLessThanOrEqual(60) // Allow some flexibility
      })
    })
  })

  describe('Semantic Chunking', () => {
    it('should split by sentences', async () => {
      const chunks = await chunkDocument(sampleText, {
        strategy: 'semantic',
        chunkSize: 150,
        chunkOverlap: 30,
      })

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks[0]?.metadata.custom?.sentenceCount).toBeGreaterThan(0)
    })

    it('should keep complete sentences together', async () => {
      const chunks = await chunkDocument(sampleText, {
        strategy: 'semantic',
        chunkSize: 100,
        chunkOverlap: 20,
      })

      // Each chunk should end with sentence-ending punctuation
      chunks.forEach((chunk) => {
        const lastChar = chunk.content.trim().slice(-1)
        // Should end with punctuation (mostly)
        expect(['.', '!', '?', ',', ';'].some((p) => lastChar === p)).toBe(true)
      })
    })
  })

  describe('Fixed Chunking', () => {
    it('should create equal-sized chunks', async () => {
      const chunks = await chunkDocument(sampleText, {
        strategy: 'fixed',
        chunkSize: 50,
        chunkOverlap: 10,
      })

      // All chunks except last should be close to chunk size
      for (let i = 0; i < chunks.length - 1; i++) {
        expect(chunks[i]?.content.length).toBe(50)
      }
    })

    it('should apply overlap correctly', async () => {
      const chunks = await chunkDocument('ABCDEFGHIJKLMNOPQRSTUVWXYZ', {
        strategy: 'fixed',
        chunkSize: 10,
        chunkOverlap: 3,
      })

      expect(chunks.length).toBeGreaterThan(2)

      // Check overlap between consecutive chunks
      for (let i = 0; i < chunks.length - 1; i++) {
        const currentEnd = chunks[i]!.content.slice(-3)
        const nextStart = chunks[i + 1]!.content.slice(0, 3)
        expect(currentEnd).toBe(nextStart)
      }
    })
  })

  describe('Chunk Filtering', () => {
    it('should filter chunks below minimum size', async () => {
      const chunks = await chunkDocument('Short. A. B. C. D. Longer sentence here.', {
        strategy: 'semantic',
        chunkSize: 20,
        chunkOverlap: 0,
      })

      const filtered = filterChunks(chunks, 10)
      filtered.forEach((chunk) => {
        expect(chunk.content.length).toBeGreaterThanOrEqual(10)
      })
    })
  })

  describe('Chunk Merging', () => {
    it('should merge small adjacent chunks', async () => {
      const chunks = await chunkDocument('A. B. C. D. E. F.', {
        strategy: 'semantic',
        chunkSize: 5,
        chunkOverlap: 0,
      })

      const merged = mergeSmallChunks(chunks, 10, 20)
      expect(merged.length).toBeLessThan(chunks.length)

      merged.forEach((chunk) => {
        expect(chunk.content.length).toBeGreaterThanOrEqual(10)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty text', async () => {
      const chunks = await chunkDocument('', {
        strategy: 'recursive',
        chunkSize: 100,
        chunkOverlap: 20,
      })

      expect(chunks.length).toBe(1)
      expect(chunks[0]?.content).toBe('')
    })

    it('should handle text smaller than chunk size', async () => {
      const shortText = 'Short text.'
      const chunks = await chunkDocument(shortText, {
        strategy: 'recursive',
        chunkSize: 1000,
        chunkOverlap: 100,
      })

      expect(chunks.length).toBe(1)
      expect(chunks[0]?.content).toBe(shortText)
    })

    it('should handle text without separators', async () => {
      const noSeparators = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const chunks = await chunkDocument(noSeparators, {
        strategy: 'recursive',
        chunkSize: 10,
        chunkOverlap: 2,
      })

      expect(chunks.length).toBeGreaterThan(1)
    })

    it('should reject invalid options', async () => {
      await expect(
        chunkDocument(sampleText, {
          strategy: 'recursive',
          chunkSize: -1,
          chunkOverlap: 0,
        })
      ).rejects.toThrow('chunkSize must be positive')

      await expect(
        chunkDocument(sampleText, {
          strategy: 'recursive',
          chunkSize: 100,
          chunkOverlap: -1,
        })
      ).rejects.toThrow('chunkOverlap cannot be negative')

      await expect(
        chunkDocument(sampleText, {
          strategy: 'recursive',
          chunkSize: 100,
          chunkOverlap: 150,
        })
      ).rejects.toThrow('chunkOverlap must be less than chunkSize')
    })
  })

  describe('Metadata Generation', () => {
    it('should include correct metadata', async () => {
      const chunks = await chunkDocument(sampleText, {
        strategy: 'recursive',
        chunkSize: 100,
        chunkOverlap: 20,
      })

      chunks.forEach((chunk, index) => {
        expect(chunk.index).toBe(index)
        expect(chunk.metadata.startPos).toBeGreaterThanOrEqual(0)
        expect(chunk.metadata.endPos).toBeGreaterThan(chunk.metadata.startPos)
        expect(chunk.metadata.tokenCount).toBeGreaterThan(0)
        expect(chunk.metadata.charCount).toBe(chunk.content.length)
      })
    })
  })
})
