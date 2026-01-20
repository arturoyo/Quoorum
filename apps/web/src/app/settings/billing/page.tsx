"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Zap,
  CreditCard,
  Sparkles,
  TrendingUp,
  Crown,
  History,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { getSettingsNav } from "@/lib/settings-nav";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BillingData {
  plan: {
    name: string;
    tier: string;
    price: number;
    interval: "monthly" | "yearly";
  };
  subscription: {
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    debates: { used: number; limit: number };
    experts: { used: number; limit: number };
  };
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
  }>;
}

export default function BillingSettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [purchasingCredits, setPurchasingCredits] = useState(false);
  const supabase = createClient();

  // Check auth
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      setIsAuthChecking(false);
    }
    checkAuth();
  }, [router, supabase.auth]);

  // Fetch current plan and subscription
  const { data: currentPlan } = api.billing.getCurrentPlan.useQuery(
    undefined,
    { enabled: !isAuthChecking && !!user }
  );

  // Fetch pricing info (for credit packs and plans)
  const { data: pricingInfo } = api.billing.getPricingInfo.useQuery(
    undefined,
    { enabled: !isAuthChecking && !!user }
  );

  // Fetch active subscription
  const { data: subscriptions } = api.billing.getMySubscriptions.useQuery(
    { limit: 1, offset: 0 },
    { enabled: !isAuthChecking && !!user }
  );

  const activeSubscription = subscriptions?.[0];

  // Fetch current month usage
  const { data: usageHistory } = api.billing.getMyUsageHistory.useQuery(
    { limit: 1, offset: 0 },
    { enabled: !isAuthChecking && !!user }
  );

  const currentUsage = usageHistory?.[0];

  // Fetch full usage history (for detailed table)
  const { data: fullUsageHistory = [], isLoading: loadingUsage } = api.billing.getMyUsageHistory.useQuery(
    { limit: 20, offset: 0 },
    { enabled: !isAuthChecking && !!user }
  );

  // Fetch all subscriptions (for invoices and payment history)
  const { data: allSubscriptions } = api.billing.getMySubscriptions.useQuery(
    { limit: 20, offset: 0 },
    { enabled: !isAuthChecking && !!user }
  );

  // Fetch subscriptions for payment history table
  const { data: subscriptionsHistory = [], isLoading: loadingSubscriptions } = api.billing.getMySubscriptions.useQuery(
    { limit: 20, offset: 0 },
    { enabled: !isAuthChecking && !!user }
  );

  // Mutations
  const createCheckoutMutation = api.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setIsUpgrading(false);
    },
  });

  const purchaseCreditsMutation = api.billing.purchaseCredits.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setPurchasingCredits(false);
    },
  });

  const handleUpgrade = (planId: "starter" | "pro" | "business") => {
    setIsUpgrading(true);
    createCheckoutMutation.mutate({
      planId,
      successUrl: `${window.location.origin}/settings/billing?upgrade=success`,
      cancelUrl: `${window.location.origin}/settings/billing`,
    });
  };

  const handlePurchaseCredits = (amount: number) => {
    setPurchasingCredits(true);
    purchaseCreditsMutation.mutate({
      amount,
      successUrl: `${window.location.origin}/settings/billing?purchase=success`,
      cancelUrl: `${window.location.origin}/settings/billing`,
    });
  };

  // Get plan limits based on tier
  const getPlanLimits = (tier: string) => {
    switch (tier) {
      case "starter":
        return { debates: 50, experts: 6 };
      case "pro":
        return { debates: 200, experts: 10 };
      case "business":
        return { debates: 1000, experts: 20 };
      default:
        return { debates: 5, experts: 4 }; // free
    }
  };

  const planLimits = getPlanLimits(currentPlan?.tier || "free");
  const planNames: Record<string, string> = {
    free: "Free",
    starter: "Starter",
    pro: "Pro",
    business: "Business",
  };

  const planPrices: Record<string, number> = {
    free: 0,
    starter: 29,
    pro: 49,
    business: 99,
  };

  // Transform data for display
  const data: BillingData | null = currentPlan
    ? {
        plan: {
          name: planNames[currentPlan.tier] || "Free",
          tier: currentPlan.tier,
          price: planPrices[currentPlan.tier] || 0,
          interval: activeSubscription?.interval || "monthly",
        },
        subscription: activeSubscription
          ? {
              status: activeSubscription.status,
              currentPeriodEnd: activeSubscription.currentPeriodEnd?.toISOString() || new Date().toISOString(),
              cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd || false,
            }
          : {
              status: "inactive",
              currentPeriodEnd: new Date().toISOString(),
              cancelAtPeriodEnd: false,
            },
        usage: {
          debates: {
            used: currentUsage?.debatesUsed || 0,
            limit: planLimits.debates,
          },
          experts: {
            used: 0, // No hay tracking de "expertos usados" en usage, solo debates
            limit: planLimits.experts,
          },
        },
        invoices:
          allSubscriptions?.map((sub) => ({
            id: sub.id,
            date: sub.createdAt.toISOString(),
            amount: sub.amount ? sub.amount / 100 : 0, // Convert cents to dollars
            status: sub.status === "active" || sub.status === "completed" ? "paid" : "pending",
          })) || [],
      }
    : null;

  const openCustomerPortal = async () => {
    setIsPortalLoading(true);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorMessage = data.error || "No tienes una suscripción activa";
        toast.error(errorMessage);
        // Redirigir a /settings/billing si no hay suscripción
        if (response.status === 404) {
          setTimeout(() => {
            router.push("/settings/billing");
          }, 2000);
        }
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("No se recibió la URL del portal");
      }
    } catch (error) {
      console.error("Error opening portal:", error);
      toast.error("Error al abrir el portal de facturación");
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (isAuthChecking || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const settingsNav = getSettingsNav(pathname || '/settings/billing');

  const daysUntilRenewal = data
    ? Math.ceil(
        (new Date(data.subscription.currentPeriodEnd).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const credits = currentPlan?.credits || 0;
  const tier = currentPlan?.tier || "free";

  // Tier badge color
  const tierBadgeVariant = {
    free: "secondary" as const,
    starter: "default" as const,
    pro: "default" as const,
    business: "default" as const,
  }[tier];

  const tierIcon = {
    free: null,
    starter: <Sparkles className="h-4 w-4" />,
    pro: <TrendingUp className="h-4 w-4" />,
    business: <Crown className="h-4 w-4" />,
  }[tier];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <AppHeader variant="app" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Nav */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-1">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">
                Configuración
              </h2>
              <nav className="space-y-1">
                {settingsNav.map((item) => {
                  const Icon = item.icon;
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isExpanded = hasSubItems && (item.active || item.subItems?.some(sub => sub.active));
                  
                  return (
                    <div key={item.href} className="space-y-1">
                      <Link
                        href={item.href}
                        className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition group ${
                          item.active && !hasSubItems
                            ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-blue-300 border border-purple-500/30"
                            : "text-gray-400 hover:text-blue-300 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10"
                        }`}
                      >
                        {(item.active && !hasSubItems) && (
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg blur opacity-50" />
                        )}
                        <Icon className="relative w-5 h-5" />
                        <span className="relative text-sm font-medium">{item.label}</span>
                      </Link>
                      
                      {hasSubItems && isExpanded && (
                        <div className="ml-4 space-y-1 pl-4 border-l border-white/10">
                          {item.subItems?.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={`relative flex items-center gap-3 px-4 py-2 rounded-lg transition group text-sm ${
                                subItem.active
                                  ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-blue-300 border border-purple-500/30"
                                  : "text-gray-400 hover:text-blue-300 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10"
                              }`}
                            >
                              {subItem.active && (
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg blur opacity-50" />
                              )}
                              <span className="relative">{subItem.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 text-white">Facturación</h1>
              <p className="text-gray-300">
                Gestiona tu suscripción, créditos y planes
              </p>
            </div>

            {/* Credits Balance & Current Plan */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              {/* Credits Card */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <span className="text-2xl">🪙</span>
                    Saldo de Créditos
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    1 crédito = $0.005 USD
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-4 text-white">
                    {credits.toLocaleString()} créditos
                  </div>
                  <div className="text-sm text-gray-400 mb-4">
                    ≈ ${(credits * 0.005).toFixed(2)} USD de valor
                  </div>
                  <Button
                    onClick={() => handlePurchaseCredits(1000)}
                    disabled={purchasingCredits}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
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

              {/* Current Plan Card */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Tu Plan Actual</CardTitle>
                      <CardDescription className="text-gray-300">
                        Gestiona tu suscripción y límites
                      </CardDescription>
                    </div>
                    <Badge
                      className={
                        data?.subscription.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }
                    >
                      {data?.subscription.status === "active" ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Activo
                        </>
                      ) : (
                        <>
                          <AlertCircle className="mr-1 h-3 w-3" />
                          {data?.subscription.status}
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {tierIcon}
                        <Badge variant={tierBadgeVariant} className="text-sm">
                          {tier.charAt(0).toUpperCase() + tier.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">
                        ${planPrices[tier] || 0}/{data?.plan.interval === "monthly" ? "mes" : "año"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={openCustomerPortal}
                      disabled={isPortalLoading}
                      size="sm"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isPortalLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="mr-2 h-4 w-4" />
                      )}
                      Gestionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Credit Packs */}
            {pricingInfo && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Paquetes de Créditos</CardTitle>
                  <CardDescription className="text-gray-300">
                    Compra créditos adicionales en cualquier momento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                    {Object.entries(pricingInfo.creditPacks).map(([amount, pack]) => {
                      const creditAmount = Number(amount);
                      const priceUsd = pack.price / 100;
                      const discount = Math.round((1 - priceUsd / (creditAmount * 0.01)) * 100);

                      return (
                        <Card key={amount} className="border-white/10 bg-slate-800/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-2xl text-white">
                              {creditAmount.toLocaleString()}
                            </CardTitle>
                            <CardDescription className="text-sm text-gray-400">
                              créditos
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="text-xl font-bold text-white">
                              ${priceUsd.toFixed(2)}
                            </div>
                            {discount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {discount}% descuento
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handlePurchaseCredits(creditAmount)}
                              disabled={purchasingCredits}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              Comprar
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Subscription Plans */}
            {pricingInfo && tier === "free" && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Planes de Suscripción</CardTitle>
                  <CardDescription className="text-gray-300">
                    Créditos mensuales + acceso a features premium
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    {/* Starter */}
                    <Card className="border-2 border-white/10 bg-slate-800/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <Sparkles className="h-5 w-5" />
                          Starter
                        </CardTitle>
                        <CardDescription className="text-gray-300">
                          Para individuales
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="text-3xl font-bold text-white">$29</div>
                          <div className="text-sm text-gray-400">por mes</div>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-300">
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
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Seleccionar
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Pro */}
                    <Card className="border-2 border-purple-500/50 bg-purple-900/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <TrendingUp className="h-5 w-5" />
                          Pro
                        </CardTitle>
                        <CardDescription className="text-gray-300">
                          Para profesionales
                        </CardDescription>
                        <Badge className="w-fit bg-purple-500/20 text-purple-300 border-purple-500/50">Recomendado</Badge>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="text-3xl font-bold text-white">$49</div>
                          <div className="text-sm text-gray-400">por mes</div>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-300">
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
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Seleccionar
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Business */}
                    <Card className="border-2 border-white/10 bg-slate-800/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <Crown className="h-5 w-5" />
                          Business
                        </CardTitle>
                        <CardDescription className="text-gray-300">
                          Para equipos
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="text-3xl font-bold text-white">$99</div>
                          <div className="text-sm text-gray-400">por mes</div>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-300">
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
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Seleccionar
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Usage */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Uso del Mes</CardTitle>
                <CardDescription>Tu consumo en el período actual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Debates</span>
                    <span className="text-white">
                      {data?.usage.debates.used} / {data?.usage.debates.limit}
                    </span>
                  </div>
                  <Progress
                    value={
                      data
                        ? (data.usage.debates.used / data.usage.debates.limit) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Expertos por debate</span>
                    <span className="text-white">
                      Hasta {data?.usage.experts.limit}
                    </span>
                  </div>
                  <Progress
                    value={
                      data
                        ? (data.usage.experts.used / data.usage.experts.limit) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Usage History */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <History className="h-5 w-5" />
                  Historial de Consumo
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Registro de uso de créditos y debates por período
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsage ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                  </div>
                ) : fullUsageHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No hay historial de consumo aún
                  </div>
                ) : (
                  <div className="border border-white/10 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-gray-300">Período</TableHead>
                          <TableHead className="text-gray-300">Debates</TableHead>
                          <TableHead className="text-gray-300">Tokens</TableHead>
                          <TableHead className="text-gray-300">Créditos</TableHead>
                          <TableHead className="text-gray-300">Costo USD</TableHead>
                          <TableHead className="text-gray-300">Modelo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fullUsageHistory.map((usage) => (
                          <TableRow key={usage.id} className="border-white/10">
                            <TableCell className="font-medium text-white">
                              {format(new Date(usage.periodStart), "MMM yyyy", { locale: es })}
                            </TableCell>
                            <TableCell className="text-gray-300">{usage.debatesUsed}</TableCell>
                            <TableCell className="text-gray-300">{usage.tokensUsed.toLocaleString()}</TableCell>
                            <TableCell className="font-mono text-gray-300">{usage.creditsDeducted.toLocaleString()}</TableCell>
                            <TableCell className="text-gray-300">${(usage.totalCostUsd / 100).toFixed(2)}</TableCell>
                            <TableCell>
                              {usage.modelUsed ? (
                                <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                                  {usage.modelUsed}
                                </Badge>
                              ) : (
                                <span className="text-gray-500 text-xs">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CreditCard className="h-5 w-5" />
                  Historial de Pagos
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Registro de suscripciones y pagos realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSubscriptions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                  </div>
                ) : subscriptionsHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No hay historial de pagos aún
                  </div>
                ) : (
                  <div className="border border-white/10 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-gray-300">Fecha</TableHead>
                          <TableHead className="text-gray-300">Estado</TableHead>
                          <TableHead className="text-gray-300">Créditos Mensuales</TableHead>
                          <TableHead className="text-gray-300">Período</TableHead>
                          <TableHead className="text-gray-300">Stripe ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptionsHistory.map((subscription) => (
                          <TableRow key={subscription.id} className="border-white/10">
                            <TableCell className="font-medium text-white">
                              {format(new Date(subscription.createdAt), "PPp", { locale: es })}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  subscription.status === "active"
                                    ? "default"
                                    : subscription.status === "canceled"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {subscription.status === "active"
                                  ? "Activa"
                                  : subscription.status === "canceled"
                                  ? "Cancelada"
                                  : subscription.status === "past_due"
                                  ? "Vencida"
                                  : subscription.status === "trialing"
                                  ? "Prueba"
                                  : subscription.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-gray-300">{subscription.monthlyCredits.toLocaleString()}</TableCell>
                            <TableCell className="text-gray-300">
                              {subscription.currentPeriodStart && subscription.currentPeriodEnd
                                ? `${format(new Date(subscription.currentPeriodStart), "d MMM", { locale: es })} - ${format(new Date(subscription.currentPeriodEnd), "d MMM yyyy", { locale: es })}`
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {subscription.stripeSubscriptionId ? (
                                <code className="text-xs text-gray-400">
                                  {subscription.stripeSubscriptionId.slice(0, 12)}...
                                </code>
                              ) : (
                                <span className="text-gray-500 text-xs">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoices */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Historial de Facturas</CardTitle>
                <CardDescription>Tus últimas facturas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5"
                    >
                      <div>
                        <p className="text-white font-medium">
                          {new Date(invoice.date).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-gray-400">
                          ${invoice.amount}
                        </p>
                      </div>
                      <Badge
                        className={
                          invoice.status === "paid"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }
                      >
                        {invoice.status === "paid" ? "Pagada" : "Pendiente"}
                      </Badge>
                    </div>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  onClick={openCustomerPortal}
                  className="w-full mt-4 border-white/10 bg-slate-800/50 text-gray-300 hover:text-white hover:bg-white/10"
                >
                  Ver todas las facturas
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
