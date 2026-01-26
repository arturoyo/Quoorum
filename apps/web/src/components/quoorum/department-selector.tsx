'use client'

import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/trpc/client'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2, Building2, Info, Sparkles, Zap, Settings, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useOpenSettings } from '@/hooks/use-open-settings'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface DepartmentSelectorProps {
  selectedDepartmentIds: string[]
  onSelectionChange: (ids: string[]) => void
  question?: string
  context?: string
  defaultOpen?: boolean
}

export function DepartmentSelector({
  selectedDepartmentIds,
  onSelectionChange,
  question,
  context,
  defaultOpen = false,
}: DepartmentSelectorProps) {
  const router = useRouter()
  const openSettings = useOpenSettings()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>('auto')
  const [searchQuery, setSearchQuery] = useState('')

  // Get company
  const { data: company, isLoading: loadingCompany } = api.companies.get.useQuery()

  // Get auto-suggested departments when question is available (only in auto mode)
  const { data: suggestedDepartments, isLoading: isLoadingSuggestions } = api.departments.suggest.useQuery(
    { 
      question: question || '', 
      context: context || '',
      companyId: company?.id ?? '00000000-0000-0000-0000-000000000000',
    },
    {
      enabled: isOpen && !!question && question.length >= 10 && selectionMode === 'auto' && !!company?.id,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )

  // Get departments (only if company exists and in manual mode)
  const { data: departments, isLoading: loadingDepartments } = api.departments.list.useQuery(
    { companyId: company?.id ?? '00000000-0000-0000-0000-000000000000' },
    { enabled: !!company?.id && (selectionMode === 'manual' || isOpen) }
  )

  // Auto-select suggested departments when they arrive (only if no selection yet and in auto mode)
  useEffect(() => {
    if (suggestedDepartments &&
        suggestedDepartments.length > 0 &&
        selectedDepartmentIds.length === 0 &&
        selectionMode === 'auto' &&
        isOpen) {
      // Auto-select top 3-5 suggested departments
      const topDepartments = suggestedDepartments
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5)
        .map((d) => d.id)

      logger.info('[DepartmentSelector] Auto-selecting departments:', {
        count: topDepartments.length,
        departmentIds: topDepartments
      })

      if (topDepartments.length > 0) {
        onSelectionChange(topDepartments)
      }
    }
  }, [suggestedDepartments, selectionMode, isOpen, selectedDepartmentIds.length, onSelectionChange])

  // Filter departments by search query (manual mode only)
  const filteredDepartments = useMemo(() => {
    if (!departments) return []
    
    return departments.filter((dept) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const nameMatch = dept.name.toLowerCase().includes(query)
        const contextMatch = dept.departmentContext?.toLowerCase().includes(query) || false
        const typeMatch = dept.type?.toLowerCase().includes(query) || false
        
        if (!nameMatch && !contextMatch && !typeMatch) return false
      }

      // Exclude already selected departments
      if (selectedDepartmentIds.includes(dept.id)) return false

      return true
    })
  }, [departments, searchQuery, selectedDepartmentIds])

  // Get selected departments data (from both suggested and manual)
  const selectedDepartmentsData = useMemo(() => {
    const selected: Array<{
      id: string
      name: string
      type?: string
      icon?: string | null
      matchScore?: number
      isSuggested?: boolean
    }> = []

    // Add suggested departments that are selected
    if (suggestedDepartments) {
      suggestedDepartments
        .filter((d) => selectedDepartmentIds.includes(d.id))
        .forEach((d) => {
          selected.push({
            id: d.id,
            name: d.name,
            type: d.type,
            icon: d.icon,
            matchScore: d.matchScore,
            isSuggested: true,
          })
        })
    }

    // Add manual departments that are selected
    if (departments) {
      departments
        .filter((d) => selectedDepartmentIds.includes(d.id))
        .forEach((d) => {
          // Only add if not already in selected (from suggested)
          if (!selected.find((s) => s.id === d.id)) {
            selected.push({
              id: d.id,
              name: d.name,
              type: d.type,
              icon: d.icon,
              isSuggested: false,
            })
          }
        })
    }

    return selected
  }, [suggestedDepartments, departments, selectedDepartmentIds])

  const handleToggleDepartment = (departmentId: string) => {
    if (selectedDepartmentIds.includes(departmentId)) {
      onSelectionChange(selectedDepartmentIds.filter((id) => id !== departmentId))
    } else {
      onSelectionChange([...selectedDepartmentIds, departmentId])
    }
  }

  const handleSelectAll = () => {
    if (filteredDepartments && filteredDepartments.length > 0) {
      // Add all filtered departments to current selection
      const newSelection = new Set(selectedDepartmentIds)
      filteredDepartments.forEach((d) => newSelection.add(d.id))
      onSelectionChange(Array.from(newSelection))
    } else if (departments) {
      onSelectionChange(departments.map((d) => d.id))
    }
  }

  const handleClearAll = () => {
    onSelectionChange([])
  }

  if (loadingCompany) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (!company) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Departamentos Corporativos (Opcional)
          </CardTitle>
          <CardDescription>
            Añade contexto empresarial y departamental a tu debate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">Configura tu empresa primero</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Crea departamentos corporativos para debates más contextualizados
            </p>
            <Button
              className="mt-4"
              onClick={() => openSettings('/settings/company')}
            >
              Configurar Empresa
            </Button>
          </div>
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-blue-400">¿Qué son los Departamentos Corporativos?</p>
                <p className="text-blue-300/80">
                  Son agentes especializados que debaten desde la perspectiva de cada área de tu empresa
                  (Finanzas, Marketing, Operaciones, etc.), inyectando el contexto específico de tu organización.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loadingDepartments) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (!departments || departments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Departamentos Corporativos (Opcional)
          </CardTitle>
          <CardDescription>
            Añade contexto empresarial y departamental a tu debate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">Sin departamentos configurados</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Crea departamentos para debates más contextualizados
            </p>
            <Button
              className="mt-4"
              onClick={() => openSettings('/settings/company')}
            >
              Gestionar Departamentos
            </Button>
          </div>
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-blue-400">Debates Contextualizados</p>
                <p className="text-blue-300/80">
                  Los departamentos corporativos inyectan 4 capas de contexto:
                  empresa → departamento → rol → personalidad
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
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
            <Building2 className="mr-2 h-4 w-4" />
            {selectedDepartmentIds.length > 0
              ? `${selectedDepartmentIds.length} departamento${selectedDepartmentIds.length > 1 ? 's' : ''} seleccionado${selectedDepartmentIds.length > 1 ? 's' : ''}`
              : question && question.length >= 10
                ? 'Ver Departamentos Sugeridos'
                : 'Seleccionar Departamentos'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isLoading = isLoadingSuggestions || loadingDepartments

  return (
    <Card className="border-purple-500/20 bg-slate-900/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-white">Selección de Departamentos</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-[var(--theme-text-secondary)] hover:text-white"
          >
            Cerrar
          </Button>
        </div>
        <CardDescription className="text-[var(--theme-text-secondary)]">
          {question && question.length >= 10
            ? 'Departamentos propuestos automáticamente según tu pregunta. Puedes seleccionar manualmente o usar los sugeridos.'
            : 'Selecciona departamentos para inyectar contexto corporativo en tu debate.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {/* Selected Departments - Fixed Top Section */}
        {selectedDepartmentsData.length > 0 && (
          <div className="space-y-3 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">
                  Departamentos Seleccionados
                </span>
                <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400 bg-purple-500/10">
                  {selectedDepartmentsData.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectionChange([])}
                className="text-xs text-[var(--theme-text-secondary)] hover:text-white"
              >
                Limpiar todos
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedDepartmentsData.map((dept) => (
                <div
                  key={`selected-${dept.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-500/50 bg-purple-500/20 backdrop-blur-sm"
                >
                  {dept.icon && <span>{dept.icon}</span>}
                  <span className="text-sm font-medium text-white">{dept.name}</span>
                  {dept.matchScore && (
                    <Badge
                      variant="outline"
                      className="text-xs border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
                    >
                      {dept.matchScore}% match
                    </Badge>
                  )}
                  <button
                    onClick={() => handleToggleDepartment(dept.id)}
                    className="ml-1 p-0.5 rounded hover:bg-purple-600/30 text-[var(--theme-text-secondary)] hover:text-white transition-colors"
                    title="Eliminar"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mode Selection (Auto/Manual) */}
        <div className="space-y-2">
          <Label className="text-white flex items-center gap-2">
            <Settings className="h-4 w-4 text-purple-400" />
            Modo de Selección
          </Label>
          <Select value={selectionMode} onValueChange={(v) => setSelectionMode(v as 'auto' | 'manual')}>
            <SelectTrigger className="border-white/10 bg-slate-800/50 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span>Automático (Recomendado)</span>
                </div>
              </SelectItem>
              <SelectItem value="manual">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-400" />
                  <span>Manual</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* AUTO MODE: Show only suggested departments */}
        {selectionMode === 'auto' ? (
          <>
            {isLoadingSuggestions ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border border-white/10 bg-slate-800/50 p-4 animate-pulse">
                    <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-700 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : suggestedDepartments && suggestedDepartments.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-[var(--theme-text-secondary)]">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  <span>Departamentos sugeridos según tu pregunta</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {suggestedDepartments
                    .filter((d) => !selectedDepartmentIds.includes(d.id))
                    .map((dept) => {
                      const isSelected = selectedDepartmentIds.includes(dept.id)
                      return (
                        <div
                          key={dept.id}
                          className={cn(
                            'group relative flex items-start space-x-3 rounded-lg border p-4 transition-colors cursor-pointer hover:border-primary/50',
                            isSelected && 'border-primary bg-primary/5'
                          )}
                          onClick={() => handleToggleDepartment(dept.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleDepartment(dept.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              {dept.icon && <span>{dept.icon}</span>}
                              <p className="font-medium leading-none">{dept.name}</p>
                            </div>
                            <p className="text-xs text-[var(--theme-text-secondary)] line-clamp-2">
                              {dept.type}
                            </p>
                            <div className="flex gap-2 pt-1">
                              <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400 bg-yellow-500/10">
                                {dept.matchScore}% match
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/20 p-6 text-center">
                <Building2 className="mx-auto h-8 w-8 text-[var(--theme-text-tertiary)] mb-2" />
                <p className="text-sm text-[var(--theme-text-secondary)]">
                  No se encontraron departamentos sugeridos. Cambia a modo manual para ver todos.
                </p>
              </div>
            )}
          </>
        ) : (
          /* MANUAL MODE: Show all departments with search */
          <>
            {/* Search and Filter (only in manual mode) */}
            <div className="space-y-2">
              <Label className="text-white">Buscar departamentos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--theme-text-secondary)]" />
                <Input
                  placeholder="Buscar por nombre, tipo o contexto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-800/50 border-white/10 text-white placeholder:text-[var(--theme-text-tertiary)]"
                />
              </div>
            </div>

            {/* Loading state for manual mode */}
            {loadingDepartments && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border border-white/10 bg-slate-800/50 p-4 animate-pulse">
                    <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-700 rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Department list */}
            {!loadingDepartments && (
              <>
                <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                  <span className="text-sm font-medium text-white">Departamentos disponibles:</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      disabled={selectedDepartmentIds.length === filteredDepartments.length}
                      className="text-xs"
                    >
                      Todos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAll}
                      disabled={selectedDepartmentIds.length === 0}
                      className="text-xs"
                    >
                      Ninguno
                    </Button>
                  </div>
                </div>

                {filteredDepartments.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredDepartments.map((dept) => {
                      const isSelected = selectedDepartmentIds.includes(dept.id)

                      return (
                        <div
                          key={dept.id}
                          className={cn(
                            'group relative flex items-start space-x-3 rounded-lg border p-4 transition-colors cursor-pointer hover:border-purple-500/50',
                            isSelected && 'border-purple-500 bg-purple-500/10'
                          )}
                          onClick={() => handleToggleDepartment(dept.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleDepartment(dept.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              {dept.icon && <span>{dept.icon}</span>}
                              <p className="font-medium leading-none text-white">{dept.name}</p>
                            </div>
                            <p className="text-xs text-[var(--theme-text-secondary)] line-clamp-2">
                              {dept.departmentContext?.substring(0, 80) + '...'}
                            </p>
                            <div className="flex gap-2 pt-1">
                              <Badge variant="outline" className="text-xs">
                                {dept.type}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {dept.agentRole}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-white/20 p-6 text-center">
                    <p className="text-sm text-[var(--theme-text-secondary)]">
                      {searchQuery
                        ? 'No se encontraron departamentos que coincidan con tu búsqueda.'
                        : 'No hay más departamentos disponibles.'}
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
              <p className="font-medium text-blue-400">Inyección de Contexto (4 Capas)</p>
              <ul className="space-y-1 text-blue-300/80">
                <li>• <strong>Capa 1:</strong> Rol técnico del agente</li>
                <li>• <strong>Capa 2:</strong> Contexto de {company?.name || 'tu empresa'} (misión/visión/valores)</li>
                <li>• <strong>Capa 3:</strong> Contexto departamental (KPIs/procesos)</li>
                <li>• <strong>Capa 4:</strong> Prompt personalizado del departamento</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
