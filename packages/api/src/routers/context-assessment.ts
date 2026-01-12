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
  confirmed: z.boolean().nullable(),
  alternatives: z.array(z.string()).optional(),
});

const clarifyingQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  dimension: z.string(),
  priority: z.enum(["critical", "important", "nice-to-have"]),
  multipleChoice: z
    .object({
      options: z.array(z.string()),
      allowMultiple: z.boolean(),
    })
    .optional(),
  freeText: z.boolean().optional(),
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
  assumptionResponses: z.record(z.string(), z.boolean()),
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
function detectDebateType(input: string): "business_decision" | "strategy" | "product" | "general" {
  const inputLower = input.toLowerCase();

  if (inputLower.includes("producto") || inputLower.includes("feature") ||
      inputLower.includes("mvp") || inputLower.includes("lanzar")) {
    return "product";
  }

  if (inputLower.includes("estrategia") || inputLower.includes("visión") ||
      inputLower.includes("largo plazo") || inputLower.includes("competencia")) {
    return "strategy";
  }

  if (inputLower.includes("decisión") || inputLower.includes("elegir") ||
      inputLower.includes("opción") || inputLower.includes("alternativa")) {
    return "business_decision";
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
    alternatives: z.array(z.string()),
  })),
  questions: z.array(z.object({
    question: z.string(),
    dimension: z.string(),
    priority: z.enum(["critical", "important", "nice-to-have"]),
    options: z.array(z.string()).optional(),
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

Debes responder SOLO con un JSON válido siguiendo exactamente este esquema:
{
  "dimensions": [
    {
      "id": "dimension_id",
      "score": 0-100,
      "extractedInfo": "información extraída o null",
      "suggestions": ["sugerencia 1", "sugerencia 2"]
    }
  ],
  "assumptions": [
    {
      "dimension": "dimension_id",
      "assumption": "asunción razonable basada en el contexto",
      "confidence": 0.0-1.0,
      "alternatives": ["alternativa 1", "alternativa 2"]
    }
  ],
  "questions": [
    {
      "question": "pregunta clarificadora",
      "dimension": "dimension_id",
      "priority": "critical|important|nice-to-have",
      "options": ["opción 1", "opción 2"] // opcional, solo para preguntas de opción múltiple
    }
  ],
  "summary": "resumen breve del estado del contexto"
}

Criterios de puntuación:
- 0-20: No se menciona nada sobre esta dimensión
- 21-40: Se menciona brevemente pero falta detalle
- 41-60: Información parcial, podría ampliarse
- 61-80: Información buena pero no exhaustiva
- 81-100: Información completa y detallada

Genera asunciones SOLO para dimensiones con score 30-60 (máximo 3).
Genera preguntas SOLO para dimensiones con score < 50 (máximo 4).
Las preguntas con weight > 0.15 son "critical", el resto "important".`;

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
      modelId: "gpt-4o-mini",
      temperature: 0.3,
      maxTokens: 2000,
    });

    // Parse and validate the response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return aiAnalysisSchema.parse(parsed);
  } catch (error) {
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
  const assumptions = partialDims.slice(0, 3).map((dim) => ({
    dimension: dim.id,
    assumption: ASSUMPTIONS[dim.id] || "Información general asumida",
    confidence: 0.6,
    alternatives: ALTERNATIVES[dim.id] || [],
  }));

  const missingDims = analyzedDimensions.filter((d) => d.score < 50);
  const questions = missingDims.slice(0, 4).map((dim) => {
    const template = dimensions.find((d) => d.id === dim.id);
    return {
      question: QUESTIONS[dim.id] || `¿Puedes dar más detalle sobre ${template?.name.toLowerCase() || dim.id}?`,
      dimension: dim.id,
      priority: ((template?.weight || 0) > 0.15 ? "critical" : "important") as "critical" | "important" | "nice-to-have",
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
      const debateType = input.debateType || detectDebateType(input.userInput);
      const dimensions = DIMENSION_TEMPLATES[debateType] ?? DIMENSION_TEMPLATES.general ?? [];

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
        assumption: a.assumption,
        confidence: a.confidence,
        confirmed: null,
        alternatives: a.alternatives,
      }));

      const questions = aiResult.questions.map((q, i) => ({
        id: `question-${i}`,
        question: q.question,
        dimension: q.dimension,
        priority: q.priority,
        multipleChoice: q.options ? { options: q.options, allowMultiple: false } : undefined,
        freeText: !q.options,
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
      // Build enhanced input with answers
      let enhancedInput = input.originalInput;

      // Add confirmed assumptions
      for (const [id, confirmed] of Object.entries(input.answers.assumptionResponses)) {
        const assumption = input.previousAssessment.assumptions.find((a) => a.id === id);
        if (assumption && confirmed) {
          enhancedInput += `\n[Confirmado: ${assumption.assumption}]`;
        }
      }

      // Add question responses
      for (const [id, response] of Object.entries(input.answers.questionResponses)) {
        const question = input.previousAssessment.clarifyingQuestions.find((q) => q.id === id);
        if (question && response) {
          const responseStr = Array.isArray(response) ? response.join(", ") : response;
          enhancedInput += `\n[${question.dimension}: ${responseStr}]`;
        }
      }

      // Add additional context
      if (input.answers.additionalContext) {
        enhancedInput += `\n[Contexto adicional: ${input.answers.additionalContext}]`;
      }

      const debateType = detectDebateType(enhancedInput);
      const dimensions = DIMENSION_TEMPLATES[debateType] ?? DIMENSION_TEMPLATES.general ?? [];

      // Use AI to re-analyze with enhanced input
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
      const stillMissing = aiResult.questions.filter((q) => q.priority !== "nice-to-have").slice(0, 2);
      const questions = stillMissing.map((q, i) => ({
        id: `refined-question-${i}`,
        question: q.question,
        dimension: q.dimension,
        priority: "nice-to-have" as const,
        freeText: true,
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
    }),
});
