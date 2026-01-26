'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CTASectionProps {
  children: ReactNode
  className?: string
}

/**
 * CTA Section Component
 *
 * Full-width call-to-action section with gradient background and blur effects.
 * Used at the bottom of landing pages to drive conversions.
 */
export function CTASection({ children, className }: CTASectionProps) {
  return (
    <section className={cn('py-32 px-4', className)}>
      <div className="container mx-auto">
        <div className="relative max-w-4xl mx-auto text-center p-16 rounded-[3rem] overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-cyan-600/20 backdrop-blur-xl" />

          {/* Border */}
          <div className="absolute inset-0 border border-[var(--theme-landing-border)] rounded-[3rem]" />

          {/* Blur effects */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/30 rounded-full blur-[100px]" />

          {/* Content */}
          <div className="relative z-10">{children}</div>
        </div>
      </div>
    </section>
  )
}
