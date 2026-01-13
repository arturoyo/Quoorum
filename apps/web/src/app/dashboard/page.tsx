"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  MessageCircle,
  Plus,
  History,
  Settings,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle,
  CreditCard,
} from "lucide-react";
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      try {
        // Fetch real data from database
        const { data: debates, error: debatesError } = await supabase
          .from("forum_debates")
          .select("id, question, status, consensus_score, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (debatesError) {
          logger.error("Error fetching debates", debatesError);
        }

        // Fetch subscription data (default to Free for now)
        const { data: subscription, error: subscriptionError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          // PGRST116 is "not found" which is expected if no subscription exists
          logger.error("Error fetching subscription", subscriptionError);
        }

        // Calculate stats
        const { count: totalCount } = await supabase
          .from("forum_debates")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        const { count: completedCount } = await supabase
          .from("forum_debates")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed");

        const { data: avgData } = await supabase
          .from("forum_debates")
          .select("consensus_score")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .not("consensus_score", "is", null);

        const avgConsensus =
          avgData && avgData.length > 0
            ? Math.round(
                avgData.reduce((sum, d) => sum + (d.consensus_score || 0), 0) /
                  avgData.length
              )
            : 0;

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: thisMonthCount } = await supabase
          .from("forum_debates")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", startOfMonth.toISOString());

        setData({
          subscription: {
            plan: subscription?.plan_id || "Free",
            status: subscription?.status || "active",
            debatesUsed: totalCount || 0,
            debatesLimit: subscription?.plan_id === "Pro" ? 50 : 10,
            currentPeriodEnd:
              subscription?.current_period_end ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          recentDebates:
            debates?.map((d) => ({
              id: d.id,
              question: d.question,
              status: d.status,
              consensusScore: d.consensus_score,
              createdAt: d.created_at,
            })) || [],
          stats: {
            totalDebates: totalCount || 0,
            completedDebates: completedCount || 0,
            avgConsensus,
            thisMonth: thisMonthCount || 0,
          },
        });
      } catch (error) {
        logger.error("Error loading dashboard", error as Error);
        // Set empty data on error
        setData({
          subscription: {
            plan: "Free",
            status: "active",
            debatesUsed: 0,
            debatesLimit: 10,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          recentDebates: [],
          stats: {
            totalDebates: 0,
            completedDebates: 0,
            avgConsensus: 0,
            thisMonth: 0,
          },
        });
      }

      setIsLoading(false);
    }

    loadDashboard();
  }, [router, supabase.auth]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user || !data) {
    return null;
  }

  const usagePercentage = (data.subscription.debatesUsed / data.subscription.debatesLimit) * 100;
  const daysUntilRenewal = Math.ceil(
    (new Date(data.subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Quoorum</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm text-purple-400 font-medium">
                Dashboard
              </Link>
              <Link href="/debates" className="text-sm text-gray-400 hover:text-white">
                Debates
              </Link>
              <Link href="/settings" className="text-sm text-gray-400 hover:text-white">
                Configuración
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/debates/new">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Debate
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            ¡Hola, {user.user_metadata?.full_name || user.email?.split("@")[0]}!
          </h1>
          <p className="text-gray-400 mt-1">
            Aquí tienes un resumen de tu actividad en Quoorum.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Debates</p>
                  <p className="text-3xl font-bold text-white mt-1">{data.stats.totalDebates}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completados</p>
                  <p className="text-3xl font-bold text-white mt-1">{data.stats.completedDebates}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Consenso Promedio</p>
                  <p className="text-3xl font-bold text-white mt-1">{data.stats.avgConsensus}%</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Este Mes</p>
                  <p className="text-3xl font-bold text-white mt-1">{data.stats.thisMonth}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Debates */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Debates Recientes</CardTitle>
                  <CardDescription>Tus últimas deliberaciones</CardDescription>
                </div>
                <Link href="/debates">
                  <Button variant="ghost" className="text-gray-400 hover:text-white">
                    Ver todos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentDebates.map((debate) => (
                    <Link
                      key={debate.id}
                      href={`/debates/${debate.id}`}
                      className="block p-4 rounded-lg bg-white/5 hover:bg-white/10 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{debate.question}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
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
                                {debate.consensusScore}% consenso
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

                {data.recentDebates.length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No tienes debates aún</p>
                    <Link href="/debates/new">
                      <Button className="mt-4 bg-purple-600 hover:bg-purple-700">
                        Crear tu primer debate
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription Card */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Tu Plan</CardTitle>
                  <Badge className="bg-purple-500/20 text-purple-400">
                    {data.subscription.plan}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Debates este mes</span>
                    <span className="text-white">
                      {data.subscription.debatesUsed} / {data.subscription.debatesLimit}
                    </span>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Próxima renovación</span>
                  <span className="text-white">{daysUntilRenewal} días</span>
                </div>

                <Link href="/settings/billing" className="block">
                  <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/10">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Gestionar Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/debates/new" className="block">
                  <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10">
                    <Plus className="mr-3 h-4 w-4" />
                    Nuevo Debate
                  </Button>
                </Link>
                <Link href="/debates" className="block">
                  <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10">
                    <History className="mr-3 h-4 w-4" />
                    Ver Historial
                  </Button>
                </Link>
                <Link href="/settings" className="block">
                  <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10">
                    <Settings className="mr-3 h-4 w-4" />
                    Configuración
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Upgrade Prompt (show if on free plan) */}
            {data.subscription.plan === "Free" && (
              <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
                <CardContent className="p-6">
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
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-white/10 bg-slate-900/80 h-16" />
      <main className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-2 bg-white/10" />
        <Skeleton className="h-5 w-96 mb-8 bg-white/10" />

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2 bg-white/10" />
                <Skeleton className="h-8 w-16 bg-white/10" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 bg-white/5 border-white/10">
            <CardHeader>
              <Skeleton className="h-6 w-40 bg-white/10" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full bg-white/10" />
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <Skeleton className="h-6 w-24 bg-white/10" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-2 w-full bg-white/10" />
                <Skeleton className="h-10 w-full bg-white/10" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
