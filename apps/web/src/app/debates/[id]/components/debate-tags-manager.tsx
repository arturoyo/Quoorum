/**
 * DebateTagsManager Component
 *
 * Allows users to add, remove, and manage tags for a debate.
 */

'use client'

import React from 'react'
import { Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DebateTagsManagerProps {
  debateId: string
  currentTags: string[]
  onTagsUpdated?: (tags: string[]) => void
  className?: string
}

export function DebateTagsManager({
  debateId,
  currentTags = [],
  onTagsUpdated,
  className,
}: DebateTagsManagerProps) {
  if (currentTags.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        {currentTags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs flex items-center gap-1 group"
          >
            <Tag className="h-3 w-3" />
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  )
}
