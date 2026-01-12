/**
 * Signal Patterns
 *
 * Defines patterns for detecting query characteristics.
 */

import type { SignalType, QuerySignal } from './types'

// ============================================================================
// SIGNAL PATTERN DEFINITIONS
// ============================================================================

interface SignalPattern {
  type: SignalType
  patterns: RegExp[]
  weight: number
}

export const SIGNAL_PATTERNS: SignalPattern[] = [
  {
    type: 'binary_choice',
    patterns: [
      /\b(o|or)\b.*\?$/i,
      /¿.*\b(sí|no)\b.*\?/i,
      /\b(should|debería)\b.*\?/i,
      /¿(a|b)\?/i,
      /\b(aceptar|rechazar)\b/i,
      /\b(seguir|abandonar)\b/i,
      /\b(lanzar|esperar)\b/i,
      /\b(contratar|no contratar)\b/i,
    ],
    weight: 0.8,
  },
  {
    type: 'multiple_options',
    patterns: [
      /\b(\d+€|\$\d+).*\b(\d+€|\$\d+).*\b(\d+€|\$\d+)/i,
      /\b(a|b|c|d)\b.*\b(a|b|c|d)\b.*\b(a|b|c|d)\b/i,
      /\bcuál\b.*\b(mejor|elegir|escoger)\b/i,
      /\bwhich\b.*\b(best|choose|pick)\b/i,
      /,.*,.*\bo\b/i,
      /\b(opción|alternativa)\s*\d+/i,
      /\b(plan|propuesta)\s*(a|b|c)/i,
      /\b(ranking|clasificar|ordenar)\b/i,
      /\bentre\b.*\by\b.*\by\b/i,
    ],
    weight: 0.9,
  },
  {
    type: 'broad_topic',
    patterns: [
      /\bcómo\b.*\b(expandir|crecer|escalar)\b/i,
      /\bhow\b.*\b(expand|grow|scale)\b/i,
      /\bestrategia\b.*\b(general|completa|integral)\b/i,
      /\bplan\b.*\b(negocio|empresa|producto)\b/i,
      /\bvisión\b.*\b(largo plazo|futuro)\b/i,
      /\bhoja de ruta\b/i,
      /\broadmap\b/i,
      /\b(transformación|reestructuración)\b/i,
    ],
    weight: 0.85,
  },
  {
    type: 'high_risk',
    patterns: [
      /\b(crítico|crítica|importante|vital|crucial)\b/i,
      /\b(critical|important|vital|crucial)\b/i,
      /\b(riesgo|arriesgar|peligro)\b/i,
      /\b(risk|risky|danger)\b/i,
      /\b(inversión|invertir)\b.*\b(grande|significativa)\b/i,
      /\b(irreversible|sin retorno)\b/i,
      /\b(despedir|recortar personal)\b/i,
      /\b(cierre|liquidación|quiebra)\b/i,
      /\b(pivote|pivotar)\b.*\b(total|completo)\b/i,
    ],
    weight: 0.95,
  },
  {
    type: 'optimization',
    patterns: [
      /\b(optimizar|mejorar|incrementar|reducir)\b/i,
      /\b(optimize|improve|increase|reduce)\b/i,
      /\bcómo\b.*\b(mejor|más)\b/i,
      /\bhow\b.*\b(better|more)\b/i,
      /\b(eficiencia|rendimiento|performance)\b/i,
      /\b(maximizar|minimizar)\b/i,
      /\b(ahorrar|economizar)\b/i,
      /\b(acelerar|agilizar)\b/i,
    ],
    weight: 0.7,
  },
  {
    type: 'multiple_factors',
    patterns: [
      /\bconsiderando\b.*\by\b.*\by\b/i,
      /\bconsidering\b.*\band\b.*\band\b/i,
      /\bfactores\b.*\b(múltiples|varios)\b/i,
      /\b(precio|mercado|competencia|timing)\b.*\b(precio|mercado|competencia|timing)\b/i,
    ],
    weight: 0.75,
  },
  {
    type: 'comparison',
    patterns: [
      /\b(mejor|peor|vs|versus|comparar|comparación)\b/i,
      /\b(better|worse|vs|versus|compare|comparison)\b/i,
      /\bcuál\b.*\b(más|menos)\b/i,
    ],
    weight: 0.8,
  },
  {
    type: 'exploration',
    patterns: [
      /\bqué\b.*\b(opciones|alternativas|posibilidades)\b/i,
      /\bwhat\b.*\b(options|alternatives|possibilities)\b/i,
      /\bcómo\b.*\b(podría|podríamos)\b/i,
      /\bhow\b.*\b(could|might)\b/i,
      /\b(explorar|investigar|analizar)\b/i,
      /\b(brainstorm|lluvia de ideas)\b/i,
      /\b(qué pasaría si|what if)\b/i,
      /\b(escenarios|casos)\b/i,
    ],
    weight: 0.6,
  },
  {
    type: 'validation',
    patterns: [
      /\bes\b.*\b(correcto|adecuado|buena idea)\b/i,
      /\bis\b.*\b(correct|right|good idea)\b/i,
      /\bdebería\b.*\b(seguir|continuar)\b/i,
      /\bshould\b.*\b(continue|keep)\b/i,
      /\b(validar|confirmar|verificar)\b/i,
      /\b(tiene sentido|hace sentido)\b/i,
      /\b(estoy en lo cierto|estamos bien)\b/i,
      /\b(pros y contras|ventajas y desventajas)\b/i,
    ],
    weight: 0.5,
  },
]

