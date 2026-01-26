'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  gradient?: string
  hoverEffect?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

/**
 * Glass Card Component
 *
 * Reusable card with glassmorphism effect and optional gradient hover.
 * Used for feature cards, testimonials, and content containers on landing pages.
 */
export function GlassCard({
  children,
  className,
  gradient = 'from-purple-500 to-cyan-500',
  hoverEffect = true,
  padding = 'lg',
}: GlassCardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={cn(
        'group relative rounded-3xl bg-[var(--theme-landing-card)] border border-[var(--theme-landing-border)] backdrop-blur-xl overflow-hidden transition-all duration-500',
        hoverEffect && 'hover:border-[var(--theme-landing-border-hover)]',
        paddingClasses[padding],
        className
      )}
    >
      {hoverEffect && (
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity',
            gradient
          )}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
