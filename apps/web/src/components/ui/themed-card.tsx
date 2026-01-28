/**
 * ThemedCard - Card component using theme CSS variables
 *
 * [OK] Funciona en light Y dark mode
 * [OK] Sin colores hardcodeados
 * [OK] Consistente con el design system
 *
 * @example
 * <ThemedCard>
 *   <ThemedCard.Header>
 *     <ThemedCard.Title>Título</ThemedCard.Title>
 *     <ThemedCard.Description>Descripción</ThemedCard.Description>
 *   </ThemedCard.Header>
 *   <ThemedCard.Content>
 *     Contenido
 *   </ThemedCard.Content>
 * </ThemedCard>
 */

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════
// Main Card Component
// ═══════════════════════════════════════════════════════════

interface ThemedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'landing' | 'glass'
  className?: string
}

export const ThemedCard = forwardRef<HTMLDivElement, ThemedCardProps>(
  ({ children, variant = 'default', className, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]',
      landing: 'bg-[var(--theme-landing-card)] border-[var(--theme-landing-border)]',
      glass:
        'bg-[var(--theme-landing-glass)] backdrop-blur-sm border-[var(--theme-landing-glass-border)]',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border shadow-sm transition-colors',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ThemedCard.displayName = 'ThemedCard'

// ═══════════════════════════════════════════════════════════
// Card Header
// ═══════════════════════════════════════════════════════════

interface ThemedCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

const ThemedCardHeader = forwardRef<HTMLDivElement, ThemedCardHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5 p-6',
          'bg-[var(--theme-bg-tertiary)] rounded-t-lg',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ThemedCardHeader.displayName = 'ThemedCard.Header'

// ═══════════════════════════════════════════════════════════
// Card Title
// ═══════════════════════════════════════════════════════════

interface ThemedCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
  className?: string
}

const ThemedCardTitle = forwardRef<HTMLHeadingElement, ThemedCardTitleProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          'text-lg font-semibold leading-none tracking-tight',
          'text-[var(--theme-text-primary)]',
          className
        )}
        {...props}
      >
        {children}
      </h3>
    )
  }
)

ThemedCardTitle.displayName = 'ThemedCard.Title'

// ═══════════════════════════════════════════════════════════
// Card Description
// ═══════════════════════════════════════════════════════════

interface ThemedCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
  className?: string
}

const ThemedCardDescription = forwardRef<HTMLParagraphElement, ThemedCardDescriptionProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-[var(--theme-text-secondary)]', className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)

ThemedCardDescription.displayName = 'ThemedCard.Description'

// ═══════════════════════════════════════════════════════════
// Card Content
// ═══════════════════════════════════════════════════════════

interface ThemedCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

const ThemedCardContent = forwardRef<HTMLDivElement, ThemedCardContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('p-6 pt-0', className)} {...props}>
        {children}
      </div>
    )
  }
)

ThemedCardContent.displayName = 'ThemedCard.Content'

// ═══════════════════════════════════════════════════════════
// Card Footer
// ═══════════════════════════════════════════════════════════

interface ThemedCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

const ThemedCardFooter = forwardRef<HTMLDivElement, ThemedCardFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props}>
        {children}
      </div>
    )
  }
)

ThemedCardFooter.displayName = 'ThemedCard.Footer'

// ═══════════════════════════════════════════════════════════
// Attach subcomponents to main component
// ═══════════════════════════════════════════════════════════

ThemedCard.Header = ThemedCardHeader
ThemedCard.Title = ThemedCardTitle
ThemedCard.Description = ThemedCardDescription
ThemedCard.Content = ThemedCardContent
ThemedCard.Footer = ThemedCardFooter
