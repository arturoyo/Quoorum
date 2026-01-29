'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, TrendingUp, Users, Lightbulb, ExternalLink, CheckCircle2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

// ============================================================================
// TYPES
// ============================================================================

interface ResearchResult {
  category: string
  title: string
  summary: string
  sources: Array<{
    title: string
    url: string
    snippet: string
  }>
  confidence: number
}

interface ResearchResultsProps {
  results: ResearchResult[]
  suggestedContext: Record<string, unknown>
  executionTimeMs: number
  onAcceptAll: () => void
  onAcceptPartial: (context: Record<string, unknown>) => void
  onSkip: () => void
}

// ============================================================================
// CATEGORY ICONS
// ============================================================================

const categoryIcons: Record<string, React.ReactNode> = {
  'Market Data': <TrendingUp className="h-4 w-4" />,
  'Competitive Intelligence': <Users className="h-4 w-4" />,
  'Best Practices': <Lightbulb className="h-4 w-4" />,
  'Recent Developments': <Search className="h-4 w-4" />,
  'General Research': <Search className="h-4 w-4" />,
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ResearchResults({
  results,
  suggestedContext,
  executionTimeMs,
  onAcceptAll,
  onAcceptPartial,
  onSkip,
}: ResearchResultsProps) {
  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false)
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(Object.keys(suggestedContext)))

  if (results.length === 0) {
    return null
  }

  // Field labels for better UX
  const fieldLabels: Record<string, string> = {
    market: 'Datos de Mercado',
    competitors: 'Inteligencia Competitiva',
    benchmarks: 'Benchmarks',
    risks: 'Riesgos',
    opportunities: 'Oportunidades',
    constraints: 'Restricciones',
    background: 'Contexto General',
    contexto_clave: 'Contexto Clave',
    datos_mercado: 'Datos de Mercado',
    consideraciones: 'Consideraciones',
    opciones_identificadas: 'Opciones Identificadas',
    criterios_evaluacion: 'Criterios de Evaluaci�n',
  }

  const handleToggleField = (field: string) => {
    const newSelected = new Set(selectedFields)
    if (newSelected.has(field)) {
      newSelected.delete(field)
    } else {
      newSelected.add(field)
    }
    setSelectedFields(newSelected)
  }

  const handleAcceptSelected = () => {
    const partialContext: Record<string, unknown> = {}
    selectedFields.forEach((field) => {
      if (suggestedContext[field] !== undefined) {
        partialContext[field] = suggestedContext[field]
      }
    })
    onAcceptPartial(partialContext)
    setIsCustomizeDialogOpen(false)
  }

  const handleSelectAll = () => {
    setSelectedFields(new Set(Object.keys(suggestedContext)))
  }

  const handleDeselectAll = () => {
    setSelectedFields(new Set())
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between rounded-lg border border-purple-500/30 bg-purple-900/20 p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-[var(--theme-text-primary)]">
              ?? Auto-Research Completado
            </h3>
          </div>
          <p className="mt-1 text-sm text-[#aebac1]">
            He investigado autom�ticamente y encontr� {results.length} fuentes relevantes
            en {(executionTimeMs / 1000).toFixed(1)}s
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onAcceptAll}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Aceptar todo
          </Button>
          <Button
            onClick={onSkip}
            variant="outline"
            className="border-[#2a3942] text-[#aebac1] hover:bg-[#2a3942]"
          >
            Omitir
          </Button>
        </div>
      </div>

      {/* Research Results */}
      <div className="grid gap-4 md:grid-cols-2">
        {results.map((result, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-[#2a3942] bg-[#111b21] p-4">
              {/* Category Badge */}
              <div className="mb-3 flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="border-purple-500/30 bg-purple-900/20 text-purple-300"
                >
                  <span className="mr-1.5">{categoryIcons[result.category]}</span>
                  {result.category}
                </Badge>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span className="text-xs text-[#8696a0]">
                    {Math.round(result.confidence * 100)}% confianza
                  </span>
                </div>
              </div>

              {/* Summary */}
              <h4 className="mb-2 text-sm font-medium text-[var(--theme-text-primary)]">{result.title}</h4>
              <p className="mb-3 text-sm text-[#aebac1] leading-relaxed">
                {result.summary}
              </p>

              {/* Sources */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#8696a0]">Fuentes:</p>
                {result.sources.slice(0, 2).map((source, sourceIndex) => (
                  <a
                    key={sourceIndex}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-2 rounded border border-[#2a3942] bg-[#0b141a] p-2 transition-colors hover:border-purple-500/40 hover:bg-[#202c33]"
                  >
                    <ExternalLink className="mt-0.5 h-3 w-3 flex-shrink-0 text-[#8696a0] group-hover:text-purple-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#aebac1] group-hover:text-[var(--theme-text-primary)] line-clamp-1">
                        {source.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[#8696a0] line-clamp-2">
                        {source.snippet}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Suggested Context Preview */}
      {Object.keys(suggestedContext).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg border border-[#2a3942] bg-[#111b21] p-4"
        >
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--theme-text-primary)]">
            <Lightbulb className="h-4 w-4 text-purple-400" />
            Contexto Pre-llenado
          </h4>

          <div className="space-y-2">
            {Object.entries(suggestedContext).map(([key, value], index) => (
              <div
                key={index}
                className="rounded border border-[#2a3942] bg-[#0b141a] p-3"
              >
                <p className="mb-1 text-xs font-medium text-purple-300">{key}</p>
                <pre className="text-xs text-[#aebac1] whitespace-pre-wrap">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </pre>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={onAcceptAll}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              ? Usar este contexto
            </Button>
            <Button
              onClick={() => setIsCustomizeDialogOpen(true)}
              size="sm"
              variant="outline"
              className="border-[#2a3942] text-[#aebac1] hover:bg-[#2a3942]"
            >
              <Settings className="mr-2 h-4 w-4" />
              Personalizar
            </Button>
          </div>
        </motion.div>
      )}

      {/* Customize Context Dialog */}
      <Dialog open={isCustomizeDialogOpen} onOpenChange={setIsCustomizeDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#111b21] border-[#2a3942] text-[var(--theme-text-primary)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--theme-text-primary)]">Personalizar Contexto</DialogTitle>
            <DialogDescription className="text-[#aebac1]">
              Selecciona qu� campos del contexto quieres incluir en tu debate
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {/* Select All / Deselect All */}
            <div className="flex gap-2 pb-2 border-b border-[#2a3942]">
              <Button
                onClick={handleSelectAll}
                size="sm"
                variant="outline"
                className="border-[#2a3942] text-[#aebac1] hover:bg-[#2a3942] text-xs"
              >
                Seleccionar todo
              </Button>
              <Button
                onClick={handleDeselectAll}
                size="sm"
                variant="outline"
                className="border-[#2a3942] text-[#aebac1] hover:bg-[#2a3942] text-xs"
              >
                Deseleccionar todo
              </Button>
            </div>

            {/* Field Checkboxes */}
            {Object.entries(suggestedContext).map(([key, value]) => {
              const label = fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
              const isSelected = selectedFields.has(key)

              return (
                <div
                  key={key}
                  className="flex items-start gap-3 rounded-lg border border-[#2a3942] bg-[#0b141a] p-4 hover:border-purple-500/40 transition-colors"
                >
                  <Checkbox
                    id={key}
                    checked={isSelected}
                    onCheckedChange={() => handleToggleField(key)}
                    className="mt-1 border-[#2a3942] data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                  <Label
                    htmlFor={key}
                    className="flex-1 cursor-pointer text-sm text-[var(--theme-text-primary)]"
                  >
                    <div className="font-medium mb-1">{label}</div>
                    <div className="text-xs text-[#aebac1] mt-1">
                      <pre className="whitespace-pre-wrap break-words">
                        {typeof value === 'object' 
                          ? JSON.stringify(value, null, 2).substring(0, 200) + (JSON.stringify(value, null, 2).length > 200 ? '...' : '')
                          : String(value).substring(0, 200) + (String(value).length > 200 ? '...' : '')
                        }
                      </pre>
                    </div>
                  </Label>
                </div>
              )
            })}
          </div>

          <DialogFooter className="gap-2">
            <Button
              onClick={() => setIsCustomizeDialogOpen(false)}
              variant="outline"
              className="border-[#2a3942] text-[#aebac1] hover:bg-[#2a3942]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAcceptSelected}
              disabled={selectedFields.size === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aceptar {selectedFields.size} campo{selectedFields.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
