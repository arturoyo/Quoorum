'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogBody,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AddCreditsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ============================================================================
// ESTÁNDAR QUOORUM: SISTEMA DE CRÉDITOS
// ============================================================================
// Precios de Planes (fijos):
// - Starter: 29€/mes por 3,500 créditos (0.0083€/crédito)
// - Pro: 79€/mes por 10,000 créditos (0.0079€/crédito)
// - Business: 199€/mes por 30,000 créditos (0.0066€/crédito)
// 
// Multiplicador de Servicio: 1.75x (aplicado internamente al calcular créditos desde coste API)
// Fórmula: Créditos = ⌈(Coste API USD × 1.75) / 0.01⌉
// 
// Para créditos adicionales: Se calcula basado en el precio del plan actual del usuario
// ============================================================================

// Función para calcular precio basado en créditos usando el precio del plan actual
function calculatePriceFromCredits(credits: number, currentTier?: 'free' | 'starter' | 'pro' | 'business'): number {
  // Precios por crédito según plan
  const pricePerCredit = {
    free: 0.008, // Precio promedio
    starter: 29 / 3500, // 0.0082857€/crédito
    pro: 79 / 10000, // 0.0079€/crédito
    business: 199 / 30000, // 0.006633€/crédito
  }
  
  const unitPrice = currentTier ? pricePerCredit[currentTier] : pricePerCredit.free
  // Precio en centavos de € = créditos * precio_unitario * 100
  return Math.round(credits * unitPrice * 100)
}

// Opciones de créditos disponibles
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

// Generar opciones con precios calculados (usando precio promedio para el desplegable)
// El precio real se calculará dinámicamente según el tier del usuario
const CREDIT_OPTIONS = CREDIT_AMOUNTS.map((credits) => ({
  credits,
  price: calculatePriceFromCredits(credits, 'free'), // Precio promedio para mostrar en desplegable
})) as Array<{ credits: number; price: number }>

