'use client'

/**
 * ProfileTab Component
 *
 * Profile information form with auto-save functionality.
 * All account and profile data in a single view.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Copy, Check, Info } from 'lucide-react'
import { toast } from 'sonner'
import type { ProfileData } from '../types'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface ProfileTabProps {
  profileData: ProfileData
  onProfileChange: (data: ProfileData) => void
  isSaving: boolean
}

export function ProfileTab({ profileData, onProfileChange, isSaving }: ProfileTabProps) {
  const supabase = createClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [userIdCopied, setUserIdCopied] = useState(false)
  const [isUserIdDialogOpen, setIsUserIdDialogOpen] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialLoadRef = useRef(true)

  const [accountFormData, setAccountFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  // Get profile data from PostgreSQL via tRPC (source of truth)
  const { data: fetchedProfileData, isLoading: isLoadingProfile } = api.users.getProfile.useQuery()

  // Load user data
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      setUser(user)

      if (fetchedProfileData && !isLoadingProfile) {
        const fullName = fetchedProfileData.fullName || fetchedProfileData.name || ''
        const nameParts = fullName.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        const phone = user.user_metadata?.phone || user.phone || ''

        setAccountFormData({
          firstName: firstName || fetchedProfileData.name || '',
          lastName: lastName || '',
          email: fetchedProfileData.email || '',
          phone: phone,
        })

        setIsLoading(false)
        setTimeout(() => {
          initialLoadRef.current = false
        }, 100)
      } else if (!isLoadingProfile) {
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

  // Auto-save with debounce
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

  const handleCopyUserId = () => {
    if (user?.id) {
      void navigator.clipboard.writeText(user.id)
      setUserIdCopied(true)
      toast.success('ID de usuario copiado')
      setTimeout(() => setUserIdCopied(false), 2000)
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
      <Card className="relative overflow-hidden backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Perfil</CardTitle>
            <Dialog open={isUserIdDialogOpen} onOpenChange={setIsUserIdDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                >
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>ID de usuario</DialogTitle>
                  <DialogDescription>
                    Tu identificador único en Quoorum
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm text-center break-all">
                    {user?.id || ''}
                  </div>
                  <Button
                    onClick={handleCopyUserId}
                    className="w-full"
                    variant={userIdCopied ? 'default' : 'outline'}
                  >
                    {userIdCopied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar ID
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>
            Tu información personal y preferencias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name fields - 2 columns */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                value={accountFormData.firstName}
                onChange={(e) =>
                  setAccountFormData({ ...accountFormData, firstName: e.target.value })
                }
                placeholder="Ej: Juan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Apellidos</Label>
              <Input
                id="lastName"
                value={accountFormData.lastName}
                onChange={(e) =>
                  setAccountFormData({ ...accountFormData, lastName: e.target.value })
                }
                placeholder="Ej: García López"
              />
            </div>
          </div>

          {/* Email & Phone - 2 columns */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input
                value={accountFormData.email}
                disabled
                className="opacity-60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={accountFormData.phone}
                onChange={(e) =>
                  setAccountFormData({ ...accountFormData, phone: e.target.value })
                }
                placeholder="Ej: +34 600 000 000"
              />
            </div>
          </div>

          {/* Occupation - full width */}
          <div className="space-y-2">
            <Label htmlFor="occupation">Cargo</Label>
            <Input
              id="occupation"
              value={profileData.occupation}
              onChange={(e) => onProfileChange({ ...profileData, occupation: e.target.value })}
              placeholder="p. ej., CEO, Diseñador de Producto, Ingeniero de Software"
            />
          </div>

          {/* About */}
          <div className="space-y-2">
            <Label htmlFor="about">Más sobre ti</Label>
            <Textarea
              id="about"
              value={profileData.about}
              onChange={(e) => onProfileChange({ ...profileData, about: e.target.value })}
              placeholder="Tu información de fondo, preferencias o ubicación para ayudar a Quoorum a entenderte mejor"
              className="min-h-[100px]"
              maxLength={2000}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--theme-text-tertiary)]">
                Quoorum utiliza esta información para personalizar respuestas.
              </p>
              <p className="text-xs text-[var(--theme-text-tertiary)]">
                {profileData.about.length}/2000
              </p>
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="customInstructions">Instrucciones personalizadas</Label>
            <Textarea
              id="customInstructions"
              value={profileData.customInstructions}
              onChange={(e) => onProfileChange({ ...profileData, customInstructions: e.target.value })}
              placeholder='¿Cómo le gustaría que Quoorum respondiera? Por ejemplo: "Centrarse en las mejores prácticas de Python", "Mantener un tono profesional".'
              className="min-h-[120px]"
              maxLength={3000}
            />
            <div className="flex items-center justify-end">
              <p className="text-xs text-[var(--theme-text-tertiary)]">
                {profileData.customInstructions.length}/3000
              </p>
            </div>
          </div>

          {/* Save status */}
          {(isSaving || saveStatus !== 'idle') && (
            <div className="flex items-center gap-2 text-sm">
              {(isSaving || saveStatus === 'saving') && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                  <span className="text-purple-400">Guardando...</span>
                </>
              )}
              {saveStatus === 'saved' && !isSaving && (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400">Guardado</span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
