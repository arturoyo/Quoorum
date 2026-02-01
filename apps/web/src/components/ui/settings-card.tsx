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
import { cn, styles } from '@/lib/utils'
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
    <Card className={cn(styles.card.base, className)}>
      <CardHeader className={styles.card.header}>
        <div className={styles.layout.flexBetween}>
          <div className={styles.layout.flexRow}>
            {icon && <div className={styles.text.accent}>{icon}</div>}
            <div>
              <CardTitle className={styles.colors.text.primary}>{title}</CardTitle>
              {description && (
                <CardDescription className={styles.colors.text.secondary}>
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
                      className={cn(styles.colors.border.default, styles.colors.text.secondary, styles.hoverState())}
                    >
                      <X className={cn("h-4 w-4", styles.button.iconLeft)} />
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
                  className={cn(
                    styles.colors.border.default,
                    styles.colors.text.secondary,
                    'hover:bg-[var(--theme-bg-input)]'
                  )}
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
