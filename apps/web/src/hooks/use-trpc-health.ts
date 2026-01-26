/**
 * Hook para verificar la salud del servidor tRPC
 * 
 * Detecta si el servidor está disponible y muestra notificaciones
 * cuando detecta problemas.
 */

import { useEffect, useState } from 'react'
import { checkTRPCServerHealth, handleTRPCError } from '@/lib/trpc/error-handler'
import { logger } from '@/lib/logger'

interface TRPCHealthStatus {
  isHealthy: boolean
  isChecking: boolean
  lastCheck: Date | null
  error: Error | null
}

/**
 * Hook para monitorear la salud del servidor tRPC
 * 
 * @param options - Opciones de configuración
 * @returns Estado de salud del servidor
 */
export function useTRPCHealth(options: {
  enabled?: boolean
  checkInterval?: number
  onHealthChange?: (isHealthy: boolean) => void
} = {}) {
  const {
    enabled = true,
    checkInterval = 30000, // 30 segundos por defecto
    onHealthChange,
  } = options

  const [status, setStatus] = useState<TRPCHealthStatus>({
    isHealthy: true, // Optimistic: asumir que está saludable al inicio
    isChecking: false,
    lastCheck: null,
    error: null,
  })

  const checkHealth = async () => {
    if (!enabled) return

    setStatus((prev) => ({ ...prev, isChecking: true }))

    try {
      const isHealthy = await checkTRPCServerHealth()
      const now = new Date()

      setStatus({
        isHealthy,
        isChecking: false,
        lastCheck: now,
        error: null,
      })

      // Callback cuando cambia el estado
      if (onHealthChange) {
        onHealthChange(isHealthy)
      }

      // Si no está saludable, solo log como warning (no es un error crítico)
      if (!isHealthy) {
        logger.warn('[TRPC Health] Servidor no disponible', { timestamp: now })
        // NO llamar a handleTRPCError aquí - es solo un health check rutinario
        // handleTRPCError se debe usar solo para errores reales de requests
      } else {
        logger.debug('[TRPC Health] Servidor disponible', { timestamp: now })
      }
    } catch (error) {
      const now = new Date()
      const err = error instanceof Error ? error : new Error(String(error))

      setStatus({
        isHealthy: false,
        isChecking: false,
        lastCheck: now,
        error: err,
      })

      // Log como warning, no como error - es solo un health check
      logger.warn('[TRPC Health] Error checking health', { 
        error: err.message,
        timestamp: now 
      })
      // NO llamar a handleTRPCError - los errores de health check no son críticos
    }
  }

  // Check inicial
  useEffect(() => {
    if (enabled) {
      checkHealth()
    }
  }, [enabled])

  // Check periódico
  useEffect(() => {
    if (!enabled || checkInterval <= 0) return

    const interval = setInterval(() => {
      checkHealth()
    }, checkInterval)

    return () => clearInterval(interval)
  }, [enabled, checkInterval])

  return {
    ...status,
    checkHealth, // Exponer función para check manual
  }
}
