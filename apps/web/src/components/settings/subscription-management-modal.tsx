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
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface SubscriptionManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddCreditsClick?: () => void
}

const PLAN_FEATURES = {
  starter: {
    monthly: {
      price: 29, // 29€/mes por 3,500 créditos
      credits: 3500,
      description: 'Síntesis estratégica de alta calidad para el crecimiento recurrente',
      features: [
        { icon: Sparkles, text: '3,500 créditos por mes', info: 'Créditos mensuales incluidos en tu plan. Cada crédito equivale a $0.01 USD. Se usan para generar debates, análisis y síntesis de IA.' },
        { icon: Clock, text: '300 créditos de actualización diarios', info: 'Créditos que se restauran automáticamente cada día a las 01:00. Te permiten mantener tus datos actualizados sin consumir tu cuota mensual.' },
        { icon: Search, text: 'Modelos de IA estándar', info: 'Acceso a modelos de IA eficientes y económicos para análisis y generación de contenido. Optimizados para balance entre calidad y coste.' },
        { icon: Target, text: 'Sistema de inyección de contexto de 4 capas', info: 'Sistema avanzado que enriquece tus debates con contexto en 4 niveles: pregunta optimizada, búsqueda web, documentos subidos y contexto histórico.' },
        { icon: Presentation, text: 'Modelo de IA sintetizador', info: 'Informes finales de alta calidad generados con un modelo de IA sintetizador de última generación. Perfectos para presentar a clientes o usar en decisiones estratégicas.' },
        { icon: Triangle, text: 'Acceso anticipado a funciones beta', info: 'Prueba nuevas funciones antes que nadie. Acceso prioritario a características experimentales y la oportunidad de influir en el desarrollo.' },
      ],
    },
    yearly: {
      price: 290, // 290€/año por 3,500 créditos/mes (29€/mes × 10 meses con descuento)
      credits: 3500,
      description: 'Síntesis estratégica de alta calidad para el crecimiento recurrente',
      features: [
        { icon: Sparkles, text: '3,500 créditos por mes', info: 'Créditos mensuales incluidos en tu plan. Cada crédito equivale a $0.01 USD. Se usan para generar debates, análisis y síntesis de IA.' },
        { icon: Clock, text: '300 créditos de actualización diarios', info: 'Créditos que se restauran automáticamente cada día a las 01:00. Te permiten mantener tus datos actualizados sin consumir tu cuota mensual.' },
        { icon: Search, text: 'Modelos de IA estándar', info: 'Acceso a modelos de IA eficientes y económicos para análisis y generación de contenido. Optimizados para balance entre calidad y coste.' },
        { icon: Target, text: 'Sistema de inyección de contexto de 4 capas', info: 'Sistema avanzado que enriquece tus debates con contexto en 4 niveles: pregunta optimizada, búsqueda web, documentos subidos y contexto histórico.' },
        { icon: Presentation, text: 'Modelo de IA sintetizador', info: 'Informes finales de alta calidad generados con un modelo de IA sintetizador de última generación. Perfectos para presentar a clientes o usar en decisiones estratégicas.' },
        { icon: Triangle, text: 'Acceso anticipado a funciones beta', info: 'Prueba nuevas funciones antes que nadie. Acceso prioritario a características experimentales y la oportunidad de influir en el desarrollo.' },
      ],
    },
  },
  pro: {
    monthly: {
      price: 79, // 79€/mes por 10,000 créditos
      credits: 10000,
      description: 'Inteligencia Corporativa de espectro completo para decisiones de alto impacto',
      features: [
        { icon: Sparkles, text: '+6,500 créditos adicionales al mes', info: 'Total: 10,000 créditos/mes (incluye todo lo de Starter). Más capacidad para debates complejos y análisis extensos.' },
        { icon: Search, text: 'Modelos de IA especializados', info: 'Acceso a modelos de IA especializados de alto rendimiento. Optimizados para análisis corporativos complejos y decisiones estratégicas.' },
        { icon: Building2, text: 'Capa de Inteligencia Corporativa (7 departamentos)', info: 'Debates especializados por departamento: Marketing, Finanzas, RR.HH., Operaciones, Legal, IT y Ventas. Cada agente tiene expertise específico del área.' },
        { icon: Target, text: 'Personalización de BasePrompts de departamento', info: 'Adapta los agentes a la cultura, valores y contexto específico de tu empresa. Crea prompts base que reflejen tu forma de trabajar.' },
        { icon: Presentation, text: 'Exportación a PDF', info: 'Exporta tus debates y análisis en formato PDF profesional. Incluye todos los mensajes, consenso final y recomendaciones. Listo para compartir con stakeholders.' },
        { icon: CheckCircle, text: 'Soporte prioritario', info: 'Atención prioritaria en soporte técnico. Respuestas más rápidas y acceso directo al equipo de soporte para resolver tus dudas urgentes.' },
      ],
    },
    yearly: {
      price: 790, // 790€/año por 10,000 créditos/mes (79€/mes × 10 meses con descuento)
      credits: 10000,
      description: 'Inteligencia Corporativa de espectro completo para decisiones de alto impacto',
      features: [
        { icon: Sparkles, text: '+6,500 créditos adicionales al mes', info: 'Total: 10,000 créditos/mes (incluye todo lo de Starter). Más capacidad para debates complejos y análisis extensos.' },
        { icon: Search, text: 'Modelos de IA especializados', info: 'Acceso a modelos de IA especializados de alto rendimiento. Optimizados para análisis corporativos complejos y decisiones estratégicas.' },
        { icon: Building2, text: 'Capa de Inteligencia Corporativa (7 departamentos)', info: 'Debates especializados por departamento: Marketing, Finanzas, RR.HH., Operaciones, Legal, IT y Ventas. Cada agente tiene expertise específico del área.' },
        { icon: Target, text: 'Personalización de BasePrompts de departamento', info: 'Adapta los agentes a la cultura, valores y contexto específico de tu empresa. Crea prompts base que reflejen tu forma de trabajar.' },
        { icon: Presentation, text: 'Exportación a PDF', info: 'Exporta tus debates y análisis en formato PDF profesional. Incluye todos los mensajes, consenso final y recomendaciones. Listo para compartir con stakeholders.' },
        { icon: CheckCircle, text: 'Soporte prioritario', info: 'Atención prioritaria en soporte técnico. Respuestas más rápidas y acceso directo al equipo de soporte para resolver tus dudas urgentes.' },
      ],
    },
  },
  business: {
    monthly: {
      price: 199, // 199€/mes por 30,000 créditos
      credits: 30000,
      description: 'Control estratégico empresarial y deliberación ilimitada y segura',
      features: [
        { icon: Sparkles, text: '+20,000 créditos adicionales al mes', info: 'Total: 30,000 créditos/mes (incluye todo lo de Pro). Capacidad máxima para uso intensivo en múltiples proyectos simultáneos.' },
        { icon: Search, text: 'Los mejores modelos de IA', info: 'Acceso a los modelos de IA más avanzados y potentes del mercado. Máxima calidad y precisión para decisiones empresariales críticas.' },
        { icon: Building2, text: 'Panel de Administración completo', info: 'Gestiona usuarios, monitorea créditos y ajusta multiplicadores. Dashboard completo con métricas de uso, facturación y configuración avanzada.' },
        { icon: Target, text: 'Gestión de usuarios y equipos', info: 'Control total sobre acceso y permisos. Invita miembros del equipo, asigna roles y gestiona quién puede crear debates o acceder a información sensible.' },
        { icon: Monitor, text: 'Multiplicador de crédito ajustable', info: 'Optimiza el coste interno según tus necesidades. Ajusta el multiplicador de créditos para controlar el gasto por departamento o proyecto.' },
        { icon: Shield, text: 'SLA y seguridad de nivel empresarial', info: 'Garantías de servicio y seguridad avanzada. Uptime garantizado, encriptación de extremo a extremo, cumplimiento GDPR y auditorías de seguridad regulares.' },
        { icon: CheckCircle, text: 'Soporte dedicado 24/7', info: 'Atención exclusiva y soporte prioritario 24/7. Canal directo con el equipo técnico, respuesta garantizada en menos de 2 horas y soporte telefónico para emergencias críticas.' },
      ],
    },
    yearly: {
      price: 1990, // 1,990€/año por 30,000 créditos/mes (199€/mes × 10 meses con descuento)
      credits: 30000,
      description: 'Control estratégico empresarial y deliberación ilimitada y segura',
      features: [
        { icon: Sparkles, text: '+20,000 créditos adicionales al mes', info: 'Total: 30,000 créditos/mes (incluye todo lo de Pro). Capacidad máxima para uso intensivo en múltiples proyectos simultáneos.' },
        { icon: Search, text: 'Los mejores modelos de IA', info: 'Acceso a los modelos de IA más avanzados y potentes del mercado. Máxima calidad y precisión para decisiones empresariales críticas.' },
        { icon: Building2, text: 'Panel de Administración completo', info: 'Gestiona usuarios, monitorea créditos y ajusta multiplicadores. Dashboard completo con métricas de uso, facturación y configuración avanzada.' },
        { icon: Target, text: 'Gestión de usuarios y equipos', info: 'Control total sobre acceso y permisos. Invita miembros del equipo, asigna roles y gestiona quién puede crear debates o acceder a información sensible.' },
        { icon: Monitor, text: 'Multiplicador de crédito ajustable', info: 'Optimiza el coste interno según tus necesidades. Ajusta el multiplicador de créditos para controlar el gasto por departamento o proyecto.' },
        { icon: Shield, text: 'SLA y seguridad de nivel empresarial', info: 'Garantías de servicio y seguridad avanzada. Uptime garantizado, encriptación de extremo a extremo, cumplimiento GDPR y auditorías de seguridad regulares.' },
        { icon: CheckCircle, text: 'Soporte dedicado 24/7', info: 'Atención exclusiva y soporte prioritario 24/7. Canal directo con el equipo técnico, respuesta garantizada en menos de 2 horas y soporte telefónico para emergencias críticas.' },
      ],
    },
  },
}

