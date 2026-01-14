/**
 * Forum Logger - Re-export del logger profesional
 *
 * Este archivo mantiene compatibilidad con código existente
 * que importa quoorumLogger desde './forum-logger'
 *
 * El logger real está en ./logger.ts y usa pino + Sentry
 */

export { quoorumLogger, QuoorumLogger } from './logger'
