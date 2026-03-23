/**
 * Debate List State Components
 *
 * Empty states and loading skeletons for the debates list.
 */

import { MessageSquarePlus } from 'lucide-react'

// ═══════════════════════════════════════════════════════════
// EMPTY DEBATES STATE (Left Panel - No debates found)
// ═══════════════════════════════════════════════════════════

interface EmptyDebatesStateProps {
  hasSearch: boolean
}

export function EmptyDebatesState({ hasSearch }: EmptyDebatesStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <MessageSquarePlus className="h-16 w-16 styles.colors.text.secondary mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">
        {hasSearch ? 'No se encontraron debates' : 'No hay debates'}
      </h3>
      <p className="text-sm styles.colors.text.secondary mb-6 max-w-sm">
        {hasSearch
          ? 'Intenta con otros términos de búsqueda'
          : 'Crea tu primer debate usando el botón "Nuevo Debate" del header'}
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// EMPTY DEBATE STATE (Right Panel - No debate selected)
// ═══════════════════════════════════════════════════════════

export function EmptyDebateState() {
  return (
    <div className="flex flex-1 w-full flex-col items-center justify-center styles.colors.bg.primary text-center px-4">
      <div className="flex flex-col items-center justify-center gap-4 max-w-lg w-full">
        <div className="flex h-20 w-20 items-center justify-center rounded-full styles.colors.bg.tertiary">
          <MessageSquarePlus className="h-10 w-10 styles.colors.text.secondary" />
        </div>
        <h3 className="text-xl font-medium text-white">
          Selecciona un debate
        </h3>
        <p className="text-sm styles.colors.text.secondary">
          Elige un debate de la lista o usa el botón "Nuevo Debate" del header para crear uno
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════

export function DebateListSkeleton() {
  return (
    <div className="space-y-0">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border-b styles.colors.border.default p-4">
          <div className="h-4 w-3/4 styles.colors.bg.input rounded mb-2 animate-pulse" />
          <div className="h-3 w-1/2 styles.colors.bg.input rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}
