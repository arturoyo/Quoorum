/**
 * Sentry Client Configuration
 * Para errores del navegador (client-side)
 *
 * IMPORTANTE: Este archivo NO debe importarse manualmente.
 * Next.js lo carga automáticamente vía _app o layout.
 *
 * Setup:
 * 1. Instalar: pnpm add @sentry/nextjs
 * 2. Añadir SENTRY_DSN a .env.local
 * 3. Descomentar código abajo
 */

// [WARN] DESCOMENTAAR CUANDO SENTRY ESTÉ INSTALADO
/*
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    // DSN de tu proyecto Sentry
    dsn: SENTRY_DSN,

    // Nombre del proyecto
    environment: process.env.NODE_ENV,

    // Tracing
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Session Replay
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,

    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
    ],

    // Filtrar datos sensibles
    beforeSend(event, hint) {
      // No enviar si es desarrollo local
      if (process.env.NODE_ENV === "development") {
        return null;
      }

      // Filtrar datos sensibles de URLs
      if (event.request?.url) {
        event.request.url = event.request.url.replace(/api-key=[^&]+/g, "api-key=REDACTED");
        event.request.url = event.request.url.replace(/token=[^&]+/g, "token=REDACTED");
      }

      return event;
    },

    // Ignorar errores conocidos
    ignoreErrors: [
      // Errores del navegador que no podemos controlar
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      // Adblockers
      "window.adsbygoogle",
      // Network errors
      "Network request failed",
      "Failed to fetch",
    ],

    // Debug (solo en desarrollo)
    debug: process.env.NODE_ENV === "development",
  });
} else if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line no-console
  console.log("[INFO] Sentry disabled: NEXT_PUBLIC_SENTRY_DSN not set");
}
*/

// Placeholder para que TypeScript no se queje
export const sentryConfigured = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)
