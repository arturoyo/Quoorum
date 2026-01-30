/**
 * DebateCommentsSection Component
 *
 * Collapsible comments section for completed debates.
 */

import { Button } from '@/components/ui/button'
import { MessageCircle, ChevronUp, ChevronDown } from 'lucide-react'
import { DebateComments } from '@/components/quoorum'

interface DebateCommentsSectionProps {
  debateId: string
  commentsCount?: number
  isExpanded: boolean
  onToggle: () => void
}

export function DebateCommentsSection({
  debateId,
  commentsCount,
  isExpanded,
  onToggle,
}: DebateCommentsSectionProps) {
  return (
    <div className="border-t border-white/10 bg-slate-900/60 backdrop-blur-xl">
      <div className="mx-auto max-w-4xl">
        {/* Header - Clickable */}
        <div
          className="flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
          onClick={onToggle}
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">
              Comentarios {commentsCount && commentsCount > 0 && `(${commentsCount})`}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Content - Collapsible */}
        {isExpanded && (
          <div className="border-t border-white/10 px-4 py-3">
            <DebateComments debateId={debateId} showHeader={false} />
          </div>
        )}
      </div>
    </div>
  )
}
