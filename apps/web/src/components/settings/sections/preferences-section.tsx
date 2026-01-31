'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingDown, Scale, Zap, Info } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/trpc/client'
import { cn, styles } from '@/lib/utils'

interface PreferencesSectionProps {
  isInModal?: boolean
}

const PERFORMANCE_LEVELS = [
  {
    value: 'economic',
    name: 'Económico',
    icon: TrendingDown,
    color: 'text-green-400',
    badgeColor: 'bg-green-500/20 text-green-300',
    borderColor: 'border-green-500/30 bg-green-500/5',
    description: 'Modelos más baratos en todas las operaciones. ~70% menos coste.',
    examples: 'GPT-3.5 Turbo, GPT-4o Mini, Gemini 2.0 Flash',
    costMultiplier: '0.3x',
  },
  {
    value: 'balanced',
    name: 'Equilibrado',
    icon: Scale,
    color: 'text-blue-400',
    badgeColor: 'bg-blue-500/20 text-blue-300',
    borderColor: 'border-blue-500/30 bg-blue-500/5',
    description: '80% operaciones con modelos económicos, 20% operaciones críticas con modelos premium. Mejor balance calidad/precio.',
    examples: 'Validaciones: GPT-4o Mini | Debates: Claude 3.5 Sonnet',
    costMultiplier: '1.0x',
    isRecommended: true,
  },
  {
    value: 'performance',
    name: 'Alto Rendimiento',
    icon: Zap,
    color: 'text-purple-400',
    badgeColor: 'bg-purple-500/20 text-purple-300',
    borderColor: 'border-purple-500/30 bg-purple-500/5',
    description: 'Modelos premium en todas las operaciones. Máxima calidad y precisión.',
    examples: 'GPT-4, Claude 3 Opus, Claude 3.5 Sonnet',
    costMultiplier: '3.0x',
  },
] as const

export function PreferencesSection({ isInModal = false }: PreferencesSectionProps) {
  const [isSaving, setIsSaving] = useState(false)

  const utils = api.useUtils()

  // Load user's current performance level
  const { data, isLoading } = api.users.getPerformanceLevel.useQuery()
  const updateMutation = api.users.updatePerformanceLevel.useMutation()

  const performanceLevel = data?.performanceLevel || 'balanced'

  const handleChange = async (value: string) => {
    if (value === performanceLevel) return

    setIsSaving(true)

    try {
      await updateMutation.mutateAsync({
        performanceLevel: value as 'economic' | 'balanced' | 'performance',
      })

      toast.success('Nivel de rendimiento actualizado')

      // Invalidate queries that depend on performance level
      void utils.users.getPerformanceLevel.invalidate()
    } catch (error) {
      console.error('Error updating performance level:', error)
      toast.error('Error al guardar cambios')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', isInModal ? 'pb-6' : 'pb-8')}>
      <div>
        <h2 className="text-2xl font-bold styles.colors.text.primary">Preferencias de IA</h2>
        <p className="styles.colors.text.secondary mt-1">
          Controla el balance entre calidad y coste en todas las operaciones de IA
        </p>
      </div>

      <Card className={cn(styles.colors.border.default, styles.colors.bg.secondary)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-400" />
            Nivel de Rendimiento de IA
          </CardTitle>
          <CardDescription className="styles.colors.text.secondary">
            Selecciona el nivel de rendimiento para todos los debates y análisis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={performanceLevel}
            onValueChange={handleChange}
            disabled={isSaving}
            className="space-y-4"
          >
            {PERFORMANCE_LEVELS.map((level) => {
              const Icon = level.icon
              const isSelected = performanceLevel === level.value

              return (
                <div
                  key={level.value}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-lg border transition-all',
                    level.borderColor,
                    isSelected && 'ring-2 ring-purple-500/50',
                    isSaving && 'opacity-50 pointer-events-none'
                  )}
                >
                  <RadioGroupItem value={level.value} id={level.value} className="mt-1" />
                  <div className="flex-1">
                    <Label
                      htmlFor={level.value}
                      className={cn(
                        'font-medium flex items-center gap-2 cursor-pointer',
                        level.color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {level.name}
                      {level.isRecommended && (
                        <Badge variant="secondary" className="text-xs">
                          Recomendado
                        </Badge>
                      )}
                    </Label>
                    <p className="text-sm styles.colors.text.secondary mt-1">
                      {level.description}
                    </p>
                    <div className="mt-2 text-xs styles.colors.text.tertiary">
                      Ejemplos: {level.examples}
                    </div>
                  </div>
                  <Badge className={level.badgeColor}>
                    {level.costMultiplier} coste
                  </Badge>
                </div>
              )
            })}
          </RadioGroup>

          {/* Cost preview */}
          <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <h4 className="text-sm font-medium text-amber-300 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Estimación de Costes
            </h4>
            <div className="space-y-1 text-sm styles.colors.text.secondary">
              <div className="flex justify-between">
                <span>Debate típico (5 expertos):</span>
                <span className="font-medium styles.colors.text.primary">
                  {performanceLevel === 'economic' ? '10-15' : performanceLevel === 'balanced' ? '35-50' : '100-150'} créditos
                </span>
              </div>
              <div className="flex justify-between">
                <span>Validación por respuesta:</span>
                <span className="font-medium styles.colors.text.primary">
                  {performanceLevel === 'economic' ? '0.5-1' : performanceLevel === 'balanced' ? '1-2' : '3-5'} créditos
                </span>
              </div>
              <div className="flex justify-between">
                <span>Framework SWOT:</span>
                <span className="font-medium styles.colors.text.primary">
                  {performanceLevel === 'economic' ? '5-8' : performanceLevel === 'balanced' ? '15-25' : '40-60'} créditos
                </span>
              </div>
            </div>
            <p className="text-xs styles.colors.text.tertiary mt-3">
              Los valores son aproximados y pueden variar según la complejidad de cada operación.
            </p>
          </div>

          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-purple-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando cambios...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
