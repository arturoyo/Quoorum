/**
 * Investment & VC Templates
 *
 * Templates for investment decisions: deal evaluation, terms, follow-on, exit timing,
 * portfolio prioritization, market timing, fund strategy, and due diligence.
 */

import type { DebateTemplate } from './types'

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

export function getInvestorTemplateIds(): string[] {
  return INVESTOR_TEMPLATES.map((t) => t.id)
}
