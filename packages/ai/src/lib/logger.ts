/**
 * Simple logger for AI package
 * Only logs in development mode per CLAUDE.md compliance
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log(`[AI INFO] ${message}`, data ?? '')
    }
    // Production: integrate with Sentry/structured logging
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn(`[AI WARN] ${message}`, data ?? '')
    }
    // Production: Sentry.captureMessage(message, "warning")
  },
  error: (message: string, errorOrData?: Error | Record<string, unknown>, data?: Record<string, unknown>) => {
    if (isDev) {
      if (errorOrData instanceof Error) {
        // eslint-disable-next-line no-console
        console.error(`[AI ERROR] ${message}`, errorOrData.message, data ?? '')
      } else {
        // eslint-disable-next-line no-console
        console.error(`[AI ERROR] ${message}`, errorOrData ?? '')
      }
    }
    // Production: Sentry.captureException(errorOrData)
  },
  debug: (message: string, data?: Record<string, unknown>) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log(`[AI DEBUG] ${message}`, data ?? '')
    }
  },
}
