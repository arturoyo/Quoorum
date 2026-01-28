'use client'

import Link from 'next/link'
import { HelpCircle, FileText, Shield, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeDropdown } from '@/components/theme/theme-toggle'

interface AppFooterProps {
  className?: string
}

/**
 * App Footer Component
 *
 * Minimalist footer with centered icons that expand on hover.
 * Icons only by default, text appears on hover with smooth animation.
 * Always positioned at the bottom of the screen.
 */
export function AppFooter({ className }: AppFooterProps) {
  const currentYear = new Date().getFullYear()

  const links = [
    { href: '/soporte', icon: HelpCircle, label: 'Soporte' },
    { href: '/docs', icon: BookOpen, label: 'Docs' },
    { href: '/privacy', icon: Shield, label: 'Privacidad' },
    { href: '/terms', icon: FileText, label: 'Terminos' },
  ]

  return (
    <footer
      className={cn(
        'border-t border-[var(--theme-border)] bg-[var(--theme-bg-primary)]/95 backdrop-blur-sm',
        'fixed bottom-0 left-0 right-0 z-40',
        className
      )}
    >
      <div className="container mx-auto px-4 py-3">
        {/* Centered links with hover-expand effect */}
        <div className="flex items-center justify-center gap-1">
          {/* Theme Toggle */}
          <div className="mr-2">
            <ThemeDropdown />
          </div>

          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'group flex items-center gap-0 px-2 py-1.5 rounded-full',
                'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]',
                'hover:bg-[var(--theme-bg-secondary)] transition-all duration-300 ease-out'
              )}
              title={link.label}
            >
              <link.icon className="h-4 w-4 flex-shrink-0" />
              <span
                className={cn(
                  'max-w-0 overflow-hidden whitespace-nowrap',
                  'group-hover:max-w-[100px] group-hover:ml-1.5',
                  'transition-all duration-300 ease-out',
                  'text-xs font-medium'
                )}
              >
                {link.label}
              </span>
            </Link>
          ))}

          {/* Copyright - only on larger screens */}
          <div className="hidden sm:flex items-center ml-4 pl-4 border-l border-[var(--theme-border)]">
            <span className="text-xs text-[var(--theme-text-tertiary)]">
              &copy; {currentYear} Quoorum
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
