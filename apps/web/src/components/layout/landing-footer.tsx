'use client'

import Link from 'next/link'
import { QuoorumLogo } from '@/components/ui/quoorum-logo'

/**
 * Landing Footer Component
 *
 * Unified footer for all marketing/landing pages.
 * Uses CSS theme variables for consistency.
 * Includes logo, product links, company links, and legal links.
 */
export function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--theme-landing-border)] py-8 px-4 backdrop-blur-xl bg-[var(--theme-landing-social-bg)]">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-6">
          {/* Logo & Description */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <QuoorumLogo
                size={120}
                showGradient={true}
                className="transition-opacity group-hover:opacity-80"
              />
            </Link>
            <p className="styles.colors.text.tertiary text-sm leading-relaxed">
              Tu comité ejecutivo de IA para tomar mejores decisiones estratégicas.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="styles.colors.text.primary font-semibold mb-4">Producto</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/docs"
                  className="styles.colors.text.tertiary hover:styles.colors.text.primary text-sm transition-colors"
                >
                  Documentación
                </Link>
              </li>
              <li>
                <Link
                  href="/soporte"
                  className="styles.colors.text.tertiary hover:styles.colors.text.primary text-sm transition-colors"
                >
                  Soporte
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="styles.colors.text.primary font-semibold mb-6">Empresa</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="styles.colors.text.tertiary hover:styles.colors.text.primary text-sm transition-colors"
                >
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="styles.colors.text.tertiary hover:styles.colors.text.primary text-sm transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/soporte"
                  className="styles.colors.text.tertiary hover:styles.colors.text.primary text-sm transition-colors"
                >
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="styles.colors.text.primary font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="styles.colors.text.tertiary hover:styles.colors.text.primary text-sm transition-colors"
                >
                  Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="styles.colors.text.tertiary hover:styles.colors.text.primary text-sm transition-colors"
                >
                  Términos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[var(--theme-landing-border)] pt-4 text-center styles.colors.text.tertiary text-sm">
          <p>&copy; {currentYear} Quoorum. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
