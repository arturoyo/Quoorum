/**
 * DebateListIconOnly Component
 *
 * Shows only the icon when the sidebar is collapsed.
 */

import { cn } from '@/lib/utils'
import { getContextualIcon } from '@/lib/icons/contextual-icons'

interface DebateListIconOnlyProps {
  debate: {
    id: string
    question: string
    metadata?: { 
      title?: string
      tags?: string[]
      topics?: string[]
      areas?: string[]
    } | null
  }
  isSelected: boolean
  onClick: () => void
}

export function DebateListIconOnly({
  debate,
  isSelected,
  onClick,
}: DebateListIconOnlyProps) {
  const ContextualIcon = getContextualIcon(
    debate.question,
    debate.id,
    debate.metadata?.tags,
    debate.metadata?.topics,
    debate.metadata?.areas
  )

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative w-full border-b border-[#2a3942] p-4 transition-all cursor-pointer group',
        isSelected
          ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-l-4 border-l-purple-500 shadow-lg shadow-purple-500/10'
          : 'hover:bg-[#2a3942]'
      )}
      title={debate.metadata?.title || debate.question}
    >
      {/* Icon in the same exact position as when expanded */}
      <div
        className="absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transition-all cursor-pointer"
      >
        <ContextualIcon className={cn(
          'h-6 w-6',
          isSelected
            ? 'text-purple-400'
            : 'text-[#aebac1] group-hover:text-purple-400'
        )} />
      </div>
      {/* Invisible container to maintain same height as expanded */}
      <div className="pl-12 opacity-0 pointer-events-none" style={{ minHeight: '40px' }}>
        <div className="text-sm font-medium">Placeholder</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" />
          <span className="text-xs">Placeholder</span>
        </div>
      </div>
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-purple-500" />
      )}
    </div>
  )
}
