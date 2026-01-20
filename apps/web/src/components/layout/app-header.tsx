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
import { SettingsModal } from '@/components/settings/settings-modal'
import { api } from '@/lib/trpc/client'
import { useEffect, useState } from 'react'
import { Plus, Settings, Menu, X, History } from 'lucide-react'
import type { User } from '@supabase/supabase-js'


interface AppHeaderProps {
  variant?: 'landing' | 'app'
  showAuth?: boolean
  onSettingsOpen?: () => void
  settingsInitialSection?: string
}

/**
 * Unified App Header Component
 * 
 * Used across all pages for consistent navigation
 * - Landing variant: For marketing pages (home, pricing, etc.)
 * - App variant: For authenticated app pages (dashboard, debates, settings, etc.)
 */
export function AppHeader({ 
  variant = 'app', 
  showAuth = false,
  onSettingsOpen,
  settingsInitialSection,
}: AppHeaderProps) {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [isLogoHovered, setIsLogoHovered] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Get current user role (to show admin menu)
  const { data: currentUser } = api.users.getMe.useQuery(
    undefined,
    { 
      enabled: variant === 'app' && isAuthenticated,
      retry: false,
    }
  )

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user)
      setUser(user)
    })
  }, [variant])

  const handleSettingsClick = () => {
    if (onSettingsOpen) {
      onSettingsOpen()
    } else {
      setSettingsModalOpen(true)
    }
  }

  if (variant === 'landing') {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-2xl bg-black/50">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            <Link 
              href="/" 
              className="flex items-center gap-2 group"
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
            >
              {!isLogoHovered ? (
                <svg
                  viewBox="0 0 400 120"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-32 sm:w-40 md:w-48 h-auto transition-opacity"
                >
                  <defs>
                    <linearGradient id="gradQ" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00c6ff" stopOpacity="1" />
                      <stop offset="100%" stopColor="#0072ff" stopOpacity="1" />
                    </linearGradient>
                    <filter id="shadow" x="-20%" y="-20%" width="150%" height="150%">
                      <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.2"/>
                    </filter>
                  </defs>

                  <g filter="url(#shadow)">
                    {/* Q circle - más grande y visible */}
                    <path d="M50,20 A35,35 0 1,1 49.9,20 Z" fill="url(#gradQ)" stroke="#0072ff" strokeWidth="2" />
                    {/* Q tail - más pronunciada */}
                    <path d="M80,80 L95,95 L70,85 Z" fill="#0072ff" />
                    {/* 3 puntos centrados en el medio del círculo */}
                    <circle cx="40" cy="50" r="4" fill="white" />
                    <circle cx="50" cy="50" r="4" fill="white" />
                    <circle cx="60" cy="50" r="4" fill="white" />
                  </g>

                  <text x="110" y="75" fontFamily="Segoe UI, Roboto, Helvetica, Arial, sans-serif" fontWeight="800" fontSize="52" fill="#1A1A1B" letterSpacing="-1">
                    uoorum
                  </text>
                </svg>
              ) : (
                <svg
                  viewBox="0 0 400 120"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-32 sm:w-40 md:w-48 h-auto transition-opacity"
                >
                  <defs>
                    <filter id="glow-landing">
                      <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  <g filter="url(#glow-landing)">
                    {/* Q circle - más grande y visible */}
                    <path d="M50,20 A35,35 0 1,1 49.9,20 Z" fill="none" stroke="#00E5FF" strokeWidth="5" />
                    {/* Q tail - más pronunciada */}
                    <path d="M80,80 L95,95 L70,85 Z" fill="#00E5FF" />
                    {/* 3 puntos centrados en el medio del círculo */}
                    <circle cx="40" cy="50" r="4" fill="#00E5FF" />
                    <circle cx="50" cy="50" r="4" fill="#00E5FF" />
                    <circle cx="60" cy="50" r="4" fill="#00E5FF" />
                  </g>

                  <text x="110" y="75" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="52" fill="#FFFFFF">
                    uoorum
                  </text>
                </svg>
              )}
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
                  <Link href="/login" className="hidden sm:block">
                    <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link href="/signup" className="hidden sm:block">
                    <Button className="relative group overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0">
                      <span className="relative z-10">Empezar Gratis</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/dashboard" className="hidden sm:block">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    Dashboard
                  </Button>
                </Link>
              )}
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                className="md:hidden text-gray-300 hover:text-white hover:bg-white/5 p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
            <div className="container mx-auto px-4 py-6 space-y-4">
              <Link
                href="#features"
                className="block text-gray-300 hover:text-white py-2 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Características
              </Link>
              <Link
                href="#use-cases"
                className="block text-gray-300 hover:text-white py-2 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Casos de Uso
              </Link>
              <Link
                href="#pricing"
                className="block text-gray-300 hover:text-white py-2 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Precios
              </Link>
              <div className="pt-4 border-t border-white/10 space-y-3">
                {!isAuthenticated ? (
                  <>
                    <Link href="/login" className="block">
                      <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-white/5">
                        Iniciar Sesión
                      </Button>
                    </Link>
                    <Link href="/signup" className="block">
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0">
                        Empezar Gratis
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href="/dashboard" className="block">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                      Dashboard
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    )
  }

  // App variant - for authenticated pages
  return (
    <>
      <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5" />
        <div className="container mx-auto px-4">
          <div className="relative flex h-16 items-center justify-between">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 group"
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
            >
              {!isLogoHovered ? (
                <svg
                  viewBox="0 0 400 120"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-24 sm:w-32 md:w-40 h-auto transition-opacity"
                >
                  <defs>
                    <linearGradient id="gradQ-app" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00c6ff" stopOpacity="1" />
                      <stop offset="100%" stopColor="#0072ff" stopOpacity="1" />
                    </linearGradient>
                    <filter id="shadow-app" x="-20%" y="-20%" width="150%" height="150%">
                      <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.2"/>
                    </filter>
                  </defs>

                  <g filter="url(#shadow-app)">
                    {/* Q circle - más grande y visible */}
                    <path d="M50,20 A35,35 0 1,1 49.9,20 Z" fill="url(#gradQ-app)" stroke="#0072ff" strokeWidth="2" />
                    {/* Q tail - más pronunciada */}
                    <path d="M80,80 L95,95 L70,85 Z" fill="#0072ff" />
                    {/* 3 puntos centrados en el medio del círculo */}
                    <circle cx="40" cy="50" r="4" fill="white" />
                    <circle cx="50" cy="50" r="4" fill="white" />
                    <circle cx="60" cy="50" r="4" fill="white" />
                  </g>

                  <text x="110" y="75" fontFamily="Segoe UI, Roboto, Helvetica, Arial, sans-serif" fontWeight="800" fontSize="52" fill="#FFFFFF" letterSpacing="-1">
                    uoorum
                  </text>
                </svg>
              ) : (
                <svg
                  viewBox="0 0 400 120"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-24 sm:w-32 md:w-40 h-auto transition-opacity"
                >
                  <defs>
                    <filter id="glow-app">
                      <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  <g filter="url(#glow-app)">
                    {/* Q circle - más grande y visible */}
                    <path d="M50,20 A35,35 0 1,1 49.9,20 Z" fill="none" stroke="#00E5FF" strokeWidth="5" />
                    {/* Q tail - más pronunciada */}
                    <path d="M80,80 L95,95 L70,85 Z" fill="#00E5FF" />
                    {/* 3 puntos centrados en el medio del círculo */}
                    <circle cx="40" cy="50" r="4" fill="#00E5FF" />
                    <circle cx="50" cy="50" r="4" fill="#00E5FF" />
                    <circle cx="60" cy="50" r="4" fill="#00E5FF" />
                  </g>

                  <text x="110" y="75" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="52" fill="#FFFFFF">
                    uoorum
                  </text>
                </svg>
              )}
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {currentUser?.isAdmin && (
                <Link 
                  href="/admin" 
                  className={`text-sm transition-colors relative group ${
                    pathname?.startsWith('/admin') 
                      ? 'text-purple-300 font-medium' 
                      : 'text-purple-300 hover:text-purple-200'
                  }`}
                >
                  Admin
                  {pathname?.startsWith('/admin') && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500" />
                  )}
                  {!pathname?.startsWith('/admin') && (
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-full transition-all" />
                  )}
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/debates/new" className="hidden sm:block">
                <Button className="bg-purple-600 hover:bg-purple-500 text-white border-0 p-2" title="Crear nuevo debate">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
              <div className="hidden sm:block">
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
              <Link href="/debates">
                <Button
                  variant="ghost"
                  className="hidden sm:block text-gray-300 hover:text-white hover:bg-white/10 p-2"
                  title="Historial de debates"
                >
                  <History className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                onClick={handleSettingsClick}
                variant="ghost"
                className="hidden sm:block text-gray-300 hover:text-white hover:bg-white/10 p-2"
                title="Configuración"
              >
                <Settings className="h-4 w-4" />
              </Button>
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                className="md:hidden text-gray-300 hover:text-white hover:bg-white/10 p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                title={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl z-50">
            <div className="container mx-auto px-4 py-6 space-y-4">
              {currentUser?.isAdmin && (
                <Link
                  href="/admin"
                  className={`block py-2 transition-colors ${
                    pathname?.startsWith('/admin')
                      ? 'text-purple-300 font-medium'
                      : 'text-purple-300 hover:text-purple-200'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              <div className={cn("space-y-3", currentUser?.isAdmin && "pt-4 border-t border-white/10")}>
                <Link href="/debates/new" className="block">
                  <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Debate
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleSettingsClick()
                  }}
                  variant="ghost"
                  className="w-full text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
      <SettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        initialSection={settingsInitialSection}
      />
    </>
  )
}
