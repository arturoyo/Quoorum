/**
 * AutosaveIndicator Component
 *
 * Shows visual feedback when debate state is being saved to localStorage.
 * Provides user confidence that their progress is being preserved.
 */

'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Cloud, Loader2 } from 'lucide-react'
import { cn, styles } from '@/lib/utils'

interface AutosaveIndicatorProps {
  isSaving?: boolean
  lastSaved?: Date | null
  className?: string
}

export function AutosaveIndicator({
  isSaving = false,
  lastSaved,
  className,
}: AutosaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false)

  // Show "Guardado" message for 3 seconds after save completes
  useEffect(() => {
    if (!isSaving && lastSaved) {
      setShowSaved(true)
      const timer = setTimeout(() => setShowSaved(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isSaving, lastSaved])

  // Format last saved time
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)

    if (seconds < 10) return 'hace un momento'
    if (seconds < 60) return `hace ${seconds}s`
    if (minutes < 60) return `hace ${minutes}m`
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  if (!isSaving && !showSaved && !lastSaved) {
    return null
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 text-sm transition-opacity duration-300',
        className
      )}
    >
      {isSaving && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
          <span className="styles.colors.text.tertiary">Guardando...</span>
        </>
      )}

      {!isSaving && showSaved && (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
          <span className="text-green-400">Guardado</span>
        </>
      )}

      {!isSaving && !showSaved && lastSaved && (
        <>
          <Cloud className="h-3.5 w-3.5 styles.colors.text.tertiary" />
          <span className="styles.colors.text.tertiary">
            {formatTime(lastSaved)}
          </span>
        </>
      )}
    </div>
  )
}

/**
 * AutosaveBadge - Compact floating badge version
 */
export function AutosaveBadge({
  isSaving,
  lastSaved,
  className,
}: AutosaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    if (!isSaving && lastSaved) {
      setShowSaved(true)
      const timer = setTimeout(() => setShowSaved(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isSaving, lastSaved])

  if (!isSaving && !showSaved) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed top-20 right-4 z-50 flex items-center gap-2 rounded-full px-3 py-2 shadow-lg backdrop-blur-xl border transition-all duration-300',
        isSaving
          ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
          : 'bg-green-500/20 border-green-500/50 text-green-300',
        className
      )}
    >
      {isSaving ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="text-xs font-medium">Guardando</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Guardado</span>
        </>
      )}
    </div>
  )
}
