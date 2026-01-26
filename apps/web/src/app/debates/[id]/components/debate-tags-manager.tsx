/**
 * DebateTagsManager Component
 *
 * Allows users to add, remove, and manage tags for a debate.
 */

'use client'

import React, { useState } from 'react'
import { Tag, X, Plus, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'
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
  const [isEditing, setIsEditing] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [tags, setTags] = useState<string[]>(currentTags)

  // Sincronizar tags cuando currentTags cambia (desde props)
  React.useEffect(() => {
    setTags(currentTags)
  }, [currentTags])

  const updateTagsMutation = api.debates.updateTags.useMutation({
    onSuccess: (updatedDebate) => {
      const updatedTags = (updatedDebate.metadata?.tags as string[]) || []
      setTags(updatedTags)
      onTagsUpdated?.(updatedTags)
      setIsEditing(false)
      setNewTag('')
      toast.success('Tags actualizados correctamente')
    },
    onError: (error) => {
      toast.error('Error al actualizar tags', {
        description: error.message,
      })
    },
  })

  const handleAddTag = () => {
    const trimmedTag = newTag.trim()
    if (!trimmedTag) return

    if (tags.includes(trimmedTag)) {
      toast.error('Este tag ya existe')
      setNewTag('')
      return
    }

    if (tags.length >= 20) {
      toast.error('Máximo 20 tags permitidos')
      return
    }

    const newTags = [...tags, trimmedTag]
    updateTagsMutation.mutate({
      id: debateId,
      tags: newTags,
    })
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove)
    updateTagsMutation.mutate({
      id: debateId,
      tags: newTags,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setNewTag('')
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        {tags.length > 0 && (
          <>
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs flex items-center gap-1 group"
              >
                <Tag className="h-3 w-3" />
                {tag}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-400 transition-colors"
                    disabled={updateTagsMutation.isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </>
        )}
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-6 px-2 text-xs text-[var(--theme-text-secondary)] hover:text-white border border-dashed border-gray-600 hover:border-purple-500/50"
          >
            <Plus className="h-3 w-3 mr-1" />
            Añadir tag
          </Button>
        )}
      </div>

      {isEditing && (
        <div className="flex items-center gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un tag..."
            className="h-8 text-sm bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500 focus-visible:border-purple-500"
            disabled={updateTagsMutation.isPending}
            autoFocus
          />
          <Button
            size="sm"
            onClick={handleAddTag}
            disabled={updateTagsMutation.isPending || !newTag.trim()}
            className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {updateTagsMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsEditing(false)
              setNewTag('')
            }}
            disabled={updateTagsMutation.isPending}
            className="h-8 px-3 text-[var(--theme-text-secondary)] hover:text-white"
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}
