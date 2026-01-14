/**
 * Mentor Modes - Specialized advisor perspectives
 *
 * Simulates advice from different types of mentors/investors.
 */

import type { AIProvider, GenerateOptions, DebateContext } from './ai-debate-types'

// ============================================================================
// MENTOR TYPES
// ============================================================================

export type MentorType = 'yc' | 'vc' | 'bootstrap' | 'corporate' | 'serial' | 'technical'

export interface MentorProfile {
  id: MentorType
  name: string
  background: string
  focus: string[]
  style: string
  keyQuestions: string[]
}

export interface MentorAdvice {
  mentor: MentorProfile
  advice: string
  redFlags: string[]
  greenFlags: string[]
  actionItems: string[]
  rating: number // 1-10
  wouldInvest: boolean
}

// ============================================================================
// MENTOR PROFILES
// ============================================================================

export const MENTOR_PROFILES: Record<MentorType, MentorProfile> = {
  yc: {
    id: 'yc', name: 'YC Partner',
    background: 'Ex-founder, Y Combinator partner con 200+ inversiones',
    focus: ['velocidad', 'product-market fit', 'growth', 'fundadores'],
    style: 'Directo, sin filtros, enfocado en lo que importa',
    keyQuestions: ['¿Estás hablando con usuarios?', '¿Cuál es tu métrica north star?', '¿Por qué ahora?'],
  },
  vc: {
    id: 'vc', name: 'VC Tradicional',
    background: 'Partner en fondo Series A-B, 15 años de experiencia',
    focus: ['TAM', 'unit economics', 'moat', 'equipo'],
    style: 'Analítico, enfocado en números y defensibilidad',
    keyQuestions: ['¿Cuál es tu CAC/LTV?', '¿Cómo escala esto?', '¿Qué te hace difícil de copiar?'],
  },
  bootstrap: {
    id: 'bootstrap', name: 'Bootstrapper',
    background: 'Fundador que creció sin inversión hasta $10M ARR',
    focus: ['rentabilidad', 'eficiencia', 'clientes que pagan', 'sostenibilidad'],
    style: 'Pragmático, enfocado en cash flow y clientes reales',
    keyQuestions: ['¿Cuánto tiempo tienes de runway?', '¿Alguien pagaría hoy?', '¿Necesitas realmente inversión?'],
  },
  corporate: {
    id: 'corporate', name: 'Corporate Strategist',
    background: 'Ex-VP de estrategia en Fortune 500',
    focus: ['partnerships', 'enterprise sales', 'compliance', 'escalabilidad'],
    style: 'Metódico, orientado a procesos y estructuras',
    keyQuestions: ['¿Cómo vendes a enterprise?', '¿Tienes compliance?', '¿Cuál es tu ciclo de venta?'],
  },
  serial: {
    id: 'serial', name: 'Serial Entrepreneur',
    background: 'Ha fundado 4 startups, 2 exits exitosos',
    focus: ['timing', 'equipo', 'pivots', 'resiliencia'],
    style: 'Experiencial, comparte historias y errores propios',
    keyQuestions: ['¿Qué has aprendido del fracaso?', '¿Por qué TÚ?', '¿Cuándo pivotas?'],
  },
  technical: {
    id: 'technical', name: 'Technical Founder',
    background: 'CTO que llevó producto de 0 a millones de usuarios',
    focus: ['arquitectura', 'deuda técnica', 'escalabilidad', 'hiring técnico'],
    style: 'Detallista en tecnología pero pragmático en producto',
    keyQuestions: ['¿Escala tu arquitectura?', '¿Cuánta deuda técnica tienes?', '¿Por qué esta tecnología?'],
  },
}

// ============================================================================
// MENTOR ENGINE
// ============================================================================

export class MentorEngine {
  private provider: AIProvider

  constructor(provider: AIProvider) {
    this.provider = provider
  }

  async getAdvice(
    question: string, mentorType: MentorType, context: DebateContext
  ): Promise<MentorAdvice> {
    const mentor = MENTOR_PROFILES[mentorType]
    const prompt = this.buildMentorPrompt(question, mentor, context)
    const options: GenerateOptions = {
      systemPrompt: `Eres ${mentor.name}. ${mentor.background}. Tu estilo: ${mentor.style}.`,
      temperature: 0.7, maxTokens: 1200,
    }

    const response = await this.provider.generateResponse(prompt, options)
    return this.parseAdvice(mentor, response)
  }

  async getAllMentorAdvice(question: string, context: DebateContext): Promise<MentorAdvice[]> {
    const mentorTypes: MentorType[] = ['yc', 'vc', 'bootstrap', 'serial']
    return Promise.all(mentorTypes.map(type => this.getAdvice(question, type, context)))
  }

