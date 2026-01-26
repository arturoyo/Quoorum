/**
 * E-commerce Templates
 *
 * Templates for e-commerce business decisions: channel strategy.
 */

import type { DebateTemplate } from './types'

export const ECOMMERCE_TEMPLATES: DebateTemplate[] = [
  {
    id: 'ecommerce-channel',
    name: 'E-commerce Channel Strategy',
    description: 'Choose which sales channels to prioritize',
    industry: 'E-commerce',
    category: 'Distribution',
    questionTemplate: '¿Qué canal priorizar: {channel1}, {channel2} o {channel3}?',
    suggestedExperts: ['Julian Shapiro', 'Brian Balfour', 'Sahil Lavingia'],
    defaultContext: {
      constraints: [
        'Evaluar CAC por canal',
        'Considerar control de marca',
        'Analizar márgenes',
        'Evaluar escalabilidad',
      ],
    },
    examples: ['¿Priorizar: Amazon, DTC (Shopify) o Marketplaces locales?'],
  },
]

export function getEcommerceTemplateIds(): string[] {
  return ECOMMERCE_TEMPLATES.map((t) => t.id)
}
