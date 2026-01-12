/**
 * Debate Templates - Pre-built templates for common business decisions
 */

import type { PatternType, SubDebate } from './types'

// ============================================================================
// TYPES
// ============================================================================

export type TemplateCategory =
  | 'strategic'
  | 'product'
  | 'hiring'
  | 'pricing'
  | 'growth'
  | 'operations'
  | 'crisis'

export interface DebateTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  pattern: PatternType
  baseQuestion: string
  subQuestions: string[]
  suggestedPersonas?: string[]
  estimatedMinutes: number
  variables?: string[] // Placeholders like {{product}}, {{candidate}}
  followUpQuestions?: string[]
}

export interface FilledTemplate {
  template: DebateTemplate
  variables: Record<string, string>
  question: string
  debates: SubDebate[]
}

// ============================================================================
// TEMPLATE LIBRARY
// ============================================================================

export const DEBATE_TEMPLATES: Record<string, DebateTemplate> = {
  // STRATEGIC
  pivot_decision: {
    id: 'pivot_decision',
    name: 'Pivot o Perseverar',
    description: 'Decidir si pivotar el modelo de negocio',
    category: 'strategic',
    pattern: 'adversarial',
    baseQuestion: '¿Deberíamos pivotar {{current_model}} hacia {{new_model}}?',
    subQuestions: [
      '¿Qué señales indican que debemos pivotar?',
      '¿Cuál es el coste de oportunidad de cada opción?',
      '¿Tenemos los recursos para el pivot?',
    ],
    suggestedPersonas: ['optimist', 'pessimist', 'analyst'],
    estimatedMinutes: 30,
    variables: ['current_model', 'new_model'],
  },
  market_expansion: {
    id: 'market_expansion',
    name: 'Expansión de Mercado',
    description: 'Evaluar entrada a nuevo mercado',
    category: 'strategic',
    pattern: 'sequential',
    baseQuestion: '¿Deberíamos expandirnos al mercado de {{market}}?',
    subQuestions: [
      '¿Cuál es el TAM/SAM/SOM?',
      '¿Quiénes son los competidores?',
      '¿Qué adaptaciones necesitamos?',
      '¿Cuál es el timeline realista?',
    ],
    suggestedPersonas: ['analyst', 'pragmatist'],
    estimatedMinutes: 45,
    variables: ['market'],
  },
  fundraising: {
    id: 'fundraising',
    name: 'Levantar Ronda',
    description: 'Decidir sobre fundraising',
    category: 'strategic',
    pattern: 'adversarial',
    baseQuestion: '¿Deberíamos levantar una ronda {{round_type}} de {{amount}}?',
    subQuestions: [
      '¿Cuál es nuestro runway actual?',
      '¿Qué hitos podemos alcanzar con este capital?',
      '¿Cuál es la dilución aceptable?',
    ],
    suggestedPersonas: ['optimist', 'pessimist', 'analyst'],
    estimatedMinutes: 40,
    variables: ['round_type', 'amount'],
  },

  // PRODUCT
  feature_priority: {
    id: 'feature_priority',
    name: 'Priorización de Features',
    description: 'Decidir qué feature desarrollar primero',
    category: 'product',
    pattern: 'tournament',
    baseQuestion: '¿Cuál feature deberíamos priorizar: {{features}}?',
    subQuestions: [
      '¿Cuál tiene mayor impacto en retención?',
      '¿Cuál es más fácil de implementar?',
      '¿Cuál nos diferencia más?',
    ],
    suggestedPersonas: ['pragmatist', 'innovator'],
    estimatedMinutes: 20,
    variables: ['features'],
  },
  launch_timing: {
    id: 'launch_timing',
    name: 'Timing de Lanzamiento',
    description: 'Decidir cuándo lanzar',
    category: 'product',
    pattern: 'adversarial',
    baseQuestion: '¿Deberíamos lanzar {{product}} ahora o esperar hasta {{condition}}?',
    subQuestions: [
      '¿Qué falta para MVP viable?',
      '¿Cuál es el coste de esperar?',
      '¿Qué aprenderemos lanzando antes?',
    ],
    suggestedPersonas: ['optimist', 'pessimist'],
    estimatedMinutes: 25,
    variables: ['product', 'condition'],
  },

  // HIRING
  hire_decision: {
    id: 'hire_decision',
    name: 'Decisión de Contratación',
    description: 'Evaluar si contratar a un candidato',
    category: 'hiring',
    pattern: 'adversarial',
    baseQuestion: '¿Deberíamos contratar a {{candidate}} para {{role}}?',
    subQuestions: [
      '¿Cumple los requisitos técnicos?',
      '¿Encaja con la cultura?',
      '¿Cuál es el riesgo de no contratar?',
    ],
    suggestedPersonas: ['optimist', 'pessimist', 'pragmatist'],
    estimatedMinutes: 20,
    variables: ['candidate', 'role'],
  },
  team_structure: {
    id: 'team_structure',
    name: 'Estructura de Equipo',
    description: 'Reorganizar equipo o añadir rol',
    category: 'hiring',
    pattern: 'sequential',
    baseQuestion: '¿Deberíamos {{action}} en el equipo de {{team}}?',
    subQuestions: [
      '¿Cuál es el problema actual?',
      '¿Qué alternativas hay?',
      '¿Cuál es el impacto en moral?',
    ],
    estimatedMinutes: 30,
    variables: ['action', 'team'],
  },

  // PRICING
  pricing_change: {
    id: 'pricing_change',
    name: 'Cambio de Precios',
    description: 'Evaluar ajuste de precios',
    category: 'pricing',
    pattern: 'adversarial',
    baseQuestion: '¿Deberíamos {{action}} el precio de {{product}} a {{new_price}}?',
    subQuestions: [
      '¿Cuál es la elasticidad de demanda?',
      '¿Cómo reaccionará la competencia?',
      '¿Cuál es el impacto en MRR?',
    ],
    suggestedPersonas: ['analyst', 'pessimist'],
    estimatedMinutes: 25,
    variables: ['action', 'product', 'new_price'],
  },

  // GROWTH
  channel_investment: {
    id: 'channel_investment',
    name: 'Inversión en Canal',
    description: 'Decidir inversión en canal de adquisición',
    category: 'growth',
    pattern: 'tournament',
    baseQuestion: '¿Dónde deberíamos invertir {{budget}}: {{channels}}?',
    subQuestions: [
      '¿Cuál tiene mejor CAC histórico?',
      '¿Cuál escala mejor?',
      '¿Cuál tiene menos riesgo?',
    ],
    suggestedPersonas: ['analyst', 'pragmatist'],
    estimatedMinutes: 25,
    variables: ['budget', 'channels'],
  },

  // CRISIS
  crisis_response: {
    id: 'crisis_response',
    name: 'Respuesta a Crisis',
    description: 'Decidir respuesta ante crisis',
    category: 'crisis',
    pattern: 'simple',
    baseQuestion: '¿Cómo deberíamos responder a {{crisis}}?',
    subQuestions: [
      '¿Cuál es el impacto inmediato?',
      '¿Qué comunicamos externamente?',
      '¿Qué acciones son urgentes?',
    ],
    suggestedPersonas: ['pragmatist', 'pessimist'],
    estimatedMinutes: 15,
    variables: ['crisis'],
  },
}

