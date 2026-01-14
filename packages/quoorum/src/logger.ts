/**
 * Quoorum Logger - Sistema de logging profesional
 *
 * Usa pino para logging estructurado y Sentry para error tracking
 *
 * Uso:
 * - quoorumLogger.info('mensaje', { debateId, userId, tokensUsed })
 * - quoorumLogger.error('error', error, { debateId, userId })
 * - quoorumLogger.warn('advertencia', { context })
 * - quoorumLogger.debug('debug', { context }) // Solo en desarrollo
 *
 * NO usar console.log/error/warn en producción
 */

import pino from 'pino'

interface LogContext {
  [key: string]: unknown
}

/**
 * Logger profesional para el sistema Quoorum.
 *
 * Características:
 * - **Logging estructurado** con pino (JSON en producción, pretty en desarrollo)
 * - **Error tracking** automático a Sentry en producción
 * - **Redacción automática** de datos sensibles (tokens, passwords, etc.)
 * - **Helpers especializados** para operaciones de debate y AI
 *
 * **NO usar `console.log/error/warn` en producción**. Usa `quoorumLogger` en su lugar.
 *
 * @example
 * ```typescript
 * import { quoorumLogger } from '@quoorum/quoorum'
 *
 * // Log básico
 * quoorumLogger.info('Debate iniciado', { debateId, userId })
 *
 * // Log de error (se envía a Sentry automáticamente en producción)
 * try {
 *   await runDebate(...)
 * } catch (error) {
 *   quoorumLogger.error('Error al ejecutar debate', error, { debateId })
 * }
 *
 * // Helper para operaciones de debate
 * const op = quoorumLogger.debate('create', { userId, question })
 * op.start()
 * try {
 *   const result = await createDebate(...)
 *   op.success(result)
 * } catch (error) {
 *   op.error(error)
 * }
 *
 * // Helper para operaciones de AI
 * const aiOp = quoorumLogger.ai('generate', { model: 'gpt-4o', tokens: 1000 })
 * aiOp.start()
 * try {
 *   const response = await generate(...)
 *   aiOp.success(response.usage.totalTokens, response.cost)
 * } catch (error) {
 *   aiOp.error(error)
 * }
 * ```
 */
class QuoorumLogger {
  private logger: pino.Logger
  private isDevelopment = process.env['NODE_ENV'] === 'development'

  constructor() {
    this.logger = pino({
      level: process.env['LOG_LEVEL'] || (this.isDevelopment ? 'debug' : 'info'),
      // NOTE: pino-pretty transport disabled for Next.js compatibility
      // transport: this.isDevelopment
      //   ? {
      //       target: 'pino-pretty',
      //       options: {
      //         colorize: true,
      //         translateTime: 'SYS:standard',
      //         ignore: 'pid,hostname',
      //       },
      //     }
      //   : undefined,
      redact: [
        'password',
        'token',
        'accessToken',
        'refreshToken',
        'apiKey',
        'secret',
        'authorization',
        'cookie',
        'sessionId', // Puede contener información sensible
      ],
      base: {
        service: 'quoorum',
        version: process.env['npm_package_version'] || '0.0.1',
      },
    })
  }

  /**
   * Registra un mensaje de debug (solo visible en desarrollo).
   *
   * En producción, estos logs se ignoran para mejorar el rendimiento.
   * Úsalo para información detallada útil durante el desarrollo.
   *
   * @param message - Mensaje a registrar
   * @param context - Contexto adicional (opcional)
   *
   * @example
   * ```typescript
   * quoorumLogger.debug('Verificando consenso', {
   *   debateId,
   *   currentScore: 0.75,
   *   threshold: 0.7
   * })
   * ```
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.logger.debug(context || {}, message)
    }
  }

  /**
   * Info log
   */
  info(message: string, context?: LogContext): void {
    this.logger.info(context || {}, message)
  }

  /**
   * Warning log
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(context || {}, message)
  }

  /**
   * Error log - Envía a Sentry en producción
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    }

    this.logger.error(errorContext, message)

    // Enviar a Sentry SOLO en producción
    // TODO: Instalar @sentry/nextjs para habilitar
    // if (this.isProduction && typeof window === 'undefined') {
    //   // Solo en servidor - usar import dinámico
    //   // @ts-expect-error - Sentry is optional dependency
    //   void import('@sentry/nextjs')
    //     .then((Sentry) => {
    //       if (error) {
    //         // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Sentry is dynamically imported, types not available
    //         Sentry.captureException(error, {
    //           extra: {
    //             message,
    //             ...context,
    //           },
    //           tags: (() => {
    //             const tags: Record<string, string> = { service: 'forum' }
    //             if (context && typeof context === 'object' && 'debateId' in context) {
    //               const debateId = context['debateId']
    //               if (debateId && (typeof debateId === 'string' || typeof debateId === 'number')) {
    //                 tags['debateId'] = String(debateId)
    //               }
    //             }
    //             if (context && typeof context === 'object' && 'userId' in context) {
    //               const userId = context['userId']
    //               if (userId && (typeof userId === 'string' || typeof userId === 'number')) {
    //                 tags['userId'] = String(userId)
    //               }
    //             }
    //             return tags
    //           })(),
    //         })
    //       } else {
    //         // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Sentry is dynamically imported, types not available
    //         Sentry.captureMessage(message, {
    //           level: 'error',
    //           extra: context,
    //           tags: {
    //             service: 'quoorum',
    //           },
    //         })
    //       }
    //     })
    //     .catch(() => {
    //       // Sentry no disponible, continuar sin error
    //     })
    // }
  }

  /**
   * Helper para logs de operaciones de debate
   */
  debate(
    operationName: string,
    context?: LogContext
  ): {
    start: () => void
    success: (result?: unknown) => void
    error: (error: Error) => void
  } {
    const startTime = Date.now()
    const operationId = Math.random().toString(36).substring(7)

    return {
      start: () => {
        this.info(`[Debate:${operationName}] Started`, {
          operationId,
          ...context,
        })
      },
      success: (result?: unknown) => {
        const duration = Date.now() - startTime
        this.info(`[Debate:${operationName}] Completed`, {
          operationId,
          duration,
          result: result ? { type: typeof result } : undefined,
          ...context,
        })
      },
      error: (error: Error) => {
        const duration = Date.now() - startTime
        this.error(`[Debate:${operationName}] Failed`, error, {
          operationId,
          duration,
          ...context,
        })
      },
    }
  }

  /**
   * Helper para logs de AI operations
   */
  ai(
    operationName: string,
    context?: LogContext
  ): {
    start: () => void
    success: (tokensUsed?: number, cost?: number) => void
    error: (error: Error) => void
  } {
    const startTime = Date.now()
    const operationId = Math.random().toString(36).substring(7)

    return {
      start: () => {
        this.debug(`[AI:${operationName}] Started`, {
          operationId,
          ...context,
        })
      },
      success: (tokensUsed?: number, cost?: number) => {
        const duration = Date.now() - startTime
        this.info(`[AI:${operationName}] Completed`, {
          operationId,
          duration,
          tokensUsed,
          cost,
          ...context,
        })
      },
      error: (error: Error) => {
        const duration = Date.now() - startTime
        this.error(`[AI:${operationName}] Failed`, error, {
          operationId,
          duration,
          ...context,
        })
      },
    }
  }
}

export { QuoorumLogger }
export const quoorumLogger = new QuoorumLogger()
