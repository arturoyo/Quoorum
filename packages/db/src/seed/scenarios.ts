/**
 * Seed Data for Scenarios (Decision Playbooks)
 *
 * 3 MVP Escenarios de Oro:
 * A. Validación de Idea & Product-Market Fit (Emprendedor)
 * B. Contratación Crítica vs. Outsourcing (Pyme/Autónomo)
 * C. Análisis de Inversión y Mitigación de Riesgo (Corporate/Inversor)
 */

import { eq } from 'drizzle-orm'
import { db } from '../client'
import { scenarios } from '../schema/scenarios'

// ============================================================================
// ESCENARIO A: Validación de Idea & Product-Market Fit
// ============================================================================

const scenarioA = {
  name: 'Validación de Idea & Product-Market Fit',
  description: 'Evalúa si tu idea de negocio tiene potencial real de mercado. Identifica el punto de ruptura de la idea y valida el product-market fit antes de invertir tiempo y recursos significativos.',
  shortDescription: 'Valida tu idea de negocio y encuentra el product-market fit',
  segment: 'entrepreneur' as const,
  status: 'active' as const,
  expertIds: [
    'april_dunford',      // Positioning & Market Fit
    'rahul_vohra',        // Product-Market Fit
    'brian_balfour',      // Growth Hacker (Devil's Advocate)
    'patrick_campbell',   // Financial Analyst
  ],
  requiresDepartments: false,
  departmentIds: [],
  frameworkId: undefined, // Uses PMF framework implicitly
  masterPromptTemplate: `Eres parte de un panel de expertos evaluando una idea de negocio para determinar su viabilidad y potencial de product-market fit.

IDEA DEL EMPRENDEDOR:
{{user_input}}

{{#if context}}CONTEXTO ADICIONAL:
{{context}}
{{/if}}

OBJETIVO DEL DEBATE:
Identificar el "punto de ruptura" de esta idea. ¿Qué debe cumplir para ser viable? ¿Cuáles son los riesgos críticos? ¿Existe un mercado real dispuesto a pagar?

INSTRUCCIONES ESPECÍFICAS:
- El Growth Hacker debe actuar como "Abogado del Diablo" y cuestionar agresivamente la viabilidad
- El experto en PMF debe buscar evidencia de necesidad real del mercado
- El experto en Positioning debe evaluar la diferenciación y claridad del valor
- El Analista Financiero debe evaluar la sostenibilidad económica

Debatan hasta alcanzar consenso sobre:
1. ¿Es viable esta idea? (Sí/No/Con condiciones)
2. ¿Cuál es el riesgo crítico más importante?
3. ¿Qué validación mínima se necesita antes de seguir?
4. ¿Existe product-market fit potencial?`,
  promptVariables: {
    user_input: {
      label: 'Idea de Negocio',
      description: 'Describe tu idea de negocio en detalle',
      required: true,
    },
    context: {
      label: 'Contexto Adicional',
      description: 'Información adicional sobre el mercado, competencia, o tu situación',
      required: false,
    },
  },
  successMetrics: [
    {
      key: 'viability_score',
      label: 'Puntuación de Viabilidad',
      description: 'Puntuación de 0-100 sobre la viabilidad de la idea',
      type: 'number' as const,
      extractor: 'Extrae una puntuación numérica de 0-100 que represente la viabilidad general de la idea basándote en el consenso del debate.',
    },
    {
      key: 'critical_risk',
      label: 'Riesgo Crítico Principal',
      description: 'El riesgo más importante identificado',
      type: 'string' as const,
      extractor: 'Identifica el riesgo crítico más importante mencionado en el debate.',
    },
    {
      key: 'validation_required',
      label: 'Validación Mínima Requerida',
      description: 'Qué validación se necesita antes de seguir',
      type: 'array' as const,
      extractor: 'Lista las validaciones mínimas que se deben realizar antes de continuar con la idea.',
    },
    {
      key: 'has_pmf_potential',
      label: 'Tiene Potencial de PMF',
      description: 'Si existe potencial de product-market fit',
      type: 'boolean' as const,
      extractor: 'Determina si existe potencial de product-market fit basándote en el debate (true/false).',
    },
  ],
  agentBehaviorOverrides: {
    'brian_balfour': {
      specialInstructions: 'Actúa como Abogado del Diablo. Cuestiona agresivamente la viabilidad de la idea. Busca puntos débiles, riesgos no considerados, y razones por las que podría fallar. Sé constructivo pero escéptico.',
    },
  },
  tokenOptimization: {
    enabled: true,
    maxTokensPerMessage: 50,
    compressionEnabled: true,
  },
  generateCertificate: true,
  certificateTemplate: undefined, // Use default
  minTier: 'free',
  isPublic: true,
}

