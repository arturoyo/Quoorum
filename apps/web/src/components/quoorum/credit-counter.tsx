/**
 * CreditCounter Component
 * 
 * Muestra el balance de créditos del usuario y el coste acumulado de la sesión actual.
 * Se actualiza en tiempo real según las acciones del usuario.
 */

'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { Coins, TrendingUp, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { api } from '@/lib/trpc/client'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { PhaseCostEstimate } from '@quoorum/quoorum/analytics/phase-cost-estimator'

interface CreditCounterProps {
  /** Fase actual del debate */
  currentPhase?: 'contexto' | 'expertos' | 'estrategia' | 'revision' | 'debate'
  /** Costes acumulados de fases completadas */
  accumulatedCosts?: PhaseCostEstimate[]
  /** Coste estimado de la fase actual */
  currentPhaseCost?: PhaseCostEstimate
  /** Coste estimado del debate (rango min-max) */
  estimatedDebateCost?: { min: number; max: number }
  /** Clase CSS adicional */
  className?: string
  /** Mostrar desglose completo (para fase de revisión) */
  showBreakdown?: boolean
  /** Variante: 'compact' para header, 'full' para fase de revisión */
  variant?: 'compact' | 'full'
}

export function CreditCounter({
  currentPhase,
  accumulatedCosts = [],
  currentPhaseCost,
  estimatedDebateCost,
  className,
  showBreakdown = false,
  variant = 'compact',
}: CreditCounterProps) {
  // Verificar autenticación antes de hacer queries
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const supabase = createClient()

  // Verificar autenticación de forma inmediata y reactiva
  useEffect(() => {
    let mounted = true

    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (mounted) {
          setIsAuthenticated(!!user && !error)
          setIsCheckingAuth(false)
        }
      } catch (error) {
        if (mounted) {
          setIsAuthenticated(false)
          setIsCheckingAuth(false)
        }
      }
    }

    // Verificar inmediatamente
    checkAuth()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setIsAuthenticated(!!session?.user)
        setIsCheckingAuth(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  // Obtener balance de créditos del usuario (solo si está autenticado y terminó la verificación)
  const { data: planData, isLoading: isLoadingCredits, error: _creditError } = api.billing.getCurrentPlan.useQuery(
    undefined,
    {
      enabled: !isCheckingAuth && isAuthenticated, // Solo hacer query cuando terminó la verificación y está autenticado
      refetchInterval: !isCheckingAuth && isAuthenticated ? 30000 : false, // Refrescar cada 30 segundos solo si está autenticado
      retry: false, // No reintentar si falla (evita spam de errores)
      onError: () => {
        // Silenciar errores de autenticación (ya manejados por enabled)
      },
    }
  )

  const creditBalance = planData?.credits ?? 0

  // Calcular coste acumulado
  const accumulatedCredits = useMemo(() => {
    return accumulatedCosts.reduce((sum, phase) => sum + phase.costCredits, 0)
  }, [accumulatedCosts])

  // Calcular coste total estimado (acumulado + fase actual + debate)
  const totalEstimatedCredits = useMemo(() => {
    let total = accumulatedCredits
    if (currentPhaseCost) {
      total += currentPhaseCost.costCredits
    }
    if (estimatedDebateCost) {
      // Usar el máximo para ser conservador
      total += estimatedDebateCost.max
    }
    return total
  }, [accumulatedCredits, currentPhaseCost, estimatedDebateCost])

  // Calcular créditos restantes estimados
  const estimatedRemainingCredits = creditBalance - totalEstimatedCredits

  // Determinar estado de alerta
  const alertLevel = useMemo(() => {
    if (creditBalance === 0) return 'critical'
    if (estimatedRemainingCredits < 0) return 'critical'
    if (estimatedRemainingCredits < 100) return 'warning'
    if (estimatedRemainingCredits < 500) return 'info'
    return 'ok'
  }, [creditBalance, estimatedRemainingCredits])

  // Si está verificando autenticación o no está autenticado, no mostrar nada (evita errores de query)
  if (isCheckingAuth || !isAuthenticated) {
    return null
  }

  // Variante compacta (para header)
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors',
                alertLevel === 'critical' && 'border-red-500/50 bg-red-500/10',
                alertLevel === 'warning' && 'border-amber-500/50 bg-amber-500/10',
                alertLevel === 'info' && 'border-blue-500/50 bg-blue-500/10',
                alertLevel === 'ok' && 'border-purple-500/30 bg-purple-500/10',
                className
              )}
            >
              <Coins className={cn(
                'h-4 w-4',
                alertLevel === 'critical' && 'text-red-400',
                alertLevel === 'warning' && 'text-amber-400',
                alertLevel === 'info' && 'text-blue-400',
                alertLevel === 'ok' && 'text-purple-400',
              )} />
              {isLoadingCredits ? (
                <span className="text-sm text-[var(--theme-text-secondary)]">...</span>
              ) : (
                <span className={cn(
                  'text-sm font-medium',
                  alertLevel === 'critical' && 'text-red-300',
                  alertLevel === 'warning' && 'text-amber-300',
                  alertLevel === 'info' && 'text-blue-300',
                  alertLevel === 'ok' && 'text-purple-300',
                )}>
                  {creditBalance.toLocaleString()}
                </span>
              )}
              {accumulatedCredits > 0 && (
                <span className="text-xs text-[var(--theme-text-tertiary)]">
                  (-{accumulatedCredits})
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-sm bg-purple-600 border-purple-500/30">
            <div className="space-y-3">
              <div className="font-semibold text-[var(--theme-text-inverted)] text-base">Balance de Créditos</div>
              
              {/* Balance inicial */}
              <div className="space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-purple-500/30">
                  <span className="text-purple-200 text-sm">Balance inicial:</span>
                  <span className="font-bold text-[var(--theme-text-inverted)] text-base">{creditBalance.toLocaleString()} créditos</span>
                </div>
                
                {/* Desglose por fase */}
                {(() => {
                  let runningTotal = creditBalance
                  let total = accumulatedCredits
                  
                  if (currentPhaseCost) {
                    total += currentPhaseCost.costCredits
                  }
                  if (estimatedDebateCost) {
                    total += estimatedDebateCost.max
                  }
                  const remaining = creditBalance - total
                  
                  // Mapeo de nombres de fases con orden
                  const phaseOrder: Record<string, number> = {
                    'contexto': 1,
                    'expertos': 2,
                    'estrategia': 3,
                    'revision': 4,
                    'debate': 5,
                  }
                  const phaseNames: Record<string, string> = {
                    'contexto': '1 - Contexto',
                    'expertos': '2 - Expertos',
                    'estrategia': '3 - Estrategia',
                    'revision': '4 - Revisión',
                    'debate': '5 - Debate',
                  }
                  
                  // Ordenar fases completadas por orden
                  const sortedAccumulated = [...accumulatedCosts].sort((a, b) => 
                    (phaseOrder[a.phase] || 99) - (phaseOrder[b.phase] || 99)
                  )
                  
                  return (
                    <div className="space-y-2">
                      {/* Fases completadas */}
                      {sortedAccumulated.map((phase, idx) => {
                        runningTotal -= phase.costCredits
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-purple-200">{phaseNames[phase.phase] || phase.phase}:</span>
                              <span className="font-medium text-amber-300">-{phase.costCredits} créditos</span>
                            </div>
                            {phase.breakdown && phase.breakdown.length > 0 && (
                              <div className="pl-3 space-y-0.5">
                                {phase.breakdown.map((item, itemIdx) => (
                                  <div key={itemIdx} className="flex justify-between text-xs text-purple-300/80">
                                    <span>• {item.item}</span>
                                    <span>-{item.costCredits}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex justify-between items-center text-xs text-purple-300/60 pt-0.5">
                              <span>Después de {phaseNames[phase.phase] || phase.phase}:</span>
                              <span className="font-medium">{runningTotal.toLocaleString()} créditos</span>
                            </div>
                          </div>
                        )
                      })}
                      
                      {/* Fase actual (si tiene coste y no está en accumulatedCosts) */}
                      {currentPhaseCost && !sortedAccumulated.find(p => p.phase === currentPhaseCost.phase) && (
                        <div className="space-y-1 pt-1 border-t border-purple-500/20">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-purple-200 font-medium">{phaseNames[currentPhaseCost.phase] || currentPhaseCost.phase} (actual):</span>
                            <span className="font-medium text-purple-300">~{currentPhaseCost.costCredits} créditos</span>
                          </div>
                          {currentPhaseCost.breakdown && currentPhaseCost.breakdown.length > 0 && (
                            <div className="pl-3 space-y-0.5">
                              {currentPhaseCost.breakdown.map((item, itemIdx) => (
                                <div key={itemIdx} className="flex justify-between text-xs text-purple-300/80">
                                  <span>• {item.item}</span>
                                  <span>~{item.costCredits}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {(() => {
                            const afterCurrent = runningTotal - currentPhaseCost.costCredits
                            return (
                              <div className="flex justify-between items-center text-xs text-purple-300/60 pt-0.5">
                                <span>Después de {phaseNames[currentPhaseCost.phase] || currentPhaseCost.phase}:</span>
                                <span className="font-medium">~{afterCurrent.toLocaleString()} créditos</span>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                      
                      {/* Debate estimado (solo si estamos en fase 4+) */}
                      {estimatedDebateCost && (
                        <div className="space-y-1 pt-1 border-t border-purple-500/20">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-purple-200 font-medium">5 - Debate (estimado):</span>
                            <span className="font-medium text-purple-300">~{estimatedDebateCost.max} créditos</span>
                          </div>
                          <div className="pl-3 space-y-0.5">
                            <div className="flex justify-between text-xs text-purple-300/80">
                              <span>• Rango estimado:</span>
                              <span>{estimatedDebateCost.min} - {estimatedDebateCost.max}</span>
                            </div>
                          </div>
                          {(() => {
                            // Calcular runningTotal después de fase actual (si existe)
                            let tempTotal = runningTotal
                            if (currentPhaseCost && !sortedAccumulated.find(p => p.phase === currentPhaseCost.phase)) {
                              tempTotal -= currentPhaseCost.costCredits
                            }
                            const afterDebate = tempTotal - estimatedDebateCost.max
                            return (
                              <div className="flex justify-between items-center text-xs text-purple-300/60 pt-0.5">
                                <span>Después del debate:</span>
                                <span className="font-medium">~{afterDebate.toLocaleString()} créditos</span>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                      
                      {/* Total y restantes */}
                      <div className="pt-2 border-t-2 border-purple-500/40 space-y-1">
                        {total > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-purple-200 font-medium">Total estimado:</span>
                            <span className="font-bold text-purple-300">~{total} créditos</span>
                          </div>
                        )}
                        {remaining >= 0 ? (
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-green-200 font-medium text-sm">Restantes estimados:</span>
                            <span className="font-bold text-green-300 text-base">~{remaining.toLocaleString()} créditos</span>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-red-200 font-medium text-sm">⚠️ Insuficientes:</span>
                            <span className="font-bold text-red-300 text-base">Faltan {Math.abs(remaining)} créditos</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Variante completa (para fase de revisión)
  return (
    <div className={cn('space-y-4 p-4 rounded-lg border border-purple-500/30 bg-purple-500/10', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Coins className="h-5 w-5 text-purple-400" />
          Coste del Debate
        </h3>
        {alertLevel === 'critical' && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Créditos insuficientes
          </Badge>
        )}
        {alertLevel === 'warning' && (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Créditos bajos
          </Badge>
        )}
      </div>

      {showBreakdown && accumulatedCosts.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-[var(--theme-text-secondary)] mb-2">
            Coste acumulado:
          </div>
          {accumulatedCosts.map((phase, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-[var(--theme-text-secondary)] capitalize">{phase.phase}:</span>
              <span className="text-white font-medium">{phase.costCredits} créditos</span>
            </div>
          ))}
          <div className="flex justify-between text-sm pt-2 border-t border-purple-500/20">
            <span className="text-[var(--theme-text-primary)] font-medium">Total acumulado:</span>
            <span className="text-purple-300 font-bold">{accumulatedCredits} créditos</span>
          </div>
        </div>
      )}

      {estimatedDebateCost && (
        <div className="space-y-2 pt-2 border-t border-purple-500/20">
          <div className="text-sm font-medium text-[var(--theme-text-secondary)]">
            Coste previsto del debate:
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--theme-text-secondary)]">Mínimo:</span>
            <span className="text-white">{estimatedDebateCost.min} créditos</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--theme-text-secondary)]">Máximo:</span>
            <span className="text-white">{estimatedDebateCost.max} créditos</span>
          </div>
        </div>
      )}

      <div className="space-y-2 pt-2 border-t border-purple-500/20">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--theme-text-secondary)]">Balance disponible:</span>
          <span className={cn(
            'text-lg font-bold',
            alertLevel === 'critical' && 'text-red-400',
            alertLevel === 'warning' && 'text-amber-400',
            alertLevel === 'ok' && 'text-green-400',
          )}>
            {creditBalance.toLocaleString()} créditos
          </span>
        </div>
        {totalEstimatedCredits > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--theme-text-secondary)]">Total estimado:</span>
            <span className="text-lg font-bold text-purple-300">
              ~{totalEstimatedCredits} créditos
            </span>
          </div>
        )}
        {estimatedRemainingCredits >= 0 && (
          <div className="flex justify-between items-center pt-1">
            <span className="text-sm font-medium text-[var(--theme-text-primary)]">
              Créditos restantes estimados:
            </span>
            <span className={cn(
              'text-lg font-bold',
              alertLevel === 'warning' && 'text-amber-400',
              alertLevel === 'ok' && 'text-green-400',
            )}>
              ~{estimatedRemainingCredits.toLocaleString()} créditos
            </span>
          </div>
        )}
        {estimatedRemainingCredits < 0 && (
          <div className="flex justify-between items-center pt-1">
            <span className="text-sm font-medium text-red-300">
              ⚠️ Créditos insuficientes:
            </span>
            <span className="text-lg font-bold text-red-400">
              Faltan {Math.abs(estimatedRemainingCredits)} créditos
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
