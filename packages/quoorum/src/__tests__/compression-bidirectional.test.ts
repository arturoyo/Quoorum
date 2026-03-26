/**
 * Tests for Bidirectional Compression System
 * 
 * Tests input compression (context before sending to AI) and
 * output decompression (AI response translation for user display)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { compressInput, decompressOutput, estimateTokens } from '../ultra-language'

// Mock AI client
const mockGenerate = vi.fn()

vi.mock('@quoorum/ai', () => ({
  getAIClient: vi.fn(() => ({
    generate: mockGenerate,
  })),
}))

describe('Bidirectional Compression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerate.mockReset()
  })

  describe('compressInput', () => {
    it('should not compress if context is too short (<100 tokens)', async () => {
      const shortContext = 'Pregunta simple: ¿Qué precio usar?'
      const tokens = estimateTokens(shortContext)
      
      expect(tokens).toBeLessThan(100)
      
      const result = await compressInput(shortContext)
      expect(result).toBe(shortContext) // Should return original
      expect(mockGenerate).not.toHaveBeenCalled()
    })

    it('should compress long context (>100 tokens)', async () => {
      const longContext = `
PREGUNTA: ¿Cuál es el mejor precio para nuestro producto SaaS?

CONTEXTO EMPRESARIAL:
Nuestra empresa se fundó en 2020 con la misión de democratizar el acceso a herramientas de productividad.
Valores: Innovación, transparencia, compromiso con el cliente.
Visión: Ser líder en herramientas SaaS para pequeñas empresas en 2025.

CONTEXTOS DEPARTAMENTALES:
Marketing: KPIs actuales - CAC: 45€, LTV: 180€, ratio 4:1. Procesos: Inbound marketing, content marketing, SEO.
Ventas: Proceso de venta actual - 3 llamadas promedio, tiempo de cierre: 14 días, tasa de conversión: 12%.
Producto: Roadmap Q1 - Features principales: Dashboard analytics, integraciones API, mobile app.

DEBATE PREVIO:
R1 Optimista: La opción de 49 euros tiene un margen del 77% que es positivo, el willingness to pay está validado, hay posicionamiento premium pero riesgo de adopción lenta.
R1 Crítico: El precio de 49 euros puede ser demasiado alto para el mercado objetivo, falta validación de PMF, riesgo de anchor pricing.
R1 Analista: Datos muestran que competidores similares usan precios entre 29-59€, nuestro CAC actual es 45€, necesitamos margen mínimo del 60%.
R1 Sintetizador: Dos opciones principales: 49€ (77% margen, validado WTP) y 29€ (58% margen, más accesible). Recomendación: 49€ si target es premium, 29€ si target es masivo.
`.trim()

      const tokens = estimateTokens(longContext)
      expect(tokens).toBeGreaterThan(100)

      // Mock successful compression
      mockGenerate.mockResolvedValueOnce({
        text: 'P:💰? C:2020📈 V:innov/transp/compromiso M:CAC45€ LTV180€ 4:1 V:3llam 14d 12%conv P:Dash/API/mobile R1:O49€✓77%📈WTP✓👑[WARN]🐌 R1:C49€✗PMF?[WARN]anchor R1:A29-59€ CAC45€ 60%min R1:#1💰49€77% #2💰29€58%',
        usage: { totalTokens: 150 },
      })

      const result = await compressInput(longContext)
      
      expect(mockGenerate).toHaveBeenCalledTimes(1)
      expect(result).not.toBe(longContext) // Should be compressed
      expect(estimateTokens(result)).toBeLessThan(tokens) // Should have fewer tokens
    })

    it('should use original if compression fails', async () => {
      const longContext = 'A'.repeat(500) // Long context
      
      mockGenerate.mockRejectedValueOnce(new Error('API Error'))

      const result = await compressInput(longContext)
      
      expect(result).toBe(longContext) // Should fallback to original
    })

    it('should use original if compression does not reduce tokens enough (<30%)', async () => {
      const longContext = 'A'.repeat(500)
      
      // Mock compression that doesn't reduce enough
      mockGenerate.mockResolvedValueOnce({
        text: 'A'.repeat(400), // Only 20% reduction
        usage: { totalTokens: 400 },
      })

      const result = await compressInput(longContext)
      
      // Should use original if reduction < 30%
      expect(result).toBe(longContext)
    })
  })

  describe('decompressOutput', () => {
    it('should not decompress if message has no compression markers', async () => {
      const normalMessage = 'Esta es una respuesta normal sin emojis ni símbolos especiales.'
      
      const result = await decompressOutput(normalMessage)
      
      expect(result).toBe(normalMessage) // Should return original
      expect(mockGenerate).not.toHaveBeenCalled()
    })

    it('should decompress message with emojis and symbols', async () => {
      const compressedMessage = '💡49€ ✓77%📈 WTP✓ 👑pos [WARN]🐌adopt 75% 👍2'
      
      // Mock successful decompression
      mockGenerate.mockResolvedValueOnce({
        text: 'La opción de 49 euros tiene un margen del 77% que es positivo, el willingness to pay está validado, hay posicionamiento premium pero riesgo de adopción lenta, probabilidad de éxito del 75% con 2 apoyos.',
        usage: { totalTokens: 50 },
      })

      const result = await decompressOutput(compressedMessage)
      
      expect(mockGenerate).toHaveBeenCalledTimes(1)
      expect(result).not.toBe(compressedMessage) // Should be expanded
      expect(result.length).toBeGreaterThan(compressedMessage.length) // Should be longer
      expect(result).not.toContain('💡') // Should not have emojis
      expect(result).toContain('49 euros') // Should have expanded text
    })

    it('should return original if decompression fails', async () => {
      const compressedMessage = '💡49€ ✓77%📈'
      
      mockGenerate.mockRejectedValueOnce(new Error('API Error'))

      const result = await decompressOutput(compressedMessage)
      
      expect(result).toBe(compressedMessage) // Should fallback to original
    })
  })

  describe('Integration: Full compression cycle', () => {
    it('should compress input, send to AI, and decompress output', async () => {
      const originalContext = `
PREGUNTA: ¿Cuál es el mejor precio?
CONTEXTO: Nuestra empresa tiene CAC de 45€, LTV de 180€, ratio 4:1.
DEBATE PREVIO: R1 Optimista: 49€ tiene 77% margen positivo. R1 Crítico: 49€ puede ser alto.
DETALLE EXTRA: Validamos pricing, PMF, WTP, churn, pipeline comercial, conversiones, posicionamiento premium, riesgo de adopcion y comparables de mercado.
DETALLE EXTRA: Validamos pricing, PMF, WTP, churn, pipeline comercial, conversiones, posicionamiento premium, riesgo de adopcion y comparables de mercado.
DETALLE EXTRA: Validamos pricing, PMF, WTP, churn, pipeline comercial, conversiones, posicionamiento premium, riesgo de adopcion y comparables de mercado.
DETALLE EXTRA: Validamos pricing, PMF, WTP, churn, pipeline comercial, conversiones, posicionamiento premium, riesgo de adopcion y comparables de mercado.
DETALLE EXTRA: Validamos pricing, PMF, WTP, churn, pipeline comercial, conversiones, posicionamiento premium, riesgo de adopcion y comparables de mercado.
`.trim()

      expect(estimateTokens(originalContext)).toBeGreaterThan(100)

      // Mock compression
      mockGenerate.mockResolvedValueOnce({
        text: '[INFO]P[MONEY]? CAC45 LTV180 4:1 R1 [MONEY]49d [YES]77% R1 [WARN]49d alto',
        usage: { totalTokens: 20 },
      })

      const compressed = await compressInput(originalContext)
      expect(compressed).toBeTruthy()
      expect(mockGenerate).toHaveBeenCalledTimes(1)

      // Mock decompression
      mockGenerate.mockResolvedValueOnce({
        text: 'Analizando las opciones: 49 euros tiene 77% de margen positivo, 29 euros tiene 58% de margen. Por tanto, si el margen objetivo es al menos 30%, la opción de 49 euros es recomendable con 70% de confianza.',
        usage: { totalTokens: 40 },
      })

      const aiResponse = '[INFO][MONEY]49d:77% [MONEY]29d:58% therefore [MONEY]49d 70%'
      const expanded = await decompressOutput(aiResponse)

      expect(expanded).not.toBe(aiResponse)
      expect(expanded).not.toContain('[INFO]')
      expect(expanded).toContain('49 euros')
      expect(expanded).toContain('77%')
    })
  })

  describe('Token savings estimation', () => {
    it('should demonstrate token savings', () => {
      const original = 'La opción de 49 euros tiene un margen del 77% que es positivo, el willingness to pay está validado, hay posicionamiento premium pero riesgo de adopción lenta, probabilidad de éxito del 75% con 2 apoyos.'
      const compressed = '💡49€ ✓77%📈 WTP✓ 👑pos [WARN]🐌adopt 75% 👍2'

      const originalTokens = estimateTokens(original)
      const compressedTokens = estimateTokens(compressed)

      expect(compressedTokens).toBeLessThan(originalTokens)
      expect(compressedTokens).toBeLessThan(originalTokens * 0.5) // At least 50% reduction
    })
  })
})
