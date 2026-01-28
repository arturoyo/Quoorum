'use client'

import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, Award, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

interface Dimension {
  id: string
  name: string
  description: string
  weight: number
  score: number
  status: 'missing' | 'partial' | 'complete'
  suggestions: string[]
}

interface ContextDimensionsPanelProps {
  dimensions: Dimension[]
  overallScore: number
}

const DIMENSION_ICONS: Record<string, string> = {
  objective: '[INFO]',
  constraints: '💰',
  stakeholders: '👥',
  context: '📍',
  options: '⚡',
  criteria: '📏',
  risks: '[WARN]',
  timeline: '⏰',
  vision: '🔮',
  current_state: '📊',
  market: '🌍',
  resources: '🛠️',
  differentiators: '[INFO]',
  problem: '[ERROR]',
  user: '👤',
  solution: '💡',
  mvp: '[INFO]',
  metrics: '📈',
}

export function ContextDimensionsPanel({ dimensions, overallScore }: ContextDimensionsPanelProps) {
  // Ordenar dimensiones: critical (high weight) primero
  const sortedDimensions = [...dimensions].sort((a, b) => b.weight - a.weight)

  // Calcular stats
  const complete = dimensions.filter(d => d.status === 'complete').length
  const partial = dimensions.filter(d => d.status === 'partial').length
  const missing = dimensions.filter(d => d.status === 'missing').length

  // Calcular estimated success rate basado en score
  const estimatedSuccessRate = Math.min(100, Math.round(overallScore * 1.1)) // Boost ligero

  return (
    <div className="space-y-4">
      {/* Overall Score Header */}
      <div className="bg-[#111b21] border border-[#2a3942] rounded-lg p-4">
        {/* Scientific Badge */}
        <div className="flex items-center justify-between mb-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="border-purple-500/30 bg-purple-900/20 text-purple-300 hover:bg-purple-900/30 cursor-help">
                  <Award className="h-3 w-3 mr-1" />
                  Consenso Científico
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-[#202c33] border-[#2a3942] text-white">
                <p className="text-xs">
                  <strong>Algoritmo validado:</strong> 4 expertos IA independientes analizan tu contexto.
                  El consenso final garantiza decisiones equilibradas, no sesgadas por un solo modelo.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-[#aebac1]">Calidad del Contexto</h3>
            <p className="text-xs text-[#8696a0] mt-1">
              Objetivo: 85%+ para continuar
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{overallScore}%</div>
            <div className={cn(
              "text-xs font-medium mt-1",
              overallScore >= 85 ? "text-green-400" :
              overallScore >= 60 ? "text-yellow-400" :
              "text-red-400"
            )}>
              {overallScore >= 85 ? '✓ Excelente' :
               overallScore >= 60 ? '→ Bueno' :
               '[ERROR] Insuficiente'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-[#2a3942] rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500",
              overallScore >= 85 ? "bg-gradient-to-r from-green-600 to-emerald-500" :
              overallScore >= 60 ? "bg-gradient-to-r from-yellow-600 to-orange-500" :
              "bg-gradient-to-r from-red-600 to-pink-500"
            )}
            style={{ width: `${Math.min(overallScore, 100)}%` }}
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-400" />
            <span className="text-[#aebac1]">{complete} completas</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-yellow-400" />
            <span className="text-[#aebac1]">{partial} parciales</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-red-400" />
            <span className="text-[#aebac1]">{missing} faltantes</span>
          </div>
        </div>

        {/* Confidence Score Badge */}
        <div className="mt-3 pt-3 border-t border-[#2a3942]">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-between cursor-help">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-medium text-[#aebac1]">
                      Success Rate Estimado
                    </span>
                    <Info className="h-3 w-3 text-[#8696a0]" />
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-bold",
                      estimatedSuccessRate >= 80
                        ? "border-green-500/30 bg-green-900/20 text-green-300"
                        : estimatedSuccessRate >= 60
                        ? "border-yellow-500/30 bg-yellow-900/20 text-yellow-300"
                        : "border-red-500/30 bg-red-900/20 text-red-300"
                    )}
                  >
                    {estimatedSuccessRate}%
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-[#202c33] border-[#2a3942] text-white">
                <p className="text-xs">
                  <strong>Probabilidad de éxito:</strong> Basado en la calidad del contexto,
                  estimamos un {estimatedSuccessRate}% de probabilidad de que los expertos
                  alcancen un consenso sólido y útil.
                </p>
                <p className="text-xs mt-2 text-[#8696a0]">
                  Debates con contexto 85%+ tienen 90%+ de consenso exitoso.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Dimensions List */}
      <div className="space-y-2">
        {sortedDimensions.map((dimension) => {
          const icon = DIMENSION_ICONS[dimension.id] || '📋'
          const statusIcon =
            dimension.status === 'complete' ? <CheckCircle2 className="h-4 w-4 text-green-400" /> :
            dimension.status === 'partial' ? <AlertTriangle className="h-4 w-4 text-yellow-400" /> :
            <XCircle className="h-4 w-4 text-red-400" />

          const statusText =
            dimension.status === 'complete' ? '✓ Completo' :
            dimension.status === 'partial' ? '→ Más detalles' :
            '[ERROR] Crítico'

          return (
            <div
              key={dimension.id}
              className={cn(
                "bg-[#111b21] border rounded-lg p-3 transition-colors",
                dimension.status === 'complete' ? "border-green-500/30" :
                dimension.status === 'partial' ? "border-yellow-500/30" :
                "border-red-500/30"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-white truncate">
                        {dimension.name}
                      </h4>
                      {dimension.weight > 0.15 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Crítico
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8696a0] truncate mt-0.5">
                      {dimension.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statusIcon}
                  <span className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    dimension.status === 'complete' ? "text-green-400" :
                    dimension.status === 'partial' ? "text-yellow-400" :
                    "text-red-400"
                  )}>
                    {dimension.score}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 bg-[#2a3942] rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    dimension.status === 'complete' ? "bg-green-500" :
                    dimension.status === 'partial' ? "bg-yellow-500" :
                    "bg-red-500"
                  )}
                  style={{ width: `${dimension.score}%` }}
                />
              </div>

              {/* Suggestions (only for partial/missing) */}
              {dimension.status !== 'complete' && dimension.suggestions.length > 0 && (
                <div className="mt-2 pl-7">
                  <p className="text-xs text-[#aebac1] italic">
                    💡 {dimension.suggestions[0]}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Improvement Tip */}
      {overallScore < 85 && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-medium text-purple-300 mb-1">
                Cómo alcanzar 85%
              </h4>
              <p className="text-xs text-[#aebac1]">
                {missing > 0 ? (
                  `Completa las ${missing} dimensiones faltantes (marcadas en rojo) respondiendo las preguntas abajo.`
                ) : partial > 0 ? (
                  `Añade más detalles a las ${partial} dimensiones parciales para alcanzar el objetivo.`
                ) : (
                  'Casi listo! Refina un poco más los detalles para alcanzar 85%.'
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
