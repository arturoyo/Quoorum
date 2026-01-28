'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Loader2, Edit, Save, X } from 'lucide-react'

export interface SettingsCardProps {
  /** Card title */
  title: string
  /** Card description */
  description?: string
  /** Children content */
  children: React.ReactNode
  /** Whether in edit mode */
  isEditing?: boolean
  /** Whether currently saving */
  isSaving?: boolean
  /** Callback when edit button clicked */
  onEdit?: () => void
  /** Callback when save button clicked */
  onSave?: () => void
  /** Callback when cancel button clicked */
  onCancel?: () => void
  /** Show action buttons */
  showActions?: boolean
  /** Additional class names for card */
  className?: string
  /** Additional class names for content */
  contentClassName?: string
  /** Custom header actions (replaces default edit/save buttons) */
  headerActions?: React.ReactNode
  /** Icon to show in header */
  icon?: React.ReactNode
}

export function SettingsCard({
  title,
  description,
  children,
  isEditing = false,
  isSaving = false,
  onEdit,
  onSave,
  onCancel,
  showActions = true,
  className,
  contentClassName,
  headerActions,
  icon,
}: SettingsCardProps) {
  return (
    <Card className={cn('bg-[#111b21] border-[#2a3942]', className)}>
      <CardHeader className="bg-[#202c33] border-b border-[#2a3942]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <div className="text-purple-400">{icon}</div>}
            <div>
              <CardTitle className="text-[var(--theme-text-primary)]">{title}</CardTitle>
              {description && (
                <CardDescription className="text-[#aebac1]">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-2">
              {headerActions ? (
                headerActions
              ) : isEditing ? (
                <>
                  {onCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onCancel}
                      disabled={isSaving}
                      className="border-[#2a3942] text-[var(--theme-text-secondary)] hover:bg-[#2a3942]"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  )}
                  {onSave && (
                    <Button
                      size="sm"
                      onClick={onSave}
                      disabled={isSaving}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1" />
                          Guardar
                        </>
                      )}
                    </Button>
                  )}
                </>
              ) : onEdit ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="border-[#2a3942] text-[var(--theme-text-secondary)] hover:bg-[#2a3942]"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn('p-6', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}

// Simplified version without edit state
export function SimpleSettingsCard({
  title,
  description,
  children,
  className,
  contentClassName,
  icon,
  headerActions,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  contentClassName?: string
  icon?: React.ReactNode
  headerActions?: React.ReactNode
}) {
  return (
    <SettingsCard
      title={title}
      description={description}
      icon={icon}
      showActions={!!headerActions}
      headerActions={headerActions}
      className={className}
      contentClassName={contentClassName}
    >
      {children}
    </SettingsCard>
  )
}
