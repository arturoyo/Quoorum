/**
 * Monitoring utilities for Quoorum
 * In production, these should integrate with Sentry/PostHog
 * In development, they use structured console output
 */

const isDev = process.env.NODE_ENV === "development";

interface LogContext {
  [key: string]: unknown;
}

export function logError(error: Error, context?: LogContext): void {
  if (isDev) {
    console.error("[Quoorum Error]", {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }
  // Production: Sentry integration would go here
  // Sentry.captureException(error, { extra: context });
}

export function logInfo(message: string, data?: LogContext): void {
  if (isDev) {
    console.info("[Quoorum]", message, data);
  }
  // Production: structured logging would go here
}

export function logWarning(message: string, data?: LogContext): void {
  if (isDev) {
    console.warn("[Quoorum Warning]", message, data);
  }
  // Production: Sentry.captureMessage(message, "warning");
}

export function trackEvent(event: string, properties?: LogContext): void {
  if (isDev) {
    console.info("[Analytics]", event, properties);
  }
  // Production: PostHog integration would go here
  // posthog.capture(event, properties);
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info"): void {
  if (isDev) {
    const logFn = level === "error" ? console.error : level === "warning" ? console.warn : console.info;
    logFn(`[${level.toUpperCase()}]`, message);
  }
  // Production: Sentry.captureMessage(message, level);
}

export function captureException(error: Error, context?: LogContext): void {
  logError(error, context);
}
