/**
 * Context Analyzer Service
 *
 * Uses AI to analyze the user's input and assess context readiness.
 * Identifies missing information, makes assumptions, and generates clarifying questions.
 */

import type {
  ContextAssessment,
  ContextDimension,
  ContextAssumption,
  ClarifyingQuestion,
  ContextAnswers,
} from './types';
import {
  DIMENSION_TEMPLATES,
  getReadinessLevel,
  getRecommendedAction,
} from './types';

interface AnalyzeContextInput {
  userInput: string;
  debateType?: 'business_decision' | 'strategy' | 'product' | 'general';
  previousAnswers?: ContextAnswers;
}

interface AIAnalysisResult {
  detectedType: string;
  dimensions: {
    id: string;
    score: number;
    extractedInfo: string | null;
    missing: string[];
  }[];
  assumptions: {
    dimension: string;
    assumption: string;
    confidence: number;
    alternatives: string[];
  }[];
  questions: {
    question: string;
    dimension: string;
    priority: 'critical' | 'important' | 'nice-to-have';
    options?: string[];
  }[];
  summary: string;
}

// Simulated AI analysis - in production, this would call OpenAI/Claude
async function analyzeWithAI(input: string, template: string): Promise<AIAnalysisResult> {
  // This is a simplified version. In production, you'd call an LLM with a prompt like:
  // "Analyze this input for a ${template} context. Identify what information is present,
  // what's missing, make reasonable assumptions, and suggest clarifying questions."

  const dimensions = DIMENSION_TEMPLATES[template] || DIMENSION_TEMPLATES.general;

  // Simple heuristic analysis (replace with AI in production)
  const result: AIAnalysisResult = {
    detectedType: template,
    dimensions: [],
    assumptions: [],
    questions: [],
    summary: '',
  };

  const inputLower = input.toLowerCase();
  const templateDimensions = dimensions ?? [];

  // Analyze each dimension
  for (const dim of templateDimensions) {
    const dimResult = {
      id: dim.id!,
      score: 0,
      extractedInfo: null as string | null,
      missing: [] as string[],
    };

    // Simple keyword matching (replace with semantic analysis)
    const keywords: Record<string, string[]> = {
      objective: ['quiero', 'necesito', 'objetivo', 'meta', 'lograr', 'conseguir'],
      constraints: ['presupuesto', 'tiempo', 'límite', 'restricción', 'máximo', 'mínimo', '€', '$'],
      stakeholders: ['equipo', 'cliente', 'usuario', 'jefe', 'inversor', 'socio'],
      context: ['actualmente', 'situación', 'ahora', 'hasta ahora', 'historia'],
      options: ['opción', 'alternativa', 'podría', 'considero', 'entre'],
      criteria: ['éxito', 'medir', 'kpi', 'métrica', 'resultado'],
      risks: ['riesgo', 'problema', 'peligro', 'amenaza', 'podría fallar'],
      timeline: ['plazo', 'fecha', 'mes', 'semana', 'urgente', 'deadline'],
      vision: ['visión', 'futuro', 'aspiración', 'sueño', 'largo plazo'],
      current_state: ['actualmente', 'hoy', 'estado actual', 'situación'],
      market: ['mercado', 'competencia', 'competidor', 'industria', 'sector'],
      resources: ['recurso', 'equipo', 'dinero', 'talento', 'herramienta'],
      differentiators: ['diferencia', 'único', 'ventaja', 'mejor que'],
      problem: ['problema', 'dolor', 'necesidad', 'frustración'],
      user: ['usuario', 'cliente', 'persona', 'target', 'audiencia'],
      solution: ['solución', 'resolver', 'producto', 'servicio'],
      mvp: ['mvp', 'mínimo', 'primera versión', 'prototipo'],
      metrics: ['métrica', 'kpi', 'medir', 'tracking'],
    };

    const dimKeywords = keywords[dim.id!] || [];
    const foundKeywords = dimKeywords.filter(kw => inputLower.includes(kw));

    if (foundKeywords.length >= 2) {
      dimResult.score = 80;
      dimResult.extractedInfo = `Detectado: ${foundKeywords.join(', ')}`;
    } else if (foundKeywords.length === 1) {
      dimResult.score = 40;
      dimResult.extractedInfo = `Mencionado brevemente: ${foundKeywords[0]}`;
      dimResult.missing.push(`Más detalle sobre ${dim.name}`);
    } else {
      dimResult.score = 0;
      dimResult.missing.push(`No se menciona ${dim.name?.toLowerCase()}`);
    }

    result.dimensions.push(dimResult);
  }

  // Generate assumptions for dimensions with partial info
  const partialDimensions = result.dimensions.filter(d => d.score > 0 && d.score < 60);
  for (const dim of partialDimensions.slice(0, 3)) {
    result.assumptions.push({
      dimension: dim.id,
      assumption: generateAssumption(dim.id),
      confidence: 0.6,
      alternatives: generateAlternatives(dim.id),
    });
  }

  // Generate questions for missing dimensions
  const missingDimensions = result.dimensions.filter(d => d.score < 40);
  for (const dim of missingDimensions.slice(0, 4)) {
    const matchedTemplate = templateDimensions.find(d => d.id === dim.id);
    result.questions.push({
      question: generateQuestion(dim.id, matchedTemplate?.name || dim.id),
      dimension: dim.id,
      priority: (matchedTemplate?.weight || 0) > 0.15 ? 'critical' : 'important',
      options: generateOptions(dim.id),
    });
  }

  // Generate summary
  const avgScore = result.dimensions.reduce((sum, d) => sum + d.score, 0) / result.dimensions.length;
  result.summary = generateSummary(avgScore, result.dimensions.filter(d => d.score < 30).length);

  return result;
}