// ============================================================================
// ESCENARIO B: Contratación Crítica vs. Outsourcing
// ============================================================================

const scenarioB = {
  name: 'Contratación Crítica vs. Outsourcing',
  description: 'Decide si es mejor contratar a tiempo completo o externalizar una función crítica. Compara costes a 12 meses, flexibilidad operativa, y riesgos de ambas opciones.',
  shortDescription: 'Evalúa si contratar o externalizar una función crítica',
  segment: 'sme' as const,
  status: 'active' as const,
  expertIds: [
    'steli_efti',         // Operations & GTM (as HR Director proxy)
    'patrick_campbell',   // CFO (extremely conservative)
    'brian_balfour',      // Operations Specialist (Growth systems)
  ],
  requiresDepartments: false,
  departmentIds: [],
  frameworkId: undefined, // Uses ROI framework implicitly
  masterPromptTemplate: `Eres parte de un panel de expertos evaluando si una función crítica debe ser contratada (tiempo completo) o externalizada (outsourcing).

DECISIÓN A EVALUAR:
{{user_input}}

{{context}}

OBJETIVO DEL DEBATE:
Comparar costes a 12 meses, flexibilidad operativa, y riesgos de contratación vs. outsourcing. El CFO debe ser extremadamente conservador con el gasto.

INSTRUCCIONES ESPECÍFICAS:
- El CFO debe evaluar costes totales a 12 meses (salario + beneficios + overhead) vs. coste de outsourcing
- El Director de RRHH debe evaluar flexibilidad, cultura, y control
- El Especialista en Operaciones debe evaluar eficiencia y riesgos operativos

Debatan hasta alcanzar consenso sobre:
1. ¿Cuál es la mejor opción? (Contratar/Outsourcing/Híbrido)
2. ¿Cuál es la diferencia de coste a 12 meses?
3. ¿Cuáles son los riesgos principales de cada opción?
4. ¿Qué factores deberían inclinarte hacia una u otra opción?`,
  promptVariables: {
    user_input: {
      label: 'Función a Evaluar',
      description: 'Describe la función crítica que necesitas (ej: "Necesito un desarrollador senior para el backend")',
      required: true,
    },
    context: {
      label: 'Contexto Adicional',
      description: 'Información sobre presupuesto, urgencia, o situación actual',
      required: false,
    },
  },
  successMetrics: [
    {
      key: 'recommendation',
      label: 'Recomendación',
      description: 'La opción recomendada (Contratar/Outsourcing/Híbrido)',
      type: 'string' as const,
      extractor: 'Extrae la recomendación final del debate: "Contratar", "Outsourcing", o "Híbrido".',
    },
    {
      key: 'cost_difference_12m',
      label: 'Diferencia de Coste a 12 Meses',
      description: 'Diferencia en euros entre las dos opciones a 12 meses',
      type: 'number' as const,
      extractor: 'Calcula la diferencia de coste a 12 meses entre contratar y outsourcing (número en euros).',
    },
    {
      key: 'risk_level',
      label: 'Nivel de Riesgo',
      description: 'Nivel de riesgo de la opción recomendada (Bajo/Medio/Alto)',
      type: 'string' as const,
      extractor: 'Determina el nivel de riesgo de la opción recomendada: "Bajo", "Medio", o "Alto".',
    },
  ],
  agentBehaviorOverrides: {
    'patrick_campbell': {
      specialInstructions: 'Eres extremadamente conservador con el gasto. Prioriza el ahorro de costes y la eficiencia financiera. Cuestiona cualquier gasto innecesario y busca la opción más económica que mantenga la calidad.',
    },
  },
  tokenOptimization: {
    enabled: true,
    maxTokensPerMessage: 50,
    compressionEnabled: true,
  },
  generateCertificate: true,
  certificateTemplate: undefined, // Use default
  minTier: 'free',
  isPublic: true,
}

// ============================================================================
// ESCENARIO C: Análisis de Inversión y Mitigación de Riesgo
// ============================================================================

