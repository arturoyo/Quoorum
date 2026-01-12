/**
 * Quality Monitor
 *
 * Monitorea la calidad del debate en tiempo real y detecta:
 * - Debates superficiales o repetitivos
 * - Falta de profundidad en los argumentos
 * - Consenso prematuro sin exploración suficiente
 * - Falta de diversidad de perspectivas
 */

import type { DebateMessage } from './types'

/**
 * Resultado del análisis de calidad
 */
export interface QualityAnalysis {
  /** Score de calidad general (0-100) */
  overallQuality: number
  /** Score de profundidad de argumentos (0-100) */
  depthScore: number
  /** Score de diversidad de perspectivas (0-100) */
  diversityScore: number
  /** Score de originalidad (0-100) */
  originalityScore: number
  /** Problemas detectados */
  issues: QualityIssue[]
  /** Recomendaciones para mejorar */
  recommendations: string[]
  /** ¿Debe intervenir el meta-moderador? */
  needsModeration: boolean
}

/**
 * Problema de calidad detectado
 */
export interface QualityIssue {
  /** Tipo de problema */
  type: 'shallow' | 'repetitive' | 'premature_consensus' | 'lack_of_diversity' | 'superficial'
  /** Severidad (1-10) */
  severity: number
  /** Descripción del problema */
  description: string
  /** Mensajes afectados (índices) */
  affectedMessages: number[]
}

/**
 * Opciones de monitoreo
 */
export interface MonitoringOptions {
  /** Umbral mínimo de calidad (0-100) */
  minQualityThreshold?: number
  /** Número mínimo de mensajes antes de analizar */
  minMessagesBeforeAnalysis?: number
  /** Detectar repetición agresivamente */
  strictRepetitionDetection?: boolean
}

/**
 * Analiza la calidad del debate actual
 */
export function analyzeDebateQuality(
  messages: DebateMessage[],
  options: MonitoringOptions = {}
): QualityAnalysis {
  const {
    minQualityThreshold = 60,
    minMessagesBeforeAnalysis = 3,
    strictRepetitionDetection = true,
  } = options

  // No analizar si hay muy pocos mensajes
  if (messages.length < minMessagesBeforeAnalysis) {
    return {
      overallQuality: 100,
      depthScore: 100,
      diversityScore: 100,
      originalityScore: 100,
      issues: [],
      recommendations: [],
      needsModeration: false,
    }
  }

  const issues: QualityIssue[] = []

  // Analizar profundidad
  const depthScore = analyzeDepth(messages, issues)

  // Analizar diversidad
  const diversityScore = analyzeDiversity(messages, issues)

  // Analizar originalidad (repetición)
  const originalityScore = analyzeOriginality(messages, issues, strictRepetitionDetection)

  // Calcular score general
  const overallQuality = Math.round((depthScore + diversityScore + originalityScore) / 3)

  // Generar recomendaciones
  const recommendations = generateRecommendations(issues, overallQuality)

  // Determinar si necesita moderación
  const needsModeration =
    overallQuality < minQualityThreshold || issues.some((i) => i.severity >= 7)

  return {
    overallQuality,
    depthScore,
    diversityScore,
    originalityScore,
    issues,
    recommendations,
    needsModeration,
  }
}

/**
 * Analiza la profundidad de los argumentos
 */
function analyzeDepth(messages: DebateMessage[], issues: QualityIssue[]): number {
  let totalDepth = 0
  const shallowMessages: number[] = []

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]!
    const depth = calculateMessageDepth(message)
    totalDepth += depth

    // Detectar mensajes superficiales
    if (depth < 30) {
      shallowMessages.push(i)
    }
  }

  const avgDepth = totalDepth / messages.length

  // Si más del 40% de los mensajes son superficiales
  if (shallowMessages.length / messages.length > 0.4) {
    issues.push({
      type: 'shallow',
      severity: 8,
      description: `${shallowMessages.length} mensajes carecen de profundidad suficiente`,
      affectedMessages: shallowMessages,
    })
  }

  return Math.round(avgDepth)
}

/**
 * Calcula la profundidad de un mensaje individual
 */
function calculateMessageDepth(message: DebateMessage): number {
  const content = message.content
  let score = 0

  // Longitud (max 30 puntos)
  const wordCount = content.split(/\s+/).length
  score += Math.min(30, wordCount / 5)

  // Presencia de datos/números (15 puntos)
  if (/\d+%|\d+\$|\d+€|\d+x/.test(content)) {
    score += 15
  }

  // Presencia de comparaciones (15 puntos)
  if (/versus|vs|comparado con|en contraste|por otro lado/i.test(content)) {
    score += 15
  }

  // Presencia de razonamiento causal (20 puntos)
  if (/porque|debido a|por lo tanto|esto significa|implica|resulta en/i.test(content)) {
    score += 20
  }

  // Presencia de ejemplos concretos (20 puntos)
  if (/por ejemplo|como|tal como|específicamente|en el caso de/i.test(content)) {
    score += 20
  }

  return Math.min(100, score)
}

/**
 * Analiza la diversidad de perspectivas
 */