function generateAssumption(dimensionId: string): string {
  const assumptions: Record<string, string> = {
    objective: 'El objetivo es tomar una decisión informada sobre este tema',
    constraints: 'No hay restricciones de presupuesto críticas',
    stakeholders: 'La decisión la tomas tú o tu equipo directo',
    context: 'Es una situación relativamente nueva sin mucho histórico',
    options: 'Estás abierto a explorar múltiples alternativas',
    criteria: 'El éxito se mide principalmente en términos de resultados de negocio',
    risks: 'El riesgo principal es tomar la decisión incorrecta',
    timeline: 'No hay una urgencia crítica inmediata',
    market: 'Operas en un mercado competitivo estándar',
    resources: 'Tienes recursos limitados pero suficientes',
    user: 'Tu usuario es un profesional o empresa',
    problem: 'El problema es relevante y recurrente para tu audiencia',
  };
  return assumptions[dimensionId] || 'Información general asumida';
}

function generateAlternatives(dimensionId: string): string[] {
  const alternatives: Record<string, string[]> = {
    objective: ['Validar una idea', 'Tomar una decisión', 'Explorar opciones', 'Resolver un problema'],
    constraints: ['Presupuesto muy limitado', 'Sin límite de presupuesto', 'Restricciones de tiempo severas'],
    stakeholders: ['Solo yo', 'Equipo pequeño', 'Múltiples departamentos', 'Clientes externos'],
    timeline: ['Urgente (días)', 'Corto plazo (semanas)', 'Medio plazo (meses)', 'Sin prisa'],
    market: ['B2B', 'B2C', 'B2B2C', 'Marketplace'],
    user: ['Empresas grandes', 'PYMEs', 'Startups', 'Consumidores finales'],
  };
  return alternatives[dimensionId] || [];
}

function generateQuestion(dimensionId: string, dimensionName: string): string {
  const questions: Record<string, string> = {
    objective: '¿Cuál es el resultado específico que quieres lograr con esta decisión?',
    constraints: '¿Qué limitaciones tienes en términos de presupuesto, tiempo o recursos?',
    stakeholders: '¿Quiénes están involucrados o se verán afectados por esta decisión?',
    context: '¿Cuál es la situación actual? ¿Qué ha pasado hasta ahora?',
    options: '¿Qué alternativas has considerado hasta ahora?',
    criteria: '¿Cómo sabrás si la decisión fue exitosa? ¿Qué métricas importan?',
    risks: '¿Qué podría salir mal? ¿Cuáles son tus principales preocupaciones?',
    timeline: '¿Cuándo necesitas tomar esta decisión? ¿Hay algún deadline?',
    vision: '¿Cómo te imaginas el resultado ideal a largo plazo?',
    current_state: '¿Dónde estás ahora respecto a este tema?',
    market: '¿Quiénes son tus principales competidores? ¿Cómo es tu mercado?',
    resources: '¿Con qué equipo, presupuesto y herramientas cuentas?',
    problem: '¿Qué problema específico estás tratando de resolver?',
    user: '¿Quién es tu usuario o cliente ideal?',
    solution: '¿Cómo planeas resolver el problema?',
  };
  return questions[dimensionId] || `¿Puedes dar más detalle sobre ${dimensionName.toLowerCase()}?`;
}

function generateOptions(dimensionId: string): string[] | undefined {
  const options: Record<string, string[]> = {
    timeline: ['Urgente (esta semana)', '1-2 semanas', '1 mes', 'Sin prisa específica'],
    stakeholders: ['Solo yo', 'Mi equipo directo', 'Varios departamentos', 'Clientes/externos'],
    constraints: ['Presupuesto limitado', 'Tiempo limitado', 'Recursos limitados', 'Sin restricciones mayores'],
  };
  return options[dimensionId];
}