const scenarioC = {
  name: 'Análisis de Inversión y Mitigación de Riesgo',
  description: 'Evalúa una oportunidad de inversión usando el framework de Premortem. Los expertos asumen que la inversión ha fallado y explican por qué, identificando riesgos críticos y estrategias de mitigación.',
  shortDescription: 'Analiza inversiones con premortem y mitigación de riesgos',
  segment: 'corporate' as const,
  status: 'active' as const,
  expertIds: [
    'marc_andreessen',    // Risk Analyst (VC perspective)
    'bill_gurley',        // Market Specialist
    'chamath_palihapitiya', // Legal/Mercantil (as proxy)
  ],
  requiresDepartments: true, // Corporate scenarios may need departments
  departmentIds: [],
  frameworkId: 'premortem', // Explicit framework
  masterPromptTemplate: `Eres parte de un panel de expertos evaluando una oportunidad de inversión usando el framework de PREMORTEM.

OPORTUNIDAD DE INVERSIÓN:
{{user_input}}

{{#if context}}CONTEXTO ADICIONAL:
{{context}}
{{/if}}

{{#if company_context}}CONTEXTO CORPORATIVO:
{{company_context}}
{{/if}}

OBJETIVO DEL DEBATE (PREMORTEM):
Asume que la inversión HA FALLADO. Tu trabajo es explicar POR QUÉ falló. Identifica los riesgos críticos que llevaron al fracaso y cómo podrían haberse mitigado.

INSTRUCCIONES ESPECÍFICAS:
- Todos los expertos deben asumir que la inversión falló
- Identifica los 3-5 riesgos críticos más probables
- Para cada riesgo, propón estrategias de mitigación concretas
- Evalúa la probabilidad de éxito real vs. riesgo

Debatan hasta alcanzar consenso sobre:
1. ¿Cuáles son los 3 riesgos críticos más probables?
2. ¿Cómo se pueden mitigar cada uno?
3. ¿Cuál es la probabilidad de éxito real? (0-100%)
4. ¿Recomiendas proceder con la inversión? (Sí/No/Con condiciones)`,
  promptVariables: {
    user_input: {
      label: 'Oportunidad de Inversión',
      description: 'Describe la oportunidad de inversión en detalle',
      required: true,
    },
    context: {
      label: 'Contexto Adicional',
      description: 'Información sobre mercado, competencia, o situación',
      required: false,
    },
    company_context: {
      label: 'Contexto Corporativo',
      description: 'Información sobre la empresa, estrategia, o situación actual',
      required: false,
    },
  },
  successMetrics: [
    {
      key: 'critical_risks',
      label: 'Riesgos Críticos',
      description: 'Lista de los 3-5 riesgos críticos identificados',
      type: 'array' as const,
      extractor: 'Extrae una lista de los 3-5 riesgos críticos más importantes identificados en el debate.',
    },
    {
      key: 'mitigation_strategies',
      label: 'Estrategias de Mitigación',
      description: 'Estrategias para mitigar cada riesgo',
      type: 'array' as const,
      extractor: 'Lista las estrategias de mitigación propuestas para cada riesgo crítico.',
    },
    {
      key: 'success_probability',
      label: 'Probabilidad de Éxito',
      description: 'Probabilidad de éxito de la inversión (0-100%)',
      type: 'number' as const,
      extractor: 'Extrae una probabilidad numérica de 0-100% que represente la probabilidad de éxito de la inversión.',
    },
    {
      key: 'recommendation',
      label: 'Recomendación',
      description: 'Recomendación final (Sí/No/Con condiciones)',
      type: 'string' as const,
      extractor: 'Extrae la recomendación final: "Sí", "No", o "Con condiciones".',
    },
  ],
  agentBehaviorOverrides: {},
  tokenOptimization: {
    enabled: true,
    maxTokensPerMessage: 50,
    compressionEnabled: true,
  },
  generateCertificate: true,
  certificateTemplate: undefined,
  minTier: 'starter', // Corporate scenarios require starter tier minimum
  isPublic: true,
}

// ============================================================================
// ESCENARIO D: Estrategia de Pricing y Monetización
// ============================================================================

