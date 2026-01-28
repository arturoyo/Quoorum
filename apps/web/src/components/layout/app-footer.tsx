'use client'

import Link from 'next/link'
import { HelpCircle, FileText, Shield, BookOpen, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeDropdown } from '@/components/theme/theme-toggle'

interface AppFooterProps {
  className?: string
}

/**
 * App Footer Component
 * 
 * Minimalist footer for authenticated dashboard pages.
 * Focused on useful links for logged-in users.
 * Always positioned at the bottom of the screen.
 */
export function AppFooter({ className }: AppFooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className={cn(
        'border-t border-[var(--theme-border)] bg-[var(--theme-bg-primary)]/95 backdrop-blur-sm',
        'fixed bottom-0 left-0 right-0 z-40', // Always at bottom, below PhaseIndicator (z-50)
        className
      )}
    >
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Left: Links - Only icons on small screens, icons + text on larger */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-xs sm:text-sm">
            {/* Theme Toggle */}
            <ThemeDropdown />
            <Link
              href="/soporte"
              className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors flex items-center gap-1"
              title="Soporte"
            >
              <HelpCircle className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Soporte</span>
            </Link>
            <Link
              href="/docs"
              className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors flex items-center gap-1"
              title="Documentacion"
            >
              <BookOpen className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Documentacion</span>
            </Link>
            <Link
              href="/privacy"
              className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors flex items-center gap-1"
              title="Privacidad"
            >
              <Shield className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Privacidad</span>
            </Link>
            <Link
              href="/terms"
              className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors flex items-center gap-1"
              title="Terminos"
            >
              <FileText className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Terminos</span>
            </Link>
          </div>

          {/* Right: Copyright */}
          <div className="text-xs text-[var(--theme-text-tertiary)] hidden sm:block">
            <p>
              &copy; {currentYear} Quoorum. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
