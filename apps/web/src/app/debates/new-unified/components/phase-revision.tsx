/**
 * PhaseRevision Component (Unified - Typeform Style)
 * 
 * Phase 4: Review and confirm before creating debate.
 */

'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Edit, Sparkles, Loader2, Users, Building2, UserCircle, AlertCircle, Coins } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { DebateStickyHeader } from './debate-sticky-header'
import { CreditCounter } from '@/components/quoorum/credit-counter'
import {
  estimateContextPhaseCost,
  estimateExpertSelectionPhaseCost,
  estimateStrategyPhaseCost,
  estimateDebateExecutionCost,
} from '@quoorum/quoorum/analytics/phase-cost-estimator'
import type { PhaseCostEstimate } from '@quoorum/quoorum/analytics/phase-cost-estimator'
import type { RevisionState, ContextoState, ExpertosState, EstrategiaState } from '../types'

interface PhaseRevisionProps {
  state: RevisionState
  contexto: ContextoState
  expertos: ExpertosState
  estrategia: EstrategiaState
  onEditPhase: (phase: 1 | 2 | 3) => void
  onCreateDebate: () => void
  isCreating: boolean
  creditBalance?: number
}

export function PhaseRevision({
  state,
  contexto,
  expertos,
  estrategia: _estrategia,
  onEditPhase,
  onCreateDebate,
  isCreating,
  creditBalance = 0,
}: PhaseRevisionProps) {
  const router = useRouter()
  const { data: expertsList } = api.experts.getByIds.useQuery(
    { ids: expertos.selectedExpertIds },
    { enabled: expertos.selectedExpertIds.length > 0 }
  )
  const { data: company } = api.companies.get.useQuery()
  const { data: departmentsList } = api.departments.list.useQuery(
    { companyId: company?.id ?? '' },
    { enabled: !!company?.id }
  )
  // Filtrar solo UUIDs válidos (profesionales siempre son UUIDs, no slugs)
  const validWorkerIds = React.useMemo(() => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return expertos.selectedWorkerIds.filter((id) => uuidRegex.test(id))
  }, [expertos.selectedWorkerIds])

  const { data: workersList } = api.workers.getByIds.useQuery(
    { ids: validWorkerIds },
    { enabled: validWorkerIds.length > 0 }
  )

  const selectedDepartmentNames = useMemo(() => {
    if (!departmentsList || expertos.selectedDepartmentIds.length === 0) return []
    const byId = new Map(
      departmentsList.map((d: { id: string; name: string }) => [d.id, d.name] as const)
    )
    return expertos.selectedDepartmentIds
      .map((id) => byId.get(id))
      .filter((n): n is string => !!n)
  }, [departmentsList, expertos.selectedDepartmentIds])

  const expertNames = useMemo(() => {
    const list = expertsList ?? []
    const byId = new Map(
      list.map((e: { id: string; name: string }) => [e.id, e.name] as const)
    )
    return expertos.selectedExpertIds.map((id) => byId.get(id)).filter((n): n is string => !!n)
  }, [expertsList, expertos.selectedExpertIds])

  const workerNames = useMemo(() => {
    const list = workersList ?? []
    const byId = new Map(
      list.map((w: { id: string; name: string }) => [w.id, w.name] as const)
    )
    // Usar validWorkerIds en lugar de selectedWorkerIds para evitar slugs
    return validWorkerIds.map((id) => byId.get(id)).filter((n): n is string => !!n)
  }, [workersList, validWorkerIds])

  const hasParticipantes = expertos.participantTypes.expertos || expertos.participantTypes.departamentos || expertos.participantTypes.trabajadores

  // Calcular costes acumulados
  const accumulatedCosts = useMemo<PhaseCostEstimate[]>(() => {
    const costs: PhaseCostEstimate[] = []
    
    // Fase 1: Contexto
    const criticalQuestions = contexto.questions.filter(q => q.priority === 'critical').length
    if (criticalQuestions > 0) {
      costs.push(estimateContextPhaseCost({ numCriticalQuestions: criticalQuestions }))
    }
    
    // Fase 2: Expertos
    costs.push(estimateExpertSelectionPhaseCost({
      numExperts: expertos.selectedExpertIds.length,
      numDepartments: expertos.selectedDepartmentIds.length,
      numWorkers: expertos.selectedWorkerIds.length,
    }))
    
    // Fase 3: Estrategia
    costs.push(estimateStrategyPhaseCost({
      strategyComplexity: estrategia.selectedStrategy ? 'medium' : 'simple',
    }))
    
    return costs
  }, [contexto.questions, expertos, estrategia])

  // Calcular coste estimado del debate
  const debateEstimate = useMemo(() => {
    const estimate = estimateDebateExecutionCost({
      numExperts: expertos.selectedExpertIds.length || 4,
      estimatedRounds: 5,
    })
    
    return {
      min: estimate.minCostCredits ?? estimate.costCredits,
      max: estimate.maxCostCredits ?? estimate.costCredits,
    }
  }, [expertos.selectedExpertIds.length])

  // Calcular coste total estimado
  const totalEstimatedCredits = useMemo(() => {
    const accumulated = accumulatedCosts.reduce((sum, phase) => sum + phase.costCredits, 0)
    return accumulated + debateEstimate.max // Usar el máximo para ser conservador
  }, [accumulatedCosts, debateEstimate])

  // Verificar si hay créditos suficientes
  const hasSufficientCredits = creditBalance >= totalEstimatedCredits

  return (
    <div className="w-full max-w-2xl mx-auto">
      <DebateStickyHeader
        phaseNumber={4}
        title="Revisa tu Debate"
      />
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <p className="text-[var(--theme-text-tertiary)]">
          Verifica que todo esté correcto antes de crear el debate
        </p>
      </div>
      <div className="space-y-4">
        {/* Question */}
        <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-[var(--theme-text-tertiary)]">Pregunta Principal</span>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                    Fase 1
                  </Badge>
                </div>
                <p className="text-lg text-white">{state.summary.question}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditPhase(1)}
                className="text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)]"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumen del contexto (preguntas y respuestas de la Fase 1) */}
        {(Object.keys(contexto.answers).length > 0 || contexto.internetSearch?.context) && (
          <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[var(--theme-text-tertiary)]">Resumen del contexto</span>
                    <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                      Fase 1
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--theme-text-tertiary)]">
                    {Object.keys(contexto.answers).length} pregunta{Object.keys(contexto.answers).length !== 1 ? 's' : ''} respondida{Object.keys(contexto.answers).length !== 1 ? 's' : ''}
                    {contexto.internetSearch?.context ? ' · Contexto de internet incluido' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-lg font-bold text-[var(--theme-text-primary)] tabular-nums">
                    {state.summary.contextScore}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditPhase(1)}
                    className="text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)]"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                {contexto.questions
                  .filter((q) => contexto.answers[q.id])
                  .map((q) => (
                    <div
                      key={q.id}
                      className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-primary)]/60 p-4"
                    >
                      <p className="text-sm font-medium text-purple-300 mb-2">{q.content}</p>
                      <p className="text-sm text-[var(--theme-text-secondary)] whitespace-pre-wrap">
                        {contexto.answers[q.id]}
                      </p>
                    </div>
                  ))}
                {contexto.internetSearch?.context && (
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                    <p className="text-xs font-medium text-blue-300 mb-2">
                      Contexto de internet
                    </p>
                    <p className="text-sm text-[#aebac1] whitespace-pre-wrap">
                      {contexto.internetSearch.context}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Participantes (Expertos, Departamentos, Profesionales) */}
        {hasParticipantes && (
          <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--theme-text-tertiary)]">Participantes</span>
                    <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                      Fase 2
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {expertos.participantTypes.expertos && (
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-[var(--theme-text-tertiary)] mb-1">Expertos</p>
                          <p className="text-sm text-[var(--theme-text-primary)]">
                            {expertNames.length > 0
                              ? expertNames.join(', ')
                              : expertos.selectedExpertIds.length > 0
                                ? `${expertos.selectedExpertIds.length} seleccionado${expertos.selectedExpertIds.length !== 1 ? 's' : ''}`
                                : 'Ninguno'}
                          </p>
                        </div>
                      </div>
                    )}
                    {expertos.participantTypes.departamentos && (
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-[var(--theme-text-tertiary)] mb-1">Departamentos</p>
                          <p className="text-sm text-[var(--theme-text-primary)]">
                            {selectedDepartmentNames.length > 0
                              ? selectedDepartmentNames.join(', ')
                              : expertos.selectedDepartmentIds.length > 0
                                ? `${expertos.selectedDepartmentIds.length} seleccionado${expertos.selectedDepartmentIds.length !== 1 ? 's' : ''}`
                                : 'Ninguno'}
                          </p>
                        </div>
                      </div>
                    )}
                    {expertos.participantTypes.trabajadores && (
                      <div className="flex items-start gap-2">
                        <UserCircle className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-[var(--theme-text-tertiary)] mb-1">Profesionales</p>
                          <p className="text-sm text-[var(--theme-text-primary)]">
                            {workerNames.length > 0
                              ? workerNames.join(', ')
                              : validWorkerIds.length > 0
                                ? `${validWorkerIds.length} seleccionado${validWorkerIds.length !== 1 ? 's' : ''}`
                                : 'Ninguno'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditPhase(2)}
                  className="text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)]"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Strategy */}
        <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-[var(--theme-text-tertiary)]">Estrategia</span>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                    Fase 3
                  </Badge>
                </div>
                <p className="text-lg text-[var(--theme-text-primary)]">{state.summary.strategy}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditPhase(3)}
                className="text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)]"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown - Solo en fase de revisión */}
        <CreditCounter
          variant="full"
          currentPhase="revision"
          accumulatedCosts={accumulatedCosts}
          estimatedDebateCost={debateEstimate}
          showBreakdown={true}
        />

        {/* Alerta de créditos insuficientes */}
        {!hasSufficientCredits && (
          <Alert className="mt-6 border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-red-300">Créditos insuficientes</AlertTitle>
            <AlertDescription className="text-red-200/80 mt-2">
              <div className="space-y-2">
                <p>
                  Tienes <strong>{creditBalance.toLocaleString()} créditos</strong> disponibles, pero necesitas{' '}
                  <strong>{totalEstimatedCredits.toLocaleString()} créditos</strong> para crear este debate.
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

        {/* Create Button */}
        <div className="flex flex-col items-center gap-4 pt-6">
          {!hasSufficientCredits && (
            <p className="text-sm text-amber-400 text-center">
              [WARN] No puedes crear el debate sin créditos suficientes
            </p>
          )}
          <Button
            onClick={onCreateDebate}
            disabled={!state.canProceed || !hasSufficientCredits || isCreating}
            className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creando debate...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Crear Debate
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
