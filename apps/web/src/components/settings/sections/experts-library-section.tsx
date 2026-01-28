'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { toast } from 'sonner'
import {
  Loader2,
  BookOpen,
  Sparkles,
  Copy,
  Search,
  Filter,
} from 'lucide-react'

interface ExpertsLibrarySectionProps {
  isInModal?: boolean
}

const CATEGORIES = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'vida-personal', label: 'Vida Personal' },
  { value: 'historicos', label: 'Personajes Históricos' },
  { value: 'general', label: 'General' },
] as const

export function ExpertsLibrarySection({ isInModal = false }: ExpertsLibrarySectionProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isForkDialogOpen, setIsForkDialogOpen] = useState(false)
  const [selectedExpert, setSelectedExpert] = useState<{
    id: string
    name: string
  } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!isInModal) {
          router.push('/login')
        }
        return
      }
      setIsAuthenticated(true)
    }
    checkAuth()
  }, [router, supabase.auth, isInModal])

  // Queries - Library experts only
  const { data: experts, isLoading, refetch } = api.experts.libraryList.useQuery(
    {
      activeOnly: true,
      limit: 100,
      search: searchQuery || undefined,
      category: selectedCategory === 'all' ? undefined : selectedCategory || undefined,
    },
    { enabled: isAuthenticated }
  )

  // [WARNING] Fork deshabilitado - expertos personalizados eliminados
  const forkExpert = api.experts.forkFromLibrary.useMutation({
    onSuccess: () => {},
    onError: () => {},
  })

  const handleFork = () => {
    toast.error('Los expertos personalizados han sido eliminados. Solo se pueden usar expertos del sistema.')
  }

  const confirmFork = () => {
    // No hacer nada - funcionalidad deshabilitada
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  // Group experts by category
  const expertsByCategory = experts?.reduce(
    (acc, expert) => {
      const category = expert.category || 'general'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(expert)
      return acc
    },
    {} as Record<string, typeof experts>,
  )

  const categories = expertsByCategory
    ? Object.keys(expertsByCategory).sort()
    : []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-[var(--theme-text-primary)]">Biblioteca de Expertos</h1>
        <p className="text-[var(--theme-text-secondary)]">
          Explora nuestra biblioteca de expertos predefinidos del sistema. Estos son los expertos disponibles para usar en tus debates.
        </p>
        <p className="text-sm text-[var(--theme-text-tertiary)] mt-2">
          [WARN] Los expertos personalizados han sido eliminados. Solo se pueden usar expertos del sistema.
        </p>
      </div>

      <div className="flex justify-end mb-4">
        <Link href="/settings/experts">
          <Button variant="outline" className="border-purple-500/40 text-purple-300 hover:bg-purple-500/20 hover:text-white hover:border-purple-500/60">
            <Sparkles className="mr-2 h-4 w-4" />
            Mis Expertos
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--theme-text-tertiary)]" />
          <Input
            placeholder="Buscar expertos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px] border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!experts || experts.length === 0 ? (
        <Card className="border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-[var(--theme-text-tertiary)] mb-4" />
            <p className="text-[var(--theme-text-secondary)] mb-2">No se encontraron expertos</p>
            <p className="text-sm text-[var(--theme-text-tertiary)]">
              {searchQuery || (selectedCategory && selectedCategory !== 'all')
                ? 'Intenta con otros términos de búsqueda'
                : 'La biblioteca de expertos está vacía'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {categories.map((category) => {
            const categoryExperts = expertsByCategory?.[category] || []
            const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label || category

            return (
              <AccordionItem
                key={category}
                value={category}
                className="border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] backdrop-blur-xl rounded-lg px-4"
              >
                <AccordionTrigger className="text-[var(--theme-text-primary)] hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">{categoryLabel}</h2>
                    <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10">
                      {categoryExperts.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {categoryExperts.map((expert) => {
                      return (
                        <Card
                          key={expert.id}
                          className="border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] backdrop-blur-xl hover:border-purple-500/30 transition-colors"
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-[var(--theme-text-primary)] flex items-center gap-2">
                                  {expert.name}
                                  <Badge
                                    variant="outline"
                                    className="border-blue-500/50 text-blue-300 bg-blue-500/10 text-xs"
                                  >
                                    Biblioteca
                                  </Badge>
                                </CardTitle>
                                <CardDescription className="text-[var(--theme-text-secondary)] mt-1">
                                  {typeof expert.expertise === 'string'
                                    ? expert.expertise
                                    : JSON.stringify(expert.expertise, null, 2)}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {expert.description && (
                              <p className="text-sm text-[var(--theme-text-secondary)] line-clamp-2">
                                {typeof expert.description === 'string'
                                  ? expert.description
                                  : JSON.stringify(expert.description, null, 2)}
                              </p>
                            )}

                            <div className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)]">
                              <span>Provider: {expert.aiConfig.provider}</span>
                              <span>•</span>
                              <span>Model: {expert.aiConfig.model}</span>
                              {expert.aiConfig.temperature && (
                                <>
                                  <span>•</span>
                                  <span>Temp: {expert.aiConfig.temperature}</span>
                                </>
                              )}
                            </div>

                            {/* Botón de copiar deshabilitado - expertos personalizados eliminados */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFork()}
                              disabled={true}
                              className="w-full border-gray-500/40 text-[var(--theme-text-secondary)] cursor-not-allowed opacity-50"
                              title="Los expertos personalizados han sido eliminados"
                            >
                              <Copy className="mr-2 h-3 w-3" />
                              Copiar (Deshabilitado)
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      {/* Fork Confirmation Dialog - Deshabilitado */}
      {false && (
      <Dialog open={isForkDialogOpen} onOpenChange={setIsForkDialogOpen}>
        <DialogContent className="border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] backdrop-blur-xl text-[var(--theme-text-primary)]">
          <DialogHeader>
            <DialogTitle>Copiar Experto a Personalizados</DialogTitle>
            <DialogDescription className="text-[var(--theme-text-tertiary)]">
              [WARN] Los expertos personalizados han sido eliminados. Esta funcionalidad ya no está disponible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsForkDialogOpen(false)}
              className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-tertiary)]"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  )
}