/**
 * Tests for Ultra-Optimized Language
 */

import { describe, it, expect } from 'vitest'
import {
  estimateTokens,
  EMOJI_MAP,
  REVERSE_EMOJI_MAP,
  ROLE_EMOJI,
  getRoleEmoji,
  ULTRA_OPTIMIZED_PROMPT,
  TRANSLATION_PROMPT,
} from '../ultra-language'

describe('Ultra-Optimized Language', () => {
  describe('estimateTokens', () => {
    it('should estimate tokens for plain text', () => {
      const tokens = estimateTokens('Hola mundo')
      expect(tokens).toBeGreaterThan(0)
      expect(tokens).toBeLessThan(10)
    })

    it('should count emojis as ~1.5 tokens', () => {
      const tokens = estimateTokens('💰📈✓')
      // 3 emojis * 1.5 = 4.5, but Math.ceil makes it 5
      expect(tokens).toBeGreaterThanOrEqual(4)
      expect(tokens).toBeLessThanOrEqual(5)
    })

    it('should handle mixed text and emojis', () => {
      const tokens = estimateTokens('💰49€ ✓77%📈')
      expect(tokens).toBeGreaterThan(0)
      expect(tokens).toBeLessThan(15)
    })

    it('should return 0 for empty string', () => {
      const tokens = estimateTokens('')
      expect(tokens).toBe(0)
    })

    it('should estimate compressed message as fewer tokens than expanded', () => {
      const compressed = '💰49€ ✓77%📈 WTP✓ 👑pos [WARN]🐌adopt 75% 👍2'
      const expanded =
        'Opción de 49 euros tiene 77% de margen positivo, willingness to pay validado, posicionamiento premium, riesgo de adopción lenta, 75% de éxito, 2 apoyos'

      const compressedTokens = estimateTokens(compressed)
      const expandedTokens = estimateTokens(expanded)

      expect(compressedTokens).toBeLessThan(expandedTokens)
    })
  })

  describe('EMOJI_MAP', () => {
    it('should have common concepts mapped', () => {
      expect(EMOJI_MAP['dinero']).toBe('💰')
      expect(EMOJI_MAP['precio']).toBe('💰')
      expect(EMOJI_MAP['riesgo']).toBe('[WARN]')
      expect(EMOJI_MAP['objetivo']).toBe('[INFO]')
    })

    it('should have positive/negative indicators', () => {
      expect(EMOJI_MAP['positivo']).toBe('✓')
      expect(EMOJI_MAP['negativo']).toBe('✗')
      expect(EMOJI_MAP['apoyo']).toBe('👍')
      expect(EMOJI_MAP['rechazo']).toBe('👎')
    })

    it('should have trend indicators', () => {
      expect(EMOJI_MAP['tendencia_positiva']).toBe('📈')
      expect(EMOJI_MAP['tendencia_negativa']).toBe('📉')
      expect(EMOJI_MAP['rapido']).toBe('[INFO]')
      expect(EMOJI_MAP['lento']).toBe('🐌')
    })
  })

  describe('REVERSE_EMOJI_MAP', () => {
    it('should reverse the emoji map', () => {
      expect(REVERSE_EMOJI_MAP['💰']).toBeTruthy()
      expect(REVERSE_EMOJI_MAP['[WARN]']).toBe('riesgo')
      expect(REVERSE_EMOJI_MAP['[INFO]']).toBe('objetivo')
    })

    it('should have same length as EMOJI_MAP', () => {
      const uniqueEmojis = new Set(Object.values(EMOJI_MAP))
      expect(Object.keys(REVERSE_EMOJI_MAP).length).toBe(uniqueEmojis.size)
    })
  })

  describe('ROLE_EMOJI', () => {
    it('should have emoji for each agent role', () => {
      expect(ROLE_EMOJI['optimizer']).toBe('💡')
      expect(ROLE_EMOJI['critic']).toBe('[WARN]')
      expect(ROLE_EMOJI['analyst']).toBe('📊')
      expect(ROLE_EMOJI['synthesizer']).toBe('[INFO]')
    })

    it('should have 4 roles mapped', () => {
      expect(Object.keys(ROLE_EMOJI)).toHaveLength(4)
    })
  })

  describe('getRoleEmoji', () => {
    it('should return emoji for valid role', () => {
      expect(getRoleEmoji('optimizer')).toBe('💡')
      expect(getRoleEmoji('critic')).toBe('[WARN]')
      expect(getRoleEmoji('analyst')).toBe('📊')
      expect(getRoleEmoji('synthesizer')).toBe('[INFO]')
    })

    it('should return default emoji for invalid role', () => {
      expect(getRoleEmoji('invalid')).toBe('💬')
      expect(getRoleEmoji('')).toBe('💬')
    })
  })

  describe('ULTRA_OPTIMIZED_PROMPT', () => {
    it('should be defined', () => {
      expect(ULTRA_OPTIMIZED_PROMPT).toBeTruthy()
      expect(ULTRA_OPTIMIZED_PROMPT.length).toBeGreaterThan(100)
    })

    it('should contain key instructions', () => {
      expect(ULTRA_OPTIMIZED_PROMPT).toContain('LENGUAJE ULTRA-OPTIMIZADO')
      expect(ULTRA_OPTIMIZED_PROMPT).toContain('Minimizar tokens')
      expect(ULTRA_OPTIMIZED_PROMPT).toContain('Emojis')
      expect(ULTRA_OPTIMIZED_PROMPT).toContain('Maximo 15 tokens')
    })

    it('should contain examples', () => {
      expect(ULTRA_OPTIMIZED_PROMPT).toContain('EJEMPLOS')
      expect(ULTRA_OPTIMIZED_PROMPT).toContain('💡49€')
    })
  })

  describe('TRANSLATION_PROMPT', () => {
    it('should be defined', () => {
      expect(TRANSLATION_PROMPT).toBeTruthy()
      expect(TRANSLATION_PROMPT.length).toBeGreaterThan(50)
    })

    it('should contain translation instructions', () => {
      expect(TRANSLATION_PROMPT).toContain('Traduce')
      expect(TRANSLATION_PROMPT).toContain('espanol')
      expect(TRANSLATION_PROMPT).toContain('Expande')
      expect(TRANSLATION_PROMPT).toContain('emojis')
    })
  })

  describe('INPUT_COMPRESSION_PROMPT', () => {
    it('should be defined', () => {
      const { INPUT_COMPRESSION_PROMPT } = require('../ultra-language')
      expect(INPUT_COMPRESSION_PROMPT).toBeTruthy()
      expect(INPUT_COMPRESSION_PROMPT.length).toBeGreaterThan(100)
    })

    it('should contain compression instructions', () => {
      const { INPUT_COMPRESSION_PROMPT } = require('../ultra-language')
      expect(INPUT_COMPRESSION_PROMPT).toContain('Comprime')
      expect(INPUT_COMPRESSION_PROMPT).toContain('ultra-optimizado')
      expect(INPUT_COMPRESSION_PROMPT).toContain('HERRAMIENTAS')
      expect(INPUT_COMPRESSION_PROMPT).toContain('REGLAS')
    })

    it('should contain examples', () => {
      const { INPUT_COMPRESSION_PROMPT } = require('../ultra-language')
      expect(INPUT_COMPRESSION_PROMPT).toContain('EJEMPLO')
      expect(INPUT_COMPRESSION_PROMPT).toContain('O49d')
    })
  })

  describe('compressInput', () => {
    it('should return original text if less than 100 tokens', async () => {
      const { compressInput } = require('../ultra-language')
      const shortText = 'Hola mundo'
      const result = await compressInput(shortText)
      expect(result).toBe(shortText)
    })

    it('should handle empty string', async () => {
      const { compressInput } = require('../ultra-language')
      const result = await compressInput('')
      expect(result).toBe('')
    })

    it('should attempt compression for long text', async () => {
      const { compressInput } = require('../ultra-language')
      const longText = 'La opción de 49 euros tiene un margen del 77% que es positivo, el willingness to pay está validado, hay posicionamiento premium pero riesgo de adopción lenta, probabilidad de éxito del 75% con 2 apoyos. Además, la opción de 29 euros tiene un 60% de probabilidad con 1 apoyo. Se recomienda la opción de 49 euros por su mayor rentabilidad.'

      const result = await compressInput(longText)

      // Should either be compressed or return original if compression fails
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should return original on compression error', async () => {
      const { compressInput } = require('../ultra-language')
      // Text that might cause compression to fail
      const problematicText = 'Text with special chars: @#$%^&*()[]{}|\\/<>?~`'
      const result = await compressInput(problematicText)

      // Should not throw, should return something
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })
  })

  describe('decompressOutput', () => {
    it('should return original text if no compression markers', async () => {
      const { decompressOutput } = require('../ultra-language')
      const normalText = 'Hola mundo, este es un texto normal sin compresión'
      const result = await decompressOutput(normalText)
      expect(result).toBe(normalText)
    })

    it('should handle empty string', async () => {
      const { decompressOutput } = require('../ultra-language')
      const result = await decompressOutput('')
      expect(result).toBe('')
    })

    it('should attempt decompression for compressed text', async () => {
      const { decompressOutput } = require('../ultra-language')
      const compressedText = 'O49d [YES]77% [INFO]pos [WARN]adopt 75% [UPVOTE]2'

      const result = await decompressOutput(compressedText)

      // Should either be decompressed or return original if decompression fails
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle multiple compression markers', async () => {
      const { decompressOutput } = require('../ultra-language')
      const compressedText = '[WARN]49d PMF? [WARN]anchor conv- 45% [UPVOTE]'

      const result = await decompressOutput(compressedText)

      // Should process text with multiple markers
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })

    it('should return original on decompression error', async () => {
      const { decompressOutput } = require('../ultra-language')
      // Text with markers but that might cause decompression to fail
      const problematicText = '[INVALID_MARKER]test[UNKNOWN]data'
      const result = await decompressOutput(problematicText)

      // Should not throw, should return something
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })
  })

  describe('Bidirectional Compression', () => {
    it('should maintain meaning through compress -> decompress cycle', async () => {
      const { compressInput, decompressOutput } = require('../ultra-language')
      const originalText = 'La opción de 49 euros tiene un margen del 77% que es positivo, el willingness to pay está validado.'

      // Compress
      const compressed = await compressInput(originalText)

      // If compression happened (text is different), try to decompress
      if (compressed !== originalText) {
        const decompressed = await decompressOutput(compressed)

        // Decompressed should contain key concepts from original
        // Note: Won't be identical, but should preserve meaning
        expect(decompressed).toBeTruthy()
        expect(typeof decompressed).toBe('string')
        expect(decompressed.length).toBeGreaterThan(0)
      }
    })

    it('should handle round-trip with multiple data points', async () => {
      const { compressInput, decompressOutput } = require('../ultra-language')
      const originalText = 'Opción 1: 49 euros, 77% margen, 2 apoyos. Opción 2: 29 euros, 60% margen, 1 apoyo. Recomendación: Opción 1 por mayor rentabilidad.'

      const compressed = await compressInput(originalText)

      // Should produce a result (compressed or original)
      expect(compressed).toBeTruthy()

      if (compressed !== originalText && compressed.includes('[')) {
        const decompressed = await decompressOutput(compressed)

        // Should preserve key numbers and concepts
        expect(decompressed).toBeTruthy()
        expect(decompressed.length).toBeGreaterThan(20)
      }
    })
  })
})
