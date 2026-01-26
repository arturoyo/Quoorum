'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  FileText,
  XCircle,
  Pause,
} from 'lucide-react'

export type StatusType =
  | 'draft'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'

export interface StatusBadgeProps {
  /** Status value */
  status: StatusType
  /** Whether to show icon */
  showIcon?: boolean
  /** Custom label (overrides default) */
  label?: string
  /** Badge size */
  size?: 'sm' | 'md'
  /** Additional class names */
  className?: string
}

const statusConfig: Record<
  StatusType,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
    className: string
    iconClassName?: string
  }
> = {
  draft: {
    label: 'Borrador',
    icon: FileText,
    className: 'bg-gray-500/20 text-[var(--theme-text-secondary)] border-gray-500/50',
  },
  pending: {
    label: 'Pendiente',
    icon: Clock,
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  },
  in_progress: {
    label: 'En progreso',
    icon: Loader2,
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    iconClassName: 'animate-spin',
  },
  completed: {
    label: 'Completado',
    icon: CheckCircle,
    className: 'bg-green-500/20 text-green-400 border-green-500/50',
  },
  failed: {
    label: 'Fallido',
    icon: AlertCircle,
    className: 'bg-red-500/20 text-red-400 border-red-500/50',
  },
  cancelled: {
    label: 'Cancelado',
    icon: XCircle,
    className: 'bg-gray-500/20 text-[var(--theme-text-secondary)] border-gray-500/50',
  },
  paused: {
    label: 'Pausado',
    icon: Pause,
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  },
}

export function StatusBadge({
  status,
  showIcon = true,
  label,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const displayLabel = label || config.label

  return (
    <Badge
      variant="outline"
      className={cn(
        config.className,
        size === 'sm' && 'text-xs px-1.5 py-0',
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            'mr-1',
            size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5',
            config.iconClassName
          )}
        />
      )}
      {displayLabel}
    </Badge>
  )
}

// Convenience function to get status config for custom implementations
export function getStatusConfig(status: StatusType) {
  return statusConfig[status]
}
