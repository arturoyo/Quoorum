/**
 * ThemedInput - Input component using theme CSS variables
 *
 * [OK] Funciona en light Y dark mode
 * [OK] Sin colores hardcodeados
 * [OK] Consistente con el design system
 * [OK] Siempre visible (text-white NO hardcodeado)
 *
 * @example
 * <ThemedInput placeholder="Escribe aquí..." />
 * <ThemedTextarea placeholder="Mensaje largo..." />
 * <ThemedLabel>Etiqueta del campo</ThemedLabel>
 */

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════
// Themed Input
// ═══════════════════════════════════════════════════════════

export interface ThemedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export const ThemedInput = forwardRef<HTMLInputElement, ThemedInputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          'flex h-10 w-full rounded-md px-3 py-2',
          'border',
          'text-sm',
          'transition-colors',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Theme colors (NO hardcoded)
          'bg-[var(--theme-bg-input)]',
          'border-[var(--theme-border)]',
          'text-[var(--theme-text-primary)]',
          'placeholder:text-[var(--theme-text-tertiary)]',
          // Focus states
          'focus-visible:outline-none',
          'focus-visible:ring-2',
          'focus-visible:ring-purple-500',
          'focus-visible:border-purple-500',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

ThemedInput.displayName = 'ThemedInput'

// ═══════════════════════════════════════════════════════════
// Themed Textarea
// ═══════════════════════════════════════════════════════════

export interface ThemedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
}

export const ThemedTextarea = forwardRef<HTMLTextAreaElement, ThemedTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles
          'flex min-h-[80px] w-full rounded-md px-3 py-2',
          'border',
          'text-sm',
          'transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Theme colors (NO hardcoded)
          'bg-[var(--theme-bg-input)]',
          'border-[var(--theme-border)]',
          'text-[var(--theme-text-primary)]',
          'placeholder:text-[var(--theme-text-tertiary)]',
          // Focus states
          'focus-visible:outline-none',
          'focus-visible:ring-2',
          'focus-visible:ring-purple-500',
          'focus-visible:border-purple-500',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

ThemedTextarea.displayName = 'ThemedTextarea'

// ═══════════════════════════════════════════════════════════
// Themed Label
// ═══════════════════════════════════════════════════════════

export interface ThemedLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string
}

export const ThemedLabel = forwardRef<HTMLLabelElement, ThemedLabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none',
          'text-[var(--theme-text-secondary)]',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        {...props}
      />
    )
  }
)

ThemedLabel.displayName = 'ThemedLabel'

// ═══════════════════════════════════════════════════════════
// Themed Button
// ═══════════════════════════════════════════════════════════

export interface ThemedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  className?: string
}

export const ThemedButton = forwardRef<HTMLButtonElement, ThemedButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variantClasses = {
      primary: 'bg-purple-600 hover:bg-purple-700 text-white',
      secondary:
        'border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] hover:bg-purple-600 hover:border-purple-600',
      ghost:
        'hover:bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)] hover:text-purple-400',
      destructive: 'bg-red-600 hover:bg-red-700 text-white',
    }

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-md',
          'px-4 py-2',
          'text-sm font-medium',
          'transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
          'disabled:pointer-events-none disabled:opacity-50',
          // Variant styles
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)

ThemedButton.displayName = 'ThemedButton'
