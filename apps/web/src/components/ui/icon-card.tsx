'use client'

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface IconCardProps {
  icon: LucideIcon
  title: string
  description: string
  gradient?: string
  className?: string
}

/**
 * Icon Card Component
 *
 * Reusable card with icon, title, and description.
 * Used for feature grids, value propositions, and contact methods.
 */
export function IconCard({
  icon: Icon,
  title,
  description,
  gradient = 'from-purple-500 to-cyan-500',
  className,
}: IconCardProps) {
  return (
    <div
      className={cn(
        'group relative p-8 rounded-3xl bg-[var(--theme-landing-card)] border border-[var(--theme-landing-border)] hover:border-[var(--theme-landing-border-hover)] transition-all duration-500 backdrop-blur-xl overflow-hidden',
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity',
          gradient
        )}
      />
      <div className="relative z-10">
        <div
          className={cn(
            'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform',
            gradient
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--theme-text-primary)] mb-1 group-hover:text-[var(--theme-text-primary)] transition-colors">
          {title}
        </h3>
        <p className="text-[var(--theme-text-secondary)] text-sm">
          {description}
        </p>
      </div>
    </div>
  )
}
