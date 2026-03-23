/**
 * DebateMessages Component
 *
 * Displays the messages from experts during the debate.
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ProcessedMessage } from '../types'

interface DebateMessagesProps {
  messages: ProcessedMessage[]
  expertColors: Record<string, string>
}

export function DebateMessages({ messages, expertColors }: DebateMessagesProps) {
  if (messages.length === 0) {
    return null
  }

  return (
    <>
      {messages.map((msg) => {
        const expertName = msg.expert || msg.agentKey || 'Moderador'
        const color = msg.role === 'moderator'
          ? 'bg-purple-600'
          : expertColors[expertName] || 'bg-slate-600'

        return (
          <div key={msg.messageId} className="flex gap-3">
            {/* Avatar */}
            <div
              className={cn(
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
                color
              )}
            >
              {expertName[0]?.toUpperCase()}
            </div>

            {/* Message Bubble */}
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-medium text-white">{expertName}</span>
                {msg.role === 'moderator' && (
                  <Badge className="bg-purple-600/20 text-purple-400 text-xs">
                    Moderador
                  </Badge>
                )}
                <span className="text-xs text-[var(--theme-text-secondary)]">Ronda {msg.roundNumber}</span>
              </div>
              <div className="rounded-lg bg-slate-900/60 backdrop-blur-xl p-3 text-sm text-white">
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}
