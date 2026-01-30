'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  MessageCircle,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  SkipForward,
} from 'lucide-react'
import { cn, styles } from '@/lib/utils'
import { api } from '@/lib/trpc/client'
import { useWebSocket } from './websocket-provider'
// Animations disabled - components not used
// import { FadeIn, SlideUp, StaggerList, StaggerItem } from './animations'

// ============================================================================
// Types
// ============================================================================

interface RoundMessage {
  agentKey?: string
  agentName?: string // Narrative name (e.g., "Atenea", "Montessori", "Perspectiva A")
  expert?: string // Legacy field (dynamic mode)
  role?: 'moderator' | 'expert'
  content: string
  timestamp?: string
  provider?: string // AI provider (e.g., "anthropic", "openai")
  modelId?: string // AI model (e.g., "claude-3-5-sonnet", "gpt-4o")
}

// Note: DebateRound type defined but used dynamically via API response

interface RankingOption {
  option: string
  score: number
  reasoning?: string
}

interface Intervention {
  round: number
  type: string
  prompt: string
  wasEffective?: boolean
}

interface DebateUpdate {
  type: string
  payload?: unknown
}

interface DebateViewerProps {
  debateId: string
  realtime?: boolean
}

export function DebateViewer({ debateId, realtime = false }: DebateViewerProps) {
  const [currentRound, setCurrentRound] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Fetch debate data from tRPC
  const { data: debate, isLoading: isLoadingDebate } = api.debates.get.useQuery(
    { id: debateId }
  )

  // TODO: Enable WebSocket when WebSocketProvider is added to layout
  // For now, we skip WebSocket and rely on tRPC polling
  // const { subscribe } = useWebSocket()
  //
  // useEffect(() => {
  //   if (!realtime) return
  //
  //   const unsubscribe = subscribe(`debate:${debateId}`, (_update: DebateUpdate) => {
  //     // WebSocket updates will trigger tRPC refetch
  //     // This ensures UI is always in sync
  //     // Debate update received via WebSocket
  //   })
  //
  //   return () => unsubscribe()
  // }, [debateId, realtime, subscribe])

  // Auto-play rounds
  useEffect(() => {
    if (!isPlaying || !debate?.rounds) return

    const rounds = debate.rounds
    const timer = setInterval(() => {
      setCurrentRound((prev) => {
        if (prev >= rounds.length - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 3000) // 3 seconds per round

    return () => clearInterval(timer)
  }, [isPlaying, debate])

  if (isLoadingDebate || !debate) {
    return (
      <Card className="styles.colors.border.default styles.colors.bg.tertiary">
        <CardContent className="p-8 text-center">
          <div className="styles.colors.text.tertiary">Cargando debate...</div>
        </CardContent>
      </Card>
    )
  }

  const currentRoundData = debate.rounds?.[currentRound]
  // Use totalRounds from debate if available, otherwise use rounds.length (completed rounds)
  // For in-progress debates, we might not know totalRounds yet, so use rounds.length
  const totalRounds = (debate as { totalRounds?: number }).totalRounds ?? debate.rounds?.length ?? 0
  const progress = totalRounds > 0 ? ((currentRound + 1) / totalRounds) * 100 : 0

  // Theme name mapping
  const getThemeName = (themeId?: string) => {
    if (!themeId) return null
    const themeNames: Record<string, string> = {
      'greek-mythology': 'Mitología Griega 🏛️',
      'arthurian-legend': 'Leyendas Artúricas ⚔️',
      'norse-mythology': 'Mitología Nórdica 🔨',
      education: 'Educación 📚',
      finance: 'Finanzas 💰',
      health: 'Salud ⚕️',
      law: 'Derecho ⚖️',
      science: 'Ciencia 🔬',
      generic: 'Análisis Neutral 🔍',
    }
    return themeNames[themeId] ?? themeId
  }

  const themeName = getThemeName((debate as { themeId?: string }).themeId)

  return (
    <div className="space-y-4">
      {/* Theme Indicator */}
      {themeName && (
        <Card className="styles.colors.border.default styles.colors.bg.tertiary">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="styles.colors.text.tertiary">Tema narrativo:</span>
              <Badge variant="outline" className="border-[#00a884] text-[#00a884]">
                {themeName}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      <Card className="styles.colors.border.default styles.colors.bg.tertiary">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="styles.colors.text.tertiary">
              Ronda {currentRound + 1} de {totalRounds}
            </span>
            <span className="styles.colors.text.tertiary">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />

          {/* Playback Controls */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentRound(Math.max(0, currentRound - 1))}
              disabled={currentRound === 0}
              className="styles.colors.border.default styles.colors.bg.secondary text-[#e9edef]"
            >
              <SkipForward className="h-4 w-4 rotate-180" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="styles.colors.border.default styles.colors.bg.secondary text-[#e9edef]"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentRound(Math.min((debate.rounds?.length ?? 1) - 1, currentRound + 1))
              }
              disabled={currentRound >= (debate.rounds?.length ?? 1) - 1}
              className="styles.colors.border.default styles.colors.bg.secondary text-[#e9edef]"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quality Metrics */}
      {debate.qualityMetrics && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="styles.colors.border.default styles.colors.bg.tertiary">
            <CardContent className="p-4">
              <div className="text-sm styles.colors.text.tertiary">Depth</div>
              <div className="text-2xl font-bold text-[#e9edef]">
                {debate.qualityMetrics.depth ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card className="styles.colors.border.default styles.colors.bg.tertiary">
            <CardContent className="p-4">
              <div className="text-sm styles.colors.text.tertiary">Diversity</div>
              <div className="text-2xl font-bold text-[#e9edef]">
                {debate.qualityMetrics.diversity ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card className="styles.colors.border.default styles.colors.bg.tertiary">
            <CardContent className="p-4">
              <div className="text-sm styles.colors.text.tertiary">Originality</div>
              <div className="text-2xl font-bold text-[#e9edef]">
                {debate.qualityMetrics.originality ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Round Messages */}
      {currentRoundData && (
        <Card className="styles.colors.border.default styles.colors.bg.tertiary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#e9edef]">
              <MessageCircle className="h-5 w-5" />
              Ronda {currentRound + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentRoundData.messages?.map((message: RoundMessage, idx: number) => (
              <div
                key={idx}
                className={cn(
                  'rounded-lg p-4',
                  message.role === 'moderator'
                    ? 'bg-[#00a884]/10 border border-[#00a884]/30'
                    : 'styles.colors.bg.secondary'
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={message.role === 'moderator' ? 'default' : 'outline'}
                      className={cn(
                        message.role === 'moderator'
                          ? 'bg-[#00a884] text-white'
                          : 'border-[#8696a0] styles.colors.text.tertiary'
                      )}
                    >
                      {/* Show narrative name (anonymized) for all users */}
                      {message.agentName ?? message.expert ?? 'Moderador'}
                    </Badge>
                    {/* TODO: Add admin mode to show model info
                    {isAdmin && message.modelId && (
                      <span className="text-xs styles.colors.text.tertiary">
                        ({message.modelId})
                      </span>
                    )}
                    */}
                  </div>
                  {message.role === 'moderator' && (
                    <AlertTriangle className="h-4 w-4 text-[#00a884]" />
                  )}
                </div>
                <p className="text-sm text-[#e9edef]">{message.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Final Ranking */}
      {debate.status === 'completed' && debate.finalRanking && (
        <Card className="styles.colors.border.default styles.colors.bg.tertiary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#e9edef]">
              <TrendingUp className="h-5 w-5" />
              Ranking Final
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(debate.finalRanking as RankingOption[]).map((option: RankingOption, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg styles.colors.bg.secondary p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full font-bold',
                      idx === 0
                        ? 'bg-[#00a884] text-white'
                        : idx === 1
                          ? 'bg-[#8696a0]/30 text-[#e9edef]'
                          : 'bg-[#8696a0]/10 styles.colors.text.tertiary'
                    )}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-[#e9edef]">
                    {typeof option.option === 'object'
                      ? JSON.stringify(option.option, null, 2)
                      : option.option}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm styles.colors.text.tertiary">{option.score.toFixed(1)}%</span>
                  {idx === 0 && <CheckCircle className="h-4 w-4 text-[#00a884]" />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Interventions */}
      {debate.interventions && debate.interventions.length > 0 && (
        <Card className="styles.colors.border.default styles.colors.bg.tertiary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#e9edef]">
              <AlertTriangle className="h-5 w-5 text-[#00a884]" />
              Intervenciones del Meta-Moderador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(debate.interventions as Intervention[]).map((intervention: Intervention, idx: number) => (
              <div key={idx} className="rounded-lg border border-[#00a884]/30 bg-[#00a884]/10 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <Badge variant="outline" className="border-[#00a884] text-[#00a884]">
                    {intervention.type}
                  </Badge>
                  <span className="text-xs styles.colors.text.tertiary">Ronda {intervention.round}</span>
                </div>
                <p className="text-sm text-[#e9edef]">{intervention.prompt}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
