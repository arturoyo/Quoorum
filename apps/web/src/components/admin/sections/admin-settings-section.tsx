/**
 * Admin Settings Section
 * 
 * Configuración general del sistema (solo lectura por seguridad)
 * Muestra estado de variables de entorno, feature flags y límites
 */

'use client'

import { api } from '@/lib/trpc/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Database,
  Key,
  Globe,
  Server,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSettingsSectionProps {
  isInModal?: boolean
}

export function AdminSettingsSection({ isInModal = false }: AdminSettingsSectionProps) {
  // Get system configuration from API
  const { data: systemConfig, isLoading } = api.admin.getSystemConfig.useQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  if (!systemConfig) {
    return (
      <div className="text-center py-8 text-[#aebac1]">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-[#8696a0]" />
        <p>No se pudo cargar la configuración del sistema</p>
      </div>
    )
  }

  const { env: envStatus, features: featureFlags, limits: systemLimits } = systemConfig

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Configuración del Sistema</h2>
        <p className="text-sm text-[#aebac1] mt-1">
          Estado de integraciones y configuración general (solo lectura)
        </p>
      </div>

      {/* Environment Variables Status */}
      <Card className="bg-[#111b21] border-[#2a3942]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="h-5 w-5" />
            Variables de Entorno
          </CardTitle>
          <CardDescription className="text-[#aebac1]">
            Estado de las integraciones configuradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-[#2a3942] rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-[#aebac1]" />
                <span className="text-white">Base de Datos</span>
              </div>
              <Badge
                variant={envStatus.database ? 'default' : 'secondary'}
                className={cn(
                  envStatus.database
                    ? 'bg-green-900/20 text-green-300 border-green-500/30'
                    : 'bg-red-900/20 text-red-300 border-red-500/30'
                )}
              >
                {envStatus.database ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                {envStatus.database ? 'Configurado' : 'No configurado'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#2a3942] rounded-lg">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-[#aebac1]" />
                <span className="text-white">Supabase</span>
              </div>
              <Badge
                variant={envStatus.supabase ? 'default' : 'secondary'}
                className={cn(
                  envStatus.supabase
                    ? 'bg-green-900/20 text-green-300 border-green-500/30'
                    : 'bg-red-900/20 text-red-300 border-red-500/30'
                )}
              >
                {envStatus.supabase ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                {envStatus.supabase ? 'Configurado' : 'No configurado'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#2a3942] rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-[#aebac1]" />
                <span className="text-white">OpenAI</span>
              </div>
              <Badge
                variant={envStatus.openai ? 'default' : 'secondary'}
                className={cn(
                  envStatus.openai
                    ? 'bg-green-900/20 text-green-300 border-green-500/30'
                    : 'bg-red-900/20 text-red-300 border-red-500/30'
                )}
              >
                {envStatus.openai ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                {envStatus.openai ? 'Configurado' : 'No configurado'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#2a3942] rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-[#aebac1]" />
                <span className="text-white">Stripe</span>
              </div>
              <Badge
                variant={envStatus.stripe ? 'default' : 'secondary'}
                className={cn(
                  envStatus.stripe
                    ? 'bg-green-900/20 text-green-300 border-green-500/30'
                    : 'bg-yellow-900/20 text-yellow-300 border-yellow-500/30'
                )}
              >
                {envStatus.stripe ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {envStatus.stripe ? 'Configurado' : 'Opcional'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#2a3942] rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-[#aebac1]" />
                <span className="text-white">Resend (Email)</span>
              </div>
              <Badge
                variant={envStatus.resend ? 'default' : 'secondary'}
                className={cn(
                  envStatus.resend
                    ? 'bg-green-900/20 text-green-300 border-green-500/30'
                    : 'bg-yellow-900/20 text-yellow-300 border-yellow-500/30'
                )}
              >
                {envStatus.resend ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {envStatus.resend ? 'Configurado' : 'Opcional'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#2a3942] rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-[#aebac1]" />
                <span className="text-white">Pinecone</span>
              </div>
              <Badge
                variant={envStatus.pinecone ? 'default' : 'secondary'}
                className={cn(
                  envStatus.pinecone
                    ? 'bg-green-900/20 text-green-300 border-green-500/30'
                    : 'bg-yellow-900/20 text-yellow-300 border-yellow-500/30'
                )}
              >
                {envStatus.pinecone ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {envStatus.pinecone ? 'Configurado' : 'Opcional'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#2a3942] rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-[#aebac1]" />
                <span className="text-white">Redis</span>
              </div>
              <Badge
                variant={envStatus.redis ? 'default' : 'secondary'}
                className={cn(
                  envStatus.redis
                    ? 'bg-green-900/20 text-green-300 border-green-500/30'
                    : 'bg-yellow-900/20 text-yellow-300 border-yellow-500/30'
                )}
              >
                {envStatus.redis ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {envStatus.redis ? 'Configurado' : 'Opcional'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#2a3942] rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-[#aebac1]" />
                <span className="text-white">Serper (Web Search)</span>
              </div>
              <Badge
                variant={envStatus.serper ? 'default' : 'secondary'}
                className={cn(
                  envStatus.serper
                    ? 'bg-green-900/20 text-green-300 border-green-500/30'
                    : 'bg-yellow-900/20 text-yellow-300 border-yellow-500/30'
                )}
              >
                {envStatus.serper ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {envStatus.serper ? 'Configurado' : 'Opcional'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card className="bg-[#111b21] border-[#2a3942]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Feature Flags
          </CardTitle>
          <CardDescription className="text-[#aebac1]">
            Funcionalidades activas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(featureFlags).map(([key, enabled]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 bg-[#2a3942] rounded-lg"
              >
                <span className="text-white text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <Badge
                  variant={enabled ? 'default' : 'secondary'}
                  className={cn(
                    enabled
                      ? 'bg-green-900/20 text-green-300 border-green-500/30'
                      : 'bg-red-900/20 text-red-300 border-red-500/30'
                  )}
                >
                  {enabled ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Limits */}
      <Card className="bg-[#111b21] border-[#2a3942]">
        <CardHeader>
          <CardTitle className="text-white">Límites del Sistema por Plan</CardTitle>
          <CardDescription className="text-[#aebac1]">
            Límites de uso configurados para cada tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(systemLimits).map(([tier, limits]) => (
              <div key={tier} className="p-4 bg-[#2a3942] rounded-lg">
                <h3 className="text-white font-semibold mb-3 capitalize">{tier}</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div>
                    <span className="text-[#aebac1]">Debates/día:</span>
                    <span className="ml-2 text-white">
                      {limits.debatesPerDay === -1 ? 'Ilimitado' : limits.debatesPerDay}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#aebac1]">Debates/hora:</span>
                    <span className="ml-2 text-white">
                      {limits.debatesPerHour === -1 ? 'Ilimitado' : limits.debatesPerHour}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#aebac1]">Rondas/debate:</span>
                    <span className="ml-2 text-white">{limits.roundsPerDebate}</span>
                  </div>
                  <div>
                    <span className="text-[#aebac1]">Concurrentes:</span>
                    <span className="ml-2 text-white">{limits.maxConcurrentDebates}</span>
                  </div>
                  <div>
                    <span className="text-[#aebac1]">Costo máx/día:</span>
                    <span className="ml-2 text-white">${limits.maxCostPerDay}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <Card className="bg-purple-900/10 border-purple-500/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-purple-400 mt-0.5" />
            <div>
              <p className="text-sm text-purple-200 font-medium">
                Configuración de Solo Lectura
              </p>
              <p className="text-xs text-purple-300/80 mt-1">
                Las variables de entorno y límites del sistema se configuran en el servidor por
                seguridad. Contacta al administrador del sistema para realizar cambios.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
