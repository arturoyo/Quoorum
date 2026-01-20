'use client'

/**
 * Error Boundary de Next.js 14 App Router
 * Captura errores en rutas del dashboard
 *
 * Uso automático: Next.js renderiza esto cuando hay error en cualquier page.tsx
 */

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log el error automáticamente (solo en cliente)
    if (typeof window !== 'undefined') {
      import('@/lib/logger').then(({ logger }) => {
        logger.error('Dashboard error caught by error.tsx', error, {
          digest: error.digest,
          stack: error.stack,
          page: window.location.pathname,
        })
      }).catch(err => {
        // Fallback si logger falla
        console.error('Error logging failed:', err)
      })
    }
  }, [error])

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <Card className="w-full max-w-2xl border-red-900/20 bg-gray-900/50 p-8 backdrop-blur">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-500/10 p-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-3 text-center text-2xl font-bold text-white">
          Algo salió mal
        </h1>

        {/* Description */}
        <p className="mb-6 text-center text-gray-400">
          El dashboard encontró un error inesperado. Nuestro sistema lo ha registrado automáticamente.
        </p>

        {/* Error Details (solo en desarrollo) */}
        {isDev && (
          <div className="mb-6 rounded-lg border border-red-900/30 bg-red-950/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-400">
              <Bug className="h-4 w-4" />
              <span>Detalles del error (solo visible en desarrollo)</span>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-400">Mensaje:</span>
                <p className="mt-1 font-mono text-xs text-red-300">{error.message}</p>
              </div>
              {error.digest && (
                <div>
                  <span className="font-medium text-gray-400">Digest:</span>
                  <p className="mt-1 font-mono text-xs text-gray-500">{error.digest}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="border-gray-700 hover:bg-gray-800"
          >
            <Home className="mr-2 h-4 w-4" />
            Ir al inicio
          </Button>
        </div>

        {/* Footer info */}
        <div className="mt-8 border-t border-gray-800 pt-6 text-center">
          <p className="text-xs text-gray-500">
            Error ID: {error.digest || 'N/A'}
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Si el problema persiste, contacta con soporte técnico.
          </p>
        </div>
      </Card>
    </div>
  )
}
