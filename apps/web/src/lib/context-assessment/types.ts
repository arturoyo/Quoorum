/**
 * Context Readiness Assessment Types
 *
 * This module defines the types for the pre-debate context evaluation system.
 * The goal is to help users provide better context before starting a debate,
 * improving the quality of AI expert responses.
 */

export interface ContextDimension {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1, how important this dimension is
  score: number; // 0-100, how complete this dimension is
  status: 'missing' | 'partial' | 'complete';
  suggestions: string[]; // What to add to improve this dimension
}

export interface ContextAssumption {
  id: string;
  dimension: string;
  assumption: string; // What the system assumes
  confidence: number; // 0-1, how confident the system is
  confirmed: boolean | null; // null = not yet confirmed, true/false = user response
  alternatives?: string[]; // If user says no, what are the options
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  dimension: string;
  priority: 'critical' | 'important' | 'nice-to-have';
  multipleChoice?: {
    options: string[];
    allowMultiple: boolean;
  };
  freeText?: boolean;
  dependsOn?: string; // ID of another question that must be answered first
}

export interface ContextAssessment {
  overallScore: number; // 0-100
  readinessLevel: 'insufficient' | 'basic' | 'good' | 'excellent';
  dimensions: ContextDimension[];
  assumptions: ContextAssumption[];
  clarifyingQuestions: ClarifyingQuestion[];
  summary: string;
  recommendedAction: 'proceed' | 'clarify' | 'refine';
}

export interface ContextAnswers {
  assumptionResponses: Record<string, boolean>; // assumptionId -> confirmed
  questionResponses: Record<string, string | string[]>; // questionId -> answer
  additionalContext?: string;
}

// Dimension templates for different debate types
export const DIMENSION_TEMPLATES: Record<string, Partial<ContextDimension>[]> = {
  business_decision: [
    { id: 'objective', name: 'Objetivo', description: 'Qué quieres lograr', weight: 0.2 },
    { id: 'constraints', name: 'Restricciones', description: 'Presupuesto, tiempo, recursos', weight: 0.15 },
    { id: 'stakeholders', name: 'Stakeholders', description: 'Quién está involucrado o afectado', weight: 0.1 },
    { id: 'context', name: 'Contexto', description: 'Situación actual, antecedentes', weight: 0.15 },
    { id: 'options', name: 'Opciones', description: 'Alternativas que consideras', weight: 0.15 },
    { id: 'criteria', name: 'Criterios', description: 'Cómo medirás el éxito', weight: 0.1 },
    { id: 'risks', name: 'Riesgos', description: 'Qué podría salir mal', weight: 0.1 },
    { id: 'timeline', name: 'Timeline', description: 'Plazos y urgencia', weight: 0.05 },
  ],
  strategy: [
    { id: 'vision', name: 'Visión', description: 'Hacia dónde quieres ir', weight: 0.2 },
    { id: 'current_state', name: 'Estado Actual', description: 'Dónde estás ahora', weight: 0.15 },
    { id: 'market', name: 'Mercado', description: 'Competencia, tendencias', weight: 0.15 },
    { id: 'resources', name: 'Recursos', description: 'Qué tienes disponible', weight: 0.15 },
    { id: 'differentiators', name: 'Diferenciadores', description: 'Tu ventaja competitiva', weight: 0.15 },
    { id: 'risks', name: 'Riesgos', description: 'Amenazas y debilidades', weight: 0.1 },
    { id: 'timeline', name: 'Horizonte', description: 'Corto, medio, largo plazo', weight: 0.1 },
  ],
  product: [
    { id: 'problem', name: 'Problema', description: 'Qué problema resuelves', weight: 0.2 },
    { id: 'user', name: 'Usuario', description: 'Para quién es', weight: 0.2 },
    { id: 'solution', name: 'Solución', description: 'Cómo lo resuelves', weight: 0.15 },
    { id: 'market', name: 'Mercado', description: 'Tamaño, competencia', weight: 0.15 },
    { id: 'mvp', name: 'MVP', description: 'Versión mínima viable', weight: 0.1 },
    { id: 'metrics', name: 'Métricas', description: 'Cómo mides éxito', weight: 0.1 },
    { id: 'resources', name: 'Recursos', description: 'Equipo, presupuesto', weight: 0.1 },
  ],
  general: [
    { id: 'objective', name: 'Objetivo', description: 'Qué quieres lograr', weight: 0.25 },
    { id: 'context', name: 'Contexto', description: 'Situación y antecedentes', weight: 0.25 },
    { id: 'constraints', name: 'Restricciones', description: 'Limitaciones a considerar', weight: 0.2 },
    { id: 'options', name: 'Opciones', description: 'Alternativas posibles', weight: 0.15 },
    { id: 'criteria', name: 'Criterios', description: 'Cómo evaluar resultados', weight: 0.15 },
  ],
};

export function getReadinessLevel(score: number): ContextAssessment['readinessLevel'] {
  if (score < 30) return 'insufficient';
  if (score < 50) return 'basic';
  if (score < 75) return 'good';
  return 'excellent';
}

export function getRecommendedAction(score: number, criticalMissing: boolean): ContextAssessment['recommendedAction'] {
  if (criticalMissing) return 'clarify';
  if (score < 40) return 'refine';
  if (score < 60) return 'clarify';
  return 'proceed';
}
