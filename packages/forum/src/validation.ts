/**
 * Forum Input Validation
 *
 * Validaciones robustas de inputs para prevenir errores
 */

import type { LoadedContext } from './types'

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// ============================================================================
// QUESTION VALIDATION
// ============================================================================

export interface QuestionValidationOptions {
  minLength?: number
  maxLength?: number
  requireQuestionMark?: boolean
  allowEmpty?: boolean
}

const DEFAULT_QUESTION_OPTIONS: Required<QuestionValidationOptions> = {
  minLength: 10,
  maxLength: 1000,
  requireQuestionMark: false,
  allowEmpty: false,
}

/**
 * Valida una pregunta y lanza error si es inválida
 */
export function validateQuestionStrict(
  question: string,
  options: QuestionValidationOptions = {}
): void {
  const opts = { ...DEFAULT_QUESTION_OPTIONS, ...options }

  // Check null/undefined
  if (question === null || question === undefined) {
    throw new ValidationError('Question is required', 'question', 'REQUIRED')
  }

  // Check empty
  if (!opts.allowEmpty && question.trim().length === 0) {
    throw new ValidationError('Question cannot be empty', 'question', 'EMPTY')
  }

  // Check minimum length
  if (question.trim().length < opts.minLength) {
    throw new ValidationError(
      `Question must be at least ${opts.minLength} characters`,
      'question',
      'TOO_SHORT'
    )
  }

  // Check maximum length
  if (question.length > opts.maxLength) {
    throw new ValidationError(
      `Question must be at most ${opts.maxLength} characters`,
      'question',
      'TOO_LONG'
    )
  }

  // Check question mark
  if (opts.requireQuestionMark && !question.includes('?')) {
    throw new ValidationError('Question must end with a question mark', 'question', 'NO_QUESTION_MARK')
  }

  // Check for dangerous content
  const dangerousPatterns = [
    /(<script|<iframe|javascript:|onerror=)/i,
    /(DROP TABLE|DELETE FROM|INSERT INTO)/i,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(question)) {
      throw new ValidationError('Question contains potentially dangerous content', 'question', 'DANGEROUS_CONTENT')
    }
  }
}

// ============================================================================
// CONTEXT VALIDATION
// ============================================================================

export interface ContextValidationOptions {
  maxLength?: number
  allowEmpty?: boolean
}

const DEFAULT_CONTEXT_OPTIONS: Required<ContextValidationOptions> = {
  maxLength: 50000,
  allowEmpty: true,
}

/**
 * Valida contexto y lanza error si es inválido
 */
export function validateContextStrict(
  context: LoadedContext,
  options: ContextValidationOptions = {}
): void {
  const opts = { ...DEFAULT_CONTEXT_OPTIONS, ...options }

  // Check null/undefined
  if (context === null || context === undefined) {
    throw new ValidationError('Context is required', 'context', 'REQUIRED')
  }

  // Check sources array
  if (!Array.isArray(context.sources)) {
    throw new ValidationError('Context sources must be an array', 'context', 'INVALID_TYPE')
  }

  // Check if empty
  if (!opts.allowEmpty && context.sources.length === 0) {
    throw new ValidationError('Context cannot be empty', 'context', 'EMPTY')
  }

  // Validate each source
  for (let i = 0; i < context.sources.length; i++) {
    const source = context.sources[i]

    if (!source || !source.type) {
      throw new ValidationError(`Source ${i} is missing type`, 'context', 'MISSING_TYPE')
    }

    if (!source.content || source.content.trim().length === 0) {
      throw new ValidationError(`Source ${i} has empty content`, 'context', 'EMPTY_SOURCE')
    }

    if (source.content && source.content.length > opts.maxLength) {
      throw new ValidationError(
        `Source ${i} exceeds maximum length of ${opts.maxLength} characters`,
        'context',
        'SOURCE_TOO_LONG'
      )
    }
  }
}

// ============================================================================
// SESSION ID VALIDATION
// ============================================================================

/**
 * Valida session ID
 */
export function validateSessionId(sessionId: string): void {
  if (!sessionId || sessionId.trim().length === 0) {
    throw new ValidationError('Session ID is required', 'sessionId', 'REQUIRED')
  }

  if (sessionId.length > 100) {
    throw new ValidationError('Session ID is too long (max 100 characters)', 'sessionId', 'TOO_LONG')
  }

  // Check for valid characters (alphanumeric, dash, underscore)
  if (!/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
    throw new ValidationError(
      'Session ID can only contain alphanumeric characters, dashes, and underscores',
      'sessionId',
      'INVALID_CHARACTERS'
    )
  }
}

// ============================================================================
// COMBINED VALIDATION
// ============================================================================

export interface RunDebateInputValidationOptions {
  question?: QuestionValidationOptions
  context?: ContextValidationOptions
}

/**
 * Valida todos los inputs de runDebate
 */
export function validateRunDebateInput(
  sessionId: string,
  question: string,
  context: LoadedContext,
  options: RunDebateInputValidationOptions = {}
): void {
  validateSessionId(sessionId)
  validateQuestionStrict(question, options.question)
  validateContextStrict(context, options.context)
}

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Sanitiza una pregunta para uso seguro
 */
export function sanitizeQuestion(question: string): string {
  return question
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .slice(0, 1000) // Limit length
}

/**
 * Sanitiza contexto para uso seguro
 */
export function sanitizeContext(context: string): string {
  return context
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .slice(0, 50000)
}
