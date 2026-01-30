'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { QuoorumLogo, QuoorumLogoWithText } from '@/components/ui/quoorum-logo'
import { createClient } from '@/lib/supabase/client'
import { NotificationsSidebar, CreditCounter } from '@/components/quoorum'
import { SettingsModal } from '@/components/settings/settings-modal'
import { AdminModal } from '@/components/admin'
import { api } from '@/lib/trpc/client'
import { cn, styles } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { classifyTRPCError } from '@/lib/trpc/error-handler'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { Plus, Settings, Menu, X, History, Shield, MessageCircle, Eye, EyeOff, Sparkles, Bell } from 'lucide-react'

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
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [adminModalOpen, setAdminModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [notificationsSidebarOpen, setNotificationsSidebarOpen] = useState(false)
  const [showDebugPanel, setShowDebugPanel] = useState(false) // Estado para mostrar/ocultar panel de debug

  // Fix hydration mismatch by only rendering Popover on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Verificar autenticaci�n de forma inmediata y reactiva
  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (mounted) {
          setIsAuthenticated(!!user && !error)
          setUser(user)
          setIsCheckingAuth(false)
        }
      } catch (error) {
        if (mounted) {
          setIsAuthenticated(false)
          setUser(null)
          setIsCheckingAuth(false)
        }
      }
    }

    // Verificar inmediatamente
    checkAuth()

    // Escuchar cambios de autenticaci�n
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setIsAuthenticated(!!session?.user)
        setUser(session?.user ?? null)
        setIsCheckingAuth(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [variant])

  // Get current user role (to show admin menu)
  // Only fetch when user is authenticated and auth check is complete to prevent 401 errors in console
  const { data: currentUser, isLoading: isLoadingUser, error: userError } = api.users.getMe.useQuery(
    undefined,
    {
      enabled: variant === 'app' && !isCheckingAuth && isAuthenticated, // Only fetch when auth check is complete and user is authenticated
      retry: false,
      onError: (error) => {
        // Silenciar errores de autenticaci�n esperados (ya manejados por enabled)
        if (error.data?.code === 'UNAUTHORIZED' && (!isAuthenticated || isCheckingAuth)) {
          return // No loggear errores esperados
        }
      },
    }
  )

  // Get unread notification count
  const { data: unreadCount } = api.quoorumNotifications.getUnreadCount.useQuery(undefined, {
    enabled: variant === 'app' && isAuthenticated,
  })

  // Debug: Log admin status (solo cuando no es un error esperado)
  useEffect(() => {
    // No loggear durante la verificaci�n inicial o si es un error de autenticaci�n esperado
    if (isCheckingAuth) return
    if (userError?.data?.code === 'UNAUTHORIZED' && !isAuthenticated) return

    logger.debug('[AppHeader] Auth state:', {
      variant,
      isAuthenticated,
      isLoadingUser,
      hasCurrentUser: !!currentUser,
      userError: userError?.message,
      userErrorCode: userError?.data?.code,
    });

    if (currentUser) {
      logger.debug('[AppHeader] Current user:', {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        isAdmin: currentUser.isAdmin,
      })
    } else if (userError && userError.data?.code !== 'UNAUTHORIZED') {
      // Clasificar el error para determinar si debe ser silenciado
      const errorInfo = classifyTRPCError(userError)
      
      // Solo loggear errores inesperados (no errores de autenticaci�n, payment-required ni network)
      if (errorInfo.type !== 'unauthorized' && 
          errorInfo.type !== 'payment-required' && 
          errorInfo.type !== 'network') {
        logger.error('[AppHeader] User query failed:', {
          message: userError.message,
          code: userError.data?.code,
          httpStatus: userError.data?.httpStatus,
        });
      }
    }
  }, [currentUser, isAuthenticated, isLoadingUser, variant, userError, isCheckingAuth])

  const handleSettingsClick = () => {
    if (onSettingsOpen) {
      onSettingsOpen()
    } else {
      setSettingsModalOpen(true)
    }
  }

  if (variant === 'landing') {
    return (
      <header className="fixed top-0 left-0 right-0 w-full z-50 border-b border-[var(--theme-landing-border)] backdrop-blur-2xl bg-[var(--theme-landing-glass)] transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center">
            {/* Logo - Columna izquierda */}
            <div className="flex-1">
              <QuoorumLogoWithText
                href="/"
                iconSize={200}
                showGradient={true}
                showText={false}
                className="transition-opacity group-hover:opacity-80"
              />
            </div>

            {/* Nav - Columna central (centrada) */}
            <nav className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
              <Link href="#features" className="text-sm styles.colors.text.secondary hover:styles.colors.text.primary transition-colors relative group">
                Caracter�sticas
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-full transition-all" />
              </Link>
              <Link href="#use-cases" className="text-sm styles.colors.text.secondary hover:styles.colors.text.primary transition-colors relative group">
                Casos de Uso
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-full transition-all" />
              </Link>
              <Link href="#pricing" className="text-sm styles.colors.text.secondary hover:styles.colors.text.primary transition-colors relative group">
                Precios
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-full transition-all" />
              </Link>
            </nav>

            {/* Botones de auth - Columna derecha */}
            <div className="flex-1 flex items-center justify-end gap-3">
              {!isAuthenticated ? (
                <>
                  <Link href="/login" className="hidden sm:block">
                    <Button variant="ghost" className="styles.colors.text.secondary hover:styles.colors.text.primary hover:bg-[var(--theme-landing-card-hover)]">
                      Iniciar Sesi�n
                    </Button>
                  </Link>
                  <Link href="/signup" className="hidden sm:block">
                    <Button className="relative group overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 styles.colors.text.primary border-0">
                      <span className="relative z-10">Empezar Gratis</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/dashboard" className="hidden sm:block">
                  <Button className="bg-purple-600 hover:bg-purple-700 styles.colors.text.inverted">
                    Dashboard
                  </Button>
                </Link>
              )}
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                className="md:hidden styles.colors.text.secondary hover:styles.colors.text.primary hover:bg-[var(--theme-landing-card-hover)] p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[var(--theme-landing-overlay)] backdrop-blur-xl border-b border-[var(--theme-landing-border)] shadow-2xl transition-colors duration-300">
            <div className="container mx-auto px-4 py-6 space-y-4">
              <Link
                href="#features"
                className="block styles.colors.text.secondary hover:styles.colors.text.primary py-2 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Caracter�sticas
              </Link>
              <Link
                href="#use-cases"
                className="block styles.colors.text.secondary hover:styles.colors.text.primary py-2 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Casos de Uso
              </Link>
              <Link
                href="#pricing"
                className="block styles.colors.text.secondary hover:styles.colors.text.primary py-2 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Precios
              </Link>
              <div className="pt-4 border-t border-[var(--theme-landing-border)] space-y-3">
                {!isAuthenticated ? (
                  <>
                    <Link href="/login" className="block">
                      <Button variant="ghost" className="w-full styles.colors.text.secondary hover:styles.colors.text.primary hover:bg-[var(--theme-landing-card-hover)]">
                        Iniciar Sesi�n
                      </Button>
                    </Link>
                    <Link href="/signup" className="block">
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 styles.colors.text.primary border-0">
                        Empezar Gratis
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href="/dashboard" className="block">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 styles.colors.text.inverted">
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
      <header className="border-b styles.colors.border.default styles.colors.bg.secondary/80 backdrop-blur-xl fixed top-0 left-0 right-0 w-full z-50 transition-colors duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 pointer-events-none" />
        <div className="container mx-auto px-4">
          <div className="relative flex h-16 items-center justify-between">
            <QuoorumLogoWithText
              href="/dashboard"
              iconSize={200}
              showGradient={true}
              showText={false}
              className="transition-opacity group-hover:opacity-80"
            />

            <nav className="hidden md:flex items-center gap-6">
              {/* Admin link removed - using icon button instead */}
            </nav>

            <div className="flex items-center gap-1">
              {/* Credit Counter - Solo mostrar en p�ginas de debate */}
              {pathname?.includes('/debates/new-unified') && (
                <div className="hidden sm:block mr-2">
                  <CreditCounter variant="compact" />
                </div>
              )}

              {/* New Debate Button with hover-expand effect */}
              <button
                onClick={async (e) => {
                  try {
                    e.preventDefault()
                    e.stopPropagation()
                    const generateSessionId = () => {
                      if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
                        return window.crypto.randomUUID()
                      }
                      return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
                    }
                    const sessionId = generateSessionId()
                    const targetUrl = `/debates/new-unified/${sessionId}?new=1`
                    await router.push(targetUrl)
                  } catch (error) {
                    const errorInfo = classifyTRPCError(error)
                    if (errorInfo.type !== 'network') {
                      logger.error('[AppHeader] Error al crear nuevo debate', error instanceof Error ? error : new Error(String(error)))
                      toast.error('Error al crear nuevo debate', {
                        description: error instanceof Error ? error.message : 'Error desconocido'
                      })
                    }
                  }
                }}
                className={cn(
                  'group hidden sm:flex items-center gap-0 px-2 py-1.5 rounded-full',
                  'bg-purple-600 hover:bg-purple-500 styles.colors.text.inverted',
                  'transition-all duration-300 ease-out'
                )}
                title="Crear nuevo debate"
                type="button"
              >
                <Plus className="h-4 w-4 flex-shrink-0" />
                <span className={cn(
                  'max-w-0 overflow-hidden whitespace-nowrap',
                  'group-hover:max-w-[100px] group-hover:ml-1.5',
                  'transition-all duration-300 ease-out',
                  'text-xs font-medium'
                )}>
                  Nuevo
                </span>
              </button>

              {/* Nav items with hover-expand effect */}

              {/* Notifications with hover-expand and badge */}
              <button
                onClick={() => setNotificationsSidebarOpen(!notificationsSidebarOpen)}
                className={cn(
                  'group relative hidden sm:flex items-center gap-0 px-2 py-1.5 rounded-full',
                  'styles.colors.text.secondary hover:styles.colors.text.primary',
                  'hover:styles.colors.bg.tertiary transition-all duration-300 ease-out'
                )}
                title={(unreadCount ?? 0) > 0 ? `${unreadCount} notificaciones sin leer` : 'Notificaciones'}
                type="button"
              >
                <Bell className="h-4 w-4 flex-shrink-0" />
                {(unreadCount ?? 0) > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[10px] font-medium styles.colors.text.inverted">
                    {(unreadCount ?? 0) > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <span className={cn(
                  'max-w-0 overflow-hidden whitespace-nowrap',
                  'group-hover:max-w-[100px] group-hover:ml-1.5',
                  'transition-all duration-300 ease-out',
                  'text-xs font-medium'
                )}>
                  Alertas
                </span>
              </button>

              <Link
                href="/debates"
                className={cn(
                  'group hidden sm:flex items-center gap-0 px-2 py-1.5 rounded-full',
                  'styles.colors.text.secondary hover:styles.colors.text.primary',
                  'hover:styles.colors.bg.tertiary transition-all duration-300 ease-out'
                )}
                title="Debates"
              >
                <MessageCircle className="h-4 w-4 flex-shrink-0" />
                <span className={cn(
                  'max-w-0 overflow-hidden whitespace-nowrap',
                  'group-hover:max-w-[80px] group-hover:ml-1.5',
                  'transition-all duration-300 ease-out',
                  'text-xs font-medium'
                )}>
                  Debates
                </span>
              </Link>

              <Link
                href="/scenarios"
                className={cn(
                  'group hidden sm:flex items-center gap-0 px-2 py-1.5 rounded-full',
                  'styles.colors.text.secondary hover:styles.colors.text.primary',
                  'hover:styles.colors.bg.tertiary transition-all duration-300 ease-out'
                )}
                title="Escenarios"
              >
                <Sparkles className="h-4 w-4 flex-shrink-0" />
                <span className={cn(
                  'max-w-0 overflow-hidden whitespace-nowrap',
                  'group-hover:max-w-[80px] group-hover:ml-1.5',
                  'transition-all duration-300 ease-out',
                  'text-xs font-medium'
                )}>
                  Escenarios
                </span>
              </Link>

              <button
                onClick={handleSettingsClick}
                className={cn(
                  'group hidden sm:flex items-center gap-0 px-2 py-1.5 rounded-full',
                  'styles.colors.text.secondary hover:styles.colors.text.primary',
                  'hover:styles.colors.bg.tertiary transition-all duration-300 ease-out'
                )}
                title="Configuraci�n"
                type="button"
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className={cn(
                  'max-w-0 overflow-hidden whitespace-nowrap',
                  'group-hover:max-w-[80px] group-hover:ml-1.5',
                  'transition-all duration-300 ease-out',
                  'text-xs font-medium'
                )}>
                  Ajustes
                </span>
              </button>

              {/* Admin button with hover-expand */}
              {!isLoadingUser && currentUser?.isAdmin && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    logger.debug('[AppHeader] Opening admin modal');
                    setAdminModalOpen(true);
                  }}
                  className={cn(
                    'group flex items-center gap-0 px-2 py-1.5 rounded-full',
                    'text-purple-400 hover:text-purple-300',
                    'hover:bg-purple-500/10 transition-all duration-300 ease-out'
                  )}
                  title="Panel de Administraci�n"
                  type="button"
                >
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  <span className={cn(
                    'max-w-0 overflow-hidden whitespace-nowrap',
                    'group-hover:max-w-[80px] group-hover:ml-1.5',
                    'transition-all duration-300 ease-out',
                    'text-xs font-medium'
                  )}>
                    Admin
                  </span>
                </button>
              )}
              {/* Mobile menu button - Solo visible en pantallas peque�as */}
              <Button
                variant="ghost"
                className="md:hidden styles.colors.text.secondary hover:styles.colors.text.primary hover:styles.colors.bg.tertiary p-2 z-50 relative"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setMobileMenuOpen(!mobileMenuOpen)
                }}
                title={mobileMenuOpen ? "Cerrar men�" : "Abrir men�"}
                type="button"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay para cerrar al hacer click fuera */}
            <div 
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 top-16"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu content */}
            <div className="md:hidden absolute top-full left-0 right-0 styles.colors.bg.secondary/98 backdrop-blur-xl border-b styles.colors.border.default shadow-2xl z-50 transition-all duration-300">
              <div className="container mx-auto px-4 py-6 space-y-4">
                {currentUser?.isAdmin && (
                  <button
                    onClick={() => {
                      setAdminModalOpen(true)
                      setMobileMenuOpen(false)
                    }}
                    className="block w-full text-left py-3 px-4 rounded-lg transition-colors styles.colors.text.secondary hover:styles.colors.text.primary hover:styles.colors.bg.tertiary"
                  >
                    <Shield className="inline-block mr-2 h-4 w-4" />
                    Panel de Administraci�n
                  </button>
                )}
                <div className={cn("space-y-3", currentUser?.isAdmin && "pt-4 border-t styles.colors.border.default")}>
                <Button 
                  onClick={async (e) => {
                    try {
                      e.preventDefault()
                      e.stopPropagation()
                      setMobileMenuOpen(false)
                      const generateSessionId = () => {
                        if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
                          return window.crypto.randomUUID()
                        }
                        return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
                      }
                      const sessionId = generateSessionId()
                      const targetUrl = `/debates/new-unified/${sessionId}?new=1`
                      await router.push(targetUrl)
                    } catch (error) {
                      // Clasificar el error para determinar si debe ser silenciado
                      const errorInfo = classifyTRPCError(error)
                      
                      // Solo loggear errores que NO son de red (network)
                      if (errorInfo.type !== 'network') {
                        logger.error('[AppHeader] Error al crear nuevo debate (mobile)', error instanceof Error ? error : new Error(String(error)))
                      }
                      
                      // Solo mostrar toast si NO es un error de red
                      if (errorInfo.type !== 'network') {
                        toast.error('Error al crear nuevo debate', {
                          description: error instanceof Error ? error.message : 'Error desconocido'
                        })
                      }
                    }
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-500 styles.colors.text.inverted font-medium py-3"
                  type="button"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Debate
                </Button>
                  <Link href="/debates" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full styles.colors.text.secondary hover:styles.colors.text.primary hover:styles.colors.bg.tertiary justify-start"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Debates
                    </Button>
                  </Link>
                  <Link href="/scenarios" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full styles.colors.text.secondary hover:styles.colors.text.primary hover:styles.colors.bg.tertiary justify-start"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Escenarios
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleSettingsClick()
                    }}
                    variant="ghost"
                    className="w-full styles.colors.text.secondary hover:styles.colors.text.primary hover:styles.colors.bg.tertiary justify-start"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configuraci�n
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </header>
      <SettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        initialSection={settingsInitialSection}
      />
      {currentUser?.isAdmin && (
        <AdminModal
          open={adminModalOpen}
          onOpenChange={(open) => {
            logger.debug('[AppHeader] AdminModal onOpenChange called:', { open });
            setAdminModalOpen(open);
          }}
        />
      )}
      <NotificationsSidebar
        isOpen={notificationsSidebarOpen}
        onClose={() => setNotificationsSidebarOpen(false)}
        onNotificationClick={() => {}}
      />
      {/* Debug: Show modal state in development */}
      {process.env.NODE_ENV === 'development' && (
        <>
          {/* Bot�n para mostrar/ocultar panel de debug */}
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="fixed bottom-32 right-4 bg-black/80 hover:bg-black/90 styles.colors.text.primary p-2 rounded-full z-20 transition-all shadow-lg border styles.colors.border.default"
            title={showDebugPanel ? 'Ocultar panel de debug' : 'Mostrar panel de debug'}
          >
            {showDebugPanel ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
          
          {/* Panel de debug (solo visible si showDebugPanel es true) */}
          {showDebugPanel && (
            <div className="fixed bottom-40 right-4 bg-black/80 styles.colors.text.primary p-3 text-xs rounded z-20 max-w-xs shadow-lg border styles.colors.border.default">
              <div className="space-y-1">
                <div>Admin Modal: {adminModalOpen ? 'OPEN' : 'CLOSED'}</div>
                <div>isAdmin: {currentUser?.isAdmin ? 'YES' : 'NO'}</div>
                <div>isLoading: {isLoadingUser ? 'YES' : 'NO'}</div>
                <div>hasUser: {currentUser ? 'YES' : 'NO'}</div>
                <div>userRole: {currentUser?.role || 'N/A'}</div>
                <div>error: {userError?.message || 'NONE'}</div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
