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
    description: 'Un debate único sin subdivisión',
    icon: Sparkles,
  },
  sequential: {
    label: 'Secuencial',
    description: 'A → B → C → Conclusión (debates en orden)',
    icon: TrendingUp,
  },
  parallel: {
    label: 'Paralelo',
    description: 'A, B, C simultáneamente → Síntesis',
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
    description: 'Eliminación por brackets (A vs B, C vs D)',
    icon: Sparkles,
  },
  adversarial: {
    label: 'Adversarial',
    description: 'Defensor vs Atacante + Juez',
    icon: Sparkles,
  },
  ensemble: {
    label: 'Ensemble',
    description: 'Múltiples debates independientes → Agregación',
    icon: Sparkles,
  },
  hierarchical: {
    label: 'Jerárquico',
    description: 'Estructura de árbol, drill down',
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
      <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <CardContent className="py-6 text-center text-sm text-gray-400">
          Escribe una pregunta para ver las estrategias recomendadas
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5 text-purple-400" />
          Estrategia de Deliberación
        </CardTitle>
        <CardDescription className="text-gray-400">
          Selecciona cómo quieres que se ejecute el debate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Selection */}
        <div className="space-y-2">
          <Label className="text-white">Modo de Selección</Label>
          <Select value={patternMode} onValueChange={(v) => setPatternMode(v as typeof patternMode)}>
            <SelectTrigger className="border-white/10 bg-slate-800/50 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Automático (Recomendado)</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          </div>
        ) : patternMode === 'auto' && strategyAnalysis ? (
          <>
            {/* Recommended Strategy */}
            <div className="rounded-lg border-2 border-purple-500/50 bg-purple-900/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-purple-600 text-white">
                      Recomendado ({Math.round(strategyAnalysis.confidence * 100)}%)
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-white mb-1">
                    {PATTERN_LABELS[strategyAnalysis.recommendedPattern]?.label || strategyAnalysis.recommendedPattern}
                  </h3>
                  <p className="text-sm text-gray-300 mb-3">
                    {PATTERN_LABELS[strategyAnalysis.recommendedPattern]?.description || strategyAnalysis.reasoning}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
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
                <Label className="text-sm text-gray-400">Estrategias Alternativas</Label>
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
                        'justify-start border-white/10 bg-slate-800/30 text-gray-300 hover:bg-purple-600/20 hover:border-purple-500/50 hover:text-white',
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
              <div className="rounded-lg border border-white/5 bg-slate-800/30 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-400" />
                  <Label className="text-xs text-gray-400">Señales Detectadas</Label>
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
          <div className="space-y-2">
            <Label className="text-white">Seleccionar Estrategia Manualmente</Label>
            <Select value={manualPattern} onValueChange={setManualPattern}>
              <SelectTrigger className="border-white/10 bg-slate-800/50 text-white">
                <SelectValue placeholder="Elige una estrategia..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PATTERN_LABELS).map(([pattern, info]) => (
                  <SelectItem key={pattern} value={pattern}>
                    <div>
                      <div className="font-medium">{info.label}</div>
                      <div className="text-xs text-gray-400">{info.description}</div>
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
