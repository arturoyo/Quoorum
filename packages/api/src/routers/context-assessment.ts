import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { getAIClient } from "@quoorum/ai";
import { logger } from "../lib/logger";
import { trackAICall } from "@quoorum/quoorum/ai-cost-tracking";

// Import schemas and constants from context-assessment module
import {
  contextDimensionSchema,
  contextAssumptionSchema,
  clarifyingQuestionSchema,
  contextAssessmentSchema,
  contextAnswersSchema,
} from "./context-assessment/schemas";
import {
  DIMENSION_TEMPLATES,
  DOMAIN_PATTERNS,
  DOMAIN_QUESTIONS,
  type BusinessDomain,
} from "./context-assessment/constants";

/**
 * Context Assessment Router
 *
 * Uses AI to analyze user input before starting a debate,
 * helping users provide better context for more valuable AI expert discussions.
 *
 * Schemas and constants imported from ./context-assessment/
 */

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
    logger.error("[Context Assessment] AI detection failed, using general:", error instanceof Error ? error : undefined, { error: String(error) });
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
  userId: string,
  businessDomain?: BusinessDomain
): Promise<z.infer<typeof aiAnalysisSchema> & { reflection?: string; domain?: BusinessDomain }> {
  const aiClient = getAIClient();
  const startTime = Date.now();

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
[OK] ASSUMPTION yes_no: {"assumption": "Tienes equipo técnico interno", "questionType": "yes_no", "alternatives": []}
[OK] ASSUMPTION multiple_choice: {"assumption": "Presupuesto <50k USD", "questionType": "multiple_choice", "alternatives": ["<50k", "50-200k", ">200k"]}
[OK] QUESTION yes_no: {"question": "¿Ya tienes producto en el mercado?", "questionType": "yes_no"}
[OK] QUESTION multiple_choice: {"question": "¿Cuántos usuarios tienes?", "questionType": "multiple_choice", "options": ["0-100", "100-1000", ">1000"]}
[OK] QUESTION free_text: {"question": "Describe tu propuesta de valor única", "questionType": "free_text"}

[ERROR] MALO: Todas las preguntas son multiple_choice con 3 opciones (patrón rígido)
[OK] BUENO: Mezcla inteligente de yes_no, multiple_choice y free_text según lo que maximice contexto
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

    // Track AI cost
    void trackAICall({
      userId,
      operationType: 'context_assessment',
      provider: 'google',
      modelId: 'gemini-2.0-flash-exp',
      promptTokens: response.usage?.promptTokens || 0,
      completionTokens: response.usage?.completionTokens || 0,
      latencyMs: Date.now() - startTime,
      success: true,
      inputSummary: userInput.substring(0, 500),
      outputSummary: response.text.substring(0, 500),
    });

    logger.info("[Context Assessment] AI response received, parsing JSON...");

    // Parse and validate the response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error("[Context Assessment] No JSON found in AI response, using fallback");
      throw new Error("No JSON found in AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = aiAnalysisSchema.parse(parsed);

    logger.info("[Context Assessment] AI analysis successful:", {
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
    // Track failed AI call
    void trackAICall({
      userId,
      operationType: 'context_assessment',
      provider: 'google',
      modelId: 'gemini-2.0-flash-exp',
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: Date.now() - startTime,
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
      inputSummary: userInput.substring(0, 500),
    });

    logger.error("[Context Assessment] AI analysis failed, using fallback:", error instanceof Error ? error : undefined, { error: error instanceof Error ? error.message : String(error) });
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
    .mutation(async ({ input, ctx }) => {
      // Auto-detectar categoría SIEMPRE (ignorar lo que mande el usuario)
      const debateType = await detectDebateType(input.userInput);
      const dimensions = DIMENSION_TEMPLATES[debateType] ?? DIMENSION_TEMPLATES.general ?? [];

      logger.info("[Context Assessment] Auto-detected debate type:", { debateType });

      // Use AI for analysis
      const aiResult = await analyzeWithAI(input.userInput, debateType, dimensions, ctx.userId);

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
    .mutation(async ({ input, ctx }) => {
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

        logger.info("[Context Assessment - Refine] AI response received, parsing JSON...");

        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          logger.error("[Context Assessment - Refine] No JSON found, using fallback");
          throw new Error("No JSON found in AI response");
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const aiResult = aiAnalysisSchema.parse(parsed);

        logger.info("[Context Assessment - Refine] AI analysis successful:", {
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
        logger.error("[Context Assessment - Refine] AI failed, using fallback:", error instanceof Error ? error : undefined, { error: String(error) });
        // Fallback: usar analyze normal
        const aiResult = await analyzeWithAI(enhancedInput, debateType, dimensions, ctx.userId);

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
    .mutation(async ({ ctx, input }) => {
      const { performAutoResearch } = await import("../lib/auto-research");
      const { hasSufficientCredits, deductCredits, refundCredits, convertUsdToCredits } = await import('@quoorum/quoorum/billing/credit-transactions');

      // ============================================================================
      // COSTO DE BÚSQUEDA EN INTERNET
      // ============================================================================
      // Serper API: ~$0.005 por búsqueda (promedio)
      // Con multiplicador de servicio 1.75x: $0.005 × 1.75 = $0.00875
      // Créditos: ⌈($0.00875) / 0.01⌉ = ⌈0.875⌉ = 1 crédito por búsqueda
      // ============================================================================
      const INTERNET_SEARCH_COST_USD = 0.005; // Costo real de Serper API
      const INTERNET_SEARCH_CREDITS = convertUsdToCredits(INTERNET_SEARCH_COST_USD); // 1 crédito

      const userId = ctx.userId;

      // Verificar créditos suficientes ANTES de buscar
      const hasCredits = await hasSufficientCredits(userId, INTERNET_SEARCH_CREDITS);
      if (!hasCredits) {
        // Obtener balance actual para mostrar información útil al usuario
        const { getCreditBalance } = await import('@quoorum/quoorum/billing/credit-transactions');
        const currentBalance = await getCreditBalance(userId) ?? 0;
        
        logger.warn('[Auto-Research] Insufficient credits', {
          userId,
          required: INTERNET_SEARCH_CREDITS,
          current: currentBalance,
          shortfall: INTERNET_SEARCH_CREDITS - currentBalance,
        });
        
        // PAYMENT_REQUIRED es un código válido en tRPC v11 (mapea a HTTP 402)
        throw new TRPCError({
          code: 'PAYMENT_REQUIRED',
          message: `Créditos insuficientes para búsqueda en internet. Se requieren ${INTERNET_SEARCH_CREDITS} créditos, pero tienes ${currentBalance}.`,
          cause: {
            required: INTERNET_SEARCH_CREDITS,
            current: currentBalance,
            shortfall: INTERNET_SEARCH_CREDITS - currentBalance,
            action: 'Recarga créditos o continúa sin búsqueda en internet',
          },
        });
      }

      // Deduct credits atomically BEFORE performing search
      const deductionResult = await deductCredits(
        userId,
        INTERNET_SEARCH_CREDITS,
        undefined, // No debateId for internet search
        'debate_creation', // Source: internet search during debate creation
        'Internet search for context enrichment'
      );
      if (!deductionResult.success) {
        logger.error('[Auto-Research] Credit deduction failed', {
          userId,
          credits: INTERNET_SEARCH_CREDITS,
          error: deductionResult.error,
        });
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al procesar el pago de créditos',
          cause: {
            error: deductionResult.error || 'Error desconocido al deducir créditos',
            credits: INTERNET_SEARCH_CREDITS,
          },
        });
      }

      logger.info('[Auto-Research] Credits deducted', {
        userId,
        credits: INTERNET_SEARCH_CREDITS,
        costUsd: INTERNET_SEARCH_COST_USD,
        remainingCredits: deductionResult.remainingCredits,
      });

      // Add domain context to improve search queries
      const domain = input.detectedDomain || detectBusinessDomain(input.question);

      // Pasar el dominio directamente para generar queries contextuales más inteligentes
      // Ya no usamos prefixes - el sistema de generación de queries ahora analiza
      // la pregunta y genera queries específicas basadas en el dominio
      try {
        const result = await performAutoResearch(input.question, userId, {
          maxResults: 5,
          domain, // Pasar el dominio detectado para queries más específicas
        });
        
        // Si la búsqueda fue exitosa, retornar resultado
        return {
          ...result,
          detectedDomain: domain, // Include domain in response
          creditsUsed: INTERNET_SEARCH_CREDITS, // Informar al usuario cuántos créditos se usaron
          costUsd: INTERNET_SEARCH_COST_USD,
        };
      } catch (error) {
        // Si falla la búsqueda, REFUND los créditos
        logger.error("[Auto-Research] Failed, refunding credits:", error instanceof Error ? error : undefined, { 
          error: String(error),
          userId,
          creditsToRefund: INTERNET_SEARCH_CREDITS,
        });

        const refundResult = await refundCredits(
          userId,
          INTERNET_SEARCH_CREDITS,
          undefined, // No debateId
          'refund',
          'Búsqueda en internet falló'
        );
        if (!refundResult.success) {
          logger.error('[Auto-Research] Failed to refund credits after search failure', {
            userId,
            credits: INTERNET_SEARCH_CREDITS,
            refundError: refundResult.error,
          });
        }

        return {
          question: input.question,
          researchResults: [],
          suggestedContext: {},
          executionTimeMs: 0,
          detectedDomain: domain,
          creditsUsed: 0, // No se usaron créditos porque falló
          costUsd: 0,
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
      const { findSimilarDebates } = await import("../lib/auto-research");

      try {
        const debates = await findSimilarDebates(input.question, input.limit);
        return debates;
      } catch (error) {
        logger.error("[Similar Debates] Failed:", error instanceof Error ? error : undefined, { error: String(error) });
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
      const { generateCoachingSuggestions } = await import("../lib/auto-research");

      try {
        const suggestions = await generateCoachingSuggestions(
          input.question,
          input.currentContext,
          input.missingDimensions
        );
        return suggestions;
      } catch (error) {
        logger.error("[Coaching] Failed:", error instanceof Error ? error : undefined, { error: String(error) });
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
      const { generateDebatePreview } = await import("../lib/debate-preview");

      try {
        const preview = await generateDebatePreview(
          input.question,
          input.context,
          input.dimensions
        );
        return preview;
      } catch (error) {
        logger.error("[Debate Preview] Failed:", error instanceof Error ? error : undefined, { error: String(error) });
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
      const { benchmarkContextQuality } = await import("../lib/quality-benchmark");

      try {
        const benchmark = await benchmarkContextQuality(
          input.overallScore,
          input.dimensions
        );
        return benchmark;
      } catch (error) {
        logger.error("[Quality Benchmark] Failed:", error instanceof Error ? error : undefined, { error: String(error) });
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
      const { createSnapshot } = await import("../lib/context-snapshots");

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
        logger.error("[Snapshot Save] Failed:", error instanceof Error ? error : undefined, { error: String(error) });
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
      const { listSnapshots } = await import("../lib/context-snapshots");

      try {
        const snapshots = listSnapshots(input.questionFilter);
        return snapshots;
      } catch (error) {
        logger.error("[Snapshot List] Failed:", error instanceof Error ? error : undefined, { error: String(error) });
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
      const { getSnapshot } = await import("../lib/context-snapshots");

      try {
        const snapshot = getSnapshot(input.snapshotId);
        if (!snapshot) {
          throw new Error("Snapshot not found");
        }
        return snapshot;
      } catch (error) {
        logger.error("[Snapshot Restore] Failed:", error instanceof Error ? error : undefined, { error: String(error) });
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
      const { deleteSnapshot } = await import("../lib/context-snapshots");

      try {
        const success = deleteSnapshot(input.snapshotId);
        return { success };
      } catch (error) {
        logger.error("[Snapshot Delete] Failed:", error instanceof Error ? error : undefined, { error: String(error) });
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
    .mutation(async ({ input, ctx }) => {
      const aiClient = getAIClient();
      const startTime = Date.now();

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
[ERROR] Inventar datos que no se proporcionaron ("recursos limitados" si no lo dijo)
[ERROR] Obviedades vacías ("cada contratación cuenta", "la cultura es importante")
[ERROR] Frases de relleno empático ("estás en un punto de inflexión...")
[ERROR] Asumir emociones o preocupaciones no expresadas
[ERROR] Generalidades que aplican a cualquier empresa

OBLIGATORIO:
[OK] Citar o parafrasear datos CONCRETOS que el usuario proporcionó
[OK] Ser específico: nombres, números, roles, características mencionadas
[OK] Ser honesto: si falta información, decirlo claramente
[OK] Ir al grano: qué sabemos, qué decisión enfrenta, qué necesitamos

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

[OK] BIEN:
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

[ERROR] MAL (inventando):
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

        // Track AI cost
        void trackAICall({
          userId: ctx.userId,
          operationType: 'memorable_summary',
          provider: 'google',
          modelId: 'gemini-2.0-flash-exp',
          promptTokens: response.usage?.promptTokens || 0,
          completionTokens: response.usage?.completionTokens || 0,
          latencyMs: Date.now() - startTime,
          success: true,
          inputSummary: input.question.substring(0, 500),
          outputSummary: response.text.substring(0, 500),
        });

        logger.info("[Memorable Summary] AI response received, parsing JSON...");

        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          logger.error("[Memorable Summary] No JSON found in AI response");
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

        logger.info("[Memorable Summary] Generated successfully:", {
          headline: result.headline,
          dataPointsCount: result.dataPoints.length,
          hasMissing: !!result.missingForExperts,
        });

        return result;
      } catch (error) {
        // Track failed AI call
        void trackAICall({
          userId: ctx.userId,
          operationType: 'memorable_summary',
          provider: 'google',
          modelId: 'gemini-2.0-flash-exp',
          promptTokens: 0,
          completionTokens: 0,
          latencyMs: Date.now() - startTime,
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          inputSummary: input.question.substring(0, 500),
        });

        logger.error("[Memorable Summary] AI failed, using fallback:", error instanceof Error ? error : undefined, { error: String(error) });

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