// ============================================================================
// ESTÁNDAR QUOORUM: SISTEMA DE CRÉDITOS
// ============================================================================
// Valor del Crédito: 0.01€ (100 Créditos = 1€)
// Multiplicador de Servicio: 1.75x (aplicado internamente al calcular créditos desde coste API)
// Fórmula: Créditos = ⌈(Coste API USD × 1.75) / 0.01⌉
// Precio del Plan: Precio base del tier + (créditos seleccionados × 0.01€)
// ============================================================================

const CREDIT_PRICE_PER_UNIT = 0.01 // 0.01€ por crédito
const CREDITS_PER_EURO = 100 // 100 créditos por 1€
const SERVICE_MULTIPLIER = 1.75 // Multiplicador de servicio (1.75x) - usado internamente

// Función para calcular precio basado en créditos (en centavos de €)
function calculatePriceFromCredits(credits: number): number {
  // Precio en centavos de € = créditos * 0.01 * 100
  return Math.round(credits * CREDIT_PRICE_PER_UNIT * 100)
}

// Función para calcular créditos basado en precio (en centavos de €)
function calculateCreditsFromPrice(priceInCents: number): number {
  // Créditos = precio en centavos / (0.01 * 100)
  return Math.round(priceInCents / (CREDIT_PRICE_PER_UNIT * 100))
}

