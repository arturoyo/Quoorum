'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  /** Page title */
  title: string
  /** Page description */
  description?: string
  /** Action buttons or other content */
  actions?: React.ReactNode
  /** Breadcrumb or back link */
  breadcrumb?: React.ReactNode
  /** Additional class names */
  className?: string
  /** Title size variant */
  size?: 'sm' | 'md' | 'lg'
}

const sizeStyles = {
  sm: {
    title: 'text-xl sm:text-2xl',
    description: 'text-sm',
  },
  md: {
    title: 'text-2xl sm:text-3xl',
    description: 'text-sm sm:text-base',
  },
  lg: {
    title: 'text-3xl sm:text-4xl',
    description: 'text-base sm:text-lg',
  },
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
  size = 'md',
}: PageHeaderProps) {
  const styles = sizeStyles[size]

  return (
    <div className={cn('mb-6', className)}>
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn('font-bold text-white', styles.title)}>{title}</h1>
          {description && (
            <p className={cn('text-[var(--theme-text-secondary)] mt-1', styles.description)}>
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

// Section header variant (smaller, for within-page sections)
export function SectionHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div>
        <h2 className="text-lg font-semibold text-[var(--theme-text-primary)]">{title}</h2>
        {description && (
          <p className="text-sm text-[var(--theme-text-secondary)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
