/**
 * Página 404 personalizada de Next.js 14
 * Se muestra cuando no se encuentra una ruta
 */

import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <Card className="w-full max-w-2xl border-gray-800 bg-gray-900/50 p-8 backdrop-blur">
        {/* 404 Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="text-center">
              <p className="text-8xl font-bold styles.colors.text.secondary">404</p>
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="h-12 w-12 styles.colors.text.tertiary" />
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-3 text-center text-3xl font-bold text-white">
          Página no encontrada
        </h1>

        {/* Description */}
        <p className="mb-8 text-center styles.colors.text.secondary">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="border-gray-700 hover:bg-gray-800"
          >
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al dashboard
            </Link>
          </Button>
        </div>

        {/* Helpful links */}
        <div className="mt-12 border-t border-gray-800 pt-6">
          <p className="mb-4 text-center text-sm font-medium styles.colors.text.secondary">
            Páginas populares:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/debates"
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm styles.colors.text.secondary transition-colors hover:bg-gray-800"
            >
              Debates
            </Link>
            <Link
              href="/experts"
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm styles.colors.text.secondary transition-colors hover:bg-gray-800"
            >
              Expertos
            </Link>
            <Link
              href="/settings"
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm styles.colors.text.secondary transition-colors hover:bg-gray-800"
            >
              Configuración
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
