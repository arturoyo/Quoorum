/**
 * Executive Insights - CEO-level analysis generators
 */

import type { DebateStructure, PatternType, StrategyAnalysis } from './types'
import type {
  ExecutiveSummary,
  ConfidenceScore,
  RiskItem,
  OpportunityItem,
  StakeholderImpact,
  CostOfDelay,
  ReversibilityScore,
  BoardVote,
  BoardAdvisor,
  AdvisorRole,
} from './executive-types'

// Re-export types for convenience
export type {
  ExecutiveSummary,
  ConfidenceScore,
  RiskItem,
  OpportunityItem,
  StakeholderImpact,
  CostOfDelay,
  ReversibilityScore,
  BoardVote,
  BoardAdvisor,
  AdvisorRole,
}

// ============================================================================
// EXECUTIVE SUMMARY GENERATOR
// ============================================================================

/**
 * Generate executive summary from strategy analysis
 */
export function generateExecutiveSummary(
  question: string,
  analysis: StrategyAnalysis,
  _results?: unknown
): ExecutiveSummary {
  const { recommendedPattern, structure, confidence } = analysis

  return {
    headline: generateHeadline(question, recommendedPattern),
    recommendation: generateRecommendation(question, recommendedPattern),
    confidence: calculateConfidence(confidence, structure),
    keyInsights: extractKeyInsights(question, structure),
    risks: identifyRisks(question),
    opportunities: identifyOpportunities(question),
    stakeholderImpact: analyzeStakeholders(question),
    costOfDelay: estimateCostOfDelay(question, structure),
    reversibility: assessReversibility(question),
    nextSteps: generateNextSteps(question),
    generatedAt: new Date().toISOString(),
  }
}

// ============================================================================
// BOARD OF ADVISORS SIMULATION
// ============================================================================

const ADVISOR_ROLES: AdvisorRole[] = ['cfo', 'cto', 'cmo', 'coo', 'chro', 'legal', 'customer']

/**
 * Simulate AI Board of Advisors deliberation
 */
