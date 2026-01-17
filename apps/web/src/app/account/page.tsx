"use client"

/**
 * Account Page
 *
 * Shows user credit balance, tier, and purchase options
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, Sparkles, TrendingUp, Crown } from "lucide-react"

export default function AccountPage() {
  const router = useRouter()
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [purchasingCredits, setPurchasingCredits] = useState(false)

  // Get current plan
  const { data: currentPlan, isLoading: loadingPlan } = api.billing.getCurrentPlan.useQuery()

  // Get pricing info
  const { data: pricingInfo } = api.billing.getPricingInfo.useQuery()

  // Mutations
  const createCheckoutMutation = api.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      }
    },
    onError: (error) => {
      alert(`Error: ${error.message}`)
      setIsUpgrading(false)
    },
  })

  const purchaseCreditsMutation = api.billing.purchaseCredits.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      }
    },
    onError: (error) => {
      alert(`Error: ${error.message}`)
      setPurchasingCredits(false)
    },
  })

  const handleUpgrade = (planId: "starter" | "pro" | "business") => {
    setIsUpgrading(true)
    createCheckoutMutation.mutate({
      planId,
      successUrl: `${window.location.origin}/account?upgrade=success`,
      cancelUrl: `${window.location.origin}/account`,
    })
  }

  const handlePurchaseCredits = (amount: number) => {
    setPurchasingCredits(true)
    purchaseCreditsMutation.mutate({
      amount,
      successUrl: `${window.location.origin}/account?purchase=success`,
      cancelUrl: `${window.location.origin}/account`,
    })
  }

  if (loadingPlan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const credits = currentPlan?.credits || 0
  const tier = currentPlan?.tier || "free"

  // Tier badge color
  const tierBadgeVariant = {
    free: "secondary" as const,
    starter: "default" as const,
    pro: "default" as const,
    business: "default" as const,
  }[tier]

  const tierIcon = {
    free: null,
    starter: <Sparkles className="h-4 w-4" />,
    pro: <TrendingUp className="h-4 w-4" />,
    business: <Crown className="h-4 w-4" />,
  }[tier]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mi Cuenta</h1>
        <p className="text-muted-foreground">
          Gestiona tu suscripción y saldo de créditos
        </p>
      </div>

      {/* Current Balance */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Credits Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🪙</span>
              Saldo de Créditos
            </CardTitle>
            <CardDescription>
              1 crédito = $0.005 USD
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">
              {credits.toLocaleString()} créditos
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              ≈ ${(credits * 0.005).toFixed(2)} USD de valor
            </div>
            <Button
              onClick={() => handlePurchaseCredits(1000)}
              disabled={purchasingCredits}
              className="w-full"
            >
              {purchasingCredits ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Comprar Créditos
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Current Plan */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Plan Actual
            </CardTitle>
            <CardDescription>
              Tu tier de suscripción
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Badge variant={tierBadgeVariant} className="text-lg px-4 py-2">
                {tierIcon}
                <span className="ml-2 capitalize">{tier}</span>
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              {tier === "free" && "Plan gratuito - 1,000 créditos iniciales"}
              {tier === "starter" && "5,000 créditos mensuales"}
              {tier === "pro" && "10,000 créditos mensuales"}
              {tier === "business" && "25,000 créditos mensuales"}
            </div>
            {tier === "free" && (
              <Button
                onClick={() => handleUpgrade("pro")}
                disabled={isUpgrading}
                className="w-full"
                variant="default"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Upgrade a Pro
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Credit Packs */}
      {pricingInfo && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Paquetes de Créditos</CardTitle>
            <CardDescription>
              Compra créditos adicionales en cualquier momento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              {Object.entries(pricingInfo.creditPacks).map(([amount, pack]) => {
                const credits = Number(amount)
                const priceUsd = pack.price / 100
                const discount = Math.round((1 - priceUsd / (credits * 0.01)) * 100)

                return (
                  <Card key={amount} className="border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-2xl">
                        {credits.toLocaleString()}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        créditos
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-xl font-bold">
                        ${priceUsd.toFixed(2)}
                      </div>
                      {discount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {discount}% descuento
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handlePurchaseCredits(credits)}
                        disabled={purchasingCredits}
                        className="w-full"
                      >
                        Comprar
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      {pricingInfo && tier === "free" && (
        <Card>
          <CardHeader>
            <CardTitle>Planes de Suscripción</CardTitle>
            <CardDescription>
              Créditos mensuales + acceso a features premium
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Starter */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Starter
                  </CardTitle>
                  <CardDescription>
                    Para individuales
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">$29</div>
                    <div className="text-sm text-muted-foreground">por mes</div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      5,000 créditos/mes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Debates ilimitados
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Exportar PDF
                    </li>
                  </ul>
                  <Button
                    onClick={() => handleUpgrade("starter")}
                    disabled={isUpgrading}
                    className="w-full"
                  >
                    Seleccionar
                  </Button>
                </CardContent>
              </Card>

              {/* Pro */}
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Pro
                  </CardTitle>
                  <CardDescription>
                    Para profesionales
                  </CardDescription>
                  <Badge className="w-fit">Recomendado</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">$49</div>
                    <div className="text-sm text-muted-foreground">por mes</div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      10,000 créditos/mes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Modelos AI premium
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Análisis avanzados
                    </li>
                  </ul>
                  <Button
                    onClick={() => handleUpgrade("pro")}
                    disabled={isUpgrading}
                    className="w-full"
                  >
                    Seleccionar
                  </Button>
                </CardContent>
              </Card>

              {/* Business */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Business
                  </CardTitle>
                  <CardDescription>
                    Para equipos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">$99</div>
                    <div className="text-sm text-muted-foreground">por mes</div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      25,000 créditos/mes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      API Access
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Soporte prioritario
                    </li>
                  </ul>
                  <Button
                    onClick={() => handleUpgrade("business")}
                    disabled={isUpgrading}
                    className="w-full"
                  >
                    Seleccionar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
