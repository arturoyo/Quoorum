'use client'

import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureListProps {
  features: string[]
  className?: string
  iconColor?: string
}

/**
 * Feature List Component
 *
 * Reusable list of features with checkmark icons.
 * Used in pricing cards and feature comparisons.
 */
export function FeatureList({
  features,
  className,
  iconColor = 'text-purple-400',
}: FeatureListProps) {
  return (
    <ul className={cn('space-y-4', className)}>
      {features.map((feature) => (
        <li
          key={feature}
          className="flex items-center gap-3 text-[var(--theme-text-secondary)]"
        >
          <CheckCircle className={cn('w-5 h-5 shrink-0', iconColor)} />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  )
}
