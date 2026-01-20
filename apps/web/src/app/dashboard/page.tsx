"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle,
  CreditCard,
  MessageCircle,
  Bell,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { SettingsModal } from "@/components/settings/settings-modal";
import type { User } from "@supabase/supabase-js";

interface DashboardData {
  subscription: {
    plan: string;
    status: string;
    debatesUsed: number;
    debatesLimit: number;
    currentPeriodEnd: string;
  };
  recentDebates: Array<{
    id: string;
    question: string;
    status: string;
    consensusScore: number | null;
    createdAt: string;
  }>;
  stats: {
    totalDebates: number;
    completedDebates: number;
    avgConsensus: number;
    thisMonth: number;
  };
}

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
  const { data: stats, isLoading: statsLoading, error: statsError } = api.debates.stats.useQuery(
    undefined,
    { 
      enabled: !isAuthChecking && !!user,
      retry: false, // Don't retry on error to show UI faster
    }
  );

  // Fetch recent debates via tRPC (with error handling)
  const { data: recentDebates = [], isLoading: debatesLoading, error: debatesError } = api.debates.list.useQuery(
    { limit: 5, offset: 0 },
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

  const { data: recentNotifications, error: notificationsListError } = api.quoorumNotifications.list.useQuery(
    { limit: 3 },
    { 
      enabled: !isAuthChecking && !!user,
      retry: false,
    }
  );

  // Get current user role (to show admin menu)
  const { data: currentUser } = api.users.getMe.useQuery(
    undefined,
    { 
      enabled: !isAuthChecking && !!user,
      retry: false,
    }
  );

  const isLoading = isAuthChecking || statsLoading || debatesLoading;

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
  };

  const displayStats = stats || defaultStats;
  const hasDatabaseError = statsError || debatesError || notificationsError;

  // Default subscription data (TODO: implement real subscription system)
  const subscription = {
    plan: "Free",
    debatesUsed: displayStats.totalDebates,
    debatesLimit: 10,
  };

  const usagePercentage = (subscription.debatesUsed / subscription.debatesLimit) * 100;
  const daysUntilRenewal = 30; // TODO: Calculate from subscription.currentPeriodEnd

  return (
    <div className="min-h-screen relative bg-slate-950">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      {/* Header */}
      <AppHeader 
        variant="app"
        onSettingsOpen={() => setSettingsModalOpen(true)}
        settingsInitialSection={settingsInitialSection}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            ¡Hola, {user.user_metadata?.full_name || user.email?.split("@")[0]}!
          </h1>
          <p className="text-sm sm:text-base text-gray-300 mt-1">
            Aquí tienes un resumen de tu actividad en Quoorum.
          </p>
          {hasDatabaseError && (
            <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-yellow-300 text-sm">
                ⚠️ La base de datos no está disponible. Algunos datos pueden no mostrarse correctamente.
                Asegúrate de que Docker Desktop esté corriendo y PostgreSQL esté iniciado.
              </p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="relative overflow-hidden bg-slate-900/60 backdrop-blur-sm border-purple-500/20 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Total Debates</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{displayStats.totalDebates}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-slate-900/60 backdrop-blur-sm border-purple-500/20 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Completados</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{displayStats.completedDebates}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-slate-900/60 backdrop-blur-sm border-purple-500/20 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Consenso Promedio</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{displayStats.avgConsensus}%</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-slate-900/60 backdrop-blur-sm border-purple-500/20 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Este Mes</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{displayStats.thisMonth}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Recent Debates */}
          <div className="lg:col-span-2">
            <Card className="relative overflow-hidden bg-slate-900/60 backdrop-blur-sm border-purple-500/20 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">Debates Recientes</CardTitle>
                  <CardDescription className="text-gray-400">Tus últimas deliberaciones</CardDescription>
                </div>
                <Link href="/debates">
                  <Button variant="ghost" className="text-gray-400 hover:text-blue-300 transition-colors">
                    Ver todos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {debatesError ? (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                    <p className="text-red-300 text-sm">
                      No se pudieron cargar los debates. Verifica que PostgreSQL esté corriendo.
                    </p>
                  </div>
                ) : recentDebates.length === 0 ? (
                  <div className="p-4 rounded-lg bg-white/5 text-center">
                    <p className="text-gray-400 text-sm">
                      No tienes debates todavía. Crea tu primer debate para empezar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentDebates.map((debate) => (
                    <Link
                      key={debate.id}
                      href={`/debates/${debate.id}`}
                      className="block p-4 rounded-lg bg-white/5 hover:bg-white/10 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate break-words">{debate.question}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(debate.createdAt).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
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
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription Card */}
            <Card className="relative overflow-hidden bg-slate-900/60 backdrop-blur-sm border-purple-500/20 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <CardTitle className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">Tu Plan</CardTitle>
                  <Badge className="bg-purple-500/20 text-purple-400">
                    {subscription.plan}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-300">Debates este mes</span>
                    <span className="text-white">
                      {subscription.debatesUsed} / {subscription.debatesLimit}
                    </span>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Próxima renovación</span>
                  <span className="text-white">{daysUntilRenewal} días</span>
                </div>

                <Button 
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white relative z-10"
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
              <Card className="relative overflow-hidden bg-slate-900/60 backdrop-blur-sm border-purple-500/20 group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <CardTitle className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
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
                  {!recentNotifications || recentNotifications.length === 0 ? (
                    <div className="text-center py-4">
                      <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No hay notificaciones</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentNotifications.slice(0, 3).map((notification) => (
                        <Link
                          key={notification.id}
                          href={notification.debateId ? `/debates/${notification.debateId}` : '/debates'}
                          className="block p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm"
                        >
                          <p className="text-white font-medium line-clamp-2 break-words">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                        </Link>
                      ))}
                      <Link href="/debates" className="block mt-3">
                        <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-white/10 text-xs">
                          Ver todas
                          <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upgrade Prompt (show if on free plan) */}
            {subscription.plan === "Free" && (
              <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
                <CardContent className="relative p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Desbloquea más poder
                  </h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Actualiza a Pro para 50 debates/mes, más expertos y exportación a PDF.
                  </p>
                  <Link href="/pricing">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      Actualizar Plan
                    </Button>
                  </Link>
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
    <div className="min-h-screen relative bg-slate-950">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      <main className="container mx-auto px-4 py-4 sm:py-8">
        <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-2 bg-slate-800/60" />
        <Skeleton className="h-4 sm:h-5 w-72 sm:w-96 mb-8 bg-slate-800/40" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-slate-900/60 backdrop-blur-sm border-purple-500/20">
              <CardContent className="relative p-6">
                <Skeleton className="h-4 w-20 mb-2 bg-slate-800/60" />
                <Skeleton className="h-8 w-16 bg-slate-800/60" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 bg-slate-900/60 backdrop-blur-sm border-purple-500/20">
            <CardHeader>
              <Skeleton className="h-6 w-40 bg-slate-800/60" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full bg-slate-800/40" />
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="relative overflow-hidden bg-slate-900/60 backdrop-blur-sm border-purple-500/20 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <Skeleton className="h-6 w-24 bg-slate-800/60" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full bg-slate-800/40" />
                <Skeleton className="h-2 w-full bg-slate-800/40" />
                <Skeleton className="h-10 w-full bg-slate-800/60" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
