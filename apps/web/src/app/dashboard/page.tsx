"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/trpc/client";
import { logger } from "@/lib/logger";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Clock,
  CreditCard,
  Bell,
  CheckCircle,
  DollarSign,
  Target,
} from "lucide-react";
import { AppHeader } from "@/components/layout";
import { SettingsModal } from "@/components/settings/settings-modal";
import { TestModeToggle } from "@/components/dashboard/test-mode-toggle";
import type { User } from "@supabase/supabase-js";


export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<string | undefined>(undefined);

  const supabase = createClient();

  // Check auth
  useEffect(() => {
    async function checkAuth() {
      // MODE TEST: Permitir acceso con cookie especial (solo en desarrollo)
      const isTestMode = process.env.NODE_ENV !== 'production'
      const testAuthCookie = document.cookie.includes('test-auth-bypass=test@quoorum.pro')

      if (isTestMode && testAuthCookie) {
        // En modo test, simular usuario autenticado
        setUser({
          id: 'f482a511-8c42-4896-b2d2-ae740194b7c9',
          email: 'test@quoorum.pro',
          email_confirmed_at: new Date().toISOString(),
        } as User)
        setIsAuthChecking(false)
        return
      }

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

  // Fetch stats via tRPC (with error handling)
  const { data: stats, isLoading: _statsLoading, error: statsError } = api.debates.stats.useQuery(
    undefined,
    { 
      enabled: !isAuthChecking && !!user,
      retry: false, // Don't retry on error to show UI faster
    }
  );

  // Fetch recent debates via tRPC (with error handling)
  const { data: recentDebates = [], isLoading: _debatesLoading, error: debatesError } = api.debates.list.useQuery(
    { limit: 8, offset: 0 },
    {
      enabled: !isAuthChecking && !!user,
      retry: false,
    }
  );

  // Fetch total experts count (library + custom)
  const { data: libraryCounts } = api.experts.libraryCategoryCounts.useQuery(
    { activeOnly: true },
    { 
      enabled: !isAuthChecking && !!user,
      retry: false,
    }
  );

  // Fetch user's custom experts count
  const { data: myExperts = [] } = api.experts.myExperts.useQuery(
    { activeOnly: true, limit: 100 },
    { 
      enabled: !isAuthChecking && !!user,
      retry: false,
    }
  );

  // Fetch notifications for widget (with error handling)
  const { data: unreadCount, error: notificationsError } = api.quoorumNotifications.getUnreadCount.useQuery(
    undefined,
    { 
      enabled: !isAuthChecking && !!user,
      retry: false,
    }
  );

  const { data: recentNotifications = [], error: _notificationsListError } = api.quoorumNotifications.list.useQuery(
    { limit: 3 },
    { 
      enabled: !isAuthChecking && !!user,
      retry: false,
    }
  );

  // Get current user role (to show admin menu)
  const { data: _currentUser } = api.users.getMe.useQuery(
    undefined,
    { 
      enabled: !isAuthChecking && !!user,
      retry: false,
    }
  );

  // Show skeleton only during initial auth check or first load
  if (isAuthChecking) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return null;
  }

  // Default stats if query failed (database not available)
  const defaultStats = {
    totalDebates: 0,
    completedDebates: 0,
    inProgressDebates: 0,
    avgConsensus: 0,
    thisMonth: 0,
    // New value-focused metrics
    consensusDistribution: { high: 0, medium: 0, low: 0 },
    avgDurationMinutes: 0,
    totalCostUsd: 0,
    avgCostUsd: 0,
    avgRounds: 0,
  };

  // Ensure arrays are always arrays (defensive programming)
  // Type definitions for the data structures
  type DebateItem = {
    id: string;
    question: string;
    status: string;
    consensusScore: number | null;
    createdAt: string | Date;
  };
  type NotificationItem = {
    id: string;
    debateId?: string | null;
    message: string;
    createdAt: string | Date;
  };
  type ExpertItem = {
    id: string;
    name: string;
  };

  const safeRecentDebates: DebateItem[] = Array.isArray(recentDebates)
    ? (recentDebates.filter(Boolean) as DebateItem[])
    : [];
  const safeRecentNotifications: NotificationItem[] = Array.isArray(recentNotifications)
    ? (recentNotifications.filter(Boolean) as NotificationItem[])
    : [];
  const safeMyExperts: ExpertItem[] = Array.isArray(myExperts)
    ? (myExperts.filter(Boolean) as ExpertItem[])
    : [];
  
  // Ensure stats object is always defined with safe defaults
  type StatsType = typeof defaultStats;
  const safeStats: StatsType = (stats && typeof stats === 'object' && !Array.isArray(stats)) 
    ? { ...defaultStats, ...stats } as StatsType
    : defaultStats;
  const hasDatabaseError = statsError || debatesError || notificationsError;
  
  // Final safety check: ensure all arrays are actually arrays before rendering
  if (!Array.isArray(safeRecentDebates) || !Array.isArray(safeRecentNotifications) || !Array.isArray(safeMyExperts)) {
    logger.error('[Dashboard] Array safety check failed', {
      safeRecentDebates: typeof safeRecentDebates,
      safeRecentNotifications: typeof safeRecentNotifications,
      safeMyExperts: typeof safeMyExperts,
    });
    // Return skeleton if arrays are not properly initialized
    return <DashboardSkeleton />;
  }

  // Default subscription data (TODO: implement real subscription system)
  const subscription = {
    plan: "Free",
    creditsUsed: 0, // TODO: Fetch from api.billing.getCreditsUsage
    creditsLimit: 100, // Free tier: 100 créditos una vez
  };

  const usagePercentage = (subscription.creditsUsed / subscription.creditsLimit) * 100;
  const daysUntilRenewal = 30; // TODO: Calculate from subscription.currentPeriodEnd

  return (
    <div className="min-h-screen relative styles.colors.bg.primary transition-colors duration-300">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[var(--theme-bg-primary)] to-blue-900/20 transition-colors duration-300" />
        <div className="absolute inset-0 bg-[linear-gradient(var(--theme-landing-grid)_1px,transparent_1px),linear-gradient(90deg,var(--theme-landing-grid)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      {/* Header */}
      <AppHeader 
        variant="app"
        onSettingsOpen={() => setSettingsModalOpen(true)}
        settingsInitialSection={settingsInitialSection}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-20 pb-24 sm:pb-28 md:pb-32 min-h-[calc(100vh-64px)] flex flex-col">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8 flex-shrink-0">
          <h1 className="text-2xl sm:text-3xl font-bold styles.colors.text.primary">
            ¡Hola, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split("@")[0] || 'Usuario'}!
          </h1>
          <p className="text-sm sm:text-base styles.colors.text.secondary mt-1">
            Aquí tienes un resumen de tu actividad en Quoorum.
          </p>
          {hasDatabaseError && (
            <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-yellow-300 text-sm">
                [WARN] La base de datos no está disponible. Algunos datos pueden no mostrarse correctamente.
                Asegúrate de que Docker Desktop esté corriendo y PostgreSQL esté iniciado.
              </p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 flex-shrink-0">
          {/* Card 1: Decisiones Completadas */}
          <Card className="relative overflow-hidden styles.colors.bg.secondary/80 backdrop-blur-sm border-[var(--theme-border-subtle)] group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm styles.colors.text.secondary">Decisiones Completadas</p>
                  <p className="text-2xl sm:text-3xl font-bold styles.colors.text.primary mt-1">
                    {safeStats.completedDebates || 0}
                  </p>
                  {safeStats.totalDebates > 0 && (
                    <p className="text-xs styles.colors.text.tertiary mt-1">
                      de {safeStats.totalDebates} total
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Tiempo Promedio */}
          <Card className="relative overflow-hidden styles.colors.bg.secondary/80 backdrop-blur-sm border-[var(--theme-border-subtle)] group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm styles.colors.text.secondary">Tiempo Promedio</p>
                  <p className="text-2xl sm:text-3xl font-bold styles.colors.text.primary mt-1">
                    {safeStats.avgDurationMinutes > 0
                      ? `${safeStats.avgDurationMinutes} min`
                      : "—"}
                  </p>
                  {safeStats.avgDurationMinutes > 0 && (
                    <p className="text-xs styles.colors.text.tertiary mt-1">
                      vs semanas de reuniones
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Consenso Alto */}
          <Card className="relative overflow-hidden styles.colors.bg.secondary/80 backdrop-blur-sm border-[var(--theme-border-subtle)] group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm styles.colors.text.secondary">Consenso Alto</p>
                  <p className="text-2xl sm:text-3xl font-bold styles.colors.text.primary mt-1">
                    {safeStats.consensusDistribution?.high || 0}
                  </p>
                  {safeStats.completedDebates > 0 && (
                    <p className="text-xs styles.colors.text.tertiary mt-1">
                      {Math.round(
                        ((safeStats.consensusDistribution?.high || 0) /
                          safeStats.completedDebates) *
                          100
                      )}% de decisiones
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Inversión Total */}
          <Card className="relative overflow-hidden styles.colors.bg.secondary/80 backdrop-blur-sm border-[var(--theme-border-subtle)] group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm styles.colors.text.secondary">Inversión Total</p>
                  <p className="text-2xl sm:text-3xl font-bold styles.colors.text.primary mt-1">
                    {safeStats.totalCostUsd > 0
                      ? `$${safeStats.totalCostUsd.toFixed(2)}`
                      : "$0.00"}
                  </p>
                  {safeStats.avgCostUsd > 0 && (
                    <p className="text-xs styles.colors.text.tertiary mt-1">
                      ${safeStats.avgCostUsd.toFixed(2)} por decisión
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 flex-1 overflow-hidden">
          {/* Recent Debates */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden">
            <Card className="relative overflow-hidden styles.colors.bg.secondary/80 backdrop-blur-sm border-[var(--theme-border-subtle)] group flex flex-col h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative flex flex-row items-center justify-between flex-shrink-0">
                <div>
                  <CardTitle className="bg-gradient-to-r from-[var(--theme-gradient-text-from)] to-[var(--theme-gradient-text-to)] bg-clip-text text-transparent">Debates Recientes</CardTitle>
                  <CardDescription className="styles.colors.text.tertiary">Tus últimas deliberaciones</CardDescription>
                </div>
                <Link href="/debates">
                  <Button variant="ghost" className="styles.colors.text.tertiary hover:text-blue-300 transition-colors">
                    Ver todos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col pb-6">
                {debatesError ? (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                    <p className="text-red-300 text-sm">
                      No se pudieron cargar los debates. Verifica que PostgreSQL esté corriendo.
                    </p>
                  </div>
                ) : (Array.isArray(safeRecentDebates) && safeRecentDebates.length === 0) ? (
                  <div className="p-4 rounded-lg styles.colors.bg.tertiary/50 text-center">
                    <p className="styles.colors.text.tertiary text-sm">
                      No tienes debates todavía. Crea tu primer debate para empezar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pb-2">
                    {safeRecentDebates.map((debate) => {
                      if (!debate) return null;
                      return (
                    <Link
                      key={debate.id}
                      href={`/debates/${debate.id}`}
                      className="block p-4 rounded-lg styles.colors.bg.tertiary/50 hover:bg-purple-500/10 transition-all duration-200 cursor-pointer border styles.colors.border.default hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="styles.colors.text.primary font-medium text-base leading-snug break-words mb-3">{debate.question}</p>
                          <div className="flex items-center gap-4 text-sm styles.colors.text.secondary">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(debate.createdAt).toLocaleString("es-ES", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {debate.consensusScore !== null && (
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {Math.round(debate.consensusScore * 100)}% consenso
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={debate.status === "completed" ? "default" : "secondary"}
                          className={
                            debate.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }
                        >
                          {debate.status === "completed" ? "Completado" : "En progreso"}
                        </Badge>
                      </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription Card */}
            <Card className="relative overflow-hidden styles.colors.bg.secondary/80 backdrop-blur-sm border-[var(--theme-border-subtle)] group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <CardTitle className="bg-gradient-to-r from-[var(--theme-gradient-text-from)] to-[var(--theme-gradient-text-to)] bg-clip-text text-transparent">Tu Plan</CardTitle>
                  <Badge className="bg-purple-500/20 text-purple-400">
                    {subscription.plan}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="styles.colors.text.secondary">Créditos disponibles</span>
                    <span className="styles.colors.text.primary">
                      {subscription.creditsUsed} / {subscription.creditsLimit}
                    </span>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="styles.colors.text.secondary">Próxima renovación</span>
                  <span className="styles.colors.text.primary">{daysUntilRenewal} días</span>
                </div>

                <Button 
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-700 styles.colors.text.primary relative z-10"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSettingsInitialSection('/settings/billing')
                    setSettingsModalOpen(true)
                  }}
                  type="button"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Gestionar Plan
                </Button>
              </CardContent>
            </Card>

            {/* Notifications Widget */}
            {!isAuthChecking && user && (
              <Card className="relative overflow-hidden styles.colors.bg.secondary/80 backdrop-blur-sm border-[var(--theme-border-subtle)] group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <CardTitle className="bg-gradient-to-r from-[var(--theme-gradient-text-from)] to-[var(--theme-gradient-text-to)] bg-clip-text text-transparent">
                      Notificaciones
                    </CardTitle>
                    {(unreadCount ?? 0) > 0 && (
                      <Badge className="bg-red-500/20 text-red-400">
                        {(unreadCount ?? 0) > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!Array.isArray(safeRecentNotifications) || safeRecentNotifications.length === 0 ? (
                    <div className="text-center py-4">
                      <Bell className="w-8 h-8 styles.colors.text.tertiary mx-auto mb-2" />
                      <p className="text-sm styles.colors.text.tertiary">No hay notificaciones</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Array.isArray(safeRecentNotifications) && safeRecentNotifications.length > 0 ? safeRecentNotifications.slice(0, 3).map((notification) => {
                        if (!notification) return null;
                        return (
                          <Link
                            key={notification.id}
                            href={notification.debateId ? `/debates/${notification.debateId}` : '/debates'}
                            className="block p-2 rounded-lg styles.colors.bg.tertiary/50 hover:styles.colors.bg.tertiary transition text-sm"
                          >
                            <p className="styles.colors.text.primary font-medium line-clamp-2 break-words">
                              {notification.message}
                            </p>
                            <p className="text-xs styles.colors.text.tertiary mt-1">
                              {new Date(notification.createdAt).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </p>
                          </Link>
                        );
                      }) : (
                        <p className="text-xs styles.colors.text.tertiary text-center py-2">No hay notificaciones</p>
                      )}
                      {Array.isArray(safeRecentNotifications) && safeRecentNotifications.length > 0 && (
                        <Link href="/debates" className="block mt-3">
                          <Button variant="ghost" className="w-full styles.colors.text.secondary hover:styles.colors.text.primary hover:styles.colors.bg.tertiary text-xs">
                            Ver todas
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Test Mode Toggle (solo en desarrollo) */}
            <TestModeToggle />

            {/* Upgrade Prompt (show if on free plan) */}
            {subscription.plan === "Free" && (
              <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
                <CardContent className="relative p-6">
                  <h3 className="text-lg font-semibold styles.colors.text.primary mb-2">
                    Desbloquea más poder
                  </h3>
                  <p className="styles.colors.text.secondary text-sm mb-4">
                    Actualiza a Pro para 10,000 créditos/mes, Inteligencia Corporativa y exportación a PDF profesional.
                  </p>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => {
                      // Abrir modal de gestión de suscripción (igual que el botón "Gestionar")
                      setSettingsInitialSection('/settings/billing')
                      setSettingsModalOpen(true)
                    }}
                  >
                    Actualizar Plan
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Settings Modal with blur background (like manus) */}
      <SettingsModal 
        open={settingsModalOpen} 
        onOpenChange={(open) => {
          setSettingsModalOpen(open)
          if (!open) {
            // Reset initial section when modal closes
            setSettingsInitialSection(undefined)
          }
        }}
        initialSection={settingsInitialSection}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen relative styles.colors.bg.primary transition-colors duration-300">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[var(--theme-bg-primary)] to-blue-900/20 transition-colors duration-300" />
        <div className="absolute inset-0 bg-[linear-gradient(var(--theme-landing-grid)_1px,transparent_1px),linear-gradient(90deg,var(--theme-landing-grid)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      <main className="container mx-auto px-4 py-4 sm:py-8">
        <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-2 styles.colors.bg.tertiary/60" />
        <Skeleton className="h-4 sm:h-5 w-72 sm:w-96 mb-8 styles.colors.bg.tertiary/40" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="styles.colors.bg.secondary/80 backdrop-blur-sm border-[var(--theme-border-subtle)]">
              <CardContent className="relative p-6">
                <Skeleton className="h-4 w-20 mb-2 styles.colors.bg.tertiary/60" />
                <Skeleton className="h-8 w-16 styles.colors.bg.tertiary/60" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 styles.colors.bg.secondary/80 backdrop-blur-sm border-[var(--theme-border-subtle)]">
            <CardHeader>
              <Skeleton className="h-6 w-40 styles.colors.bg.tertiary/60" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full styles.colors.bg.tertiary/40" />
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="relative overflow-hidden styles.colors.bg.secondary/80 backdrop-blur-sm border-[var(--theme-border-subtle)] group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader>
                <Skeleton className="h-6 w-24 styles.colors.bg.tertiary/60" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full styles.colors.bg.tertiary/40" />
                <Skeleton className="h-2 w-full styles.colors.bg.tertiary/40" />
                <Skeleton className="h-10 w-full styles.colors.bg.tertiary/60" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
