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
      const compressed = '💰49€ ✓77%📈 WTP✓ 👑pos ⚠️🐌adopt 75% 👍2'
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
      expect(EMOJI_MAP['riesgo']).toBe('⚠️')
      expect(EMOJI_MAP['objetivo']).toBe('🎯')
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
      expect(EMOJI_MAP['rapido']).toBe('🚀')
      expect(EMOJI_MAP['lento']).toBe('🐌')
    })
  })

  describe('REVERSE_EMOJI_MAP', () => {
    it('should reverse the emoji map', () => {
      expect(REVERSE_EMOJI_MAP['💰']).toBeTruthy()
      expect(REVERSE_EMOJI_MAP['⚠️']).toBe('riesgo')
      expect(REVERSE_EMOJI_MAP['🎯']).toBe('objetivo')
    })

    it('should have same length as EMOJI_MAP', () => {
      const uniqueEmojis = new Set(Object.values(EMOJI_MAP))
      expect(Object.keys(REVERSE_EMOJI_MAP).length).toBe(uniqueEmojis.size)
    })
  })

  describe('ROLE_EMOJI', () => {
    it('should have emoji for each agent role', () => {
      expect(ROLE_EMOJI['optimizer']).toBe('💡')
      expect(ROLE_EMOJI['critic']).toBe('⚠️')
      expect(ROLE_EMOJI['analyst']).toBe('📊')
      expect(ROLE_EMOJI['synthesizer']).toBe('🎯')
    })

    it('should have 4 roles mapped', () => {
      expect(Object.keys(ROLE_EMOJI)).toHaveLength(4)
    })
  })

  describe('getRoleEmoji', () => {
    it('should return emoji for valid role', () => {
      expect(getRoleEmoji('optimizer')).toBe('💡')
      expect(getRoleEmoji('critic')).toBe('⚠️')
      expect(getRoleEmoji('analyst')).toBe('📊')
      expect(getRoleEmoji('synthesizer')).toBe('🎯')
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
})
