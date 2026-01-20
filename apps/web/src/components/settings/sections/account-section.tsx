'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { Loader2, Save, Info } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AccountSectionProps {
  isInModal?: boolean
}

/**
 * Account Settings Section
 * Personal information and danger zone
 */
export function AccountSection({ isInModal = false }: AccountSectionProps) {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: '',
  })

  const supabase = createClient()

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
    router.push('/login')
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
      <Card className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5" />
        <CardHeader className="relative">
          <CardTitle className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            Información Personal
          </CardTitle>
          <CardDescription className="text-gray-400">
            Actualiza tu información de perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-blue-200">
                Nombre completo
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="bg-slate-900/60 backdrop-blur-sm border-purple-500/30 text-white focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="email" className="text-blue-200">
                  Email
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-slate-800 border-purple-500/30 text-white">
                      <p className="text-sm">
                        El email no se puede cambiar por seguridad. Contacta a soporte si necesitas cambiarlo.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="email"
                value={formData.email}
                disabled
                className="bg-slate-900/40 backdrop-blur-sm border-purple-500/20 text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-blue-200">
                Cargo
              </Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="bg-slate-900/60 backdrop-blur-sm border-purple-500/30 text-white focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="relative group overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
            {isSaving ? (
              <>
                <Loader2 className="relative mr-2 h-4 w-4 animate-spin" />
                <span className="relative">Guardando...</span>
              </>
            ) : (
              <>
                <Save className="relative mr-2 h-4 w-4" />
                <span className="relative">Guardar Cambios</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Separator className="bg-gradient-to-r from-purple-500/20 via-white/10 to-blue-500/20" />

      <Card className="relative overflow-hidden bg-red-950/40 backdrop-blur-xl border-red-500/30">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-red-900/5" />
        <CardHeader className="relative">
          <CardTitle className="bg-gradient-to-r from-red-300 to-red-500 bg-clip-text text-transparent">
            Zona de Peligro
          </CardTitle>
          <CardDescription className="text-gray-400">
            Acciones irreversibles para tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Cerrar sesión</p>
              <p className="text-sm text-gray-400">
                Cerrar sesión en este dispositivo
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="relative group overflow-hidden border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-400/70 transition-all"
            >
              <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur" />
              <span className="relative">Cerrar Sesión</span>
            </Button>
          </div>

          <Separator className="bg-red-500/20" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Eliminar cuenta</p>
              <p className="text-sm text-gray-400">
                Eliminar permanentemente tu cuenta y todos tus datos
              </p>
            </div>
            <Button
              variant="outline"
              className="relative group overflow-hidden border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-400/70 transition-all"
            >
              <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur" />
              <span className="relative">Eliminar Cuenta</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}