function analyzeDiversity(messages: DebateMessage[], issues: QualityIssue[]): number {
  // Contar agentes únicos
  const uniqueAgents = new Set(messages.map((m) => m.agentKey))
  const agentDiversity = (uniqueAgents.size / 4) * 100 // Asumiendo 4 agentes max

  // Analizar variedad de perspectivas en el contenido
  const perspectives = new Set<string>()
  for (const message of messages) {
    const content = message.content.toLowerCase()

    // Detectar perspectivas
    if (content.includes('riesgo') || content.includes('problema')) {
      perspectives.add('risk')
    }
    if (content.includes('oportunidad') || content.includes('beneficio')) {
      perspectives.add('opportunity')
    }
    if (content.includes('dato') || content.includes('evidencia')) {
      perspectives.add('data')
    }
    if (content.includes('cliente') || content.includes('usuario')) {
      perspectives.add('customer')
    }
  }

  const perspectiveDiversity = (perspectives.size / 4) * 100

  const diversityScore = Math.round((agentDiversity + perspectiveDiversity) / 2)

  // Detectar falta de diversidad
  if (diversityScore < 50) {
    issues.push({
      type: 'lack_of_diversity',
      severity: 7,
      description: 'El debate carece de diversidad de perspectivas',
      affectedMessages: [],
    })
  }

  return diversityScore
}

/**
 * Analiza la originalidad (detecta repetición)
 */
function analyzeOriginality(
  messages: DebateMessage[],
  issues: QualityIssue[],
  strict: boolean
): number {
  const repetitiveMessages: number[] = []
  const seenConcepts = new Set<string>()

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]!
    const concepts = extractKeyConcepts(message.content)

    let repetitionCount = 0
    for (const concept of concepts) {
      if (seenConcepts.has(concept)) {
        repetitionCount++
      } else {
        seenConcepts.add(concept)
      }
    }

    // Si más del 70% de los conceptos son repetidos
    const repetitionRate = concepts.length > 0 ? repetitionCount / concepts.length : 0
    if (repetitionRate > 0.7) {
      repetitiveMessages.push(i)
    }
  }

  const originalityScore = Math.round(100 - (repetitiveMessages.length / messages.length) * 100)

  // Detectar repetición excesiva
  const threshold = strict ? 0.3 : 0.5
  if (repetitiveMessages.length / messages.length > threshold) {
    issues.push({
      type: 'repetitive',
      severity: 6,
      description: `${repetitiveMessages.length} mensajes repiten conceptos ya discutidos`,
      affectedMessages: repetitiveMessages,
    })
  }

  return originalityScore
}

/**
 * Extrae conceptos clave de un texto
 */
function extractKeyConcepts(text: string): string[] {
  // Normalizar
  const normalized = text
    .toLowerCase()
    .replace(/[.,;:!?()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Palabras clave (sustantivos, verbos importantes)
  const words = normalized.split(' ')

  // Filtrar palabras comunes (stopwords simplificado)
  const stopwords = new Set([
    'el',
    'la',
    'los',
    'las',
    'un',
    'una',
    'de',
    'del',
    'en',
    'y',
    'o',
    'que',
    'es',
    'por',
    'para',
    'con',
    'sin',
    'sobre',
    'entre',
    'a',
    'al',
    'como',
    'más',
    'muy',
    'pero',
    'si',
    'no',
    'se',
    'su',
    'sus',
    'este',
    'esta',
    'esto',
  ])

  const concepts = words.filter((w) => w.length > 3 && !stopwords.has(w))

  return concepts
}

/**
 * Genera recomendaciones basadas en los problemas detectados
 */
function generateRecommendations(issues: QualityIssue[], overallQuality: number): string[] {
  const recommendations: string[] = []

  // Recomendaciones por tipo de problema
  for (const issue of issues) {
    switch (issue.type) {
      case 'shallow':
        recommendations.push(
          'Profundizar en los argumentos con datos, ejemplos y razonamiento causal'
        )
        break
      case 'repetitive':
        recommendations.push('Explorar nuevos ángulos y perspectivas no discutidas aún')
        break
      case 'lack_of_diversity':
        recommendations.push('Incorporar perspectivas diversas (riesgos, oportunidades, datos)')
        break
      case 'premature_consensus':
        recommendations.push('Cuestionar las asunciones antes de llegar a conclusiones')
        break
      case 'superficial':
        recommendations.push('Analizar las implicaciones y consecuencias de las opciones')
        break
    }
  }

  // Recomendación general si la calidad es baja
  if (overallQuality < 60) {
    recommendations.push('El debate necesita mayor profundidad y rigor analítico')
  }

  // Eliminar duplicados
  return Array.from(new Set(recommendations))
}

/**
 * Detecta consenso prematuro
 */
export function detectPrematureConsensus(messages: DebateMessage[], round: number): boolean {
  // Si hay consenso muy temprano (antes de ronda 3)
  if (round < 3 && messages.length < 6) {
    return true
  }

  // Si todos los mensajes recientes están de acuerdo
  const recentMessages = messages.slice(-4)
  const agreementCount = recentMessages.filter((m) =>
    /de acuerdo|correcto|exacto|sí|coincido|apoyo/i.test(m.content)
  ).length

  return agreementCount >= 3
}

/**
 * Genera un resumen de calidad para logging
 */
export function summarizeQuality(analysis: QualityAnalysis): string {
  const emoji = analysis.overallQuality >= 80 ? '🟢' : analysis.overallQuality >= 60 ? '🟡' : '🔴'
  return `${emoji} Calidad: ${analysis.overallQuality}/100 | Profundidad: ${analysis.depthScore} | Diversidad: ${analysis.diversityScore} | Originalidad: ${analysis.originalityScore} | Problemas: ${analysis.issues.length}`
}
