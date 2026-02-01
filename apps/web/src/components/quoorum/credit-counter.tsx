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
import { cn, styles } from '@/lib/utils'
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
                <span className={cn("text-sm", styles.colors.text.secondary)}>...</span>
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
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-sm bg-purple-600 border-purple-500/30">
            <div className="space-y-2">
              <div className={cn("font-semibold text-sm", styles.colors.text.inverted)}>Balance Total de Créditos</div>
              <div className="flex justify-between items-center">
                <span className="text-purple-200 text-sm">Créditos disponibles:</span>
                <span className={cn("font-bold text-base", styles.colors.text.inverted)}>{creditBalance.toLocaleString()} créditos</span>
              </div>
              <div className="text-xs text-purple-200/70 border-t border-purple-500/30 pt-2">
                Este es tu balance general de créditos. Los costos específicos del debate se muestran en el indicador inferior.
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
        <h3 className={cn("text-lg font-semibold flex items-center gap-2", styles.colors.text.primary)}>
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
          <div className={cn("text-sm font-medium mb-2", styles.colors.text.secondary)}>
            Coste acumulado:
          </div>
          {accumulatedCosts.map((phase, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className={cn("capitalize", styles.colors.text.secondary)}>{phase.phase}:</span>
              <span className={cn("font-medium", styles.colors.text.primary)}>{phase.costCredits} créditos</span>
            </div>
          ))}
          <div className="flex justify-between text-sm pt-2 border-t border-purple-500/20">
            <span className={cn("font-medium", styles.colors.text.primary)}>Total acumulado:</span>
            <span className="text-purple-300 font-bold">{accumulatedCredits} créditos</span>
          </div>
        </div>
      )}

      {estimatedDebateCost && (
        <div className="space-y-2 pt-2 border-t border-purple-500/20">
          <div className={cn("text-sm font-medium", styles.colors.text.secondary)}>
            Coste previsto del debate:
          </div>
          <div className="flex justify-between text-sm">
            <span className={styles.colors.text.secondary}>Mínimo:</span>
            <span className={styles.colors.text.primary}>{estimatedDebateCost.min} créditos</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={styles.colors.text.secondary}>Máximo:</span>
            <span className={styles.colors.text.primary}>{estimatedDebateCost.max} créditos</span>
          </div>
        </div>
      )}

      <div className="space-y-2 pt-2 border-t border-purple-500/20">
        <div className="flex justify-between items-center">
          <span className={cn("text-sm", styles.colors.text.secondary)}>Balance disponible:</span>
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
            <span className={cn("text-sm", styles.colors.text.secondary)}>Total estimado:</span>
            <span className="text-lg font-bold text-purple-300">
              ~{totalEstimatedCredits} créditos
            </span>
          </div>
        )}
        {estimatedRemainingCredits >= 0 && (
          <div className="flex justify-between items-center pt-1">
            <span className={cn("text-sm font-medium", styles.colors.text.primary)}>
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
              [WARN] Créditos insuficientes:
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
