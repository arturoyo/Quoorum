'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { QuoorumLogo } from '@/components/ui/quoorum-logo'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/quoorum/notifications-center'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { NotificationsCenter } from '@/components/quoorum/notifications-center'
import { useEffect, useState } from 'react'
import {
  Link,
} from "lucide-react";


interface AppHeaderProps {
  variant?: 'landing' | 'app'
  showAuth?: boolean
}

/**
 * Unified App Header Component
 * 
 * Used across all pages for consistent navigation
 * - Landing variant: For marketing pages (home, pricing, etc.)
 * - App variant: For authenticated app pages (dashboard, debates, settings, etc.)
 */
export function AppHeader({ variant = 'app', showAuth = false }: AppHeaderProps) {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (showAuth) {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        setIsAuthenticated(!!user)
      })
    }
  }, [showAuth])

  if (variant === 'landing') {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-2xl bg-black/50">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition" />
                <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center bg-[#0A0A0F]">
                  <QuoorumLogo size={48} showGradient={true} />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                Quoorum
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-gray-400 hover:text-white transition-colors relative group">
                Características
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-full transition-all" />
              </Link>
              <Link href="#use-cases" className="text-sm text-gray-400 hover:text-white transition-colors relative group">
                Casos de Uso
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-full transition-all" />
              </Link>
              <Link href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors relative group">
                Precios
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-full transition-all" />
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              {!isAuthenticated ? (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="relative group overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0">
                      <span className="relative z-10">Empezar Gratis</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/dashboard">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    )
  }

  // App variant - for authenticated pages
  return (
    <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition" />
              <div className="relative w-8 h-8 rounded-lg flex items-center justify-center bg-purple-600">
                <QuoorumLogo size={24} showGradient={true} />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
              Quoorum
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/dashboard" 
              className={`text-sm transition-colors ${
                pathname === '/dashboard' 
                  ? 'text-purple-400 font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              href="/debates" 
              className={`text-sm transition-colors ${
                pathname?.startsWith('/debates') 
                  ? 'text-purple-400 font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Debates
            </Link>
            <Link 
              href="/experts" 
              className={`text-sm transition-colors ${
                pathname?.startsWith('/experts') 
                  ? 'text-purple-400 font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Expertos
            </Link>
            <Link 
              href="/insights" 
              className={`text-sm transition-colors ${
                pathname?.startsWith('/insights') 
                  ? 'text-purple-400 font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Insights
            </Link>
            <Link 
              href="/settings" 
              className={`text-sm transition-colors ${
                pathname?.startsWith('/settings') 
                  ? 'text-purple-400 font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Configuración
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <div>
                  <NotificationBell />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0 border-white/10 bg-slate-900/95 backdrop-blur-xl" align="end">
                <NotificationsCenter onNotificationClick={() => {}} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </header>
  )
}
