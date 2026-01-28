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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Loader2,
  Save,
  AlertTriangle,
  Check,
  X,
  Shield,
  LogOut,
} from 'lucide-react'

interface SecuritySectionProps {
  isInModal?: boolean
}

export function SecuritySection({ isInModal = false }: SecuritySectionProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
  const { data: sessions, isLoading, refetch } = api.sessions.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  )

  // Mutations
  const revokeSession = api.sessions.revoke.useMutation({
    onSuccess: () => {
      toast.success('Sesión cerrada')
      void refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setIsSaving(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) {
        toast.error('Error al cambiar la contraseña')
        return
      }

      toast.success('Contraseña actualizada correctamente')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch {
      toast.error('Error al cambiar la contraseña')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRevokeSession = (sessionId: string) => {
    if (confirm('¿Estás seguro de que quieres cerrar esta sesión?')) {
      revokeSession.mutate({ sessionId })
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      toast.success('Sesión cerrada correctamente')
      router.push('/login')
    } catch {
      toast.error('Error al cerrar sesión')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getPasswordStrength = (password: string): { level: number; label: string; color: string } => {
    if (password.length === 0) return { level: 0, label: '', color: '' }
    if (password.length < 6) return { level: 1, label: 'Débil', color: 'text-red-400' }
    if (password.length < 10) return { level: 2, label: 'Media', color: 'text-yellow-400' }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
      return { level: 2, label: 'Media', color: 'text-yellow-400' }
    }
    return { level: 3, label: 'Fuerte', color: 'text-green-400' }
  }

  const passwordStrength = getPasswordStrength(passwordData.newPassword)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  const passwordRequirements = [
    { met: passwordData.newPassword.length >= 8, text: 'Al menos 8 caracteres' },
    { met: /[A-Z]/.test(passwordData.newPassword), text: 'Una mayúscula' },
    { met: /[a-z]/.test(passwordData.newPassword), text: 'Una minúscula' },
    { met: /[0-9]/.test(passwordData.newPassword), text: 'Un número' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-[var(--theme-text-primary)]">Seguridad</h1>
        <p className="text-[var(--theme-text-secondary)]">
          Gestiona la seguridad de tu cuenta y sesiones activas
        </p>
      </div>

      {/* Logout Card */}
      <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-text-primary)]">Cerrar Sesión</CardTitle>
          <CardDescription className="text-[var(--theme-text-secondary)]">
            Cierra tu sesión actual en este dispositivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cerrando sesión...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-text-primary)]">Cambiar Contraseña</CardTitle>
          <CardDescription className="text-[var(--theme-text-secondary)]">
            Actualiza tu contraseña regularmente para mantener tu cuenta segura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-[var(--theme-text-secondary)]">
              Contraseña actual
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, currentPassword: e.target.value })
              }
              className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-[var(--theme-text-secondary)]">
              Nueva contraseña
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, newPassword: e.target.value })
              }
              className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
            />
            {passwordData.newPassword && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-2 bg-[var(--theme-bg-tertiary)] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      passwordStrength.level === 1
                        ? 'bg-red-500 w-1/3'
                        : passwordStrength.level === 2
                        ? 'bg-yellow-500 w-2/3'
                        : 'bg-green-500 w-full'
                    }`}
                  />
                </div>
                <span className={`text-sm ${passwordStrength.color}`}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-[var(--theme-text-secondary)]">
              Confirmar nueva contraseña
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
              className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
            />
          </div>

          {passwordData.newPassword && (
            <div className="p-4 rounded-lg bg-[var(--theme-bg-tertiary)] space-y-2">
              <p className="text-sm text-[var(--theme-text-tertiary)] mb-2">La contraseña debe incluir:</p>
              {passwordRequirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {req.met ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <X className="w-4 h-4 text-[var(--theme-text-tertiary)]" />
                  )}
                  <span className={req.met ? 'text-green-400' : 'text-[var(--theme-text-tertiary)]'}>
                    {req.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleChangePassword}
            disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Cambiar Contraseña
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-text-primary)]">Sesiones Activas</CardTitle>
          <CardDescription className="text-[var(--theme-text-secondary)]">
            Gestiona dónde has iniciado sesión con tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions && sessions.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-[var(--theme-text-tertiary)] mx-auto mb-4" />
              <p className="text-[var(--theme-text-tertiary)]">No hay sesiones activas registradas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions?.map((session) => {
                const isCurrent = false // TODO: Detectar sesión actual desde ctx.sessionToken
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[var(--theme-bg-tertiary)]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[var(--theme-text-primary)] font-medium">{session.device}</p>
                        {isCurrent && (
                          <Badge className="bg-green-500/20 text-green-400">Actual</Badge>
                        )}
                      </div>
                      <p className="text-sm text-[var(--theme-text-tertiary)] mt-1">
                        {session.location || 'Ubicación desconocida'} •{' '}
                        {new Date(session.lastActive).toLocaleString('es-ES')}
                      </p>
                    </div>
                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={revokeSession.isLoading}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        Cerrar sesión
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-yellow-500/10 border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-yellow-500 dark:text-yellow-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Autenticación de Dos Factores
          </CardTitle>
          <CardDescription className="text-[var(--theme-text-secondary)]">
            Añade una capa extra de seguridad a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-[var(--theme-text-secondary)] mb-4">
            La autenticación de dos factores (2FA) protege tu cuenta requiriendo un código
            adicional al iniciar sesión.
          </p>
          <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
            Configurar 2FA
          </Button>
        </CardContent>
      </Card>

      <Separator className="bg-[var(--theme-border)]" />

      <Card className="bg-red-500/10 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-500 dark:text-red-400">Eliminar Cuenta</CardTitle>
          <CardDescription className="text-[var(--theme-text-secondary)]">
            Esta acción es permanente y no se puede deshacer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-[var(--theme-text-secondary)] mb-4">
            Si eliminas tu cuenta, perderás acceso a todos tus debates, configuraciones y
            datos. Esta acción no se puede revertir.
          </p>
          <Button
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
          >
            Eliminar mi cuenta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}