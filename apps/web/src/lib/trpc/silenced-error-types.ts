/**
 * Silenced Error Types - Single Source of Truth
 *
 * Este archivo define TODOS los tipos de errores que deben ser silenciados
 * en la consola porque son errores esperados o ya manejados por la UI.
 *
 * ⚠️ IMPORTANTE: Este archivo es la ÚNICA fuente de verdad para tipos silenciados.
 * Si necesitas añadir un nuevo tipo de error silenciado, añádelo AQUÍ y las
 * dos capas de interceptación lo usarán automáticamente.
 *
 * ARQUITECTURA DEL SISTEMA:
 *
 * CAPA 1: Interceptación de console.error (provider.tsx líneas 15-137)
 * - Verifica strings específicos en los argumentos de console.error
 * - Usa las keywords definidas en SILENCED_ERROR_PATTERNS
 *
 * CAPA 2: Handler onError de React Query (provider.tsx líneas 168-176)
 * - Usa classifyTRPCError() para clasificar el error
 * - Verifica contra SILENCED_ERROR_CATEGORIES
 *
 * @see apps/web/src/lib/trpc/provider.tsx
 * @see apps/web/src/lib/trpc/error-handler.ts
 */

/**
 * Patrones de strings que indican errores silenciados
 * Usados por la interceptación de console.error (CAPA 1)
 */
export const SILENCED_ERROR_PATTERNS = {
  PAYMENT_REQUIRED: [
    'PAYMENT_REQUIRED',
    '402 Payment Required',
    'Créditos insuficientes',
    'créditos insuficientes',
  ],
  UNAUTHORIZED: [
    'UNAUTHORIZED',
    '401 Unauthorized',
    'must be logged in',
    'You must be logged in',
    'No autenticado',
  ],
  NETWORK: [
    'Failed to fetch',
    'failed to fetch',
    'NetworkError',
    'network error',
  ],
  NOT_FOUND: [
    'NOT_FOUND',
    '404',
    'no encontrado',
    'not found',
    'No encontrado',
    'Not found',
  ],
} as const

/**
 * Categorías de errores que deben ser silenciados
 * Usados por el handler onError de React Query (CAPA 2)
 *
 * IMPORTANTE: Estos valores deben coincidir con los tipos retornados
 * por classifyTRPCError() en error-handler.ts
 */
export const SILENCED_ERROR_CATEGORIES = [
  'payment-required',
  'unauthorized',
  'network',
  'not-found',
] as const

/**
 * Type helper para TypeScript
 */
export type SilencedErrorCategory = (typeof SILENCED_ERROR_CATEGORIES)[number]

/**
 * Verifica si un string contiene algún patrón de error silenciado
 *
 * @param text - Texto a verificar (usualmente de console.error args)
 * @returns true si el texto contiene un patrón silenciado
 */
export function containsSilencedPattern(text: string): boolean {
  return Object.values(SILENCED_ERROR_PATTERNS)
    .flat()
    .some((pattern) => text.includes(pattern))
}

/**
 * Verifica si una categoría de error debe ser silenciada
 *
 * @param category - Categoría retornada por classifyTRPCError()
 * @returns true si la categoría debe ser silenciada
 */
export function isSilencedCategory(category: string): boolean {
  return SILENCED_ERROR_CATEGORIES.includes(category as SilencedErrorCategory)
}

/**
 * Obtiene todas las keywords de errores silenciados (flat array)
 * Útil para debugging o logs
 */
export function getAllSilencedKeywords(): string[] {
  return Object.values(SILENCED_ERROR_PATTERNS).flat()
}
