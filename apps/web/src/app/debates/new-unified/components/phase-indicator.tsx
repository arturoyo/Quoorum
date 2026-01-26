/**
 * PhaseIndicator Component
 * 
 * Visual indicator of the 5 phases (tipo Typeform) at the top of the page.
 * Shows current phase, completed phases, and allows clicking to navigate.
 * Displays progress percentage in a circular indicator.
 */

'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { UnifiedPhase, PhaseProgress } from '../types'
import type { PhaseCostEstimate } from '@quoorum/quoorum/analytics/phase-cost-estimator'

interface PhaseIndicatorProps {
  currentPhase: UnifiedPhase
  phaseProgress: PhaseProgress
  onPhaseClick: (phase: UnifiedPhase) => void
  /** Props para el balance de créditos */
  creditBalance?: number
  accumulatedCosts?: PhaseCostEstimate[]
  currentPhaseCost?: PhaseCostEstimate
  estimatedDebateCost?: { min: number; max: number }
}

const PHASES = [
  { number: 1, name: 'Contexto', key: 'contexto' as const },
  { number: 2, name: 'Expertos', key: 'expertos' as const },
  { number: 3, name: 'Estrategia', key: 'estrategia' as const },
  { number: 4, name: 'Revisión', key: 'revision' as const },
  { number: 5, name: 'Debate', key: 'debate' as const },
] as const

export function PhaseIndicator({ 
  currentPhase, 
  phaseProgress, 
  onPhaseClick,
  // Props de créditos mantenidas por compatibilidad pero no usadas visualmente
  creditBalance: _creditBalance = 0,
  accumulatedCosts: _accumulatedCosts = [],
  currentPhaseCost: _currentPhaseCost,
  estimatedDebateCost: _estimatedDebateCost,
}: PhaseIndicatorProps) {
  // Calculate overall progress - use useMemo to ensure consistent calculation
  const overallProgress = useMemo(() => {
    const values = Object.values(phaseProgress)
    if (values.length === 0) return 0
    return values.reduce((sum, progress) => sum + progress, 0) / values.length
  }, [phaseProgress])
  
  const getPhaseStatus = (phaseNumber: UnifiedPhase) => {
    if (phaseNumber < currentPhase) return 'completed'
    if (phaseNumber === currentPhase) return 'active'
    return 'pending'
  }
  
  const canClickPhase = (phaseNumber: UnifiedPhase) => {
    if (phaseNumber === currentPhase) return true
    if (phaseNumber < currentPhase) return true // Can go back
    // Can go forward only if previous phase is completed
    const prevPhase = phaseNumber - 1
    if (prevPhase >= 1) {
      const prevPhaseKey = PHASES[prevPhase - 1]!.key
      return phaseProgress[prevPhaseKey] === 100
    }
    return false
  }
  
  return (
    <div className="fixed left-0 right-0 w-full bg-[var(--theme-bg-secondary)] border-t border-[var(--theme-border)] pt-4 pb-4 shadow-lg z-50 bottom-[70px]">
      <div className="container mx-auto px-4 flex items-start gap-4">
        {/* Área de etiquetas + barra: mismo ancho, sin invadir el círculo del % */}
        <div className="flex-1 min-w-0">
          {/* Etiquetas 1–Contexto … 5–Debate: ancho de toda la barra */}
          <div className="flex items-center justify-between mb-3">
            {PHASES.map((phase) => {
              const status = getPhaseStatus(phase.number as UnifiedPhase)
              const isClickable = canClickPhase(phase.number as UnifiedPhase)

              return (
                <button
                  key={phase.number}
                  onClick={() => isClickable && onPhaseClick(phase.number as UnifiedPhase)}
                  disabled={!isClickable}
                  className={cn(
                    'text-sm font-semibold transition-colors whitespace-nowrap',
                    status === 'active' && 'text-[var(--theme-text-primary)]',
                    status === 'completed' && 'text-purple-300',
                    status === 'pending' && 'text-[var(--theme-text-tertiary)]',
                    !isClickable && 'cursor-not-allowed opacity-50',
                    isClickable && 'cursor-pointer hover:text-purple-400'
                  )}
                >
                  {phase.number} - {phase.name}
                </button>
              )
            })}
          </div>
          {/* Barra de progreso: mismo ancho que las etiquetas */}
          <div className="relative h-4 bg-[var(--theme-bg-input)] rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-purple-400 to-blue-500 transition-all duration-700 ease-out rounded-full"
              style={{ width: `${Math.max(overallProgress, 5)}%` }}
            />
          </div>
        </div>

        {/* Círculo del %: fuera del ancho de la barra */}
        <div className="flex-shrink-0">
          {/* Círculo del % */}
          <div className="w-12 h-12 rounded-full bg-purple-600 border-2 border-purple-400 flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-[var(--theme-text-primary)]" suppressHydrationWarning>
              {Math.round(overallProgress)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
