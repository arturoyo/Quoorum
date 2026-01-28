'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

export interface EmptyStateCardProps {
  /** Icon to display */
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  /** Title text */
  title: string
  /** Description text */
  description?: string
  /** Action button label */
  actionLabel?: string
  /** Action button callback */
  onAction?: () => void
  /** Visual variant */
  variant?: 'default' | 'info' | 'warning' | 'muted'
  /** Whether to show as a card or inline */
  inline?: boolean
  /** Additional class names */
  className?: string
  /** Icon size */
  iconSize?: 'sm' | 'md' | 'lg'
  /** Children for custom content */
  children?: React.ReactNode
}

const variantStyles = {
  default: {
    container: 'bg-[#111b21] border-[#2a3942]',
    icon: 'text-[var(--theme-text-secondary)]',
    title: 'text-white',
    description: 'text-[var(--theme-text-secondary)]',
  },
  info: {
    container: 'bg-blue-500/10 border-blue-500/20',
    icon: 'text-blue-400',
    title: 'text-blue-100',
    description: 'text-blue-200/70',
  },
  warning: {
    container: 'bg-amber-500/10 border-amber-500/20',
    icon: 'text-amber-400',
    title: 'text-amber-100',
    description: 'text-amber-200/70',
  },
  muted: {
    container: 'bg-white/5 border-[var(--theme-border)]',
    icon: 'text-[var(--theme-text-tertiary)]',
    title: 'text-[var(--theme-text-secondary)]',
    description: 'text-[var(--theme-text-tertiary)]',
  },
}

const iconSizes = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
}

export function EmptyStateCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
  inline = false,
  className,
  iconSize = 'md',
  children,
}: EmptyStateCardProps) {
  const styles = variantStyles[variant]

  const content = (
    <div className="flex flex-col items-center justify-center text-center p-8">
      {Icon && (
        <div className={cn('mb-4', styles.icon)}>
          <Icon className={iconSizes[iconSize]} />
        </div>
      )}

      <h3 className={cn('text-lg font-semibold mb-2', styles.title)}>
        {title}
      </h3>

      {description && (
        <p className={cn('text-sm max-w-md mb-4', styles.description)}>
          {description}
        </p>
      )}

      {children}

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )

  if (inline) {
    return <div className={className}>{content}</div>
  }

  return (
    <Card className={cn(styles.container, className)}>
      <CardContent className="p-0">
        {content}
      </CardContent>
    </Card>
  )
}

// Pre-configured variants for common use cases
export function EmptyDebatesList({
  onCreateDebate,
  className,
}: {
  onCreateDebate?: () => void
  className?: string
}) {
  return (
    <EmptyStateCard
      title="No hay debates aún"
      description="Crea tu primer debate para comenzar a explorar ideas con expertos IA"
      actionLabel={onCreateDebate ? "Crear Debate" : undefined}
      onAction={onCreateDebate}
      variant="muted"
      className={className}
    />
  )
}

export function EmptySearchResults({
  searchTerm,
  className,
}: {
  searchTerm?: string
  className?: string
}) {
  return (
    <EmptyStateCard
      title="Sin resultados"
      description={
        searchTerm
          ? `No se encontraron resultados para "${searchTerm}"`
          : "No se encontraron resultados para tu búsqueda"
      }
      variant="muted"
      className={className}
    />
  )
}

export function NoDataAvailable({
  title = "Sin datos disponibles",
  description,
  className,
}: {
  title?: string
  description?: string
  className?: string
}) {
  return (
    <EmptyStateCard
      title={title}
      description={description}
      variant="muted"
      className={className}
    />
  )
}