// ============================================================================
// TEMPLATE ENGINE
// ============================================================================

export class TemplateEngine {
  private templates: Map<string, DebateTemplate> = new Map()

  constructor() {
    for (const [id, template] of Object.entries(DEBATE_TEMPLATES)) {
      this.templates.set(id, template)
    }
  }

  /** Get all templates */
  getAll(): DebateTemplate[] {
    return Array.from(this.templates.values())
  }

  /** Get templates by category */
  getByCategory(category: TemplateCategory): DebateTemplate[] {
    return this.getAll().filter((t) => t.category === category)
  }

  /** Get template by ID */
  get(id: string): DebateTemplate | undefined {
    return this.templates.get(id)
  }

  /** Fill template with variables */
  fill(templateId: string, variables: Record<string, string>): FilledTemplate {
    const template = this.templates.get(templateId)
    if (!template) throw new Error(`Template ${templateId} not found`)

    // Replace variables in question
    let question = template.baseQuestion
    for (const [key, value] of Object.entries(variables)) {
      // Security: Escape regex special characters in key
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // eslint-disable-next-line security/detect-non-literal-regexp -- Key is escaped above
      question = question.replace(new RegExp(`{{${escapedKey}}}`, 'g'), value)
    }

    // Create sub-debates
    const timePerQuestion = template.estimatedMinutes / template.subQuestions.length
    const costPerQuestion = timePerQuestion * 0.01 // Rough estimate: $0.01 per minute
    const debates: SubDebate[] = template.subQuestions.map((q, i) => {
      let filled = q
      for (const [key, value] of Object.entries(variables)) {
        // Security: Escape regex special characters in key
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        // eslint-disable-next-line security/detect-non-literal-regexp -- Key is escaped above
        filled = filled.replace(new RegExp(`{{${escapedKey}}}`, 'g'), value)
      }
      return {
        id: `${templateId}-${i + 1}`,
        question: filled,
        inheritContext: i > 0, // Inherit from previous questions
        estimatedCost: costPerQuestion,
        estimatedTimeMinutes: timePerQuestion,
      }
    })

    return { template, variables, question, debates }
  }

  /** Add custom template */
  addTemplate(template: DebateTemplate): void {
    this.templates.set(template.id, template)
  }

  /** Search templates */
  search(query: string): DebateTemplate[] {
    const q = query.toLowerCase()
    return this.getAll().filter(
      (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    )
  }

  /** Get suggested template for question */
  suggest(question: string): DebateTemplate | undefined {
    const q = question.toLowerCase()
    const keywords: Record<string, string[]> = {
      pivot_decision: ['pivotar', 'pivot', 'cambiar modelo'],
      fundraising: ['ronda', 'levantar', 'inversión', 'fundraising'],
      hire_decision: ['contratar', 'candidato', 'hiring'],
      pricing_change: ['precio', 'pricing', 'subir', 'bajar'],
      launch_timing: ['lanzar', 'launch', 'esperar'],
      feature_priority: ['feature', 'priorizar', 'desarrollar'],
    }
    for (const [id, words] of Object.entries(keywords)) {
      if (words.some((w) => q.includes(w))) return this.templates.get(id)
    }
    return undefined
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createTemplateEngine(): TemplateEngine {
  return new TemplateEngine()
}
