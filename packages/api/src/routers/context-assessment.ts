import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { getAIClient } from "@quoorum/ai";

/**
 * Context Assessment Router
 *
 * Uses AI to analyze user input before starting a debate,
 * helping users provide better context for more valuable AI expert discussions.
 */

// Types
const contextDimensionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  weight: z.number().min(0).max(1),
  score: z.number().min(0).max(100),
  status: z.enum(["missing", "partial", "complete"]),
  suggestions: z.array(z.string()),
});

const contextAssumptionSchema = z.object({
  id: z.string(),
  dimension: z.string(),
  assumption: z.string(),
  confidence: z.number().min(0).max(1),
  confirmed: z.union([z.boolean(), z.string()]).nullable(), // Can be boolean (yes/no) or string (selected alternative)
  alternatives: z.array(z.string()).min(0), // FLEXIBLE: 0 alternatives = yes/no question, 2+ = multiple choice
  questionType: z.enum(["yes_no", "multiple_choice", "free_text"]).default("yes_no"), // AI decides best type
});

const clarifyingQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  dimension: z.string(),
  priority: z.enum(["critical", "important", "nice-to-have"]),
  questionType: z.enum(["yes_no", "multiple_choice", "free_text"]), // AI decides optimal type
  multipleChoice: z
    .object({
      options: z.array(z.string()),
      allowMultiple: z.boolean(),
    })
    .optional(), // Only if questionType = "multiple_choice"
  freeText: z.boolean().optional(), // Only if questionType = "free_text"
  dependsOn: z.string().optional(),
});

const contextAssessmentSchema = z.object({
  overallScore: z.number().min(0).max(100),
  readinessLevel: z.enum(["insufficient", "basic", "good", "excellent"]),
  dimensions: z.array(contextDimensionSchema),
  assumptions: z.array(contextAssumptionSchema),
  clarifyingQuestions: z.array(clarifyingQuestionSchema),
  summary: z.string(),
  recommendedAction: z.enum(["proceed", "clarify", "refine"]),
  // NEW: Domain-specific enhancements
  reflection: z.string().optional(), // Shows we understood their situation
  detectedDomain: z.string().optional(), // hiring, pricing, growth, etc.
});

const contextAnswersSchema = z.object({
  assumptionResponses: z.record(z.string(), z.union([z.boolean(), z.string()])), // Boolean for yes/no, string for selected alternative
  questionResponses: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  additionalContext: z.string().optional(),
});

// Dimension templates
const DIMENSION_TEMPLATES: Record<string, { id: string; name: string; description: string; weight: number }[]> = {
  business_decision: [
    { id: "objective", name: "Objetivo", description: "Qué quieres lograr", weight: 0.2 },
    { id: "constraints", name: "Restricciones", description: "Presupuesto, tiempo, recursos", weight: 0.15 },
    { id: "stakeholders", name: "Stakeholders", description: "Quién está involucrado o afectado", weight: 0.1 },
    { id: "context", name: "Contexto", description: "Situación actual, antecedentes", weight: 0.15 },
    { id: "options", name: "Opciones", description: "Alternativas que consideras", weight: 0.15 },
    { id: "criteria", name: "Criterios", description: "Cómo medirás el éxito", weight: 0.1 },
    { id: "risks", name: "Riesgos", description: "Qué podría salir mal", weight: 0.1 },
    { id: "timeline", name: "Timeline", description: "Plazos y urgencia", weight: 0.05 },
  ],
  strategy: [
    { id: "vision", name: "Visión", description: "Hacia dónde quieres ir", weight: 0.2 },
    { id: "current_state", name: "Estado Actual", description: "Dónde estás ahora", weight: 0.15 },
    { id: "market", name: "Mercado", description: "Competencia, tendencias", weight: 0.15 },
    { id: "resources", name: "Recursos", description: "Qué tienes disponible", weight: 0.15 },
    { id: "differentiators", name: "Diferenciadores", description: "Tu ventaja competitiva", weight: 0.15 },
    { id: "risks", name: "Riesgos", description: "Amenazas y debilidades", weight: 0.1 },
    { id: "timeline", name: "Horizonte", description: "Corto, medio, largo plazo", weight: 0.1 },
  ],
  product: [
    { id: "problem", name: "Problema", description: "Qué problema resuelves", weight: 0.2 },
    { id: "user", name: "Usuario", description: "Para quién es", weight: 0.2 },
    { id: "solution", name: "Solución", description: "Cómo lo resuelves", weight: 0.15 },
    { id: "market", name: "Mercado", description: "Tamaño, competencia", weight: 0.15 },
    { id: "mvp", name: "MVP", description: "Versión mínima viable", weight: 0.1 },
    { id: "metrics", name: "Métricas", description: "Cómo mides éxito", weight: 0.1 },
    { id: "resources", name: "Recursos", description: "Equipo, presupuesto", weight: 0.1 },
  ],
  general: [
    { id: "objective", name: "Objetivo", description: "Qué quieres lograr", weight: 0.25 },
    { id: "context", name: "Contexto", description: "Situación y antecedentes", weight: 0.25 },
    { id: "constraints", name: "Restricciones", description: "Limitaciones a considerar", weight: 0.2 },
    { id: "options", name: "Opciones", description: "Alternativas posibles", weight: 0.15 },
    { id: "criteria", name: "Criterios", description: "Cómo evaluar resultados", weight: 0.15 },
  ],
};

// ============================================
// DOMAIN-SPECIFIC INTELLIGENT QUESTIONING
// ============================================

// Specific business domains with targeted questions
type BusinessDomain =
  | 'hiring' | 'firing' | 'team'
  | 'pricing' | 'revenue' | 'costs'
  | 'product_launch' | 'product_pivot' | 'features'
  | 'fundraising' | 'investment' | 'exit'
  | 'growth' | 'marketing' | 'sales'
  | 'partnerships' | 'acquisitions'
  | 'operations' | 'processes'
  | 'culture' | 'leadership'
  | 'general';

// Domain detection patterns
const DOMAIN_PATTERNS: Record<BusinessDomain, { keywords: string[]; phrases: string[] }> = {
  hiring: {
    keywords: ['contratar', 'hiring', 'reclutar', 'candidato', 'vacante', 'puesto', 'rol', 'perfil'],
    phrases: ['nuevo empleado', 'ampliar equipo', 'buscar persona', 'incorporar', 'fichar']
  },
  firing: {
    keywords: ['despedir', 'prescindir', 'desvincular', 'despido', 'reducir plantilla'],
    phrases: ['dejar ir', 'no funciona', 'bajo rendimiento', 'recortar equipo']
  },
  team: {
    keywords: ['equipo', 'organización', 'estructura', 'roles', 'responsabilidades'],
    phrases: ['organizar equipo', 'definir roles', 'cultura equipo', 'colaboración']
  },
  pricing: {
    keywords: ['precio', 'pricing', 'tarifa', 'coste', 'cobrar', 'monetizar'],
    phrases: ['modelo de precios', 'cuánto cobrar', 'subir precio', 'bajar precio', 'freemium']
  },
  revenue: {
    keywords: ['ingresos', 'revenue', 'facturación', 'ventas', 'mrr', 'arr'],
    phrases: ['aumentar ingresos', 'modelo de negocio', 'fuente de ingresos']
  },
  costs: {
    keywords: ['costes', 'gastos', 'burn', 'runway', 'reducir costes'],
    phrases: ['recortar gastos', 'optimizar costes', 'cash flow']
  },
  product_launch: {
    keywords: ['lanzar', 'lanzamiento', 'launch', 'salir al mercado', 'go-to-market'],
    phrases: ['primer producto', 'sacar al mercado', 'fecha de lanzamiento']
  },
  product_pivot: {
    keywords: ['pivotar', 'pivot', 'cambiar dirección', 'reorientar'],
    phrases: ['cambiar modelo', 'no funciona', 'nuevo enfoque']
  },
  features: {
    keywords: ['feature', 'funcionalidad', 'característica', 'roadmap', 'priorizar'],
    phrases: ['qué construir', 'próxima feature', 'backlog']
  },
  fundraising: {
    keywords: ['inversión', 'ronda', 'levantar capital', 'funding', 'inversores', 'vc'],
    phrases: ['buscar inversión', 'serie a', 'seed', 'angel']
  },
  investment: {
    keywords: ['invertir', 'oportunidad inversión', 'deal', 'due diligence'],
    phrases: ['debo invertir', 'evaluar startup', 'términos']
  },
  exit: {
    keywords: ['exit', 'vender empresa', 'adquisición', 'ipo', 'salida'],
    phrases: ['vender mi empresa', 'oferta de compra', 'valoración exit']
  },
  growth: {
    keywords: ['crecer', 'escalar', 'growth', 'expansión', 'scale'],
    phrases: ['cómo crecer', 'siguiente fase', 'escalar negocio']
  },
  marketing: {
    keywords: ['marketing', 'marca', 'branding', 'awareness', 'posicionamiento'],
    phrases: ['estrategia marketing', 'canal adquisición', 'llegar a clientes']
  },
  sales: {
    keywords: ['ventas', 'comercial', 'cerrar deals', 'pipeline', 'leads'],
    phrases: ['proceso ventas', 'equipo comercial', 'ciclo venta']
  },
  partnerships: {
    keywords: ['partnership', 'alianza', 'socio', 'colaboración', 'joint venture'],
    phrases: ['buscar socio', 'alianza estratégica']
  },
  acquisitions: {
    keywords: ['adquirir', 'comprar empresa', 'merger', 'fusión', 'm&a'],
    phrases: ['comprar competidor', 'integrar empresa']
  },
  operations: {
    keywords: ['operaciones', 'procesos', 'eficiencia', 'automatizar', 'sistemas'],
    phrases: ['mejorar procesos', 'optimizar operaciones']
  },
  processes: {
    keywords: ['proceso', 'workflow', 'procedimiento', 'metodología'],
    phrases: ['definir proceso', 'mejorar workflow']
  },
  culture: {
    keywords: ['cultura', 'valores', 'ambiente', 'remote', 'oficina'],
    phrases: ['cultura empresa', 'forma de trabajar', 'valores equipo']
  },
  leadership: {
    keywords: ['liderazgo', 'liderar', 'management', 'gestión', 'ceo', 'founder'],
    phrases: ['ser mejor líder', 'gestionar equipo', 'tomar decisiones']
  },
  general: {
    keywords: [],
    phrases: []
  }
};

