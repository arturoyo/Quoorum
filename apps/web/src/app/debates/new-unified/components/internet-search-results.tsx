/**
 * InternetSearchResults Component
 * 
 * Displays search results and allows user to select which ones to include in context.
 */

'use client'

import React from 'react'
import { Globe, CheckCircle, X, ExternalLink, Edit2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { InternetSearchState } from '../types'

interface InternetSearchResultsProps {
  internetSearch: InternetSearchState
  onToggleResult: (resultId: string) => void
  onUpdateCustomText: (text: string) => void
  onApplyResults: () => void
  onContinue: () => void
  onEdit: () => void
  onSkip: () => void
}

export function InternetSearchResults({
  internetSearch,
  onToggleResult,
  onUpdateCustomText,
  onApplyResults,
  onContinue,
  onEdit,
  onSkip,
}: InternetSearchResultsProps) {
  const selectedCount = internetSearch.results.filter((r) => r.selected).length
  const hasCustomText = internetSearch.customText && internetSearch.customText.trim().length > 0
  const hasSelection = selectedCount > 0 || hasCustomText
  const isApplied = internetSearch.isApplied && internetSearch.context

  // Si ya está aplicado, mostrar vista de confirmación
  if (isApplied) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--theme-text-primary)] mb-2">
            Contexto de internet guardado
          </h2>
          <p className="text-[var(--theme-text-tertiary)]">
            El contexto seleccionado está listo para usar. Puedes continuar o editar la selección.
          </p>
        </div>

        <div className="bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-lg p-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[var(--theme-text-tertiary)] mb-3">Contexto preparado:</h3>
            <div className="max-h-48 overflow-y-auto p-4 bg-[var(--theme-bg-primary)] rounded border border-[var(--theme-border)]">
              <p className="text-sm text-[var(--theme-text-secondary)] whitespace-pre-wrap">
                {internetSearch.context}
              </p>
            </div>
            {selectedCount > 0 && (
              <p className="text-xs text-purple-400 mt-2">
                {selectedCount} resultado{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
                {hasCustomText && ' + texto adicional'}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Button
            onClick={onContinue}
            className="h-12 bg-purple-600 hover:bg-purple-700 text-white text-lg"
          >
            Continuar con este contexto
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            onClick={onEdit}
            variant="outline"
            className="h-12 border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-tertiary)]"
          >
            <Edit2 className="mr-2 h-5 w-5" />
            Editar selección
          </Button>
          <Button
            onClick={onSkip}
            variant="ghost"
            className="h-12 text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)]"
          >
            <X className="mr-2 h-5 w-5" />
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  // Vista de selección (edición)
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <Globe className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Resultados de búsqueda encontrados
        </h2>
        <p className="text-[var(--theme-text-secondary)]">
          Selecciona los resultados que quieres incluir o introduce un texto alternativo
        </p>
        {hasSelection && (
          <p className="text-sm text-purple-400 mt-2">
            {selectedCount > 0 && `${selectedCount} resultado${selectedCount !== 1 ? 's' : ''} seleccionado${selectedCount !== 1 ? 's' : ''}`}
            {selectedCount > 0 && hasCustomText && ' + '}
            {hasCustomText && 'texto adicional'}
          </p>
        )}
      </div>

      {/* Resultados de búsqueda con scroll */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {internetSearch.results.map((result) => (
          <Card
            key={result.id}
            className={cn(
              "border transition-all cursor-pointer",
              result.selected
                ? "bg-purple-500/10 border-purple-500/50"
                : "bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] hover:border-purple-500/30"
            )}
            onClick={() => onToggleResult(result.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={result.selected}
                  onCheckedChange={() => onToggleResult(result.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <CardTitle className="text-lg text-[var(--theme-text-primary)] flex items-center gap-2">
                    {result.title}
                    {result.url && (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-[var(--theme-text-secondary)] text-sm leading-relaxed">
                {result.summary}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Texto alternativo */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--theme-text-secondary)]">
          O introduce un texto alternativo (opcional)
        </label>
        <Textarea
          value={internetSearch.customText || ''}
          onChange={(e) => onUpdateCustomText(e.target.value)}
          placeholder="Escribe aquí información adicional que quieras incluir en el contexto..."
          className={cn(
            'min-h-[120px] bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] text-[var(--theme-text-primary)]',
            'placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500',
            'focus-visible:border-purple-500 resize-y'
          )}
        />
        <p className="text-xs text-[var(--theme-text-tertiary)]">
          Puedes combinar resultados seleccionados con tu propio texto
        </p>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-center gap-4 pt-4">
        <Button
          onClick={onApplyResults}
          disabled={!hasSelection}
          className="h-12 bg-purple-600 hover:bg-purple-700 text-white text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="mr-2 h-5 w-5" />
          Guardar selección
        </Button>
        <Button
          onClick={onSkip}
          variant="outline"
          className="h-12 border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-tertiary)]"
        >
          <X className="mr-2 h-5 w-5" />
          Continuar sin incluir
        </Button>
      </div>
    </div>
  )
}
