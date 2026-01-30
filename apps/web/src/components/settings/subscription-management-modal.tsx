'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogBody,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Clock,
  Sparkles,
  Search,
  Monitor,
  Presentation,
  Target,
  Triangle,
  List,
  Calendar,
  Building2,
  Shield,
  ExternalLink,
  Info,
  CheckCircle,
  Check,
  Loader2,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, styles } from '@/lib/utils'
import Link from 'next/link'

interface SubscriptionManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddCreditsClick?: () => void
}

const PLAN_FEATURES = {
  starter: {
    monthly: {
      price: 29, // 29�/mes por 3,500 cr�ditos
      credits: 3500,
      description: 'S�ntesis estrat�gica de alta calidad para el crecimiento recurrente',
      features: [
        { icon: Sparkles, text: '3,500 cr�ditos por mes', info: 'Cr�ditos mensuales incluidos en tu plan. Cada cr�dito equivale a $0.01 USD. Se usan para generar debates, an�lisis y s�ntesis de IA.' },
        { icon: Clock, text: '300 cr�ditos de actualizaci�n diarios', info: 'Cr�ditos que se restauran autom�ticamente cada d�a a las 01:00. Te permiten mantener tus datos actualizados sin consumir tu cuota mensual.' },
        { icon: Search, text: 'Modelos de IA est�ndar', info: 'Acceso a modelos de IA eficientes y econ�micos para an�lisis y generaci�n de contenido. Optimizados para balance entre calidad y coste.' },
        { icon: Target, text: 'Sistema de inyecci�n de contexto de 4 capas', info: 'Sistema avanzado que enriquece tus debates con contexto en 4 niveles: pregunta optimizada, b�squeda web, documentos subidos y contexto hist�rico.' },
        { icon: Presentation, text: 'Modelo de IA sintetizador', info: 'Informes finales de alta calidad generados con un modelo de IA sintetizador de �ltima generaci�n. Perfectos para presentar a clientes o usar en decisiones estrat�gicas.' },
        { icon: Triangle, text: 'Acceso anticipado a funciones beta', info: 'Prueba nuevas funciones antes que nadie. Acceso prioritario a caracter�sticas experimentales y la oportunidad de influir en el desarrollo.' },
      ],
    },
    yearly: {
      price: 290, // 290�/a�o por 3,500 cr�ditos/mes (29�/mes � 10 meses con descuento)
      credits: 3500,
      description: 'S�ntesis estrat�gica de alta calidad para el crecimiento recurrente',
      features: [
        { icon: Sparkles, text: '3,500 cr�ditos por mes', info: 'Cr�ditos mensuales incluidos en tu plan. Cada cr�dito equivale a $0.01 USD. Se usan para generar debates, an�lisis y s�ntesis de IA.' },
        { icon: Clock, text: '300 cr�ditos de actualizaci�n diarios', info: 'Cr�ditos que se restauran autom�ticamente cada d�a a las 01:00. Te permiten mantener tus datos actualizados sin consumir tu cuota mensual.' },
        { icon: Search, text: 'Modelos de IA est�ndar', info: 'Acceso a modelos de IA eficientes y econ�micos para an�lisis y generaci�n de contenido. Optimizados para balance entre calidad y coste.' },
        { icon: Target, text: 'Sistema de inyecci�n de contexto de 4 capas', info: 'Sistema avanzado que enriquece tus debates con contexto en 4 niveles: pregunta optimizada, b�squeda web, documentos subidos y contexto hist�rico.' },
        { icon: Presentation, text: 'Modelo de IA sintetizador', info: 'Informes finales de alta calidad generados con un modelo de IA sintetizador de �ltima generaci�n. Perfectos para presentar a clientes o usar en decisiones estrat�gicas.' },
        { icon: Triangle, text: 'Acceso anticipado a funciones beta', info: 'Prueba nuevas funciones antes que nadie. Acceso prioritario a caracter�sticas experimentales y la oportunidad de influir en el desarrollo.' },
      ],
    },
  },
  pro: {
    monthly: {
      price: 79, // 79�/mes por 10,000 cr�ditos
      credits: 10000,
      description: 'Inteligencia Corporativa de espectro completo para decisiones de alto impacto',
      features: [
        { icon: Sparkles, text: '+6,500 cr�ditos adicionales al mes', info: 'Total: 10,000 cr�ditos/mes (incluye todo lo de Starter). M�s capacidad para debates complejos y an�lisis extensos.' },
        { icon: Search, text: 'Modelos de IA especializados', info: 'Acceso a modelos de IA especializados de alto rendimiento. Optimizados para an�lisis corporativos complejos y decisiones estrat�gicas.' },
        { icon: Building2, text: 'Capa de Inteligencia Corporativa (7 departamentos)', info: 'Debates especializados por departamento: Marketing, Finanzas, RR.HH., Operaciones, Legal, IT y Ventas. Cada agente tiene expertise espec�fico del �rea.' },
        { icon: Target, text: 'Personalizaci�n de BasePrompts de departamento', info: 'Adapta los agentes a la cultura, valores y contexto espec�fico de tu empresa. Crea prompts base que reflejen tu forma de trabajar.' },
        { icon: Presentation, text: 'Exportaci�n a PDF', info: 'Exporta tus debates y an�lisis en formato PDF profesional. Incluye todos los mensajes, consenso final y recomendaciones. Listo para compartir con stakeholders.' },
        { icon: CheckCircle, text: 'Soporte prioritario', info: 'Atenci�n prioritaria en soporte t�cnico. Respuestas m�s r�pidas y acceso directo al equipo de soporte para resolver tus dudas urgentes.' },
      ],
    },
    yearly: {
      price: 790, // 790�/a�o por 10,000 cr�ditos/mes (79�/mes � 10 meses con descuento)
      credits: 10000,
      description: 'Inteligencia Corporativa de espectro completo para decisiones de alto impacto',
      features: [
        { icon: Sparkles, text: '+6,500 cr�ditos adicionales al mes', info: 'Total: 10,000 cr�ditos/mes (incluye todo lo de Starter). M�s capacidad para debates complejos y an�lisis extensos.' },
        { icon: Search, text: 'Modelos de IA especializados', info: 'Acceso a modelos de IA especializados de alto rendimiento. Optimizados para an�lisis corporativos complejos y decisiones estrat�gicas.' },
        { icon: Building2, text: 'Capa de Inteligencia Corporativa (7 departamentos)', info: 'Debates especializados por departamento: Marketing, Finanzas, RR.HH., Operaciones, Legal, IT y Ventas. Cada agente tiene expertise espec�fico del �rea.' },
        { icon: Target, text: 'Personalizaci�n de BasePrompts de departamento', info: 'Adapta los agentes a la cultura, valores y contexto espec�fico de tu empresa. Crea prompts base que reflejen tu forma de trabajar.' },
        { icon: Presentation, text: 'Exportaci�n a PDF', info: 'Exporta tus debates y an�lisis en formato PDF profesional. Incluye todos los mensajes, consenso final y recomendaciones. Listo para compartir con stakeholders.' },
        { icon: CheckCircle, text: 'Soporte prioritario', info: 'Atenci�n prioritaria en soporte t�cnico. Respuestas m�s r�pidas y acceso directo al equipo de soporte para resolver tus dudas urgentes.' },
      ],
    },
  },
  business: {
    monthly: {
      price: 199, // 199�/mes por 30,000 cr�ditos
      credits: 30000,
      description: 'Control estrat�gico empresarial y deliberaci�n ilimitada y segura',
      features: [
        { icon: Sparkles, text: '+20,000 cr�ditos adicionales al mes', info: 'Total: 30,000 cr�ditos/mes (incluye todo lo de Pro). Capacidad m�xima para uso intensivo en m�ltiples proyectos simult�neos.' },
        { icon: Search, text: 'Los mejores modelos de IA', info: 'Acceso a los modelos de IA m�s avanzados y potentes del mercado. M�xima calidad y precisi�n para decisiones empresariales cr�ticas.' },
        { icon: Building2, text: 'Panel de Administraci�n completo', info: 'Gestiona usuarios, monitorea cr�ditos y ajusta multiplicadores. Dashboard completo con m�tricas de uso, facturaci�n y configuraci�n avanzada.' },
        { icon: Target, text: 'Gesti�n de usuarios y equipos', info: 'Control total sobre acceso y permisos. Invita miembros del equipo, asigna roles y gestiona qui�n puede crear debates o acceder a informaci�n sensible.' },
        { icon: Monitor, text: 'Multiplicador de cr�dito ajustable', info: 'Optimiza el coste interno seg�n tus necesidades. Ajusta el multiplicador de cr�ditos para controlar el gasto por departamento o proyecto.' },
        { icon: Shield, text: 'SLA y seguridad de nivel empresarial', info: 'Garant�as de servicio y seguridad avanzada. Uptime garantizado, encriptaci�n de extremo a extremo, cumplimiento GDPR y auditor�as de seguridad regulares.' },
        { icon: CheckCircle, text: 'Soporte dedicado 24/7', info: 'Atenci�n exclusiva y soporte prioritario 24/7. Canal directo con el equipo t�cnico, respuesta garantizada en menos de 2 horas y soporte telef�nico para emergencias cr�ticas.' },
      ],
    },
    yearly: {
      price: 1990, // 1,990�/a�o por 30,000 cr�ditos/mes (199�/mes � 10 meses con descuento)
      credits: 30000,
      description: 'Control estrat�gico empresarial y deliberaci�n ilimitada y segura',
      features: [
        { icon: Sparkles, text: '+20,000 cr�ditos adicionales al mes', info: 'Total: 30,000 cr�ditos/mes (incluye todo lo de Pro). Capacidad m�xima para uso intensivo en m�ltiples proyectos simult�neos.' },
        { icon: Search, text: 'Los mejores modelos de IA', info: 'Acceso a los modelos de IA m�s avanzados y potentes del mercado. M�xima calidad y precisi�n para decisiones empresariales cr�ticas.' },
        { icon: Building2, text: 'Panel de Administraci�n completo', info: 'Gestiona usuarios, monitorea cr�ditos y ajusta multiplicadores. Dashboard completo con m�tricas de uso, facturaci�n y configuraci�n avanzada.' },
        { icon: Target, text: 'Gesti�n de usuarios y equipos', info: 'Control total sobre acceso y permisos. Invita miembros del equipo, asigna roles y gestiona qui�n puede crear debates o acceder a informaci�n sensible.' },
        { icon: Monitor, text: 'Multiplicador de cr�dito ajustable', info: 'Optimiza el coste interno seg�n tus necesidades. Ajusta el multiplicador de cr�ditos para controlar el gasto por departamento o proyecto.' },
        { icon: Shield, text: 'SLA y seguridad de nivel empresarial', info: 'Garant�as de servicio y seguridad avanzada. Uptime garantizado, encriptaci�n de extremo a extremo, cumplimiento GDPR y auditor�as de seguridad regulares.' },
        { icon: CheckCircle, text: 'Soporte dedicado 24/7', info: 'Atenci�n exclusiva y soporte prioritario 24/7. Canal directo con el equipo t�cnico, respuesta garantizada en menos de 2 horas y soporte telef�nico para emergencias cr�ticas.' },
      ],
    },
  },
}

