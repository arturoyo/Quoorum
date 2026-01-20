/**
 * Sentry Server Configuration
 * Para errores del servidor (API routes, server components)
 *
 * Setup:
 * 1. Instalar: pnpm add @sentry/nextjs
 * 2. Añadir SENTRY_DSN a .env
 * 3. Descomentar código abajo
 */

// ⚠️ DESCOMENTAR CUANDO SENTRY ESTÉ INSTALADO
/*
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    // DSN de tu proyecto Sentry
    dsn: SENTRY_DSN,

    // Nombre del proyecto y entorno
    environment: process.env.NODE_ENV,

    // Tracing (más conservador en servidor)
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

    integrations: [
      Sentry.nodeProfilingIntegration(),
    ],

    // Filtrar datos sensibles antes de enviar
    beforeSend(event, hint) {
      // No enviar en desarrollo local
      if (process.env.NODE_ENV === "development") {
        return null;
      }

      // Redactar secrets de contexto
      if (event.contexts) {
        Object.keys(event.contexts).forEach((key) => {
          const context = event.contexts?.[key];
          if (context && typeof context === "object") {
            Object.keys(context).forEach((field) => {
              if (
                field.toLowerCase().includes("password") ||
                field.toLowerCase().includes("token") ||
                field.toLowerCase().includes("secret") ||
                field.toLowerCase().includes("key")
              ) {
                (context as Record<string, unknown>)[field] = "REDACTED";
              }
            });
          }
        });
      }

      // Redactar headers sensibles
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

    // Ignorar errores conocidos
    ignoreErrors: [
      // tRPC errors que ya manejamos
      "TRPCError",
      // Database connection errors transitorios
      "Connection terminated unexpectedly",
      // Rate limiting (esperado)
      "Too Many Requests",
    ],

    // Debug solo en desarrollo
    debug: process.env.NODE_ENV === "development",
  });
} else if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line no-console
  console.log("ℹ️ Sentry Server disabled: SENTRY_DSN not set");
}
*/

// Placeholder
export const sentryConfigured = Boolean(process.env.SENTRY_DSN)
