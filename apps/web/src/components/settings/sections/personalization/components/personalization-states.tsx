'use client'

/**
 * Personalization State Components
 *
 * Loading and empty states for the personalization section.
 */

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Loader2, Plus } from 'lucide-react'

// ═══════════════════════════════════════════════════════════
// LOADING STATE
// ═══════════════════════════════════════════════════════════

export function PersonalizationLoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// EMPTY CONTEXT FILES STATE
// ═══════════════════════════════════════════════════════════

interface EmptyContextFilesStateProps {
  onCreateClick: () => void
}

export function EmptyContextFilesState({ onCreateClick }: EmptyContextFilesStateProps) {
  return (
    <Card className="border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] backdrop-blur-xl">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <FileText className="h-12 w-12 text-[var(--theme-text-tertiary)] mb-4" />
        <p className="text-[var(--theme-text-secondary)] mb-2">No tienes archivos de contexto aún</p>
        <p className="text-sm text-[var(--theme-text-tertiary)] mb-4">
          Crea tu primer archivo de contexto para incluir información relevante en tus debates
        </p>
        <Button
          onClick={onCreateClick}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Crear Primer Archivo
        </Button>
      </CardContent>
    </Card>
  )
}