export function AddCreditsModal({ open, onOpenChange }: AddCreditsModalProps) {
  const [isYearly, setIsYearly] = useState(false) // Por defecto mensual
  const [selectedCredits, setSelectedCredits] = useState<string>('20000')
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch current plan
  const { data: currentPlan } = api.billing.getCurrentPlan.useQuery(undefined, {
    enabled: open,
  })

  const { data: subscriptions } = api.billing.getMySubscriptions.useQuery(
    { limit: 1, offset: 0 },
    { enabled: open }
  )
  const activeSubscription = subscriptions?.[0]

  // Initialize selected credits with current plan credits or default
  useEffect(() => {
    if (currentPlan?.credits) {
      // Find the closest credit option
      const closest = CREDIT_OPTIONS.reduce((prev, curr) => {
        return Math.abs(curr.credits - currentPlan.credits) < Math.abs(prev.credits - currentPlan.credits)
          ? curr
          : prev
      })
      setSelectedCredits(closest.credits.toString())
    }
  }, [currentPlan?.credits])

  // Calculate prices based on current tier
  const selectedCreditsNum = parseInt(selectedCredits || '0')
  const currentTier = currentPlan?.tier || 'free'
  
  // Precio por crédito según el tier actual
  const pricePerCredit = {
    free: 0.008, // Precio promedio
    starter: 29 / 3500, // 0.0082857€/crédito
    pro: 79 / 10000, // 0.0079€/crédito
    business: 199 / 30000, // 0.006633€/crédito
  }[currentTier]
  
  const pricePerMonth = selectedCreditsNum * pricePerCredit
  const pricePerYear = pricePerMonth * 12
  const yearlyDiscount = pricePerYear * 0.17 // 17% discount
  const pricePerYearWithDiscount = pricePerYear - yearlyDiscount
  const pricePerMonthWithYearly = pricePerYearWithDiscount / 12

  const displayPrice = isYearly ? pricePerMonthWithYearly : pricePerMonth
  
  // Calcular ajuste único (diferencia entre nuevo precio y precio actual)
  const currentPlanCredits = currentPlan?.credits || 0
  const currentPlanPrice = currentPlanCredits * pricePerCredit
  const oneTimeAdjustment = displayPrice - currentPlanPrice

  // Get next billing date
  const nextBillingDate = activeSubscription?.currentPeriodEnd
    ? format(new Date(activeSubscription.currentPeriodEnd), 'd MMM yyyy', { locale: es })
    : null

  const purchaseCreditsMutation = api.billing.purchaseCredits.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.success('Créditos añadidos correctamente')
        onOpenChange(false)
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al añadir créditos')
      setIsProcessing(false)
    },
  })

  const handleUpdate = () => {
    setIsProcessing(true)
    purchaseCreditsMutation.mutate({
      credits: selectedCreditsNum,
      successUrl: `${window.location.origin}/dashboard?success=true&credits=${selectedCreditsNum}`,
      cancelUrl: `${window.location.origin}/settings?canceled=true`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent nested className="bg-slate-900 border-purple-500/20 max-w-2xl">
        <DialogHeader className="border-b-0 pb-0">
          <DialogTitle className="text-2xl font-semibold text-white">
            Añadir más créditos
          </DialogTitle>
          <DialogDescription className="text-[var(--theme-text-secondary)]">
            Ajusta tu plan y añade créditos mensuales recurrentes
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Billing Adjustment Card */}
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[var(--theme-text-secondary)] text-sm">Ajuste de facturación</Label>
                  <div className="flex items-baseline gap-2 mt-1">
                    {oneTimeAdjustment > 0 && (
                      <>
                        <span className="text-[var(--theme-text-tertiary)] line-through text-lg">
                          {Math.round(oneTimeAdjustment)}€
                        </span>
                        <span className="text-white text-2xl font-bold">
                          {Math.round(displayPrice)}€
                        </span>
                      </>
                    )}
                    {oneTimeAdjustment <= 0 && (
                      <span className="text-white text-2xl font-bold">
                        {Math.round(displayPrice)}€
                      </span>
                    )}
                    <span className="text-[var(--theme-text-secondary)] text-sm">vencido hoy</span>
                  </div>
                </div>

                {/* Annual Toggle */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-[var(--theme-text-secondary)]">
                      {isYearly ? 'Anual' : 'Mensual'}
                    </span>
                    {isYearly && (
                      <span className="text-xs text-blue-400">Ahorre 17%</span>
                    )}
                  </div>
                  <Switch
                    checked={isYearly}
                    onCheckedChange={setIsYearly}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
              </div>

              <Separator className="bg-purple-500/20" />

              {/* Credits Dropdown */}
              <div className="space-y-2">
                <Label className="text-[var(--theme-text-secondary)] text-sm">Créditos mensuales</Label>
                <Select
                  value={selectedCredits}
                  onValueChange={setSelectedCredits}
                >
                  <SelectTrigger className="w-full bg-slate-900/50 border-purple-500/30 text-white hover:bg-slate-900/70 focus:ring-purple-500/50">
                    <SelectValue placeholder="Seleccionar créditos">
                      {(() => {
                        const selectedOption = CREDIT_OPTIONS.find(opt => opt.credits.toString() === selectedCredits)
                        if (selectedOption) {
                          return `${selectedOption.credits.toLocaleString()} créditos/mes`
                        }
                        return `${parseInt(selectedCredits || '0').toLocaleString()} créditos/mes`
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-purple-500/30 max-h-[300px] z-[200]">
                    {CREDIT_OPTIONS.map((option) => {
                      const isCurrent = option.credits === currentPlan?.credits
                      
                      return (
                        <SelectItem
                          key={option.credits}
                          value={option.credits.toString()}
                          className="text-white hover:bg-slate-700/50 focus:bg-slate-700/50 cursor-pointer data-[highlighted]:bg-slate-700/50"
                        >
                          <div className="flex items-center justify-between w-full pr-6">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{option.credits.toLocaleString()} créditos/mes</span>
                              {isCurrent && (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs px-1.5 py-0">
                                  Actual
                                </Badge>
                              )}
                            </div>
                            {isCurrent && (
                              <Check className="h-4 w-4 text-blue-400 flex-shrink-0" />
                            )}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Plan Update Summary */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm">
                  Recibirá <span className="font-semibold">{selectedCreditsNum.toLocaleString()} créditos mensuales</span> de inmediato
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm">
                  Su plan se actualizará a{' '}
                  <span className="font-semibold">
                    {Math.round(displayPrice)}€ / mes
                  </span>{' '}
                  con{' '}
                  <span className="font-semibold">
                    {selectedCreditsNum.toLocaleString()} créditos
                  </span>
                  .
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm">
                  Degradar en cualquier momento
                </p>
              </div>
            </div>
          </div>

          {/* Next Billing Date */}
          {nextBillingDate && (
            <p className="text-[var(--theme-text-secondary)] text-sm">
              Próximo ciclo de facturación y renovación del plan {nextBillingDate}
            </p>
          )}
        </DialogBody>

        <DialogFooter className="gap-2 border-t-0 pt-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="border-gray-600 text-[var(--theme-text-secondary)] hover:bg-gray-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isProcessing}
            className="bg-white text-black hover:bg-gray-200"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Actualizar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
