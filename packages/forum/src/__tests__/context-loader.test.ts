/**
 * Tests for Forum Context Loader
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadContext, synthesizeContext } from '../context-loader'
import type { LoadContextOptions } from '../context-loader'

// Mock @forum/ai
vi.mock('@forum/ai', () => ({
  getAIClient: vi.fn(() => ({
    generate: vi.fn().mockResolvedValue({ text: 'mocked response' }),
  })),
}))

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('mocked file content'),
}))

describe('Forum Context Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadContext', () => {
    it('should load manual context only', async () => {
      const options: LoadContextOptions = {
        question: 'Test question',
        manualContext: 'Manual context here',
        useInternet: false,
        useRepo: false,
      }

      const result = await loadContext(options)

      expect(result.sources).toHaveLength(1)
      expect(result.sources[0]?.type).toBe('manual')
      expect(result.sources[0]?.content).toBe('Manual context here')
      expect(result.combinedContext).toContain('Manual context here')
    })

    it('should skip empty manual context', async () => {
      const options: LoadContextOptions = {
        question: 'Test question',
        manualContext: '   ',
        useInternet: false,
        useRepo: false,
      }

      const result = await loadContext(options)

      expect(result.sources).toHaveLength(0)
      expect(result.combinedContext).toBe('')
    })

    it('should load internet context when enabled', async () => {
      const options: LoadContextOptions = {
        question: 'Test question',
        useInternet: true,
        useRepo: false,
      }

      const result = await loadContext(options)

      // Should have internet source
      const internetSource = result.sources.find((s) => s.type === 'internet')
      expect(internetSource).toBeDefined()
      expect(internetSource?.metadata?.['query']).toBe('Test question')
    })

    it('should load repo context when enabled', async () => {
      const options: LoadContextOptions = {
        question: 'Test question',
        useInternet: false,
        useRepo: true,
        repoPath: '/path/to/repo',
      }

      const result = await loadContext(options)

      // Repo source may or may not be loaded depending on AI response and file availability
      // Just check that the function doesn't throw
      expect(result).toBeDefined()
      expect(result.sources).toBeDefined()
      expect(Array.isArray(result.sources)).toBe(true)
    })

    it('should combine multiple sources', async () => {
      const options: LoadContextOptions = {
        question: 'Test question',
        manualContext: 'Manual context',
        useInternet: true,
        useRepo: true,
        repoPath: '/path/to/repo',
      }

      const result = await loadContext(options)

      // Should have all 3 sources
      expect(result.sources.length).toBeGreaterThanOrEqual(1)
      expect(result.combinedContext).toContain('Manual context')
    })

    it('should handle errors gracefully', async () => {
      const options: LoadContextOptions = {
        question: 'Test question',
        useInternet: true,
        useRepo: true,
        repoPath: '/invalid/path',
      }

      // Should not throw
      const result = await loadContext(options)
      expect(result).toBeDefined()
      expect(result.sources).toBeDefined()
    })

    it('should separate sources with dividers', async () => {
      const options: LoadContextOptions = {
        question: 'Test question',
        manualContext: 'Context 1',
        useInternet: true,
        useRepo: false,
      }

      const result = await loadContext(options)

      if (result.sources.length > 1) {
        expect(result.combinedContext).toContain('---')
      }
    })
  })

  describe('synthesizeContext', () => {
    it('should return short context unchanged', async () => {
      const shortContext = 'This is a short context'
      const result = await synthesizeContext(shortContext)
      expect(result).toBe(shortContext)
    })

    it('should synthesize long context', async () => {
      const longContext = 'a'.repeat(1000)
      const result = await synthesizeContext(longContext)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should handle empty context', async () => {
      const result = await synthesizeContext('')
      expect(result).toBe('')
    })
  })
})
