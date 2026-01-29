/**
 * SuggestedAnswerCard — Plantilla reutilizable para opciones de respuesta
 *
 * Usado en: QuestionCard (respuestas sugeridas), y cualquier flujo de debates
 * que muestre opciones seleccionables con título, descripción e icono.
 */

'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SuggestedAnswerCardProps {
  id: string
  /** Título corto (ej. "Análisis estratégico completo") */
  description: string
  /** Texto completo de la opción */
  text: string
  onClick: () => void
  disabled?: boolean
  /** Clases extra para el contenedor */
  className?: string
}

export function SuggestedAnswerCard({
  id,
  description,
  text,
  onClick,
  disabled = false,
  className,
}: SuggestedAnswerCardProps) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full p-4 rounded-lg border-2 text-left transition-all',
        'bg-blue-500/10 border-blue-500/30 text-[var(--theme-text-primary)]',
        'hover:border-blue-500 hover:bg-blue-500/20',
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-200 mb-1 break-words">
            {description}
          </p>
          <p className="text-sm text-[var(--theme-text-secondary)] leading-relaxed break-words whitespace-pre-wrap">
            {text}
          </p>
        </div>
        <ArrowRight className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
      </div>
    </button>
  )
}
