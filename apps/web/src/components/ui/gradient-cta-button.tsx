'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface GradientCTAButtonProps {
  children: ReactNode
  className?: string
  showArrow?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  size?: 'default' | 'lg' | 'sm'
}

/**
 * Gradient CTA Button Component
 *
 * Reusable button with gradient background and glow hover effect.
 * Used for primary call-to-action buttons across landing pages.
 */
export function GradientCTAButton({
  children,
  className,
  showArrow = true,
  onClick,
  type = 'button',
  disabled = false,
  size = 'default',
}: GradientCTAButtonProps) {
  const sizeClasses = {
    sm: 'h-10 px-4 text-sm',
    default: 'h-14 px-8 text-lg',
    lg: 'h-16 px-10 text-xl',
  }

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative group overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0',
        sizeClasses[size],
        className
      )}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {showArrow && (
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        )}
      </span>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
    </Button>
  )
}
