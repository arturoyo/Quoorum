/**
 * PhaseExpertos / Participantes (Unified - Typeform Style)
 *
 * Phase 2: "¿Quién interviene?" — Expertos, Departamentos, Profesionales (1, 2 o los 3).
 * Por cada tipo elegido se muestra un desplegable con el selector correspondiente.
 */

'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Users, ArrowRight, Building2, UserCircle, AlertCircle, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ExpertSelector } from '@/components/quoorum/expert-selector'
import { DepartmentSelector } from '@/components/quoorum/department-selector'
import { WorkerSelector } from '@/components/quoorum/worker-selector'
import { DebateStickyHeader } from './debate-sticky-header'
import type { ExpertosState, ContextoState } from '../types'
import type { PhaseCostEstimate } from '@quoorum/quoorum/analytics/phase-cost-estimator'
import {
  estimateExpertSelectionPhaseCost,
  estimateStrategyPhaseCost,
  estimateDebateExecutionCost,
} from '@quoorum/quoorum/analytics/phase-cost-estimator'

interface PhaseExpertosProps {
  state: ExpertosState
  contexto: ContextoState
  onParticipantUpdate: (update: Partial<ExpertosState>) => void
  onContinue?: () => void
  creditBalance?: number
  accumulatedCosts?: PhaseCostEstimate[]
  currentPhaseCost?: PhaseCostEstimate
}

