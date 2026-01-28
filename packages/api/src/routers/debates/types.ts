/**
 * Debates Router - Type Definitions
 *
 * Type definitions for debate context assessment and smart questions.
 */

/**
 * Context data attached to a debate
 */
export interface DebateContext {
  sources?: Array<{ type: string; content: string }>;
  constraints?: string[];
  background?: string;
  assessment?: {
    overallScore: number;
    readinessLevel: string;
    summary: string;
  };
  // Structured prompting fields (from course - Fase de Contexto)
  userRole?: string; // "Soy CEO de startup B2B SaaS"
  teamSize?: string; // "5-10 personas"
  budget?: string; // "€50k - €100k"
  deadline?: string; // "3 meses"
  successCriteria?: string[]; // ["ROI > 20%", "Churn < 5%"]
  [key: string]: unknown;
}

/**
 * A question or assumption generated for context gathering
 */
export interface FallbackQuestion {
  type: "question" | "assumption";
  questionType: "yes_no" | "multiple_choice" | "free_text";
  content: string;
  options?: string[];
}

/**
 * Result of semantic analysis of a business question
 */
export interface BusinessAnalysis {
  // What type of question structure?
  questionType: 'should_i' | 'how_to' | 'what_is_best' | 'a_or_b' | 'opinion' | 'help_me' | 'other';
  // Business domain detected
  domain: 'product' | 'marketing' | 'sales' | 'hiring' | 'pricing' | 'funding' | 'strategy' | 'operations' | 'growth' | 'partnerships' | 'unknown';
  // Business entities mentioned
  entities: {
    type: 'product' | 'market' | 'competitor' | 'customer' | 'metric' | 'money' | 'team' | 'time' | 'channel';
    text: string;
    isVague: boolean;
  }[];
  // What business context is MISSING?
  missingContext: {
    aspect: string;
    why: string;
    question: string;
  }[];
  // Ambiguities to clarify
  ambiguities: {
    phrase: string;
    meanings: string[];
  }[];
  // Core business dilemma
  coreDilemma?: string;
  // Business stage signals
  stageSignals: ('idea' | 'mvp' | 'early' | 'growth' | 'scale' | 'mature')[];
  // Implicit business concerns
  concerns: string[];
}

/**
 * A context-gathering question parsed from AI response
 */
export interface ContextQuestion {
  id?: string;
  type?: string;
  priority?: string;
  questionType: 'yes_no' | 'multiple_choice' | 'free_text';
  content: string;
  question?: string;
  options?: string[];
  /**
   * Expected answer type for free_text questions: 'short' for single line (Input), 'long' for paragraph (Textarea)
   * If not specified, will be inferred from question content on the frontend
   */
  expectedAnswerType?: 'short' | 'long';
}

/**
 * Evaluation result from context assessment
 */
export interface ContextEvaluation {
  score: number;
  reasoning: string;
  missingAspects: string[];
  contradictions?: string[]; // Contradicciones detectadas entre respuestas
  duplicatedInfo?: string[]; // Información duplicada o redundante
  qualityIssues?: string[]; // Problemas de calidad: vague_answers, missing_critical_info, etc.
  shouldContinue: boolean;
  followUpQuestions: ContextQuestion[];
}

/**
 * Corporate context loaded from company + departments
 */
export interface CorporateContext {
  companyContext: string;
  departmentContexts: Array<{
    departmentName: string;
    departmentContext: string;
    customPrompt?: string;
  }>;
  contextSummary: string;
}

/**
 * Metadata stored with a debate
 */
export interface DebateMetadata {
  paused?: boolean;
  forceConsensus?: boolean;
  estimatedCredits?: number;
  actualCreditsUsed?: number;
  costUsd?: number;
  [key: string]: unknown;
}

/**
 * Additional context item added during debate
 */
export interface AdditionalContextItem {
  content: string;
  addedAt: string;
}

/**
 * Debate record type for internal use
 */
export interface DebateRecord {
  id: string;
  userId: string;
  question: string;
  context: DebateContext;
  mode: string;
  status: string;
  visibility: string;
  metadata: DebateMetadata;
  createdAt: Date;
  updatedAt: Date;
}
