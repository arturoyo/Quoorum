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
      <MessageSquarePlus className="h-16 w-16 text-[#aebac1] mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">
        {hasSearch ? 'No se encontraron debates' : 'No hay debates'}
      </h3>
      <p className="text-sm text-[#aebac1] mb-6 max-w-sm">
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
    <div className="flex h-full flex-col items-center justify-center bg-[#0b141a] p-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#202c33]">
        <MessageSquarePlus className="h-10 w-10 text-[#aebac1]" />
      </div>
      <h3 className="text-xl font-medium text-white mb-2">
        Selecciona un debate
      </h3>
      <p className="text-sm text-[#aebac1] mb-6 max-w-md">
        Elige un debate de la lista o usa el botón "Nuevo Debate" del header para crear uno
      </p>
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
        <div key={i} className="border-b border-[#2a3942] p-4">
          <div className="h-4 w-3/4 bg-[#2a3942] rounded mb-2 animate-pulse" />
          <div className="h-3 w-1/2 bg-[#2a3942] rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}