// Domain-specific question banks - TARGETED, not generic
const DOMAIN_QUESTIONS: Record<BusinessDomain, {
  critical: { question: string; why: string }[];
  important: { question: string; why: string }[];
}> = {
  hiring: {
    critical: [
      { question: "¿Qué rol específico necesitas cubrir y qué haría esta persona en el día a día?", why: "Sin saber el rol concreto, no podemos evaluar fit" },
      { question: "¿Cuántas personas tienes ahora en ese área y cómo está funcionando?", why: "Contexto del equipo actual" },
      { question: "¿Qué 3 cualidades son innegociables para este puesto?", why: "Criterios de selección claros" },
    ],
    important: [
      { question: "¿Qué ha funcionado y qué no con contrataciones anteriores similares?", why: "Aprender del pasado" },
      { question: "¿Cómo describirías la cultura de tu equipo en 2-3 frases?", why: "Para evaluar fit cultural" },
      { question: "¿Tienes presupuesto definido o es flexible según el candidato?", why: "Restricciones salariales" },
      { question: "¿Para cuándo necesitas a esta persona incorporada?", why: "Urgencia" },
    ]
  },
  firing: {
    critical: [
      { question: "¿Qué situación específica te ha llevado a considerar esto?", why: "Entender el problema raíz" },
      { question: "¿Has tenido conversaciones directas sobre el rendimiento con esta persona?", why: "Proceso previo" },
      { question: "¿Qué impacto tendría en el equipo y en el trabajo?", why: "Consecuencias" },
    ],
    important: [
      { question: "¿Has explorado alternativas (cambio de rol, coaching, etc.)?", why: "Opciones" },
      { question: "¿Qué aspectos legales o contractuales hay que considerar?", why: "Riesgos" },
    ]
  },
  team: {
    critical: [
      { question: "¿Cuántas personas hay en el equipo y qué hace cada una?", why: "Estructura actual" },
      { question: "¿Qué problema específico quieres resolver con la reorganización?", why: "Objetivo" },
      { question: "¿Cómo se toman las decisiones actualmente?", why: "Proceso actual" },
    ],
    important: [
      { question: "¿Hay conflictos o fricciones que debamos conocer?", why: "Dinámicas" },
      { question: "¿Qué habilidades faltan en el equipo actual?", why: "Gaps" },
    ]
  },
  pricing: {
    critical: [
      { question: "¿Qué precio tienes ahora y cómo llegaste a él?", why: "Punto de partida" },
      { question: "¿Cuánto están pagando tus clientes actuales y qué dicen del precio?", why: "Feedback real" },
      { question: "¿Qué cobran tus competidores directos por algo similar?", why: "Contexto mercado" },
    ],
    important: [
      { question: "¿Cuál es tu coste de adquisición y margen actual?", why: "Unit economics" },
      { question: "¿Has probado diferentes precios? ¿Qué pasó?", why: "Experimentos" },
      { question: "¿Qué segmentos de cliente tienes y cuánto paga cada uno?", why: "Segmentación" },
    ]
  },
  revenue: {
    critical: [
      { question: "¿Cuál es tu revenue actual mensual/anual y cómo ha evolucionado?", why: "Baseline" },
      { question: "¿De dónde vienen los ingresos (qué productos, qué clientes)?", why: "Mix" },
      { question: "¿Cuál es tu objetivo de revenue y para cuándo?", why: "Meta" },
    ],
    important: [
      { question: "¿Cuál es tu churn rate?", why: "Retención" },
      { question: "¿Qué palancas has identificado para crecer?", why: "Opciones" },
    ]
  },
  costs: {
    critical: [
      { question: "¿Cuáles son tus principales costes y cuánto representan?", why: "Desglose" },
      { question: "¿Cuál es tu runway actual?", why: "Urgencia" },
      { question: "¿Qué costes son fijos vs variables?", why: "Flexibilidad" },
    ],
    important: [
      { question: "¿Qué has intentado recortar ya?", why: "Acciones previas" },
      { question: "¿Qué costes son intocables?", why: "Restricciones" },
    ]
  },
  product_launch: {
    critical: [
      { question: "¿Qué producto/servicio vas a lanzar y qué problema resuelve?", why: "Propuesta valor" },
      { question: "¿Has validado la demanda con clientes reales? ¿Cómo?", why: "Validación" },
      { question: "¿Quién es tu cliente ideal y cómo vas a llegar a él?", why: "GTM" },
    ],
    important: [
      { question: "¿Qué fecha de lanzamiento tienes en mente y por qué?", why: "Timeline" },
      { question: "¿Qué competidores existen y cómo te diferencias?", why: "Posicionamiento" },
      { question: "¿Qué métricas definirán si el lanzamiento fue exitoso?", why: "Criterios éxito" },
    ]
  },
  product_pivot: {
    critical: [
      { question: "¿Qué está fallando con el enfoque actual? Datos concretos.", why: "Diagnóstico" },
      { question: "¿Hacia dónde quieres pivotar y por qué crees que funcionará mejor?", why: "Nueva dirección" },
      { question: "¿Qué feedback de clientes te ha llevado a considerar el pivot?", why: "Evidencia" },
    ],
    important: [
      { question: "¿Qué recursos tienes para el pivot (tiempo, dinero, equipo)?", why: "Viabilidad" },
      { question: "¿Qué del producto actual podrías mantener?", why: "Assets" },
    ]
  },
  features: {
    critical: [
      { question: "¿Qué features estás considerando y qué problema resuelve cada una?", why: "Opciones" },
      { question: "¿Qué piden más tus usuarios actuales?", why: "Demanda" },
      { question: "¿Cuál es tu capacidad de desarrollo (personas, tiempo)?", why: "Restricciones" },
    ],
    important: [
      { question: "¿Qué impacto tendría cada feature en retención o conversión?", why: "Priorización" },
      { question: "¿Hay deuda técnica que debas considerar?", why: "Dependencias" },
    ]
  },
  fundraising: {
    critical: [
      { question: "¿Cuánto quieres levantar y para qué lo usarías específicamente?", why: "Ask y use of funds" },
      { question: "¿Cuáles son tus métricas actuales (revenue, growth, usuarios)?", why: "Tracción" },
      { question: "¿Qué valoración tienes en mente y en qué la basas?", why: "Expectativas" },
    ],
    important: [
      { question: "¿Has hablado con inversores? ¿Qué feedback has recibido?", why: "Señales mercado" },
      { question: "¿Cuánto runway tienes sin levantar?", why: "Urgencia" },
      { question: "¿Qué tipo de inversor buscas (VC, angel, strategic)?", why: "Fit" },
    ]
  },
  investment: {
    critical: [
      { question: "¿Qué startup/deal estás evaluando? Describe brevemente.", why: "Contexto" },
      { question: "¿Qué términos te están proponiendo?", why: "Deal" },
      { question: "¿Cuál es tu tesis de inversión y cómo encaja esto?", why: "Fit estratégico" },
    ],
    important: [
      { question: "¿Qué due diligence has hecho?", why: "Proceso" },
      { question: "¿Qué te preocupa del deal?", why: "Red flags" },
    ]
  },
  exit: {
    critical: [
      { question: "¿Tienes una oferta concreta o estás explorando?", why: "Estado" },
      { question: "¿Qué valoración tienes en mente o te han ofrecido?", why: "Números" },
      { question: "¿Por qué ahora? ¿Qué te motiva a considerar la salida?", why: "Motivación" },
    ],
    important: [
      { question: "¿Qué pasaría con el equipo?", why: "Responsabilidades" },
      { question: "¿Tienes obligaciones con inversores actuales?", why: "Restricciones" },
    ]
  },
  growth: {
    critical: [
      { question: "¿Cuál es tu crecimiento actual (%, absoluto) y objetivo?", why: "Baseline y meta" },
      { question: "¿Cuáles son tus principales canales de adquisición hoy?", why: "Estado actual" },
      { question: "¿Qué limitantes ves para crecer más rápido?", why: "Cuellos de botella" },
    ],
    important: [
      { question: "¿Qué experimentos de growth has probado?", why: "Aprendizajes" },
      { question: "¿Tu unit economics mejora o empeora con escala?", why: "Sostenibilidad" },
    ]
  },
  marketing: {
    critical: [
      { question: "¿Quién es tu cliente ideal y cómo lo describes?", why: "Target" },
      { question: "¿Qué canales usas ahora y cuáles funcionan mejor?", why: "Mix actual" },
      { question: "¿Cuál es tu presupuesto de marketing?", why: "Recursos" },
    ],
    important: [
      { question: "¿Cómo te posicionas vs competidores?", why: "Diferenciación" },
      { question: "¿Qué CAC tienes por canal?", why: "Eficiencia" },
    ]
  },
  sales: {
    critical: [
      { question: "¿Cómo es tu proceso de ventas actual paso a paso?", why: "Proceso" },
      { question: "¿Cuántos vendedores tienes y qué resultados dan?", why: "Equipo" },
      { question: "¿Cuál es tu ciclo de venta y ticket promedio?", why: "Métricas" },
    ],
    important: [
      { question: "¿Dónde pierdes más deals y por qué?", why: "Problemas" },
      { question: "¿Tienes CRM? ¿Qué datos tienes?", why: "Herramientas" },
    ]
  },
  partnerships: {
    critical: [
      { question: "¿Qué tipo de partner buscas y para qué?", why: "Objetivo" },
      { question: "¿Tienes algún partner en mente o candidatos?", why: "Opciones" },
      { question: "¿Qué ofreces tú al partner?", why: "Value prop" },
    ],
    important: [
      { question: "¿Has tenido partnerships antes? ¿Cómo funcionaron?", why: "Experiencia" },
    ]
  },
  acquisitions: {
    critical: [
      { question: "¿Qué empresa estás considerando adquirir y por qué?", why: "Target" },
      { question: "¿Qué sinergias esperas conseguir?", why: "Razón estratégica" },
      { question: "¿Tienes capacidad financiera para la adquisición?", why: "Viabilidad" },
    ],
    important: [
      { question: "¿Cómo integrarías la empresa adquirida?", why: "Plan" },
    ]
  },
  operations: {
    critical: [
      { question: "¿Qué proceso u operación quieres mejorar específicamente?", why: "Foco" },
      { question: "¿Cuál es el problema actual? Datos concretos.", why: "Diagnóstico" },
      { question: "¿Quiénes están involucrados en este proceso?", why: "Stakeholders" },
    ],
    important: [
      { question: "¿Qué has intentado antes para mejorarlo?", why: "Historia" },
    ]
  },
  processes: {
    critical: [
      { question: "¿Qué proceso necesitas definir o mejorar?", why: "Objetivo" },
      { question: "¿Cómo se hace actualmente (si existe)?", why: "As-is" },
      { question: "¿Qué resultado esperas del nuevo proceso?", why: "To-be" },
    ],
    important: [
      { question: "¿Quién ejecutará este proceso?", why: "Responsables" },
    ]
  },
  culture: {
    critical: [
      { question: "¿Cómo describirías tu cultura actual en 3 palabras?", why: "Baseline" },
      { question: "¿Qué aspecto de la cultura quieres cambiar o preservar?", why: "Objetivo" },
      { question: "¿Por qué surge esto ahora?", why: "Trigger" },
    ],
    important: [
      { question: "¿Cómo es el día a día de trabajo en tu empresa?", why: "Realidad" },
    ]
  },
  leadership: {
    critical: [
      { question: "¿Qué situación de liderazgo te preocupa o quieres mejorar?", why: "Problema" },
      { question: "¿Cuántas personas lideras directamente?", why: "Contexto" },
      { question: "¿Qué feedback has recibido de tu equipo?", why: "Perspectiva otros" },
    ],
    important: [
      { question: "¿Qué tipo de decisiones te cuestan más?", why: "Puntos débiles" },
    ]
  },
  general: {
    critical: [
      { question: "¿Puedes describir la situación con más detalle?", why: "Contexto" },
      { question: "¿Qué opciones estás considerando?", why: "Alternativas" },
      { question: "¿Qué te impide tomar la decisión ahora?", why: "Blockers" },
    ],
    important: [
      { question: "¿Para cuándo necesitas decidir?", why: "Urgencia" },
    ]
  }
};

