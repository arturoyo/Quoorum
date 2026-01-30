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
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { CheckCircle, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn, styles } from '@/lib/utils'

interface TeamUpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Opciones de créditos por asiento (añadido escalón de 32€ por 4,000 créditos)
const CREDIT_OPTIONS_PER_SEAT = [
  { credits: 4000, price: 32 }, // Nuevo escalón: 32€ por 4,000 créditos
  { credits: 8000, price: 64 },
  { credits: 12000, price: 96 },
  { credits: 16000, price: 128 },
  { credits: 20000, price: 160 },
  { credits: 40000, price: 320 },
  { credits: 63000, price: 504 },
  { credits: 85000, price: 680 },
  { credits: 110000, price: 880 },
  { credits: 170000, price: 1360 },
  { credits: 230000, price: 1840 },
  { credits: 350000, price: 2800 },
  { credits: 480000, price: 3840 },
  { credits: 1200000, price: 9600 },
] as const

// Features del plan Equipo (específicas de Quoorum)
const TEAM_FEATURES = [
  {
    icon: '👥',
    text: 'Gestión de miembros del equipo',
    description: 'Invita miembros, asigna roles (admin, miembro, visualizador) y gestiona permisos',
  },
  {
    icon: '💬',
    text: 'Debates compartidos del equipo',
    description: 'Todos los miembros pueden acceder y colaborar en debates del equipo',
  },
  {
    icon: '📊',
    text: 'Análisis de uso por miembro',
    description: 'Métricas detalladas de debates creados, créditos consumidos y actividad por miembro',
  },
  {
    icon: '🔒',
    text: 'Control de acceso granular',
    description: 'Define quién puede crear debates, acceder a información sensible o gestionar el equipo',
  },
  {
    icon: '📁',
    text: 'Contexto corporativo compartido',
    description: 'Comparte contexto de empresa, departamentos y documentos con todo el equipo',
  },
  {
    icon: '📈',
    text: 'Créditos compartidos',
    description: 'Todos los créditos del plan se comparten entre todos los miembros del equipo',
  },
] as const

