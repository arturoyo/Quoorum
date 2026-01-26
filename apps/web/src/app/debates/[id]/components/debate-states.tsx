/**
 * Debate States Components
 *
 * Various state displays for the debate detail page:
 * - Loading state
 * - Not found state
 * - Draft state
 * - Pending state
 * - In progress (no messages yet) state
 * - Failed state
 * - Empty completed state (legacy bug)
 */

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Clock, AlertTriangle } from 'lucide-react'

interface StateActionProps {
  onNavigateToDebates: () => void
  onNavigateToNewDebate: () => void
  onRetry?: () => void
  hasContext?: boolean
}

// Loading State
export function DebateLoadingState() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        <p className="text-[var(--theme-text-secondary)]">Cargando debate...</p>
      </div>
    </div>
  )
}

// Not Found State
export function DebateNotFoundState({ onNavigateToDebates }: Pick<StateActionProps, 'onNavigateToDebates'>) {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl p-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-xl font-bold text-white">Debate no encontrado</h2>
          <p className="mb-4 text-[var(--theme-text-secondary)]">El debate que buscas no existe o no tienes acceso.</p>
          <Button onClick={onNavigateToDebates} className="bg-purple-600">
            Volver a debates
          </Button>
        </div>
      </Card>
    </div>
  )
}

// Draft State
export function DebateDraftState({ onNavigateToNewDebate }: Pick<StateActionProps, 'onNavigateToNewDebate'>) {
  return (
    <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl p-8">
      <div className="text-center">
        <Clock className="mx-auto mb-4 h-12 w-12 text-[var(--theme-text-secondary)]" />
        <h3 className="mb-2 text-lg font-semibold text-white">
          Debate sin completar
        </h3>
        <p className="text-[var(--theme-text-secondary)] mb-6">
          Este debate se guardó como borrador pero nunca se inició.<br />
          Necesitas completar el flujo de creación para ejecutarlo.
        </p>
        <Button
          onClick={onNavigateToNewDebate}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Crear Nuevo Debate
        </Button>
      </div>
    </Card>
  )
}

// Pending State
export function DebatePendingState() {
  return (
    <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl p-8">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-purple-500" />
        <h3 className="mb-2 text-lg font-semibold text-white">
          Preparando debate...
        </h3>
        <p className="text-[var(--theme-text-secondary)]">
          Los expertos están siendo seleccionados y el contexto está siendo analizado.
        </p>
      </div>
    </Card>
  )
}

// In Progress State (no messages yet)
interface DebateInProgressStateProps {
  roundsCount: number
  totalRounds?: number
}

export function DebateInProgressState({ roundsCount, totalRounds }: DebateInProgressStateProps) {
  return (
    <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl p-8">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-purple-400" />
        <h3 className="mb-2 text-lg font-semibold text-white">
          Debate en curso
        </h3>
        <p className="text-[var(--theme-text-secondary)] mb-4">
          Los expertos están deliberando...
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-[var(--theme-text-secondary)]">
          <span>Ronda:</span>
          <span className="text-lg font-bold text-white">
            {roundsCount}
          </span>
          {totalRounds && (
            <>
              <span>/</span>
              <span className="text-[var(--theme-text-secondary)]">
                {totalRounds}
              </span>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

// Failed State
export function DebateFailedState({
  onNavigateToNewDebate,
  onRetry,
  hasContext,
  roundsCount,
}: StateActionProps & { roundsCount?: number }) {
  return (
    <Card className="border-red-500/30 bg-red-500/10 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-500" />
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-white">Error en la deliberación</h3>
          <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
            El debate no pudo completarse debido a un error durante la ejecución.
            {roundsCount && roundsCount > 0 && (
              <span> Se completaron {roundsCount} ronda(s) antes del error.</span>
            )}
          </p>
          <div className="flex gap-3">
            {hasContext && onRetry && (
              <Button
                onClick={onRetry}
                className="bg-purple-600 hover:bg-purple-700"
              >
                🔄 Reintentar con este Contexto
              </Button>
            )}
            <Button
              onClick={onNavigateToNewDebate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Crear Nuevo Debate
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Empty Completed State (Legacy bug)
export function DebateEmptyCompletedState({
  onNavigateToNewDebate,
  onRetry,
  hasContext,
}: StateActionProps) {
  return (
    <Card className="border-orange-500/30 bg-orange-500/10 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 flex-shrink-0 text-orange-500" />
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-white">Debate incompleto</h3>
          <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
            Este debate se marcó como completado pero no tiene contenido.
            Probablemente falló durante la ejecución debido a un error con el proveedor de IA.
          </p>
          <div className="flex gap-3">
            {hasContext && onRetry && (
              <Button
                onClick={onRetry}
                className="bg-purple-600 hover:bg-purple-700"
              >
                🔄 Reintentar con este Contexto
              </Button>
            )}
            <Button
              onClick={onNavigateToNewDebate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Crear Nuevo Debate
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