// Función para calcular créditos desde coste API USD (con multiplicador de servicio)
// Nota: Esta función se usa internamente para calcular créditos consumidos desde costes API
function calculateCreditsFromApiCost(apiCostUsd: number): number {
  // Créditos = ⌈(Coste API USD × 1.75) / 0.01⌉
  // Convertir USD a € primero (1 USD ≈ 0.92 €)
  const apiCostEur = apiCostUsd * 0.92
  return Math.ceil((apiCostEur * SERVICE_MULTIPLIER) / CREDIT_PRICE_PER_UNIT)
}

// Opciones de créditos disponibles (generadas con la fórmula)
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
  const [isYearly, setIsYearly] = useState(true) // Por defecto anual (más económico)
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
      <DialogContent className="bg-slate-900 border-purple-500/20 max-w-6xl [&>button]:z-[201]">
        <DialogHeader className="border-b-0 pb-0">
          <DialogTitle className="text-2xl font-semibold text-white">
            Gestionar tu suscripción
          </DialogTitle>
          <DialogDescription className="text-[var(--theme-text-secondary)]">
            Elige el plan que mejor se adapte a tus necesidades
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Toggle Mensual/Anual */}
          <div className="flex items-center justify-center mb-8">
            <div className="inline-flex rounded-lg bg-slate-800/50 p-1 border border-slate-700/50">
              <button
                type="button"
                onClick={() => setIsYearly(false)}
                className={cn(
                  'relative px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
                  !isYearly
                    ? 'bg-slate-700/50 text-white'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-secondary)]'
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
                    ? 'bg-slate-700/50 text-white'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-secondary)]'
                )}
              >
                <span>Anualmente</span>
                <span className={cn('ml-1.5 text-xs', isYearly ? 'opacity-80' : 'opacity-60')}>
                  · Ahorra 17%
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
                  'relative overflow-hidden bg-slate-800/50 backdrop-blur-xl border-blue-500'
                )}
              >
                <div className="absolute top-4 right-4">
                  <Badge className="bg-blue-500 text-white">Plan Actual</Badge>
                </div>

                <CardHeader>
                  <CardTitle className="text-2xl font-semibold text-white mb-2">
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
                            className="text-4xl font-bold text-white block"
                          >
                            {(() => {
                              // Precio fijo del plan según tier y periodicidad
                              const planPrice = isYearly 
                                ? (PLAN_FEATURES[currentTier]?.yearly.price || 0) / 12
                                : (PLAN_FEATURES[currentTier]?.monthly.price || 0)
                              return Math.round(planPrice)
                            })()}€
                          </motion.span>
                        </AnimatePresence>
                      </div>
                      <span className="text-[var(--theme-text-secondary)]">/ mes</span>
                    </div>
                    <CardDescription className="text-[var(--theme-text-secondary)]">
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
                            <span className="text-sm text-[var(--theme-text-secondary)]">{feature.text}</span>
                            {feature.info && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-purple-400 cursor-help shrink-0 hover:text-purple-300 transition-colors" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs bg-slate-800 border-purple-500/30 text-white p-3">
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
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 cursor-not-allowed"
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
                    className="relative overflow-hidden bg-slate-800/50 backdrop-blur-xl border-purple-500/20 hover:border-purple-500/40"
                  >

                  <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-white mb-2">
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
                              className="text-4xl font-bold text-white block"
                            >
                              {(() => {
                                // Precio fijo del plan según tier y periodicidad
                                const planPrice = isYearly 
                                  ? (PLAN_FEATURES[planId]?.yearly.price || 0) / 12
                                  : (PLAN_FEATURES[planId]?.monthly.price || 0)
                                return Math.round(planPrice)
                              })()}€
                            </motion.span>
                          </AnimatePresence>
                        </div>
                        <span className="text-[var(--theme-text-secondary)]">/ mes</span>
                      </div>
                      <CardDescription className="text-[var(--theme-text-secondary)]">
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
                              <span className="text-sm text-[var(--theme-text-secondary)]">{feature.text}</span>
                              {feature.info && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-4 w-4 text-purple-400 cursor-help shrink-0 hover:text-purple-300 transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs bg-slate-800 border-purple-500/30 text-white p-3">
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
            <Card className="bg-slate-800/50 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Building2 className="h-6 w-6 text-purple-400 shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">
                      Team
                    </h4>
                    <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
                      Aumenta la productividad de tu equipo con Quoorum
                    </p>
                    <Button
                      variant="outline"
                      className="w-full bg-white text-slate-900 hover:bg-gray-100"
                      onClick={() => {
                        // Cerrar el modal de suscripción primero
                        if (onOpenChange) {
                          onOpenChange(false)
                        }
                        // Abrir el modal de Team Upgrade después de un breve delay
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
            <Card className="bg-slate-800/50 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Sparkles className="h-6 w-6 text-purple-400 shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">
                      Ampliar límite de créditos
                    </h4>
                    <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
                      Actualiza tus créditos mensuales
                    </p>
                    <Button
                      variant="outline"
                      className="w-full bg-white text-slate-900 hover:bg-gray-100"
                      onClick={() => {
                        onAddCreditsClick?.()
                      }}
                    >
                      Añadir créditos
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security and Compliance */}
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Shield className="h-6 w-6 text-purple-400 shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-1">
                    Seguridad y Cumplimiento
                  </h4>
                  <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
                    Seguridad de nivel empresarial y certificaciones estándar de la industria.
                  </p>
                  <div className="flex items-center gap-4 mb-4">
                    <Badge className="bg-slate-700 text-[var(--theme-text-secondary)]">AICPA SOC 2</Badge>
                    <Badge className="bg-slate-700 text-[var(--theme-text-secondary)]">ISO 27701</Badge>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-white text-slate-900 hover:bg-gray-100"
                  >
                    Aprende más
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogBody>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6 pt-4 border-t border-white/10 flex-shrink-0">
          <div className="text-sm text-[var(--theme-text-secondary)]">
            ¿Tienes un problema? Ve al{' '}
            <Link href="/help" className="text-purple-400 hover:text-purple-300 underline">
              Centro de Ayuda
            </Link>
            .
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/settings/billing"
              className="text-sm text-[var(--theme-text-secondary)] hover:text-white transition-colors"
            >
              Degrádese a Gratis
            </Link>
            <Link
              href="/settings/billing"
              className="text-sm text-[var(--theme-text-secondary)] hover:text-white transition-colors"
            >
              Editar facturación &gt;
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
