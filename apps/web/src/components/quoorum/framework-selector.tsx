'use client'

import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/trpc/client'
import { logger } from '@/lib/logger'
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
import {
  Loader2,
  Sparkles,
  Zap,
  Info,
  Search,
  X,
  Settings,
  Target,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FrameworkSelectorProps {
  selectedFrameworkId: string | null
  onSelectionChange: (frameworkId: string | null) => void
  question?: string
  context?: string
  defaultOpen?: boolean
}

/**
 * Framework Selector Component
 * 
 * Proposes frameworks automatically based on question context
 * Shows selected framework in a fixed top section
 * Allows filtering and browsing all available frameworks
 */
export function FrameworkSelector({
  selectedFrameworkId,
  onSelectionChange,
  question,
  context,
  defaultOpen = false,
}: FrameworkSelectorProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>('auto')
  const [searchQuery, setSearchQuery] = useState('')

  // Get auto-suggested frameworks when question is available (only in auto mode)
  const { data: suggestedFrameworks, isLoading: isLoadingSuggestions } = api.frameworks.suggest.useQuery(
    { question: question || '', context: context || '' },
    {
      enabled: isOpen && !!question && question.length >= 10 && selectionMode === 'auto',
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )

  // Get all frameworks (only in manual mode)
  const { data: allFrameworks, isLoading: isLoadingAll } = api.frameworks.list.useQuery(
    undefined,
    { enabled: isOpen && selectionMode === 'manual' }
  )

  // Auto-select suggested framework when it arrives (only if no selection yet and in auto mode)
  useEffect(() => {
    if (suggestedFrameworks &&
        suggestedFrameworks.length > 0 &&
        !selectedFrameworkId &&
        selectionMode === 'auto' &&
        isOpen) {
      // Auto-select top suggested framework
      const topFramework = suggestedFrameworks[0]

      logger.info('[FrameworkSelector] Auto-selecting framework:', {
        frameworkId: topFramework.id,
        slug: topFramework.slug,
        matchScore: topFramework.matchScore
      })

      if (topFramework) {
        onSelectionChange(topFramework.id)
      }
    }
  }, [suggestedFrameworks, selectionMode, isOpen, selectedFrameworkId, onSelectionChange])

  // Get selected framework data
  const selectedFrameworkData = useMemo(() => {
    if (!selectedFrameworkId) return null

    // Check in suggested frameworks
    if (suggestedFrameworks) {
      const found = suggestedFrameworks.find((f) => f.id === selectedFrameworkId)
      if (found) return found
    }

    // Check in all frameworks
    if (allFrameworks) {
      const found = allFrameworks.find((f) => f.id === selectedFrameworkId)
      if (found) return {
        id: found.id,
        slug: found.slug,
        name: found.name,
        description: found.description,
        matchScore: undefined,
        reasoning: undefined,
      }
    }

    return null
  }, [selectedFrameworkId, suggestedFrameworks, allFrameworks])

  // Filter frameworks by search query (manual mode only)
  const filteredFrameworks = useMemo(() => {
    if (!allFrameworks) return []

    return allFrameworks.filter((framework) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const nameMatch = framework.name.toLowerCase().includes(query)
        const descMatch = framework.description?.toLowerCase().includes(query) || false
        const slugMatch = framework.slug.toLowerCase().includes(query)

        if (!nameMatch && !descMatch && !slugMatch) return false
      }

      // Exclude already selected framework
      if (selectedFrameworkId === framework.id) return false

      return true
    })
  }, [allFrameworks, searchQuery, selectedFrameworkId])

  const toggleFramework = (frameworkId: string) => {
    if (selectedFrameworkId === frameworkId) {
      onSelectionChange(null)
    } else {
      onSelectionChange(frameworkId)
    }
  }

  if (!isOpen) {
    return (
      <Card className="border-purple-500/40 bg-gradient-to-r from-purple-600/20 to-purple-500/10 backdrop-blur-sm shadow-lg shadow-purple-500/20">
        <CardContent className="p-4">
          <Button
            variant="default"
            onClick={() => setIsOpen(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-[var(--theme-text-primary)] font-semibold shadow-lg shadow-purple-500/30 border-2 border-purple-400/50 transition-all duration-200 hover:scale-[1.02]"
          >
            <Target className="mr-2 h-4 w-4" />
            {selectedFrameworkId
              ? selectedFrameworkData
                ? `Framework: ${selectedFrameworkData.name}`
                : 'Framework seleccionado'
              : question && question.length >= 10
                ? 'Ver Framework Sugerido'
                : 'Seleccionar Framework'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isLoading = isLoadingSuggestions || isLoadingAll

  return (
    <Card className="border-purple-500/20 bg-[var(--theme-bg-secondary)] backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-[var(--theme-text-primary)]">Framework de Decisi�n</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
          >
            Cerrar
          </Button>
        </div>
        <CardDescription className="text-[var(--theme-text-secondary)]">
          {question && question.length >= 10
            ? 'Framework propuesto autom�ticamente seg�n tu pregunta. Puedes seleccionar manualmente o usar el sugerido.'
            : 'Selecciona un framework para estructurar la respuesta final del debate.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {/* Selected Framework - Fixed Top Section */}
        {selectedFrameworkData && (
          <div className="space-y-3 pb-4 border-b border-[var(--theme-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-[var(--theme-text-primary)]">
                  Framework Seleccionado
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectionChange(null)}
                className="text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
              >
                Limpiar
              </Button>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-500/50 bg-purple-500/20 backdrop-blur-sm">
              <span className="text-sm font-medium text-[var(--theme-text-primary)]">{selectedFrameworkData.name}</span>
              {selectedFrameworkData.matchScore && (
                <Badge
                  variant="outline"
                  className="text-xs border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
                >
                  {selectedFrameworkData.matchScore}% match
                </Badge>
              )}
              <button
                onClick={() => toggleFramework(selectedFrameworkData.id)}
                className="ml-auto p-0.5 rounded hover:bg-purple-600/30 text-[var(--theme-text-secondary)] hover:text-white transition-colors"
                title="Eliminar"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            {selectedFrameworkData.reasoning && (
              <p className="text-xs text-[var(--theme-text-secondary)] px-3">
                {selectedFrameworkData.reasoning}
              </p>
            )}
          </div>
        )}

        {/* Mode Selection (Auto/Manual) */}
        <div className="space-y-2">
          <Label className="text-[var(--theme-text-primary)] flex items-center gap-2">
            <Settings className="h-4 w-4 text-purple-400" />
            Modo de Selecci�n
          </Label>
          <Select value={selectionMode} onValueChange={(v) => setSelectionMode(v as 'auto' | 'manual')}>
            <SelectTrigger className="border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span>Autom�tico (Recomendado)</span>
                </div>
              </SelectItem>
              <SelectItem value="manual">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-400" />
                  <span>Manual</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* AUTO MODE: Show only suggested frameworks */}
        {selectionMode === 'auto' ? (
          <>
            {isLoadingSuggestions ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                  <span className="text-sm text-[var(--theme-text-secondary)]">Analizando tu pregunta y buscando frameworks...</span>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full bg-slate-800/60 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : question && question.length >= 10 && suggestedFrameworks && suggestedFrameworks.length > 0 ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-[var(--theme-text-primary)]">
                      Frameworks Sugeridos Autom�ticamente
                    </span>
                    <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400 bg-yellow-500/10">
                      {suggestedFrameworks.length}
                    </Badge>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {suggestedFrameworks
                      .filter((f) => f.id !== selectedFrameworkId)
                      .map((framework) => {
                        const isSelected = selectedFrameworkId === framework.id
                        return (
                          <div
                            key={`suggested-${framework.id}`}
                            onClick={() => toggleFramework(framework.id)}
                            className={cn(
                              'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                              isSelected
                                ? 'border-yellow-500/50 bg-yellow-500/10'
                                : 'border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] hover:border-yellow-500/30 hover:bg-[var(--theme-bg-tertiary)]'
                            )}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleFramework(framework.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-[var(--theme-text-primary)] truncate">
                                  {framework.name}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="text-xs border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
                                >
                                  {framework.matchScore}% match
                                </Badge>
                              </div>
                              <p className="text-xs text-[var(--theme-text-secondary)] line-clamp-1 mb-1">
                                {framework.description}
                              </p>
                              {framework.reasoning && (
                                <div className="mt-1 flex items-start gap-1">
                                  <Info className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-yellow-300/70 line-clamp-2">
                                    {framework.reasoning}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>

                <div className="rounded-lg border-2 border-yellow-500/30 bg-yellow-900/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-yellow-600 text-[var(--theme-text-primary)]">
                      {suggestedFrameworks.length} Framework{suggestedFrameworks.length !== 1 ? 's' : ''} Recomendado{suggestedFrameworks.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--theme-text-secondary)] mb-3">
                    El sistema ha analizado tu pregunta y seleccionado el framework m�s relevante. Puedes cambiar a modo manual para ver todos los frameworks disponibles.
                  </p>
                </div>
              </>
            ) : question && question.length >= 10 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400 mb-3" />
                <p className="text-[var(--theme-text-secondary)] mb-2">No se encontraron frameworks sugeridos</p>
                <p className="text-sm text-[var(--theme-text-tertiary)]">
                  Intenta cambiar a modo manual para ver todos los frameworks disponibles
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Info className="h-8 w-8 text-[var(--theme-text-tertiary)] mb-3" />
                <p className="text-[var(--theme-text-secondary)] mb-2">A�ade una pregunta para ver frameworks sugeridos</p>
                <p className="text-sm text-[var(--theme-text-tertiary)]">
                  El modo autom�tico requiere una pregunta de al menos 10 caracteres
                </p>
              </div>
            )}
          </>
        ) : (
          /* MANUAL MODE: Show all frameworks with search */
          <>
            {/* Search (only in manual mode) */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--theme-text-secondary)]" />
                <input
                  type="text"
                  placeholder="Buscar frameworks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>

            {/* Loading state for manual mode */}
            {isLoadingAll && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                  <span className="text-sm text-[var(--theme-text-secondary)]">Cargando frameworks...</span>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full bg-slate-800/60 animate-pulse" />
                  ))}
                </div>
              </div>
            )}

            {/* Framework list */}
            {!isLoadingAll && (
              <>
                {filteredFrameworks.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {filteredFrameworks.map((framework) => {
                      const isSelected = selectedFrameworkId === framework.id
                      return (
                        <div
                          key={`manual-${framework.id}`}
                          onClick={() => toggleFramework(framework.id)}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                            isSelected
                              ? 'border-purple-500/50 bg-purple-500/10'
                              : 'border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] hover:border-purple-500/30 hover:bg-[var(--theme-bg-tertiary)]'
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleFramework(framework.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-[var(--theme-text-primary)] truncate">
                                {framework.name}
                              </p>
                            </div>
                            <p className="text-xs text-[var(--theme-text-secondary)] line-clamp-2">
                              {framework.description}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Search className="h-12 w-12 text-[var(--theme-text-tertiary)] mb-3" />
                    <p className="text-sm text-[var(--theme-text-secondary)]">
                      {searchQuery
                        ? 'No se encontraron frameworks que coincidan con tu b�squeda.'
                        : 'No hay frameworks disponibles.'}
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Info card */}
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-blue-400">�Qu� es un Framework de Decisi�n?</p>
              <p className="text-blue-300/80">
                Un framework estructura la respuesta final del debate seg�n una metodolog�a probada (FODA, ROI, Delphi, etc.).
                Esto ayuda a presentar la decisi�n de forma clara y accionable.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