export function TeamUpgradeModal({ open, onOpenChange }: TeamUpgradeModalProps) {
  const [isYearly, setIsYearly] = useState(false)
  const [teamSeats, setTeamSeats] = useState(10)
  const [selectedCreditsPerSeat, setSelectedCreditsPerSeat] = useState<number>(4000)
  const [isProcessing, setIsProcessing] = useState(false)

  // Calcular créditos totales
  const totalCredits = teamSeats * selectedCreditsPerSeat

  // Calcular precio por asiento según créditos seleccionados
  const selectedCreditOption = CREDIT_OPTIONS_PER_SEAT.find(
    (opt) => opt.credits === selectedCreditsPerSeat
  )
  const pricePerSeat = selectedCreditOption?.price || 32

  // Calcular precio total
  const monthlyTotal = teamSeats * pricePerSeat
  const yearlyTotal = monthlyTotal * 12
  const yearlyDiscount = yearlyTotal * 0.17 // 17% descuento
  const yearlyTotalWithDiscount = yearlyTotal - yearlyDiscount
  const yearlyMonthlyEquivalent = yearlyTotalWithDiscount / 12

  const displayPrice = isYearly ? yearlyMonthlyEquivalent : monthlyTotal

  // Mutation para crear checkout session de Team
  const createTeamCheckoutMutation = api.billing.createTeamCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        // Redirigir a Stripe Checkout
        window.location.href = data.url
      } else {
        toast.error('No se pudo obtener la URL de checkout')
        setIsProcessing(false)
      }
    },
    onError: (error) => {
      toast.error('Error al crear sesión de checkout', {
        description: error.message,
      })
      setIsProcessing(false)
    },
  })

  // Handler para actualizar a Equipo
  const handleUpgradeToTeam = async () => {
    setIsProcessing(true)
    try {
      await createTeamCheckoutMutation.mutateAsync({
        seats: teamSeats,
        creditsPerSeat: selectedCreditsPerSeat,
        isYearly,
        successUrl: `${window.location.origin}/settings/team?success=true`,
        cancelUrl: `${window.location.origin}/settings/team?canceled=true`,
      })
    } catch (error) {
      // Error ya manejado en onError del mutation
    }
  }

  // Handler para contactar con ventas
  const handleContactSales = () => {
    const subject = encodeURIComponent('Solicitud Plan Equipo')
    const body = encodeURIComponent(
      `Hola,\n\nMe interesa obtener información sobre el Plan Equipo.\n\n` +
        `Configuración deseada:\n` +
        `- Asientos: ${teamSeats}\n` +
        `- Créditos por asiento: ${selectedCreditsPerSeat.toLocaleString()}/mes\n` +
        `- Plan: ${isYearly ? 'Anual' : 'Mensual'}\n` +
        `- Precio total: ${Math.round(displayPrice)}€/${isYearly ? 'año' : 'mes'}\n\n` +
        `Gracias.`
    )
    window.open(`mailto:sales@quoorum.com?subject=${subject}&body=${body}`, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent nested className="styles.colors.bg.primary border-purple-500/20 max-w-2xl">
        <DialogHeader className="border-b-0 pb-0">
          <DialogTitle className="text-2xl font-semibold styles.colors.text.primary">
            Obtener Equipo
          </DialogTitle>
          <DialogDescription className="styles.colors.text.secondary">
            Plan diseñado para equipos que necesitan colaboración y control de acceso
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Plan Selection Cards (Mensual/Anual) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Mensual */}
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all text-left',
                !isYearly
                  ? 'styles.colors.bg.secondary border-purple-500/40'
                  : 'styles.colors.bg.primary styles.colors.border.default hover:border-purple-500/20'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                    !isYearly
                      ? 'border-purple-500 bg-purple-500'
                      : 'styles.colors.border.default bg-transparent'
                  )}
                >
                  {!isYearly && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <div className="text-2xl font-bold styles.colors.text.primary mb-0.5">
                {pricePerSeat}€
              </div>
              <div className="text-xs styles.colors.text.secondary">Por asiento / mes</div>
            </button>

            {/* Anual */}
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all text-left',
                isYearly
                  ? 'styles.colors.bg.secondary border-purple-500/40'
                  : 'styles.colors.bg.primary styles.colors.border.default hover:border-purple-500/20'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                    isYearly
                      ? 'border-purple-500 bg-purple-500'
                      : 'styles.colors.border.default bg-transparent'
                  )}
                >
                  {isYearly && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div className="bg-blue-500 styles.colors.text.primary text-xs px-1.5 py-0.5 rounded">
                  Ahorra 17%
                </div>
              </div>
              <div className="text-2xl font-bold styles.colors.text.primary mb-0.5">
                {Math.round(pricePerSeat * 12 * 0.83)}€
              </div>
              <div className="text-xs styles.colors.text.secondary">Por asiento / año</div>
            </button>
          </div>

          {/* Team Seats Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="teamSeats" className="styles.colors.text.primary text-sm">
              Asientos del equipo
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setTeamSeats(Math.max(1, teamSeats - 1))}
                className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary hover:bg-purple-600 hover:border-purple-600"
              >
                -
              </Button>
              <Input
                id="teamSeats"
                type="number"
                min={1}
                value={teamSeats}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  setTeamSeats(Math.max(1, value))
                }}
                className="flex-1 styles.colors.bg.input styles.colors.border.default styles.colors.text.primary text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setTeamSeats(teamSeats + 1)}
                className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary hover:bg-purple-600 hover:border-purple-600"
              >
                +
              </Button>
            </div>
          </div>

          {/* Credits per Seat Dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="creditsPerSeat" className="styles.colors.text.primary text-sm">
              Créditos por asiento
            </Label>
            <Select
              value={selectedCreditsPerSeat.toString()}
              onValueChange={(value) => setSelectedCreditsPerSeat(parseInt(value))}
            >
              <SelectTrigger
                id="creditsPerSeat"
                className="styles.colors.bg.input styles.colors.border.default styles.colors.text.primary"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="styles.colors.bg.secondary styles.colors.border.default max-h-[300px] z-[200]">
                {CREDIT_OPTIONS_PER_SEAT.map((option) => (
                  <SelectItem
                    key={option.credits}
                    value={option.credits.toString()}
                    className="styles.colors.text.primary hover:bg-purple-600/20 focus:bg-purple-600/20"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>
                        {option.credits.toLocaleString()} créditos / asiento / mes
                      </span>
                      {selectedCreditsPerSeat === option.credits && (
                        <CheckCircle className="h-4 w-4 text-purple-400 ml-2" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs styles.colors.text.tertiary">
              {pricePerSeat}€ por asiento / mes
            </p>
          </div>

          {/* Total Credits and Price in one row */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="styles.colors.bg.secondary styles.colors.border.default">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <Label className="styles.colors.text.primary font-semibold text-sm">Créditos totales</Label>
                  <p className="text-xs styles.colors.text.secondary">
                    Compartido por todos
                  </p>
                  <p className="text-xl font-bold styles.colors.text.primary">
                    {totalCredits.toLocaleString()} / mes
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="styles.colors.bg.secondary styles.colors.border.default">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <Label className="styles.colors.text.primary font-semibold text-sm">Precio total</Label>
                  <div className="flex items-baseline gap-1">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${teamSeats}-${selectedCreditsPerSeat}-${isYearly ? 'yearly' : 'monthly'}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="text-xl font-bold styles.colors.text.primary"
                      >
                        {Math.round(displayPrice)}€
                      </motion.span>
                    </AnimatePresence>
                    <span className="styles.colors.text.secondary text-sm">/ {isYearly ? 'año' : 'mes'}</span>
                  </div>
                  {isYearly && (
                    <p className="text-xs styles.colors.text.secondary">
                      {Math.round(yearlyMonthlyEquivalent)}€ / mes
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features List */}
          <Card className="styles.colors.bg.secondary styles.colors.border.default">
            <CardHeader className="pb-3">
              <CardTitle className="styles.colors.text.primary text-base">Características incluidas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {TEAM_FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-lg">{feature.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold styles.colors.text.primary">{feature.text}</p>
                      <p className="text-xs styles.colors.text.secondary">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </DialogBody>

        <DialogFooter className="flex gap-3 border-t-0 pt-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleContactSales}
            className="flex-1 styles.colors.border.default styles.colors.bg.input styles.colors.text.primary hover:bg-purple-600 hover:border-purple-600"
          >
            Contacta con ventas
          </Button>
          <Button
            type="button"
            onClick={handleUpgradeToTeam}
            disabled={isProcessing || createTeamCheckoutMutation.isPending}
            className="flex-1 bg-white text-slate-900 hover:bg-gray-100"
          >
            {isProcessing || createTeamCheckoutMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Actualizar a Equipo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
