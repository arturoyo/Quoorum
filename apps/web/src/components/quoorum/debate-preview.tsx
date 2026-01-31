'use client'

import { motion } from 'framer-motion'
import {
  Eye,
  Users,
  AlertTriangle,
  Info,
  TrendingUp,
  MessageSquare,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

// ============================================================================
// TYPES
// ============================================================================

interface DebatePoint {
  topic: string
  expertA: {
    name: string
    position: string
    reasoning: string
  }
  expertB: {
    name: string
    position: string
    reasoning: string
  }
  controversy: number
  importance: 'critical' | 'important' | 'moderate'
}

interface WeakPoint {
  dimension: string
  issue: string
  impact: string
  suggestion: string
}

interface DebatePreviewProps {
  hotPoints: DebatePoint[]
  weakPoints: WeakPoint[]
  estimatedRounds: number
  consensusLikelihood: number
  onAddContext: (suggestion: string) => void
  onClose: () => void
}

// ============================================================================
// IMPORTANCE CONFIGS
// ============================================================================

const importanceConfig = {
  critical: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-500/30',
  },
  important: {
    icon: <Info className="h-4 w-4" />,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-500/30',
  },
  moderate: {
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-500/30',
  },
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DebatePreview({
  hotPoints,
  weakPoints,
  estimatedRounds,
  consensusLikelihood,
  onAddContext,
  onClose,
}: DebatePreviewProps) {
  const [expandedPoint, setExpandedPoint] = useState<number | null>(null)

  if (hotPoints.length === 0 && weakPoints.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="rounded-lg border border-purple-500/30 bg-purple-900/20 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold styles.colors.text.primary">
                🎭 Preview del Debate
              </h3>
            </div>
            <p className="mt-1 text-sm styles.colors.text.secondary">
              Predicción de cómo debatirán los expertos con tu contexto actual
            </p>
          </div>

          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="styles.colors.text.tertiary hover:styles.colors.text.primary"
          >
            Cerrar
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="rounded border styles.colors.border.default styles.colors.bg.primary p-3">
            <div className="flex items-center gap-2 text-xs styles.colors.text.tertiary">
              <MessageSquare className="h-4 w-4" />
              Rondas estimadas
            </div>
            <p className="mt-1 text-2xl font-bold styles.colors.text.primary">{estimatedRounds}</p>
          </div>

          <div className="rounded border styles.colors.border.default styles.colors.bg.primary p-3">
            <div className="flex items-center gap-2 text-xs styles.colors.text.tertiary">
              <Target className="h-4 w-4" />
              Prob. consenso
            </div>
            <p className="mt-1 text-2xl font-bold styles.colors.text.primary">{consensusLikelihood}%</p>
          </div>

          <div className="rounded border styles.colors.border.default styles.colors.bg.primary p-3">
            <div className="flex items-center gap-2 text-xs styles.colors.text.tertiary">
              <Users className="h-4 w-4" />
              Puntos de debate
            </div>
            <p className="mt-1 text-2xl font-bold styles.colors.text.primary">{hotPoints.length}</p>
          </div>
        </div>
      </div>

      {/* Hot Points */}
      {hotPoints.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold styles.colors.text.primary">
            [WARN] Puntos Calientes (Alta Controversia)
          </h4>
          {hotPoints.map((point, index) => {
            const config = importanceConfig[point.importance]
            const isExpanded = expandedPoint === index

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`border ${config.borderColor} ${config.bgColor} p-4 transition-all ${
                    isExpanded ? 'ring-2 ring-purple-500/50' : ''
                  }`}
                >
                  {/* Header */}
                  <button
                    onClick={() => setExpandedPoint(isExpanded ? null : index)}
                    className="flex w-full items-start justify-between text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={config.color}>{config.icon}</span>
                        <Badge
                          variant="outline"
                          className="border-purple-500/30 bg-purple-900/20 text-purple-300"
                        >
                          {point.controversy}% controversia
                        </Badge>
                        <h5 className="text-sm font-semibold styles.colors.text.primary">{point.topic}</h5>
                      </div>
                    </div>

                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 styles.colors.text.tertiary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 styles.colors.text.tertiary" />
                      )}
                    </motion.div>
                  </button>

                  {/* Collapsed Preview */}
                  {!isExpanded && (
                    <div className="mt-2 flex gap-4 text-xs styles.colors.text.tertiary">
                      <span>
                        {point.expertA.name}: {point.expertA.position}
                      </span>
                      <span>vs</span>
                      <span>
                        {point.expertB.name}: {point.expertB.position}
                      </span>
                    </div>
                  )}

                  {/* Expanded Content */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4 space-y-4"
                    >
                      {/* Expert A */}
                      <div className="rounded border styles.colors.border.default styles.colors.bg.primary p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-purple-400" />
                          <p className="text-xs font-medium text-purple-300">
                            {point.expertA.name}
                          </p>
                        </div>
                        <p className="text-sm font-medium styles.colors.text.primary mb-1">
                          {point.expertA.position}
                        </p>
                        <p className="text-xs styles.colors.text.secondary">{point.expertA.reasoning}</p>
                      </div>

                      {/* VS */}
                      <div className="text-center text-xs font-bold styles.colors.text.tertiary">VS</div>

                      {/* Expert B */}
                      <div className="rounded border styles.colors.border.default styles.colors.bg.primary p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-purple-400" />
                          <p className="text-xs font-medium text-purple-300">
                            {point.expertB.name}
                          </p>
                        </div>
                        <p className="text-sm font-medium styles.colors.text.primary mb-1">
                          {point.expertB.position}
                        </p>
                        <p className="text-xs styles.colors.text.secondary">{point.expertB.reasoning}</p>
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Weak Points */}
      {weakPoints.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold styles.colors.text.primary">
            [WARN] Puntos Débiles (Contexto Insuficiente)
          </h4>
          {weakPoints.map((weak, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-yellow-500/30 bg-yellow-900/10 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      <h5 className="text-sm font-semibold styles.colors.text.primary">{weak.dimension}</h5>
                    </div>
                    <p className="text-sm styles.colors.text.secondary mb-2">{weak.issue}</p>
                    <p className="text-xs text-yellow-300 mb-3">
                      💡 Impacto: {weak.impact}
                    </p>
                    <div className="rounded border styles.colors.border.default styles.colors.bg.primary p-2">
                      <p className="text-xs styles.colors.text.tertiary mb-1">Sugerencia:</p>
                      <p className="text-xs styles.colors.text.primary">{weak.suggestion}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => onAddContext(weak.suggestion)}
                  size="sm"
                  className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700 styles.colors.text.primary"
                >
                  Añadir contexto sugerido
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
