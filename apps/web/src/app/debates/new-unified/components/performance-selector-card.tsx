'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { TrendingDown, Scale, Zap, Info, Sparkles } from 'lucide-react'
import { cn, styles } from '@/lib/utils'
import { api } from '@/lib/trpc/client'

interface PerformanceSelectorCardProps {
  // Debate parameters for cost estimation
  numExperts: number
  framework?: string
  numContextQuestions: number
  hasInternetSearch: boolean

  // Current selection
  value: 'economic' | 'balanced' | 'performance'
  onChange: (value: 'economic' | 'balanced' | 'performance') => void

  // Optional
  className?: string
}

const PERFORMANCE_LEVELS = [
  {
    value: 'economic',
    name: 'Económico',
    icon: TrendingDown,
    color: 'text-green-400',
    badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30',
    borderColor: 'border-green-500/30 bg-green-500/5',
    description: 'Modelos básicos. Ideal para debates exploratorios o pruebas.',
    costMultiplier: '0.3x coste',
    savings: '~70% ahorro',
  },
  {
    value: 'balanced',
    name: 'Equilibrado',
    icon: Scale,
    color: 'text-blue-400',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    borderColor: 'border-blue-500/30 bg-blue-500/5',
    description: 'Balance óptimo calidad/precio. Recomendado para la mayoría de debates.',
    costMultiplier: '1.0x coste',
    isRecommended: true,
  },
  {
    value: 'performance',
    name: 'Alto Rendimiento',
    icon: Zap,
    color: 'text-purple-400',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    borderColor: 'border-purple-500/30 bg-purple-500/5',
    description: 'Modelos premium. Máxima calidad para decisiones críticas.',
    costMultiplier: '3.0x coste',
    premium: true,
  },
] as const

export function PerformanceSelectorCard({
  numExperts,
  framework,
  numContextQuestions,
  hasInternetSearch,
  value,
  onChange,
  className,
}: PerformanceSelectorCardProps) {
  const [estimates, setEstimates] = useState<Record<string, number>>({
    economic: 0,
    balanced: 0,
    performance: 0,
  })

  // Get user's default preference
  const { data: userPreference } = api.users.getPerformanceLevel.useQuery()
  const userDefault = userPreference?.performanceLevel || 'balanced'

  // Calculate cost estimates
  useEffect(() => {
    // Dynamic import to avoid bundling server-side code
    import('@quoorum/quoorum/pricing/debate-cost-estimator').then(({ getPerformanceLevelComparison }) => {
      const comparison = getPerformanceLevelComparison({
        numExperts,
        framework,
        numContextQuestions,
        hasInternetSearch,
      })

      setEstimates({
        economic: comparison.economic.total,
        balanced: comparison.balanced.total,
        performance: comparison.performance.total,
      })
    })
  }, [numExperts, framework, numContextQuestions, hasInternetSearch])

  return (
    <Card className={cn(styles.colors.border.default, styles.colors.bg.secondary, className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          Nivel de Rendimiento para Este Debate
        </CardTitle>
        <CardDescription className="styles.colors.text.secondary">
          Elige el nivel de IA para este debate específico. Puedes usar un nivel diferente de tu preferencia global.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={value}
          onValueChange={(val) => onChange(val as 'economic' | 'balanced' | 'performance')}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {PERFORMANCE_LEVELS.map((level) => {
            const Icon = level.icon
            const isSelected = value === level.value
            const isUserDefault = level.value === userDefault
            const estimatedCost = estimates[level.value] || 0

            return (
              <div
                key={level.value}
                className={cn(
                  'relative flex flex-col p-4 rounded-lg border transition-all cursor-pointer',
                  level.borderColor,
                  isSelected && 'ring-2 ring-purple-500/50 shadow-lg',
                  !isSelected && 'hover:border-purple-500/30'
                )}
                onClick={() => onChange(level.value)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <RadioGroupItem value={level.value} id={level.value} className="mt-1" />
                  <div className="flex flex-col items-end gap-1">
                    {isUserDefault && !isSelected && (
                      <Badge variant="outline" className="text-xs">
                        Tu default
                      </Badge>
                    )}
                    {level.isRecommended && (
                      <Badge variant="secondary" className="text-xs">
                        Recomendado
                      </Badge>
                    )}
                    {level.premium && (
                      <Badge className={level.badgeColor} variant="outline">
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Title */}
                <Label
                  htmlFor={level.value}
                  className={cn(
                    'font-semibold text-lg flex items-center gap-2 cursor-pointer mb-2',
                    level.color
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {level.name}
                </Label>

                {/* Description */}
                <p className="text-sm styles.colors.text.secondary mb-3 flex-1">
                  {level.description}
                </p>

                {/* Cost */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs styles.colors.text.tertiary">Coste estimado:</span>
                    <span className={cn('text-xl font-bold', level.color)}>
                      {estimatedCost > 0 ? `${estimatedCost}` : '...'} cr
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs styles.colors.text.tertiary">Multiplicador:</span>
                    <Badge className={level.badgeColor} variant="outline">
                      {level.costMultiplier}
                    </Badge>
                  </div>

                  {level.savings && (
                    <div className="text-xs text-green-400 font-medium text-center mt-2">
                      {level.savings}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </RadioGroup>

        {/* Cost breakdown info */}
        <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <h4 className="text-sm font-medium text-amber-300 mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Desglose Estimado ({value === 'economic' ? 'Económico' : value === 'balanced' ? 'Equilibrado' : 'Alto Rendimiento'})
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm styles.colors.text.secondary">
            <div className="flex justify-between">
              <span>Contexto ({numContextQuestions} preguntas):</span>
              <span className="font-medium styles.colors.text.primary">
                {Math.ceil((2 + numContextQuestions + 2) * (value === 'economic' ? 0.3 : value === 'balanced' ? 1.0 : 3.0))} cr
              </span>
            </div>
            <div className="flex justify-between">
              <span>Expertos:</span>
              <span className="font-medium styles.colors.text.primary">
                {Math.ceil(7 * (value === 'economic' ? 0.3 : value === 'balanced' ? 1.0 : 3.0))} cr
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estrategia:</span>
              <span className="font-medium styles.colors.text.primary">
                {Math.ceil(4 * (value === 'economic' ? 0.3 : value === 'balanced' ? 1.0 : 3.0))} cr
              </span>
            </div>
            <div className="flex justify-between">
              <span>Debate ({numExperts} expertos):</span>
              <span className="font-medium styles.colors.text.primary font-bold">
                {Math.ceil(numExperts * 15 * (framework ? 1.3 : 1.0) * (value === 'economic' ? 0.3 : value === 'balanced' ? 1.0 : 3.0))} cr
              </span>
            </div>
          </div>
          <p className="text-xs styles.colors.text.tertiary mt-3">
            Los valores son estimaciones. El coste real puede variar según la complejidad del debate.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
