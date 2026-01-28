/**
 * NewUnifiedDebatePage with Dynamic Session ID
 *
 * This page creates a unique URL for each new debate session.
 * Each session ID ensures a fresh start, even if the user navigates back.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { logger } from '@/lib/logger'
import { api } from '@/lib/trpc/client'
import { useUnifiedDebateState } from '../hooks/use-unified-debate-state'
import { cn } from '@/lib/utils'
import {
  PhaseIndicator,
  PhaseContexto,
  PhaseExpertos,
  PhaseEstrategia,
  PhaseRevision,
  PhaseDebate,
} from '../components'
import { useParams } from 'next/navigation'
import { useTRPCHealth } from '@/hooks/use-trpc-health'
import { createClient } from '@/lib/supabase/client'
import {
  estimateContextPhaseCost,
  estimateExpertSelectionPhaseCost,
  estimateStrategyPhaseCost,
  estimateDebateExecutionCost,
  calculateTotalAccumulatedCost,
} from '@quoorum/quoorum/analytics/phase-cost-estimator'
import type { PhaseCostEstimate } from '@quoorum/quoorum/analytics/phase-cost-estimator'

export default function NewUnifiedDebatePageWithSession() {
  const params = useParams()
  const sessionId = params?.sessionId as string | undefined

  // ═══════════════════════════════════════════════════════════
  // TODOS LOS HOOKS PRIMERO - React Rules of Hooks
  // Los hooks DEBEN llamarse incondicionalmente al inicio
  // ═══════════════════════════════════════════════════════════

  // Get context hub (centralized user context)
  const { data: contextHub } = api.debates.getUserContextHub.useQuery(
    undefined,
    {
      enabled: !!sessionId,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )

  // Hook de estado del debate (usa sessionId || '' para evitar undefined)
  // Pass contextHub text to mutations to avoid redundant queries
  const state = useUnifiedDebateState(sessionId || '', contextHub?.fullContextText)

  // Monitorear salud del servidor tRPC
  const { isHealthy: _isServerHealthy } = useTRPCHealth({
    enabled: !!sessionId,
    checkInterval: 30000,
    onHealthChange: (isHealthy) => {
      if (!isHealthy) {
        logger.warn('[NewUnifiedDebatePage] Servidor tRPC no disponible')
      }
    },
  })

  // Get current user to check if admin
  const { data: currentUser } = api.users.getMe.useQuery(undefined, {
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('404')) {
        return false
      }
      return failureCount < 2
    },
    enabled: !!sessionId,
  })

  const isAdmin = currentUser?.isAdmin ?? false

  // Check authentication status before making queries
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    setIsCheckingAuth(true)

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) {
        setIsAuthenticated(!!user)
        setIsCheckingAuth(false)
      }
    })

    const subscription = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setIsAuthenticated(!!session?.user)
        setIsCheckingAuth(false)
      }
    })

    return () => {
      mounted = false
      subscription.data.subscription.unsubscribe()
    }
  }, [supabase.auth])

  // Obtener balance de créditos para el PhaseIndicator (solo si está autenticado)
  const { data: planData } = api.billing.getCurrentPlan.useQuery(undefined, {
    enabled: !isCheckingAuth && isAuthenticated,
    retry: false,
    onError: () => {
      // Silenciar errores de autenticación (ya manejados por enabled)
    },
  })
  const creditBalance = planData?.credits ?? 0

  // ═══════════════════════════════════════════════════════════
  // EARLY RETURNS - Después de todos los hooks
  // ═══════════════════════════════════════════════════════════

  // Si no hay sessionId, mostrar error
  if (!sessionId) {
    return (
      <div className="h-screen bg-[var(--theme-bg-primary)] flex items-center justify-center">
        <div className="text-center text-[var(--theme-text-primary)] max-w-md">
          <h2 className="text-2xl font-bold mb-4">Error: Sesión no válida</h2>
          <p className="text-[var(--theme-text-tertiary)] mb-4">
            No se pudo crear una nueva sesión de debate. Por favor, intenta de nuevo.
          </p>
          <button
            onClick={() => {
              const newSessionId = window.crypto?.randomUUID() || `${Date.now()}-${Math.random()}`
              window.location.href = `/debates/new-unified/${newSessionId}`
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Crear Nuevo Debate
          </button>
        </div>
      </div>
    )
  }

  // Si el estado no está listo, mostrar loading
  if (!state) {
    return (
      <div className="h-screen bg-[var(--theme-bg-primary)] flex items-center justify-center">
        <div className="text-center text-[var(--theme-text-primary)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-[var(--theme-text-tertiary)]">Cargando debate...</p>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // COST CALCULATION
  // ═══════════════════════════════════════════════════════════

  // Calcular costes acumulados de fases completadas
  // IMPORTANTE: Una fase se considera "completada" cuando currentPhase > phaseNumber
  // Ejemplo: Si currentPhase = 2, entonces fase 1 está completada
  const accumulatedCosts = React.useMemo<PhaseCostEstimate[]>(() => {
    const costs: PhaseCostEstimate[] = []
    
    // Fase 1: Contexto - completada si currentPhase > 1
    if (state.currentPhase > 1) {
      const criticalQuestions = state.contexto.questions.filter(q => q.priority === 'critical').length
      if (criticalQuestions > 0) {
        costs.push(estimateContextPhaseCost({ numCriticalQuestions: criticalQuestions }))
      }
    }
    
    // Fase 2: Expertos - completada si currentPhase > 2
    if (state.currentPhase > 2) {
      costs.push(estimateExpertSelectionPhaseCost({
        numExperts: state.expertos.selectedExpertIds.length,
        numDepartments: state.expertos.selectedDepartmentIds.length,
        numWorkers: state.expertos.selectedWorkerIds.length,
      }))
    }
    
    // Fase 3: Estrategia - completada si currentPhase > 3
    if (state.currentPhase > 3) {
      costs.push(estimateStrategyPhaseCost({
        strategyComplexity: state.estrategia.selectedStrategy ? 'medium' : 'simple',
      }))
    }
    
    return costs
  }, [state.currentPhase, state.contexto.questions, state.expertos, state.estrategia])

  // Calcular coste de la fase actual
  // IMPORTANTE: currentPhaseCost muestra el coste de la fase en la que estás actualmente
  // No incluye fases completadas (esas van en accumulatedCosts)
  const currentPhaseCost = React.useMemo<PhaseCostEstimate | undefined>(() => {
    if (state.currentPhase === 1) {
      // En contexto, calcular coste de todas las preguntas críticas respondidas hasta ahora
      const criticalQuestions = state.contexto.questions.filter(q => q.priority === 'critical').length
      if (criticalQuestions > 0) {
        return estimateContextPhaseCost({ numCriticalQuestions: criticalQuestions })
      }
      return undefined
    }
    
    if (state.currentPhase === 2) {
      return estimateExpertSelectionPhaseCost({
        numExperts: state.expertos.selectedExpertIds.length || 4, // Default 4
        numDepartments: state.expertos.selectedDepartmentIds.length,
        numWorkers: state.expertos.selectedWorkerIds.length,
      })
    }
    
    if (state.currentPhase === 3) {
      return estimateStrategyPhaseCost({
        strategyComplexity: state.estrategia.selectedStrategy ? 'medium' : 'simple',
      })
    }
    
    return undefined
  }, [state.currentPhase, state.contexto, state.expertos, state.estrategia])

  // Calcular coste estimado del debate (solo en fase 4+)
  const estimatedDebateCost = React.useMemo<{ min: number; max: number } | undefined>(() => {
    if (state.currentPhase >= 4) {
      const debateEstimate = estimateDebateExecutionCost({
        numExperts: state.expertos.selectedExpertIds.length || 4,
        estimatedRounds: 5, // Default
      })
      
      return {
        min: debateEstimate.minCostCredits ?? debateEstimate.costCredits,
        max: debateEstimate.maxCostCredits ?? debateEstimate.costCredits,
      }
    }
    return undefined
  }, [state.currentPhase, state.expertos])

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleEditPhase = (phase: 1 | 2 | 3) => {
    state.goToPhase(phase)
  }

  return (
    <div className="h-screen bg-[var(--theme-bg-primary)] text-[var(--theme-text-primary)] flex flex-col overflow-hidden relative">
      {/* Main Content (Centered - Typeform Style) — scroll interno */}
      {/* 
        Contenedor scrollable con posicionamiento fixed:
        - top: 64px (AppHeader h-16) + ~110px (DebateStickyHeader) = 174px
        - bottom: ~100px (PhaseIndicator) + ~70px (AppFooter) = 170px
        
        Esto asegura que el scroll quede exactamente entre los elementos fijos
        sin que el contenido se superponga con ellos.
      */}
      <div className="fixed left-0 right-0 top-[174px] bottom-[170px] overflow-y-auto overflow-x-hidden z-10">
        {/* Contenido centrado - SIEMPRE centrado verticalmente para consistencia */}
        <div className="min-h-full flex items-center justify-center py-8">
          <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {state.currentPhase === 1 && (
              <motion.div
                key="contexto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="px-4"
              >
                <PhaseContexto
                  state={state.contexto}
                  contextProgress={state.phaseProgress.contexto}
                  onInitialQuestion={state.handleInitialQuestion}
                  onAnswer={state.handleAnswer}
                  onEditAnswer={state.handleEditAnswer}
                  onEnableInternetSearch={state.handleEnableInternetSearch}
                  onToggleSearchResult={state.handleToggleSearchResult}
                  onUpdateCustomText={state.handleUpdateCustomText}
                  onApplySelectedResults={state.handleApplySelectedResults}
                  onContinueWithInternetContext={state.handleContinueWithInternetContext}
                  onEditInternetSearchSelection={state.handleEditInternetSearchSelection}
                  onDeclineInternetSearch={state.handleDeclineInternetSearch}
                  onClearProgress={state.clearProgress}
                  onSkipToNextPhase={state.skipContextoAndGoToExpertos}
                  isGeneratingQuestions={state.isGeneratingQuestions}
                  isEvaluating={state.isEvaluating}
                  isAdmin={isAdmin}
                />
              </motion.div>
            )}
            
            {state.currentPhase === 2 && (
              <motion.div
                key="expertos"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="px-4"
              >
                <PhaseExpertos
                  state={state.expertos}
                  contexto={state.contexto}
                  onParticipantUpdate={state.handleParticipantUpdate}
                  onContinue={state.goToNextPhase}
                  creditBalance={creditBalance}
                  accumulatedCosts={accumulatedCosts}
                  currentPhaseCost={currentPhaseCost}
                />
              </motion.div>
            )}
            
            {state.currentPhase === 3 && (
              <motion.div
                key="estrategia"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="px-4"
              >
                <PhaseEstrategia
                  state={state.estrategia}
                  contexto={state.contexto}
                  onStrategySelect={state.handleStrategySelection}
                  onFrameworkSelect={state.handleFrameworkSelection}
                  onContinue={state.goToNextPhase}
                  creditBalance={creditBalance}
                  accumulatedCosts={accumulatedCosts}
                  currentPhaseCost={currentPhaseCost}
                  estimatedDebateCost={estimatedDebateCost}
                />
              </motion.div>
            )}
            
            {state.currentPhase === 4 && (
              <motion.div
                key="revision"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="px-4"
              >
                <PhaseRevision
                  state={state.revision}
                  contexto={state.contexto}
                  expertos={state.expertos}
                  estrategia={state.estrategia}
                  onEditPhase={handleEditPhase}
                  onCreateDebate={state.handleCreateDebate}
                  isCreating={state.isCreatingDebate}
                  creditBalance={creditBalance}
                />
              </motion.div>
            )}
            
            {state.currentPhase === 5 && (
              <motion.div
                key="debate"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="px-4"
              >
                <PhaseDebate
                  state={state.debate}
                  onSendMessage={(msg) => {
                    // TODO: Implement send message
                    logger.info('Send message:', { msg })
                  }}
                  isLoading={false}
                />
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Phase Indicator (Bottom - Fixed) - Ahora es fixed en el componente mismo */}
      <PhaseIndicator
        currentPhase={state.currentPhase}
        phaseProgress={state.phaseProgress}
        onPhaseClick={state.goToPhase}
        creditBalance={creditBalance}
        accumulatedCosts={accumulatedCosts}
        currentPhaseCost={currentPhaseCost}
        estimatedDebateCost={estimatedDebateCost}
      />
    </div>
  )
}
