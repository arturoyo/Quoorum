/**
 * Context Assessment - Constants
 *
 * Domain patterns, dimension templates, and domain-specific question banks.
 */

// ============================================
// DIMENSION TEMPLATES
// ============================================

export const DIMENSION_TEMPLATES: Record<string, { id: string; name: string; description: string; weight: number }[]> = {
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
// BUSINESS DOMAIN TYPES
// ============================================

export type BusinessDomain =
  | 'hiring' | 'firing' | 'team'
  | 'pricing' | 'revenue' | 'costs'
  | 'product_launch' | 'product_pivot' | 'features'
  | 'fundraising' | 'investment' | 'exit'
  | 'growth' | 'marketing' | 'sales'
  | 'partnerships' | 'acquisitions'
  | 'operations' | 'processes'
  | 'culture' | 'leadership'
  | 'general';

// ============================================
// DOMAIN DETECTION PATTERNS
// ============================================

export const DOMAIN_PATTERNS: Record<BusinessDomain, { keywords: string[]; phrases: string[] }> = {
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

// ============================================
// DOMAIN-SPECIFIC QUESTION BANKS
// ============================================

export const DOMAIN_QUESTIONS: Record<BusinessDomain, {
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