function generateSummary(avgScore: number, missingCount: number): string {
  if (avgScore >= 70) {
    return 'Tienes un contexto bastante completo. Los expertos podrán darte perspectivas valiosas.';
  } else if (avgScore >= 50) {
    return `Buen punto de partida. Hay ${missingCount} área(s) que podrías clarificar para mejores resultados.`;
  } else if (avgScore >= 30) {
    return `Contexto básico detectado. Te recomiendo añadir más detalle en ${missingCount} áreas clave.`;
  } else {
    return 'Necesito más contexto para que los expertos puedan ayudarte efectivamente.';
  }
}

export async function analyzeContext(input: AnalyzeContextInput): Promise<ContextAssessment> {
  const debateType = input.debateType || detectDebateType(input.userInput);
  const aiResult = await analyzeWithAI(input.userInput, debateType);

  // Convert AI result to ContextAssessment
  const templateList = DIMENSION_TEMPLATES[debateType] || DIMENSION_TEMPLATES.general || [];
  const dimensions: ContextDimension[] = aiResult.dimensions.map(d => {
    const template = templateList.find(t => t.id === d.id);

    return {
      id: d.id,
      name: template?.name || d.id,
      description: template?.description || '',
      weight: template?.weight || 0.1,
      score: d.score,
      status: d.score >= 70 ? 'complete' : d.score >= 30 ? 'partial' : 'missing',
      suggestions: d.missing,
    };
  });

  const assumptions: ContextAssumption[] = aiResult.assumptions.map((a, i) => ({
    id: `assumption-${i}`,
    dimension: a.dimension,
    assumption: a.assumption,
    confidence: a.confidence,
    confirmed: input.previousAnswers?.assumptionResponses?.[`assumption-${i}`] ?? null,
    alternatives: a.alternatives,
  }));

  const clarifyingQuestions: ClarifyingQuestion[] = aiResult.questions.map((q, i) => ({
    id: `question-${i}`,
    question: q.question,
    dimension: q.dimension,
    priority: q.priority,
    multipleChoice: q.options ? { options: q.options, allowMultiple: false } : undefined,
    freeText: !q.options,
  }));

  // Calculate overall score (weighted average)
  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
  const overallScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight
  );

  const hasCriticalMissing = clarifyingQuestions.some(q => q.priority === 'critical');

  return {
    overallScore,
    readinessLevel: getReadinessLevel(overallScore),
    dimensions,
    assumptions,
    clarifyingQuestions,
    summary: aiResult.summary,
    recommendedAction: getRecommendedAction(overallScore, hasCriticalMissing),
  };
}

export async function refineContext(
  originalInput: string,
  answers: ContextAnswers,
  previousAssessment: ContextAssessment
): Promise<ContextAssessment> {
  // Build enhanced input with answers
  let enhancedInput = originalInput;

  // Add confirmed assumptions
  for (const [id, confirmed] of Object.entries(answers.assumptionResponses)) {
    const assumption = previousAssessment.assumptions.find(a => a.id === id);
    if (assumption && confirmed) {
      enhancedInput += `\n[Confirmado: ${assumption.assumption}]`;
    }
  }

  // Add question responses
  for (const [id, response] of Object.entries(answers.questionResponses)) {
    const question = previousAssessment.clarifyingQuestions.find(q => q.id === id);
    if (question && response) {
      const responseStr = Array.isArray(response) ? response.join(', ') : response;
      enhancedInput += `\n[${question.dimension}: ${responseStr}]`;
    }
  }

  // Add additional context
  if (answers.additionalContext) {
    enhancedInput += `\n${answers.additionalContext}`;
  }

  // Re-analyze with enhanced input
  return analyzeContext({
    userInput: enhancedInput,
    previousAnswers: answers,
  });
}

function detectDebateType(input: string): 'business_decision' | 'strategy' | 'product' | 'general' {
  const inputLower = input.toLowerCase();

  if (inputLower.includes('producto') || inputLower.includes('feature') ||
      inputLower.includes('mvp') || inputLower.includes('lanzar')) {
    return 'product';
  }

  if (inputLower.includes('estrategia') || inputLower.includes('visión') ||
      inputLower.includes('largo plazo') || inputLower.includes('competencia')) {
    return 'strategy';
  }

  if (inputLower.includes('decisión') || inputLower.includes('elegir') ||
      inputLower.includes('opción') || inputLower.includes('alternativa')) {
    return 'business_decision';
  }

  return 'general';
}
