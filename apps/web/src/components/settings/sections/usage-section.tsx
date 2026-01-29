'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/trpc/client'
import { createClient } from '@/lib/supabase/client'
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
import { Loader2, Sparkles, History, Info, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { SubscriptionManagementModal } from '../subscription-management-modal'
import { AddCreditsModal } from '../add-credits-modal'

interface UsageSectionProps {
  isInModal?: boolean
}

const ITEMS_PER_PAGE = 20

export function UsageSection({ isInModal = false }: UsageSectionProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)
  const [isAddCreditsModalOpen, setIsAddCreditsModalOpen] = useState(false)
  const [userCredits, setUserCredits] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const supabase = createClient()

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

  // Fetch credit transaction history (real data, not calculated backwards)
  const { data: creditHistory, isLoading: isLoadingHistory } = api.billing.getCreditHistory.useQuery(
    {
      limit: ITEMS_PER_PAGE,
      offset: (currentPage - 1) * ITEMS_PER_PAGE,
    },
    {
      enabled: !isCheckingAuth && isAuthenticated,
      retry: false,
      onError: () => {
        // Silenciar errores de autenticación (ya manejados por enabled)
      },
    }
  )

  const isLoading = isLoadingPlan || isLoadingHistory

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

  const transactions = creditHistory?.transactions || []
  const totalTransactions = creditHistory?.total || 0
  const totalPages = Math.ceil(totalTransactions / ITEMS_PER_PAGE)

  return (
    <div className={cn('space-y-6', isInModal ? 'pb-8' : 'pb-0')}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-[var(--theme-text-primary)]">Uso</h1>
        <p className="text-[var(--theme-text-secondary)]">
          Gestiona tu plan, créditos y revisa el uso de debates
        </p>
      </div>

      {/* Plan & Credits Section - Gestión de Suscripción y Pagos */}
      <Card className="relative overflow-hidden bg-[var(--theme-bg-secondary)] backdrop-blur-xl border-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-[var(--theme-text-primary)]">
                {currentPlan ? planName : 'Cargando plan...'}
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
          <Separator className="bg-gradient-to-r from-purple-500/20 via-white/10 to-blue-500/20" />

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
                  <TooltipContent className="max-w-xs bg-[var(--theme-bg-tertiary)] border-purple-500/30 text-[var(--theme-text-primary)]">
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

        </CardContent>
      </Card>

      {/* Debates Usage Table */}
      <Card className="relative overflow-hidden bg-[var(--theme-bg-secondary)] backdrop-blur-xl border-purple-500/20">
        <CardHeader className="relative">
          <CardTitle className="text-xl font-semibold text-[var(--theme-text-primary)]">
            Uso de debates
          </CardTitle>
          <CardDescription className="text-[var(--theme-text-tertiary)]">
            Historial de debates mostrando cómo se van restando los créditos al crear cada debate
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-[var(--theme-text-tertiary)]">
              <p>No hay transacciones de créditos registradas aún</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-purple-500/20">
                      <TableHead className="text-[var(--theme-text-secondary)]">Detalles</TableHead>
                      <TableHead className="text-[var(--theme-text-secondary)]">Fecha</TableHead>
                      <TableHead className="text-[var(--theme-text-secondary)] text-right">Saldo antes</TableHead>
                      <TableHead className="text-[var(--theme-text-secondary)] text-right">Créditos</TableHead>
                      <TableHead className="text-[var(--theme-text-secondary)] text-right">Saldo después</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => {
                      const date = transaction.createdAt ? new Date(transaction.createdAt) : new Date()
                      const isDeduction = transaction.type === 'deduction'
                      const isRefund = transaction.type === 'refund'
                      const isAddition = transaction.type === 'addition'
                      
                      // Get source label in Spanish
                      const sourceLabels: Record<string, string> = {
                        debate_creation: 'Creación de debate',
                        debate_execution: 'Ejecución de debate',
                        debate_failed: 'Debate fallido',
                        debate_cancelled: 'Debate cancelado',
                        monthly_allocation: 'Asignación mensual',
                        purchase: 'Compra',
                        admin_adjustment: 'Ajuste admin',
                        refund: 'Reembolso',
                        daily_reset: 'Reset diario',
                      }
                      
                      return (
                        <TableRow key={transaction.id} className="border-purple-500/10 hover:bg-purple-500/5">
                          <TableCell className="text-[var(--theme-text-primary)]">
                            <div>
                              {transaction.debateQuestion ? (
                                <p className="font-medium line-clamp-2">{transaction.debateQuestion}</p>
                              ) : (
                                <p className="font-medium line-clamp-2">{sourceLabels[transaction.source] || transaction.source}</p>
                              )}
                              {transaction.reason && (
                                <p className="text-sm text-[var(--theme-text-tertiary)] mt-1">
                                  {transaction.reason}
                                </p>
                              )}
                              {transaction.debateStatus && (
                                <span className={cn(
                                  'inline-block mt-1 px-2 py-0.5 rounded text-xs',
                                  transaction.debateStatus === 'completed' ? 'bg-green-500/20 text-green-400' :
                                  transaction.debateStatus === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                  transaction.debateStatus === 'failed' ? 'bg-red-500/20 text-red-400' :
                                  transaction.debateStatus === 'draft' ? 'bg-gray-500/20 text-[var(--theme-text-secondary)]' :
                                  'bg-gray-500/20 text-[var(--theme-text-secondary)]'
                                )}>
                                  {transaction.debateStatus}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-[var(--theme-text-secondary)]">
                            {format(date, 'dd/MM/yyyy HH:mm', { locale: es })}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium text-[var(--theme-text-primary)]">
                              {transaction.balanceBefore.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              'font-medium',
                              isDeduction ? 'text-red-400' : isAddition ? 'text-green-400' : 'text-blue-400'
                            )}>
                              {isDeduction ? '-' : isAddition ? '+' : '+'}{transaction.amount.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium text-[var(--theme-text-primary)]">
                              {transaction.balanceAfter.toLocaleString()}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-purple-500/20">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            currentPage === pageNum
                              ? 'bg-purple-600 text-white'
                              : 'border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
                          )}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="text-[var(--theme-text-tertiary)]">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
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
