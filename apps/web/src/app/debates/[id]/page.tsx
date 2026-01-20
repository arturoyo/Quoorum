'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { InteractiveControls } from '@/components/quoorum/interactive-controls'
import { DebateProgressCascade } from '@/components/debates/debate-progress-cascade'
import { DebateComments } from '@/components/quoorum/debate-comments'

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
interface DebatePageProps {
  params: Promise<{
    id: string
  }>
}

interface RoundMessage {
  expert?: string
  agentKey?: string
  role?: 'moderator' | 'expert'
  content: string
  timestamp?: string
}

interface RankingOption {
  option: string
  score: number
  reasoning?: string
}

// Color palette para expertos (Purple-Blue-Slate theme)
const EXPERT_COLORS = [
  'bg-purple-600',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-violet-600',
  'bg-fuchsia-600',
  'bg-cyan-600',
  'bg-sky-600',
  'bg-pink-600',
  'bg-rose-600',
  'bg-purple-500',
]

// Pattern labels in Spanish
function getPatternLabel(pattern: string): string {
  const labels: Record<string, string> = {
    simple: 'Simple',
    sequential: 'Secuencial',
    parallel: 'Paralelo',
    conditional: 'Condicional',
    iterative: 'Iterativo',
    tournament: 'Torneo',
    adversarial: 'Adversarial',
    ensemble: 'Ensemble',
    hierarchical: 'Jerárquico',
  }
  return labels[pattern] || pattern
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════
export default function DebatePage({ params }: DebatePageProps) {
  const { id } = use(params)
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [expertColors, setExpertColors] = useState<Record<string, string>>({})
  const [isContextExpanded, setIsContextExpanded] = useState(true) // Expandido por defecto

  // Fetch debate with refetch interval for real-time updates
  const { data: debate, isLoading } = api.debates.get.useQuery(
    { id },
    {
      refetchInterval: (data) => {
        // Poll every 3 seconds while debate is in progress
        return data?.status === 'in_progress' ? 3000 : false
      },
      refetchIntervalInBackground: true,
    }
  )

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [debate?.rounds])

  // Assign colors to experts
  useEffect(() => {
    if (!debate?.rounds) return

    const experts = new Set<string>()
    debate.rounds.forEach((round: any) => {
      round.messages?.forEach((msg: RoundMessage) => {
        if (msg.expert) experts.add(msg.expert)
        else if (msg.agentKey) experts.add(msg.agentKey)
      })
    })

    const colors: Record<string, string> = {}
    Array.from(experts).forEach((expert, idx) => {
      colors[expert] = EXPERT_COLORS[idx % EXPERT_COLORS.length] || EXPERT_COLORS[0]
    })

    setExpertColors(colors)
  }, [debate])

  // Collect all messages from all rounds for chat view
  const allMessages = debate?.rounds?.flatMap((round: any, roundIdx: number) =>
    round.messages?.map((msg: RoundMessage, msgIdx: number) => ({
      ...msg,
      roundNumber: roundIdx + 1,
      messageId: `${roundIdx}-${msgIdx}`,
    }))
  ) ?? []

  // Status badge config
  const statusConfig = {
    draft: { label: 'Borrador', color: 'bg-gray-500', icon: Clock },
    pending: { label: 'Pendiente', color: 'bg-yellow-500', icon: Clock },
    in_progress: { label: 'En progreso', color: 'bg-blue-500', icon: Loader2 },
    completed: { label: 'Completado', color: 'bg-green-500', icon: CheckCircle2 },
    failed: { label: 'Fallido', color: 'bg-red-500', icon: AlertTriangle },
  }

  const status = debate?.status as keyof typeof statusConfig
  const StatusIcon = statusConfig[status]?.icon

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <p className="text-gray-400">Cargando debate...</p>
        </div>
      </div>
    )
  }

  if (!debate) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl p-8">
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="mb-2 text-xl font-bold text-white">Debate no encontrado</h2>
            <p className="mb-4 text-gray-400">El debate que buscas no existe o no tienes acceso.</p>
            <Button onClick={() => router.push('/debates')} className="bg-purple-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a debates
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Determine current phase based on debate status
  const getCurrentPhase = (): 'contexto' | 'debate' | 'conclusion' => {
    if (!debate) return 'contexto'
    
    if (debate.status === 'completed') {
      return 'conclusion'
    }
    
    if (debate.status === 'in_progress' || debate.status === 'pending') {
      return 'debate'
    }
    
    // draft status means still in context phase
    return 'contexto'
  }

  const currentPhase = getCurrentPhase()

  return (
    <div className="flex h-screen flex-col bg-slate-950">
      {/* Phase Indicator */}
      <div className="relative border-b border-white/10 bg-slate-900/40 backdrop-blur-xl px-4 py-3">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            {/* Contexto Phase */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                currentPhase === 'contexto'
                  ? "bg-purple-600 border-purple-400 text-white"
                  : currentPhase === 'debate' || currentPhase === 'conclusion'
                  ? "bg-purple-600/50 border-purple-600/50 text-purple-300"
                  : "bg-slate-800/50 border-slate-600/50 text-slate-500"
              )}>
                <span className="text-xs font-bold">1</span>
              </div>
              <span className={cn(
                "text-sm font-medium transition-colors",
                currentPhase === 'contexto'
                  ? "text-white"
                  : currentPhase === 'debate' || currentPhase === 'conclusion'
                  ? "text-purple-300"
                  : "text-slate-500"
              )}>
                Contexto
              </span>
            </div>

            {/* Connector Line */}
            <div className={cn(
              "flex-1 h-0.5 transition-colors",
              currentPhase === 'debate' || currentPhase === 'conclusion'
                ? "bg-purple-600/50"
                : "bg-slate-700/50"
            )} />

            {/* Debate Phase */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                currentPhase === 'debate'
                  ? "bg-purple-600 border-purple-400 text-white"
                  : currentPhase === 'conclusion'
                  ? "bg-purple-600/50 border-purple-600/50 text-purple-300"
                  : "bg-slate-800/50 border-slate-600/50 text-slate-500"
              )}>
                <span className="text-xs font-bold">2</span>
              </div>
              <span className={cn(
                "text-sm font-medium transition-colors",
                currentPhase === 'debate'
                  ? "text-white"
                  : currentPhase === 'conclusion'
                  ? "text-purple-300"
                  : "text-slate-500"
              )}>
                Debate
              </span>
            </div>

            {/* Connector Line */}
            <div className={cn(
              "flex-1 h-0.5 transition-colors",
              currentPhase === 'conclusion'
                ? "bg-purple-600/50"
                : "bg-slate-700/50"
            )} />

            {/* Conclusión Phase */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                currentPhase === 'conclusion'
                  ? "bg-purple-600 border-purple-400 text-white"
                  : "bg-slate-800/50 border-slate-600/50 text-slate-500"
              )}>
                <span className="text-xs font-bold">3</span>
              </div>
              <span className={cn(
                "text-sm font-medium transition-colors",
                currentPhase === 'conclusion'
                  ? "text-white"
                  : "text-slate-500"
              )}>
                Conclusión
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5" />
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 mb-1 text-sm">
                <Link
                  href="/debates"
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Debates
                </Link>
                <ChevronRight className="h-3 w-3 text-gray-600" />
                <span className="text-gray-300 truncate max-w-xs">
                  {debate.metadata?.title || debate.question}
                </span>
              </div>
              <h1 className="text-lg font-semibold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent line-clamp-1">
                {debate.question}
              </h1>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Badge
                  className={cn(
                    'flex items-center gap-1',
                    statusConfig[status]?.color,
                    'text-white'
                  )}
                >
                  {StatusIcon && <StatusIcon className="h-3 w-3" />}
                  {statusConfig[status]?.label}
                </Badge>
                {debate.metadata?.pattern && (
                  <>
                    <span>•</span>
                    <Badge
                      variant="outline"
                      className="border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs"
                      title={`Estrategia: ${getPatternLabel(debate.metadata.pattern as string)}`}
                    >
                      {getPatternLabel(debate.metadata.pattern as string)}
                    </Badge>
                  </>
                )}
                {debate.rounds && debate.rounds.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{debate.rounds.length} ronda{debate.rounds.length !== 1 ? 's' : ''}</span>
                  </>
                )}
                {debate.experts && debate.experts.length > 0 && (
                  <>
                    <span>•</span>
                    <Users className="h-3 w-3" />
                    <span>{debate.experts.length} expertos</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Consensus Score */}
          {debate.consensusScore !== null && debate.consensusScore !== undefined && (
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-gray-400">Consenso</div>
              <div className="h-12 w-12 rounded-full border-4 border-white/10 bg-slate-950 flex items-center justify-center">
                {debate.consensusScore >= 0.7 ? (
                  <CheckCircle2 className="h-6 w-6 text-purple-400" />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {(debate.consensusScore * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Interactive Controls */}
        <InteractiveControls
          debateId={id}
          status={debate.status}
          isPaused={debate.metadata?.paused === true}
          className="px-4 pb-3 border-t border-white/10 pt-3 mt-2"
        />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {/* Context Card - Always Visible at Start */}
          {debate.context && (
            <Card className={cn(
              "border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden",
              debate.status === 'in_progress' && (!debate.rounds || debate.rounds.length === 0) && "border-purple-500/50 shadow-lg shadow-purple-500/20 ring-1 ring-purple-500/20"
            )}>
              {/* Header - Clickeable */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => setIsContextExpanded(!isContextExpanded)}
              >
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-400">
                    <span>📝</span>
                    <span>Información Proporcionada</span>
                  </div>
                  {/* Síntesis cuando está colapsado */}
                  {!isContextExpanded && (
                    <p className="text-xs text-gray-300 mt-1 line-clamp-1">
                      {debate.context.assessment?.summary || 
                       (debate.context.background 
                         ? (debate.context.background.length > 120 
                            ? `${debate.context.background.substring(0, 120)}...` 
                            : debate.context.background)
                         : 'Ver contexto completo')}
                    </p>
                  )}
                  {/* Mensaje cuando está en progreso y colapsado */}
                  {!isContextExpanded && debate.status === 'in_progress' && (!debate.rounds || debate.rounds.length === 0) && (
                    <p className="text-xs text-gray-400 mt-1">Los agentes están analizando este contexto...</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-2 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsContextExpanded(!isContextExpanded)
                  }}
                >
                  {isContextExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Content - Colapsable */}
              {isContextExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                  {/* Background/Context */}
                  {debate.context.background && (
                    <div>
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                        Información proporcionada:
                      </div>
                      <p className="text-sm text-white whitespace-pre-wrap">
                        {debate.context.background}
                      </p>
                    </div>
                  )}

                  {/* Category */}
                  {debate.context.sources && debate.context.sources.length > 0 && (
                    <div>
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                        Categoría:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {debate.context.sources.map((source: any, idx: number) => (
                          <Badge key={idx} className="bg-purple-600/20 text-purple-300">
                            {source.content || source.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assessment Summary if available */}
                  {debate.context.assessment && (
                    <div>
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                        Análisis de Contexto:
                      </div>
                      <p className="text-sm text-gray-400">
                        {debate.context.assessment.summary}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Progress Cascade - Show during in_progress or if processingStatus exists */}
          {(debate.status === 'in_progress' || debate.processingStatus) && (
            <DebateProgressCascade
              processingStatus={debate.processingStatus}
              status={debate.status}
            />
          )}

          {/* Draft State */}
          {debate.status === 'draft' && (
            <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl p-8">
              <div className="text-center">
                <Clock className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Debate sin completar
                </h3>
                <p className="text-gray-400 mb-6">
                  Este debate se guardó como borrador pero nunca se inició.<br />
                  Necesitas completar el flujo de creación para ejecutarlo.
                </p>
                <Button
                  onClick={() => router.push('/debates/new')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Crear Nuevo Debate
                </Button>
              </div>
            </Card>
          )}

          {/* Pending State */}
          {debate.status === 'pending' && (
            <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl p-8">
              <div className="text-center">
                <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-purple-500" />
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Preparando debate...
                </h3>
                <p className="text-gray-400">
                  Los expertos están siendo seleccionados y el contexto está siendo analizado.
                </p>
              </div>
            </Card>
          )}

          {/* In Progress State - Live Updates */}
          {debate.status === 'in_progress' && allMessages.length === 0 && (
            <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl p-8">
              <div className="text-center">
                <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-purple-400" />
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Debate en curso
                </h3>
                <p className="text-gray-400 mb-4">
                  Los expertos están deliberando...
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <span>Ronda:</span>
                  <span className="text-lg font-bold text-white">
                    {debate.rounds?.length || 0}
                  </span>
                  {debate.rounds && debate.rounds.length > 0 && (
                    <>
                      <span>/</span>
                      <span className="text-gray-400">
                        {(debate as { totalRounds?: number }).totalRounds ?? debate.rounds.length}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* In Progress / Completed */}
          {allMessages.length > 0 && (
            <>
              {allMessages.map((msg: any) => {
                const expertName = msg.expert || msg.agentKey || 'Moderador'
                const color = msg.role === 'moderator'
                  ? 'bg-purple-600'
                  : expertColors[expertName] || 'bg-slate-600'

                return (
                  <div key={msg.messageId} className="flex gap-3">
                    {/* Avatar */}
                    <div
                      className={cn(
                        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
                        color
                      )}
                    >
                      {expertName[0]?.toUpperCase()}
                    </div>

                    {/* Message Bubble */}
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{expertName}</span>
                        {msg.role === 'moderator' && (
                          <Badge className="bg-purple-600/20 text-purple-400 text-xs">
                            Moderador
                          </Badge>
                        )}
                        <span className="text-xs text-gray-400">Ronda {msg.roundNumber}</span>
                      </div>
                      <div className="rounded-lg bg-slate-900/60 backdrop-blur-xl p-3 text-sm text-white">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {/* Failed State */}
          {debate.status === 'failed' && (
            <Card className="border-red-500/30 bg-red-500/10 p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-500" />
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold text-white">Error en la deliberación</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    El debate no pudo completarse debido a un error durante la ejecución.
                    {debate.rounds && debate.rounds.length > 0 && (
                      <span> Se completaron {debate.rounds.length} ronda(s) antes del error.</span>
                    )}
                  </p>
                  <div className="flex gap-3">
                    {debate.context && (
                      <Button
                        onClick={() => router.push(`/debates/new?retry=${debate.id}`)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        🔄 Reintentar con este Contexto
                      </Button>
                    )}
                    <Button
                      onClick={() => router.push('/debates/new')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Crear Nuevo Debate
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Empty Completed State - Legacy bug (will be fixed going forward) */}
          {debate.status === 'completed' &&
           (!debate.rounds || debate.rounds.length === 0) && (
            <Card className="border-orange-500/30 bg-orange-500/10 p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 flex-shrink-0 text-orange-500" />
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold text-white">Debate incompleto</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Este debate se marcó como completado pero no tiene contenido.
                    Probablemente falló durante la ejecución debido a un error con el proveedor de IA.
                  </p>
                  <div className="flex gap-3">
                    {debate.context && (
                      <Button
                        onClick={() => router.push(`/debates/new?retry=${debate.id}`)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        🔄 Reintentar con este Contexto
                      </Button>
                    )}
                    <Button
                      onClick={() => router.push('/debates/new')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Crear Nuevo Debate
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Final Ranking (Bottom Sheet) */}
      {debate.status === 'completed' && debate.finalRanking && (
        <div className="border-t border-white/10 bg-slate-900/60 backdrop-blur-xl px-4 py-4">
          <div className="mx-auto max-w-4xl">
            {(() => {
              const firstOption = (debate.finalRanking as RankingOption[])[0]
              const isGeneration = firstOption && firstOption.option.length > 200
              
              return (
                <>
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                    <TrendingUp className="h-5 w-5" />
                    {isGeneration ? 'Contenido Generado' : 'Ranking Final de Opciones'}
                  </h3>
                  <div className="space-y-2">
                    {(debate.finalRanking as RankingOption[]).map((option: RankingOption, idx: number) => {
                      const isLongContent = option.option.length > 200
                      const isGenerationItem = isGeneration && idx === 0
                      
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'rounded-lg p-4',
                            idx === 0 ? 'bg-purple-600/20 border border-purple-400/30' : 'bg-slate-900/40'
                          )}
                        >
                          {isGenerationItem ? (
                            // Generation mode: Show full content in a text area format
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-5 w-5 text-purple-400" />
                                  <span className="text-sm font-medium text-purple-300">
                                    Contenido listo para usar
                                  </span>
                                </div>
                                <span className="text-sm text-gray-400">
                                  {option.score.toFixed(1)}% de confianza
                                </span>
                              </div>
                              <div className="rounded-md bg-slate-900/60 border border-slate-700/50 p-4">
                                <pre className="whitespace-pre-wrap font-sans text-white text-sm leading-relaxed">
                                  {option.option}
                                </pre>
                              </div>
                              {option.reasoning && (
                                <div className="text-xs text-gray-400 italic">
                                  💡 {option.reasoning}
                                </div>
                              )}
                            </div>
                          ) : (
                            // Decision mode: Show ranked options
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-full font-bold',
                                    idx === 0
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-slate-600/30 text-white'
                                  )}
                                >
                                  {idx + 1}
                                </div>
                                <div>
                                  <div className={cn(
                                    'font-medium text-white',
                                    isLongContent && 'max-w-2xl'
                                  )}>
                                    {option.option}
                                  </div>
                                  {option.reasoning && (
                                    <div className="text-xs text-gray-400">{option.reasoning}</div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-white">
                                  {option.score.toFixed(1)}%
                                </span>
                                {idx === 0 && <CheckCircle2 className="h-5 w-5 text-purple-400" />}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Comments Section */}
      {debate.status === 'completed' && (
        <div className="border-t border-white/10 bg-slate-900/60 backdrop-blur-xl px-4 py-4">
          <div className="mx-auto max-w-4xl">
            <DebateComments debateId={id} />
          </div>
        </div>
      )}
    </div>
  )
}