const scenarioD = {
  name: 'Estrategia de Pricing y Monetización',
  description: 'Define el modelo de monetización óptimo (freemium, per-seat, usage-based) equilibrando conversión, retención y ARPU. Evalúa sensibilidad al precio y riesgo de churn.',
  shortDescription: 'Elige el modelo de pricing y monetización óptimo',
  segment: 'entrepreneur' as const,
  status: 'active' as const,
  expertIds: [
    'patrick_campbell', // Pricing & Monetization
    'april_dunford',    // Positioning & Packaging
    'rahul_vohra',      // PMF & Product behavior
  ],
  requiresDepartments: false,
  departmentIds: [],
  frameworkId: 'pricing',
  masterPromptTemplate: `Eres un panel de expertos definiendo la estrategia de pricing y monetización de un producto.

PRODUCTO / OFERTA:
{{user_input}}

{{#if target_customers}}CLIENTES OBJETIVO:
{{target_customers}}
{{/if}}

{{#if context}}DATOS / CONTEXTO RELEVANTE:
{{context}}
{{/if}}

OBJETIVO DEL DEBATE:
- Seleccionar el modelo de pricing óptimo (freemium, per-seat, usage-based, tiered)
- Definir rango de precios inicial y empaquetado
- Evaluar impacto en conversión, ARPU y churn

INSTRUCCIONES ESPECÍFICAS:
- El experto en pricing debe modelar ingresos y sensibilidad a precios
- El experto en positioning debe asegurar que el valor percibido soporta el precio
- El experto en PMF debe validar impacto en adopción y retención

Debatan hasta acordar:
1) Modelo recomendado y por qué
2) Rango de precios inicial
3) Riesgos de churn o devaluación
4) Experimentos rápidos para validar`,
  promptVariables: {
    user_input: {
      label: 'Producto / Oferta',
      description: 'Describe brevemente el producto/servicio y su propuesta de valor',
      required: true,
    },
    target_customers: {
      label: 'Clientes Objetivo',
      description: 'Segmentos o perfiles principales a los que vendes',
      required: false,
    },
    context: {
      label: 'Datos o Contexto',
      description: 'Métricas actuales (ARPU, churn, conversión), competencia, restricciones',
      required: false,
    },
  },
  successMetrics: [
    {
      key: 'optimal_pricing_model',
      label: 'Modelo de Pricing Óptimo',
      description: 'Modelo recomendado (freemium, per-seat, usage-based, tiered)',
      type: 'string' as const,
      extractor: 'Indica el modelo de pricing recomendado y la razón principal.',
    },
    {
      key: 'revenue_projection_12m',
      label: 'Proyección de Ingreso 12M',
      description: 'Proyección de ingresos a 12 meses con el modelo propuesto',
      type: 'number' as const,
      extractor: 'Estima ingreso proyectado a 12 meses (número). Si das un rango, usa el punto medio.',
    },
    {
      key: 'churn_risk',
      label: 'Riesgo de Churn',
      description: 'Nivel de riesgo de churn bajo el modelo propuesto',
      type: 'string' as const,
      extractor: 'Clasifica el riesgo de churn: Bajo/Medio/Alto y resume la razón.',
    },
  ],
  agentBehaviorOverrides: {},
  tokenOptimization: {
    enabled: true,
    maxTokensPerMessage: 50,
    compressionEnabled: true,
  },
  generateCertificate: true,
  certificateTemplate: undefined,
  minTier: 'free',
  isPublic: true,
}

// ============================================================================
// ESCENARIO E: Pivot vs Perseverar
// ============================================================================

const scenarioE = {
  name: 'Pivot vs Perseverar',
  description: 'Decide si debes pivotar o perseverar, contrastando señales de mercado, coste de oportunidad y runway.',
  shortDescription: 'Evalúa si pivotar o seguir con la estrategia actual',
  segment: 'entrepreneur' as const,
  status: 'active' as const,
  expertIds: [
    'brian_balfour',   // Growth, abogado del diablo
    'april_dunford',   // Positioning & narrative
    'patrick_campbell', // Finanzas y runway
  ],
  requiresDepartments: false,
  departmentIds: [],
  frameworkId: 'premortem',
  masterPromptTemplate: `Eres un panel evaluando si pivotar o perseverar.

PRODUCTO / ESTRATEGIA ACTUAL:
{{user_input}}

{{#if evidence}}EVIDENCIA / MÉTRICAS CLAVE:
{{evidence}}
{{/if}}

{{#if context}}CONTEXTO ADICIONAL:
{{context}}
{{/if}}

OBJETIVO DEL DEBATE:
- Determinar si las señales justifican pivotar o perseverar
- Cuantificar coste de oportunidad y riesgo de seguir igual
- Definir condiciones de éxito si se persevera

Rol especial: el experto de growth actúa como abogado del diablo cuestionando supuestos optimistas.

Debatan hasta acordar:
1) Recomendación: Pivotar / Perseverar / Ajuste ligero
2) Coste de delay (valor o tiempo perdido si sigues igual)
3) Señal más fuerte a favor y en contra
4) Hitos a lograr en los próximos 60-90 días`,
  promptVariables: {
    user_input: {
      label: 'Producto / Estrategia Actual',
      description: 'Describe la propuesta actual y público objetivo',
      required: true,
    },
    evidence: {
      label: 'Evidencia / Métricas',
      description: 'Retención, crecimiento, feedback cualitativo, NPS, ventas',
      required: false,
    },
    context: {
      label: 'Contexto',
      description: 'Runway, equipo, constraints o dependencias',
      required: false,
    },
  },
  successMetrics: [
    {
      key: 'pivot_recommendation',
      label: 'Recomendación de Pivot',
      description: 'Decisión final: Pivotar, Perseverar o Ajuste ligero',
      type: 'string' as const,
      extractor: 'Devuelve Pivotar, Perseverar o Ajuste ligero con una frase justificando.',
    },
    {
      key: 'cost_of_delay',
      label: 'Coste de Delay',
      description: 'Coste estimado de seguir igual (tiempo o valor perdido)',
      type: 'number' as const,
      extractor: 'Estima el coste de retrasar el cambio (en meses o impacto económico). Usa un número representativo.',
    },
    {
      key: 'market_signal_strength',
      label: 'Fuerza de Señal de Mercado',
      description: 'Fortaleza de las señales de mercado actuales',
      type: 'string' as const,
      extractor: 'Clasifica la señal: Débil / Neutral / Fuerte y explica brevemente.',
    },
  ],
  agentBehaviorOverrides: {
    'brian_balfour': {
      specialInstructions: 'Actúa como abogado del diablo: cuestiona supuestos y presiona por evidencia.',
    },
  },
  tokenOptimization: {
    enabled: true,
    maxTokensPerMessage: 50,
    compressionEnabled: true,
  },
  generateCertificate: true,
  certificateTemplate: undefined,
  minTier: 'free',
  isPublic: true,
}

