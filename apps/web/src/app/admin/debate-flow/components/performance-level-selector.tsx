'use client'

import { TrendingDown, Scale, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const PERFORMANCE_LEVELS = [
  {
    value: 'economic',
    name: 'Económico',
    description: 'Modelos más baratos en todas las operaciones. ~70% menos coste.',
    examples: 'GPT-3.5 Turbo, GPT-4o Mini, Gemini 2.0 Flash',
    icon: TrendingDown,
    badgeColor: 'bg-green-500/20 text-green-300',
    multiplier: '0.3x coste',
  },
  {
    value: 'balanced',
    name: 'Equilibrado',
    description:
      '80% operaciones con modelos económicos, 20% operaciones críticas con modelos premium. Mejor balance calidad/precio.',
    examples: 'Validaciones: GPT-4o Mini | Debates: Claude 3.5 Sonnet',
    icon: Scale,
    badgeColor: 'bg-blue-500/20 text-blue-300',
    multiplier: '1.0x coste',
    isDefault: true,
  },
  {
    value: 'performance',
    name: 'Alto Rendimiento',
    description: 'Modelos premium en todas las operaciones. Máxima calidad y precisión.',
    examples: 'GPT-4, Claude 3 Opus, Claude 3.5 Sonnet',
    icon: Zap,
    badgeColor: 'bg-purple-500/20 text-purple-300',
    multiplier: '3.0x coste',
  },
]

export function PerformanceLevelSelector() {
  return (
    <RadioGroup defaultValue="balanced" className="space-y-4">
      {PERFORMANCE_LEVELS.map((level) => {
        const Icon = level.icon
        return (
          <div
            key={level.value}
            className={`flex items-start gap-4 p-4 rounded-lg border transition-colors hover:bg-white/5 ${
              level.value === 'economic'
                ? 'border-green-500/30 bg-green-500/5'
                : level.value === 'balanced'
                ? 'border-blue-500/30 bg-blue-500/5'
                : 'border-purple-500/30 bg-purple-500/5'
            }`}
          >
            <RadioGroupItem value={level.value} id={level.value} />
            <div className="flex-1">
              <Label
                htmlFor={level.value}
                className={`font-medium flex items-center gap-2 cursor-pointer ${
                  level.value === 'economic'
                    ? 'text-green-400'
                    : level.value === 'balanced'
                    ? 'text-blue-400'
                    : 'text-purple-400'
                }`}
              >
                <Icon className="h-4 w-4" />
                {level.name}
                {level.isDefault && (
                  <Badge variant="outline" className="text-xs">
                    Recomendado
                  </Badge>
                )}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">{level.description}</p>
              <div className="mt-2 text-xs text-muted-foreground">{level.examples}</div>
            </div>
            <Badge className={level.badgeColor}>{level.multiplier}</Badge>
          </div>
        )
      })}
    </RadioGroup>
  )
}
