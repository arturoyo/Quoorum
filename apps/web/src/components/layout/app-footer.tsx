'use client'

import Link from 'next/link'
import { HelpCircle, FileText, Shield, BookOpen, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Links */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <Link
              href="/soporte"
              className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Soporte
            </Link>
            <Link
              href="/docs"
              className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Documentación
            </Link>
            <Link
              href="/privacy"
              className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors flex items-center gap-1.5"
            >
              <Shield className="h-3.5 w-3.5" />
              Privacidad
            </Link>
            <Link
              href="/terms"
              className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors flex items-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              Términos
            </Link>
          </div>

          {/* Right: Copyright */}
          <div className="text-xs text-[var(--theme-text-tertiary)]">
            <p>
              &copy; {currentYear} Quoorum. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
