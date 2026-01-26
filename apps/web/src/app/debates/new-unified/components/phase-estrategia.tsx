/**
 * PhaseEstrategia Component (Unified - Typeform Style)
 * 
 * Phase 3: Strategy selection with visual cards.
 */

'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Target, ArrowRight, AlertCircle, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StrategySelector } from '@/components/quoorum/strategy-selector'
import { DebateStickyHeader } from './debate-sticky-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { EstrategiaState, ContextoState } from '../types'
import type { PhaseCostEstimate } from '@quoorum/quoorum/analytics/phase-cost-estimator'

interface PhaseEstrategiaProps {
  state: EstrategiaState
  contexto: ContextoState
  onStrategySelect: (strategy: string) => void
  onContinue?: () => void
  creditBalance?: number
  accumulatedCosts?: PhaseCostEstimate[]
  currentPhaseCost?: PhaseCostEstimate
  estimatedDebateCost?: { min: number; max: number }
}

export function PhaseEstrategia({
  state,
  contexto,
  onStrategySelect,
  onContinue,
  creditBalance = 0,
  accumulatedCosts = [],
  currentPhaseCost,
  estimatedDebateCost,
}: PhaseEstrategiaProps) {
  const router = useRouter()
  
  // Calcular coste total estimado
  const totalEstimatedCredits = useMemo(() => {
    let total = accumulatedCosts.reduce((sum, phase) => sum + phase.costCredits, 0)
    if (currentPhaseCost) {
      total += currentPhaseCost.costCredits
    }
    if (estimatedDebateCost) {
      total += estimatedDebateCost.max // Usar el máximo para ser conservador
    }
    return total
  }, [accumulatedCosts, currentPhaseCost, estimatedDebateCost])
  
  // Verificar si hay créditos suficientes
  const hasSufficientCredits = creditBalance >= totalEstimatedCredits
  const canContinue = !!state.selectedStrategy && hasSufficientCredits
  return (
    <div className="w-full max-w-2xl mx-auto">
      <DebateStickyHeader
        phaseNumber={3}
        title="Selecciona la Estrategia"
      />
      <div className="mt-4 mb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
          <Target className="h-8 w-8 text-purple-400" />
        </div>
        <p className="text-[var(--theme-text-secondary)]">
          Elige cómo quieres que se desarrolle el debate
        </p>
      </div>
      <div className="bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-lg p-6">
        <StrategySelector
          question={contexto.mainQuestion}
          onStrategySelect={onStrategySelect}
          selectedPattern={state.selectedStrategy}
        />
      </div>
      
      {/* Selection Summary */}
      {state.selectedStrategy && (
        <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <p className="text-sm text-purple-300">
            <Sparkles className="inline h-4 w-4 mr-2" />
            Estrategia seleccionada: <strong>{state.selectedStrategy}</strong>
          </p>
        </div>
      )}

      {/* Alerta de créditos insuficientes */}
      {!hasSufficientCredits && state.selectedStrategy && (
        <Alert className="mt-6 border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-300">Créditos insuficientes</AlertTitle>
          <AlertDescription className="text-red-200/80 mt-2">
            <div className="space-y-2">
              <p>
                Tienes <strong>{creditBalance.toLocaleString()} créditos</strong> disponibles, pero necesitas{' '}
                <strong>{totalEstimatedCredits.toLocaleString()} créditos</strong> para completar este debate.
              </p>
              <p className="text-sm">
                Faltan <strong>{Math.abs(creditBalance - totalEstimatedCredits).toLocaleString()} créditos</strong>.
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => router.push('/pricing')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Coins className="mr-2 h-4 w-4" />
                  Ver Planes y Precios
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/settings/billing')}
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
                >
                  Gestionar Créditos
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Botón Seguir */}
      {onContinue && (
        <div className="flex flex-col items-center gap-4 pt-6">
          {!hasSufficientCredits && state.selectedStrategy && (
            <p className="text-sm text-amber-400 text-center">
              ⚠️ No puedes continuar sin créditos suficientes
            </p>
          )}
          <Button
            onClick={onContinue}
            disabled={!canContinue}
            className="h-12 px-8 bg-purple-600 hover:bg-purple-700 text-white text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Seguir
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
