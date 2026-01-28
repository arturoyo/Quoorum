'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  User,
  Plus,
  Loader2,
  Save,
  X,
} from 'lucide-react'
import { QuoorumLogo } from '@/components/ui/quoorum-logo'
import { getSettingsNav } from '@/lib/settings-nav'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import { SettingsSectionRenderer } from './settings-section-renderer'
import { SettingsProvider } from './settings-context'

interface SettingsContentProps {
  isInModal?: boolean
  onClose?: () => void
  initialSection?: string
}

/**
 * Settings Content Component
 * Reusable content for both full page and modal views
 */
export function SettingsContent({ isInModal = false, onClose, initialSection }: SettingsContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  // In modal mode: default to '/settings' if no initialSection provided
  // In page mode: use pathname or default to '/settings'
  const [currentSection, setCurrentSection] = useState<string>(
    initialSection || (isInModal ? '/settings' : (pathname || '/settings'))
  )
  const [_user, setUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: '',
  })

  const supabase = createClient()

  // Sync currentSection with pathname when pathname changes (if not in modal)
  useEffect(() => {
    if (!isInModal && pathname) {
      setCurrentSection(pathname)
    }
  }, [pathname, isInModal])

  // When modal opens with initialSection, set it immediately
  useEffect(() => {
    if (isInModal && initialSection) {
      setCurrentSection(initialSection)
    }
  }, [isInModal, initialSection])

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        if (!isInModal) {
          router.push('/login')
        }
        return
      }

      setUser(user)
      setFormData({
        fullName: user.user_metadata?.full_name || '',
        email: user.email || '',
        role: user.user_metadata?.role || '',
      })
      setIsLoading(false)
    }

    loadUser()
  }, [router, supabase.auth, isInModal])

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          role: formData.role,
        },
      })

      if (error) {
        toast.error('Error al guardar los cambios')
        return
      }

      toast.success('Cambios guardados correctamente')
    } catch {
      toast.error('Error al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    if (isInModal && onClose) {
      onClose()
    }
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className={cn(
        'flex items-center justify-center',
        isInModal ? 'min-h-[400px]' : 'min-h-screen'
      )}>
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  // Use currentSection state when in modal, pathname otherwise
  const activePath = isInModal ? currentSection : (pathname || '/settings')
  const settingsNav = getSettingsNav(activePath)

  return (
    <div className={cn('relative flex flex-col', isInModal ? 'max-h-[90vh]' : 'min-h-screen')}>
      {/* Header - Only show if not in modal */}
      {!isInModal && (
        <header className="relative border-b border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] backdrop-blur-xl sticky top-0 z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5" />
          <div className="container mx-auto px-4">
            <div className="relative flex h-16 items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition" />
                  <div className="relative w-8 h-8 rounded-lg flex items-center justify-center bg-purple-600">
                    <QuoorumLogo size={24} showGradient={true} />
                  </div>
                </div>
                <span className="text-xl font-bold text-[var(--theme-text-primary)]">
                  Quoorum
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-sm text-[var(--theme-text-secondary)] hover:text-purple-500 transition-colors relative group">
                  Dashboard
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 group-hover:w-full transition-all" />
                </Link>
                <Link href="/debates" className="text-sm text-[var(--theme-text-secondary)] hover:text-purple-500 transition-colors relative group">
                  Debates
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 group-hover:w-full transition-all" />
                </Link>
                <Link href="/settings" className="text-sm font-medium text-purple-500 relative group">
                  Configuración
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500" />
                </Link>
              </nav>

              <div className="flex items-center gap-3">
                <Link href="/debates/new-unified?new=1">
                  <Button className="bg-purple-600 hover:bg-purple-500 text-white border-0">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Debate
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Modal Header - Only show if in modal */}
      {isInModal && (
        <div className="sticky top-0 z-10 border-b border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] backdrop-blur-xl px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--theme-text-primary)]">
              Configuración
            </h2>
            {/* El botón de cierre está en DialogContent, no duplicar aquí */}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={cn('container mx-auto flex-1 overflow-y-auto', isInModal ? 'px-6 pt-4 pb-12' : 'px-4 pt-8 pb-12')}>
        <div className={cn('grid gap-8', isInModal ? 'grid-cols-5' : 'grid-cols-1 lg:grid-cols-4')}>
          {/* Sidebar Nav - Show in both modal and full page */}
          <aside className={cn(isInModal ? 'col-span-1' : 'lg:col-span-1')}>
            <div className={cn('space-y-1', isInModal ? 'sticky top-4 z-20' : 'sticky top-24')}>
              <nav className="space-y-1">
                {settingsNav.map((item) => {
                  const Icon = item.icon
                  const hasSubItems = item.subItems && item.subItems.length > 0
                  const isExpanded = hasSubItems && (item.active || item.subItems?.some(sub => sub.active))
                  
                  return (
                    <div key={item.href} className="space-y-1">
                      {isInModal ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentSection(item.href)
                          }}
                          className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition group w-full text-left ${
                            item.active && !hasSubItems
                              ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                              : 'text-[var(--theme-text-secondary)] hover:text-purple-500 hover:bg-purple-500/10'
                          }`}
                        >
                          {(item.active && !hasSubItems) && (
                            <div className="absolute inset-0 bg-purple-500/10 rounded-lg blur opacity-50" />
                          )}
                          <Icon className="relative w-5 h-5" />
                          <span className="relative text-sm font-medium">{item.label}</span>
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition group ${
                            item.active && !hasSubItems
                              ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                              : 'text-[var(--theme-text-secondary)] hover:text-purple-500 hover:bg-purple-500/10'
                          }`}
                        >
                          {(item.active && !hasSubItems) && (
                            <div className="absolute inset-0 bg-purple-500/10 rounded-lg blur opacity-50" />
                          )}
                          <Icon className="relative w-5 h-5" />
                          <span className="relative text-sm font-medium">{item.label}</span>
                        </Link>
                      )}
                      
                      {hasSubItems && isExpanded && (
                        <div className="ml-4 space-y-1 pl-4 border-l border-[var(--theme-border)]">
                          {item.subItems?.map((subItem) => (
                            <React.Fragment key={subItem.href}>
                              {isInModal ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentSection(subItem.href)
                                  }}
                                  className={`relative flex items-center gap-3 px-4 py-2 rounded-lg transition group text-sm w-full text-left ${
                                    subItem.active
                                      ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                                      : 'text-[var(--theme-text-secondary)] hover:text-purple-500 hover:bg-purple-500/10'
                                  }`}
                                >
                                  {subItem.active && (
                                    <div className="absolute inset-0 bg-purple-500/10 rounded-lg blur opacity-50" />
                                  )}
                                  <span className="relative">{subItem.label}</span>
                                </button>
                              ) : (
                                <Link
                                  href={subItem.href}
                                  className={`relative flex items-center gap-3 px-4 py-2 rounded-lg transition group text-sm ${
                                    subItem.active
                                      ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                                      : 'text-[var(--theme-text-secondary)] hover:text-purple-500 hover:bg-purple-500/10'
                                  }`}
                                >
                                  {subItem.active && (
                                    <div className="absolute inset-0 bg-purple-500/10 rounded-lg blur opacity-50" />
                                  )}
                                  <span className="relative">{subItem.label}</span>
                                </Link>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className={cn('space-y-6', isInModal ? 'col-span-4' : 'lg:col-span-3')}>
            <SettingsProvider setCurrentSection={setCurrentSection} isInModal={isInModal}>
          <SettingsSectionRenderer activePath={activePath} isInModal={isInModal} />
        </SettingsProvider>
          </div>
        </div>
      </main>
    </div>
  )
}
