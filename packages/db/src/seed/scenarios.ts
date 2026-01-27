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
// SEED FUNCTION
// ============================================================================

export async function seedScenarios() {
  console.log('[Seed] Seeding scenarios...')

  const scenariosToInsert = [scenarioA, scenarioB, scenarioC]

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