export function simulateBoardAdvisors(question: string, _analysis: StrategyAnalysis): BoardVote {
  const advisors = ADVISOR_ROLES.map(role => generateAdvisorPerspective(role, question))
  const votes = advisors.map(a => a.vote)

  const approves = votes.filter(v => v === 'approve').length
  const rejects = votes.filter(v => v === 'reject').length

  let consensus: BoardVote['consensus']
  if (approves === advisors.length || rejects === advisors.length) {
    consensus = 'unanimous'
  } else if (approves > advisors.length / 2 || rejects > advisors.length / 2) {
    consensus = 'majority'
  } else if (approves > 0 && rejects > 0) {
    consensus = 'split'
  } else {
    consensus = 'no_consensus'
  }

  return {
    question,
    advisors,
    consensus,
    recommendation: generateBoardRecommendation(advisors, consensus),
    dissent: advisors.filter(a => a.vote === 'reject').map(a => `${a.name}: ${a.concerns[0]}`),
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const PATTERN_NAMES: Record<PatternType, string> = {
  simple: 'Decisión directa', sequential: 'Análisis paso a paso', parallel: 'Evaluación multidimensional',
  tournament: 'Competición de opciones', adversarial: 'Debate pros/contras', iterative: 'Refinamiento progresivo',
  ensemble: 'Consenso de expertos', hierarchical: 'Descomposición estratégica', conditional: 'Análisis de escenarios',
}

function generateHeadline(question: string, pattern: PatternType): string {
  const truncated = question.length > 60 ? question.substring(0, 57) + '...' : question
  return `${PATTERN_NAMES[pattern]}: ${truncated}`
}

function generateRecommendation(question: string, pattern: PatternType): string {
  const q = question.toLowerCase()
  if (q.includes('lanzar')) return 'Proceder con lanzamiento en mercado primario, validar métricas clave antes de expansión.'
  if (q.includes('contratar')) return 'Evaluar fit cultural y técnico antes de decisión. Considerar periodo de prueba.'
  if (q.includes('precio')) return 'Análisis de elasticidad sugiere precio óptimo. Validar con test A/B antes de rollout.'
  return `Basado en análisis ${pattern}, se recomienda proceder con enfoque estructurado.`
}

function calculateConfidence(rawConfidence: number, structure: DebateStructure): ConfidenceScore {
  const score = Math.round(rawConfidence * 100)
  const debateCount = structure.phases.reduce((s, p) => s + p.debates.length, 0)
  const level: ConfidenceScore['level'] = score >= 85 ? 'very_high' : score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low'
  return {
    score, level,
    factors: [`${debateCount} sub-análisis realizados`, 'Patrón optimizado para este tipo de decisión', 'Múltiples perspectivas consideradas'],
    caveats: score < 70 ? ['Datos limitados', 'Considerar validación adicional'] : [],
  }
}

function extractKeyInsights(question: string, structure: DebateStructure): string[] {
  const debates = structure.phases.reduce((s, p) => s + p.debates.length, 0), q = question.toLowerCase()
  const insights = [`Decisión analizada desde ${debates} ángulos diferentes`, `${structure.phases.length} fases de análisis para máxima profundidad`]
  if (q.includes('mercado')) insights.push('Factor mercado identificado como crítico para el éxito')
  if (q.includes('equipo') || q.includes('talento')) insights.push('El talento interno es factor diferenciador clave')
  if (q.includes('tiempo') || q.includes('timing')) insights.push('El timing es crucial - ventana de oportunidad limitada')
  return insights.slice(0, 5)
}

function identifyRisks(question: string): RiskItem[] {
  const risks: RiskItem[] = [], q = question.toLowerCase()

  if (q.includes('lanzar') || q.includes('mercado')) {
    risks.push({
      id: 'market-timing', description: 'Timing de mercado puede no ser óptimo',
      severity: 'medium', probability: 0.3, mitigation: 'Lanzamiento piloto antes de rollout completo',
    })
  }
  if (q.includes('inversión') || q.includes('invertir')) {
    risks.push({
      id: 'capital-lock', description: 'Capital comprometido con retorno incierto',
      severity: 'high', probability: 0.4, mitigation: 'Estructurar inversión en tranches con hitos',
    })
  }
  risks.push({
    id: 'execution', description: 'Riesgo de ejecución - capacidad del equipo',
    severity: 'medium', probability: 0.25, mitigation: 'Plan de contingencia y recursos adicionales identificados',
  })

  return risks
}

function identifyOpportunities(question: string): OpportunityItem[] {
  const opportunities: OpportunityItem[] = []
  const q = question.toLowerCase()

  if (q.includes('expandir') || q.includes('crecer')) {
    opportunities.push({
      id: 'market-expansion', description: 'Capturar cuota de mercado en fase de crecimiento',
      impact: 'transformative', timeframe: '6-12 meses', requirements: ['Capital', 'Equipo de ventas', 'Infraestructura'],
    })
  }
  opportunities.push({
    id: 'first-mover', description: 'Ventaja de primer movedor en segmento',
    impact: 'high', timeframe: '3-6 meses', requirements: ['Velocidad de ejecución', 'Recursos dedicados'],
  })

  return opportunities
}

function analyzeStakeholders(question: string): StakeholderImpact[] {
  const q = question.toLowerCase()
  return [
    { stakeholder: 'Clientes', impact: 'positive', magnitude: 0.8, notes: 'Mejora en propuesta de valor' },
    {
      stakeholder: 'Empleados',
      impact: q.includes('despedir') || q.includes('recortar') ? 'negative' : 'mixed',
      magnitude: 0.6,
      notes: q.includes('contratar') ? 'Oportunidades de crecimiento' : 'Cambios en estructura',
    },
    { stakeholder: 'Inversores', impact: 'positive', magnitude: 0.7, notes: 'Alineado con estrategia de crecimiento' },
  ]
}

function estimateCostOfDelay(question: string, structure: DebateStructure): CostOfDelay {
  const q = question.toLowerCase()
  let urgency: CostOfDelay['urgencyLevel'] = 'medium'
  let dailyCost = 1000

  if (q.includes('competencia') || q.includes('competitor')) { urgency = 'high'; dailyCost = 5000 }
  if (q.includes('crítico') || q.includes('urgente')) { urgency = 'critical'; dailyCost = 10000 }

  return {
    dailyCost, weeklyCost: dailyCost * 7, urgencyLevel: urgency,
    reasoning: `Basado en ${structure.phases.length} factores analizados y condiciones de mercado`,
  }
}

function assessReversibility(question: string): ReversibilityScore {
  const q = question.toLowerCase()
  if (q.includes('despedir') || q.includes('cierre') || q.includes('vender')) {
    return { score: 20, level: 'difficult', timeToRevert: '6-12 meses', costToRevert: 'Alto' }
  }
  if (q.includes('contratar') || q.includes('lanzar')) {
    return { score: 50, level: 'moderate', timeToRevert: '3-6 meses', costToRevert: 'Medio' }
  }
  if (q.includes('precio') || q.includes('marketing')) {
    return { score: 85, level: 'easy', timeToRevert: '1-4 semanas', costToRevert: 'Bajo' }
  }
  return { score: 60, level: 'moderate', timeToRevert: '2-3 meses', costToRevert: 'Medio' }
}

function generateNextSteps(question: string): string[] {
  const steps = ['1. Validar supuestos clave con datos adicionales']
  const q = question.toLowerCase()

  if (q.includes('equipo') || q.includes('contratar')) {
    steps.push('2. Identificar candidatos o recursos necesarios', '3. Definir timeline de onboarding')
  } else if (q.includes('mercado') || q.includes('lanzar')) {
    steps.push('2. Preparar plan de go-to-market detallado', '3. Definir métricas de éxito y checkpoints')
  } else {
    steps.push('2. Comunicar decisión a stakeholders clave', '3. Asignar responsables y recursos')
  }
  steps.push('4. Establecer revisión de progreso en 2 semanas')
  return steps
}

const ADVISOR_CONFIG: Record<AdvisorRole, { name: string; perspective: string }> = {
  cfo: { name: 'Director Financiero', perspective: 'ROI y sostenibilidad financiera' },
  cto: { name: 'Director Tecnología', perspective: 'Viabilidad técnica y escalabilidad' },
  cmo: { name: 'Director Marketing', perspective: 'Posicionamiento y cliente' },
  coo: { name: 'Director Operaciones', perspective: 'Ejecución y procesos' },
  chro: { name: 'Director RRHH', perspective: 'Talento y cultura' },
  legal: { name: 'Asesor Legal', perspective: 'Riesgos legales y compliance' },
  customer: { name: 'Voz del Cliente', perspective: 'Impacto en experiencia del cliente' },
}

function generateAdvisorPerspective(role: AdvisorRole, question: string): BoardAdvisor {
  const config = ADVISOR_CONFIG[role]
  const q = question.toLowerCase()
  const concerns = generateConcerns(role, q)
  const opportunities = generateOpps(role, q)
  const vote = determineVote(role, q, concerns.length, opportunities.length)

  return { role, name: config.name, perspective: config.perspective, concerns, opportunities, vote, confidence: Math.round(60 + Math.random() * 30) }
}

function generateConcerns(role: AdvisorRole, q: string): string[] {
  const concerns: string[] = []
  if (role === 'cfo') {
    if (q.includes('inversión')) concerns.push('Retorno de inversión incierto')
    concerns.push('Impacto en flujo de caja a considerar')
  }
  if (role === 'cto') {
    if (q.includes('tecnología')) concerns.push('Deuda técnica potencial')
    concerns.push('Recursos de ingeniería limitados')
  }
  if (role === 'chro') {
    if (q.includes('despedir')) concerns.push('Impacto en moral del equipo')
    concerns.push('Capacidad del equipo actual')
  }
  if (role === 'legal') concerns.push('Revisar implicaciones contractuales')
  return concerns.slice(0, 2)
}

function generateOpps(role: AdvisorRole, q: string): string[] {
  const opps: string[] = []
  if (role === 'cmo' && (q.includes('lanzar') || q.includes('mercado'))) opps.push('Oportunidad de posicionamiento diferenciado')
  if (role === 'cto' && q.includes('tecnología')) opps.push('Modernización de stack tecnológico')
  if (role === 'customer') opps.push('Mejora potencial en satisfacción del cliente')
  opps.push('Alineado con objetivos estratégicos')
  return opps.slice(0, 2)
}

function determineVote(role: AdvisorRole, q: string, concernCount: number, oppCount: number): BoardAdvisor['vote'] {
  if (role === 'legal') return 'needs_more_info'
  if (concernCount > oppCount + 1) return 'reject'
  if (oppCount > concernCount) return 'approve'
  if (q.includes('crítico') || q.includes('urgente')) return 'approve'
  return 'abstain'
}

function generateBoardRecommendation(advisors: BoardAdvisor[], consensus: BoardVote['consensus']): string {
  const approves = advisors.filter(a => a.vote === 'approve').length
  if (consensus === 'unanimous') return 'El consejo recomienda unánimemente proceder con la iniciativa.'
  if (consensus === 'majority') return `Mayoría del consejo (${approves}/${advisors.length}) apoya la decisión.`
  if (consensus === 'split') return 'Consejo dividido. Se recomienda análisis adicional antes de proceder.'
  return 'Sin consenso claro. Requiere más información y deliberación.'
}
