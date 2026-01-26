/**
 * ThemedText - Text components using theme CSS variables
 *
 * ✅ Funciona en light Y dark mode
 * ✅ Sin colores hardcodeados
 * ✅ Consistente con el design system
 *
 * @example
 * <ThemedText.Primary>Texto principal</ThemedText.Primary>
 * <ThemedText.Secondary>Texto secundario</ThemedText.Secondary>
 * <ThemedText.Tertiary>Texto terciario</ThemedText.Tertiary>
 * <ThemedText.Muted>Texto atenuado</ThemedText.Muted>
 */

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════
// Primary Text (Headings, Important Text)
// ═══════════════════════════════════════════════════════════

interface ThemedTextPrimaryProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  className?: string
}

const ThemedTextPrimary = forwardRef<HTMLElement, ThemedTextPrimaryProps>(
  ({ children, as: Component = 'p', className, ...props }, ref) => {
    return (
      <Component
        ref={ref as React.Ref<HTMLParagraphElement>}
        className={cn('text-[var(--theme-text-primary)]', className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

ThemedTextPrimary.displayName = 'ThemedText.Primary'

// ═══════════════════════════════════════════════════════════
// Secondary Text (Descriptions, Labels)
// ═══════════════════════════════════════════════════════════

interface ThemedTextSecondaryProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  as?: 'p' | 'span' | 'div' | 'label'
  className?: string
}

const ThemedTextSecondary = forwardRef<HTMLElement, ThemedTextSecondaryProps>(
  ({ children, as: Component = 'p', className, ...props }, ref) => {
    return (
      <Component
        ref={ref as React.Ref<HTMLParagraphElement>}
        className={cn('text-[var(--theme-text-secondary)]', className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

ThemedTextSecondary.displayName = 'ThemedText.Secondary'

// ═══════════════════════════════════════════════════════════
// Tertiary Text (Placeholders, Hints)
// ═══════════════════════════════════════════════════════════

interface ThemedTextTertiaryProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  as?: 'p' | 'span' | 'div'
  className?: string
}

const ThemedTextTertiary = forwardRef<HTMLElement, ThemedTextTertiaryProps>(
  ({ children, as: Component = 'p', className, ...props }, ref) => {
    return (
      <Component
        ref={ref as React.Ref<HTMLParagraphElement>}
        className={cn('text-[var(--theme-text-tertiary)]', className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

ThemedTextTertiary.displayName = 'ThemedText.Tertiary'

// ═══════════════════════════════════════════════════════════
// Muted Text (Very subtle text)
// ═══════════════════════════════════════════════════════════

interface ThemedTextMutedProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  as?: 'p' | 'span' | 'div'
  className?: string
}

const ThemedTextMuted = forwardRef<HTMLElement, ThemedTextMutedProps>(
  ({ children, as: Component = 'p', className, ...props }, ref) => {
    return (
      <Component
        ref={ref as React.Ref<HTMLParagraphElement>}
        className={cn('text-[var(--theme-text-muted)]', className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

ThemedTextMuted.displayName = 'ThemedText.Muted'

// ═══════════════════════════════════════════════════════════
// Export as namespace
// ═══════════════════════════════════════════════════════════

export const ThemedText = {
  Primary: ThemedTextPrimary,
  Secondary: ThemedTextSecondary,
  Tertiary: ThemedTextTertiary,
  Muted: ThemedTextMuted,
}
