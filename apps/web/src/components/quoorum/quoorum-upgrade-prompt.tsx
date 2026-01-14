'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  MessageCircle,
  TrendingUp,
  Sparkles,
  Target,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

interface ForumUpgradePromptProps {
  addonInfo: {
    id?: string
    name?: string
    description?: string
    monthlyPrice?: number
  }
}

export function ForumUpgradePrompt({ addonInfo }: ForumUpgradePromptProps) {
  const [isSubscribing, setIsSubscribing] = useState(false)

  const handleSubscribe = async () => {
    setIsSubscribing(true)
    // TODO: Integrate with payment provider
    setTimeout(() => {
      toast.success('¡Forum Estratégico activado!')
      setIsSubscribing(false)
    }, 1500)
  }

  const features = [
    {
      icon: Users,
      title: 'Panel de Expertos IA',
      description: 'Expertos especializados debaten tus decisiones estratégicas',
    },
    {
      icon: MessageCircle,
      title: 'Debates en Tiempo Real',
      description: 'Observa cómo los expertos analizan y debaten tu pregunta',
    },
    {
      icon: TrendingUp,
      title: 'Análisis de Consenso',
      description: 'Ve el nivel de acuerdo y las diferentes perspectivas',
    },
    {
      icon: Target,
      title: 'Recomendaciones Accionables',
      description: 'Obtén estrategias claras con puntos a favor y en contra',
    },
    {
      icon: BarChart3,
      title: 'Analytics y Historial',
      description: 'Accede a todos tus debates anteriores y estadísticas',
    },
    {
      icon: Sparkles,
      title: 'Asesoría Automática',
      description: 'Forum asesora automáticamente en conversaciones complejas',
    },
  ]

  const useCases = [
    '¿A qué precio debo lanzar mi producto?',
    '¿Cómo responder a esta objeción del cliente VIP?',
    '¿Debo aceptar esta contraoferta?',
    '¿Cuál es mi mejor estrategia de negociación?',
    '¿Cómo posicionarme frente a la competencia?',
  ]

  return (
    <div className="flex min-h-screen flex-col bg-[#0b141a]">
      {/* Header */}
      <div className="border-b border-[#2a3942] bg-[#202c33] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#e9edef]">Forum Estratégico</h1>
            <p className="text-sm text-[#8696a0]">
              Panel de expertos IA para decisiones estratégicas
            </p>
          </div>
          <Badge variant="outline" className="border-purple-500 text-purple-400">
            Add-on Premium
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Hero Card */}
          <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-[#202c33] to-[#00a884]/10">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20">
                <Users className="h-8 w-8 text-purple-400" />
              </div>
              <CardTitle className="text-2xl text-[#e9edef]">
                {addonInfo.name || 'Forum Estratégico'}
              </CardTitle>
              <CardDescription className="text-base text-[#8696a0]">
                {addonInfo.description ||
                  'Panel de expertos IA para decisiones estratégicas. Debates en tiempo real.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <span className="text-4xl font-bold text-purple-400">
                  {addonInfo.monthlyPrice || 39}€
                </span>
                <span className="text-[#8696a0]">/mes</span>
              </div>

              <Button
                onClick={handleSubscribe}
                disabled={isSubscribing}
                size="lg"
                className="bg-purple-500 px-8 hover:bg-purple-600"
              >
                {isSubscribing ? (
                  <>
                    <Zap className="mr-2 h-4 w-4 animate-pulse" />
                    Activando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Activar Forum Estratégico
                  </>
                )}
              </Button>

              <p className="mt-3 text-xs text-[#8696a0]">
                Se añadirá a tu suscripción actual. Cancela cuando quieras.
              </p>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[#e9edef]">¿Qué incluye?</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="border-[#2a3942] bg-[#202c33]">
                  <CardContent className="p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                      <feature.icon className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="mb-1 font-medium text-[#e9edef]">{feature.title}</h3>
                    <p className="text-sm text-[#8696a0]">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Use Cases */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[#e9edef]">Ejemplos de uso</h2>
            <Card className="border-[#2a3942] bg-[#202c33]">
              <CardContent className="p-4">
                <ul className="space-y-3">
                  {useCases.map((useCase) => (
                    <li key={useCase} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#00a884]" />
                      <span className="text-[#e9edef]">{useCase}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Limits by Plan */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[#e9edef]">Límites por plan</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-[#2a3942] bg-[#202c33]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-[#e9edef]">Starter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-[#8696a0]">
                  <p>• 10 debates/mes</p>
                  <p>• Hasta 4 expertos</p>
                  <p>• Hasta 3 rondas</p>
                </CardContent>
              </Card>
              <Card className="border-[#00a884]/30 bg-[#202c33]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-[#00a884]">Pro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-[#8696a0]">
                  <p>• 30 debates/mes</p>
                  <p>• Hasta 6 expertos</p>
                  <p>• Hasta 5 rondas</p>
                </CardContent>
              </Card>
              <Card className="border-purple-500/30 bg-[#202c33]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-purple-400">Business</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-[#8696a0]">
                  <p>• Debates ilimitados</p>
                  <p>• Hasta 10 expertos</p>
                  <p>• Hasta 10 rondas</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              size="lg"
              className="bg-purple-500 px-8 hover:bg-purple-600"
            >
              {isSubscribing ? 'Activando...' : 'Activar Forum Estratégico'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="mt-4 text-sm text-[#8696a0]">
              ¿Tienes dudas?{' '}
              <Link href="/settings/addons" className="text-[#00a884] hover:underline">
                Ver todos los add-ons
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