// ============================================================================
// ESCENARIO F: Timing de Fundraising
// ============================================================================

const scenarioF = {
  name: 'Timing de Fundraising',
  description: 'Evalúa el mejor momento para levantar ronda considerando runway, hitos y valoración. Equilibra dilución vs. probabilidad de éxito.',
  shortDescription: 'Decide cuándo levantar ronda para maximizar valoración y minimizar dilución',
  segment: 'entrepreneur' as const,
  status: 'active' as const,
  expertIds: [
    'tomasz_tunguz',   // Métricas SaaS / unit economics
    'jason_lemkin',    // Operaciones SaaS y fundraising práctico
    'patrick_campbell', // Finanzas y sensibilidad a dilución
  ],
  requiresDepartments: false,
  departmentIds: [],
  frameworkId: 'fundraising',
  masterPromptTemplate: `Eres un panel analizando el TIMING de fundraising.

SITUACIÓN ACTUAL:
{{user_input}}

{{#if metrics}}MÉTRICAS RELEVANTES (ARR, growth, churn, CAC/LTV, runway):
{{metrics}}
{{/if}}

{{#if milestones}}HITOS Y PLAN:
{{milestones}}
{{/if}}

OBJETIVO DEL DEBATE:
- Decidir si levantar ahora o más adelante
- Estimar valoración y dilución esperada
- Identificar hitos que mejoren la ronda (multiplicadores)

Debatan hasta acordar:
1) Cuándo levantar (inmediato vs tras hitos)
2) Qué hitos moverían la valoración
3) Dilución esperada y rango de valoración
4) Riesgos de esperar vs salir ahora`,
  promptVariables: {
    user_input: {
      label: 'Situación y Necesidad de Capital',
      description: 'Estado de la empresa, caja y por qué levantar capital',
      required: true,
    },
    metrics: {
      label: 'Métricas Clave',
      description: 'ARR/MRR, crecimiento, churn, CAC/LTV, burn, runway',
      required: false,
    },
    milestones: {
      label: 'Hitos Próximos',
      description: 'Lanzamientos, deals, métricas objetivo en 3-6 meses',
      required: false,
    },
  },
  successMetrics: [
    {
      key: 'optimal_round_timing',
      label: 'Momento Óptimo de Ronda',
      description: 'Recomendación de cuándo levantar',
      type: 'string' as const,
      extractor: 'Devuelve una de: "Levantar ahora", "Esperar hitos" o "No levantar" y la razón.',
    },
    {
      key: 'valuation_estimate',
      label: 'Valoración Estimada',
      description: 'Valoración pre-money sugerida (punto medio si es rango)',
      type: 'number' as const,
      extractor: 'Estimación de valoración pre-money en unidades monetarias. Si hay rango, usa punto medio.',
    },
    {
      key: 'dilution_impact',
      label: 'Impacto de Dilución',
      description: 'Dilución estimada de la ronda recomendada',
      type: 'number' as const,
      extractor: 'Porcentaje estimado de dilución (0-100).',
    },
  ],
  agentBehaviorOverrides: {},
  tokenOptimization: {
    enabled: true,
    maxTokensPerMessage: 50,
    compressionEnabled: true,
  },
  generateCertificate: true,
  certificateTemplate: undefined,
  minTier: 'free',
  isPublic: true,
}

// ============================================================================
// ESCENARIO G: Priorización de Features (RICE)
// ============================================================================

