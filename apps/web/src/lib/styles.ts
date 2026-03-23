import { type ClassValue } from 'clsx'
import { cn } from './utils'

/**
 * 🎨 QUOORUM DESIGN SYSTEM - Style Utilities
 * Centralized, reusable style presets following DESIGN-SYSTEM.md
 * 
 * Usage:
 * import { styles } from '@/lib/styles'
 * <div className={styles.card.base}>
 */

/* ═══════════════════════════════════════════════════════════════════════
   🎨 THEME COLORS - CSS Variables (use these instead of hardcoded hex)
   ═══════════════════════════════════════════════════════════════════════ */

export const colors = {
  // Backgrounds
  bg: {
    primary: 'bg-[var(--theme-bg-primary)]',       // #0b141a
    secondary: 'bg-[var(--theme-bg-secondary)]',   // #111b21
    tertiary: 'bg-[var(--theme-bg-tertiary)]',     // #202c33
    input: 'bg-[var(--theme-bg-input)]',           // #2a3942
  },
  
  // Text colors
  text: {
    primary: 'text-[var(--theme-text-primary)]',       // #ffffff
    secondary: 'text-[var(--theme-text-secondary)]',   // #aebac1
    tertiary: 'text-[var(--theme-text-tertiary)]',     // #8696a0
    muted: 'text-[var(--theme-text-muted)]',           // #64748b
    inverted: 'text-[var(--theme-text-inverted)]',     // Inverted text
  },
  
  // Borders
  border: {
    default: 'border-[var(--theme-border)]',           // #2a3942
    subtle: 'border-[var(--theme-border-subtle)]',     // purple/20
    active: 'border-[var(--theme-border-active)]',     // purple/40
  },
  
  // Accent colors
  accent: {
    primary: 'bg-purple-600 text-white',               // Primary action
    secondary: 'bg-cyan-600 text-white',               // Secondary action
    success: 'bg-green-500 text-white',                // Success states
    warning: 'bg-orange-500 text-white',               // Warnings
    error: 'bg-red-500 text-white',                    // Errors
  },

  // Brand accent (Quoorum green)
  brand: {
    text: 'text-[#00a884]',
    bg: 'bg-[#00a884]',
    bgSoft: 'bg-[#00a884]/20',
    bgSubtle: 'bg-[#00a884]/10',
    border: 'border-[#00a884]/30',
  },
} as const

/* ═══════════════════════════════════════════════════════════════════════
   🎴 CARDS & PANELS - Reusable card styles
   ═══════════════════════════════════════════════════════════════════════ */

export const card = {
  // Base card (most common) - p-6, rounded-lg, border
  base: cn(
    colors.bg.secondary,
    colors.border.default,
    'border rounded-lg p-6'
  ),
  
  // Compact card - p-4
  compact: cn(
    colors.bg.secondary,
    colors.border.default,
    'border rounded-lg p-4'
  ),
  
  // Spacious card - p-8
  spacious: cn(
    colors.bg.secondary,
    colors.border.default,
    'border rounded-lg p-8'
  ),
  
  // Hoverable card (clickable)
  hoverable: cn(
    colors.bg.secondary,
    colors.border.default,
    'border rounded-lg p-6',
    'hover:bg-[var(--theme-bg-tertiary)]',
    'hover:border-[var(--theme-border-active)]',
    'transition-colors cursor-pointer'
  ),
  
  // Card header (for inside cards)
  header: cn(
    colors.bg.tertiary,
    colors.border.default,
    'border-b p-4'
  ),
} as const

/* ═══════════════════════════════════════════════════════════════════════
   📦 INPUTS - Form input styles
   ═══════════════════════════════════════════════════════════════════════ */

export const input = {
  // Standard input
  base: cn(
    colors.bg.input,
    colors.border.default,
    colors.text.primary,
    'border rounded-md px-4 py-2 h-10',
    'placeholder:text-[var(--theme-text-tertiary)]',
    'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20',
    'transition-colors'
  ),
  
  // Textarea
  textarea: cn(
    colors.bg.input,
    colors.border.default,
    colors.text.primary,
    'border rounded-md px-4 py-3 min-h-[100px]',
    'placeholder:text-[var(--theme-text-tertiary)]',
    'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20',
    'transition-colors resize-none'
  ),
  
  // Select trigger
  select: cn(
    colors.bg.input,
    colors.border.default,
    colors.text.primary,
    'border rounded-md px-4 h-10',
    'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20',
    'transition-colors'
  ),
} as const

/* ═══════════════════════════════════════════════════════════════════════
   🪟 MODALS & DIALOGS - Modal/Dialog styles
   ═══════════════════════════════════════════════════════════════════════ */

export const modal = {
  // Modal content container
  content: cn(
    colors.bg.secondary,
    colors.border.default,
    'border rounded-lg shadow-2xl'
  ),
  
  // Modal header
  header: cn(
    colors.bg.tertiary,
    colors.border.default,
    'border-b p-6'
  ),
  
  // Modal body
  body: 'p-6 space-y-6',
  
  // Modal footer
  footer: cn(
    colors.border.default,
    'border-t p-6 flex gap-3 justify-end'
  ),
  
  // Common sizes
  sizes: {
    sm: 'sm:max-w-[425px]',
    md: 'sm:max-w-[600px]',  // Most common
    lg: 'sm:max-w-[800px]',
    xl: 'sm:max-w-[1000px]',
  },
} as const

/* ═══════════════════════════════════════════════════════════════════════
   🔘 BUTTONS - Button variant styles (complement shadcn)
   ═══════════════════════════════════════════════════════════════════════ */

