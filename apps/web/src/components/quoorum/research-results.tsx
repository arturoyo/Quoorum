'use client'

import { motion } from 'framer-motion'
import { Search, TrendingUp, Users, Lightbulb, ExternalLink, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
  if (results.length === 0) {
    return null
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
            <h3 className="text-lg font-semibold text-white">
              🔍 Auto-Research Completado
            </h3>
          </div>
          <p className="mt-1 text-sm text-[#aebac1]">
            He investigado automáticamente y encontré {results.length} fuentes relevantes
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
              <h4 className="mb-2 text-sm font-medium text-white">{result.title}</h4>
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
                      <p className="text-xs font-medium text-[#aebac1] group-hover:text-white line-clamp-1">
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
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
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
              ✓ Usar este contexto
            </Button>
            <Button
              onClick={() => onAcceptPartial({})}
              size="sm"
              variant="outline"
              className="border-[#2a3942] text-[#aebac1] hover:bg-[#2a3942]"
            >
              Personalizar
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
