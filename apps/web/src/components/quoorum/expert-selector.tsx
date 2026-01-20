'use client'

import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Loader2,
  Sparkles,
  Users,
  Zap,
  Info,
  Search,
  X,
  Filter,
  Settings,
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

interface ExpertSelectorProps {
  selectedExpertIds: string[]
  onSelectionChange: (expertIds: string[]) => void
  question?: string
  context?: string
  defaultOpen?: boolean // Auto-open when true
}

const CATEGORIES = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'vida-personal', label: 'Vida Personal' },
  { value: 'historicos', label: 'Personajes Históricos' },
  { value: 'general', label: 'General' },
] as const

/**
 * Expert Selector Component
 * 
 * Proposes experts automatically based on question context
 * Shows selected experts in a fixed top section
 * Allows filtering and browsing by categories
 */
export function ExpertSelector({
  selectedExpertIds,
  onSelectionChange,
  question,
  context,
  defaultOpen = false,
}: ExpertSelectorProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>('auto')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // useAutoSuggestions is now controlled by selectionMode
  const useAutoSuggestions = selectionMode === 'auto'

  // Get auto-suggested experts when question is available (only in auto mode)
  const { data: suggestedExperts, isLoading: isLoadingSuggestions } = api.experts.suggest.useQuery(
    { question: question || '', context: context || '' },
    {
      enabled: isOpen && !!question && question.length >= 10 && selectionMode === 'auto',
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )

  // Get category counts first (fast, shows structure immediately) - only in manual mode
  const { data: categoryCounts } = api.experts.libraryCategoryCounts.useQuery(
    { activeOnly: true },
    { enabled: isOpen && selectionMode === 'manual' }
  )

  // Get all experts from library (load in background) - only in manual mode
  const { data: customExperts, isLoading: isLoadingCustom } = api.experts.libraryList.useQuery(
    { activeOnly: true, limit: 100 },
    { enabled: isOpen && selectionMode === 'manual' }
  )

  // Auto-select suggested experts when they arrive (only if no selection yet and in auto mode)
  useEffect(() => {
    if (suggestedExperts &&
        suggestedExperts.length > 0 &&
        selectedExpertIds.length === 0 &&
        selectionMode === 'auto' &&
        isOpen) {
      // Auto-select top 3-5 suggested experts
      const topExperts = suggestedExperts
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5)
        .map((e) => e.id)

      console.log('[ExpertSelector] 🎯 Auto-selecting experts:', {
        count: topExperts.length,
        expertIds: topExperts
      })

      if (topExperts.length > 0) {
        onSelectionChange(topExperts)
      }
    }
  }, [suggestedExperts, selectionMode, isOpen, selectedExpertIds.length, onSelectionChange])

  const toggleExpert = (expertId: string) => {
    if (selectedExpertIds.includes(expertId)) {
      onSelectionChange(selectedExpertIds.filter((id) => id !== expertId))
    } else {
      onSelectionChange([...selectedExpertIds, expertId])
    }
  }

  // Get selected experts data (from both suggested and custom)
  const selectedExpertsData = useMemo(() => {
    const selected: Array<{
      id: string
      name: string
      category?: string
      expertise?: string | string[]
      matchScore?: number
      isSuggested?: boolean
    }> = []

    // Add suggested experts that are selected
    if (suggestedExperts) {
      suggestedExperts
        .filter((e) => selectedExpertIds.includes(e.id))
        .forEach((e) => {
          selected.push({
            id: e.id,
            name: e.name,
            category: e.category,
            expertise: e.expertise,
            matchScore: e.matchScore,
            isSuggested: true,
          })
        })
    }

    // Add custom experts that are selected
    if (customExperts) {
      customExperts
        .filter((e) => selectedExpertIds.includes(e.id))
        .forEach((e) => {
          selected.push({
            id: e.id,
            name: e.name,
            category: e.category,
            expertise: e.expertise || e.description,
            isSuggested: false,
          })
        })
    }

    return selected
  }, [selectedExpertIds, suggestedExperts, customExperts])

  // Get categories from counts (fast) or from loaded experts (fallback)
  const categoriesWithCounts = useMemo(() => {
    if (categoryCounts?.byCategory) {
      // Use fast category counts if available
      return Object.entries(categoryCounts.byCategory)
        .map(([category, count]) => ({
          category,
          count,
          label: CATEGORIES.find((c) => c.value === category)?.label || category,
        }))
        .sort((a, b) => b.count - a.count) // Sort by count descending
    }
    return []
  }, [categoryCounts])

  // Filter and group custom experts
  const filteredAndGroupedExperts = useMemo(() => {
    if (!customExperts) return {}

    // Filter by search query
    let filtered = customExperts.filter((expert) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const nameMatch = expert.name.toLowerCase().includes(query)
        const expertiseMatch = typeof expert.expertise === 'string'
          ? expert.expertise.toLowerCase().includes(query)
          : Array.isArray(expert.expertise)
            ? expert.expertise.some((e) => e.toLowerCase().includes(query))
            : false
        const descMatch = expert.description?.toLowerCase().includes(query) || false
        
        if (!nameMatch && !expertiseMatch && !descMatch) return false
      }

      // Filter by category
      if (selectedCategory !== 'all') {
        if (expert.category !== selectedCategory) return false
      }

      // Exclude already selected experts
      if (selectedExpertIds.includes(expert.id)) return false

      return true
    })

    // Group by category
    const grouped: Record<string, typeof filtered> = {}
    filtered.forEach((expert) => {
      const category = expert.category || 'general'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category]!.push(expert)
    })

    return grouped
  }, [customExperts, searchQuery, selectedCategory, selectedExpertIds])

  // Filter suggested experts (exclude selected ones)
  const filteredSuggestedExperts = useMemo(() => {
    if (!suggestedExperts) return []
    
    return suggestedExperts
      .filter((e) => {
        // Exclude already selected
        if (selectedExpertIds.includes(e.id)) return false

        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          const nameMatch = e.name.toLowerCase().includes(query)
          const expertiseMatch = Array.isArray(e.expertise)
            ? e.expertise.some((exp) => exp.toLowerCase().includes(query))
            : false
          
          if (!nameMatch && !expertiseMatch) return false
        }

        return true
      })
      .sort((a, b) => b.matchScore - a.matchScore)
  }, [suggestedExperts, searchQuery, selectedExpertIds])

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
              : question && question.length >= 10
                ? 'Ver Expertos Sugeridos'
                : 'Seleccionar Expertos'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isLoading = isLoadingSuggestions || isLoadingCustom
  const categories = Object.keys(filteredAndGroupedExperts).sort()
  
  // Use category counts if available, otherwise use loaded categories
  const displayCategories = categoriesWithCounts.length > 0 
    ? categoriesWithCounts.map(c => c.category)
    : categories

  return (
    <Card className="border-purple-500/20 bg-slate-900/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-white">Selección de Expertos</CardTitle>
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
          {question && question.length >= 10
            ? 'Expertos propuestos automáticamente según tu pregunta. Puedes seleccionar manualmente o usar los sugeridos.'
            : 'Selecciona expertos personalizados. Si no seleccionas ninguno, se usarán expertos automáticos del sistema.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {/* Selected Experts - Fixed Top Section */}
        {selectedExpertsData.length > 0 && (
          <div className="space-y-3 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">
                  Expertos Seleccionados
                </span>
                <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400 bg-purple-500/10">
                  {selectedExpertsData.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectionChange([])}
                className="text-xs text-gray-400 hover:text-white"
              >
                Limpiar todos
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedExpertsData.map((expert) => (
                <div
                  key={`selected-${expert.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-500/50 bg-purple-500/20 backdrop-blur-sm"
                >
                  <span className="text-sm font-medium text-white">{expert.name}</span>
                  {expert.matchScore && (
                    <Badge
                      variant="outline"
                      className="text-xs border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
                    >
                      {expert.matchScore}% match
                    </Badge>
                  )}
                  <button
                    onClick={() => toggleExpert(expert.id)}
                    className="ml-1 p-0.5 rounded hover:bg-purple-600/30 text-gray-300 hover:text-white transition-colors"
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
                  <Users className="h-4 w-4 text-purple-400" />
                  <span>Manual</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* AUTO MODE: Show only suggested experts */}
        {selectionMode === 'auto' ? (
          <>
            {isLoadingSuggestions ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                  <span className="text-sm text-gray-400">Analizando tu pregunta y buscando expertos...</span>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-20 w-full bg-slate-800/60 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : question && question.length >= 10 && suggestedExperts && suggestedExperts.length > 0 ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-white">
                    Expertos Sugeridos Automáticamente
                  </span>
                  <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400 bg-yellow-500/10">
                    {filteredSuggestedExperts.length}
                  </Badge>
                </div>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {filteredSuggestedExperts.map((suggested) => {
                      const isSelected = selectedExpertIds.includes(suggested.id)
                      return (
                        <div
                          key={`suggested-${suggested.id}`}
                          onClick={() => toggleExpert(suggested.id)}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                            isSelected
                              ? 'border-yellow-500/50 bg-yellow-500/10'
                              : 'border-white/10 bg-slate-800/30 hover:border-yellow-500/30 hover:bg-slate-800/50'
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleExpert(suggested.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-white truncate">
                                {suggested.name}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs',
                                  suggested.role === 'primary'
                                    ? 'border-green-500/30 text-green-400 bg-green-500/10'
                                    : suggested.role === 'critic'
                                    ? 'border-red-500/30 text-red-400 bg-red-500/10'
                                    : 'border-gray-600 text-gray-400'
                                )}
                              >
                                {suggested.role === 'primary' ? 'Principal' : suggested.role === 'critic' ? 'Crítico' : 'Secundario'}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs border-purple-500/30 text-purple-400 bg-purple-500/10"
                              >
                                {suggested.matchScore}% match
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-1 mb-1">
                              {suggested.expertise?.join(', ') || suggested.title}
                            </p>
                            {suggested.reasons && suggested.reasons.length > 0 && (
                              <div className="mt-1 flex items-start gap-1">
                                <Info className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-yellow-300/70 line-clamp-2">
                                  {suggested.reasons.slice(0, 2).join(', ')}
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
                  <Badge className="bg-yellow-600 text-white">
                    {filteredSuggestedExperts.length} Expertos Recomendados
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  El sistema ha analizado tu pregunta y seleccionado los expertos más relevantes. Puedes cambiar a modo manual para ver todos los expertos disponibles.
                </p>
              </div>
            </>
          ) : question && question.length >= 10 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400 mb-3" />
              <p className="text-gray-400 mb-2">No se encontraron expertos sugeridos</p>
              <p className="text-sm text-gray-500">
                Intenta cambiar a modo manual para ver todos los expertos disponibles
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Info className="h-8 w-8 text-gray-500 mb-3" />
              <p className="text-gray-400 mb-2">Añade una pregunta para ver expertos sugeridos</p>
              <p className="text-sm text-gray-500">
                El modo automático requiere una pregunta de al menos 10 caracteres
              </p>
            </div>
          )}
          </>
        ) : (
          /* MANUAL MODE: Show categories with all experts */
          <>
            {/* Search and Filter (only in manual mode) */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar expertos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-white/10 bg-slate-800/50 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-white/10 bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  title="Filtrar por categoría"
                  aria-label="Filtrar expertos por categoría"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Loading state for manual mode */}
            {isLoadingCustom && !categoryCounts ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                  <span className="text-sm text-gray-400">Cargando expertos y categorías...</span>
                </div>
                {/* Show category structure with loading skeletons */}
                {categoryCounts?.byCategory ? (
                  <Accordion type="multiple" className="space-y-2">
                    {Object.entries(categoryCounts.byCategory).map(([category, count]) => {
                      const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label || category
                      return (
                        <AccordionItem
                          key={category}
                          value={category}
                          className="border-white/10 bg-slate-800/30 rounded-lg px-4"
                        >
                          <AccordionTrigger className="text-white hover:no-underline py-3">
                            <div className="flex items-center gap-3">
                              <h3 className="text-sm font-semibold">{categoryLabel}</h3>
                              <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10 text-xs">
                                {count}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-4">
                            <div className="space-y-2">
                              {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-16 w-full bg-slate-800/60 animate-pulse" />
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                ) : (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full bg-slate-800/60 animate-pulse" />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Manual/Custom Experts Section - Grouped by Category */
              (categoriesWithCounts.length > 0 || categories.length > 0) ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-semibold text-white">
                    Expertos Personalizados
                  </span>
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                    {categoryCounts?.total || Object.values(filteredAndGroupedExperts).reduce((acc, experts) => acc + experts.length, 0)}
                  </Badge>
                </div>
                
                <Accordion type="multiple" className="space-y-2">
                  {/* Show categories with counts immediately, even if experts not loaded yet */}
                  {categoriesWithCounts.length > 0 ? (
                    categoriesWithCounts.map(({ category, count, label }) => {
                      const categoryExperts = filteredAndGroupedExperts[category] || []
                      const isLoadingCategory = isLoadingCustom && categoryExperts.length === 0

                      return (
                        <AccordionItem
                          key={category}
                          value={category}
                          className="border-white/10 bg-slate-800/30 rounded-lg px-4"
                        >
                          <AccordionTrigger className="text-white hover:no-underline py-3">
                            <div className="flex items-center gap-3">
                              <h3 className="text-sm font-semibold">{label}</h3>
                              <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10 text-xs">
                                {count}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-4">
                            {isLoadingCategory ? (
                              <div className="space-y-2">
                                <Skeleton className="h-12 w-full bg-slate-800/60" />
                                <Skeleton className="h-12 w-full bg-slate-800/60" />
                                <Skeleton className="h-12 w-full bg-slate-800/60" />
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {categoryExperts.length > 0 ? (
                                  categoryExperts.map((expert) => {
                                    const isSelected = selectedExpertIds.includes(expert.id)
                                    return (
                                      <div
                                        key={`custom-${expert.id}`}
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
                                          </div>
                                          <p className="text-xs text-gray-400 line-clamp-2">
                                            {typeof expert.expertise === 'string'
                                              ? expert.expertise
                                              : Array.isArray(expert.expertise)
                                                ? expert.expertise.join(', ')
                                                : expert.description || 'Sin descripción'}
                                          </p>
                                        </div>
                                      </div>
                                    )
                                  })
                                ) : (
                                  <p className="text-xs text-gray-500 text-center py-4">
                                    No hay expertos en esta categoría
                                  </p>
                                )}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })
                  ) : (
                    // Fallback: use loaded categories if counts not available
                    categories.map((category) => {
                      const categoryExperts = filteredAndGroupedExperts[category] || []
                      const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label || category

                      return (
                        <AccordionItem
                          key={category}
                          value={category}
                          className="border-white/10 bg-slate-800/30 rounded-lg px-4"
                        >
                          <AccordionTrigger className="text-white hover:no-underline py-3">
                            <div className="flex items-center gap-3">
                              <h3 className="text-sm font-semibold">{categoryLabel}</h3>
                              <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10 text-xs">
                                {categoryExperts.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-4">
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                              {categoryExperts.map((expert) => {
                                const isSelected = selectedExpertIds.includes(expert.id)
                                return (
                                  <div
                                    key={`custom-${expert.id}`}
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
                                      </div>
                                      <p className="text-xs text-gray-400 line-clamp-2">
                                        {typeof expert.expertise === 'string'
                                          ? expert.expertise
                                          : Array.isArray(expert.expertise)
                                            ? expert.expertise.join(', ')
                                            : expert.description || 'Sin descripción'}
                                      </p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })
                  )}
                </Accordion>
              </div>
            ) : (
              /* Empty State for manual mode */
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Sparkles className="h-12 w-12 text-gray-500 mb-3" />
                <p className="text-gray-400 mb-2">No hay expertos disponibles</p>
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
            ))}

            {/* No results from search/filter (manual mode only) */}
            {searchQuery && 
             categories.length === 0 && 
             selectedExpertsData.length > 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="h-12 w-12 text-gray-500 mb-3" />
                <p className="text-gray-400 mb-2">No se encontraron expertos</p>
                <p className="text-sm text-gray-500">
                  Intenta con otros términos de búsqueda o cambia el filtro de categoría
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
