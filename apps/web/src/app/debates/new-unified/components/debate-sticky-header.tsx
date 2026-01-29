/**
 * DebateStickyHeader — Header fijo reutilizable en todas las fases del debate
 *
 * Muestra siempre visible: badges (ej. Pregunta 1, Pregunta crítica o Fase X) y el título.
 * Usado en QuestionCard y en todas las fases (Expertos, Estrategia, Revisión, Debate).
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface DebateStickyHeaderProps {
  /** Contenido opcional arriba del todo (ej. barra de progreso de contexto), dentro del sticky */
  topContent?: React.ReactNode
  /** Badges (ej. "Pregunta 1", "Pregunta crítica" o "Fase 2") */
  badges?: React.ReactNode
  /** Número de fase (1-5). Si se proporciona, el badge de fase se mostrará en la misma línea que el título */
  phaseNumber?: number
  /** Título principal (pregunta o nombre de la fase) */
  title: string
  /** Subtítulo opcional que aparece debajo del título dentro del mismo elemento */
  subtitle?: string
  /** Acciones opcionales a la derecha (ej. Ver resumen) */
  actions?: React.ReactNode
  /** Clases extra para el contenedor */
  className?: string
}

export function DebateStickyHeader({
  topContent,
  badges,
  phaseNumber,
  title,
  subtitle,
  actions,
  className,
}: DebateStickyHeaderProps) {
  // Calcular tamaño de fuente dinámico basado en la longitud del texto
  // Preguntas cortas (< 50): text-3xl sm:text-4xl
  // Preguntas intermedias (50-100): tamaño proporcional
  // Preguntas largas (> 100): text-xl sm:text-2xl
  const getFontSize = (textLength: number): string => {
    if (textLength < 50) {
      // Pregunta corta: tamaño grande
      return 'text-3xl sm:text-4xl'
    } else if (textLength > 100) {
      // Pregunta larga: tamaño pequeño
      return 'text-xl sm:text-2xl'
    } else {
      // Pregunta intermedia: tamaño proporcional
      // Interpolación lineal entre 50 y 100 caracteres
      // textLength 50 → text-3xl sm:text-4xl
      // textLength 100 → text-xl sm:text-2xl
      const ratio = (textLength - 50) / 50 // 0 a 1
      
      // Tamaños intermedios disponibles en Tailwind
      // text-3xl (1.875rem) → text-2xl (1.5rem) → text-xl (1.25rem)
      if (ratio < 0.33) {
        // 50-66 caracteres: text-2xl sm:text-3xl
        return 'text-2xl sm:text-3xl'
      } else if (ratio < 0.66) {
        // 66-83 caracteres: text-xl sm:text-2xl
        return 'text-xl sm:text-2xl'
      } else {
        // 83-100 caracteres: text-lg sm:text-xl
        return 'text-lg sm:text-xl'
      }
    }
  }
  
  const fontSizeClass = getFontSize(title.length)
  
  return (
    <div
      className={cn(
        'fixed top-16 left-0 right-0 z-30',
        'bg-[var(--theme-bg-secondary)]',
        'border-b border-[var(--theme-border)] shadow-[0_4px_12px_-2px_rgba(0,0,0,0.6)]',
        'px-4 pt-[5px] pb-2',
        'flex flex-col',
        className
      )}
    >
      <div className="w-full max-w-2xl mx-auto">
        {topContent != null ? (
          <div className="mb-2">{topContent}</div>
        ) : null}
        {/* Badges que no son de fase (ej. "Pregunta 1", "Pregunta crítica") - solo si no hay phaseNumber */}
        {badges && phaseNumber == null && (
          <div className="flex items-center flex-wrap gap-2 flex-shrink-0 mb-2">
            <div className="flex items-center flex-wrap gap-2 flex-1 min-w-0">
              {badges}
            </div>
            {actions}
          </div>
        )}
        {/* Si hay acciones pero no badges de fase, mostrarlas aquí */}
        {actions && phaseNumber != null && (
          <div className="flex items-center justify-end mb-2">
            {actions}
          </div>
        )}
        <div className="pt-2">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Badge de fase a la izquierda del título con padding de 5px */}
            {phaseNumber != null && (
              <div className="py-[5px] flex items-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Fase {phaseNumber}
                </span>
              </div>
            )}
            <h2 className={cn(
              'font-bold text-[var(--theme-text-primary)] leading-tight break-words flex-1 min-w-0',
              fontSizeClass
            )}>
              {title}
            </h2>
            {/* Acciones a la derecha del título si hay phaseNumber */}
            {actions && phaseNumber != null && (
              <div className="ml-auto">
                {actions}
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-base sm:text-lg text-[var(--theme-text-tertiary)] mt-2 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
