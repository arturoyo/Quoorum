'use client'

/**
 * AppShell Component
 *
 * Global wrapper that provides:
 * - Fixed AppHeader at top (z-50)
 * - Fixed AppFooter at bottom (z-40)
 * - Proper padding to prevent content overlap
 * - Animated gradient background
 *
 * This is the ONLY place where AppHeader + AppFooter should be used together.
 * All pages/layouts should wrap their content in AppShell instead of manually
 * adding header/footer components.
 *
 * Usage:
 * <AppShell>
 *   <YourPageContent />
 * </AppShell>
 */

import { type ReactNode } from 'react'
import { cn, styles } from '@/lib/utils'
import { AppHeader } from './app-header'
import { AppFooter } from './app-footer'

interface AppShellProps {
  children: ReactNode
  className?: string
  showGradient?: boolean
  headerProps?: React.ComponentProps<typeof AppHeader>
}

export function AppShell({
  children,
  className,
  showGradient = true,
  headerProps = { variant: 'app' }
}: AppShellProps) {
  return (
    <div className={cn(
      'flex min-h-screen flex-col relative styles.colors.bg.primary',
      className
    )}>
      {/* Animated gradient background */}
      {showGradient && (
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
        </div>
      )}

      {/* Global Header (fixed, z-50) */}
      <AppHeader {...headerProps} />

      {/* Content Area with proper padding for fixed header/footer */}
      <main className={cn(
        'flex flex-1 pt-16 pb-16 overflow-hidden'
      )}>
        {children}
      </main>

      {/* Global Footer (fixed, z-40) */}
      <AppFooter />
    </div>
  )
}
