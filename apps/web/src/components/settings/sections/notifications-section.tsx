'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  Loader2,
} from 'lucide-react'

interface NotificationsSectionProps {
  isInModal?: boolean
}

export function NotificationsSection({ isInModal = false }: NotificationsSectionProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Auth check (runs BEFORE query)
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!isInModal) {
          router.push('/login')
        }
        return
      }
      setIsAuthenticated(true)
    }
    checkAuth()
  }, [router, supabase.auth, isInModal])

  // Queries (only execute when authenticated)
  const { data: settings, isLoading } = api.notificationSettings.get.useQuery(
    undefined,
    { enabled: isAuthenticated }
  )

  // Mutations
  const updateSettings = api.notificationSettings.update.useMutation({
    onSuccess: () => {
      toast.success('Configuración guardada')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleToggle = (key: string, value: boolean) => {
    updateSettings.mutate({ [key]: value })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-[var(--theme-text-primary)]">Notificaciones</h1>
        <p className="text-[var(--theme-text-secondary)]">
          Configura cómo y cuándo quieres recibir notificaciones
        </p>
      </div>

      <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-text-primary)]">Notificaciones por Email</CardTitle>
          <CardDescription className="text-[var(--theme-text-secondary)]">
            Gestiona qué notificaciones recibes por correo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="emailNotifications" className="text-[var(--theme-text-primary)] font-medium">
                Notificaciones por email
              </Label>
              <p className="text-sm text-[var(--theme-text-tertiary)]">
                Recibir notificaciones importantes por correo
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={settings?.emailNotifications ?? true}
              onCheckedChange={(checked) => handleToggle('emailNotifications', checked)}
              disabled={updateSettings.isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="debateUpdates" className="text-[var(--theme-text-primary)] font-medium">
                Actualizaciones de debates
              </Label>
              <p className="text-sm text-[var(--theme-text-tertiary)]">
                Notificaciones cuando tus debates tengan actualizaciones
              </p>
            </div>
            <Switch
              id="debateUpdates"
              checked={settings?.debateUpdates ?? true}
              onCheckedChange={(checked) => handleToggle('debateUpdates', checked)}
              disabled={!settings?.emailNotifications || updateSettings.isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="weeklyDigest" className="text-[var(--theme-text-primary)] font-medium">
                Resumen semanal
              </Label>
              <p className="text-sm text-[var(--theme-text-tertiary)]">
                Recibe un resumen semanal de tus debates y actividad
              </p>
            </div>
            <Switch
              id="weeklyDigest"
              checked={settings?.weeklyDigest ?? true}
              onCheckedChange={(checked) => handleToggle('weeklyDigest', checked)}
              disabled={!settings?.emailNotifications || updateSettings.isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-text-primary)]">Notificaciones Push</CardTitle>
          <CardDescription className="text-[var(--theme-text-secondary)]">
            Notificaciones en tu navegador o dispositivo móvil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="pushNotifications" className="text-[var(--theme-text-primary)] font-medium">
                Notificaciones push
              </Label>
              <p className="text-sm text-[var(--theme-text-tertiary)]">
                Recibir notificaciones instantáneas en tu dispositivo
              </p>
            </div>
            <Switch
              id="pushNotifications"
              checked={settings?.pushNotifications ?? false}
              onCheckedChange={(checked) => handleToggle('pushNotifications', checked)}
              disabled={updateSettings.isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-text-primary)]">Seguridad y Marketing</CardTitle>
          <CardDescription className="text-[var(--theme-text-secondary)]">
            Alertas de seguridad y comunicaciones de marketing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="securityAlerts" className="text-[var(--theme-text-primary)] font-medium">
                Alertas de seguridad
              </Label>
              <p className="text-sm text-[var(--theme-text-tertiary)]">
                Notificaciones importantes sobre la seguridad de tu cuenta
              </p>
            </div>
            <Switch
              id="securityAlerts"
              checked={settings?.securityAlerts ?? true}
              onCheckedChange={(checked) => handleToggle('securityAlerts', checked)}
              disabled={updateSettings.isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="marketingEmails" className="text-[var(--theme-text-primary)] font-medium">
                Emails de marketing
              </Label>
              <p className="text-sm text-[var(--theme-text-tertiary)]">
                Novedades, actualizaciones y ofertas especiales
              </p>
            </div>
            <Switch
              id="marketingEmails"
              checked={settings?.marketingEmails ?? false}
              onCheckedChange={(checked) => handleToggle('marketingEmails', checked)}
              disabled={updateSettings.isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {updateSettings.isLoading && (
        <div className="flex items-center gap-2 text-sm text-[var(--theme-text-tertiary)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Guardando cambios...</span>
        </div>
      )}
    </div>
  )
}
