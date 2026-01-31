'use client'

import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/trpc/client'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2, UserCircle, Info, Sparkles, Zap, Search } from 'lucide-react'
import { cn, styles } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useOpenSettings } from '@/hooks/use-open-settings'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface WorkerSelectorProps {
  selectedWorkerIds: string[]
  onSelectionChange: (ids: string[]) => void
  question?: string
  context?: string
  selectedDepartmentIds?: string[] // Departamentos ya seleccionados (para priorizar profesionales)
  defaultOpen?: boolean
}

export function WorkerSelector({
  selectedWorkerIds,
  onSelectionChange,
  question,
  context,
  selectedDepartmentIds = [],
  defaultOpen = false,
}: WorkerSelectorProps) {
  const router = useRouter()
  const openSettings = useOpenSettings()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>('auto')
  const [searchQuery, setSearchQuery] = useState('')

  // Get company
  const { data: company, isLoading: loadingCompany } = api.companies.get.useQuery()

  // Get auto-suggested workers when question is available (only in auto mode)
  const { data: suggestedWorkers, isLoading: isLoadingSuggestions } = api.workers.suggest.useQuery(
    {
      question: question || '',
      context: context || '',
      companyId: company?.id ?? '00000000-0000-0000-0000-000000000000',
      selectedDepartmentIds: selectedDepartmentIds,
    },
    {
      enabled: isOpen && !!question && question.length >= 10 && selectionMode === 'auto' && !!company?.id,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )

  // Get workers (only if company exists and in manual mode)
  const { data: workers, isLoading: loadingWorkers } = api.workers.list.useQuery(
    { activeOnly: true, limit: 100 },
    { enabled: !!company?.id && (selectionMode === 'manual' || isOpen) }
  )

  // Auto-select suggested workers when they arrive (only if no selection yet and in auto mode)
  useEffect(() => {
    if (
      suggestedWorkers &&
      suggestedWorkers.length > 0 &&
      selectedWorkerIds.length === 0 &&
      selectionMode === 'auto' &&
      isOpen
    ) {
      // Auto-select top 2-5 suggested workers
      const topWorkers = suggestedWorkers
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5)
        .map((w) => w.id)

      logger.info('[WorkerSelector] Auto-selecting workers:', {
        count: topWorkers.length,
        workerIds: topWorkers,
      })

      if (topWorkers.length > 0) {
        onSelectionChange(topWorkers)
      }
    }
  }, [suggestedWorkers, selectionMode, isOpen, selectedWorkerIds.length, onSelectionChange])

  // Filter workers by search query (manual mode only)
  const filteredWorkers = useMemo(() => {
    if (!workers) return []

    return workers.filter((worker) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const nameMatch = worker.name.toLowerCase().includes(query)
        const expertiseMatch = worker.expertise?.toLowerCase().includes(query) || false
        const roleMatch = worker.role?.toLowerCase().includes(query) || false

        if (!nameMatch && !expertiseMatch && !roleMatch) return false
      }

      // Exclude already selected workers
      if (selectedWorkerIds.includes(worker.id)) return false

      return true
    })
  }, [workers, searchQuery, selectedWorkerIds])

  // Get selected workers data (from both suggested and manual)
  const selectedWorkersData = useMemo(() => {
    const selected: Array<{
      id: string
      name: string
      role?: string
      expertise?: string
      matchScore?: number
      isSuggested?: boolean
    }> = []

    // Add suggested workers that are selected
    if (suggestedWorkers) {
      suggestedWorkers
        .filter((w) => selectedWorkerIds.includes(w.id))
        .forEach((w) => {
          selected.push({
            id: w.id,
            name: w.name,
            role: w.role,
            expertise: w.expertise,
            matchScore: w.matchScore,
            isSuggested: true,
          })
        })
    }

    // Add manual workers that are selected
    if (workers) {
      workers
        .filter((w) => selectedWorkerIds.includes(w.id))
        .forEach((w) => {
          // Only add if not already in selected (from suggested)
          if (!selected.find((s) => s.id === w.id)) {
            selected.push({
              id: w.id,
              name: w.name,
              role: w.role,
              expertise: w.expertise,
              isSuggested: false,
            })
          }
        })
    }

    return selected
  }, [suggestedWorkers, workers, selectedWorkerIds])

  const handleToggleWorker = (workerId: string) => {
    if (selectedWorkerIds.includes(workerId)) {
      onSelectionChange(selectedWorkerIds.filter((id) => id !== workerId))
    } else {
      onSelectionChange([...selectedWorkerIds, workerId])
    }
  }

  const handleSelectAll = () => {
    if (filteredWorkers && filteredWorkers.length > 0) {
      // Add all filtered workers to current selection
      const newSelection = new Set(selectedWorkerIds)
      filteredWorkers.forEach((w) => newSelection.add(w.id))
      onSelectionChange(Array.from(newSelection))
    } else if (workers) {
      onSelectionChange(workers.map((w) => w.id))
    }
  }

  const handleClearAll = () => {
    onSelectionChange([])
  }

  const isLoading = isLoadingSuggestions || loadingWorkers

  if (loadingCompany) {
    return (
      <Card className="styles.colors.bg.secondary styles.colors.border.default">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
        </CardContent>
      </Card>
    )
  }

  if (!company) {
    return (
      <Card className="styles.colors.bg.secondary styles.colors.border.default">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 styles.colors.text.primary">
            <UserCircle className="h-5 w-5" />
            Profesionales
          </CardTitle>
          <CardDescription className="styles.colors.text.secondary">
            Configura tu empresa primero para usar profesionales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => openSettings('/settings/company')}
          >
            Configurar Empresa
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="styles.colors.bg.secondary styles.colors.border.default">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 styles.colors.text.primary">
              <UserCircle className="h-5 w-5" />
              Profesionales
            </CardTitle>
            <CardDescription className="styles.colors.text.secondary">
              {selectionMode === 'auto'
                ? 'El sistema sugiere profesionales bas�ndose en la pregunta y departamentos seleccionados'
                : 'Selecciona manualmente los profesionales que intervendr�n en el debate'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={selectionMode} onValueChange={(v) => setSelectionMode(v as 'auto' | 'manual')}>
              <SelectTrigger className="w-[140px] styles.colors.border.default styles.colors.bg.input styles.colors.text.primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="styles.colors.bg.secondary styles.colors.border.default">
                <SelectItem value="auto" className="styles.colors.text.primary focus:bg-purple-600">
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Autom�tico
                  </span>
                </SelectItem>
                <SelectItem value="manual" className="styles.colors.text.primary focus:bg-purple-600">
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Manual
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Workers */}
        {selectedWorkersData.length > 0 && (
          <div className="space-y-3 pb-4 border-b styles.colors.border.default">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold styles.colors.text.primary">
                  Profesionales Seleccionados
                </span>
                <Badge
                  variant="outline"
                  className="border-purple-500/30 text-purple-300"
                >
                  {selectedWorkersData.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="styles.colors.text.secondary hover:styles.colors.text.primary hover:bg-purple-600/20"
              >
                Limpiar
              </Button>
            </div>
            <div className="space-y-2">
              {selectedWorkersData.map((worker) => (
                <div
                  key={`selected-${worker.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-500/50 bg-purple-500/20 backdrop-blur-sm"
                >
                  <UserCircle className="h-4 w-4 text-purple-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium styles.colors.text.primary truncate">{worker.name}</p>
                    <p className="text-xs styles.colors.text.secondary truncate">
                      {[worker.role, worker.expertise].filter(Boolean).join(' � ')}
                    </p>
                  </div>
                  {worker.matchScore !== undefined && (
                    <Badge
                      variant="outline"
                      className="border-purple-500/30 text-purple-300 text-xs"
                    >
                      {worker.matchScore}%
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleWorker(worker.id)}
                    className="h-6 w-6 p-0 styles.colors.text.tertiary hover:styles.colors.text.primary hover:bg-purple-600/20"
                  >
                    �
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mode-specific content */}
        <Accordion type="single" collapsible value={isOpen ? 'workers' : undefined} onValueChange={(v) => setIsOpen(v === 'workers')}>
          <AccordionItem value="workers" className="border-none">
            <AccordionTrigger className="hover:no-underline py-2">
              <span className="text-sm font-medium styles.colors.text.secondary">
                {selectionMode === 'auto' ? 'Sugerencias de IA' : 'Todos los Profesionales'}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              {selectionMode === 'auto' ? (
                isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                    <span className="ml-2 text-sm styles.colors.text.secondary">Analizando profesionales...</span>
                  </div>
                ) : suggestedWorkers && suggestedWorkers.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm styles.colors.text.secondary">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      <span>
                        {selectedDepartmentIds.length > 0
                          ? `Sugerencias basadas en ${selectedDepartmentIds.length} departamento(s) seleccionado(s)`
                          : 'Sugerencias basadas en la pregunta y contexto'}
                      </span>
                    </div>
                    {suggestedWorkers
                      .filter((w) => !selectedWorkerIds.includes(w.id))
                      .map((worker) => (
                        <button
                          key={worker.id}
                          onClick={() => handleToggleWorker(worker.id)}
                          className="group w-full text-left p-4 rounded-lg border border-purple-500/20 bg-purple-900/10 hover:bg-purple-900/20 hover:border-purple-500/40 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                              <UserCircle className="h-5 w-5 text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium styles.colors.text.primary group-hover:text-purple-300 transition-colors">
                                  {worker.name}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="border-purple-500/30 text-purple-300 text-xs"
                                >
                                  {worker.matchScore}% afinidad
                                </Badge>
                              </div>
                              <p className="text-xs styles.colors.text.secondary mt-1">
                                {[worker.role, worker.expertise].filter(Boolean).join(' � ')}
                              </p>
                              {worker.reasons && worker.reasons.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {worker.reasons.slice(0, 2).map((reason, idx) => (
                                    <p key={idx} className="text-xs styles.colors.text.tertiary">
                                      � {reason}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 styles.colors.text.tertiary">
                    <p className="text-sm">No se encontraron sugerencias</p>
                    <p className="text-xs mt-1">Intenta cambiar a modo manual</p>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <Label className="styles.colors.text.secondary">Buscar profesionales</Label>
                    <Input
                      placeholder="Buscar por nombre, rol o expertise..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="styles.colors.bg.input styles.colors.border.default styles.colors.text.primary placeholder:styles.colors.text.tertiary focus-visible:ring-purple-500 focus-visible:border-purple-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm styles.colors.text.secondary">
                      {filteredWorkers.length} profesional(es) disponible(s)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        disabled={filteredWorkers.length === 0}
                        className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary hover:bg-purple-600 hover:border-purple-600"
                      >
                        Seleccionar Todos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearAll}
                        disabled={selectedWorkerIds.length === 0}
                        className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary hover:bg-purple-600 hover:border-purple-600"
                      >
                        Limpiar
                      </Button>
                    </div>
                  </div>

                  {/* Workers List */}
                  {loadingWorkers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                    </div>
                  ) : filteredWorkers.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {filteredWorkers.map((worker) => {
                        const isSelected = selectedWorkerIds.includes(worker.id)
                        return (
                          <div
                            key={worker.id}
                            className={cn(
                              'group flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors',
                              'styles.colors.border.default hover:border-purple-500/50',
                              isSelected && 'border-purple-500 bg-purple-500/10'
                            )}
                            onClick={() => handleToggleWorker(worker.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleWorker(worker.id)}
                              className="mt-1 styles.colors.border.default data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="font-medium styles.colors.text.primary truncate">{worker.name}</p>
                              <p className="text-xs styles.colors.text.tertiary line-clamp-2">
                                {[worker.role, worker.expertise].filter(Boolean).join(' � ') || 'Sin rol'}
                              </p>
                              {worker.description && (
                                <p className="text-xs styles.colors.text.secondary line-clamp-2">{worker.description}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 styles.colors.text.tertiary">
                      <p className="text-sm">No se encontraron profesionales</p>
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchQuery('')}
                          className="mt-2 text-purple-400 hover:text-purple-300"
                        >
                          Limpiar b�squeda
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Info Card */}
        <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-purple-400 flex-shrink-0" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-purple-400">�Qu� son los Profesionales?</p>
              <p className="styles.colors.text.secondary">
                Son representaciones virtuales de tu equipo que debaten con el contexto
                de {company?.name || 'tu empresa'} y departamentos. En modo autom�tico, el sistema
                prioriza profesionales de los departamentos ya seleccionados.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
