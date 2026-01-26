'use client'

/**
 * ProfileTab Component
 *
 * Profile information form with auto-save functionality.
 * Combines account management (ID, Name, Email, Phone, Sign out, Delete account)
 * with profile personalization (Nickname, Occupation, About, Custom Instructions).
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/trpc/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Loader2, LogOut, Trash2, Copy, Settings, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { ProfileData } from '../types'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'

interface ProfileTabProps {
  profileData: ProfileData
  onProfileChange: (data: ProfileData) => void
  isSaving: boolean
}

export function ProfileTab({ profileData, onProfileChange, isSaving }: ProfileTabProps) {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDataManagementOpen, setIsDataManagementOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialLoadRef = useRef(true)

  const [accountFormData, setAccountFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  // Get profile data from PostgreSQL via tRPC (source of truth)
  // This is the PRIMARY source - PostgreSQL local, not Supabase Auth
  const { data: fetchedProfileData, isLoading: isLoadingProfile } = api.users.getProfile.useQuery()

  // Load user ID from Supabase Auth (only for user.id, not for profile data)
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      setUser(user)

      // PRIORITY: Use fetchedProfileData from PostgreSQL (tRPC) as source of truth
      // Only use Supabase Auth for phone (if not in profiles table) and user.id
      if (fetchedProfileData && !isLoadingProfile) {
        // Split fullName into first and last name
        const fullName = fetchedProfileData.fullName || fetchedProfileData.name || ''
        const nameParts = fullName.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        // Get phone from Supabase Auth metadata (if available) - phone not in profiles table yet
        const phone = user.user_metadata?.phone || user.phone || ''

        setAccountFormData({
          firstName: firstName || fetchedProfileData.name || '',
          lastName: lastName || '',
          email: fetchedProfileData.email || '', // Use PostgreSQL email (source of truth)
          phone: phone, // Phone comes from Supabase Auth metadata (not in profiles table)
        })
        
        setIsLoading(false)
        setTimeout(() => {
          initialLoadRef.current = false
        }, 100)
      } else if (!isLoadingProfile) {
        // Only use Supabase Auth as fallback if fetchedProfileData is not available
        // This should rarely happen if PostgreSQL is working correctly
        const fullName = user.user_metadata?.full_name || ''
        const nameParts = fullName.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        setAccountFormData({
          firstName: (user.user_metadata?.first_name || firstName || ''),
          lastName: (user.user_metadata?.last_name || lastName || ''),
          email: (user.email || ''),
          phone: (user.user_metadata?.phone || user.phone || ''),
        })
        
        setIsLoading(false)
        setTimeout(() => {
          initialLoadRef.current = false
        }, 100)
      }
    }

    // Only run when fetchedProfileData changes or when not loading profile
    if (!isLoadingProfile) {
      void loadUser()
    }
  }, [supabase.auth, fetchedProfileData, isLoadingProfile])

  // Auto-save account data
  const saveAccountData = useCallback(async (data: typeof accountFormData) => {
    setSaveStatus('saving')

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          full_name: `${data.firstName} ${data.lastName}`.trim(),
          phone: data.phone,
        },
      })

      if (error) {
        toast.error('Error al guardar')
        setSaveStatus('idle')
        return
      }

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      toast.error('Error al guardar')
      setSaveStatus('idle')
    }
  }, [supabase.auth])

  // Auto-save with debounce when accountFormData changes
  useEffect(() => {
    if (initialLoadRef.current || isLoading) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      void saveAccountData(accountFormData)
    }, 800)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [accountFormData, saveAccountData, isLoading])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleCopyUserId = () => {
    if (user?.id) {
      void navigator.clipboard.writeText(user.id)
      toast.success('ID de usuario copiado')
    }
  }

  if (isLoading || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Gestión de Datos Card */}
      <Card className="relative overflow-hidden bg-[var(--theme-bg-secondary)] backdrop-blur-xl border-[var(--theme-border)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[var(--theme-text-primary)]">Gestión de Datos</CardTitle>
              <CardDescription className="text-[var(--theme-text-secondary)]">
                Gestiona tu información personal y configuración de cuenta
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDataManagementOpen(true)}
              className="text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] hover:bg-purple-500/10"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm text-[var(--theme-text-tertiary)]">Nombre</Label>
              <p className="text-lg font-medium text-[var(--theme-text-primary)]">
                {accountFormData.firstName} {accountFormData.lastName}
              </p>
            </div>
            <div>
              <Label className="text-sm text-[var(--theme-text-tertiary)]">Correo electrónico</Label>
              <p className="text-lg font-medium text-[var(--theme-text-primary)]">{accountFormData.email}</p>
            </div>
          </div>
          {accountFormData.phone && (
            <div>
              <Label className="text-sm text-[var(--theme-text-tertiary)]">Teléfono</Label>
              <p className="text-[var(--theme-text-primary)]">{accountFormData.phone}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información Personal Card */}
      <Card className="relative overflow-hidden bg-[var(--theme-bg-secondary)] backdrop-blur-xl border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-text-primary)]">Perfil</CardTitle>
          <CardDescription className="text-[var(--theme-text-secondary)]">
            Información personal para personalizar respuestas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        {/* Apodo */}
        <div className="space-y-2">
          <Label htmlFor="nickname" className="text-[var(--theme-text-primary)]">Apodo</Label>
          <Input
            id="nickname"
            value={profileData.nickname}
            onChange={(e) => onProfileChange({ ...profileData, nickname: e.target.value })}
            placeholder="Ej: Arturo"
            className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500 focus-visible:border-purple-500"
          />
        </div>

        {/* Ocupación */}
        <div className="space-y-2">
          <Label htmlFor="occupation" className="text-[var(--theme-text-primary)]">Ocupación</Label>
          <Input
            id="occupation"
            value={profileData.occupation}
            onChange={(e) => onProfileChange({ ...profileData, occupation: e.target.value })}
            placeholder="p. ej., Diseñador de Producto, Ingeniero de Software"
            className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500 focus-visible:border-purple-500"
          />
        </div>

        {/* Más sobre ti */}
        <div className="space-y-2">
          <Label htmlFor="about" className="text-[var(--theme-text-primary)]">Más sobre ti</Label>
          <Textarea
            id="about"
            value={profileData.about}
            onChange={(e) => onProfileChange({ ...profileData, about: e.target.value })}
            placeholder="Tu información de fondo, preferencias o ubicación para ayudar a Quoorum a entenderte mejor"
            className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500 focus-visible:border-purple-500 min-h-[100px]"
            maxLength={2000}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--theme-text-tertiary)]">
              Quoorum utiliza esta información para personalizar respuestas en todas las tareas.
            </p>
            <p className="text-xs text-[var(--theme-text-tertiary)]">
              {profileData.about.length}/2000
            </p>
          </div>
        </div>

        {/* Instrucciones personalizadas */}
        <div className="space-y-2">
          <Label htmlFor="customInstructions" className="text-[var(--theme-text-primary)]">Instrucciones personalizadas</Label>
          <Textarea
            id="customInstructions"
            value={profileData.customInstructions}
            onChange={(e) => onProfileChange({ ...profileData, customInstructions: e.target.value })}
            placeholder='¿Cómo le gustaría que Quoorum respondiera? Por ejemplo: "Centrarse en las mejores prácticas de Python", "Mantener un tono profesional" o "Proporcionar siempre fuentes para conclusiones importantes".'
            className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500 focus-visible:border-purple-500 min-h-[120px]"
            maxLength={3000}
          />
          <div className="flex items-center justify-end">
            <p className="text-xs text-[var(--theme-text-tertiary)]">
              {profileData.customInstructions.length}/3000
            </p>
          </div>
        </div>

          {/* Save status */}
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-purple-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Guardando...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Management Dialog */}
      <Dialog open={isDataManagementOpen} onOpenChange={setIsDataManagementOpen}>
        <DialogContent nested className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--theme-text-primary)]">Gestión de Datos</DialogTitle>
            <DialogDescription className="text-[var(--theme-text-tertiary)]">
              Gestiona tu información personal y configuración de cuenta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* User ID */}
            <div className="space-y-2">
              <Label className="text-[var(--theme-text-secondary)]">ID de usuario</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={user?.id || ''}
                  disabled
                  className="bg-[var(--theme-bg-tertiary)] border-[var(--theme-border)] text-[var(--theme-text-tertiary)]"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyUserId}
                  className="text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)]"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Personal Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[var(--theme-text-secondary)]">Nombre</Label>
                <Input
                  value={accountFormData.firstName}
                  onChange={(e) =>
                    setAccountFormData({ ...accountFormData, firstName: e.target.value })
                  }
                  placeholder="Ej: Juan"
                  className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--theme-text-secondary)]">Apellidos</Label>
                <Input
                  value={accountFormData.lastName}
                  onChange={(e) =>
                    setAccountFormData({ ...accountFormData, lastName: e.target.value })
                  }
                  placeholder="Ej: García López"
                  className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--theme-text-secondary)]">Correo electrónico</Label>
                <Input
                  value={accountFormData.email}
                  disabled
                  className="bg-[var(--theme-bg-tertiary)] border-[var(--theme-border)] text-[var(--theme-text-tertiary)]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--theme-text-secondary)]">Teléfono</Label>
                <Input
                  value={accountFormData.phone}
                  onChange={(e) =>
                    setAccountFormData({ ...accountFormData, phone: e.target.value })
                  }
                  placeholder="Ej: +34 600 000 000"
                  className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                />
              </div>
            </div>

            {/* Auto-save status */}
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-2 text-sm">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                    <span className="text-purple-400">Guardando...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Check className="h-4 w-4 text-green-400" />
                    <span className="text-green-400">Guardado</span>
                  </>
                )}
              </div>
            )}

            <Separator className="bg-[var(--theme-border)]" />

            {/* Danger Zone */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[var(--theme-text-primary)] font-medium">Cerrar sesión</p>
                  <p className="text-sm text-[var(--theme-text-tertiary)]">
                    Cerrar sesión en este dispositivo
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>

              <Separator className="bg-[var(--theme-border)]" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[var(--theme-text-primary)] font-medium">Eliminar cuenta</p>
                  <p className="text-sm text-[var(--theme-text-tertiary)]">
                    Esto eliminará tu cuenta y todos los datos.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Cuenta
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDataManagementOpen(false)}
              className="text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)]"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
