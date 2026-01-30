/**
 * PhaseIndicator Component
 *
 * Visual indicator of the 5 phases (tipo Typeform) at the top of the page.
 * Shows current phase, completed phases, and allows clicking to navigate.
 * Displays progress percentage and credit balance.
 */

'use client'

import { useMemo } from 'react'
import { cn, styles } from '@/lib/utils'
import { Coins } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
  creditBalance = 0,
  accumulatedCosts = [],
  currentPhaseCost,
  estimatedDebateCost,
}: PhaseIndicatorProps) {
  // Calculate overall progress - use useMemo to ensure consistent calculation
  const overallProgress = useMemo(() => {
    const values = Object.values(phaseProgress)
    if (values.length === 0) return 0
    return values.reduce((sum, progress) => sum + progress, 0) / values.length
  }, [phaseProgress])

  // Calculate accumulated cost
  const accumulatedCredits = useMemo(() => {
    return accumulatedCosts.reduce((sum, phase) => sum + phase.costCredits, 0)
  }, [accumulatedCosts])

  // Calculate total estimated cost
  const totalEstimatedCredits = useMemo(() => {
    let total = accumulatedCredits
    if (currentPhaseCost) {
      total += currentPhaseCost.costCredits
    }
    if (estimatedDebateCost) {
      total += estimatedDebateCost.max
    }
    return total
  }, [accumulatedCredits, currentPhaseCost, estimatedDebateCost])

  const estimatedRemainingCredits = creditBalance - totalEstimatedCredits
  
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
    <div className={cn(
      'fixed left-0 right-0 w-full border-t pt-4 pb-4 shadow-lg z-50 bottom-[70px]',
      styles.colors.bg.secondary,
      styles.colors.border.default
    )}>
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
                    status === 'active' && styles.colors.text.primary,
                    status === 'completed' && 'text-purple-300',
                    status === 'pending' && styles.colors.text.tertiary,
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
          <div className={cn('relative h-4 rounded-full overflow-hidden', styles.colors.bg.input)}>
            <div
              className={cn(
                'absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-purple-400 to-blue-500 transition-all duration-700 ease-out rounded-full',
                `w-[${Math.max(overallProgress, 5)}%]`
              )}
            />
          </div>
        </div>

        {/* Círculo del % y Balance de créditos */}
        <div className="flex-shrink-0 flex items-center gap-3">
          {/* Círculo del % */}
          <div className="w-12 h-12 rounded-full bg-purple-600 border-2 border-purple-400 flex items-center justify-center shadow-lg">
            <span className={cn('text-sm font-bold', styles.colors.text.primary)} suppressHydrationWarning>
              {Math.round(overallProgress)}%
            </span>
          </div>

          {/* Balance de créditos */}
          {creditBalance > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 cursor-help">
                    <Coins className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-purple-300">
                      {totalEstimatedCredits.toLocaleString()}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs styles.colors.bg.secondary border-purple-500/30">
                  <div className="space-y-2 p-1">
                    <div className="font-semibold styles.colors.text.primary">Créditos del Debate</div>
                    {accumulatedCredits > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="styles.colors.text.secondary">Fases completadas:</span>
                        <span className="text-amber-400">{accumulatedCredits} créditos</span>
                      </div>
                    )}
                    {currentPhaseCost && (
                      <div className="flex justify-between text-sm">
                        <span className="styles.colors.text.secondary">Fase actual:</span>
                        <span className="text-purple-300">~{currentPhaseCost.costCredits} créditos</span>
                      </div>
                    )}
                    {estimatedDebateCost && (
                      <div className="flex justify-between text-sm">
                        <span className="styles.colors.text.secondary">Debate estimado:</span>
                        <span className="text-purple-300">~{estimatedDebateCost.min}-{estimatedDebateCost.max}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-1 border-t border-purple-500/20">
                      <span className="styles.colors.text.secondary">Total debate:</span>
                      <span className="font-bold styles.colors.text.primary">
                        ~{totalEstimatedCredits.toLocaleString()} créditos
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="styles.colors.text.secondary">Restantes estimados:</span>
                      <span className={cn(
                        'font-bold',
                        estimatedRemainingCredits >= 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        ~{estimatedRemainingCredits.toLocaleString()} créditos
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  )
}
