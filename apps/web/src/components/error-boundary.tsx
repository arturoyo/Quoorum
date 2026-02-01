'use client'

/**
 * ErrorBoundary Component - Reutilizable
 *
 * Uso:
 * <ErrorBoundary fallback={<CustomError />}>
 *   <ComponentQuePuedeRomper />
 * </ErrorBoundary>
 *
 * Características:
 * - Captura errores de React
 * - Log automático al backend
 * - UI de fallback customizable
 * - Botón de retry
 */

import React, { Component, useState, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetKeys?: unknown[] // Si cambian, resetea el boundary
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  showDetails: boolean
}

// ═══════════════════════════════════════════════════════════
// DEFAULT FALLBACK UI
// ═══════════════════════════════════════════════════════════

function DefaultErrorFallback({
  error,
  errorInfo,
  reset,
}: {
  error: Error | null
  errorInfo: React.ErrorInfo | null
  reset: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <Card className="border-orange-900/30 bg-orange-950/10 p-6">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="rounded-lg bg-orange-500/10 p-2">
          <AlertTriangle className="h-6 w-6 text-orange-500" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="mb-2 font-semibold text-white">
            Algo salió mal en este componente
          </h3>
          <p className="mb-4 text-sm styles.colors.text.secondary">
            Este componente encontró un error. Intenta recargarlo o contacta con soporte si persiste.
          </p>

          {/* Error message in dev */}
          {isDev && error && (
            <div className="mb-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300"
              >
                {showDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span>Detalles del error (desarrollo)</span>
              </button>

              {showDetails && (
                <div className="mt-3 rounded-lg border border-orange-900/30 bg-orange-950/20 p-3">
                  <p className="mb-2 text-xs font-medium text-orange-400">
                    Mensaje:
                  </p>
                  <p className="mb-3 font-mono text-xs text-orange-300">
                    {error.message}
                  </p>

                  {errorInfo?.componentStack && (
                    <>
                      <p className="mb-2 text-xs font-medium text-orange-400">
                        Component Stack:
                      </p>
                      <pre className="max-h-32 overflow-auto font-mono text-xs styles.colors.text.secondary">
                        {errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <Button
            size="sm"
            onClick={reset}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Reintentar
          </Button>
        </div>
      </div>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════
// ERROR BOUNDARY CLASS
// ═══════════════════════════════════════════════════════════

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log el error automáticamente (solo en cliente)
    if (typeof window !== 'undefined') {
      import('@/lib/logger').then(({ logger }) => {
        logger.error('React Error Boundary caught error', error, {
          componentStack: errorInfo.componentStack,
          errorBoundary: 'custom',
        })
      }).catch(err => {
        console.error('Error boundary logging failed:', err)
      })
    }

    // Callback opcional del padre
    this.props.onError?.(error, errorInfo)

    // Guardar errorInfo en state
    this.setState({ errorInfo })
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Si resetKeys cambian, resetear el boundary
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      !this.areResetKeysEqual(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.reset()
    }
  }

  areResetKeysEqual(a: unknown[], b: unknown[]): boolean {
    if (a.length !== b.length) return false
    return a.every((key, index) => key === b[index])
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    })
  }

  render() {
    if (this.state.hasError) {
      // Si hay fallback custom, usarlo
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Sino, usar fallback por defecto
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          reset={this.reset}
        />
      )
    }

    return this.props.children
  }
}

// ═══════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════

export default ErrorBoundary