  private buildMentorPrompt(question: string, mentor: MentorProfile, context: DebateContext): string {
    return `
DECISIÓN A EVALUAR: ${question}

${context.companyContext ? `CONTEXTO DE LA EMPRESA:\n${context.companyContext}` : ''}

Como ${mentor.name}, analiza esta decisión desde tu perspectiva.
Tu enfoque principal: ${mentor.focus.join(', ')}

Proporciona:
1. TU CONSEJO: 2-3 párrafos con tu perspectiva honesta
2. RED FLAGS: 3-5 señales de alarma que ves
3. GREEN FLAGS: 2-3 aspectos positivos
4. ACCIONES INMEDIATAS: 3 cosas que harías esta semana
5. RATING: Del 1-10, ¿qué tan buena es esta decisión?
6. INVERTIRÍA: ¿Apostarías tu dinero en esto? (Sí/No y por qué)

Preguntas que siempre haces: ${mentor.keyQuestions.join(' | ')}

Sé directo y honesto. No endulces la realidad.
`.trim()
  }

  private parseAdvice(mentor: MentorProfile, response: string): MentorAdvice {
    const lines = response.split('\n')
    const redFlags: string[] = [], greenFlags: string[] = [], actionItems: string[] = []
    let rating = 5, wouldInvest = false

    for (const line of lines) {
      const l = line.trim().toLowerCase()
      if (l.includes('red flag') || l.startsWith('- ⚠') || l.startsWith('- 🔴')) {
        redFlags.push(line.replace(/^[-•]\s*/, '').trim())
      }
      if (l.includes('green') || l.startsWith('- ✅') || l.startsWith('- 🟢')) {
        greenFlags.push(line.replace(/^[-•]\s*/, '').trim())
      }
      if (l.includes('acción') || l.includes('hacer') || l.startsWith('- 📋')) {
        actionItems.push(line.replace(/^[-•]\s*/, '').trim())
      }
      const ratingMatch = line.match(/rating[:\s]*(\d+)/i)
      if (ratingMatch?.[1]) rating = parseInt(ratingMatch[1], 10)
      if (l.includes('invertiría') && l.includes('sí')) wouldInvest = true
    }

    return {
      mentor, advice: response,
      redFlags: redFlags.slice(0, 5), greenFlags: greenFlags.slice(0, 3),
      actionItems: actionItems.slice(0, 3), rating: Math.min(10, Math.max(1, rating)), wouldInvest,
    }
  }

  getMentorProfiles(): MentorProfile[] {
    return Object.values(MENTOR_PROFILES)
  }
}

// ============================================================================
// MOCK MENTOR RESPONSES
// ============================================================================

export function getMockMentorAdvice(mentorType: MentorType): MentorAdvice {
  const mentor = MENTOR_PROFILES[mentorType]
  const mockAdvices: Record<MentorType, string> = {
    yc: `Mi consejo: Muévete rápido. Deja de planificar y empieza a ejecutar. Habla con 10 usuarios esta semana.

🔴 RED FLAGS:
- Estás sobreanalizando en lugar de actuar
- No mencionas métricas de usuarios activos
- El timeline es demasiado largo

🟢 GREEN FLAGS:
- El problema es real
- Tienes background relevante

📋 ACCIONES:
- Lanza un MVP esta semana
- Consigue 5 usuarios que paguen
- Define tu métrica north star

RATING: 6/10
INVERTIRÍA: No todavía, pero me interesa ver tracción.`,
    vc: `Análisis detallado de la oportunidad...

🔴 RED FLAGS:
- Unit economics no claros
- TAM necesita validación
- Competencia no mapeada

🟢 GREEN FLAGS:
- Mercado en crecimiento
- Equipo técnico sólido

📋 ACCIONES:
- Calcular CAC/LTV real
- Mapear competencia
- Definir moat

RATING: 5/10
INVERTIRÍA: No en esta etapa.`,
    bootstrap: `Como alguien que creció sin inversión...

🔴 RED FLAGS:
- Gastos innecesarios
- No hay clientes pagando aún
- Dependencia de inversión

🟢 GREEN FLAGS:
- Producto simple
- Bajo costo operativo

📋 ACCIONES:
- Conseguir primer cliente que pague HOY
- Reducir burn rate
- Enfocarte en revenue, no en vanity metrics

RATING: 6/10
INVERTIRÍA: Usaría mi propio dinero si fuera mi proyecto.`,
    corporate: `Desde perspectiva enterprise...`,
    serial: `Habiendo pasado por esto 4 veces...`,
    technical: `Desde el punto de vista técnico...`,
  }

  return {
    mentor, advice: mockAdvices[mentorType],
    redFlags: ['Necesita validación', 'Timeline agresivo'],
    greenFlags: ['Potencial de mercado'],
    actionItems: ['Validar con clientes', 'Iterar rápido'],
    rating: 6, wouldInvest: mentorType === 'yc',
  }
}
