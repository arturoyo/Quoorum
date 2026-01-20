/**
 * Instrumentation de Next.js 14
 * Setup de Sentry para client, server y edge
 *
 * Este archivo se ejecuta automáticamente cuando Next.js arranca
 * Documentación: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Para activar, añadir en next.config.ts:
 * experimental: { instrumentationHook: true }
 */

export async function register() {
  // Solo ejecutar en servidor (no en build time)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Importar configuración de Sentry Server
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Importar configuración de Sentry Edge
    await import('./sentry.edge.config')
  }
}
