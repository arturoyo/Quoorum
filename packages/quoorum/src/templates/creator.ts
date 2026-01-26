/**
 * Creator Economy Templates
 *
 * Templates for creator business decisions: monetization strategy.
 */

import type { DebateTemplate } from './types'

export const CREATOR_TEMPLATES: DebateTemplate[] = [
  {
    id: 'creator-monetization',
    name: 'Creator Monetization Strategy',
    description: 'Choose how to monetize your creator business',
    industry: 'Creator Economy',
    category: 'Monetization',
    questionTemplate: '¿Cómo monetizar: {model1}, {model2} o {model3}?',
    suggestedExperts: ['Sahil Lavingia', 'Lenny Rachitsky', 'Alex Hormozi'],
    defaultContext: {
      constraints: [
        'Evaluar engagement actual',
        'Considerar audience size',
        'Analizar willingness to pay',
        'Evaluar esfuerzo requerido',
      ],
    },
    examples: [
      '¿Monetizar via: Membresías, Cursos o Sponsorships?',
      '¿Patreon, Newsletter de pago o Productos digitales?',
    ],
  },
]

export function getCreatorTemplateIds(): string[] {
  return CREATOR_TEMPLATES.map((t) => t.id)
}
