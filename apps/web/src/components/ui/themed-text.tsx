/**
 * ThemedText - Text components using theme CSS variables
 *
 * [OK] Funciona en light Y dark mode
 * [OK] Sin colores hardcodeados
 * [OK] Consistente con el design system
 *
 * @example
 * <ThemedText.Primary>Texto principal</ThemedText.Primary>
 * <ThemedText.Secondary>Texto secundario</ThemedText.Secondary>
 * <ThemedText.Tertiary>Texto terciario</ThemedText.Tertiary>
 * <ThemedText.Muted>Texto atenuado</ThemedText.Muted>
 */

import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════
// Primary Text (Headings, Important Text)
// ═══════════════════════════════════════════════════════════

interface ThemedTextPrimaryProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  className?: string
}

const ThemedTextPrimary = ({ children, as: Component = 'p', className, ...props }: ThemedTextPrimaryProps) => (
  <Component className={cn('text-[var(--theme-text-primary)]', className)} {...props}>
    {children}
  </Component>
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

const ThemedTextSecondary = ({ children, as: Component = 'p', className, ...props }: ThemedTextSecondaryProps) => (
  <Component className={cn('text-[var(--theme-text-secondary)]', className)} {...props}>
    {children}
  </Component>
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

const ThemedTextTertiary = ({ children, as: Component = 'p', className, ...props }: ThemedTextTertiaryProps) => (
  <Component className={cn('text-[var(--theme-text-tertiary)]', className)} {...props}>
    {children}
  </Component>
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

const ThemedTextMuted = ({ children, as: Component = 'p', className, ...props }: ThemedTextMutedProps) => (
  <Component className={cn('text-[var(--theme-text-muted)]', className)} {...props}>
    {children}
  </Component>
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
