/**
 * Predefined Skills
 * Built-in debate skills available to all companies.
 */

export interface PredefinedSkill {
  slug: string
  name: string
  description: string
  category: 'strategy' | 'finance' | 'marketing' | 'operations' | 'hr' | 'legal' | 'product' | 'custom'
  icon: string
  systemPromptTemplate: string
  suggestedExperts: string[]
  suggestedRounds: number
  outputTemplate: string
}

export const PREDEFINED_SKILLS: PredefinedSkill[] = [
  {
    slug: 'swot-analysis',
    name: 'Analisis SWOT',
    description: 'Evalua Fortalezas, Debilidades, Oportunidades y Amenazas de una decision o estrategia.',
    category: 'strategy',
    icon: 'Grid2x2',
    systemPromptTemplate: `Realiza un analisis SWOT completo sobre el tema del debate.
Estructura tu respuesta en 4 secciones claras:
- FORTALEZAS: Ventajas internas actuales
- DEBILIDADES: Limitaciones internas actuales
- OPORTUNIDADES: Factores externos favorables
- AMENAZAS: Factores externos desfavorables
Proporciona al menos 3 puntos por seccion con justificacion.`,
    suggestedExperts: ['april_dunford', 'michael_porter'],
    suggestedRounds: 5,
    outputTemplate: `## Analisis SWOT\n\n### Fortalezas\n- \n\n### Debilidades\n- \n\n### Oportunidades\n- \n\n### Amenazas\n- `,
  },
  {
    slug: 'risk-assessment',
    name: 'Evaluacion de Riesgos',
    description: 'Identifica, evalua y prioriza riesgos asociados a una decision.',
    category: 'strategy',
    icon: 'ShieldAlert',
    systemPromptTemplate: `Realiza una evaluacion de riesgos exhaustiva sobre el tema del debate.
Para cada riesgo identificado, proporciona:
- Descripcion del riesgo
- Probabilidad (Alta/Media/Baja)
- Impacto (Alto/Medio/Bajo)
- Mitigacion propuesta
Prioriza los riesgos por severidad (probabilidad x impacto).`,
    suggestedExperts: ['brad_feld', 'bill_gurley'],
    suggestedRounds: 6,
    outputTemplate: `## Evaluacion de Riesgos\n\n| Riesgo | Probabilidad | Impacto | Severidad | Mitigacion |\n|--------|-------------|---------|-----------|------------|\n`,
  },
  {
    slug: 'competitor-analysis',
    name: 'Analisis Competitivo',
    description: 'Analiza el panorama competitivo y el posicionamiento estrategico.',
    category: 'marketing',
    icon: 'Swords',
    systemPromptTemplate: `Realiza un analisis competitivo detallado.
Evalua:
- Competidores directos e indirectos
- Ventajas competitivas de cada uno
- Gaps de mercado y oportunidades
- Recomendaciones de posicionamiento
Usa frameworks como Porter's Five Forces cuando sea relevante.`,
    suggestedExperts: ['april_dunford', 'patrick_campbell'],
    suggestedRounds: 5,
    outputTemplate: `## Analisis Competitivo\n\n### Mapa Competitivo\n\n### Ventajas y Gaps\n\n### Recomendaciones\n`,
  },
  {
    slug: 'pricing-strategy',
    name: 'Estrategia de Precios',
    description: 'Define la estrategia de precios optima basada en valor, competencia y mercado.',
    category: 'finance',
    icon: 'DollarSign',
    systemPromptTemplate: `Analiza y recomienda una estrategia de precios.
Considera:
- Value-based pricing vs cost-plus vs competitive
- Segmentacion de clientes y willingness to pay
- Estructura de tiers/planes
- Impacto en unit economics (LTV, CAC, margen)
- Estrategia de descuentos y promociones
Proporciona numeros concretos cuando sea posible.`,
    suggestedExperts: ['patrick_campbell', 'alex_hormozi'],
    suggestedRounds: 6,
    outputTemplate: `## Estrategia de Precios\n\n### Modelo Recomendado\n\n### Estructura de Tiers\n\n### Unit Economics Proyectados\n`,
  },
  {
    slug: 'go-to-market',
    name: 'Go-to-Market',
    description: 'Disena la estrategia de lanzamiento al mercado para un producto o feature.',
    category: 'marketing',
    icon: 'Rocket',
    systemPromptTemplate: `Disena una estrategia Go-to-Market completa.
Incluye:
- Target audience y ICP (Ideal Customer Profile)
- Canales de adquisicion prioritarios
- Messaging y posicionamiento
- Metricas de exito y KPIs
- Timeline de lanzamiento
- Budget estimado por canal`,
    suggestedExperts: ['april_dunford', 'brian_balfour'],
    suggestedRounds: 7,
    outputTemplate: `## Estrategia Go-to-Market\n\n### ICP\n\n### Canales\n\n### Timeline\n\n### KPIs\n`,
  },
  {
    slug: 'due-diligence',
    name: 'Due Diligence',
    description: 'Framework de investigacion profunda para decisiones de inversion o adquisicion.',
    category: 'finance',
    icon: 'SearchCheck',
    systemPromptTemplate: `Realiza un analisis de due diligence.
Evalua estas areas:
- Mercado: Tamano, crecimiento, dinamica competitiva
- Producto: Defensibilidad tecnica, roadmap, product-market fit
- Equipo: Capacidad, track record, gaps
- Finanzas: Unit economics, runway, proyecciones
- Riesgos: Legales, regulatorios, tecnologicos
Asigna un score de 1-10 a cada area.`,
    suggestedExperts: ['marc_andreessen', 'bill_gurley', 'chamath_palihapitiya'],
    suggestedRounds: 8,
    outputTemplate: `## Due Diligence\n\n| Area | Score | Hallazgos |\n|------|-------|----------|\n\n### Recomendacion Final\n`,
  },
]
