'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Sparkles, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExpertSelectorProps {
  selectedExpertIds: string[]
  onSelectionChange: (expertIds: string[]) => void
  question?: string
}

/**
 * Expert Selector Component
 * Allows users to select custom experts for their debate
 */
export function ExpertSelector({
  selectedExpertIds,
  onSelectionChange,
  question,
}: ExpertSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const { data: experts, isLoading } = api.experts.list.useQuery(
    { activeOnly: true, limit: 100 },
    { enabled: isOpen }
  )

  const toggleExpert = (expertId: string) => {
    if (selectedExpertIds.includes(expertId)) {
      onSelectionChange(selectedExpertIds.filter((id) => id !== expertId))
    } else {
      onSelectionChange([...selectedExpertIds, expertId])
    }
  }

  if (!isOpen) {
    return (
      <Card className="border-purple-500/40 bg-gradient-to-r from-purple-600/20 to-purple-500/10 backdrop-blur-sm shadow-lg shadow-purple-500/20">
        <CardContent className="p-4">
          <Button
            variant="default"
            onClick={() => setIsOpen(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold shadow-lg shadow-purple-500/30 border-2 border-purple-400/50 transition-all duration-200 hover:scale-[1.02]"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {selectedExpertIds.length > 0
              ? `${selectedExpertIds.length} experto${selectedExpertIds.length > 1 ? 's' : ''} seleccionado${selectedExpertIds.length > 1 ? 's' : ''}`
              : 'Seleccionar Expertos Personalizados'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-purple-500/20 bg-slate-900/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-white">Expertos Personalizados</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            Cerrar
          </Button>
        </div>
        <CardDescription className="text-gray-400">
          Selecciona tus expertos personalizados para este debate. Si no seleccionas ninguno,
          se usarán los expertos automáticos del sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full bg-slate-800/60" />
            <Skeleton className="h-16 w-full bg-slate-800/60" />
            <Skeleton className="h-16 w-full bg-slate-800/60" />
          </div>
        ) : !experts || experts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="h-12 w-12 text-gray-500 mb-3" />
            <p className="text-gray-400 mb-2">No tienes expertos personalizados</p>
            <p className="text-sm text-gray-500 mb-4">
              Crea expertos personalizados en Configuración → Expertos
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = '/settings/experts'
              }}
              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            >
              Ir a Configuración
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>
                {selectedExpertIds.length > 0
                  ? `${selectedExpertIds.length} de ${experts.length} seleccionados`
                  : 'Ninguno seleccionado (se usarán expertos automáticos)'}
              </span>
              {selectedExpertIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectionChange([])}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Limpiar
                </Button>
              )}
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {experts.map((expert) => {
                const isSelected = selectedExpertIds.includes(expert.id)
                return (
                  <div
                    key={expert.id}
                    onClick={() => toggleExpert(expert.id)}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                      isSelected
                        ? 'border-purple-500/50 bg-purple-500/10'
                        : 'border-white/10 bg-slate-800/30 hover:border-purple-500/30 hover:bg-slate-800/50'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleExpert(expert.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white truncate">
                          {expert.name}
                        </p>
                        {expert.category && (
                          <Badge
                            variant="outline"
                            className="text-xs border-gray-600 text-gray-400"
                          >
                            {expert.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {expert.expertise || expert.description || 'Sin descripción'}
                      </p>
                      {expert.aiConfig && (
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          <span>
                            {expert.aiConfig.provider === 'google'
                              ? 'Gemini'
                              : expert.aiConfig.provider === 'openai'
                                ? 'GPT'
                                : expert.aiConfig.provider === 'anthropic'
                                  ? 'Claude'
                                  : expert.aiConfig.provider}{' '}
                            {expert.aiConfig.model}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
