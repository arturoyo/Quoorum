'use client'

import { useState } from 'react'
import {
  Pause,
  Play,
  MessageSquarePlus,
  Target,
  TrendingUp,
  Users,
  ArrowRightLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { cn, styles } from '@/lib/utils'
import { useDebateSession } from '@/hooks/use-debate-session'

interface LiveCanvasProps {
  debateId: string
  className?: string
}

const CANVAS_VIEWS = ['consensus', 'experts', 'flow'] as const
type CanvasView = (typeof CANVAS_VIEWS)[number]

/**
 * Live Canvas Component
 *
 * Real-time visualization of debate progress with 3 views:
 * 1. Consensus Evolution - tracks consensus score over rounds
 * 2. Expert Positions - shows active experts and their stance
 * 3. Argument Flow - displays argument count and flow summary
 *
 * Includes controls for pause/resume/inject context/force consensus.
 */
export function LiveCanvas({ debateId, className }: LiveCanvasProps) {
  const {
    session,
    isConnected,
    isDone,
    error,
    pause,
    resume,
    addContext,
    forceConsensus,
  } = useDebateSession(debateId)

  const [activeView, setActiveView] = useState<CanvasView>('consensus')
  const [contextInput, setContextInput] = useState('')
  const [showContextInput, setShowContextInput] = useState(false)

  const meta = session?.liveMetadata
  const isPaused = session?.state === 'paused'
  const isRunning = session?.state === 'running'
  const isTerminal = isDone || ['completed', 'consensus_reached', 'force_concluded', 'failed'].includes(session?.state ?? '')

  const handleAddContext = async () => {
    if (!contextInput.trim()) return
    await addContext(contextInput.trim())
    setContextInput('')
    setShowContextInput(false)
  }

  const views: { id: CanvasView; label: string; icon: typeof TrendingUp }[] = [
    { id: 'consensus', label: 'Consenso', icon: TrendingUp },
    { id: 'experts', label: 'Expertos', icon: Users },
    { id: 'flow', label: 'Flujo', icon: ArrowRightLeft },
  ]

  return (
    <div className={cn(
      'rounded-lg border styles.colors.border.default styles.colors.bg.secondary overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b styles.colors.border.default styles.colors.bg.tertiary">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            isConnected && isRunning ? 'bg-emerald-400 animate-pulse' :
            isPaused ? 'bg-amber-400' :
            isTerminal ? 'bg-purple-400' :
            'bg-[var(--theme-text-tertiary)]'
          )} />
          <span className="text-sm font-medium styles.colors.text.primary">
            {isRunning ? `Ronda ${session?.currentRound ?? 0}/${session?.maxRounds ?? 10}` :
             isPaused ? 'En pausa' :
             isTerminal ? 'Completado' :
             error ? 'Error' : 'Conectando...'}
          </span>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1">
          {views.map((v) => (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                activeView === v.id
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'styles.colors.text.tertiary hover:styles.colors.text.secondary'
              )}
            >
              <v.icon className="w-3 h-3" />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Content */}
      <div className="p-4 min-h-[200px]">
        {!session && !error && (
          <div className="flex items-center justify-center h-[200px] styles.colors.text.tertiary">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Esperando sesion...
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-[200px] text-red-400">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {session && activeView === 'consensus' && (
          <ConsensusView
            score={meta?.consensusScore}
            dominant={meta?.dominantPosition}
            round={session.currentRound}
            maxRounds={session.maxRounds}
          />
        )}

        {session && activeView === 'experts' && (
          <ExpertsView
            experts={meta?.activeExperts}
            lastSummary={meta?.lastRoundSummary}
          />
        )}

        {session && activeView === 'flow' && (
          <FlowView
            argumentCount={meta?.argumentCount}
            contextItems={session.additionalContext}
          />
        )}
      </div>

      {/* Controls */}
      {session && !isTerminal && (
        <div className="flex items-center gap-2 px-4 py-3 border-t styles.colors.border.default">
          {isRunning && (
            <button
              onClick={() => void pause('User paused')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              Pausar
            </button>
          )}
          {isPaused && (
            <button
              onClick={() => void resume()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Reanudar
            </button>
          )}

          <button
            onClick={() => setShowContextInput(!showContextInput)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            Inyectar
          </button>

          <button
            onClick={() => void forceConsensus()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors ml-auto"
          >
            <Target className="w-3.5 h-3.5" />
            Forzar consenso
          </button>
        </div>
      )}

      {/* Terminal state */}
      {isTerminal && session && (
        <div className="flex items-center gap-2 px-4 py-3 border-t styles.colors.border.default bg-purple-500/10">
          <CheckCircle2 className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-300">
            {session.state === 'consensus_reached' ? 'Consenso alcanzado' :
             session.state === 'force_concluded' ? 'Forzado a concluir' :
             session.state === 'failed' ? 'Error en debate' : 'Completado'}
          </span>
          {meta?.consensusScore !== undefined && (
            <span className="ml-auto text-sm font-medium text-purple-300">
              {Math.round(meta.consensusScore)}% consenso
            </span>
          )}
        </div>
      )}

      {/* Context injection input */}
      {showContextInput && (
        <div className="px-4 py-3 border-t styles.colors.border.default">
          <div className="flex gap-2">
            <input
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              placeholder="Nuevo contexto para el debate..."
              className="flex-1 px-3 py-1.5 rounded-md text-sm styles.colors.bg.input border styles.colors.border.default styles.colors.text.primary placeholder:styles.colors.text.tertiary focus-visible:ring-purple-500 focus-visible:border-purple-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleAddContext()
              }}
            />
            <button
              onClick={() => void handleAddContext()}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// SUB-VIEWS
// ============================================

function ConsensusView({ score, dominant, round, maxRounds }: {
  score?: number
  dominant?: string
  round: number
  maxRounds: number
}) {
  const pct = score ?? 0
  const progress = maxRounds > 0 ? (round / maxRounds) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Score gauge */}
      <div className="text-center">
        <div className="text-4xl font-bold styles.colors.text.primary">
          {Math.round(pct)}%
        </div>
        <div className="text-sm styles.colors.text.tertiary mt-1">Nivel de consenso</div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs styles.colors.text.tertiary">
          <span>Ronda {round}</span>
          <span>Max {maxRounds}</span>
        </div>
        <progress
          className={cn("w-full h-2 rounded-full overflow-hidden", styles.colors.bg.input, "accent-cyan-500")}
          value={Math.min(progress, 100)}
          max={100}
        />
      </div>

      {/* Dominant position */}
      {dominant && (
        <div className="p-3 rounded-md styles.colors.bg.tertiary border styles.colors.border.default">
          <div className="text-xs styles.colors.text.tertiary mb-1">Posicion dominante</div>
          <div className="text-sm styles.colors.text.primary">{dominant}</div>
        </div>
      )}
    </div>
  )
}

function ExpertsView({ experts, lastSummary }: {
  experts?: string[]
  lastSummary?: string
}) {
  return (
    <div className="space-y-4">
      {/* Active experts */}
      <div>
        <div className="text-xs styles.colors.text.tertiary mb-2">Expertos activos</div>
        <div className="flex flex-wrap gap-2">
          {experts && experts.length > 0 ? experts.map((name) => (
            <span
              key={name}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30"
            >
              {name}
            </span>
          )) : (
            <span className="text-sm styles.colors.text.tertiary">Sin datos</span>
          )}
        </div>
      </div>

      {/* Last round summary */}
      {lastSummary && (
        <div className="p-3 rounded-md styles.colors.bg.tertiary border styles.colors.border.default">
          <div className="text-xs styles.colors.text.tertiary mb-1">Resumen ultima ronda</div>
          <div className="text-sm styles.colors.text.secondary leading-relaxed">{lastSummary}</div>
        </div>
      )}
    </div>
  )
}

function FlowView({ argumentCount, contextItems }: {
  argumentCount?: number
  contextItems?: Array<{ text: string; injectedAt: string; injectedBy: string }> | null
}) {
  return (
    <div className="space-y-4">
      {/* Argument count */}
      <div className="text-center">
        <div className="text-4xl font-bold styles.colors.text.primary">
          {argumentCount ?? 0}
        </div>
        <div className="text-sm styles.colors.text.tertiary mt-1">Argumentos generados</div>
      </div>

      {/* Injected context */}
      {contextItems && contextItems.length > 0 && (
        <div>
          <div className="text-xs styles.colors.text.tertiary mb-2">Contexto inyectado</div>
          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {contextItems.map((item, i) => (
              <div
                key={i}
                className="p-2 rounded-md styles.colors.bg.tertiary border styles.colors.border.default text-xs styles.colors.text.secondary"
              >
                {item.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