const scenarioG = {
  name: 'Priorización de Features (RICE)',
  description: 'Usa RICE para rankear features por Reach, Impact, Confidence y Effort. Balancea impacto y esfuerzo para enfocar el roadmap.',
  shortDescription: 'Rankea features con RICE y elige el top 1-2',
  segment: 'entrepreneur' as const,
  status: 'active' as const,
  expertIds: [
    'rahul_vohra',     // PMF y percepción de valor
    'brian_balfour',   // Impacto en growth y loops
    'lenny_rachitsky', // Product & prioridad práctica
  ],
  requiresDepartments: false,
  departmentIds: [],
  frameworkId: 'rice',
  masterPromptTemplate: `Eres un panel priorizando features con el framework RICE.

LISTA DE FEATURES CANDIDATAS (una por línea, con breve descripción):
{{feature_candidates}}

{{#if target_users}}USUARIOS OBJETIVO:
{{target_users}}
{{/if}}

{{#if constraints}}CONSTRAINTS / RESTRICCIONES:
{{constraints}}
{{/if}}

INSTRUCCIONES:
- Asigna Reach, Impact (1-3), Confidence (0-100%) y Effort (person-months) a cada feature
- Calcula el score RICE = (Reach * Impact * Confidence) / Effort
- Justifica el ranking con hipótesis claras

Debatan hasta acordar top 3 y la #1 con justificación.`,
  promptVariables: {
    feature_candidates: {
      label: 'Features Candidatas',
      description: 'Lista de features; cada línea con nombre y breve contexto',
      required: true,
    },
    target_users: {
      label: 'Usuarios Objetivo',
      description: 'Segmentos principales o cohortes clave',
      required: false,
    },
    constraints: {
      label: 'Restricciones',
      description: 'Límites de equipo, tech, deadlines o compliance',
      required: false,
    },
  },
  successMetrics: [
    {
      key: 'top_priority_feature',
      label: 'Feature Prioritaria',
      description: 'Feature #1 recomendada',
      type: 'string' as const,
      extractor: 'Indica la feature #1 y su score RICE.',
    },
    {
      key: 'expected_impact_score',
      label: 'Impacto Esperado (RICE)',
      description: 'Score RICE o impacto ponderado de la feature #1',
      type: 'number' as const,
      extractor: 'Devuelve el score RICE de la feature prioritaria como número.',
    },
    {
      key: 'effort_estimate',
      label: 'Esfuerzo Estimado',
      description: 'Esfuerzo estimado de la feature prioritaria (person-months)',
      type: 'number' as const,
      extractor: 'Devuelve el esfuerzo en person-months (número).',
    },
  ],
  agentBehaviorOverrides: {},
  tokenOptimization: {
    enabled: true,
    maxTokensPerMessage: 50,
    compressionEnabled: true,
  },
  generateCertificate: true,
  certificateTemplate: undefined,
  minTier: 'free',
  isPublic: true,
}

// ============================================================================
// ESCENARIO H: Estrategia de Go-to-Market (GTM)
// ============================================================================

const scenarioH = {
  name: 'Estrategia de Go-to-Market (GTM)',
  description: 'Selecciona el canal GTM principal (inbound, outbound, partnerships, content) y define los primeros pasos para escalarlo.',
  shortDescription: 'Elige el canal GTM principal y plan de activación',
  segment: 'entrepreneur' as const,
  status: 'active' as const,
  expertIds: [
    'steli_efti',      // Ventas y outbound
    'brian_balfour',   // Growth loops y canales
    'april_dunford',   // Positioning y narrativa
  ],
  requiresDepartments: false,
  departmentIds: [],
  frameworkId: 'gtm',
  masterPromptTemplate: `Eres un panel definiendo la estrategia de Go-to-Market.

PRODUCTO / PROPUESTA DE VALOR:
{{user_input}}

{{#if target_market}}MERCADO OBJETIVO:
{{target_market}}
{{/if}}

{{#if context}}CONTEXTO / RECURSOS:
{{context}}
{{/if}}

OBJETIVO DEL DEBATE:
- Elegir el canal GTM primario y secundario
- Estimar CAC inicial y tiempo a escalar
- Definir los primeros experimentos/plays a ejecutar

Debatan hasta acordar:
1) Canal principal recomendado y por qué
2) CAC estimado inicial y supuestos
3) Tiempo a escalar (meses) y milestones
4) Primeros 3 experimentos o plays concretos`,
  promptVariables: {
    user_input: {
      label: 'Producto / Propuesta',
      description: 'Descripción breve del producto y valor diferencial',
      required: true,
    },
    target_market: {
      label: 'Mercado Objetivo',
      description: 'Segmento, tamaño de deal, región, ICP',
      required: false,
    },
    context: {
      label: 'Recursos y Restricciones',
      description: 'Equipo, budget, timing, limitaciones',
      required: false,
    },
  },
  successMetrics: [
    {
      key: 'recommended_channel',
      label: 'Canal Recomendado',
      description: 'Canal GTM principal',
      type: 'string' as const,
      extractor: 'Indica el canal GTM principal recomendado y breve razón.',
    },
    {
      key: 'cac_estimate',
      label: 'CAC Estimado',
      description: 'Coste de adquisición estimado inicial',
      type: 'number' as const,
      extractor: 'Devuelve CAC estimado numérico. Si hay rango, usa punto medio.',
    },
    {
      key: 'time_to_scale_months',
      label: 'Tiempo a Escalar (meses)',
      description: 'Meses estimados para escalar el canal',
      type: 'number' as const,
      extractor: 'Meses estimados para escalar el canal principal.',
    },
  ],
  agentBehaviorOverrides: {},
  tokenOptimization: {
    enabled: true,
    maxTokensPerMessage: 50,
    compressionEnabled: true,
  },
  generateCertificate: true,
  certificateTemplate: undefined,
  minTier: 'free',
  isPublic: true,
}