export const button = {
  // Standard sizes
  sizes: {
    sm: 'h-8 px-3 text-xs',
    default: 'h-10 px-6',
    lg: 'h-12 px-8 text-base',
    icon: 'h-10 w-10',
  },
  
  // Icon positioning
  iconLeft: 'mr-2 w-4 h-4',
  iconRight: 'ml-2 w-4 h-4',
} as const

/* ═══════════════════════════════════════════════════════════════════════
   📐 LAYOUT - Common layout patterns
   ═══════════════════════════════════════════════════════════════════════ */

export const layout = {
  // Page container
  container: 'container mx-auto px-4 max-w-7xl',
  
  // Section spacing
  section: 'space-y-6',
  sectionLarge: 'space-y-8',
  
  // Flex patterns
  flexRow: 'flex items-center gap-3',
  flexCol: 'flex flex-col gap-4',
  flexBetween: 'flex items-center justify-between',
  
  // Grid patterns
  grid2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  grid3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  grid4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
} as const

/* ═══════════════════════════════════════════════════════════════════════
   🎭 EFFECTS - Visual effects (shadows, transitions, etc)
   ═══════════════════════════════════════════════════════════════════════ */

export const effects = {
  // Shadows
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-2xl',
  },
  
  // Transitions
  transition: {
    colors: 'transition-colors duration-200',
    all: 'transition-all duration-300 ease-in-out',
    transform: 'transition-transform duration-200',
  },
  
  // Hover states
  hover: {
    scale: 'hover:scale-105 transition-transform',
    opacity: 'hover:opacity-80 transition-opacity',
    lift: 'hover:-translate-y-1 transition-transform',
  },
  
  // Blur/Glass effects
  glass: 'backdrop-blur-md bg-white/10 border border-white/20',
  blur: 'backdrop-blur-md',
} as const

/* ═══════════════════════════════════════════════════════════════════════
   📝 TYPOGRAPHY - Text styles
   ═══════════════════════════════════════════════════════════════════════ */

export const text = {
  // Headings
  h1: cn(colors.text.primary, 'text-3xl font-bold'),
  h2: cn(colors.text.primary, 'text-2xl font-semibold'),
  h3: cn(colors.text.primary, 'text-xl font-semibold'),
  h4: cn(colors.text.primary, 'text-lg font-medium'),
  
  // Body text
  body: cn(colors.text.primary, 'text-base'),
  bodySecondary: cn(colors.text.secondary, 'text-sm'),
  small: cn(colors.text.tertiary, 'text-xs'),
  
  // Special
  muted: cn(colors.text.muted, 'text-sm'),
  accent: 'text-purple-400 font-medium',
  gradient: 'bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent',
} as const

/* ═══════════════════════════════════════════════════════════════════════
   🎯 BADGES & PILLS - Status indicators
   ═══════════════════════════════════════════════════════════════════════ */

export const badge = {
  // Base badge
  base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
  
  // Variants
  primary: cn(
    'bg-purple-500/20 text-purple-400 border-purple-500/30'
  ),
  success: cn(
    'bg-green-500/20 text-green-400 border-green-500/30'
  ),
  warning: cn(
    'bg-orange-500/20 text-orange-400 border-orange-500/30'
  ),
  error: cn(
    'bg-red-500/20 text-red-400 border-red-500/30'
  ),
  info: cn(
    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  ),
} as const

/* ═══════════════════════════════════════════════════════════════════════
   🔍 UTILITY FUNCTIONS - Helper functions for dynamic styles
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Creates a focus ring with purple accent
 */
export function focusRing(...classes: ClassValue[]) {
  return cn(
    'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
    'focus:ring-offset-[var(--theme-bg-primary)]',
    classes
  )
}

/**
 * Creates hover state for interactive elements
 */
export function hoverState(...classes: ClassValue[]) {
  return cn(
    'hover:bg-[var(--theme-bg-tertiary)]',
    'hover:border-[var(--theme-border-active)]',
    'transition-colors cursor-pointer',
    classes
  )
}

/**
 * Creates a card with all standard features
 */
export function createCard(options?: {
  padding?: 'compact' | 'default' | 'spacious'
  hoverable?: boolean
  className?: ClassValue
}) {
  const { padding = 'default', hoverable = false, className } = options || {}
  
  const baseStyles = cn(
    colors.bg.secondary,
    colors.border.default,
    'border rounded-lg',
    {
      'p-4': padding === 'compact',
      'p-6': padding === 'default',
      'p-8': padding === 'spacious',
    },
    hoverable && [
      'hover:bg-[var(--theme-bg-tertiary)]',
      'hover:border-[var(--theme-border-active)]',
      'transition-colors cursor-pointer'
    ],
    className
  )
  
  return baseStyles
}

/**
 * Creates consistent select/dropdown content styles
 */
export function selectContent(...classes: ClassValue[]) {
  return cn(
    colors.bg.secondary,
    colors.border.default,
    'border rounded-md shadow-lg',
    classes
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   📦 EXPORTS - All-in-one export
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Main styles object - import and use directly
 * 
 * @example
 * import { styles } from '@/lib/styles'
 * <Card className={styles.card.base}>
 * <h2 className={styles.text.h2}>Title</h2>
 */
export const styles = {
  colors,
  card,
  input,
  modal,
  button,
  layout,
  effects,
  text,
  badge,
  // Utility functions
  focusRing,
  hoverState,
  createCard,
  selectContent,
} as const

// Default export
export default styles
