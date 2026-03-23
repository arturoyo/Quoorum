/**
 * DebateListItem Component
 *
 * Full debate list item with edit/delete functionality.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { cn, styles } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Sparkles } from 'lucide-react'
import { getContextualIcon } from '@/lib/icons/contextual-icons'

interface DebateListItemProps {
  debate: {
    id: string
    question: string
    status: string
    consensusScore?: number | null
    createdAt: Date
    metadata?: { 
      title?: string
      tags?: string[]
      topics?: string[]
      areas?: string[]
      scenarioId?: string
      scenarioName?: string
    } | null
  }
  isSelected: boolean
  isCheckboxSelected: boolean
  showCheckbox: boolean
  onClick: () => void
  onToggleSelect: (e: React.MouseEvent) => void
}

const statusColors = {
  draft: 'bg-yellow-500',
  pending: 'bg-yellow-500',
  in_progress: 'bg-yellow-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
}

const statusLabels = {
  draft: 'En progreso',
  pending: 'En progreso',
  in_progress: 'En progreso',
  completed: 'Completado',
  failed: 'Error',
}

export function DebateListItem({
  debate,
  isSelected,
  isCheckboxSelected,
  showCheckbox,
  onClick,
  onToggleSelect,
}: DebateListItemProps) {
  const router = useRouter()

  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(debate.metadata?.title || debate.question)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const utils = api.useUtils()

  const updateDebateMutation = api.debates.update.useMutation({
    onSuccess: () => {
      void utils.debates.list.invalidate()
      setIsEditing(false)
    },
  })

  const deleteDebateMutation = api.debates.delete.useMutation({
    onSuccess: (_, variables) => {
      void utils.debates.list.invalidate()
      if (isSelected && debate.id === variables.id) {
        router.push('/debates')
      }
    },
  })

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    deleteDebateMutation.mutate({ id: debate.id })
    setDeleteDialogOpen(false)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    updateDebateMutation.mutate({
      id: debate.id,
      metadata: {
        ...debate.metadata,
        title: editedTitle,
      },
    })
  }

  const handleCancel = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    setIsEditing(false)
    setEditedTitle(debate.metadata?.title || debate.question)
  }

  const ContextualIcon = getContextualIcon(
    debate.question,
    debate.id,
    debate.metadata?.tags,
    debate.metadata?.topics,
    debate.metadata?.areas
  )

  const displayTitle = debate.metadata?.title || debate.question
  const shortTitle = displayTitle.length > 120 ? `${displayTitle.slice(0, 120)}…` : displayTitle

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        'relative w-full border-b styles.colors.border.default p-4 transition-all cursor-pointer group min-h-20',
        isSelected
          ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-l-4 border-l-purple-500 shadow-lg shadow-purple-500/10'
          : 'hover:bg-[var(--theme-bg-input)]'
      )}
    >
      {/* Icon/Checkbox */}
      <div
        className="absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transition-all cursor-pointer"
        onClick={onToggleSelect}
      >
        {(isHovered || showCheckbox || isCheckboxSelected) ? (
          <Checkbox
            checked={isCheckboxSelected}
            className={cn(
              'h-6 w-6 border-2',
              'border-[var(--theme-text-secondary)]/60',
              'data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600',
              'hover:border-purple-500'
            )}
          />
        ) : (
          <ContextualIcon className="h-6 w-6 styles.colors.text.secondary" />
        )}
      </div>

      <div className="flex items-start justify-between gap-3 pl-12">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <form onSubmit={handleSave} className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className={cn(
                  'flex-1 text-sm px-2 py-1 rounded border focus:outline-none focus:ring-1 focus:ring-blue-500',
                  styles.colors.bg.tertiary,
                  styles.colors.text.primary,
                  'border-blue-500'
                )}
                aria-label="Editar título del debate"
                autoFocus
                onBlur={(e) => handleCancel(e as unknown as React.MouseEvent)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCancel(e)
                }}
              />
            </form>
          ) : (
            <h3 className={cn(
              'truncate text-sm font-medium',
              isSelected ? 'text-white font-semibold' : 'text-white'
            )}>
                {shortTitle}
            </h3>
          )}
            <div className="mt-1 flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', statusColors[debate.status as keyof typeof statusColors])} />
            <span className="text-xs styles.colors.text.secondary">
              {statusLabels[debate.status as keyof typeof statusLabels]}
            </span>
              {debate.metadata?.scenarioId && (
                <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-200 flex items-center gap-1 text-[11px]">
                  <Sparkles className="h-3 w-3" />
                  Escenario
                </Badge>
              )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isHovered && !isEditing && (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleEdit}
                className="p-1.5 rounded hover:bg-[#374047] styles.colors.text.secondary hover:text-blue-400 transition-colors"
                title="Editar nombre"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded hover:bg-[#374047] styles.colors.text.secondary hover:text-red-400 transition-colors"
                title="Eliminar debate"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <span className="text-xs styles.colors.text.secondary">
            {new Date(debate.createdAt).toLocaleString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="¿Eliminar debate?"
        description="Esta acción eliminará permanentemente este debate. No se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteDebateMutation.isPending}
      />
    </div>
  )
}