// ============================================================================
// ESCENARIO I: Due Diligence de Adquisición
// ============================================================================

const scenarioI = {
  name: 'Due Diligence de Adquisición',
  description: 'Realiza un premortem de adquisición: asume que la compra falló y explica por qué. Identifica riesgos críticos y sinergias reales.',
  shortDescription: 'Premortem de adquisición con riesgos y sinergias',
  segment: 'corporate' as const,
  status: 'active' as const,
  expertIds: [
    'marc_andreessen',    // VC contrarian y tecnología
    'bill_gurley',        // Unit economics y marketplaces
    'chamath_palihapitiya', // Growth stage y TAM
  ],
  requiresDepartments: true,
  departmentIds: [],
  frameworkId: 'premortem',
  masterPromptTemplate: `Eres un panel haciendo DUE DILIGENCE con enfoque PREMORTEM: asume que la adquisición fracasó y explica por qué.

TARGET DE ADQUISICIÓN:
{{user_input}}

{{#if strategic_rationale}}RATIONALE ESTRATÉGICO:
{{strategic_rationale}}
{{/if}}

{{#if context}}DATOS / CONTEXTO:
{{context}}
{{/if}}

OBJETIVO DEL DEBATE:
- Identificar riesgos críticos (producto, mercado, finanzas, cultura, legal)
- Evaluar sinergias reales y calidad de ingresos
- Recomendar si proceder o no

Debatan hasta acordar:
1) Top 3-5 riesgos y mitigación
2) Sinergias más sólidas y su tamaño
3) Recomendación: Proceder / No proceder / Solo con condiciones`,
  promptVariables: {
    user_input: {
      label: 'Target de Adquisición',
      description: 'Describe la empresa/activo a adquirir',
      required: true,
    },
    strategic_rationale: {
      label: 'Rationale Estratégico',
      description: 'Por qué adquirir: producto, mercado, equipo, defensas',
      required: false,
    },
    context: {
      label: 'Datos / Contexto',
      description: 'Métricas, riesgos conocidos, deuda técnica/financiera',
      required: false,
    },
  },
  successMetrics: [
    {
      key: 'critical_risks',
      label: 'Riesgos Críticos',
      description: 'Riesgos principales identificados',
      type: 'array' as const,
      extractor: 'Lista los 3-5 riesgos críticos con breve nota.',
    },
    {
      key: 'synergy_potential',
      label: 'Potencial de Sinergias',
      description: 'Sinergias clave y su magnitud',
      type: 'string' as const,
      extractor: 'Resume las sinergias más fuertes y su impacto (ingresos/ahorros).',
    },
    {
      key: 'recommendation',
      label: 'Recomendación',
      description: 'Proceder, No proceder o Condicionado',
      type: 'string' as const,
      extractor: 'Devuelve Proceder / No proceder / Con condiciones y la condición principal.',
    },
  ],
  agentBehaviorOverrides: {},
  tokenOptimization: {
    enabled: true,
    maxTokensPerMessage: 50,
    compressionEnabled: true,
  },
  generateCertificate: true,
  certificateTemplate: undefined,
  minTier: 'starter',
  isPublic: true,
}

// ============================================================================
// ESCENARIO J: Estrategia de Salida (Exit Strategy)
// ============================================================================

