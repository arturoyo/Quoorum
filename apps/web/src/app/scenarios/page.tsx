'use client'

/**
 * Scenarios Page
 *
 * Lista de Escenarios (Decision Playbooks) disponibles
 * Permite seleccionar un escenario y lanzar un debate con un clic
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Sparkles,
  Rocket,
  Building2,
  Search,
  ArrowRight,
  Users,
  Target,
} from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { toast } from 'sonner'

// Segment icons
const segmentIcons = {
  entrepreneur: Rocket,
  sme: Users,
  corporate: Building2,
}

const segmentLabels = {
  entrepreneur: 'Emprendedor',
  sme: 'Pyme / Autónomo',
  corporate: 'Corporate / Inversor',
}

const segmentColors = {
  entrepreneur: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  sme: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  corporate: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
}

export default function ScenariosPage() {
  const router = useRouter()
  const [selectedSegment, setSelectedSegment] = useState<'entrepreneur' | 'sme' | 'corporate' | 'all'>('all')
  const [search, setSearch] = useState('')

  // Fetch scenarios
  const { data, isLoading, error } = api.scenarios.list.useQuery({
    segment: selectedSegment !== 'all' ? selectedSegment : undefined,
    status: 'active',
    search: search || undefined,
    limit: 50,
  })

  const scenarios = data?.items || []

  // Launch scenario
  const createDebateMutation = api.debates.create.useMutation({
    onSuccess: (result) => {
      toast.success('Debate iniciado con escenario')
      router.push(`/debates/${result.id}`)
    },
    onError: (error) => {
      toast.error(`Error al iniciar debate: ${error.message}`)
    },
  })

  const handleLaunchScenario = (scenarioId: string) => {
    // Prompt user for input
    const userInput = prompt('Describe tu caso o pregunta:')
    if (!userInput || userInput.trim().length < 20) {
      toast.error('Por favor, proporciona más detalles (mínimo 20 caracteres)')
      return
    }

    createDebateMutation.mutate({
      question: userInput,
      scenarioId,
      scenarioVariables: {
        user_input: userInput,
      },
    })
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--theme-bg-primary)]">
        <AppHeader variant="app" />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center">
            <p className="text-red-400">Error al cargar escenarios: {error.message}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--theme-bg-primary)]">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[var(--theme-bg-primary)] to-blue-900/20" />
        <div className="absolute inset-0 bg-[linear-gradient(var(--theme-landing-grid)_1px,transparent_1px),linear-gradient(90deg,var(--theme-landing-grid)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      <AppHeader variant="app" />

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-[var(--theme-text-primary)]">
              Escenarios
            </h1>
          </div>
          <p className="text-[var(--theme-text-secondary)] max-w-2xl">
            Decision Playbooks preconfigurados que seleccionan expertos, frameworks y contextos
            para garantizar decisiones de alta calidad con un solo clic.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-secondary)]" />
            <Input
              type="text"
              placeholder="Buscar escenarios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border-[var(--theme-border)] bg-[var(--theme-bg-input)] pl-10 text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500 focus-visible:border-purple-500"
            />
          </div>

          {/* Segment Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedSegment === 'all' ? 'default' : 'outline'}
              className={
                selectedSegment === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]'
              }
              onClick={() => setSelectedSegment('all')}
            >
              Todos
            </Button>
            {(['entrepreneur', 'sme', 'corporate'] as const).map((segment) => {
              const Icon = segmentIcons[segment]
              return (
                <Button
                  key={segment}
                  size="sm"
                  variant={selectedSegment === segment ? 'default' : 'outline'}
                  className={
                    selectedSegment === segment
                      ? 'bg-purple-600 text-white'
                      : 'border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]'
                  }
                  onClick={() => setSelectedSegment(segment)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {segmentLabels[segment]}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Scenarios Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : scenarios.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--theme-text-secondary)]">
              No se encontraron escenarios activos
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => {
              const SegmentIcon = segmentIcons[scenario.segment]
              return (
                <Card
                  key={scenario.id}
                  className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] hover:border-purple-500/40 transition-all duration-300"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={segmentColors[scenario.segment]}>
                        <SegmentIcon className="h-3 w-3 mr-1" />
                        {segmentLabels[scenario.segment]}
                      </Badge>
                      {scenario.usageCount > 0 && (
                        <span className="text-xs text-[var(--theme-text-tertiary)]">
                          {scenario.usageCount} usos
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-[var(--theme-text-primary)]">
                      {scenario.name}
                    </CardTitle>
                    <CardDescription className="text-[var(--theme-text-secondary)]">
                      {scenario.shortDescription || scenario.description.substring(0, 100)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--theme-text-secondary)] mb-4 line-clamp-3">
                      {scenario.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-[var(--theme-text-tertiary)]">
                        <Target className="h-3 w-3" />
                        <span>{scenario.expertIds?.length || 0} expertos</span>
                      </div>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => handleLaunchScenario(scenario.id)}
                        disabled={createDebateMutation.isPending}
                      >
                        {createDebateMutation.isPending ? (
                          'Iniciando...'
                        ) : (
                          <>
                            Lanzar
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
