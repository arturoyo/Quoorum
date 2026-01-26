/**
 * tRPC Error Handler
 * 
 * Detecta y maneja errores comunes de tRPC, especialmente 404s
 * que indican que el servidor no está disponible.
 */

import { logger } from '@/lib/logger'
import { toast } from 'sonner'

export interface TRPCErrorInfo {
  type: 'network' | 'server' | 'not-found' | 'unauthorized' | 'timeout' | 'payment-required' | 'unknown'
  status?: number
  message: string
  shouldRetry: boolean
  retryDelay?: number
  errorCode?: string
  errorData?: Record<string, unknown>
}

/**
 * Clasifica un error de tRPC y retorna información útil
 */
export function classifyTRPCError(error: unknown): TRPCErrorInfo {
  // Error de fetch (red): "Failed to fetch" (TypeError u otro Error con ese mensaje)
  if (error instanceof Error && error.message.toLowerCase().includes('failed to fetch')) {
    return {
      type: 'network',
      message: 'Sin conexión al servidor. Verifica tu conexión a internet.',
      shouldRetry: true,
      retryDelay: 2000,
    }
  }

  // Extraer información de error tRPC si está disponible
  let errorCode: string | undefined
  let errorData: Record<string, unknown> | undefined
  let statusCode: number | undefined
  
  if (error && typeof error === 'object') {
    // Intentar extraer código de error de tRPC desde múltiples ubicaciones
    const errorObj = error as Record<string, unknown>
    
    // Ruta 0: error.cause (TRPCClientError tiene cause con status y responseBody)
    if ('cause' in errorObj && errorObj.cause && typeof errorObj.cause === 'object') {
      const cause = errorObj.cause as Record<string, unknown>
      if (typeof cause.status === 'number') {
        statusCode = cause.status
      }
      
      // Extraer errorCode desde cause.responseBody
      if ('responseBody' in cause && Array.isArray(cause.responseBody)) {
        const firstError = cause.responseBody[0] as Record<string, unknown>
        if (firstError?.error && typeof firstError.error === 'object') {
          const errorDataObj = firstError.error as Record<string, unknown>
          
          // error.json.data.code
          if (errorDataObj.json && typeof errorDataObj.json === 'object') {
            const jsonData = errorDataObj.json as Record<string, unknown>
            if (jsonData.data && typeof jsonData.data === 'object') {
              const data = jsonData.data as Record<string, unknown>
              if (data.code && typeof data.code === 'string') {
                errorCode = data.code
              }
              errorData = { ...data, ...errorData }
            }
            // También verificar json.code directamente
            if (jsonData.code && typeof jsonData.code === 'string' && !errorCode) {
              errorCode = jsonData.code
            }
          }
          
          // error.data.code (directo en error)
          if (errorDataObj.data && typeof errorDataObj.data === 'object') {
            const data = errorDataObj.data as Record<string, unknown>
            if (data.code && typeof data.code === 'string') {
              errorCode = data.code
            }
            errorData = { ...data, ...errorData }
          }
        }
      }
    }
    
    // Ruta 1: error.data.code (directo)
    if ('data' in errorObj && errorObj.data && typeof errorObj.data === 'object') {
      const data = errorObj.data as Record<string, unknown>
      if ('code' in data && typeof data.code === 'string') {
        errorCode = data.code
      }
      errorData = { ...data, ...errorData }
    }
    
    // Ruta 2: responseBody (tRPC batch response) - directo en error
    if ('responseBody' in errorObj && Array.isArray(errorObj.responseBody)) {
      const firstError = errorObj.responseBody[0] as Record<string, unknown>
      if (firstError?.error && typeof firstError.error === 'object') {
        const errorDataObj = firstError.error as Record<string, unknown>
        
        // error.json.data.code
        if (errorDataObj.json && typeof errorDataObj.json === 'object') {
          const jsonData = errorDataObj.json as Record<string, unknown>
          if (jsonData.data && typeof jsonData.data === 'object') {
            const data = jsonData.data as Record<string, unknown>
            if (data.code && typeof data.code === 'string') {
              errorCode = data.code
            }
            errorData = { ...data, ...errorData }
          }
          // También verificar json.code directamente
          if (jsonData.code && typeof jsonData.code === 'string' && !errorCode) {
            errorCode = jsonData.code
          }
        }
        
        // error.data.code (directo en error)
        if (errorDataObj.data && typeof errorDataObj.data === 'object') {
          const data = errorDataObj.data as Record<string, unknown>
          if (data.code && typeof data.code === 'string') {
            errorCode = data.code
          }
          errorData = { ...data, ...errorData }
        }
      }
    }
    
    // Ruta 3: Verificar en el mensaje de error (fallback)
    if (!errorCode && error instanceof Error) {
      if (error.message.includes('PAYMENT_REQUIRED') || 
          error.message.includes('Créditos insuficientes')) {
        errorCode = 'PAYMENT_REQUIRED'
      }
    }
    
    // Ruta 4: Verificar status directo en error (si no se encontró en cause)
    if (!statusCode && 'status' in errorObj && typeof errorObj.status === 'number') {
      statusCode = errorObj.status
    }
  }

  // Error con status code
  if (error instanceof Error) {
    const errorObj = error as Record<string, unknown>
    
    // 401 Unauthorized - Verificar ANTES de PAYMENT_REQUIRED (más común)
    // Verificar desde múltiples fuentes:
    // 1. errorCode extraído de responseBody o cause
    // 2. Status code 401 (desde error.status, error.cause.status, o statusCode extraído)
    // 3. Mensaje de error que contiene "Unauthorized" o "must be logged in"
    const isStatus401 = statusCode === 401 || 
                        errorObj.status === 401 ||
                        (errorObj.cause && typeof errorObj.cause === 'object' && 
                         (errorObj.cause as Record<string, unknown>).status === 401) ||
                        error.message.includes('401')
    const hasUnauthorizedMessage = error.message.includes('Unauthorized') ||
                                   error.message.includes('must be logged in') ||
                                   error.message.includes('You must be logged in') ||
                                   error.message.includes('UNAUTHORIZED')
    
    if (errorCode === 'UNAUTHORIZED' || 
        isStatus401 ||
        hasUnauthorizedMessage) {
      return {
        type: 'unauthorized',
        status: 401,
        message: 'No autenticado. Por favor, inicia sesión.',
        shouldRetry: false,
        errorCode: 'UNAUTHORIZED',
        errorData,
      }
    }
    
    // 402 Payment Required (PAYMENT_REQUIRED) - Verificar DESPUÉS de UNAUTHORIZED
    // Esto es importante porque puede venir como 500 pero ser realmente PAYMENT_REQUIRED
    // Verificar desde múltiples fuentes:
    // 1. errorCode extraído de responseBody
    // 2. Mensaje de error que contiene "Créditos insuficientes"
    // 3. errorData con paymentRequired flag (compatibilidad)
    const hasPaymentRequiredFlag = errorData?.paymentRequired === true || 
                                   (errorData?.cause && typeof errorData.cause === 'object' && 
                                    'paymentRequired' in errorData.cause && errorData.cause.paymentRequired === true)
    
    // También verificar si el status es 402 (aunque el código no se haya extraído correctamente)
    const isStatus402 = errorObj.status === 402 || 
                       error.message.includes('402')
    
    if (errorCode === 'PAYMENT_REQUIRED' || 
        hasPaymentRequiredFlag ||
        isStatus402 ||
        error.message.includes('Payment Required') ||
        error.message.includes('Créditos insuficientes')) {
      // Extraer mensaje mejorado si está disponible en errorData
      let message = error.message || 'Créditos insuficientes'
      if (errorData?.message && typeof errorData.message === 'string') {
        message = errorData.message
      }
      
      // Extraer información adicional del cause si está disponible
      if (errorData?.cause && typeof errorData.cause === 'object') {
        const cause = errorData.cause as Record<string, unknown>
        if (cause.required !== undefined && cause.current !== undefined) {
          message = `Se requieren ${cause.required} créditos, pero tienes ${cause.current}. ${cause.action || 'Recarga créditos o continúa sin búsqueda en internet.'}`
        }
      }
      
      return {
        type: 'payment-required',
        status: 402,
        message,
        shouldRetry: false, // No reintentar errores de pago
        errorCode: 'PAYMENT_REQUIRED',
        errorData,
      }
    }

    // 404 Not Found
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return {
        type: 'not-found',
        status: 404,
        message: 'Servidor no disponible. El servidor Next.js podría no estar corriendo.',
        shouldRetry: true,
        retryDelay: 3000,
      }
    }


    // 500+ Server Error
    // IMPORTANTE: Verificar si es PAYMENT_REQUIRED antes de tratarlo como error 500
    // porque puede venir como 500 si el errorFormatter no funcionó correctamente
    if ((error.message.includes('500') || error.message.includes('Internal Server Error')) &&
        errorCode !== 'PAYMENT_REQUIRED') {
      // Intentar extraer el mensaje del error del servidor si está disponible
      let serverMessage = 'Error del servidor. Por favor, intenta más tarde.'
      
      // Si el error tiene responseBody, intentar extraer el mensaje del servidor
      if (error instanceof Error) {
        const errorObj = error as Record<string, unknown>
        if (errorObj.responseBody) {
          try {
            const responseBody = errorObj.responseBody as unknown
            
            // Log para debugging
            logger.debug('Extracting server message from responseBody', { 
              responseBodyType: typeof responseBody,
              isArray: Array.isArray(responseBody),
              responseBodyKeys: typeof responseBody === 'object' && responseBody !== null && !Array.isArray(responseBody) 
                ? Object.keys(responseBody as Record<string, unknown>)
                : undefined
            })
            
            // tRPC batch response: array con objetos { error: { json: { message: ... } } }
            if (Array.isArray(responseBody) && responseBody.length > 0) {
              const firstError = responseBody[0] as Record<string, unknown>
              
              // Intentar múltiples rutas de acceso al mensaje
              if (firstError.error && typeof firstError.error === 'object') {
                const errorData = firstError.error as Record<string, unknown>
                
                // Ruta 1: error.json.message
                if (errorData.json && typeof errorData.json === 'object') {
                  const jsonData = errorData.json as Record<string, unknown>
                  if (jsonData.message && typeof jsonData.message === 'string' && jsonData.message.trim().length > 0) {
                    serverMessage = jsonData.message
                    logger.debug('Extracted message from error.json.message', { message: serverMessage })
                  }
                }
                
                // Ruta 2: error.message (directo)
                if (errorData.message && typeof errorData.message === 'string' && errorData.message.trim().length > 0) {
                  serverMessage = errorData.message
                  logger.debug('Extracted message from error.message', { message: serverMessage })
                }
              }
              
              // Ruta 3: firstError.message (directo en el primer elemento)
              if (firstError.message && typeof firstError.message === 'string' && firstError.message.trim().length > 0) {
                serverMessage = firstError.message
                logger.debug('Extracted message from firstError.message', { message: serverMessage })
              }
            }
            // También intentar si responseBody es un objeto directo
            else if (typeof responseBody === 'object' && responseBody !== null && !Array.isArray(responseBody)) {
              const bodyObj = responseBody as Record<string, unknown>
              
              // Ruta 4: bodyObj.message (directo)
              if (bodyObj.message && typeof bodyObj.message === 'string' && bodyObj.message.trim().length > 0) {
                serverMessage = bodyObj.message
                logger.debug('Extracted message from bodyObj.message', { message: serverMessage })
              } 
              // Ruta 5: bodyObj.error.message
              else if (bodyObj.error && typeof bodyObj.error === 'object') {
                const errorData = bodyObj.error as Record<string, unknown>
                if (errorData.message && typeof errorData.message === 'string' && errorData.message.trim().length > 0) {
                  serverMessage = errorData.message
                  logger.debug('Extracted message from bodyObj.error.message', { message: serverMessage })
                } 
                // Ruta 6: bodyObj.error.json.message
                else if (errorData.json && typeof errorData.json === 'object') {
                  const jsonData = errorData.json as Record<string, unknown>
                  if (jsonData.message && typeof jsonData.message === 'string' && jsonData.message.trim().length > 0) {
                    serverMessage = jsonData.message
                    logger.debug('Extracted message from bodyObj.error.json.message', { message: serverMessage })
                  }
                }
              }
            }
            
            // Si todavía tenemos el mensaje genérico, log el responseBody completo para debugging
            if (serverMessage === 'Error del servidor. Por favor, intenta más tarde.') {
              logger.warn('Could not extract specific server message', { 
                responseBody: JSON.stringify(responseBody).substring(0, 500) // Limitar longitud
              })
            }
          } catch (parseError) {
            // Si falla la extracción, usar el mensaje genérico
            logger.warn('Failed to extract server error message', { 
              parseError: parseError instanceof Error ? parseError.message : String(parseError)
            })
          }
        }
      }
      
      return {
        type: 'server',
        status: 500,
        message: serverMessage,
        shouldRetry: true,
        retryDelay: 5000,
      }
    }

    // Timeout
    if (error.message.includes('timeout') || error.message.includes('aborted')) {
      return {
        type: 'timeout',
        message: 'La petición tardó demasiado. Verifica tu conexión.',
        shouldRetry: true,
        retryDelay: 2000,
      }
    }
  }

  // Error desconocido
  return {
    type: 'unknown',
    message: error instanceof Error ? error.message : 'Error desconocido',
    shouldRetry: false,
  }
}

