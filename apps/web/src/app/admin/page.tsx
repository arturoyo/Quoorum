"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Shield,
  CheckCircle,
  XCircle,
  Users,
  MessageSquare,
  Coins,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Settings,
  FileText,
  CreditCard,
  Sparkles,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setIsAuthenticated(true);
      }
    }
    checkAuth();
  }, [router, supabase.auth]);

  // Queries
  const { data: systemConfig, isLoading: configLoading } = api.admin.getSystemConfig.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: usersData, isLoading: usersLoading } = api.admin.listUsers.useQuery(
    { limit: 5, sortBy: 'created_at', sortOrder: 'desc' },
    { enabled: isAuthenticated }
  );

  const { data: costData, isLoading: costsLoading } = api.admin.getCostAnalytics.useQuery(
    {},
    { enabled: isAuthenticated }
  );

  const isLoading = configLoading || usersLoading || costsLoading;

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const totalUsers = usersData?.total ?? 0;
  const activeUsers = usersData?.users.filter(u => u.isActive).length ?? 0;
  const totalDebates = costData?.overall.totalDebates ?? 0;
  const totalCreditsUsed = costData?.overall.totalCreditsUsed ?? 0;
  const totalCostUsd = costData?.overall.totalCostUsd ?? 0;
  const avgCostPerDebate = costData?.overall.avgCostPerDebate ?? 0;

  // Calculate total credits available
  const totalCreditsAvailable = usersData?.users.reduce((sum, u) => sum + (u.credits ?? 0), 0) ?? 0;

  const envConfig = systemConfig?.env ?? {};

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-400" />
            Panel de Administracion
          </h1>
          <p className="mt-2 text-[var(--theme-text-secondary)]">
            Vista general del sistema y metricas principales
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Users */}
          <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--theme-text-secondary)]">Total Usuarios</p>
                  <p className="text-3xl font-bold text-white">{totalUsers}</p>
                  <p className="text-xs text-green-400 mt-1">{activeUsers} activos</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Debates */}
          <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--theme-text-secondary)]">Total Debates</p>
                  <p className="text-3xl font-bold text-white">{totalDebates}</p>
                  <p className="text-xs text-[var(--theme-text-tertiary)] mt-1">
                    ${avgCostPerDebate.toFixed(3)}/debate
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credits Used */}
          <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--theme-text-secondary)]">Creditos Usados</p>
                  <p className="text-3xl font-bold text-white">{totalCreditsUsed.toLocaleString()}</p>
                  <p className="text-xs text-amber-400 mt-1">
                    {totalCreditsAvailable.toLocaleString()} disponibles
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Coins className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Cost */}
          <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--theme-text-secondary)]">Costo Total</p>
                  <p className="text-3xl font-bold text-white">${totalCostUsd.toFixed(2)}</p>
                  <p className="text-xs text-[var(--theme-text-tertiary)] mt-1">USD en API</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Users */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                Acciones Rapidas
              </CardTitle>
              <CardDescription className="text-[var(--theme-text-secondary)]">
                Accede rapidamente a las secciones mas usadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full justify-between border-white/10 hover:bg-white/10 text-white">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Gestionar Usuarios
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin/credits">
                  <Button variant="outline" className="w-full justify-between border-white/10 hover:bg-white/10 text-white">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Creditos
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin/scenarios">
                  <Button variant="outline" className="w-full justify-between border-white/10 hover:bg-white/10 text-white">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Escenarios
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin/logs">
                  <Button variant="outline" className="w-full justify-between border-white/10 hover:bg-white/10 text-white">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Logs del Sistema
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin/costs">
                  <Button variant="outline" className="w-full justify-between border-white/10 hover:bg-white/10 text-white">
                    <span className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Costos y Analytics
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin/settings">
                  <Button variant="outline" className="w-full justify-between border-white/10 hover:bg-white/10 text-white">
                    <span className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Configuracion
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                Usuarios Recientes
              </CardTitle>
              <CardDescription className="text-[var(--theme-text-secondary)]">
                Ultimos usuarios registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usersData?.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-300">
                          {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.name || 'Sin nombre'}</p>
                        <p className="text-xs text-[var(--theme-text-tertiary)]">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          user.tier === 'business' ? 'border-purple-500/40 text-purple-300' :
                          user.tier === 'pro' ? 'border-blue-500/40 text-blue-300' :
                          user.tier === 'starter' ? 'border-green-500/40 text-green-300' :
                          'border-gray-500/40 text-gray-300'
                        }
                      >
                        {user.tier}
                      </Badge>
                      <p className="text-xs text-[var(--theme-text-tertiary)] mt-1">
                        {user.credits?.toLocaleString()} creditos
                      </p>
                    </div>
                  </div>
                ))}
                {(!usersData?.users || usersData.users.length === 0) && (
                  <p className="text-sm text-[var(--theme-text-tertiary)] text-center py-4">
                    No hay usuarios registrados
                  </p>
                )}
              </div>
              <Link href="/admin/users">
                <Button variant="ghost" className="w-full mt-4 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
                  Ver todos los usuarios
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-400" />
              Estado del Sistema
            </CardTitle>
            <CardDescription className="text-[var(--theme-text-secondary)]">
              Servicios y configuraciones activas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(envConfig).map(([key, isConfigured]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className={
                    isConfigured
                      ? "border-green-500/40 text-green-300 bg-green-500/10"
                      : "border-red-500/40 text-red-300 bg-red-500/10"
                  }
                >
                  {isConfigured ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                  {key}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
