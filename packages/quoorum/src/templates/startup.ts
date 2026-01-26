/**
 * Startup/Fundraising Templates
 *
 * Templates for startup fundraising decisions: timing and amount.
 */

import type { DebateTemplate } from './types'

export const STARTUP_TEMPLATES: DebateTemplate[] = [
  {
    id: 'fundraising-timing',
    name: 'Fundraising Timing',
    description: 'Decide when to raise your next round',
    industry: 'Startup',
    category: 'Fundraising',
    questionTemplate: '¿Cuándo levantar capital: {timing1}, {timing2} o {timing3}?',
    suggestedExperts: ['Tomasz Tunguz', 'Jason Lemkin', 'Boris Wertz'],
    defaultContext: {
      constraints: [
        'Evaluar runway actual',
        'Considerar métricas actuales vs ideales',
        'Analizar momentum del negocio',
        'Evaluar condiciones de mercado',
      ],
    },
    examples: [
      '¿Levantar ahora con $50K MRR, esperar a $100K MRR, o bootstrapear hasta $200K MRR?',
    ],
  },
  {
    id: 'fundraising-amount',
    name: 'Fundraising Amount',
    description: 'Decide how much capital to raise',
    industry: 'Startup',
    category: 'Fundraising',
    questionTemplate: '¿Cuánto capital levantar: {amount1}, {amount2} o {amount3}?',
    suggestedExperts: ['Tomasz Tunguz', 'Christoph Janz', 'Jason Lemkin'],
    defaultContext: {
      constraints: [
        'Calcular 18-24 meses de runway',
        'Considerar dilución',
        'Evaluar milestones a alcanzar',
        'Analizar valuation impact',
      ],
    },
    examples: ['¿Levantar $500K, $1M o $2M en Seed?'],
  },
]

export function getStartupTemplateIds(): string[] {
  return STARTUP_TEMPLATES.map((t) => t.id)
}