/**
 * Maneja un error de tRPC y muestra notificación al usuario
 */
export function handleTRPCError(error: unknown, context?: string): TRPCErrorInfo {
  const errorInfo = classifyTRPCError(error)

  // Serializar el error de forma segura para logging
  const errorDetails: Record<string, unknown> = {
    errorType: error instanceof Error ? error.name : typeof error,
    errorMessage: error instanceof Error ? error.message : String(error),
    errorStack: error instanceof Error ? error.stack : undefined,
    errorInfo,
  }

  // Si el error tiene propiedades adicionales (como status, code, etc.), incluirlas
  if (error instanceof Error) {
    const errorObj = error as Record<string, unknown>
    if (errorObj.status) errorDetails.status = errorObj.status
    if (errorObj.code) errorDetails.code = errorObj.code
    if (errorObj.cause) errorDetails.cause = errorObj.cause
  }

  // Log: network / "Failed to fetch" → solo console.warn (nunca logger.error; evita [ERROR] en consola)
  const isNetworkOrFetch =
    errorInfo.type === 'network' ||
    (error instanceof Error && error.message.toLowerCase().includes('failed to fetch'))
  
  // Verificar si es PAYMENT_REQUIRED ANTES de loggear - estos son esperados y no deben loggearse como error
  if (errorInfo.type === 'payment-required') {
    // Error de créditos insuficientes - NO mostrar toast aquí, se maneja en el componente
    // Solo loguear como warning, no como error crítico
    logger.warn('[tRPC] Payment required (expected):', {
      context: context || 'Unknown context',
      message: errorInfo.message,
      errorData: errorInfo.errorData,
    })
    // No mostrar toast aquí - el componente manejará el error específicamente
    return // Salir temprano para evitar logging adicional
  }

  // Verificar si es UNAUTHORIZED ANTES de loggear - estos son esperados cuando el usuario no está autenticado
  if (errorInfo.type === 'unauthorized') {
    // Error de autenticación - NO mostrar toast ni loggear como error
    // Estos errores se manejan con el flag `enabled` en los queries
    // No hacer nada - silenciar completamente
    return // Salir temprano para evitar logging adicional
  }

  // Verificar si es NETWORK ANTES de loggear - estos son temporales (servidor no disponible, sin conexión)
  if (errorInfo.type === 'network') {
    // Error de red - NO mostrar toast ni loggear como error crítico
    // Estos errores son temporales (servidor no disponible, sin conexión a internet)
    // Solo loggear como warning en desarrollo
    if (process.env.NODE_ENV === 'development') {
      logger.warn('[tRPC] Network error (temporary):', {
        context: context || 'Unknown context',
        message: errorInfo.message,
      })
    }
    return // Salir temprano para evitar logging adicional
  }
  
  if (isNetworkOrFetch) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        `[tRPC] ${context || 'Unknown context'} (reintentando)`,
        errorDetails
      )
    }
  } else {
    logger.error(`[tRPC Error] ${context || 'Unknown context'}`, errorDetails)
  }

  // Mostrar notificación solo para errores críticos (no network: se reintenta y genera toast en cada retry)
  if (errorInfo.type === 'not-found') {
    toast.error('Servidor no disponible', {
      description: 'El servidor podría no estar corriendo. Ejecuta: pnpm dev',
      duration: 10000,
      action: {
        label: 'Recargar',
        onClick: () => window.location.reload(),
      },
    })
  } else if (errorInfo.type === 'network') {
    // Sin toast: QueryClient reintenta hasta 3 veces; evitar spam de toasts
  } else if (errorInfo.type === 'server') {
    // Usar el mensaje extraído del servidor si está disponible
    const description = errorInfo.message !== 'Error del servidor. Por favor, intenta más tarde.'
      ? errorInfo.message
      : 'Por favor, intenta más tarde'
    
    toast.error('Error del servidor', {
      description,
      duration: 5000,
    })
  }

  return errorInfo
}

/**
 * Retry con exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    onRetry?: (attempt: number, error: unknown) => void
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Si es el último intento, lanzar el error
      if (attempt === maxRetries) {
        throw error
      }

      // Calcular delay con exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay)

      // Callback de retry
      if (onRetry) {
        onRetry(attempt + 1, error)
      }

      // Esperar antes de reintentar
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Verifica si el servidor está disponible (usa /api/health para evitar 404 con HEAD /api/trpc)
 */
export async function checkTRPCServerHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    })
    return response.ok
  } catch {
    return false
  }
}
