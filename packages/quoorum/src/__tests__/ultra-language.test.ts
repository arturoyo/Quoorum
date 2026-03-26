/**
 * Tests for Ultra-Optimized Language
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  compressInput,
  decompressOutput,
  EMOJI_MAP,
  estimateTokens,
  getRoleEmoji,
  INPUT_COMPRESSION_PROMPT,
  REVERSE_EMOJI_MAP,
  ROLE_EMOJI,
  TRANSLATION_PROMPT,
  ULTRA_OPTIMIZED_PROMPT,
} from '../ultra-language'

const mockGenerate = vi.fn()

vi.mock('@quoorum/ai', () => ({
  getAIClient: vi.fn(() => ({
    generate: mockGenerate,
  })),
}))

describe('Ultra-Optimized Language', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('estimateTokens', () => {
    it('estimates tokens for plain text', () => {
      const tokens = estimateTokens('Hola mundo')
      expect(tokens).toBeGreaterThan(0)
      expect(tokens).toBeLessThan(10)
    })

    it('counts bracket tokens as compressed markers', () => {
      const tokens = estimateTokens('[MONEY][TREND_UP][YES]')
      expect(tokens).toBe(5)
    })

    it('treats compressed text as cheaper than expanded prose', () => {
      const compressed = '[MONEY]49d [YES]77% [INFO]pos [WARN]adopt 75% [UPVOTE]2'
      const expanded =
        'La opcion de 49 euros tiene 77% de margen positivo, posicionamiento premium, riesgo de adopcion lenta y 2 apoyos.'

      expect(estimateTokens(compressed)).toBeLessThan(estimateTokens(expanded))
    })

    it('returns 0 for empty string', () => {
      expect(estimateTokens('')).toBe(0)
    })
  })

  describe('maps and role tokens', () => {
    it('uses bracket tokens instead of emojis', () => {
      expect(EMOJI_MAP.dinero).toBe('[MONEY]')
      expect(EMOJI_MAP.positivo).toBe('[YES]')
      expect(EMOJI_MAP.tendencia_positiva).toBe('[TREND_UP]')
      expect(EMOJI_MAP.apoyo).toBe('[UPVOTE]')
    })

    it('builds the reverse map from current token values', () => {
      expect(REVERSE_EMOJI_MAP['[MONEY]']).toBeTruthy()
      expect(REVERSE_EMOJI_MAP['[WARN]']).toBe('critico')
      expect(REVERSE_EMOJI_MAP['[INFO]']).toBe('objetivo')
    })

    it('maps agent roles to current bracket tokens', () => {
      expect(ROLE_EMOJI.optimizer).toBe('[IDEA]')
      expect(ROLE_EMOJI.critic).toBe('[WARN]')
      expect(ROLE_EMOJI.analyst).toBe('[INFO]')
      expect(ROLE_EMOJI.synthesizer).toBe('[INFO]')
      expect(getRoleEmoji('invalid')).toBe('[CHAT]')
    })
  })

  describe('prompts', () => {
    it('documents the no-emoji compressed format', () => {
      expect(ULTRA_OPTIMIZED_PROMPT).toContain('LENGUAJE ULTRA-OPTIMIZADO')
      expect(ULTRA_OPTIMIZED_PROMPT).toContain('sin emojis')
      expect(ULTRA_OPTIMIZED_PROMPT).toContain('Maximo 15 tokens')
      expect(ULTRA_OPTIMIZED_PROMPT).toContain('[MONEY]49d')
    })

    it('documents translation instructions', () => {
      expect(TRANSLATION_PROMPT).toContain('Traduce')
      expect(TRANSLATION_PROMPT).toContain('espanol')
      expect(TRANSLATION_PROMPT).toContain('Expande')
      expect(TRANSLATION_PROMPT).toContain('tokens')
    })

    it('includes an input compression prompt with examples', () => {
      expect(INPUT_COMPRESSION_PROMPT).toContain('Comprime')
      expect(INPUT_COMPRESSION_PROMPT).toContain('ultra-optimizado')
      expect(INPUT_COMPRESSION_PROMPT).toContain('HERRAMIENTAS')
      expect(INPUT_COMPRESSION_PROMPT).toContain('O49d')
    })
  })

  describe('compressInput', () => {
    it('returns original text for short input', async () => {
      const shortText = 'Hola mundo'
      await expect(compressInput(shortText)).resolves.toBe(shortText)
      expect(mockGenerate).not.toHaveBeenCalled()
    })

    it('returns original if compression does not save enough tokens', async () => {
      const longText = 'A'.repeat(500)
      mockGenerate.mockResolvedValueOnce({
        text: 'A'.repeat(400),
      })

      await expect(compressInput(longText)).resolves.toBe(longText)
    })

    it('returns compressed text when model output is materially shorter', async () => {
      const longText = 'A'.repeat(500)
      const compressed = '[INFO]sum [WARN]risk [MONEY]49d [UPVOTE]2'
      mockGenerate.mockResolvedValueOnce({
        text: compressed,
      })

      await expect(compressInput(longText)).resolves.toBe(compressed)
    })

    it('falls back to original on compression error', async () => {
      const longText = 'A'.repeat(500)
      mockGenerate.mockRejectedValueOnce(new Error('API error'))

      await expect(compressInput(longText)).resolves.toBe(longText)
    })
  })

  describe('decompressOutput', () => {
    it('returns original text when there are no compression markers', async () => {
      const normalText = 'Hola mundo, este es un texto normal sin compresion'
      await expect(decompressOutput(normalText)).resolves.toBe(normalText)
      expect(mockGenerate).not.toHaveBeenCalled()
    })

    it('uses the AI client when bracket markers are present', async () => {
      const compressedText = '[MONEY]49d [YES]77% [WARN]adopt 75% [UPVOTE]2'
      const expanded =
        'La opcion de 49 euros tiene 77% de margen positivo, riesgo de adopcion lenta y 2 apoyos.'
      mockGenerate.mockResolvedValueOnce({
        text: expanded,
      })

      await expect(decompressOutput(compressedText)).resolves.toBe(expanded)
      expect(mockGenerate).toHaveBeenCalledTimes(1)
    })

    it('returns original compressed text on decompression error', async () => {
      const compressedText = '[WARN]49d PMF?'
      mockGenerate.mockRejectedValueOnce(new Error('API error'))

      await expect(decompressOutput(compressedText)).resolves.toBe(compressedText)
    })
  })
})
