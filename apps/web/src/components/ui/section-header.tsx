'use client'

import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  gradientText?: string
  subtitle?: string
  className?: string
  align?: 'left' | 'center'
}

/**
 * Section Header Component
 *
 * Reusable header for landing page sections.
 * Includes title with optional gradient text and subtitle.
 */
export function SectionHeader({
  title,
  gradientText,
  subtitle,
  className,
  align = 'center',
}: SectionHeaderProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center mx-auto',
  }

  return (
    <div className={cn('mb-20', alignClasses[align], className)}>
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--theme-text-primary)] mb-6 tracking-tight">
        {title}
        {gradientText && (
          <>
            {' '}
            <span className="bg-gradient-to-r from-[var(--theme-gradient-text-from)] to-[var(--theme-gradient-text-to)] bg-clip-text text-transparent">
              {gradientText}
            </span>
          </>
        )}
      </h2>
      {subtitle && (
        <p
          className={cn(
            'text-xl text-[var(--theme-text-secondary)]',
            align === 'center' && 'max-w-2xl mx-auto'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