export function PhaseExpertos({
  state,
  contexto,
  onParticipantUpdate,
  onContinue,
  creditBalance = 0,
  accumulatedCosts = [],
  currentPhaseCost,
}: PhaseExpertosProps) {
  const router = useRouter()
  const { participantTypes } = state
  const atLeastOne = participantTypes.expertos || participantTypes.departamentos || participantTypes.trabajadores
  const expertsOk = !participantTypes.expertos || state.selectedExpertIds.length > 0
  const deptsOk = !participantTypes.departamentos || state.selectedDepartmentIds.length > 0
  const workersOk = !participantTypes.trabajadores || state.selectedWorkerIds.length > 0
  const participantsValid = !!atLeastOne && expertsOk && deptsOk && workersOk

  // Calcular coste total estimado (acumulado + fase actual + estimado conservador de fases futuras)
  const totalEstimatedCredits = useMemo(() => {
    let total = accumulatedCosts.reduce((sum, phase) => sum + phase.costCredits, 0)
    if (currentPhaseCost) {
      total += currentPhaseCost.costCredits
    }
    // Estimado conservador para fases futuras (estrategia + debate)
    const strategyEstimate = estimateStrategyPhaseCost({ strategyComplexity: 'medium' })
    const debateEstimate = estimateDebateExecutionCost({
      numExperts: state.selectedExpertIds.length || 4,
      estimatedRounds: 5,
    })
    total += strategyEstimate.costCredits
    total += (debateEstimate.maxCostCredits ?? debateEstimate.costCredits)
    return total
  }, [accumulatedCosts, currentPhaseCost, state.selectedExpertIds.length])

  // Verificar si hay créditos suficientes
  const hasSufficientCredits = creditBalance >= totalEstimatedCredits
  const canContinue = participantsValid && hasSufficientCredits

  const toggleType = (key: keyof typeof participantTypes) => {
    const next = { ...participantTypes, [key]: !participantTypes[key] }
    const update: Partial<ExpertosState> = { participantTypes: next }
    if (!next.expertos) update.selectedExpertIds = []
    if (!next.departamentos) update.selectedDepartmentIds = []
    if (!next.trabajadores) update.selectedWorkerIds = []
    onParticipantUpdate(update)
  }

  const contextStr = Object.entries(contexto.answers)
    .map(([id, answer]) => {
      const q = contexto.questions.find((x) => x.id === id)
      return q ? `${q.content}: ${answer}` : answer
    })
    .join('\n')

  return (
    <div className="w-full max-w-2xl mx-auto">
      <DebateStickyHeader
        phaseNumber={2}
        title="¿Quién interviene en el debate?"
      />
      <div className="mt-4 mb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
          <Users className="h-8 w-8 text-purple-400" />
        </div>
        <p className="text-[var(--theme-text-secondary)]">
          Elige uno, dos o los tres: expertos, departamentos y/o profesionales
        </p>
      </div>

      <div className="space-y-6">
        {/* Selector de tipos */}
        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] p-6">
          <p className="text-sm font-medium text-[var(--theme-text-secondary)] mb-4">Quién interviene</p>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={participantTypes.expertos}
                onCheckedChange={() => toggleType('expertos')}
                className="border-[var(--theme-border)] data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
              />
              <span className="text-[var(--theme-text-primary)] group-hover:text-purple-300 transition-colors">Expertos</span>
              <Sparkles className="h-4 w-4 text-purple-400" />
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={participantTypes.departamentos}
                onCheckedChange={() => toggleType('departamentos')}
                className="border-[var(--theme-border)] data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
              />
              <span className="text-white group-hover:text-purple-300 transition-colors">Departamentos</span>
              <Building2 className="h-4 w-4 text-purple-400" />
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={participantTypes.trabajadores}
                onCheckedChange={() => toggleType('trabajadores')}
                className="border-[var(--theme-border)] data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
              />
              <span className="text-[var(--theme-text-primary)] group-hover:text-purple-300 transition-colors">Profesionales</span>
              <UserCircle className="h-4 w-4 text-purple-400" />
            </label>
          </div>
        </div>

        {/* Expertos */}
        {participantTypes.expertos && (
          <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] p-6">
            <ExpertSelector
              selectedExpertIds={state.selectedExpertIds}
              onSelectionChange={(ids) => onParticipantUpdate({ selectedExpertIds: ids })}
              question={contexto.mainQuestion}
              context={contextStr}
              defaultOpen={true}
            />
          </div>
        )}

        {/* Departamentos */}
        {participantTypes.departamentos && (
          <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] p-6">
            <DepartmentSelector
              selectedDepartmentIds={state.selectedDepartmentIds}
              onSelectionChange={(ids) => onParticipantUpdate({ selectedDepartmentIds: ids })}
              question={contexto.mainQuestion}
              context={contextStr}
              defaultOpen={true}
            />
          </div>
        )}

        {/* Profesionales */}
        {participantTypes.trabajadores && (
          <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] p-6">
            <WorkerSelector
              selectedWorkerIds={state.selectedWorkerIds}
              onSelectionChange={(ids) => onParticipantUpdate({ selectedWorkerIds: ids })}
              question={contexto.mainQuestion}
              context={contextStr}
              selectedDepartmentIds={state.selectedDepartmentIds}
              defaultOpen={true}
            />
          </div>
        )}

        {/* Resumen */}
        {(state.selectedExpertIds.length > 0 || state.selectedDepartmentIds.length > 0 || state.selectedWorkerIds.length > 0) && (
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
            <p className="text-sm text-purple-300">
              <Sparkles className="inline h-4 w-4 mr-2" />
              {state.selectedExpertIds.length > 0 && (
                <span>{state.selectedExpertIds.length} experto{state.selectedExpertIds.length !== 1 ? 's' : ''}</span>
              )}
              {state.selectedExpertIds.length > 0 && (state.selectedDepartmentIds.length > 0 || state.selectedWorkerIds.length > 0) && <span>, </span>}
              {state.selectedDepartmentIds.length > 0 && (
                <span>{state.selectedDepartmentIds.length} departamento{state.selectedDepartmentIds.length !== 1 ? 's' : ''}</span>
              )}
              {(state.selectedExpertIds.length > 0 || state.selectedDepartmentIds.length > 0) && state.selectedWorkerIds.length > 0 && <span>, </span>}
              {state.selectedWorkerIds.length > 0 && (
                <span>{state.selectedWorkerIds.length} profesional{state.selectedWorkerIds.length !== 1 ? 'es' : ''}</span>
              )}
            </p>
          </div>
        )}

        {/* Alerta de créditos insuficientes */}
        {!hasSufficientCredits && participantsValid && (
          <Alert className="mt-6 border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-red-300">Créditos insuficientes</AlertTitle>
            <AlertDescription className="text-red-200/80 mt-2">
              <div className="space-y-2">
                <p>
                  Tienes <strong>{creditBalance.toLocaleString()} créditos</strong> disponibles, pero necesitas aproximadamente{' '}
                  <strong>{totalEstimatedCredits.toLocaleString()} créditos</strong> para completar este debate.
                </p>
                <p className="text-sm">
                  Faltan aproximadamente <strong>{Math.abs(creditBalance - totalEstimatedCredits).toLocaleString()} créditos</strong>.
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

        {onContinue && (
          <div className="flex flex-col items-center gap-4 pt-4">
            {!hasSufficientCredits && participantsValid && (
              <p className="text-sm text-amber-400 text-center">
                [WARN] No puedes continuar sin créditos suficientes
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
    </div>
  )
}
