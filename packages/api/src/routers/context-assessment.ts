import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
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
  if (score < 30) return "insufficient";
  if (score < 50) return "basic";
  if (score < 75) return "good";
  return "excellent";
}

function getRecommendedAction(score: number, criticalMissing: boolean): "proceed" | "clarify" | "refine" {
  if (criticalMissing) return "clarify";
  if (score < 40) return "refine";
  if (score < 60) return "clarify";
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

// AI-powered analysis function
async function analyzeWithAI(
  userInput: string,
  debateType: string,
  dimensions: { id: string; name: string; description: string; weight: number }[]
): Promise<z.infer<typeof aiAnalysisSchema>> {
  const aiClient = getAIClient();

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

Criterios de puntuación (sé GENEROSO con contexto rico):
- 0-20: No se menciona nada sobre esta dimensión
- 21-40: Se menciona brevemente pero falta detalle crítico
- 41-60: Información parcial pero útil, podría ampliarse
- 61-80: Información buena y suficiente para empezar, algunos detalles faltan
- 81-100: Información completa, exhaustiva y detallada

REGLAS PARA ASSUMPTIONS (globos sonda inteligentes):
- Genera 3-5 assumptions variando los tipos de pregunta
- Deben ser suposiciones INTELIGENTES basadas en lo que el usuario escribió
- Ejemplo: Si menciona "startup SaaS", asumir "modelo de suscripción mensual", no "tienes un negocio"
- Elige el tipo según la naturaleza de la suposición:
  * yes_no: "Asumo que tienes equipo técnico interno" → ¿Correcto? Sí/No
  * multiple_choice: "Asumo presupuesto <50k" → alternatives: ["<50k", "50-200k", ">200k"]
  * free_text: "Asumo competidores locales" → ¿Quiénes son exactamente?

REGLAS PARA QUESTIONS (varía el tipo inteligentemente):
- Genera 3-5 preguntas máximo, priorizando las MÁS impactantes
- NO preguntes lo obvio. Pregunta lo ESPECÍFICO.
- Elige el tipo que mejor capture la información:
  * yes_no para validaciones rápidas ("¿Tienes clientes actualmente?")
  * multiple_choice para rangos/categorías ("¿Cuántos clientes?" → ["0-10", "10-50", "50+"])
  * free_text para información única ("¿Cuál es tu propuesta de valor única?")
- Si el usuario ya mencionó algo, PROFUNDIZA en ello, no lo repitas
- Las preguntas con weight > 0.15 son "critical", el resto "important"

Ejemplos BUENOS de variedad:
✅ ASSUMPTION yes_no: {"assumption": "Tienes equipo técnico interno", "questionType": "yes_no", "alternatives": []}
✅ ASSUMPTION multiple_choice: {"assumption": "Presupuesto <50k USD", "questionType": "multiple_choice", "alternatives": ["<50k", "50-200k", ">200k"]}
✅ QUESTION yes_no: {"question": "¿Ya tienes producto en el mercado?", "questionType": "yes_no"}
✅ QUESTION multiple_choice: {"question": "¿Cuántos usuarios tienes?", "questionType": "multiple_choice", "options": ["0-100", "100-1000", ">1000"]}
✅ QUESTION free_text: {"question": "Describe tu propuesta de valor única", "questionType": "free_text"}

❌ MALO: Todas las preguntas son multiple_choice con 3 opciones (patrón rígido)
✅ BUENO: Mezcla inteligente de yes_no, multiple_choice y free_text según lo que maximice contexto`;

  const userPrompt = `Tipo de debate: ${debateType}

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
      questionsCount: validated.questions.length
    });

    return validated;
  } catch (error) {
    console.error("[Context Assessment] AI analysis failed, using fallback:", error instanceof Error ? error.message : error);
    // Fallback to keyword-based analysis if AI fails
    return fallbackAnalysis(userInput, dimensions);
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

        return {
          overallScore,
          readinessLevel: getReadinessLevel(overallScore),
          dimensions: analyzedDimensions,
          assumptions: [], // No más assumptions en refinamiento
          clarifyingQuestions: questions,
          summary: aiResult.summary,
          recommendedAction: getRecommendedAction(overallScore, false),
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
        };
      }
    }),
});
