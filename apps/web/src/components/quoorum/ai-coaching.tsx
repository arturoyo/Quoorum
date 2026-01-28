'use client'

import { motion } from 'framer-motion'
import { Bot, AlertTriangle, Info, Lightbulb, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

// ============================================================================
// TYPES
// ============================================================================

interface CoachingSuggestion {
  dimensionId: string
  dimensionName: string
  importance: 'critical' | 'important' | 'nice-to-have'
  suggestion: string
  example: string
  percentageOfSuccessfulDebates: number
}

interface AICoachingProps {
  suggestions: CoachingSuggestion[]
  onAddContext: (dimensionId: string, example: string) => void
  onDismiss: () => void
}

// ============================================================================
// IMPORTANCE CONFIGS
// ============================================================================

const importanceConfig = {
  critical: {
    icon: <AlertTriangle className="h-4 w-4" />,
    label: 'Crítico',
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-500/30',
  },
  important: {
    icon: <Info className="h-4 w-4" />,
    label: 'Importante',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-500/30',
  },
  'nice-to-have': {
    icon: <Lightbulb className="h-4 w-4" />,
    label: 'Opcional',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-500/30',
  },
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AICoaching({ suggestions, onAddContext, onDismiss }: AICoachingProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (suggestions.length === 0) {
    return null
  }

  // Sort by importance
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const order = { critical: 0, important: 1, 'nice-to-have': 2 }
    return order[a.importance] - order[b.importance]
  })

  const criticalCount = suggestions.filter((s) => s.importance === 'critical').length
  const importantCount = suggestions.filter((s) => s.importance === 'important').length

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
              <Bot className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-[var(--theme-text-primary)]">
                ?? AI Coaching Proactivo
              </h3>
            </div>
            <p className="mt-1 text-sm text-[#aebac1]">
              He detectado {suggestions.length} áreas de mejora basadas en debates exitosos.
              {criticalCount > 0 && (
                <span className="ml-1 font-medium text-red-400">
                  {criticalCount} son críticas.
                </span>
              )}
            </p>
          </div>

          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="text-[#8696a0] hover:text-[var(--theme-text-primary)]"
          >
            Cerrar
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="mt-3 flex gap-2">
          {criticalCount > 0 && (
            <Badge
              variant="outline"
              className="border-red-500/30 bg-red-900/20 text-red-300"
            >
              {criticalCount} Críticas
            </Badge>
          )}
          {importantCount > 0 && (
            <Badge
              variant="outline"
              className="border-yellow-500/30 bg-yellow-900/20 text-yellow-300"
            >
              {importantCount} Importantes
            </Badge>
          )}
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {sortedSuggestions.map((suggestion, index) => {
          const config = importanceConfig[suggestion.importance]
          const isExpanded = expandedId === suggestion.dimensionId

          return (
            <motion.div
              key={suggestion.dimensionId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`border ${config.borderColor} ${config.bgColor} p-4 transition-all ${
                  isExpanded ? 'ring-2 ring-purple-500/50' : ''
                }`}
              >
                {/* Header */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : suggestion.dimensionId)
                  }
                  className="flex w-full items-start justify-between text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={config.color}>{config.icon}</span>
                      <Badge
                        variant="outline"
                        className={`${config.borderColor} ${config.bgColor} ${config.color} text-xs`}
                      >
                        {config.label}
                      </Badge>
                      <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                        {suggestion.dimensionName}
                      </h4>
                    </div>
                    <p className="mt-2 text-sm text-[#aebac1]">{suggestion.suggestion}</p>
                  </div>

                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="h-5 w-5 text-[#8696a0]" />
                  </motion.div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 space-y-3"
                  >
                    {/* Stats */}
                    <div className="rounded border border-[#2a3942] bg-[#0b141a] p-3">
                      <p className="text-xs text-[#8696a0]">
                        ??{' '}
                        <span className="font-medium text-purple-300">
                          {suggestion.percentageOfSuccessfulDebates}%
                        </span>{' '}
                        de debates exitosos incluyen esta dimensión
                      </p>
                    </div>

                    {/* Example */}
                    <div className="rounded border border-[#2a3942] bg-[#0b141a] p-3">
                      <p className="mb-1 text-xs font-medium text-[#aebac1]">
                        Ejemplo sugerido:
                      </p>
                      <p className="text-sm text-[var(--theme-text-primary)]">{suggestion.example}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          onAddContext(suggestion.dimensionId, suggestion.example)
                        }
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Añadir al contexto
                      </Button>
                      <Button
                        onClick={() => setExpandedId(null)}
                        size="sm"
                        variant="outline"
                        className="border-[#2a3942] text-[#aebac1] hover:bg-[#2a3942]"
                      >
                        Cerrar
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Bottom Bar (collapsed state) */}
                {!isExpanded && (
                  <div className="mt-2 flex items-center justify-between text-xs text-[#8696a0]">
                    <span>
                      {suggestion.percentageOfSuccessfulDebates}% de debates exitosos
                    </span>
                    <span className="text-purple-400">Click para ver más</span>
                  </div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Add All Button */}
      {criticalCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={() => {
              sortedSuggestions
                .filter((s) => s.importance === 'critical')
                .forEach((s) => onAddContext(s.dimensionId, s.example))
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir todas las críticas ({criticalCount})
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
