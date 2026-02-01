'use client'

import { useState } from 'react'
import { Activity, Plus, X, Sparkles, TrendingUp, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { BuyerPersonaSelector } from './components/buyer-persona-selector'
import { SimulationResults } from './components/simulation-results'

/**
 * Market Simulator - AI Focus Group
 *
 * Permite evaluar variantes de mensajes/copy usando
 * Buyer Personas como jueces dialécticos
 */
export default function MarketSimulatorPage() {
  const [variants, setVariants] = useState<string[]>(['', ''])
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [context, setContext] = useState('')

  const { data: buyerPersonas, isLoading: loadingPersonas } = api.strategicProfiles.list.useQuery({
    type: 'buyer_persona',
  })

  const runSimulation = api.marketSimulator.runSimulation.useMutation({
    onSuccess: (data) => {
      toast.success('Simulación completada', {
        description: `Variante ganadora: #${data.result.winningVariant.index + 1}`,
      })
    },
    onError: (error) => {
      toast.error('Error en la simulación', {
        description: error.message,
      })
    },
  })

  const handleAddVariant = () => {
    if (variants.length < 5) {
      setVariants([...variants, ''])
    }
  }

  const handleRemoveVariant = (index: number) => {
    if (variants.length > 2) {
      setVariants(variants.filter((_, i) => i !== index))
    }
  }

  const handleVariantChange = (index: number, value: string) => {
    const newVariants = [...variants]
    newVariants[index] = value
    setVariants(newVariants)
  }

  const handleRunSimulation = () => {
    // Validations
    const validVariants = variants.filter(v => v.trim().length >= 10)

    if (validVariants.length < 2) {
      toast.error('Se requieren al menos 2 variantes con texto válido (mínimo 10 caracteres)')
      return
    }

    if (selectedPersonas.length === 0) {
      toast.error('Selecciona al menos 1 Buyer Persona para evaluar')
      return
    }

    runSimulation.mutate({
      variants: validVariants,
      buyerPersonaIds: selectedPersonas,
      context: context || undefined,
    })
  }

  const canRun = variants.filter(v => v.trim().length >= 10).length >= 2 && selectedPersonas.length > 0

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="h-8 w-8 text-purple-400" />
          <h1 className="text-3xl font-bold">
            Simulador de Mercado
          </h1>
        </div>
        <p className="text-muted-foreground">
          Focus Group de IA: Evalúa variantes de mensajes con Buyer Personas como jueces dialécticos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input */}
        <div className="lg:col-span-2 space-y-6">
          {/* Variants Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-400" />
                    Variantes a Evaluar
                  </CardTitle>
                  <CardDescription>
                    Introduce 2-5 versiones de tu mensaje, copy o propuesta
                  </CardDescription>
                </div>
                {variants.length < 5 && (
                  <Button variant="outline" size="sm" onClick={handleAddVariant}>
                    <Plus className="h-4 w-4 mr-1" />
                    Añadir
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {variants.map((variant, index) => (
                <div key={index} className="relative">
                  <div className="flex items-start gap-2 mb-2">
                    <Badge variant="outline" className="mt-2">
                      Variante {index + 1}
                    </Badge>
                    {variants.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVariant(index)}
                        className="ml-auto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={variant}
                    onChange={(e) => handleVariantChange(index, e.target.value)}
                    placeholder="Ej: Descubre cómo tomar decisiones estratégicas en minutos, sin consultoras ni reuniones interminables..."
                    rows={4}
                    className="resize-none"
                  />
                  {variant.trim() && variant.trim().length < 10 && (
                    <p className="text-xs text-red-400 mt-1">
                      Mínimo 10 caracteres
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Context (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Contexto de Mercado (Opcional)
              </CardTitle>
              <CardDescription className="text-xs">
                Añade información adicional sobre tu mercado, audiencia o situación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Ej: Lanzamiento de producto B2B SaaS dirigido a CFOs de empresas fintech..."
                rows={3}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {context.length}/2000
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Buyer Personas + Run */}
        <div className="space-y-6">
          {/* Buyer Personas Selector */}
          <BuyerPersonaSelector
            personas={buyerPersonas || []}
            selected={selectedPersonas}
            onChange={setSelectedPersonas}
            isLoading={loadingPersonas}
          />

          {/* Run Simulation */}
          <Card className="border-purple-500/30 bg-purple-500/5">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                Ejecutar Simulación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• {variants.filter(v => v.trim().length >= 10).length} variantes listas</p>
                <p>• {selectedPersonas.length} Buyer Personas seleccionadas</p>
                {selectedPersonas.length > 0 && (
                  <p>• ~{selectedPersonas.length * variants.filter(v => v.trim()).length} evaluaciones</p>
                )}
              </div>

              <Button
                onClick={handleRunSimulation}
                disabled={!canRun || runSimulation.isPending}
                className="w-full"
              >
                {runSimulation.isPending ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Evaluando...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ejecutar Focus Group IA
                  </>
                )}
              </Button>

              {!canRun && (
                <p className="text-xs text-amber-400">
                  {variants.filter(v => v.trim().length >= 10).length < 2
                    ? 'Completa al menos 2 variantes'
                    : 'Selecciona al menos 1 Buyer Persona'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                ¿Cómo funciona?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                1. Cada Buyer Persona evalúa TODAS las variantes
              </p>
              <p>
                2. Analizan fricción mental, alineación con JTBD y reducción de barreras
              </p>
              <p>
                3. Generan críticas específicas (argumentos de rechazo)
              </p>
              <p>
                4. IA sintetiza qué variante resuena mejor y por qué
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results */}
      {runSimulation.data && (
        <div className="mt-8">
          <SimulationResults
            result={runSimulation.data.result}
            personas={runSimulation.data.personas}
            variants={variants.filter(v => v.trim().length >= 10)}
          />
        </div>
      )}
    </div>
  )
}