// Detect specific business domain from input
function detectBusinessDomain(input: string): BusinessDomain {
  const inputLower = input.toLowerCase();
  let bestMatch: BusinessDomain = 'general';
  let highestScore = 0;

  for (const [domain, patterns] of Object.entries(DOMAIN_PATTERNS) as [BusinessDomain, typeof DOMAIN_PATTERNS[BusinessDomain]][]) {
    if (domain === 'general') continue;

    let score = 0;

    // Check keywords (1 point each)
    for (const keyword of patterns.keywords) {
      if (inputLower.includes(keyword)) {
        score += 1;
      }
    }

    // Check phrases (2 points each - more specific)
    for (const phrase of patterns.phrases) {
      if (inputLower.includes(phrase)) {
        score += 2;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = domain;
    }
  }

  return bestMatch;
}

// Generate reflection based on what user said - shows we understood
function generateReflection(
  userInput: string,
  previousContext: string,
  domain: BusinessDomain,
  extractedData: Record<string, string>
): string {
  const dataPoints = Object.entries(extractedData)
    .filter(([_, v]) => v && v.length > 0)
    .map(([k, v]) => `${k}: ${v}`);

  if (dataPoints.length === 0) {
    return "";
  }

  // Build a reflection that connects the dots
  const reflection = `Entiendo: ${dataPoints.join('. ')}.`;
  return reflection;
}

// Check for inconsistencies between data points
function findInconsistencies(data: Record<string, string>): { field1: string; field2: string; issue: string }[] {
  const inconsistencies: { field1: string; field2: string; issue: string }[] = [];

  // Example checks - add more as needed
  const urgency = data['urgencia'] || data['timeline'] || '';
  const resources = data['recursos'] || data['presupuesto'] || '';

  if (urgency.toLowerCase().includes('urgente') && resources.toLowerCase().includes('limitado')) {
    inconsistencies.push({
      field1: 'urgencia',
      field2: 'recursos',
      issue: 'Mencionas urgencia pero recursos limitados - ¿cómo planeas resolverlo?'
    });
  }

  return inconsistencies;
}

// ADAPTIVE DEPTH: Generate follow-up question for short answers
function generateFollowUpQuestion(
  shortAnswer: string,
  originalQuestion: string,
  domain: BusinessDomain
): string | null {
  // Only trigger for answers shorter than 30 characters (excluding yes/no)
  const isShortAnswer = shortAnswer.length < 30;
  const isYesNo = /^(sí|si|no|yes|maybe|quizás|tal vez)$/i.test(shortAnswer.trim());

  if (!isShortAnswer || isYesNo) {
    return null; // No need for follow-up
  }

  // Domain-specific follow-up templates
  const followUpTemplates: Record<BusinessDomain, string[]> = {
    hiring: [
      "¿Puedes describir más el perfil que buscas?",
      "¿Qué experiencia previa debería tener?",
      "¿Hay algún skill técnico específico que sea crítico?",
    ],
    pricing: [
      "¿Puedes dar un rango numérico más específico?",
      "¿Cómo se compara esto con lo que cobran tus competidores?",
      "¿Qué margen necesitas para ser rentable?",
    ],
    growth: [
      "¿Cuántos usuarios/clientes tienes actualmente?",
      "¿Qué canales has probado y con qué resultados?",
      "¿Cuál es tu objetivo de crecimiento específico?",
    ],
    fundraising: [
      "¿Puedes especificar la cantidad que buscas?",
      "¿Qué valoración esperas?",
      "¿Has hablado con inversores? ¿Qué feedback recibiste?",
    ],
    general: [
      "¿Puedes dar más detalle sobre eso?",
      "¿Qué significa eso concretamente para tu situación?",
      "¿Puedes poner un ejemplo específico?",
    ],
    firing: ["¿Cuánto tiempo llevas considerando esto?", "¿Has tenido conversaciones previas?"],
    team: ["¿Cuántas personas hay actualmente?", "¿Qué roles específicos?"],
    revenue: ["¿Cuál es tu facturación actual?", "¿Qué objetivo tienes?"],
    costs: ["¿Cuál es el desglose de costes?", "¿Qué es fijo vs variable?"],
    product_launch: ["¿Qué fecha tienes en mente?", "¿Has validado la demanda?"],
    product_pivot: ["¿Qué datos concretos te llevan a esto?", "¿Qué has aprendido?"],
    features: ["¿Qué impacto esperas?", "¿Cuántos usuarios lo piden?"],
    investment: ["¿Qué términos te proponen?", "¿Qué due diligence has hecho?"],
    exit: ["¿Tienes una oferta concreta?", "¿Qué valoración?"],
    marketing: ["¿Qué presupuesto tienes?", "¿Qué canales usas?"],
    sales: ["¿Cuál es tu ciclo de venta?", "¿Cuántos leads tienes?"],
    partnerships: ["¿Qué buscas en un partner?", "¿Qué ofreces tú?"],
    acquisitions: ["¿Qué sinergias esperas?", "¿Tienes capacidad financiera?"],
    operations: ["¿Cuál es el cuello de botella?", "¿Quiénes están involucrados?"],
    processes: ["¿Cómo se hace actualmente?", "¿Quién lo ejecutará?"],
    culture: ["¿Cómo describirías tu cultura actual?", "¿Qué quieres cambiar?"],
    leadership: ["¿Cuántas personas lideras?", "¿Qué feedback has recibido?"],
  };

  const templates = followUpTemplates[domain] || followUpTemplates.general;

  // Pick a random follow-up
  const followUp = templates[Math.floor(Math.random() * templates.length)];

  return followUp;
}

// Helper functions
async function detectDebateType(input: string): Promise<"business_decision" | "strategy" | "product" | "general"> {
  const inputLower = input.toLowerCase();

  // Palabras clave muy específicas (detección rápida)
  if (inputLower.includes("producto") || inputLower.includes("feature") ||
      inputLower.includes("mvp") || inputLower.includes("lanzar") ||
      inputLower.includes("usuario") || inputLower.includes("problema que resuelve")) {
    return "product";
  }

  if (inputLower.includes("estrategia") || inputLower.includes("visión") ||
      inputLower.includes("largo plazo") || inputLower.includes("competencia") ||
      inputLower.includes("mercado") || inputLower.includes("posicionamiento")) {
    return "strategy";
  }

  if (inputLower.includes("decisión") || inputLower.includes("elegir") ||
      inputLower.includes("opción") || inputLower.includes("alternativa") ||
      inputLower.includes("evaluar") || inputLower.includes("comparar")) {
    return "business_decision";
  }

  // Si no hay palabras clave claras, usar IA para categorizar
  try {
    const aiClient = getAIClient();
    const response = await aiClient.generate(
      `Clasifica este texto en UNA de estas categorías:
      - "product": Habla de crear/lanzar un producto, features, MVP, usuarios
      - "strategy": Habla de estrategia, visión, mercado, competencia, largo plazo
      - "business_decision": Habla de tomar una decisión entre opciones, evaluar alternativas
      - "general": Ninguna de las anteriores

      Texto: "${input.substring(0, 200)}"

      Responde SOLO con una palabra: product, strategy, business_decision o general`,
      {
        modelId: "gemini-2.0-flash-exp",
        temperature: 0.1,
        maxTokens: 50,
      }
    );

    const detected = response.text.trim().toLowerCase();
    if (detected.includes("product")) return "product";
    if (detected.includes("strategy")) return "strategy";
    if (detected.includes("business_decision")) return "business_decision";
  } catch (error) {
    console.error("[Context Assessment] AI detection failed, using general:", error);
  }

  return "general";
}

function getReadinessLevel(score: number): "insufficient" | "basic" | "good" | "excellent" {
  if (score < 40) return "insufficient";
  if (score < 60) return "basic";
  if (score < 85) return "good"; // Subido de 75 a 85
  return "excellent";
}

function getRecommendedAction(score: number, criticalMissing: boolean): "proceed" | "clarify" | "refine" {
  if (criticalMissing) return "clarify";
  if (score < 60) return "refine"; // Subido de 40 a 60
  if (score < 85) return "clarify"; // Subido de 60 a 85
  return "proceed";
}

// AI Analysis Schema
const aiAnalysisSchema = z.object({
  dimensions: z.array(z.object({
    id: z.string(),
    score: z.number().min(0).max(100),
    extractedInfo: z.string().nullable(),
    suggestions: z.array(z.string()),
  })),
  assumptions: z.array(z.object({
    dimension: z.string(),
    assumption: z.string(),
    confidence: z.number().min(0).max(1),
    questionType: z.enum(["yes_no", "multiple_choice", "free_text"]).default("yes_no"),
    alternatives: z.array(z.string()).default([]), // Empty array for yes/no questions
  })),
  questions: z.array(z.object({
    question: z.string(),
    dimension: z.string(),
    priority: z.enum(["critical", "important", "nice-to-have"]),
    questionType: z.enum(["yes_no", "multiple_choice", "free_text"]).default("free_text"),
    options: z.array(z.string()).optional(), // Only if questionType = "multiple_choice"
  })),
  summary: z.string(),
});

// AI-powered analysis function with DOMAIN-SPECIFIC questions
async function analyzeWithAI(
  userInput: string,
  debateType: string,
  dimensions: { id: string; name: string; description: string; weight: number }[],
  businessDomain?: BusinessDomain
): Promise<z.infer<typeof aiAnalysisSchema> & { reflection?: string; domain?: BusinessDomain }> {
  const aiClient = getAIClient();

  // Detect business domain for targeted questions
  const domain = businessDomain || detectBusinessDomain(userInput);
  const domainQuestions = DOMAIN_QUESTIONS[domain];

  // Build domain-specific question bank for the AI
  const questionBank = [
    ...domainQuestions.critical.map(q => ({ ...q, priority: 'critical' as const })),
    ...domainQuestions.important.map(q => ({ ...q, priority: 'important' as const })),
  ];

  const domainInfo = domain !== 'general'
    ? `\n\nDOMINIO DETECTADO: ${domain.toUpperCase()}
Usa PREFERENTEMENTE estas preguntas específicas del dominio (adaptándolas al contexto):
${questionBank.map((q, i) => `${i + 1}. [${q.priority}] "${q.question}" - Razón: ${q.why}`).join('\n')}`
    : '';

  const systemPrompt = `Eres un experto en análisis de contexto para debates estratégicos.
Tu trabajo es analizar el input del usuario y evaluar qué tan completo es el contexto proporcionado.

PRINCIPIO CLAVE: Sé INTELIGENTE y ADAPTATIVO. Elige el tipo de pregunta que maximice el contexto obtenido.
- Si el usuario YA mencionó algo, reconócelo y profundiza en ello
- Si falta algo, haz suposiciones razonables basadas en el contexto dado
- Las preguntas deben ser específicas y relevantes al caso concreto
- CRUCIAL: Varía el tipo de pregunta según lo que necesites saber

TIPOS DE PREGUNTAS DISPONIBLES:
1. "yes_no": Preguntas Sí/No (rápidas, para validar suposiciones directas)
   - Ejemplo: "¿Tienes presupuesto aprobado?" → Sí/No
   - Uso: Cuando solo necesitas confirmación binaria

2. "multiple_choice": Opciones múltiples (útil cuando hay alternativas claras)
   - Ejemplo: "¿Cuál es tu presupuesto?" → ["<50k", "50-200k", ">200k"]
   - Uso: Cuando hay categorías o rangos definidos

3. "free_text": Texto libre (para información única o compleja)
   - Ejemplo: "Describe tu competencia principal"
   - Uso: Cuando las opciones predefinidas limitarían la respuesta

Debes responder SOLO con un JSON válido siguiendo exactamente este esquema:
{
  "dimensions": [
    {
      "id": "dimension_id",
      "score": 0-100,
      "extractedInfo": "cita textual o paráfrasis de lo que el usuario mencionó, o null si no mencionó nada",
      "suggestions": ["sugerencia específica basada en lo que escribió", "otra sugerencia concreta"]
    }
  ],
  "assumptions": [
    {
      "dimension": "dimension_id",
      "assumption": "suposición ESPECÍFICA basada en el contexto dado",
      "confidence": 0.0-1.0,
      "questionType": "yes_no|multiple_choice|free_text",
      "alternatives": [] // VACÍO para yes_no, 2-4 opciones para multiple_choice, vacío para free_text
    }
  ],
  "questions": [
    {
      "question": "pregunta ESPECÍFICA adaptada al tipo elegido",
      "dimension": "dimension_id",
      "priority": "critical|important|nice-to-have",
      "questionType": "yes_no|multiple_choice|free_text",
      "options": ["opción 1", "opción 2"] // SOLO si questionType = "multiple_choice"
    }
  ],
  "summary": "resumen del contexto mencionando EXPLÍCITAMENTE qué información útil dio y qué falta"
}

Criterios de puntuación (sé EXIGENTE, el objetivo es 85%+ para continuar):
- 0-30: No se menciona nada o información muy vaga
- 31-50: Se menciona brevemente pero falta detalle crítico y específico
- 51-70: Información parcial útil, pero requiere más profundidad
- 71-85: Información buena y detallada, podría mejorarse con algunos datos concretos
- 86-95: Información muy completa con datos específicos y medibles
- 96-100: Información exhaustiva, detallada, con datos cuantitativos y cualitativos

REGLAS PARA ASSUMPTIONS (globos sonda inteligentes):
- Genera 3-5 assumptions variando los tipos de pregunta
- Deben ser suposiciones INTELIGENTES basadas en lo que el usuario escribió
- Ejemplo: Si menciona "startup SaaS", asumir "modelo de suscripción mensual", no "tienes un negocio"
- Elige el tipo según la naturaleza de la suposición:
  * yes_no: "Asumo que tienes equipo técnico interno" → ¿Correcto? Sí/No
  * multiple_choice: "Asumo presupuesto <50k" → alternatives: ["<50k", "50-200k", ">200k"]
  * free_text: "Asumo competidores locales" → ¿Quiénes son exactamente?

REGLAS PARA QUESTIONS (varía el tipo inteligentemente):
- SIEMPRE genera 3-5 preguntas (nunca menos de 3), priorizando las MÁS impactantes
- Las preguntas deben mostrarse SIMULTÁNEAMENTE al usuario (no una por una)
- Ordena por prioridad: critical > important > nice-to-have
- NO preguntes lo obvio. Pregunta lo ESPECÍFICO y accionable
- Elige el tipo que mejor capture la información:
  * yes_no para validaciones rápidas ("¿Tienes clientes actualmente?")
  * multiple_choice para rangos/categorías ("¿Cuántos clientes?" → ["0-10", "10-50", "50+"])
  * free_text para información única ("¿Cuál es tu propuesta de valor única?")
- Si el usuario ya mencionó algo, PROFUNDIZA en ello, no lo repitas
- Las preguntas con weight > 0.15 son "critical", el resto "important"
- Cada pregunta debe atacar una dimensión diferente (no redundantes)

Ejemplos BUENOS de variedad:
✅ ASSUMPTION yes_no: {"assumption": "Tienes equipo técnico interno", "questionType": "yes_no", "alternatives": []}
✅ ASSUMPTION multiple_choice: {"assumption": "Presupuesto <50k USD", "questionType": "multiple_choice", "alternatives": ["<50k", "50-200k", ">200k"]}
✅ QUESTION yes_no: {"question": "¿Ya tienes producto en el mercado?", "questionType": "yes_no"}
✅ QUESTION multiple_choice: {"question": "¿Cuántos usuarios tienes?", "questionType": "multiple_choice", "options": ["0-100", "100-1000", ">1000"]}
✅ QUESTION free_text: {"question": "Describe tu propuesta de valor única", "questionType": "free_text"}

❌ MALO: Todas las preguntas son multiple_choice con 3 opciones (patrón rígido)
✅ BUENO: Mezcla inteligente de yes_no, multiple_choice y free_text según lo que maximice contexto
${domainInfo}

IMPORTANTE: Al final del summary, incluye una REFLECTION que demuestre que entendiste la situación del usuario.
Formato: "Entiendo que [parafrasear su situación]. [Conectar puntos]. Por eso pregunto sobre [tema]."`;

  const userPrompt = `Tipo de debate: ${debateType}
Dominio de negocio detectado: ${domain}

Dimensiones a evaluar:
${dimensions.map(d => `- ${d.id} (${d.name}): ${d.description} [peso: ${d.weight}]`).join("\n")}

Input del usuario:
"""
${userInput}
"""

Analiza el contexto y devuelve el JSON con tu evaluación.`;

  try {
    const response = await aiClient.generate(userPrompt, {
      systemPrompt,
      modelId: "gemini-2.0-flash-exp", // Usar Gemini en lugar de OpenAI (sin cuota)
      temperature: 0.5, // Más creativo para suposiciones inteligentes
      maxTokens: 2500, // Más tokens para suposiciones detalladas
    });

    console.log("[Context Assessment] AI response received, parsing JSON...");

    // Parse and validate the response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Context Assessment] No JSON found in AI response, using fallback");
      throw new Error("No JSON found in AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = aiAnalysisSchema.parse(parsed);

    console.log("[Context Assessment] AI analysis successful:", {
      dimensionsCount: validated.dimensions.length,
      assumptionsCount: validated.assumptions.length,
      questionsCount: validated.questions.length,
      domain
    });

    // Extract reflection from summary if present (after "Entiendo que")
    let reflection: string | undefined;
    const reflectionMatch = validated.summary.match(/Entiendo que[^.]+\./i);
    if (reflectionMatch) {
      reflection = reflectionMatch[0];
    }

    return { ...validated, reflection, domain };
  } catch (error) {
    console.error("[Context Assessment] AI analysis failed, using fallback:", error instanceof Error ? error.message : error);
    // Fallback to keyword-based analysis if AI fails
    const fallback = fallbackAnalysis(userInput, dimensions);
    return { ...fallback, domain };
  }
}

// Fallback analysis using keywords (when AI is unavailable)
function fallbackAnalysis(
  userInput: string,
  dimensions: { id: string; name: string; description: string; weight: number }[]
): z.infer<typeof aiAnalysisSchema> {
  const inputLower = userInput.toLowerCase();

  const DIMENSION_KEYWORDS: Record<string, string[]> = {
    objective: ["quiero", "necesito", "objetivo", "meta", "lograr", "conseguir"],
    constraints: ["presupuesto", "tiempo", "límite", "restricción", "máximo", "mínimo", "€", "$"],
    stakeholders: ["equipo", "cliente", "usuario", "jefe", "inversor", "socio"],
    context: ["actualmente", "situación", "ahora", "hasta ahora", "historia"],
    options: ["opción", "alternativa", "podría", "considero", "entre"],
    criteria: ["éxito", "medir", "kpi", "métrica", "resultado"],
    risks: ["riesgo", "problema", "peligro", "amenaza", "podría fallar"],
    timeline: ["plazo", "fecha", "mes", "semana", "urgente", "deadline"],
    vision: ["visión", "futuro", "aspiración", "sueño", "largo plazo"],
    current_state: ["actualmente", "hoy", "estado actual", "situación"],
    market: ["mercado", "competencia", "competidor", "industria", "sector"],
    resources: ["recurso", "equipo", "dinero", "talento", "herramienta"],
    differentiators: ["diferencia", "único", "ventaja", "mejor que"],
    problem: ["problema", "dolor", "necesidad", "frustración"],
    user: ["usuario", "cliente", "persona", "target", "audiencia"],
    solution: ["solución", "resolver", "producto", "servicio"],
    mvp: ["mvp", "mínimo", "primera versión", "prototipo"],
    metrics: ["métrica", "kpi", "medir", "tracking"],
  };

  const ASSUMPTIONS: Record<string, string> = {
    objective: "El objetivo es tomar una decisión informada sobre este tema",
    constraints: "No hay restricciones de presupuesto críticas",
    stakeholders: "La decisión la tomas tú o tu equipo directo",
    timeline: "No hay una urgencia crítica inmediata",
    market: "Operas en un mercado competitivo estándar",
  };

  const ALTERNATIVES: Record<string, string[]> = {
    objective: ["Validar una idea", "Tomar una decisión", "Explorar opciones"],
    constraints: ["Presupuesto muy limitado", "Sin límite de presupuesto", "Restricciones de tiempo"],
    stakeholders: ["Solo yo", "Equipo pequeño", "Múltiples departamentos"],
    timeline: ["Urgente (días)", "Corto plazo (semanas)", "Medio plazo (meses)"],
  };

  const QUESTIONS: Record<string, string> = {
    objective: "¿Cuál es el resultado específico que quieres lograr?",
    constraints: "¿Qué limitaciones tienes en presupuesto, tiempo o recursos?",
    stakeholders: "¿Quiénes están involucrados o se verán afectados?",
    context: "¿Cuál es la situación actual? ¿Qué ha pasado hasta ahora?",
    options: "¿Qué alternativas has considerado?",
    criteria: "¿Cómo medirás el éxito?",
    risks: "¿Qué podría salir mal?",
    timeline: "¿Cuándo necesitas tomar esta decisión?",
    problem: "¿Qué problema específico estás resolviendo?",
    user: "¿Quién es tu usuario o cliente ideal?",
  };

  const analyzedDimensions = dimensions.map((dim) => {
    const keywords = DIMENSION_KEYWORDS[dim.id] || [];
    const foundKeywords = keywords.filter((kw) => inputLower.includes(kw));

    let score = 0;
    let extractedInfo: string | null = null;
    const suggestions: string[] = [];

    if (foundKeywords.length >= 2) {
      score = 75;
      extractedInfo = `Detectado: ${foundKeywords.join(", ")}`;
    } else if (foundKeywords.length === 1) {
      score = 40;
      extractedInfo = `Mencionado: ${foundKeywords[0]}`;
      suggestions.push(`Añade más detalle sobre ${dim.name.toLowerCase()}`);
    } else {
      score = 0;
      suggestions.push(`No se menciona ${dim.name.toLowerCase()}`);
    }

    return { id: dim.id, score, extractedInfo, suggestions };
  });

  const partialDims = analyzedDimensions.filter((d) => d.score >= 30 && d.score < 60);
  const assumptions = partialDims.slice(0, 3).map((dim) => {
    const alternatives = ALTERNATIVES[dim.id] || [];
    return {
      dimension: dim.id,
      assumption: ASSUMPTIONS[dim.id] || "Información general asumida",
      confidence: 0.6,
      questionType: (alternatives.length > 0 ? "multiple_choice" : "yes_no") as "yes_no" | "multiple_choice" | "free_text",
      alternatives,
    };
  });

  const missingDims = analyzedDimensions.filter((d) => d.score < 50);
  const questions = missingDims.slice(0, 4).map((dim) => {
    const template = dimensions.find((d) => d.id === dim.id);
    return {
      question: QUESTIONS[dim.id] || `¿Puedes dar más detalle sobre ${template?.name.toLowerCase() || dim.id}?`,
      dimension: dim.id,
      priority: ((template?.weight || 0) > 0.15 ? "critical" : "important") as "critical" | "important" | "nice-to-have",
      questionType: "free_text" as const, // Fallback uses free text since no AI to generate options
    };
  });

  const avgScore = analyzedDimensions.reduce((sum, d) => sum + d.score, 0) / analyzedDimensions.length;
  const missingCount = analyzedDimensions.filter((d) => d.score < 30).length;

  let summary: string;
  if (avgScore >= 70) {
    summary = "Contexto bastante completo para iniciar el debate.";
  } else if (avgScore >= 50) {
    summary = `Buen punto de partida. ${missingCount} área(s) podrían clarificarse.`;
  } else if (avgScore >= 30) {
    summary = `Contexto básico. Recomiendo añadir más detalle en ${missingCount} áreas.`;
  } else {
    summary = "Necesito más contexto para un debate efectivo.";
  }

  return { dimensions: analyzedDimensions, assumptions, questions, summary };
}

export const contextAssessmentRouter = router({
  /**
   * Analyze user input and return context assessment using AI
   */
  analyze: protectedProcedure
    .input(
      z.object({
        userInput: z.string().min(10, "Input must be at least 10 characters"),
        debateType: z.enum(["business_decision", "strategy", "product", "general"]).optional(),
      })
    )
    .output(contextAssessmentSchema)
    .mutation(async ({ input }) => {
      // Auto-detectar categoría SIEMPRE (ignorar lo que mande el usuario)
      const debateType = await detectDebateType(input.userInput);
      const dimensions = DIMENSION_TEMPLATES[debateType] ?? DIMENSION_TEMPLATES.general ?? [];

      console.log("[Context Assessment] Auto-detected debate type:", debateType);

      // Use AI for analysis
      const aiResult = await analyzeWithAI(input.userInput, debateType, dimensions);

      // Convert AI result to ContextAssessment
      const analyzedDimensions = aiResult.dimensions.map((d) => {
        const template = dimensions.find((t) => t.id === d.id);
        return {
          id: d.id,
          name: template?.name || d.id,
          description: template?.description || "",
          weight: template?.weight || 0.1,
          score: d.score,
          status: (d.score >= 70 ? "complete" : d.score >= 30 ? "partial" : "missing") as "complete" | "partial" | "missing",
          suggestions: d.suggestions,
        };
      });

      const assumptions = aiResult.assumptions.map((a, i) => ({
        id: `assumption-${i}`,
        dimension: a.dimension,
        assumption: typeof a.assumption === 'string' ? a.assumption : JSON.stringify(a.assumption),
        confidence: a.confidence,
        confirmed: null,
        questionType: a.questionType,
        alternatives: a.alternatives,
      }));

      const questions = aiResult.questions.map((q, i) => ({
        id: `question-${i}`,
        question: typeof q.question === 'string' ? q.question : JSON.stringify(q.question),
        dimension: q.dimension,
        priority: q.priority,
        questionType: q.questionType,
        multipleChoice: q.questionType === "multiple_choice" && q.options
          ? { options: q.options, allowMultiple: false }
          : undefined,
        freeText: q.questionType === "free_text",
      }));

      // Calculate overall score (weighted average)
      const totalWeight = analyzedDimensions.reduce((sum, d) => sum + d.weight, 0);
      const overallScore = Math.round(
        analyzedDimensions.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight
      );

      const hasCriticalMissing = questions.some((q) => q.priority === "critical");

      return {
        overallScore,
        readinessLevel: getReadinessLevel(overallScore),
        dimensions: analyzedDimensions,
        assumptions,
        clarifyingQuestions: questions,
        summary: aiResult.summary,
        recommendedAction: getRecommendedAction(overallScore, hasCriticalMissing),
        // NEW: Domain-specific context
        reflection: aiResult.reflection,
        detectedDomain: aiResult.domain,
      };
    }),

  /**
   * Refine assessment with user's answers
   */
  refine: protectedProcedure
    .input(
      z.object({
        originalInput: z.string(),
        answers: contextAnswersSchema,
        previousAssessment: contextAssessmentSchema,
      })
    )
    .output(contextAssessmentSchema)
    .mutation(async ({ input }) => {
      // Build enhanced input with answers - formato estructurado para la IA
      let enhancedInput = `CONTEXTO ORIGINAL:\n${input.originalInput}\n\n`;

      enhancedInput += `INFORMACIÓN ADICIONAL PROPORCIONADA POR EL USUARIO:\n`;

      // Add confirmed assumptions
      const confirmedAssumptions: string[] = [];
      const rejectedAssumptions: string[] = [];
      for (const [id, confirmed] of Object.entries(input.answers.assumptionResponses)) {
        const assumption = input.previousAssessment.assumptions.find((a) => a.id === id);
        if (assumption) {
          if (confirmed) {
            confirmedAssumptions.push(`✓ ${assumption.assumption}`);
          } else {
            rejectedAssumptions.push(`✗ ${assumption.assumption}`);
          }
        }
      }

      if (confirmedAssumptions.length > 0) {
        enhancedInput += `\nSuposiciones confirmadas:\n${confirmedAssumptions.join("\n")}`;
      }
      if (rejectedAssumptions.length > 0) {
        enhancedInput += `\nSuposiciones rechazadas:\n${rejectedAssumptions.join("\n")}`;
      }

      // Add question responses
      const responses: string[] = [];
      for (const [id, response] of Object.entries(input.answers.questionResponses)) {
        const question = input.previousAssessment.clarifyingQuestions.find((q) => q.id === id);
        if (question && response) {
          const responseStr = Array.isArray(response) ? response.join(", ") : response;
          responses.push(`• ${question.question}\n  Respuesta: ${responseStr}`);
        }
      }

      if (responses.length > 0) {
        enhancedInput += `\n\nRespuestas a preguntas:\n${responses.join("\n")}`;
      }

      // Add additional context
      if (input.answers.additionalContext) {
        enhancedInput += `\n\nContexto adicional del usuario:\n${input.answers.additionalContext}`;
      }

      const debateType = await detectDebateType(enhancedInput);
      const dimensions = DIMENSION_TEMPLATES[debateType] ?? DIMENSION_TEMPLATES.general ?? [];

      // En refinamiento, usar prompt DIFERENTE más generoso
      const aiClient = getAIClient();

      const refinementPrompt = `Eres un experto evaluando contexto para debates. El usuario YA proporcionó información adicional.

IMPORTANTE: Sé MUY GENEROSO con la puntuación. El usuario ha hecho el esfuerzo de dar más contexto.

Evalúa este contexto MEJORADO y responde con JSON:
{
  "dimensions": [{"id": "...", "score": 0-100, "extractedInfo": "...", "suggestions": ["..."]}],
  "assumptions": [], // NO generar más assumptions en refinamiento
  "questions": [{"question": "...", "dimension": "...", "priority": "nice-to-have", "options": ["..."]}], // MÁXIMO 2 preguntas opcionales
  "summary": "resumen positivo reconociendo la información proporcionada"
}

CRITERIOS DE PUNTUACIÓN (SÉ GENEROSO):
- 50-70: Información suficiente para empezar (sube scores)
- 71-85: Buena información, contexto útil
- 86-95: Excelente contexto, muy completo
- 96-100: Contexto excepcional y exhaustivo

REGLAS:
- El usuario YA respondió preguntas, reconoce esa información
- NO generes assumptions (ya se validaron)
- Máximo 2 preguntas OPCIONALES (priority: "nice-to-have")
- Las preguntas deben ser MUY específicas y de bajo impacto
- Si ya tiene buena información, NO preguntes más

Contexto mejorado del usuario:
"""
${enhancedInput}
"""

Dimensiones a evaluar:
${dimensions.map(d => `- ${d.id} (${d.name}): ${d.description} [peso: ${d.weight}]`).join("\n")}

Responde SOLO con el JSON.`;

      try {
        const response = await aiClient.generate(refinementPrompt, {
          modelId: "gemini-2.0-flash-exp",
          temperature: 0.4, // Menos creativo, más directo en refinamiento
          maxTokens: 2000,
        });

        console.log("[Context Assessment - Refine] AI response received, parsing JSON...");

        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("[Context Assessment - Refine] No JSON found, using fallback");
          throw new Error("No JSON found in AI response");
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const aiResult = aiAnalysisSchema.parse(parsed);

        console.log("[Context Assessment - Refine] AI analysis successful:", {
          dimensionsCount: aiResult.dimensions.length,
          assumptionsCount: aiResult.assumptions.length,
          questionsCount: aiResult.questions.length
        });

        // Continuar con el mismo código que antes pero usando aiResult
        const analyzedDimensions = aiResult.dimensions.map((d) => {
          const template = dimensions.find((t) => t.id === d.id);
          return {
            id: d.id,
            name: template?.name || d.id,
            description: template?.description || "",
            weight: template?.weight || 0.1,
            score: d.score,
            status: (d.score >= 70 ? "complete" : d.score >= 30 ? "partial" : "missing") as "complete" | "partial" | "missing",
            suggestions: d.suggestions,
          };
        });

        // Calculate new overall score
        const totalWeight = analyzedDimensions.reduce((sum, d) => sum + d.weight, 0);
        const overallScore = Math.round(
          analyzedDimensions.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight
        );

        // Muy pocas preguntas después de refinamiento (máximo 2)
        const questions = aiResult.questions.slice(0, 2).map((q, i) => ({
          id: `refined-question-${i}`,
          question: typeof q.question === 'string' ? q.question : JSON.stringify(q.question),
          dimension: q.dimension,
          priority: "nice-to-have" as const,
          questionType: q.questionType,
          multipleChoice: q.questionType === "multiple_choice" && q.options
            ? { options: q.options, allowMultiple: false }
            : undefined,
          freeText: q.questionType === "free_text",
        }));

        // Generate a reflection that connects the dots from user responses
        const responseSummary = Object.values(input.answers.questionResponses)
          .filter(r => r && (typeof r === 'string' ? r.length > 0 : r.length > 0))
          .slice(0, 3)
          .join(', ');

        const refinedReflection = responseSummary.length > 0
          ? `Entiendo mejor tu situación: ${responseSummary.substring(0, 100)}${responseSummary.length > 100 ? '...' : ''}.`
          : undefined;

        return {
          overallScore,
          readinessLevel: getReadinessLevel(overallScore),
          dimensions: analyzedDimensions,
          assumptions: [], // No más assumptions en refinamiento
          clarifyingQuestions: questions,
          summary: aiResult.summary,
          recommendedAction: getRecommendedAction(overallScore, false),
          // Carry forward domain and add refined reflection
          reflection: refinedReflection,
          detectedDomain: input.previousAssessment.detectedDomain,
        };
      } catch (error) {
        console.error("[Context Assessment - Refine] AI failed, using fallback:", error);
        // Fallback: usar analyze normal
        const aiResult = await analyzeWithAI(enhancedInput, debateType, dimensions);

        const analyzedDimensions = aiResult.dimensions.map((d) => {
          const template = dimensions.find((t) => t.id === d.id);
          return {
            id: d.id,
            name: template?.name || d.id,
            description: template?.description || "",
            weight: template?.weight || 0.1,
            score: d.score,
            status: (d.score >= 70 ? "complete" : d.score >= 30 ? "partial" : "missing") as "complete" | "partial" | "missing",
            suggestions: d.suggestions,
          };
        });

        // Calculate new overall score
        const totalWeight = analyzedDimensions.reduce((sum, d) => sum + d.weight, 0);
        const overallScore = Math.round(
          analyzedDimensions.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight
        );

        // Fewer questions after refinement
        const stillMissing = aiResult.questions.slice(0, 2);
        const questions = stillMissing.map((q, i) => ({
          id: `refined-question-${i}`,
          question: typeof q.question === 'string' ? q.question : JSON.stringify(q.question),
          dimension: q.dimension,
          priority: "nice-to-have" as const,
          questionType: q.questionType,
          multipleChoice: q.questionType === "multiple_choice" && q.options
            ? { options: q.options, allowMultiple: false }
            : undefined,
          freeText: q.questionType === "free_text",
        }));

        return {
          overallScore,
          readinessLevel: getReadinessLevel(overallScore),
          dimensions: analyzedDimensions,
          assumptions: [], // No more assumptions after refinement
          clarifyingQuestions: questions,
          summary: aiResult.summary,
          recommendedAction: getRecommendedAction(overallScore, false),
          // Carry forward domain
          detectedDomain: input.previousAssessment.detectedDomain,
        };
      }
    }),

  /**
   * Auto-Research: Perform automatic research for debate context
   * Now enhanced with domain-specific search queries
   */
  autoResearch: protectedProcedure
    .input(z.object({
      question: z.string().min(10, "Question too short"),
      detectedDomain: z.string().optional(), // hiring, pricing, growth, etc.
    }))
    .mutation(async ({ input }) => {
      const { performAutoResearch } = await import("../lib/auto-research.js");

      // Add domain context to improve search queries
      const domain = input.detectedDomain || detectBusinessDomain(input.question);

      // Domain-specific search prefixes to improve relevance
      const domainPrefixes: Record<string, string> = {
        hiring: "best practices hiring",
        firing: "how to handle employee termination",
        pricing: "SaaS pricing strategy",
        fundraising: "startup fundraising",
        growth: "growth strategies startups",
        marketing: "digital marketing strategy",
        sales: "B2B sales process",
        product_launch: "product launch strategy",
        product_pivot: "startup pivot strategy",
      };

      const prefix = domainPrefixes[domain] || '';
      const enhancedQuestion = prefix ? `${prefix}: ${input.question}` : input.question;

      try {
        const result = await performAutoResearch(enhancedQuestion);
        return {
          ...result,
          detectedDomain: domain, // Include domain in response
        };
      } catch (error) {
        console.error("[Auto-Research] Failed:", error);
        return {
          question: input.question,
          researchResults: [],
          suggestedContext: {},
          executionTimeMs: 0,
          detectedDomain: domain,
        };
      }
    }),

  /**
   * Find Similar Debates: Get similar debates that succeeded
   */
  findSimilarDebates: protectedProcedure
    .input(z.object({
      question: z.string().min(10),
      limit: z.number().min(1).max(10).default(3),
    }))
    .query(async ({ input }) => {
      const { findSimilarDebates } = await import("../lib/auto-research.js");

      try {
        const debates = await findSimilarDebates(input.question, input.limit);
        return debates;
      } catch (error) {
        console.error("[Similar Debates] Failed:", error);
        return [];
      }
    }),

  /**
   * Generate Coaching: Get AI coaching suggestions for missing dimensions
   */
  generateCoaching: protectedProcedure
    .input(z.object({
      question: z.string().min(10),
      currentContext: z.record(z.unknown()),
      missingDimensions: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const { generateCoachingSuggestions } = await import("../lib/auto-research.js");

      try {
        const suggestions = await generateCoachingSuggestions(
          input.question,
          input.currentContext,
          input.missingDimensions
        );
        return suggestions;
      } catch (error) {
        console.error("[Coaching] Failed:", error);
        return [];
      }
    }),

  /**
   * Debate Preview: Generate preview of what experts will debate about
   */
  debatePreview: protectedProcedure
    .input(z.object({
      question: z.string().min(10),
      context: z.record(z.unknown()),
      dimensions: z.array(z.object({
        id: z.string(),
        name: z.string(),
        score: z.number(),
      })),
    }))
    .mutation(async ({ input }) => {
      const { generateDebatePreview } = await import("../lib/debate-preview.js");

      try {
        const preview = await generateDebatePreview(
          input.question,
          input.context,
          input.dimensions
        );
        return preview;
      } catch (error) {
        console.error("[Debate Preview] Failed:", error);
        return {
          hotPoints: [],
          weakPoints: [],
          estimatedRounds: 10,
          consensusLikelihood: 50,
          recommendedExperts: [],
          contextStrength: { overall: 50, dimensions: {} },
        };
      }
    }),

  /**
   * Quality Benchmark: Compare context quality against historical debates
   */
  qualityBenchmark: protectedProcedure
    .input(z.object({
      overallScore: z.number().min(0).max(100),
      dimensions: z.array(z.object({
        id: z.string(),
        name: z.string(),
        score: z.number(),
      })),
    }))
    .mutation(async ({ input }) => {
      const { benchmarkContextQuality } = await import("../lib/quality-benchmark.js");

      try {
        const benchmark = await benchmarkContextQuality(
          input.overallScore,
          input.dimensions
        );
        return benchmark;
      } catch (error) {
        console.error("[Quality Benchmark] Failed:", error);
        return {
          overall: {
            percentile: 50,
            tier: 'average' as const,
            score: input.overallScore,
            avgScore: 65,
            topScore: 85,
          },
          dimensions: [],
          recommendations: [],
          estimatedSuccessRate: 50,
          comparisonInsights: [],
        };
      }
    }),

  /**
   * Context Snapshots: Save current context version
   */
  saveSnapshot: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      question: z.string(),
      context: z.record(z.unknown()),
      score: z.number(),
      dimensions: z.array(z.object({
        id: z.string(),
        name: z.string(),
        score: z.number(),
      })),
      tags: z.array(z.string()).default([]),
    }))
    .mutation(async ({ input }) => {
      const { createSnapshot } = await import("../lib/context-snapshots.js");

      try {
        const snapshot = createSnapshot(
          input.question,
          input.context,
          input.score,
          input.dimensions,
          input.name,
          input.tags
        );
        return snapshot;
      } catch (error) {
        console.error("[Snapshot Save] Failed:", error);
        throw new Error("Failed to save snapshot");
      }
    }),

  /**
   * List Snapshots: Get all saved snapshots
   */
  listSnapshots: protectedProcedure
    .input(z.object({
      questionFilter: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { listSnapshots } = await import("../lib/context-snapshots.js");

      try {
        const snapshots = listSnapshots(input.questionFilter);
        return snapshots;
      } catch (error) {
        console.error("[Snapshot List] Failed:", error);
        return [];
      }
    }),

  /**
   * Restore Snapshot: Load a saved snapshot
   */
  restoreSnapshot: protectedProcedure
    .input(z.object({
      snapshotId: z.string(),
    }))
    .query(async ({ input }) => {
      const { getSnapshot } = await import("../lib/context-snapshots.js");

      try {
        const snapshot = getSnapshot(input.snapshotId);
        if (!snapshot) {
          throw new Error("Snapshot not found");
        }
        return snapshot;
      } catch (error) {
        console.error("[Snapshot Restore] Failed:", error);
        throw new Error("Failed to restore snapshot");
      }
    }),

  /**
   * Delete Snapshot: Remove a saved snapshot
   */
  deleteSnapshot: protectedProcedure
    .input(z.object({
      snapshotId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { deleteSnapshot } = await import("../lib/context-snapshots.js");

      try {
        const success = deleteSnapshot(input.snapshotId);
        return { success };
      } catch (error) {
        console.error("[Snapshot Delete] Failed:", error);
        return { success: false };
      }
    }),

  /**
   * Generate Memorable Summary: Create a rich, personalized summary that makes users feel understood
   * This is shown when context is ready (score >= 85%) before proceeding to the next phase
   */
  generateMemorableSummary: protectedProcedure
    .input(z.object({
      question: z.string().min(10),
      context: z.string().optional(),
      dimensions: z.array(z.object({
        id: z.string(),
        name: z.string(),
        score: z.number(),
        status: z.enum(["missing", "partial", "complete"]),
      })),
      responses: z.record(z.union([z.string(), z.boolean()])), // User's answers to questions/assumptions
      overallScore: z.number(),
      summary: z.string(), // The AI-generated summary from assessment
    }))
    .mutation(async ({ input }) => {
      const aiClient = getAIClient();

      // Build context from responses
      const responsesSummary = Object.entries(input.responses)
        .filter(([_, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => {
          if (typeof value === 'boolean') {
            return `• ${key}: ${value ? 'Sí' : 'No'}`;
          }
          return `• ${value}`;
        })
        .join('\n');

      // Get completed and partial dimensions
      const completedDimensions = input.dimensions.filter(d => d.status === 'complete');
      const partialDimensions = input.dimensions.filter(d => d.status === 'partial');
      const strongestDimensions = [...input.dimensions].sort((a, b) => b.score - a.score).slice(0, 3);

      const systemPrompt = `Eres un analista de contexto empresarial. Tu trabajo es sintetizar EXACTAMENTE lo que el usuario dijo, sin inventar ni asumir nada.

REGLA DE ORO: Solo menciona lo que REALMENTE se dijo. Si algo no se mencionó, NO lo incluyas.

PROHIBIDO:
❌ Inventar datos que no se proporcionaron ("recursos limitados" si no lo dijo)
❌ Obviedades vacías ("cada contratación cuenta", "la cultura es importante")
❌ Frases de relleno empático ("estás en un punto de inflexión...")
❌ Asumir emociones o preocupaciones no expresadas
❌ Generalidades que aplican a cualquier empresa

OBLIGATORIO:
✅ Citar o parafrasear datos CONCRETOS que el usuario proporcionó
✅ Ser específico: nombres, números, roles, características mencionadas
✅ Ser honesto: si falta información, decirlo claramente
✅ Ir al grano: qué sabemos, qué decisión enfrenta, qué necesitamos

FORMATO DE RESPUESTA (JSON exacto):
{
  "headline": "La decisión en sus propias palabras (extraída del input, no inventada)",
  "companyProfile": "Lo que SÉ de tu empresa/situación basado en lo que dijiste: [solo datos mencionados]",
  "decisionContext": "La decisión que enfrentas: [parafrasear lo que dijo]",
  "dataPoints": [
    "Dato concreto 1 que mencionaste",
    "Dato concreto 2 que proporcionaste"
  ],
  "missingForExperts": "Para que los expertos te ayuden mejor, sería útil saber: [qué información específica falta]",
  "readyMessage": "Con esta información podemos empezar. Los expertos analizarán [el tema concreto]."
}

EJEMPLOS:

Si el usuario dice: "Quiero contratar más vendedores pero manteniendo nuestra cultura de startup"

✅ BIEN:
{
  "headline": "Contratar vendedores manteniendo la cultura de startup",
  "companyProfile": "Sé que eres una startup que quiere crecer en ventas y valora su cultura actual.",
  "decisionContext": "Buscas expandir tu equipo comercial sin perder la esencia que os hace diferentes.",
  "dataPoints": [
    "Quieres contratar en el área de ventas",
    "Tu cultura de startup es algo que quieres preservar"
  ],
  "missingForExperts": "¿Cuántas personas tienes actualmente en ventas? ¿Qué define tu cultura (valores, forma de trabajar)? ¿Qué perfil de vendedor buscas?",
  "readyMessage": "Con esta información podemos empezar. Los expertos analizarán cómo escalar ventas preservando cultura."
}

❌ MAL (inventando):
{
  "headline": "Escalar sin perder la esencia",
  "companyProfile": "Estás en un momento de crecimiento con recursos limitados", // ← NO DIJO ESTO
  "dataPoints": [
    "Cada contratación es crítica", // ← OBVIO, NO APORTA
    "La cultura es tu prioridad" // ← NO LO DIJO ASÍ
  ]
}`;

      const userPrompt = `PREGUNTA/DECISIÓN DEL USUARIO:
"${input.question}"

${input.context ? `CONTEXTO ADICIONAL:
${input.context}

` : ''}INFORMACIÓN PROPORCIONADA POR EL USUARIO:
${responsesSummary || 'Sin respuestas adicionales'}

DIMENSIONES MEJOR CUBIERTAS:
${strongestDimensions.map(d => `- ${d.name}: ${d.score}%`).join('\n')}

RESUMEN DEL ANÁLISIS:
${input.summary}

PUNTUACIÓN GENERAL: ${input.overallScore}%

Genera el JSON con el resumen memorable.`;

      try {
        const response = await aiClient.generate(userPrompt, {
          systemPrompt,
          modelId: "gemini-2.0-flash-exp",
          temperature: 0.3, // Bajo para ser fiel a los datos
          maxTokens: 1000,
        });

        console.log("[Memorable Summary] AI response received, parsing JSON...");

        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("[Memorable Summary] No JSON found in AI response");
          throw new Error("No JSON found in AI response");
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate and map to new structure
        const result = {
          headline: parsed.headline || input.question.substring(0, 60),
          companyProfile: parsed.companyProfile || "",
          decisionContext: parsed.decisionContext || "",
          dataPoints: Array.isArray(parsed.dataPoints) ? parsed.dataPoints.slice(0, 5) : [],
          missingForExperts: parsed.missingForExperts || "",
          readyMessage: parsed.readyMessage || "Los expertos analizarán tu situación.",
          score: input.overallScore,
        };

        console.log("[Memorable Summary] Generated successfully:", {
          headline: result.headline,
          dataPointsCount: result.dataPoints.length,
          hasMissing: !!result.missingForExperts,
        });

        return result;
      } catch (error) {
        console.error("[Memorable Summary] AI failed, using fallback:", error);

        // Fallback: extract what we can directly from the input
        return {
          headline: input.question.length > 60
            ? `${input.question.substring(0, 60)}...`
            : input.question,
          companyProfile: "Basándome en lo que compartiste:",
          decisionContext: input.question,
          dataPoints: Object.entries(input.responses)
            .filter(([_, v]) => v && typeof v === 'string' && v.length > 0)
            .slice(0, 4)
            .map(([_, v]) => String(v)),
          missingForExperts: "",
          readyMessage: "Tu contexto está listo. Los expertos pueden comenzar el análisis.",
          score: input.overallScore,
        };
      }
    }),

  /**
   * Generate Follow-Up Question: When user gives a short answer, probe deeper
   * This enables "adaptive depth" - getting more detail when needed
   */
  generateFollowUp: protectedProcedure
    .input(z.object({
      shortAnswer: z.string(),
      originalQuestion: z.string(),
      detectedDomain: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const domain = (input.detectedDomain || 'general') as BusinessDomain;
      const followUp = generateFollowUpQuestion(
        input.shortAnswer,
        input.originalQuestion,
        domain
      );

      return {
        needsFollowUp: followUp !== null,
        followUpQuestion: followUp,
        reason: followUp ? `Tu respuesta "${input.shortAnswer}" es un poco breve. Para darte mejores recomendaciones...` : null,
      };
    }),

  /**
   * Check Inconsistencies: Detect conflicts in user-provided data
   * Enables "challenge mode" to clarify contradictions
   */
  checkInconsistencies: protectedProcedure
    .input(z.object({
      data: z.record(z.string()),
    }))
    .mutation(({ input }) => {
      const inconsistencies = findInconsistencies(input.data);

      return {
        hasInconsistencies: inconsistencies.length > 0,
        inconsistencies,
      };
    }),

  /**
   * ITERATIVE CONTEXT GATHERING
   * Main entry point for the iterative flow that keeps asking until context is sufficient
   * Returns: next action to take (ask_question, challenge_inconsistency, request_depth, ready)
   */
  getNextAction: protectedProcedure
    .input(z.object({
      question: z.string().min(10),
      currentResponses: z.record(z.union([z.string(), z.boolean()])),
      previousAssessment: contextAssessmentSchema.optional(),
      lastAnswer: z.string().optional(), // The most recent answer from user
      lastQuestionAsked: z.string().optional(), // What we asked
      iterationCount: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const MAX_ITERATIONS = 10; // Safety limit to avoid infinite loops
      const TARGET_SCORE = 85;

      // If we've hit max iterations, force ready
      if (input.iterationCount >= MAX_ITERATIONS) {
        return {
          action: 'ready' as const,
          message: 'Tenemos suficiente contexto para comenzar. Los expertos trabajarán con la información disponible.',
          score: input.previousAssessment?.overallScore || 70,
          iterationCount: input.iterationCount,
        };
      }

      // Detect domain from original question
      const domain = detectBusinessDomain(input.question);
      const domainQuestions = DOMAIN_QUESTIONS[domain];

      // 1. CHECK FOR SHORT ANSWER (Adaptive Depth)
      if (input.lastAnswer && input.lastQuestionAsked) {
        const isShortAnswer = input.lastAnswer.length < 30;
        const isYesNo = /^(sí|si|no|yes|maybe|quizás|tal vez)$/i.test(input.lastAnswer.trim());

        if (isShortAnswer && !isYesNo) {
          const followUp = generateFollowUpQuestion(input.lastAnswer, input.lastQuestionAsked, domain);
          if (followUp) {
            return {
              action: 'request_depth' as const,
              message: `Tu respuesta es un poco breve. ${followUp}`,
              followUpQuestion: followUp,
              score: input.previousAssessment?.overallScore || 50,
              iterationCount: input.iterationCount,
              reflection: `Entiendo: "${input.lastAnswer}". Pero necesito más detalle...`,
            };
          }
        }
      }

      // 2. CHECK FOR INCONSISTENCIES
      const stringResponses: Record<string, string> = {};
      for (const [k, v] of Object.entries(input.currentResponses)) {
        if (typeof v === 'string') stringResponses[k] = v;
      }
      const inconsistencies = findInconsistencies(stringResponses);

      if (inconsistencies.length > 0) {
        const firstInconsistency = inconsistencies[0];
        return {
          action: 'challenge_inconsistency' as const,
          message: `He detectado algo que me gustaría clarificar: ${firstInconsistency.issue}`,
          inconsistency: firstInconsistency,
          score: input.previousAssessment?.overallScore || 50,
          iterationCount: input.iterationCount,
        };
      }

      // 3. CHECK SCORE - If sufficient, we're ready
      if (input.previousAssessment && input.previousAssessment.overallScore >= TARGET_SCORE) {
        return {
          action: 'ready' as const,
          message: '¡Excelente! Tengo suficiente contexto para que los expertos te ayuden.',
          score: input.previousAssessment.overallScore,
          iterationCount: input.iterationCount,
        };
      }

      // 4. FIND NEXT QUESTION TO ASK
      // Prioritize: critical questions > important questions > domain-specific

      // Get questions not yet answered
      const answeredKeys = new Set(Object.keys(input.currentResponses));

      // First try domain-specific critical questions
      const unansweredCritical = domainQuestions.critical.filter((q, i) =>
        !answeredKeys.has(`domain-critical-${i}`)
      );

      if (unansweredCritical.length > 0) {
        const nextQ = unansweredCritical[0];
        return {
          action: 'ask_question' as const,
          message: nextQ.question,
          questionId: `domain-critical-${domainQuestions.critical.indexOf(nextQ)}`,
          priority: 'critical' as const,
          reason: nextQ.why,
          score: input.previousAssessment?.overallScore || 30,
          iterationCount: input.iterationCount,
          reflection: generateReflectionFromResponses(input.currentResponses, domain),
        };
      }

      // Then try important questions
      const unansweredImportant = domainQuestions.important.filter((q, i) =>
        !answeredKeys.has(`domain-important-${i}`)
      );

      if (unansweredImportant.length > 0) {
        const nextQ = unansweredImportant[0];
        return {
          action: 'ask_question' as const,
          message: nextQ.question,
          questionId: `domain-important-${domainQuestions.important.indexOf(nextQ)}`,
          priority: 'important' as const,
          reason: nextQ.why,
          score: input.previousAssessment?.overallScore || 50,
          iterationCount: input.iterationCount,
          reflection: generateReflectionFromResponses(input.currentResponses, domain),
        };
      }

      // 5. NO MORE QUESTIONS - Calculate final score and decide
      // If we've asked all domain questions but score is still low, we proceed anyway
      const finalScore = Math.min(85, (input.previousAssessment?.overallScore || 60) + 10);

      return {
        action: 'ready' as const,
        message: 'Tenemos buen contexto. Los expertos pueden comenzar el análisis.',
        score: finalScore,
        iterationCount: input.iterationCount,
      };
    }),
});

// Helper: Generate reflection from accumulated responses
function generateReflectionFromResponses(
  responses: Record<string, string | boolean>,
  domain: BusinessDomain
): string {
  const stringResponses = Object.entries(responses)
    .filter(([_, v]) => typeof v === 'string' && v.length > 0)
    .map(([_, v]) => v as string);

  if (stringResponses.length === 0) {
    return '';
  }

  // Take last 2-3 responses to build reflection
  const recent = stringResponses.slice(-3);
  const summary = recent.map(r => r.length > 50 ? r.substring(0, 50) + '...' : r).join('. ');

  return `Hasta ahora entiendo: ${summary}`;
}
