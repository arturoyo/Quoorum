/**
 * Admin Content Component
 * 
 * Similar a SettingsContent pero para funcionalidades de administración
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { X, Loader2 } from 'lucide-react'
import { QuoorumLogo } from '@/components/ui/quoorum-logo'
import { getAdminNav } from '@/lib/admin-nav'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import { AdminSectionRenderer } from './admin-section-renderer'

interface AdminContentProps {
  isInModal?: boolean
  onClose?: () => void
  initialSection?: string
}

export function AdminContent({ isInModal = false, onClose, initialSection }: AdminContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [currentSection, setCurrentSection] = useState<string>(
    initialSection || (isInModal ? '/admin' : (pathname || '/admin'))
  )
  const [_user, setUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      setIsLoading(false)
    }

    loadUser()
  }, [router, supabase.auth, isInModal])

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
  const activePath = isInModal ? currentSection : (pathname || '/admin')
  const adminNav = getAdminNav(activePath)

  return (
    <div className={cn('relative flex flex-col', isInModal ? 'max-h-[90vh]' : 'min-h-screen')}>
      {/* Modal Header - Only show if in modal */}
      {isInModal && (
        <div className="sticky top-0 z-10 border-b border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] backdrop-blur-xl px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              Panel de Administración
            </h2>
            {/* El botón de cierre está en DialogContent, no duplicar aquí */}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={cn('container mx-auto flex-1 overflow-y-auto', isInModal ? 'px-6 pt-4 pb-12' : 'px-4 pt-8 pb-12')}>
        <div className={cn('grid gap-8', isInModal ? 'grid-cols-5' : 'grid-cols-1 lg:grid-cols-4')}>
          {/* Sidebar Nav */}
          <aside className={cn(isInModal ? 'col-span-1' : 'lg:col-span-1')}>
            <div className={cn('space-y-1', isInModal ? 'sticky top-4 z-20' : 'sticky top-24')}>
              <nav className="space-y-1">
                {adminNav.map((item) => {
                  const Icon = item.icon
                  
                  return (
                    <div key={item.href}>
                      {isInModal ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentSection(item.href)
                          }}
                          className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition group w-full text-left ${
                            item.active
                              ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-blue-300 border border-purple-500/30'
                              : 'text-[var(--theme-text-secondary)] hover:text-blue-300 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10'
                          }`}
                        >
                          {item.active && (
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg blur opacity-50" />
                          )}
                          <Icon className="relative w-5 h-5" />
                          <span className="relative text-sm font-medium">{item.label}</span>
                        </button>
                      ) : (
                        <a
                          href={item.href}
                          className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition group ${
                            item.active
                              ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-blue-300 border border-purple-500/30'
                              : 'text-[var(--theme-text-secondary)] hover:text-blue-300 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10'
                          }`}
                        >
                          {item.active && (
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg blur opacity-50" />
                          )}
                          <Icon className="relative w-5 h-5" />
                          <span className="relative text-sm font-medium">{item.label}</span>
                        </a>
                      )}
                    </div>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Content Area */}
          <div className={cn(isInModal ? 'col-span-4' : 'lg:col-span-3')}>
            <AdminSectionRenderer
              activePath={activePath}
              isInModal={isInModal}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
