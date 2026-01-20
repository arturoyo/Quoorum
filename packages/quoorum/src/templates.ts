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
 * Investment & VC Templates
 */
export const INVESTOR_TEMPLATES: DebateTemplate[] = [
  {
    id: 'deal-evaluation',
    name: 'Deal Evaluation',
    description: 'Evaluate whether to invest in a startup',
    industry: 'Investment',
    category: 'Deal Flow',
    questionTemplate: '¿Deberíamos invertir en {startup}?',
    suggestedExperts: ['Marc Andreessen', 'Bill Gurley', 'Tomasz Tunguz', 'Jason Lemkin'],
    defaultContext: {
      constraints: [
        'Evaluar equipo y track record de founders',
        'Analizar tamaño de mercado (TAM/SAM/SOM)',
        'Revisar unit economics y métricas clave',
        'Considerar fit con tesis de inversión',
        'Evaluar términos vs mercado actual',
      ],
      background: 'Evaluación de inversión para fondo de venture capital',
    },
    examples: [
      '¿Deberíamos invertir en TechCo que pide $2M a $10M pre?',
      '¿Es Acme AI una buena inversión para nuestro fondo seed?',
      '¿Invertir $500K en esta ronda de FinTech?',
    ],
  },
  {
    id: 'deal-terms',
    name: 'Deal Terms Negotiation',
    description: 'Evaluate and negotiate investment terms',
    industry: 'Investment',
    category: 'Deal Flow',
    questionTemplate: '¿Son aceptables los términos de {deal}: {terms}?',
    suggestedExperts: ['Bill Gurley', 'Brad Feld', 'Jason Lemkin'],
    defaultContext: {
      constraints: [
        'Comparar con términos estándar de mercado',
        'Evaluar protecciones necesarias',
        'Considerar dilución futura',
        'Analizar pro-rata y derechos de información',
      ],
    },
    examples: [
      '¿Aceptar $15M pre-money para Seed o negociar?',
      '¿Son estándar estos términos de liquidation preference?',
    ],
  },
  {
    id: 'follow-on-decision',
    name: 'Follow-on Investment Decision',
    description: 'Decide whether to do follow-on investment in portfolio company',
    industry: 'Investment',
    category: 'Portfolio',
    questionTemplate: '¿Deberíamos hacer follow-on en {company}?',
    suggestedExperts: ['Tomasz Tunguz', 'Christoph Janz', 'Jason Lemkin', 'Boris Wertz'],
    defaultContext: {
      constraints: [
        'Comparar métricas actuales vs proyecciones iniciales',
        'Evaluar nuevos términos vs entrada original',
        'Considerar reservas del fondo disponibles',
        'Analizar convicción actual en la tesis',
        'Evaluar calidad de nuevos inversores entrando',
      ],
      background: 'Decisión de ejercer pro-rata o super pro-rata en ronda de portfolio company',
    },
    examples: [
      '¿Ejercer pro-rata en la Series A de PortfolioCo?',
      '¿Hacer super pro-rata si TechCo está creciendo 3x YoY?',
      '¿Pasar en esta ronda aunque tengamos derechos?',
    ],
  },
  {
    id: 'exit-timing',
    name: 'Exit Timing Decision',
    description: 'Decide when and how to exit an investment',
    industry: 'Investment',
    category: 'Portfolio',
    questionTemplate: '¿Cuándo salir de {company}: {option1}, {option2} o {option3}?',
    suggestedExperts: ['Bill Gurley', 'Marc Andreessen', 'Tomasz Tunguz'],
    defaultContext: {
      constraints: [
        'Evaluar múltiplo actual vs potencial futuro',
        'Considerar liquidez del fondo y LP expectations',
        'Analizar condiciones de mercado para exits',
        'Evaluar alternativas: secondary, M&A, IPO',
      ],
    },
    examples: [
      '¿Vender en secondary ahora a 5x o esperar IPO para 10x?',
      '¿Aceptar oferta de M&A de $100M o seguir creciendo?',
    ],
  },
  {
    id: 'portfolio-prioritization',
    name: 'Portfolio Time Allocation',
    description: 'Prioritize time and resources across portfolio companies',
    industry: 'Investment',
    category: 'Portfolio',
    questionTemplate: '¿Cómo priorizar tiempo entre {company1}, {company2} y {company3}?',
    suggestedExperts: ['Jason Lemkin', 'Tomasz Tunguz', 'Boris Wertz'],
    defaultContext: {
      constraints: [
        'Identificar dónde podemos añadir más valor',
        'Evaluar estado crítico vs stable',
        'Considerar ownership y upside potencial',
        'Analizar needs de cada company',
      ],
    },
    examples: [
      '¿Dónde enfocar: startup en crisis, la que está fundraising, o la que va bien?',
      '¿Dedicar más tiempo a portfolio companies pequeñas o grandes?',
    ],
  },
  {
    id: 'market-timing',
    name: 'Market Timing & Thesis',
    description: 'Evaluate market conditions and investment thesis',
    industry: 'Investment',
    category: 'Strategy',
    questionTemplate: '¿Es buen momento para invertir en {sector}?',
    suggestedExperts: ['Marc Andreessen', 'Bill Gurley', 'Chamath Palihapitiya'],
    defaultContext: {
      constraints: [
        'Analizar ciclo de mercado actual',
        'Evaluar valuaciones vs histórico',
        'Considerar dry powder disponible',
        'Identificar contrarian opportunities',
      ],
    },
    examples: [
      '¿Es momento de invertir heavy en AI o esperar?',
      '¿Las valuaciones de crypto están normalizándose?',
      '¿Doblar apuesta en FinTech o diversificar?',
    ],
  },
  {
    id: 'fund-strategy',
    name: 'Fund Strategy Decision',
    description: 'Strategic decisions about fund operations and focus',
    industry: 'Investment',
    category: 'Strategy',
    questionTemplate: '¿Cómo ajustar estrategia del fondo: {option1}, {option2} o {option3}?',
    suggestedExperts: ['Bill Gurley', 'Tomasz Tunguz', 'Brad Feld'],
    defaultContext: {
      constraints: [
        'Considerar track record y returns actuales',
        'Evaluar LP expectations y timeline',
        'Analizar competencia de otros fondos',
        'Identificar ventaja competitiva sostenible',
      ],
    },
    examples: [
      '¿Especializarnos en vertical o mantenernos generalistas?',
      '¿Subir check size promedio o mantener diversificación?',
      '¿Añadir growth stage o mantenernos en early?',
    ],
  },
  {
    id: 'due-diligence-focus',
    name: 'Due Diligence Deep Dive',
    description: 'Identify critical areas to investigate in due diligence',
    industry: 'Investment',
    category: 'Deal Flow',
    questionTemplate: '¿Qué investigar más a fondo en {company}: {area1}, {area2} o {area3}?',
    suggestedExperts: ['Jason Lemkin', 'Tomasz Tunguz', 'Christoph Janz'],
    defaultContext: {
      constraints: [
        'Priorizar red flags potenciales',
        'Considerar tiempo disponible para DD',
        'Identificar deal-breakers potenciales',
        'Evaluar qué es verificable vs opinión',
      ],
    },
    examples: [
      '¿Profundizar en tech, team o market en DD?',
      '¿Verificar métricas de retention o customer references?',
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
  ...INVESTOR_TEMPLATES,
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