// ============================================================================
// SIGNAL DETECTION
// ============================================================================

/**
 * Detect signals in the query
 */
export function detectSignals(question: string): QuerySignal[] {
  const signals: QuerySignal[] = []

  for (const pattern of SIGNAL_PATTERNS) {
    const detected = pattern.patterns.some(regex => regex.test(question))
    signals.push({
      type: pattern.type,
      detected,
      weight: pattern.weight,
    })
  }

  return signals
}

/**
 * Count options mentioned in the query
 */
export function countOptions(question: string): number {
  const priceMatches = question.match(/\d+\s*€|\$\s*\d+/g)
  if (priceMatches && priceMatches.length >= 2) {
    return priceMatches.length
  }

  const commaOptions = question.split(/,|(\s+o\s+)|(\s+or\s+)/i).filter(Boolean)
  if (commaOptions.length >= 3) {
    return Math.min(commaOptions.length, 6)
  }

  const letterOptions = question.match(/\b(opción|option)\s*[a-d]\b/gi)
  if (letterOptions) {
    return letterOptions.length
  }

  return 0
}

/**
 * Detect factors/dimensions in the query
 */
export function detectFactors(question: string): string[] {
  const factorKeywords = [
    { keyword: 'precio', factor: 'pricing' },
    { keyword: 'price', factor: 'pricing' },
    { keyword: 'coste', factor: 'pricing' },
    { keyword: 'tarifa', factor: 'pricing' },
    { keyword: 'mercado', factor: 'market' },
    { keyword: 'market', factor: 'market' },
    { keyword: 'sector', factor: 'market' },
    { keyword: 'competencia', factor: 'competition' },
    { keyword: 'competition', factor: 'competition' },
    { keyword: 'competidor', factor: 'competition' },
    { keyword: 'timing', factor: 'timing' },
    { keyword: 'tiempo', factor: 'timing' },
    { keyword: 'momento', factor: 'timing' },
    { keyword: 'producto', factor: 'product' },
    { keyword: 'product', factor: 'product' },
    { keyword: 'servicio', factor: 'product' },
    { keyword: 'equipo', factor: 'team' },
    { keyword: 'team', factor: 'team' },
    { keyword: 'talento', factor: 'team' },
    { keyword: 'personal', factor: 'team' },
    { keyword: 'tecnología', factor: 'technology' },
    { keyword: 'technology', factor: 'technology' },
    { keyword: 'tech', factor: 'technology' },
    { keyword: 'gtm', factor: 'gtm' },
    { keyword: 'go-to-market', factor: 'gtm' },
    { keyword: 'ventas', factor: 'sales' },
    { keyword: 'sales', factor: 'sales' },
    { keyword: 'marketing', factor: 'marketing' },
    { keyword: 'financiación', factor: 'funding' },
    { keyword: 'funding', factor: 'funding' },
    { keyword: 'inversores', factor: 'funding' },
    { keyword: 'latam', factor: 'latam' },
    { keyword: 'españa', factor: 'spain' },
    { keyword: 'spain', factor: 'spain' },
    { keyword: 'usa', factor: 'usa' },
    { keyword: 'europa', factor: 'europe' },
  ]

  const lowerQuestion = question.toLowerCase()
  const detectedFactors: string[] = []

  for (const { keyword, factor } of factorKeywords) {
    if (lowerQuestion.includes(keyword) && !detectedFactors.includes(factor)) {
      detectedFactors.push(factor)
    }
  }

  return detectedFactors
}
