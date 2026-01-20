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
    <>
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Notificaciones por Email</CardTitle>
          <CardDescription>
            Gestiona qué notificaciones recibes por correo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="emailNotifications" className="text-white font-medium">
                Notificaciones por email
              </Label>
              <p className="text-sm text-gray-400">
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
              <Label htmlFor="debateUpdates" className="text-white font-medium">
                Actualizaciones de debates
              </Label>
              <p className="text-sm text-gray-400">
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
              <Label htmlFor="weeklyDigest" className="text-white font-medium">
                Resumen semanal
              </Label>
              <p className="text-sm text-gray-400">
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

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Notificaciones Push</CardTitle>
          <CardDescription>
            Notificaciones en tu navegador o dispositivo móvil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="pushNotifications" className="text-white font-medium">
                Notificaciones push
              </Label>
              <p className="text-sm text-gray-400">
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

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Seguridad y Marketing</CardTitle>
          <CardDescription>
            Alertas de seguridad y comunicaciones de marketing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="securityAlerts" className="text-white font-medium">
                Alertas de seguridad
              </Label>
              <p className="text-sm text-gray-400">
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
              <Label htmlFor="marketingEmails" className="text-white font-medium">
                Emails de marketing
              </Label>
              <p className="text-sm text-gray-400">
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
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Guardando cambios...</span>
        </div>
      )}
    </>
  )
}