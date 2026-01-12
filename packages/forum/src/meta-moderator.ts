/**
 * Meta-Moderator
 *
 * Interviene cuando el debate pierde calidad para:
 * - Forzar mayor profundidad
 * - Cuestionar asunciones
 * - Explorar ángulos no considerados
 * - Prevenir consenso prematuro
 */

import type { QualityAnalysis, QualityIssue } from './quality-monitor'

/**
 * Tipo de intervención del meta-moderador
 */
export type ModerationType =
  | 'challenge_depth'
  | 'challenge_assumptions'
  | 'explore_alternatives'
  | 'prevent_premature_consensus'
  | 'request_evidence'
  | 'diversify_perspectives'

/**
 * Intervención del meta-moderador
 */
export interface ModeratorIntervention {
  /** Tipo de intervención */
  type: ModerationType
  /** Prompt de intervención para los agentes */
  prompt: string
  /** Razón de la intervención */
  reason: string
  /** Severidad (1-10) */
  severity: number
  /** Agentes específicos a los que va dirigida (vacío = todos) */
  targetAgents?: string[]
}

/**
 * Decide si el meta-moderador debe intervenir
 */
export function shouldIntervene(qualityAnalysis: QualityAnalysis): boolean {
  return qualityAnalysis.needsModeration
}

/**
 * Genera una intervención basada en el análisis de calidad
 */
export function generateIntervention(qualityAnalysis: QualityAnalysis): ModeratorIntervention {
  // Priorizar por severidad
  const sortedIssues = [...qualityAnalysis.issues].sort((a, b) => b.severity - a.severity)

  if (sortedIssues.length === 0) {
    // Intervención genérica si no hay issues específicos pero la calidad es baja
    return {
      type: 'challenge_depth',
      prompt: generateGenericChallengePrompt(qualityAnalysis),
      reason: 'Calidad general del debate por debajo del umbral',
      severity: 5,
    }
  }

  const primaryIssue = sortedIssues[0]!

  // Generar intervención específica según el tipo de problema
  return generateSpecificIntervention(primaryIssue, qualityAnalysis)
}

/**
 * Genera intervención específica según el tipo de problema
 */
function generateSpecificIntervention(
  issue: QualityIssue,
  analysis: QualityAnalysis
): ModeratorIntervention {
  switch (issue.type) {
    case 'shallow':
      return {
        type: 'challenge_depth',
        prompt: `⚠️ META-MODERADOR: El debate carece de profundidad suficiente.

INSTRUCCIONES OBLIGATORIAS:
1. Proporciona datos concretos, números, porcentajes o evidencia cuantitativa
2. Explica el razonamiento causal: ¿POR QUÉ esta opción es mejor/peor?
3. Incluye ejemplos específicos de casos reales o escenarios concretos
4. Analiza las implicaciones a corto, medio y largo plazo
5. Compara explícitamente las opciones con métricas claras

NO respondas con generalidades. Profundiza con rigor analítico.`,
        reason: issue.description,
        severity: issue.severity,
      }

    case 'repetitive':
      return {
        type: 'explore_alternatives',
        prompt: `⚠️ META-MODERADOR: El debate se está volviendo repetitivo.

INSTRUCCIONES OBLIGATORIAS:
1. Identifica ángulos NO explorados todavía
2. Considera perspectivas contrarias a las ya expresadas
3. Explora escenarios edge-case o situaciones extremas
4. Analiza trade-offs secundarios no mencionados
5. Cuestiona las asunciones implícitas en los argumentos previos

NO repitas lo ya dicho. Aporta perspectivas NUEVAS.`,
        reason: issue.description,
        severity: issue.severity,
      }

    case 'lack_of_diversity':
      return {
        type: 'diversify_perspectives',
        prompt: `⚠️ META-MODERADOR: El debate carece de diversidad de perspectivas.

INSTRUCCIONES OBLIGATORIAS:
1. Analiza desde la perspectiva del RIESGO: ¿Qué puede salir mal?
2. Analiza desde la perspectiva de OPORTUNIDAD: ¿Qué se gana?
3. Analiza desde la perspectiva del CLIENTE: ¿Cómo lo perciben?
4. Analiza desde la perspectiva FINANCIERA: ¿Cuál es el ROI?
5. Analiza desde la perspectiva OPERATIVA: ¿Cómo se ejecuta?

Cubre AL MENOS 3 perspectivas diferentes en tu respuesta.`,
        reason: issue.description,
        severity: issue.severity,
      }

    case 'premature_consensus':
      return {
        type: 'prevent_premature_consensus',
        prompt: `⚠️ META-MODERADOR: Detectado consenso prematuro sin exploración suficiente.

INSTRUCCIONES OBLIGATORIAS:
1. Identifica asunciones NO cuestionadas en el consenso actual
2. Propón escenarios donde el consenso podría ser incorrecto
3. Analiza los costos ocultos o riesgos no considerados
4. Considera factores externos que podrían invalidar el consenso
5. Sugiere experimentos o validaciones antes de decidir

NO aceptes el consenso sin cuestionarlo rigurosamente.`,
        reason: issue.description,
        severity: issue.severity,
      }

    case 'superficial':
      return {
        type: 'request_evidence',
        prompt: `⚠️ META-MODERADOR: Los argumentos carecen de evidencia sólida.

INSTRUCCIONES OBLIGATORIAS:
1. Proporciona datos cuantitativos que respalden tus afirmaciones
2. Cita casos de estudio, investigaciones o benchmarks relevantes
3. Explica la metodología detrás de tus conclusiones
4. Cuantifica el impacto esperado con rangos realistas
5. Identifica métricas clave para validar las hipótesis

NO hagas afirmaciones sin evidencia. Respalda todo con datos.`,
        reason: issue.description,
        severity: issue.severity,
      }

    default:
      return {
        type: 'challenge_assumptions',
        prompt: generateGenericChallengePrompt(analysis),
        reason: 'Problema de calidad no categorizado',
        severity: 5,
      }
  }
}

