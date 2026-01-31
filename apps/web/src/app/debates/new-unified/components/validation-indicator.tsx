/**
 * ValidationIndicator Component
 *
 * Shows visual feedback during answer validation.
 * Helps users understand that their answers are being checked for quality.
 */

'use client'

import { Shield, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { cn, styles } from '@/lib/utils'

interface ValidationIndicatorProps {
  isValidating?: boolean
  hasError?: boolean
  errorMessage?: string | null
  className?: string
}

export function ValidationIndicator({
  isValidating = false,
  hasError = false,
  errorMessage,
  className,
}: ValidationIndicatorProps) {
  if (!isValidating && !hasError) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border transition-all duration-300',
        isValidating && 'border-blue-500/50 bg-blue-500/10',
        hasError && 'border-amber-500/50 bg-amber-500/10',
        className
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isValidating && (
          <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
        )}
        {hasError && (
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {isValidating && (
          <>
            <p className="text-sm font-medium text-blue-300 mb-1">
              Validando tu respuesta...
            </p>
            <p className="text-xs styles.colors.text.tertiary">
              Verificando que sea relevante y aporte valor al debate
            </p>
          </>
        )}

        {hasError && errorMessage && (
          <>
            <p className="text-sm font-medium text-amber-300 mb-1">
              La respuesta necesita mejorar
            </p>
            <p className="text-xs styles.colors.text.secondary whitespace-pre-wrap">
              {errorMessage}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * ValidationBadge - Shows validation status in compact form
 */
export function ValidationBadge({
  isValidating,
  isValid,
}: {
  isValidating?: boolean
  isValid?: boolean
}) {
  if (!isValidating && !isValid) {
    return null
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-all',
        isValidating && 'bg-blue-500/10 border-blue-500/50 text-blue-300',
        isValid && 'bg-green-500/10 border-green-500/50 text-green-300'
      )}
    >
      {isValidating && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Validando...</span>
        </>
      )}
      {isValid && (
        <>
          <CheckCircle2 className="h-3 w-3" />
          <span>Validado</span>
        </>
      )}
    </div>
  )
}

/**
 * ValidationShield - Persistent indicator that validation is active
 */
export function ValidationShield({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-500/30 bg-purple-500/10',
        className
      )}
    >
      <Shield className="h-4 w-4 text-purple-400" />
      <div className="text-xs">
        <p className="font-medium text-purple-300">Validación activa</p>
        <p className="styles.colors.text.tertiary">
          Cada respuesta se verifica automáticamente
        </p>
      </div>
    </div>
  )
}
