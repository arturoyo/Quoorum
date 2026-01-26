/**
 * SaaS Industry Templates
 *
 * Templates for SaaS product decisions: pricing, positioning, roadmap, GTM, vertical selection.
 */

import type { DebateTemplate } from './types'

export const SAAS_TEMPLATES: DebateTemplate[] = [
  {
    id: 'saas-pricing',
    name: 'SaaS Pricing Decision',
    description: 'Decide on pricing tiers and amounts for your SaaS product',
    industry: 'SaaS',
    category: 'Pricing',
    questionTemplate: '¿Debo lanzar {product} a {price1}, {price2} o {price3}?',
    suggestedExperts: ['Patrick Campbell', 'Alex Hormozi', 'Christoph Janz', 'April Dunford'],
    defaultContext: {
      constraints: [
        'Considerar el valor percibido por el cliente',
        'Analizar competencia directa',
        'Evaluar CAC y LTV',
        'Considerar elasticidad de precio',
      ],
      background: 'Producto SaaS B2B con modelo de suscripción mensual',
    },
    examples: [
      '¿Debo lanzar mi producto a 29€, 49€ o 79€?',
      '¿Debo cobrar $99, $199 o $299 por mi CRM?',
    ],
  },
  {
    id: 'saas-positioning',
    name: 'SaaS Positioning Strategy',
    description: 'Define how to position your SaaS product in the market',
    industry: 'SaaS',
    category: 'Positioning',
    questionTemplate: '¿Cómo debo posicionar {product}: {option1}, {option2} o {option3}?',
    suggestedExperts: ['April Dunford', 'Peep Laja', 'Julian Shapiro'],
    defaultContext: {
      constraints: [
        'Identificar diferenciadores clave',
        'Analizar competencia',
        'Considerar buyer personas',
        'Evaluar messaging clarity',
      ],
    },
    examples: [
      '¿Cómo posicionar mi producto: Opción A, Opción B o Opción C?',
      '¿Posicionar como "CRM simple" o "Sales Intelligence Platform"?',
    ],
  },
  {
    id: 'saas-roadmap',
    name: 'SaaS Product Roadmap',
    description: 'Prioritize features and product direction',
    industry: 'SaaS',
    category: 'Product',
    questionTemplate: '¿Qué priorizar en el roadmap: {feature1}, {feature2} o {feature3}?',
    suggestedExperts: ['Rahul Vohra', 'Lenny Rachitsky', 'Des Traynor'],
    defaultContext: {
      constraints: [
        'Maximizar PMF',
        'Considerar esfuerzo vs impacto',
        'Evaluar demanda de usuarios',
        'Analizar ventaja competitiva',
      ],
    },
    examples: [
      '¿Qué priorizar: Forum, Voice Notes o AI Coaching?',
      '¿Construir integraciones, mobile app o analytics avanzados?',
    ],
  },
  {
    id: 'saas-gtm',
    name: 'SaaS Go-to-Market Strategy',
    description: 'Choose the best go-to-market strategy',
    industry: 'SaaS',
    category: 'GTM',
    questionTemplate: '¿Qué estrategia GTM seguir: {strategy1}, {strategy2} o {strategy3}?',
    suggestedExperts: ['Steli Efti', 'Aaron Ross', 'April Dunford', 'Brian Balfour'],
    defaultContext: {
      constraints: [
        'Considerar ACV y sales cycle',
        'Evaluar recursos disponibles',
        'Analizar buyer journey',
        'Considerar escalabilidad',
      ],
    },
    examples: [
      '¿GTM via: Product-Led Growth, Sales-Led o Hybrid?',
      '¿Atacar SMB primero o Enterprise desde el inicio?',
    ],
  },
  {
    id: 'saas-vertical',
    name: 'SaaS Vertical Selection',
    description: 'Choose which vertical/industry to focus on',
    industry: 'SaaS',
    category: 'Strategy',
    questionTemplate: '¿Qué vertical atacar: {vertical1}, {vertical2} o {vertical3}?',
    suggestedExperts: ['April Dunford', 'Tomasz Tunguz', 'Boris Wertz'],
    defaultContext: {
      constraints: [
        'Evaluar tamaño de mercado',
        'Analizar competencia por vertical',
        'Considerar willingness to pay',
        'Evaluar complejidad de venta',
      ],
    },
    examples: [
      '¿Atacar: Inmobiliarias, Seguros o Telecomunicaciones?',
      '¿Vertical: Healthcare, Legal o Financial Services?',
    ],
  },
]

export function getSaasTemplateIds(): string[] {
  return SAAS_TEMPLATES.map((t) => t.id)
}
