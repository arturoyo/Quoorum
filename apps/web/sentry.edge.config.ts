/**
 * Sentry Edge Runtime Configuration
 * Para errores en Edge Functions (middleware, edge API routes)
 *
 * Setup:
 * 1. Instalar: pnpm add @sentry/nextjs
 * 2. Añadir SENTRY_DSN a .env
 * 3. Descomentar código abajo
 */

// [WARN] DESCOMENTAR CUANDO SENTRY ESTÉ INSTALADO
/*
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    // DSN de tu proyecto Sentry
    dsn: SENTRY_DSN,

    // Entorno
    environment: process.env.NODE_ENV,

    // Tracing (reducido para Edge)
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.02 : 1.0,

    // Edge Runtime tiene limitaciones
    // No soporta profiling ni algunos integrations

    // Filtrar datos sensibles
    beforeSend(event) {
      // No enviar en desarrollo
      if (process.env.NODE_ENV === "development") {
        return null;
      }

      // Redactar headers
      if (event.request?.headers) {
        const headers = event.request.headers as Record<string, unknown>;
        ["authorization", "cookie", "x-api-key"].forEach((header) => {
          if (headers[header]) {
            headers[header] = "REDACTED";
          }
        });
      }

      return event;
    },

    // Ignorar errores de middleware conocidos
    ignoreErrors: [
      "NEXT_REDIRECT",
      "NEXT_NOT_FOUND",
    ],

    // Debug
    debug: process.env.NODE_ENV === "development",
  });
} else if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line no-console
  console.log("[INFO] Sentry Edge disabled: SENTRY_DSN not set");
}
*/

// Placeholder
export const sentryConfigured = Boolean(process.env.SENTRY_DSN)
