'use client'

/**
 * ContextFileCard Component
 *
 * Displays a context file with toggle, edit, and delete actions.
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Edit, FileText, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ContextFile, formatFileSize } from '../types'

interface ContextFileCardProps {
  file: ContextFile
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
  isTogglingActive?: boolean
  isDeleting?: boolean
}

export function ContextFileCard({
  file,
  onEdit,
  onDelete,
  onToggleActive,
  isTogglingActive = false,
  isDeleting = false,
}: ContextFileCardProps) {
  return (
    <Card
      className={cn(
        'border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] backdrop-blur-xl hover:border-purple-500/30 transition-colors',
        !file.isActive && 'opacity-60'
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-[var(--theme-text-primary)] flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-400" />
              {file.name}
              {!file.isActive && (
                <Badge variant="outline" className="border-[var(--theme-border)] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-tertiary)]">
                  Inactivo
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-[var(--theme-text-secondary)] mt-1">
              {file.description || 'Sin descripción'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)]">
          <span>Tamaño: {formatFileSize(file.fileSize)}</span>
          {file.order !== null && file.order !== undefined && (
            <>
              <span>•</span>
              <span>Orden: {file.order}</span>
            </>
          )}
        </div>

        {file.tags && (
          <div className="flex flex-wrap gap-1">
            {file.tags.split(',').map((tag, i) => (
              <Badge key={i} variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10 text-xs">
                {tag.trim()}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-[var(--theme-border)]">
          <div className="flex items-center gap-2 flex-1">
            <Switch
              checked={file.isActive}
              onCheckedChange={onToggleActive}
              disabled={isTogglingActive}
            />
            <span className="text-sm text-[var(--theme-text-secondary)]">
              {file.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-input)]"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            className="border-red-500/40 text-red-300 hover:bg-red-500/20 hover:text-white hover:border-red-500/60 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