const scenarioJ = {
  name: 'Estrategia de Salida (Exit Strategy)',
  description: 'Evalúa opciones de salida (M&A, secondary, IPO) optimizando timing, valoración y preparación de gobierno.',
  shortDescription: 'Define la mejor ruta y timing de salida',
  segment: 'corporate' as const,
  status: 'active' as const,
  expertIds: [
    'marc_andreessen', // Visión y mercado
    'bill_gurley',     // Unit economics y ventanas de mercado
    'brad_feld',       // Term sheets y governance
  ],
  requiresDepartments: true,
  departmentIds: [],
  frameworkId: 'exit',
  masterPromptTemplate: `Eres un panel definiendo la estrategia de salida óptima.

EMPRESA / ACTIVO:
{{user_input}}

{{#if performance}}DESEMPEÑO Y MÉTRICAS:
{{performance}}
{{/if}}

{{#if context}}CONTEXTO / MERCADO:
{{context}}
{{/if}}

OBJETIVO DEL DEBATE:
- Evaluar rutas de salida: M&A, secondary, IPO
- Estimar rango de valoración y readiness
- Recomendar timing y condiciones clave

Debatan hasta acordar:
1) Ruta recomendada y por qué
2) Ventana de mercado y timing
3) Pasos críticos para readiness (gobierno, métricas, narrativa)
4) Rango de valoración y sensibilidad`,
  promptVariables: {
    user_input: {
      label: 'Descripción de la Empresa',
      description: 'Qué hace, tamaño, sector, modelo',
      required: true,
    },
    performance: {
      label: 'Desempeño',
      description: 'Métricas clave: ingresos, crecimiento, margen, retención',
      required: false,
    },
    context: {
      label: 'Contexto de Mercado',
      description: 'Ventanas de liquidez, comparables, presiones internas',
      required: false,
    },
  },
  successMetrics: [
    {
      key: 'optimal_exit_timing',
      label: 'Timing Óptimo de Salida',
      description: 'Momento recomendado (trimestre/ventana)',
      type: 'string' as const,
      extractor: 'Indica el trimestre/ventana recomendada y la razón.',
    },
    {
      key: 'valuation_range',
      label: 'Rango de Valoración',
      description: 'Rango o punto medio de valoración esperado',
      type: 'string' as const,
      extractor: 'Resume el rango de valoración esperado; si hay números, incluye ambos.',
    },
    {
      key: 'exit_readiness_score',
      label: 'Puntaje de Readiness',
      description: 'Readiness de salida (0-100)',
      type: 'number' as const,
      extractor: 'Asigna un puntaje 0-100 de readiness para la salida.',
    },
  ],
  agentBehaviorOverrides: {},
  tokenOptimization: {
    enabled: true,
    maxTokensPerMessage: 50,
    compressionEnabled: true,
  },
  generateCertificate: true,
  certificateTemplate: undefined,
  minTier: 'starter',
  isPublic: true,
}

// ============================================================================
// SEED FUNCTION
// ============================================================================

export async function seedScenarios() {
  console.log('[Seed] Seeding scenarios...')

  const scenariosToInsert = [
    scenarioA,
    scenarioB,
    scenarioC,
    scenarioD,
    scenarioE,
    scenarioF,
    scenarioG,
    scenarioH,
    scenarioI,
    scenarioJ,
  ]

  for (const scenario of scenariosToInsert) {
    try {
      // Check if scenario already exists (by name)
      const [existing] = await db
        .select({ id: scenarios.id })
        .from(scenarios)
        .where(eq(scenarios.name, scenario.name))
        .limit(1)

      if (existing) {
        console.log(`[Seed] Scenario "${scenario.name}" already exists, skipping`)
        continue
      }

      // Insert scenario (convert to DB format)
      const [inserted] = await db
        .insert(scenarios)
        .values({
          name: scenario.name,
          description: scenario.description,
          shortDescription: scenario.shortDescription,
          segment: scenario.segment,
          status: scenario.status,
          expertIds: scenario.expertIds,
          requiresDepartments: scenario.requiresDepartments,
          departmentIds: scenario.departmentIds,
          frameworkId: scenario.frameworkId,
          masterPromptTemplate: scenario.masterPromptTemplate,
          promptVariables: scenario.promptVariables,
          successMetrics: scenario.successMetrics,
          agentBehaviorOverrides: scenario.agentBehaviorOverrides,
          tokenOptimization: scenario.tokenOptimization,
          generateCertificate: scenario.generateCertificate,
          certificateTemplate: scenario.certificateTemplate,
          minTier: scenario.minTier,
          isPublic: scenario.isPublic,
        })
        .returning()

      if (inserted) {
        console.log(`[Seed] Created scenario: ${inserted.name} (${inserted.id})`)
      }
    } catch (error) {
      console.error(`[Seed] Error seeding scenario "${scenario.name}":`, error)
    }
  }

  console.log('[Seed] Scenarios seeding completed')
}
