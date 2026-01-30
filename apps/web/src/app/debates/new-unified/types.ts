/**
 * Unified Debate Creation Types
 * 
 * Type definitions for the Typeform-style unified debate creation flow.
 */

/**
 * Unified phase type (1-5)
 */
export type UnifiedPhase = 1 | 2 | 3 | 4 | 5

/**
 * Phase names
 */
export type PhaseName = 'contexto' | 'expertos' | 'estrategia' | 'revision' | 'debate'

/**
 * Question in the guided chat
 */
export interface Question {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  questionType: 'yes_no' | 'multiple_choice' | 'free_text'
  content: string
  options?: string[]
  answer?: string
  /**
   * Expected answer type: 'short' for single line (Input), 'long' for paragraph (Textarea)
   * If not specified, will be inferred from question content
   */
  expectedAnswerType?: 'short' | 'long'
}

/**
 * Context evaluation result
 */
export interface ContextEvaluation {
  score: number
  reasoning: string
  missingAspects: string[]
  readinessLevel?: string
  summary?: string
  contradictions?: string[] // Contradicciones detectadas entre respuestas
  duplicatedInfo?: string[] // Información duplicada o redundante
  qualityIssues?: string[] // Problemas de calidad detectados
  shouldContinue: boolean
  followUpQuestions: Question[]
}

/**
 * Message in chat
 */
export interface Message {
  id: string
  role: 'ai' | 'user'
  content: string
  type?: 'question' | 'answer' | 'evaluation' | 'system' | 'validation' | 'error' | 'warning'
  timestamp: Date
}

/**
 * Phase progress (0-100)
 */
export interface PhaseProgress {
  contexto: number
  expertos: number
  estrategia: number
  revision: number
  debate: number
}

/**
 * Internet Search Result Item
 */
export interface InternetSearchResult {
  id: string
  title: string
  summary: string
  url?: string
  selected: boolean // Si el usuario quiere incluir este resultado
}

/**
 * Internet Search State
 */
export interface InternetSearchState {
  enabled: boolean
  isSearching: boolean
  results: InternetSearchResult[] // Resultados de búsqueda
  context: string | null // Contexto final seleccionado por el usuario
  customText: string | null // Texto alternativo introducido por el usuario
  error: string | null
  currentSearchQuery?: string // Qué se está buscando actualmente
  currentQuestionId?: string // ID de la pregunta para la que se está buscando
  isApplied: boolean // Si el usuario ya aplicó los resultados (permite volver a editar)
}

/**
 * Context phase state
 */
export interface ContextoState {
  mainQuestion: string
  /** Créditos reales deducidos durante la fase de contexto (validaciones, evaluaciones, generación de preguntas) */
  realCreditsDeducted: number
  answers: Record<string, string>
  currentQuestionIndex: number
  questions: Question[]
  messages: Message[]
  contextScore: number
  evaluation: ContextEvaluation | null
  phase: 'initial' | 'critical' | 'deep' | 'refine' | 'ready'
  internetSearch?: InternetSearchState
  userDeclinedInternetSearch?: boolean // Si el usuario rechazó la búsqueda en internet, no volver a preguntar
  draftId?: string // ID del draft del debate creado al inicio
}

/**
 * Expertos / Participantes phase state
 * "¿Quién interviene?" — Expertos, Departamentos, Profesionales (1, 2 o los 3)
 */
export interface ExpertosState {
  participantTypes: {
    expertos: boolean
    departamentos: boolean
    trabajadores: boolean
  }
  selectedExpertIds: string[]
  selectedDepartmentIds: string[]
  selectedWorkerIds: string[]
  recommendedExpertIds: string[]
}

/**
 * Estrategia phase state
 */
export interface EstrategiaState {
  selectedStrategy: string
  recommendedStrategy: string | null
  selectedFrameworkId: string | null // Framework de decisión seleccionado (FODA, ROI, Delphi, etc.)
}

/**
 * Revision phase state
 */
export interface RevisionState {
  canProceed: boolean
  summary: {
    question: string
    expertCount: number
    strategy: string
    contextScore: number
  }
}

/**
 * Debate phase state
 */
export interface DebateState {
  debateId: string | null
  messages: Message[]
  input: string
  isLoading: boolean
}

/**
 * Complete unified state
 */
export interface UnifiedDebateState {
  // Current phase (1-5)
  currentPhase: UnifiedPhase
  
  // Progress per phase (0-100)
  phaseProgress: PhaseProgress
  
  // Phase data
  contexto: ContextoState
  expertos: ExpertosState
  estrategia: EstrategiaState
  revision: RevisionState
  debate: DebateState
  
  // Navigation
  canGoNext: boolean
  canGoBack: boolean
  
  // Loading states
  isGeneratingQuestions: boolean
  isEvaluating: boolean
  isCreatingDebate: boolean
}
