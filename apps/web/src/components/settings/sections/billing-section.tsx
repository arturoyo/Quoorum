'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/trpc/client'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Sparkles, History, Info, Download, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { SubscriptionManagementModal } from '../subscription-management-modal'
import { AddCreditsModal } from '../add-credits-modal'
import { createClient } from '@/lib/supabase/client'

interface BillingSectionProps {
  isInModal?: boolean
}

export function BillingSection({ isInModal = false }: BillingSectionProps) {
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)
  const [isAddCreditsModalOpen, setIsAddCreditsModalOpen] = useState(false)
  const [userCredits, setUserCredits] = useState(0)
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Check authentication status before making queries
  useEffect(() => {
    let mounted = true
    setIsCheckingAuth(true)

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) {
        setIsAuthenticated(!!user)
        setIsCheckingAuth(false)
      }
    })

    const subscription = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setIsAuthenticated(!!session?.user)
        setIsCheckingAuth(false)
      }
    })

    return () => {
      mounted = false
      subscription.data.subscription.unsubscribe()
    }
  }, [supabase.auth])

  // Fetch current plan and subscription (only when authenticated)
  const { data: currentPlan, isLoading: isLoadingPlan } = api.billing.getCurrentPlan.useQuery(
    undefined,
    {
      enabled: !isCheckingAuth && isAuthenticated,
      retry: false,
      onError: () => {
        // Silenciar errores de autenticación (ya manejados por enabled)
      },
    }
  )
  const { data: subscriptions } = api.billing.getMySubscriptions.useQuery(
    { limit: 1, offset: 0 },
    {
      enabled: !isCheckingAuth && isAuthenticated,
      retry: false,
      onError: () => {
        // Silenciar errores de autenticación (ya manejados por enabled)
      },
    }
  )
  const activeSubscription = subscriptions?.[0]

  // Fetch user credits from Supabase metadata
  useEffect(() => {
    async function loadUserCredits() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserCredits(user.user_metadata?.credits || 0)
      }
    }
    void loadUserCredits()
  }, [supabase.auth])

  // Fetch recent invoices
  const { data: invoices = [], isLoading: isLoadingInvoices } = api.billing.getMyInvoices.useQuery(
    { limit: 5 }
  )

  // Portal mutation (will be called when needed)
  const getPortalUrlMutation = api.billing.getCustomerPortalUrl.useMutation()

  const isLoading = isLoadingPlan || isLoadingInvoices

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  const planName = currentPlan?.tier === 'free' ? 'Free' : 
                   currentPlan?.tier === 'starter' ? 'Starter' :
                   currentPlan?.tier === 'pro' ? 'Pro' :
                   currentPlan?.tier === 'business' ? 'Business' : 'Free'

  const renewalDate = activeSubscription?.currentPeriodEnd
    ? format(new Date(activeSubscription.currentPeriodEnd), 'd MMM yyyy', { locale: es })
    : null

  // Calculate credits (same logic as AccountSection)
  const totalCredits = userCredits || 0
  const monthlyCredits = activeSubscription?.monthlyCredits || 0
  const freeCredits = totalCredits - monthlyCredits > 0 ? totalCredits - monthlyCredits : 0

  const handleViewAllInvoices = async () => {
    try {
      const result = await getPortalUrlMutation.mutateAsync({
        returnUrl: `${window.location.origin}/settings/billing`,
      })
      if (result.url) {
        window.open(result.url, '_blank')
      }
    } catch (error) {
      logger.error('Error opening Stripe portal:', error instanceof Error ? error : { error })
    }
  }

  return (
    <div className={cn('space-y-6', isInModal ? 'pb-8' : 'pb-0')}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-[var(--theme-text-primary)]">Panel de facturación</h1>
        <p className="text-[var(--theme-text-secondary)]">
          Administra tu suscripción y créditos
        </p>
      </div>

      {/* Plan & Credits Section - Estilo Manus */}
      {currentPlan && (
        <Card className="relative overflow-hidden bg-[var(--theme-bg-secondary)] backdrop-blur-xl border-[var(--theme-border)]">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-[var(--theme-text-primary)]">
                  {planName}
                </CardTitle>
                {renewalDate && (
                  <CardDescription className="text-[var(--theme-text-tertiary)]">
                    Fecha de renovación: {renewalDate}
                  </CardDescription>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                >
                  Gestionar
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsAddCreditsModalOpen(true)}
                  className="bg-white text-slate-900 hover:bg-gray-100"
                >
                  Añadir créditos
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-6">
            <Separator className="bg-gradient-to-r from-purple-500/20 via-[var(--theme-border)] to-blue-500/20" />

            {/* Créditos Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h4 className="text-lg font-semibold text-[var(--theme-text-primary)]">Créditos</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-[var(--theme-text-tertiary)] cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-[var(--theme-bg-tertiary)] border-[var(--theme-border)] text-[var(--theme-text-primary)]">
                      <p className="text-sm">
                        Los créditos se usan para generar debates, análisis y síntesis de IA. 1 crédito = 0.01€.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-[var(--theme-text-tertiary)]">Créditos gratis</p>
                  <p className="text-2xl font-bold text-[var(--theme-text-primary)]">{freeCredits.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-[var(--theme-text-tertiary)]">Créditos mensuales</p>
                  <p className="text-2xl font-bold text-[var(--theme-text-primary)]">
                    {monthlyCredits.toLocaleString()} / {currentPlan?.credits?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gradient-to-r from-purple-500/20 via-[var(--theme-border)] to-blue-500/20" />

            {/* Daily Update Credits */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-cyan-400" />
                <h4 className="text-lg font-semibold text-[var(--theme-text-primary)]">Créditos de actualización diaria</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-[var(--theme-text-tertiary)] cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-[var(--theme-bg-tertiary)] border-[var(--theme-border)] text-[var(--theme-text-primary)]">
                      <p className="text-sm">
                        Créditos que se restauran automáticamente cada día para mantener tus datos actualizados.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-2xl font-bold text-[var(--theme-text-primary)]">{currentPlan?.dailyCredits || 0}</p>
              <p className="text-sm text-[var(--theme-text-tertiary)]">Se actualizan automáticamente cada día a las 01:00 UTC</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Recommendation - Smart */}
      {currentPlan && (
        <Card className="relative overflow-hidden bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-xl border-purple-500/30">
          <CardHeader className="relative">
            <CardTitle className="text-xl font-semibold text-[var(--theme-text-primary)]">Recomendación de plan</CardTitle>
            <CardDescription className="text-[var(--theme-text-tertiary)]">
              Basado en tu uso actual
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-4">
            {currentPlan.tier === 'free' && (
              <div className="space-y-3">
                <p className="text-sm text-[var(--theme-text-secondary)]">
                  Actualmente usas créditos rápidamente. Considera upgradearte al plan <span className="font-semibold text-purple-300">Starter</span> para obtener 300 créditos mensuales.
                </p>
                <Button
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Ver planes
                </Button>
              </div>
            )}
            {currentPlan.tier === 'starter' && monthlyCredits > (currentPlan.credits || 0) * 0.8 && (
              <div className="space-y-3">
                <p className="text-sm text-[var(--theme-text-secondary)]">
                  Estás usando el {Math.round((monthlyCredits / (currentPlan.credits || 1)) * 100)}% de tus créditos mensuales. Considera upgradearte al plan <span className="font-semibold text-purple-300">Pro</span> para más flexibilidad.
                </p>
                <Button
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Cambiar plan
                </Button>
              </div>
            )}
            {currentPlan.tier === 'pro' && monthlyCredits > (currentPlan.credits || 0) * 0.8 && (
              <div className="space-y-3">
                <p className="text-sm text-[var(--theme-text-secondary)]">
                  Tu consumo es alto. El plan <span className="font-semibold text-purple-300">Business</span> te ofrece ilimitados créditos mensuales.
                </p>
                <Button
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Explorar Business
                </Button>
              </div>
            )}
            {(currentPlan.tier === 'free' ? false : monthlyCredits <= (currentPlan.credits || 1) * 0.8) && currentPlan.tier !== 'business' && (
              <div className="space-y-3">
                <p className="text-sm text-[var(--theme-text-secondary)]">
                  Tu plan <span className="font-semibold text-green-300">{currentPlan.tier}</span> es perfecto para tu uso actual. ¡Sigue así!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actividad Reciente - Estilo Manus */}
      <Card className="relative overflow-hidden bg-[var(--theme-bg-secondary)] backdrop-blur-xl border-[var(--theme-border)]">
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-[var(--theme-text-primary)]">
              Actividad reciente
            </CardTitle>
            {activeSubscription && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleViewAllInvoices()}
                disabled={getPortalUrlMutation.isPending}
                className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/10"
              >
                {getPortalUrlMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    Ver todas las facturas
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="relative">
          {isLoadingInvoices ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-[var(--theme-text-tertiary)]">
              <p>No hay facturas registradas aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[var(--theme-border)]">
                    <TableHead className="text-[var(--theme-text-secondary)]">Fecha</TableHead>
                    <TableHead className="text-[var(--theme-text-secondary)]">Monto</TableHead>
                    <TableHead className="text-[var(--theme-text-secondary)] text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="border-[var(--theme-border)] hover:bg-purple-500/5">
                      <TableCell className="text-[var(--theme-text-primary)]">
                        {format(invoice.date, 'd MMM yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="text-[var(--theme-text-primary)] font-medium">
                        ${invoice.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.invoicePdf ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invoice.invoicePdf, '_blank')}
                            className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/10"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Descargar
                          </Button>
                        ) : invoice.hostedInvoiceUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invoice.hostedInvoiceUrl, '_blank')}
                            className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/10"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Descargar
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <SubscriptionManagementModal
        open={isSubscriptionModalOpen}
        onOpenChange={setIsSubscriptionModalOpen}
        onAddCreditsClick={() => setIsAddCreditsModalOpen(true)}
      />

      <AddCreditsModal
        open={isAddCreditsModalOpen}
        onOpenChange={setIsAddCreditsModalOpen}
      />
    </div>
  )
}
