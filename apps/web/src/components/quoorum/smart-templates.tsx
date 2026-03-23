'use client'

import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Users, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

// ============================================================================
// TYPES
// ============================================================================

interface SimilarDebate {
  id: string
  question: string
  contextQuality: number
  successfulDimensions: string[]
  expertCount: number
  createdAt: Date
}

interface SmartTemplatesProps {
  similarDebates: SimilarDebate[]
  onUseTemplate: (debateId: string) => void
  onSkip: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SmartTemplates({
  similarDebates,
  onUseTemplate,
  onSkip,
}: SmartTemplatesProps) {
  if (similarDebates.length === 0) {
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
              <Sparkles className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold styles.colors.text.primary">
                ?? Debates Similares Exitosos
              </h3>
            </div>
            <p className="mt-1 text-sm styles.colors.text.secondary">
              He encontrado {similarDebates.length} debates similares con alta calidad.
              Puedes reutilizar su contexto.
            </p>
          </div>

          <Button
            onClick={onSkip}
            variant="ghost"
            size="sm"
            className="styles.colors.text.tertiary hover:styles.colors.text.primary"
          >
            Omitir
          </Button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {similarDebates.map((debate, index) => (
          <motion.div
            key={debate.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="group relative overflow-hidden styles.colors.border.default styles.colors.bg.secondary p-4 transition-all hover:border-purple-500/40 hover:styles.colors.bg.tertiary">
              {/* Quality Badge */}
              <div className="absolute right-2 top-2">
                <Badge
                  variant="outline"
                  className="border-green-500/30 bg-green-900/20 text-green-300"
                >
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {Math.round(debate.contextQuality)}% calidad
                </Badge>
              </div>

              {/* Question */}
              <div className="mb-3 pr-20">
                <p className="text-sm font-medium styles.colors.text.primary line-clamp-2">
                  {debate.question}
                </p>
              </div>

              {/* Stats */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-xs styles.colors.text.tertiary">
                  <Users className="h-3 w-3" />
                  {debate.expertCount} expertos
                </div>
                <div className="flex items-center gap-2 text-xs styles.colors.text.tertiary">
                  <CheckCircle2 className="h-3 w-3" />
                  {debate.successfulDimensions.length} dimensiones completas
                </div>
                <div className="text-xs styles.colors.text.tertiary">
                  Hace {formatDistanceToNow(debate.createdAt, { locale: es })}
                </div>
              </div>

              {/* Successful Dimensions */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium styles.colors.text.secondary">
                  Dimensiones incluidas:
                </p>
                <div className="flex flex-wrap gap-1">
                  {debate.successfulDimensions.slice(0, 4).map((dim, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="styles.colors.border.default styles.colors.bg.primary styles.colors.text.tertiary text-xs"
                    >
                      {dim}
                    </Badge>
                  ))}
                  {debate.successfulDimensions.length > 4 && (
                    <Badge
                      variant="outline"
                      className="styles.colors.border.default styles.colors.bg.primary styles.colors.text.tertiary text-xs"
                    >
                      +{debate.successfulDimensions.length - 4}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Use Template Button */}
              <Button
                onClick={() => onUseTemplate(debate.id)}
                size="sm"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white group-hover:bg-purple-700"
              >
                Usar como plantilla
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="rounded-lg border styles.colors.border.default styles.colors.bg.primary p-3"
      >
        <p className="text-xs styles.colors.text.tertiary">
          ?? <span className="styles.colors.text.secondary">Tip:</span> Los debates con 85%+ calidad de
          contexto tienen 3x m�s probabilidad de generar insights accionables.
        </p>
      </motion.div>
    </motion.div>
  )
}