/**
 * Genera prompt genérico de desafío
 */
function generateGenericChallengePrompt(analysis: QualityAnalysis): string {
  return `⚠️ META-MODERADOR: El debate necesita mayor rigor.

Calidad actual: ${analysis.overallQuality}/100
- Profundidad: ${analysis.depthScore}/100
- Diversidad: ${analysis.diversityScore}/100
- Originalidad: ${analysis.originalityScore}/100

INSTRUCCIONES:
1. Profundiza en los argumentos con datos y evidencia
2. Explora perspectivas no consideradas
3. Cuestiona las asunciones implícitas
4. Analiza trade-offs y consecuencias
5. Proporciona ejemplos concretos

Eleva el nivel del debate con análisis riguroso.`
}

/**
 * Genera múltiples intervenciones si hay varios problemas graves
 */
export function generateMultipleInterventions(
  qualityAnalysis: QualityAnalysis,
  maxInterventions = 2
): ModeratorIntervention[] {
  const severeIssues = qualityAnalysis.issues
    .filter((i) => i.severity >= 7)
    .sort((a, b) => b.severity - a.severity)
    .slice(0, maxInterventions)

  if (severeIssues.length === 0) {
    return [generateIntervention(qualityAnalysis)]
  }

  return severeIssues.map((issue) => generateSpecificIntervention(issue, qualityAnalysis))
}

/**
 * Genera prompt de intervención dirigido a agentes específicos
 */
export function generateTargetedIntervention(
  intervention: ModeratorIntervention,
  agentKey: string
): string {
  return `${intervention.prompt}

[Dirigido específicamente a: ${agentKey}]`
}

/**
 * Determina la frecuencia de intervención basada en la calidad
 */
export function getInterventionFrequency(qualityAnalysis: QualityAnalysis): number {
  // Calidad alta: intervenir cada 5 rondas
  if (qualityAnalysis.overallQuality >= 80) {
    return 5
  }

  // Calidad media: intervenir cada 3 rondas
  if (qualityAnalysis.overallQuality >= 60) {
    return 3
  }

  // Calidad baja: intervenir cada 2 rondas
  return 2
}

/**
 * Genera resumen de intervención para logging
 */
export function summarizeIntervention(intervention: ModeratorIntervention): string {
  const emoji = intervention.severity >= 8 ? '🚨' : intervention.severity >= 6 ? '⚠️' : 'ℹ️'
  return `${emoji} Intervención: ${intervention.type} | Severidad: ${intervention.severity}/10 | Razón: ${intervention.reason}`
}

/**
 * Valida si una intervención fue efectiva
 */
export function wasInterventionEffective(
  beforeQuality: QualityAnalysis,
  afterQuality: QualityAnalysis
): boolean {
  // La intervención fue efectiva si:
  // 1. La calidad general mejoró al menos 10 puntos
  // 2. O al menos uno de los scores mejoró significativamente (15+ puntos)
  const qualityImprovement = afterQuality.overallQuality - beforeQuality.overallQuality
  const depthImprovement = afterQuality.depthScore - beforeQuality.depthScore
  const diversityImprovement = afterQuality.diversityScore - beforeQuality.diversityScore
  const originalityImprovement = afterQuality.originalityScore - beforeQuality.originalityScore

  return (
    qualityImprovement >= 10 ||
    depthImprovement >= 15 ||
    diversityImprovement >= 15 ||
    originalityImprovement >= 15
  )
}
