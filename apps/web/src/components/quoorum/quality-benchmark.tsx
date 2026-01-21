'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Award, Target, BarChart3, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// ============================================================================
// TYPES
// ============================================================================

interface BenchmarkComparison {
  percentile: number
  tier: 'excellent' | 'good' | 'average' | 'needs-improvement'
  score: number
  avgScore: number
  topScore: number
}

interface DimensionBenchmark {
  dimensionId: string
  dimensionName: string
  yourScore: number
  avgScore: number
  topScore: number
  gap: number
  improvement: string
}

interface QualityBenchmarkProps {
  overall: BenchmarkComparison
  dimensions: DimensionBenchmark[]
  recommendations: string[]
  estimatedSuccessRate: number
  comparisonInsights: string[]
  onClose: () => void
}

// ============================================================================
// TIER CONFIGS
// ============================================================================

const tierConfig = {
  excellent: {
    icon: <Award className="h-5 w-5" />,
    label: 'Excelente',
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-500/30',
  },
  good: {
    icon: <TrendingUp className="h-5 w-5" />,
    label: 'Bueno',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-500/30',
  },
  average: {
    icon: <Target className="h-5 w-5" />,
    label: 'Promedio',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-500/30',
  },
  'needs-improvement': {
    icon: <BarChart3 className="h-5 w-5" />,
    label: 'Necesita Mejora',
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-500/30',
  },
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QualityBenchmark({
  overall,
  dimensions,
  recommendations,
  estimatedSuccessRate,
  comparisonInsights,
  onClose,
}: QualityBenchmarkProps) {
  const config = tierConfig[overall.tier]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">
                📊 Quality Benchmarking
              </h3>
            </div>
            <p className="mt-1 text-sm text-[#aebac1]">
              Comparación con {Math.round(overall.percentile)}% de debates históricos
            </p>
          </div>

          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-[#8696a0] hover:text-white"
          >
            Cerrar
          </Button>
        </div>

        {/* Overall Score */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Card className="border-[#2a3942] bg-[#111b21] p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-3 ${config.bgColor}`}>
                <span className={config.color}>{config.icon}</span>
              </div>
              <div>
                <p className="text-xs text-[#8696a0]">Tu Score</p>
                <p className="text-3xl font-bold text-white">{overall.score}%</p>
                <Badge
                  variant="outline"
                  className={`mt-1 ${config.borderColor} ${config.bgColor} ${config.color}`}
                >
                  {config.label}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="border-[#2a3942] bg-[#111b21] p-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#8696a0]">Percentil</span>
                <span className="font-semibold text-white">
                  {Math.round(overall.percentile)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8696a0]">Promedio</span>
                <span className="font-semibold text-[#aebac1]">{overall.avgScore}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8696a0]">Top 10%</span>
                <span className="font-semibold text-green-400">{overall.topScore}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8696a0]">Prob. Éxito</span>
                <span className="font-semibold text-purple-400">
                  {estimatedSuccessRate}%
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Dimensions Comparison */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-white">
          📈 Comparación por Dimensión
        </h4>
        {dimensions.map((dim, index) => {
          const isAboveAvg = dim.yourScore > dim.avgScore
          const isTopTier = dim.yourScore >= dim.topScore - 5

          return (
            <motion.div
              key={dim.dimensionId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-[#2a3942] bg-[#111b21] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-white">{dim.dimensionName}</h5>
                  {isTopTier ? (
                    <Badge variant="outline" className="border-green-500/30 bg-green-900/20 text-green-300">
                      <Award className="mr-1 h-3 w-3" />
                      Top 10%
                    </Badge>
                  ) : isAboveAvg ? (
                    <Badge variant="outline" className="border-blue-500/30 bg-blue-900/20 text-blue-300">
                      <ArrowUp className="mr-1 h-3 w-3" />
                      Sobre promedio
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-yellow-500/30 bg-yellow-900/20 text-yellow-300">
                      <ArrowDown className="mr-1 h-3 w-3" />
                      Bajo promedio
                    </Badge>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-[#8696a0]">
                    <span>Tu score: {dim.yourScore}%</span>
                    <span>Gap al top: {dim.gap}</span>
                  </div>
                  <Progress value={dim.yourScore} className="h-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8696a0]">
                      Promedio: {dim.avgScore}%
                    </span>
                    <span className="text-green-400">
                      Top 10%: {dim.topScore}%
                    </span>
                  </div>
                </div>

                {/* Improvement Suggestion */}
                {dim.gap > 10 && (
                  <div className="mt-3 rounded border border-[#2a3942] bg-[#0b141a] p-2">
                    <p className="text-xs text-[#aebac1]">{dim.improvement}</p>
                  </div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">
            💡 Recomendaciones
          </h4>
          <Card className="border-purple-500/30 bg-purple-900/10 p-4">
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-[#aebac1]">
                  <span className="text-purple-400">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* AI Insights */}
      {comparisonInsights.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">
            🤖 Insights de IA
          </h4>
          <Card className="border-[#2a3942] bg-[#111b21] p-4">
            <ul className="space-y-2">
              {comparisonInsights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-[#aebac1]">
                  <span className="text-purple-400">→</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </motion.div>
  )
}
