'use client'

import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Sparkles, TrendingUp, Clock, DollarSign, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface StrategySelectorProps {
  question: string
  onStrategySelect?: (pattern: string) => void
  selectedPattern?: string
}

const PATTERN_LABELS: Record<string, { label: string; description: string; icon: typeof Sparkles }> = {
  simple: {
    label: 'Simple',
    description: 'Un debate �nico sin subdivisi�n',
    icon: Sparkles,
  },
  sequential: {
    label: 'Secuencial',
    description: 'A ? B ? C ? Conclusi�n (debates en orden)',
    icon: TrendingUp,
  },
  parallel: {
    label: 'Paralelo',
    description: 'A, B, C simult�neamente ? S�ntesis',
    icon: Sparkles,
  },
  conditional: {
    label: 'Condicional',
    description: 'Rama basada en resultados',
    icon: Sparkles,
  },
  iterative: {
    label: 'Iterativo',
    description: 'Loop hasta umbral de calidad',
    icon: Sparkles,
  },
  tournament: {
    label: 'Torneo',
    description: 'Eliminaci�n por brackets (A vs B, C vs D)',
    icon: Sparkles,
  },
  adversarial: {
    label: 'Adversarial',
    description: 'Defensor vs Atacante + Juez',
    icon: Sparkles,
  },
  ensemble: {
    label: 'Ensemble',
    description: 'M�ltiples debates independientes ? Agregaci�n',
    icon: Sparkles,
  },
  hierarchical: {
    label: 'Jer�rquico',
    description: 'Estructura de �rbol, drill down',
    icon: Sparkles,
  },
}

export function StrategySelector({ question, onStrategySelect, selectedPattern }: StrategySelectorProps) {
  const [patternMode, setPatternMode] = useState<'auto' | 'manual'>('auto')
  const [manualPattern, setManualPattern] = useState<string>('')

  const {
    data: strategyAnalysis,
    isLoading,
    refetch,
  } = api.debateStrategy.analyzeStrategy.useQuery(
    {
      question: question || '',
      patternMode,
      preferredPattern: manualPattern ? (manualPattern as any) : undefined,
    },
    { enabled: question.length >= 10 }
  )

  useEffect(() => {
    if (strategyAnalysis && onStrategySelect && patternMode === 'auto') {
      onStrategySelect(strategyAnalysis.recommendedPattern)
    } else if (manualPattern && onStrategySelect) {
      onStrategySelect(manualPattern)
    }
  }, [strategyAnalysis, manualPattern, patternMode, onStrategySelect])

  if (!question || question.length < 10) {
    return (
      <Card className="border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] backdrop-blur-xl">
        <CardContent className="py-6 text-center text-sm text-[var(--theme-text-secondary)]">
          Escribe una pregunta para ver las estrategias recomendadas
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--theme-text-primary)]">
          <Sparkles className="h-5 w-5 text-purple-400" />
          Estrategia de Deliberaci�n
        </CardTitle>
        <CardDescription className="text-[var(--theme-text-secondary)]">
          Selecciona c�mo quieres que se ejecute el debate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Selection */}
        <div className="space-y-2">
          <Label className="text-[var(--theme-text-primary)]">Modo de Selecci�n</Label>
          <Select value={patternMode} onValueChange={(v) => setPatternMode(v as typeof patternMode)}>
            <SelectTrigger className="border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Autom�tico (Recomendado)</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto Mode: Show recommended strategy */}
        {patternMode === 'auto' ? (
          isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              <span className="ml-2 text-sm text-[var(--theme-text-secondary)]">Analizando estrategia...</span>
            </div>
          ) : strategyAnalysis ? (
            <>
              {/* Recommended Strategy - Always visible in auto mode */}
              <div className="rounded-lg border-2 border-purple-500/50 bg-purple-900/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-purple-600 text-white">
                        Recomendado ({Math.round(strategyAnalysis.confidence * 100)}%)
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-[var(--theme-text-primary)] mb-1">
                      {PATTERN_LABELS[strategyAnalysis.recommendedPattern]?.label || strategyAnalysis.recommendedPattern}
                    </h3>
                    <p className="text-sm text-[var(--theme-text-secondary)] mb-3">
                      {PATTERN_LABELS[strategyAnalysis.recommendedPattern]?.description || strategyAnalysis.reasoning}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[var(--theme-text-secondary)]">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>~{strategyAnalysis.estimatedTimeMinutes} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>~${strategyAnalysis.estimatedCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            {/* Alternative Patterns */}
            {strategyAnalysis.alternativePatterns && strategyAnalysis.alternativePatterns.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-[var(--theme-text-secondary)]">Estrategias Alternativas</Label>
                <div className="grid grid-cols-2 gap-2">
                  {strategyAnalysis.alternativePatterns.map((pattern) => (
                    <Button
                      key={pattern}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPatternMode('manual')
                        setManualPattern(pattern)
                      }}
                      className={cn(
                        'justify-start border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-secondary)] hover:bg-purple-600/20 hover:border-purple-500/50 hover:text-white',
                        selectedPattern === pattern && 'border-purple-500 bg-purple-600/20 text-white'
                      )}
                    >
                      {PATTERN_LABELS[pattern]?.label || pattern}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Detected Signals */}
            {strategyAnalysis.signals && strategyAnalysis.signals.length > 0 && (
              <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-400" />
                  <Label className="text-xs text-[var(--theme-text-secondary)]">Se�ales Detectadas</Label>
                </div>
                <div className="flex flex-wrap gap-1">
                  {strategyAnalysis.signals
                    .filter((s) => s.detected)
                    .map((signal) => (
                      <Badge key={signal.type} variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                        {signal.type.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
            </>
          ) : (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-900/10 p-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <Info className="h-4 w-4" />
                <span className="text-sm">No se pudo analizar la estrategia. Intenta cambiar a modo manual.</span>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-2">
            <Label className="text-[var(--theme-text-primary)]">Seleccionar Estrategia Manualmente</Label>
            <Select value={manualPattern} onValueChange={setManualPattern}>
              <SelectTrigger className="border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)]">
                <SelectValue placeholder="Elige una estrategia..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PATTERN_LABELS).map(([pattern, info]) => (
                  <SelectItem key={pattern} value={pattern}>
                    <div>
                      <div className="font-medium">{info.label}</div>
                      <div className="text-xs text-[var(--theme-text-secondary)]">{info.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
