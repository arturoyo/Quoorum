/**
 * Marketplace Templates
 *
 * Templates for marketplace business decisions: side prioritization.
 */

import type { DebateTemplate } from './types'

export const MARKETPLACE_TEMPLATES: DebateTemplate[] = [
  {
    id: 'marketplace-side',
    name: 'Marketplace Side Priority',
    description: 'Decide which side of the marketplace to prioritize',
    industry: 'Marketplace',
    category: 'Growth',
    questionTemplate: '¿Qué lado priorizar: {side1}, {side2} o balanceado?',
    suggestedExperts: ['Boris Wertz', 'Brian Balfour', 'Lenny Rachitsky'],
    defaultContext: {
      constraints: [
        'Analizar chicken-and-egg problem',
        'Evaluar cual lado es más difícil',
        'Considerar network effects',
        'Analizar retention por lado',
      ],
    },
    examples: ['¿Priorizar: Supply (vendedores), Demand (compradores) o ambos?'],
  },
]

export function getMarketplaceTemplateIds(): string[] {
  return MARKETPLACE_TEMPLATES.map((t) => t.id)
}
