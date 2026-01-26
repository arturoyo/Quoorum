/**
 * Admin Modal Component
 * 
 * Modal similar a SettingsModal pero para funcionalidades de administración
 * Solo visible para usuarios con rol admin o super_admin
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SettingsContent } from '@/components/settings/settings-content'
import { AdminContent } from './admin-content'
import { api } from '@/lib/trpc/client'
import { Loader2 } from 'lucide-react'

interface AdminModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSection?: string
}

export function AdminModal({ open, onOpenChange, initialSection }: AdminModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Check if user is admin
  const { data: currentUser, isLoading: isLoadingUser } = api.users.getMe.useQuery(
    undefined,
    {
      enabled: open && isAuthenticated,
      retry: false,
    }
  )

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsAuthenticated(false)
        setIsAdmin(false)
        setIsChecking(false)
        onOpenChange(false)
        return
      }
      setIsAuthenticated(true)
      setIsChecking(false)
    }
    checkAuth()
  }, [supabase.auth, open, onOpenChange])

  useEffect(() => {
    if (currentUser) {
      setIsAdmin(currentUser.isAdmin || false)
      if (!currentUser.isAdmin) {
        // User is not admin, close modal
        onOpenChange(false)
      }
    }
  }, [currentUser, onOpenChange])

  if (isChecking || isLoadingUser) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden bg-slate-900 border-purple-500/20">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden bg-slate-900 border-purple-500/20 p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Panel de Administración</DialogTitle>
          <DialogDescription>
            Gestión completa de usuarios, roles, créditos y costos
          </DialogDescription>
        </DialogHeader>
        <AdminContent
          isInModal={true}
          onClose={() => onOpenChange(false)}
          initialSection={initialSection}
        />
      </DialogContent>
    </Dialog>
  )
}
