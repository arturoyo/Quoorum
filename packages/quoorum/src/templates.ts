/**
 * Forum Templates - Industry-Specific Debate Templates
 *
 * Pre-configured templates for common business decisions by industry
 */

export interface DebateTemplate {
  id: string
  name: string
  description: string
  industry: string
  category: string
  questionTemplate: string
  suggestedExperts: string[]
  defaultContext: {
    constraints?: string[]
    background?: string
  }
  examples: string[]
}

/**
 * SaaS Industry Templates
 */
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
      '¿Debo lanzar Wallie a 29€, 49€ o 79€?',
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
      '¿Cómo posicionar Wallie: WhatsApp CRM, AI Sales Assistant o Sales Automation Platform?',
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

/**
 * Startup/Fundraising Templates
 */
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
    examples: [
      '¿Levantar $500K, $1M o $2M en Seed?',
    ],
  },
]

/**
 * E-commerce Templates
 */
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
    examples: [
      '¿Priorizar: Amazon, DTC (Shopify) o Marketplaces locales?',
    ],
  },
]

/**
 * Marketplace Templates
 */
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
    examples: [
      '¿Priorizar: Supply (vendedores), Demand (compradores) o ambos?',
    ],
  },
]

/**
 * Creator Economy Templates
 */
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

/**
 * All templates combined
 */
export const ALL_TEMPLATES: DebateTemplate[] = [
  ...SAAS_TEMPLATES,
  ...STARTUP_TEMPLATES,
  ...ECOMMERCE_TEMPLATES,
  ...MARKETPLACE_TEMPLATES,
  ...CREATOR_TEMPLATES,
]

/**
 * Get templates by industry
 */
export function getTemplatesByIndustry(industry: string): DebateTemplate[] {
  return ALL_TEMPLATES.filter((t) => t.industry === industry)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): DebateTemplate[] {
  return ALL_TEMPLATES.filter((t) => t.category === category)
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): DebateTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id)
}

/**
 * Search templates
 */
export function searchTemplates(query: string): DebateTemplate[] {
  const lowerQuery = query.toLowerCase()
  return ALL_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery) ||
      t.industry.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get all industries
 */
export function getAllIndustries(): string[] {
  return Array.from(new Set(ALL_TEMPLATES.map((t) => t.industry)))
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(ALL_TEMPLATES.map((t) => t.category)))
}