// ============================================================================
// EST�NDAR QUOORUM: SISTEMA DE CR�DITOS
// ============================================================================
// Valor del Cr�dito: 0.01� (100 Cr�ditos = 1�)
// Multiplicador de Servicio: 1.75x (aplicado internamente al calcular cr�ditos desde coste API)
// F�rmula: Cr�ditos = ?(Coste API USD � 1.75) / 0.01?
// Precio del Plan: Precio base del tier + (cr�ditos seleccionados � 0.01�)
// ============================================================================

const CREDIT_PRICE_PER_UNIT = 0.01 // 0.01� por cr�dito
const CREDITS_PER_EURO = 100 // 100 cr�ditos por 1�
const SERVICE_MULTIPLIER = 1.75 // Multiplicador de servicio (1.75x) - usado internamente

// Funci�n para calcular precio basado en cr�ditos (en centavos de �)
function calculatePriceFromCredits(credits: number): number {
  // Precio en centavos de � = cr�ditos * 0.01 * 100
  return Math.round(credits * CREDIT_PRICE_PER_UNIT * 100)
}

// Funci�n para calcular cr�ditos basado en precio (en centavos de �)
function calculateCreditsFromPrice(priceInCents: number): number {
  // Cr�ditos = precio en centavos / (0.01 * 100)
  return Math.round(priceInCents / (CREDIT_PRICE_PER_UNIT * 100))
}

