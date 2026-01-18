"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Zap,
} from "lucide-react";
import { QuoorumLogo } from "@/components/ui/quoorum-logo";
import { getSettingsNav } from "@/lib/settings-nav";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [data, setData] = useState<BillingData | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadBilling() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // TODO: Replace with actual API call
      setData({
        plan: {
          name: "Pro",
          tier: "pro",
          price: 29,
          interval: "monthly",
        },
        subscription: {
          status: "active",
          currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false,
        },
        usage: {
          debates: { used: 12, limit: 50 },
          experts: { used: 8, limit: 8 },
        },
        invoices: [
          { id: "inv_1", date: "2024-01-01", amount: 29, status: "paid" },
          { id: "inv_2", date: "2023-12-01", amount: 29, status: "paid" },
          { id: "inv_3", date: "2023-11-01", amount: 29, status: "paid" },
        ],
      });

      setIsLoading(false);
    }

    loadBilling();
  }, [router, supabase.auth]);

  const openCustomerPortal = async () => {
    setIsPortalLoading(true);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const { url, error } = await response.json();

      if (error) {
        toast.error(error);
        return;
      }

      window.location.href = url;
    } catch {
      toast.error("Error al abrir el portal de facturación");
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </div>

            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition" />
                <div className="relative w-8 h-8 rounded-lg flex items-center justify-center bg-purple-600">
                  <QuoorumLogo size={24} showGradient={true} />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">Quoorum</span>
            </Link>

            <div className="w-32" />
          </div>
        </div>
      </header>

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
            {/* Current Plan */}
            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Tu Plan Actual</CardTitle>
                      <CardDescription>
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
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {data?.plan.name}
                        </h3>
                        <p className="text-gray-400">
                          ${data?.plan.price}/{data?.plan.interval === "monthly" ? "mes" : "año"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Próxima renovación</p>
                      <p className="text-white font-medium">
                        {daysUntilRenewal} días
                      </p>
                    </div>
                  </div>

                  {data?.subscription.cancelAtPeriodEnd && (
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <p className="text-yellow-400 text-sm">
                        Tu suscripción se cancelará al final del período actual.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      onClick={openCustomerPortal}
                      disabled={isPortalLoading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isPortalLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="mr-2 h-4 w-4" />
                      )}
                      Gestionar Suscripción
                    </Button>
                    <Link href="/pricing">
                      <Button
                        variant="outline"
                        className="border-white/10 text-white hover:bg-white/10"
                      >
                        Cambiar Plan
                      </Button>
                    </Link>
                  </div>
                </CardContent>
            </Card>

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
                    className="w-full mt-4 text-gray-400 hover:text-white"
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
