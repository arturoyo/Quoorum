'use client'

/**
 * Global Error Handler de Next.js 14
 * Captura errores críticos en el root layout
 *
 * IMPORTANTE: Este componente reemplaza el <html> y <body> tags completos
 * Solo se activa en errores MUY críticos (layout root roto)
 */

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error crítico (solo en cliente)
    if (typeof window !== 'undefined') {
      import('@/lib/logger').then(({ logger }) => {
        logger.fatal('Critical error in root layout', error, {
          digest: error.digest,
          stack: error.stack,
        })
      }).catch(err => {
        // Fallback si logger falla
        console.error('Critical error logging failed:', err)
      })
    }
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-black">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border border-red-900/30 bg-gray-900 p-8 text-center">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <svg
                className="h-16 w-16 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className="mb-3 text-2xl font-bold text-white">
              Error Crítico del Sistema
            </h1>

            {/* Description */}
            <p className="mb-6 text-gray-400">
              La aplicación encontró un error crítico y debe reiniciarse.
              El error ha sido registrado automáticamente.
            </p>

            {/* Error message in dev */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 rounded-lg border border-red-900/30 bg-red-950/20 p-4 text-left">
                <p className="mb-2 text-sm font-medium text-red-400">
                  Detalles (solo en desarrollo):
                </p>
                <p className="font-mono text-xs text-red-300">
                  {error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700"
              >
                Reiniciar aplicación
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full rounded-lg border border-gray-700 px-4 py-2.5 font-medium text-white transition-colors hover:bg-gray-800"
              >
                Volver al inicio
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 border-t border-gray-800 pt-4">
              <p className="text-xs text-gray-500">
                Error ID: {error.digest || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