// Funci�n para calcular cr�ditos desde coste API USD (con multiplicador de servicio)
// Nota: Esta funci�n se usa internamente para calcular cr�ditos consumidos desde costes API
function calculateCreditsFromApiCost(apiCostUsd: number): number {
  // Cr�ditos = ?(Coste API USD � 1.75) / 0.01?
  // Convertir USD a � primero (1 USD � 0.92 �)
  const apiCostEur = apiCostUsd * 0.92
  return Math.ceil((apiCostEur * SERVICE_MULTIPLIER) / CREDIT_PRICE_PER_UNIT)
}

// Opciones de cr�ditos disponibles (generadas con la f�rmula)
const CREDIT_AMOUNTS = [
  8000,
  12000,
  16000,
  20000,
  40000,
  63000,
  85000,
  110000,
  170000,
  230000,
  350000,
  480000,
  1200000,
] as const

// Generar opciones con precios calculados
const CREDIT_OPTIONS = CREDIT_AMOUNTS.map((credits) => ({
  credits,
  price: calculatePriceFromCredits(credits),
})) as Array<{ credits: number; price: number }>

export function SubscriptionManagementModal({ open, onOpenChange, onAddCreditsClick }: SubscriptionManagementModalProps) {
  const router = useRouter()
  const [isYearly, setIsYearly] = useState(true) // Por defecto anual (m�s econ�mico)
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'business'>('pro')

  // Fetch current plan
  const { data: currentPlan } = api.billing.getCurrentPlan.useQuery(undefined, {
    enabled: open,
  })

  const currentTier = currentPlan?.tier || 'free'
  const currentPlanCredits = currentTier !== 'free' 
    ? (isYearly 
        ? PLAN_FEATURES[currentTier]?.yearly.credits
        : PLAN_FEATURES[currentTier]?.monthly.credits)
    : null

  // Initialize selected credits with current plan credits or default
  const [selectedCredits, setSelectedCredits] = useState<string>(
    currentPlanCredits?.toString() || '20000'
  )

  // Update selected credits when plan changes
  useEffect(() => {
    if (currentPlanCredits) {
      // Find the closest credit option
      const closest = CREDIT_OPTIONS.reduce((prev, curr) => {
        return Math.abs(curr.credits - currentPlanCredits) < Math.abs(prev.credits - currentPlanCredits)
          ? curr
          : prev
      })
      setSelectedCredits(closest.credits.toString())
    }
  }, [currentPlanCredits, isYearly])

  // Determine which plans to show based on current tier
  const availablePlans = currentTier === 'free' 
    ? ['starter', 'pro', 'business'] as const
    : currentTier === 'starter'
    ? ['pro', 'business'] as const
    : currentTier === 'pro'
    ? ['business'] as const
    : []

  const createCheckoutMutation = api.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      }
    },
    onError: (error) => {
      logger.error('Error creating checkout session:', error instanceof Error ? error : { error })
    },
  })

  const handleUpdatePlan = (planId: 'starter' | 'pro' | 'business') => {
    void createCheckoutMutation.mutateAsync({
      planId,
      successUrl: `${window.location.origin}/dashboard?success=true`,
      cancelUrl: `${window.location.origin}/settings?canceled=true`,
    })
  }

  const currentPlanData = PLAN_FEATURES[selectedPlan]?.[isYearly ? 'yearly' : 'monthly']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="styles.colors.bg.primary border-purple-500/20 max-w-6xl [&>button]:z-[201]">
        <DialogHeader className="border-b-0 pb-0">
          <DialogTitle className="text-2xl font-semibold styles.colors.text.primary">
            Gestionar tu suscripci�n
          </DialogTitle>
          <DialogDescription className="styles.colors.text.secondary">
            Elige el plan que mejor se adapte a tus necesidades
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Toggle Mensual/Anual */}
          <div className="flex items-center justify-center mb-8">
            <div className="inline-flex rounded-lg styles.colors.bg.tertiary p-1 border border-slate-700/50">
              <button
                type="button"
                onClick={() => setIsYearly(false)}
                className={cn(
                  'relative px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
                  !isYearly
                    ? 'styles.colors.bg.input/50 text-white'
                    : 'styles.colors.text.secondary hover:styles.colors.text.secondary'
                )}
              >
                Mensualmente
              </button>
              <button
                type="button"
                onClick={() => setIsYearly(true)}
                className={cn(
                  'relative px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
                  isYearly
                    ? 'styles.colors.bg.input/50 text-white'
                    : 'styles.colors.text.secondary hover:styles.colors.text.secondary'
                )}
              >
                <span>Anualmente</span>
                <span className={cn('ml-1.5 text-xs', isYearly ? 'opacity-80' : 'opacity-60')}>
                  � Ahorra 17%
                </span>
              </button>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Current Plan Card */}
            {currentTier !== 'free' && (
              <Card
                className={cn(
                  'relative overflow-hidden styles.colors.bg.tertiary backdrop-blur-xl border-blue-500'
                )}
              >
                <div className="absolute top-4 right-4">
                  <Badge className="bg-blue-500 styles.colors.text.primary">Plan Actual</Badge>
                </div>

                <CardHeader>
                  <CardTitle className="text-2xl font-semibold styles.colors.text.primary mb-2">
                    {currentTier === 'starter' ? 'Starter' :
                     currentTier === 'pro' ? 'Pro' :
                     currentTier === 'business' ? 'Business' : 'Free'}
                  </CardTitle>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <div className="relative h-12 overflow-hidden flex items-baseline">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={`${currentTier}-${currentPlanCredits}-${isYearly ? 'yearly' : 'monthly'}`}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="text-4xl font-bold styles.colors.text.primary block"
                          >
                            {(() => {
                              // Precio fijo del plan seg�n tier y periodicidad
                              const planPrice = isYearly 
                                ? (PLAN_FEATURES[currentTier]?.yearly.price || 0) / 12
                                : (PLAN_FEATURES[currentTier]?.monthly.price || 0)
                              return Math.round(planPrice)
                            })()}�
                          </motion.span>
                        </AnimatePresence>
                      </div>
                      <span className="styles.colors.text.secondary">/ mes</span>
                    </div>
                    <CardDescription className="styles.colors.text.secondary">
                      {isYearly 
                        ? PLAN_FEATURES[currentTier]?.yearly.description
                        : PLAN_FEATURES[currentTier]?.monthly.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">

                  {/* Features List */}
                  <ul className="space-y-3">
                    {/* Mostrar "Todo lo de Starter" para Pro y Business */}
                    {(currentTier === 'pro' || currentTier === 'business') && (
                      <li className="flex items-start gap-3 pb-2 border-b border-purple-500/20">
                        <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-green-400">Todo lo incluido en Starter</span>
                        </div>
                      </li>
                    )}
                    {/* Mostrar "Todo lo de Pro" solo para Business */}
                    {currentTier === 'business' && (
                      <li className="flex items-start gap-3 pb-2 border-b border-purple-500/20">
                        <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-green-400">Todo lo incluido en Pro</span>
                        </div>
                      </li>
                    )}
                    {(isYearly
                      ? PLAN_FEATURES[currentTier]?.yearly.features
                      : PLAN_FEATURES[currentTier]?.monthly.features)?.map((feature, index) => {
                      const Icon = feature.icon
                      return (
                        <li key={index} className="flex items-start gap-3">
                          <Icon className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-sm styles.colors.text.secondary">{feature.text}</span>
                            {feature.info && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-purple-400 cursor-help shrink-0 hover:text-purple-300 transition-colors" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs styles.colors.bg.tertiary border-purple-500/30 styles.colors.text.primary p-3">
                                    <p className="text-sm leading-relaxed">{feature.info}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>

                  {/* Update Button */}
                  <Button
                    disabled
                    className="w-full bg-blue-600 styles.colors.text.primary hover:bg-blue-700 cursor-not-allowed"
                  >
                    Plan Actual
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Upgrade Plan Cards - Solo mostrar tiers superiores al actual */}
            {availablePlans.length > 0 && availablePlans
              .filter((planId) => planId !== currentTier) // Asegurar que el tier actual no aparezca
              .map((planId) => {
                const planData = PLAN_FEATURES[planId]?.[isYearly ? 'yearly' : 'monthly']
                const monthlyPrice = planData?.price || 0
                const yearlyPrice = planData?.price || 0
                const displayPrice = isYearly ? yearlyPrice : monthlyPrice

                return (
                  <Card
                    key={planId}
                    className="relative overflow-hidden styles.colors.bg.tertiary backdrop-blur-xl border-purple-500/20 hover:border-purple-500/40"
                  >

                  <CardHeader>
                    <CardTitle className="text-2xl font-semibold styles.colors.text.primary mb-2">
                      {planId === 'starter' ? 'Starter' :
                       planId === 'pro' ? 'Pro' :
                       planId === 'business' ? 'Business' : 'Free'}
                    </CardTitle>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <div className="relative h-12 overflow-hidden flex items-baseline">
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={`${planId}-${planData?.credits}-${isYearly ? 'yearly' : 'monthly'}`}
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -20, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeOut' }}
                              className="text-4xl font-bold styles.colors.text.primary block"
                            >
                              {(() => {
                                // Precio fijo del plan seg�n tier y periodicidad
                                const planPrice = isYearly 
                                  ? (PLAN_FEATURES[planId]?.yearly.price || 0) / 12
                                  : (PLAN_FEATURES[planId]?.monthly.price || 0)
                                return Math.round(planPrice)
                              })()}�
                            </motion.span>
                          </AnimatePresence>
                        </div>
                        <span className="styles.colors.text.secondary">/ mes</span>
                      </div>
                      <CardDescription className="styles.colors.text.secondary">
                        {planData?.description}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">

                    {/* Features List */}
                    <ul className="space-y-3">
                      {/* Mostrar "Todo lo de Starter" para Pro y Business */}
                      {(planId === 'pro' || planId === 'business') && (
                        <li className="flex items-start gap-3 pb-2 border-b border-purple-500/20">
                          <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-green-400">Todo lo incluido en Starter</span>
                          </div>
                        </li>
                      )}
                      {/* Mostrar "Todo lo de Pro" solo para Business */}
                      {planId === 'business' && (
                        <li className="flex items-start gap-3 pb-2 border-b border-purple-500/20">
                          <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-green-400">Todo lo incluido en Pro</span>
                          </div>
                        </li>
                      )}
                      {planData?.features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                          <li key={index} className="flex items-start gap-3">
                            <Icon className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                            <div className="flex-1 flex items-center gap-2">
                              <span className="text-sm styles.colors.text.secondary">{feature.text}</span>
                              {feature.info && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-4 w-4 text-purple-400 cursor-help shrink-0 hover:text-purple-300 transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs styles.colors.bg.tertiary border-purple-500/30 styles.colors.text.primary p-3">
                                      <p className="text-sm leading-relaxed">{feature.info}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>

                    {/* Upgrade Button */}
                    <Button
                      onClick={() => handleUpdatePlan(planId)}
                      disabled={createCheckoutMutation.isPending}
                      className="w-full bg-purple-600 text-white hover:bg-purple-700"
                    >
                      {createCheckoutMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        'Actualizar Plan'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Additional Sections */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Team Section */}
            <Card className="styles.colors.bg.tertiary border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Building2 className="h-6 w-6 text-purple-400 shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold styles.colors.text.primary mb-1">
                      Team
                    </h4>
                    <p className="text-sm styles.colors.text.secondary mb-4">
                      Aumenta la productividad de tu equipo con Quoorum
                    </p>
                    <Button
                      variant="outline"
                      className="w-full bg-white text-slate-900 hover:bg-gray-100"
                      onClick={() => {
                        // Cerrar el modal de suscripci�n primero
                        if (onOpenChange) {
                          onOpenChange(false)
                        }
                        // Abrir el modal de Team Upgrade despu�s de un breve delay
                        setTimeout(() => {
                          // Disparar evento para abrir TeamUpgradeModal
                          window.dispatchEvent(new CustomEvent('openTeamUpgradeModal'))
                        }, 200)
                      }}
                    >
                      Obtener Equipo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expand Credit Limit */}
            <Card className="styles.colors.bg.tertiary border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Sparkles className="h-6 w-6 text-purple-400 shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold styles.colors.text.primary mb-1">
                      Ampliar l�mite de cr�ditos
                    </h4>
                    <p className="text-sm styles.colors.text.secondary mb-4">
                      Actualiza tus cr�ditos mensuales
                    </p>
                    <Button
                      variant="outline"
                      className="w-full bg-white text-slate-900 hover:bg-gray-100"
                      onClick={() => {
                        onAddCreditsClick?.()
                      }}
                    >
                      A�adir cr�ditos
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security and Compliance */}
          <Card className="styles.colors.bg.tertiary border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Shield className="h-6 w-6 text-purple-400 shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-lg font-semibold styles.colors.text.primary mb-1">
                    Seguridad y Cumplimiento
                  </h4>
                  <p className="text-sm styles.colors.text.secondary mb-4">
                    Seguridad de nivel empresarial y certificaciones est�ndar de la industria.
                  </p>
                  <div className="flex items-center gap-4 mb-4">
                    <Badge className="styles.colors.bg.input styles.colors.text.secondary">AICPA SOC 2</Badge>
                    <Badge className="styles.colors.bg.input styles.colors.text.secondary">ISO 27701</Badge>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-white text-slate-900 hover:bg-gray-100"
                  >
                    Aprende m�s
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogBody>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6 pt-4 border-t styles.colors.border.default flex-shrink-0">
          <div className="text-sm styles.colors.text.secondary">
            �Tienes un problema? Ve al{' '}
            <Link href="/help" className="text-purple-400 hover:text-purple-300 underline">
              Centro de Ayuda
            </Link>
            .
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/settings/billing"
              className="text-sm styles.colors.text.secondary hover:styles.colors.text.primary transition-colors"
            >
              Degr�dese a Gratis
            </Link>
            <Link
              href="/settings/billing"
              className="text-sm styles.colors.text.secondary hover:styles.colors.text.primary transition-colors"
            >
              Editar facturaci�n &gt;
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
