"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  Loader2,
  Shield,
  CheckCircle,
  XCircle,
  Database,
  Settings,
  Gauge,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  AlertTriangle,
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
  const { data: systemConfig, isLoading } = api.admin.getSystemConfig.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen styles.colors.bg.primary flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const envConfig = systemConfig?.env ?? {};
  const features = systemConfig?.features ?? {};
  const limits = systemConfig?.limits ?? {};

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold styles.colors.text.primary flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-400" />
            Panel de Administración
          </h1>
          <p className="mt-2 styles.colors.text.secondary">
            Configuración del sistema, variables de entorno y límites
          </p>
        </div>

        {/* Environment Variables Status */}
        <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="styles.colors.text.primary flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-400" />
              Variables de Entorno
            </CardTitle>
            <CardDescription className="styles.colors.text.secondary">
              Estado de configuración de servicios externos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
              {Object.entries(envConfig).map(([key, isConfigured]) => (
                <div
                  key={key}
                  className={`p-3 rounded-lg border ${
                    isConfigured
                      ? "border-green-500/30 bg-green-500/10"
                      : "border-red-500/30 bg-red-500/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium styles.colors.text.primary capitalize">
                      {key}
                    </span>
                    {isConfigured ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <p className="text-xs styles.colors.text.secondary mt-1">
                    {isConfigured ? "Configurado" : "No configurado"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="styles.colors.text.primary flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-400" />
              Features Habilitados
            </CardTitle>
            <CardDescription className="styles.colors.text.secondary">
              Funcionalidades activas en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(features).map(([feature, isEnabled]) => (
                <Badge
                  key={feature}
                  variant="outline"
                  className={
                    isEnabled
                      ? "border-green-500/40 text-green-300 bg-green-500/10"
                      : "styles.colors.border.default styles.colors.text.secondary styles.colors.bg.tertiary"
                  }
                >
                  {isEnabled ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                  {feature}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Limits */}
        <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="styles.colors.text.primary flex items-center gap-2">
              <Gauge className="h-5 w-5 text-purple-400" />
              Límites del Sistema
            </CardTitle>
            <CardDescription className="styles.colors.text.secondary">
              Configuración de límites y cuotas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(limits).map(([limitName, value]) => (
                <div
                  key={limitName}
                  className="p-4 rounded-lg border styles.colors.border.default styles.colors.bg.tertiary"
                >
                  <p className="text-xs styles.colors.text.secondary mb-1 capitalize">
                    {limitName.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-xl font-bold styles.colors.text.primary">
                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Debate Costs Analytics by Phase */}
        <DebatesCostAnalyticsTable />

        {/* AI Cost Analytics */}
        <AICostAnalytics />

        {/* Info Note */}
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-sm text-yellow-300">
            [WARN] <strong>Nota:</strong> Para modificar la configuración del sistema, actualiza las variables de entorno en <code className="font-mono text-xs">.env</code> (desarrollo) o en el panel de Vercel (producción) y reinicia el servidor.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * AI Cost Analytics Section
 * Shows comprehensive AI usage and cost tracking
 */
function AICostAnalytics() {
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  // Fetch AI cost summary
  const { data: summary, isLoading: summaryLoading } = api.admin.getAICostSummary.useQuery(dateRange);

  // Fetch top users by AI cost
  const { data: topUsers, isLoading: usersLoading } = api.admin.getTopUsersByAICost.useQuery({
    limit: 10,
    ...dateRange,
  });

  if (summaryLoading) {
    return (
      <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="styles.colors.text.primary flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            Análisis de Costos de IA
          </CardTitle>
          <CardDescription className="styles.colors.text.secondary">
            Cargando datos...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Loader2 className="w-6 h-6 text-purple-500 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="styles.colors.text.primary flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            Análisis de Costos de IA
          </CardTitle>
          <CardDescription className="styles.colors.text.secondary">
            No hay datos disponibles
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const freeTierWarning = summary.freeTierRatio < 0.7; // Warn if less than 70% free tier

  return (
    <div className="space-y-6">
      <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="styles.colors.text.primary flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            Análisis de Costos de IA
          </CardTitle>
          <CardDescription className="styles.colors.text.secondary">
            Seguimiento de todas las operaciones de IA incluyendo free tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="p-4 rounded-lg border styles.colors.border.default styles.colors.bg.tertiary">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <p className="text-xs styles.colors.text.secondary">Costo Total</p>
              </div>
              <p className="text-2xl font-bold styles.colors.text.primary">
                ${summary.totalCostUsd.toFixed(4)}
              </p>
              <p className="text-xs styles.colors.text.tertiary mt-1">
                {summary.totalRequests.toLocaleString()} requests
              </p>
            </div>

            <div className="p-4 rounded-lg border styles.colors.border.default styles.colors.bg.tertiary">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <p className="text-xs styles.colors.text.secondary">Total Tokens</p>
              </div>
              <p className="text-2xl font-bold styles.colors.text.primary">
                {summary.totalTokens.toLocaleString()}
              </p>
              <p className="text-xs styles.colors.text.tertiary mt-1">
                Prompt + Completion
              </p>
            </div>

            <div className="p-4 rounded-lg border styles.colors.border.default styles.colors.bg.tertiary">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-purple-400" />
                <p className="text-xs styles.colors.text.secondary">Free Tier</p>
              </div>
              <p className="text-2xl font-bold styles.colors.text.primary">
                {(summary.freeTierRatio * 100).toFixed(1)}%
              </p>
              <p className="text-xs styles.colors.text.tertiary mt-1">
                {summary.freeRequests.toLocaleString()} / {summary.totalRequests.toLocaleString()} requests
              </p>
            </div>

            <div className="p-4 rounded-lg border styles.colors.border.default styles.colors.bg.tertiary">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-amber-400" />
                <p className="text-xs styles.colors.text.secondary">Paid Tier</p>
              </div>
              <p className="text-2xl font-bold styles.colors.text.primary">
                ${summary.totalCostUsd.toFixed(4)}
              </p>
              <p className="text-xs styles.colors.text.tertiary mt-1">
                {summary.paidRequests.toLocaleString()} requests
              </p>
            </div>
          </div>

          {/* Free Tier Warning */}
          {freeTierWarning && (
            <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <p className="text-sm font-semibold text-amber-300">
                  [WARN] Uso de Free Tier Bajo
                </p>
              </div>
              <p className="text-sm text-amber-200">
                Solo el {(summary.freeTierRatio * 100).toFixed(1)}% de las operaciones usan free tier.
                Considera optimizar el uso de modelos para reducir costos.
              </p>
            </div>
          )}

          {/* Breakdown by Operation */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold styles.colors.text.primary mb-3">Desglose por Operación</h3>
            <div className="space-y-2">
              {Object.entries(summary.byOperation as Record<string, number>)
                .sort(([, a], [, b]) => b - a)
                .map(([operation, cost]) => {
                  const percentage = summary.totalCostUsd > 0 ? (cost / summary.totalCostUsd) * 100 : 0;
                  return (
                    <div key={operation} className="flex items-center justify-between p-2 rounded styles.colors.bg.tertiary">
                      <span className="text-sm styles.colors.text.secondary capitalize">
                        {operation.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 styles.colors.bg.input rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-purple-500 h-full rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono styles.colors.text.primary w-20 text-right">
                          ${cost.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Breakdown by Provider */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold styles.colors.text.primary mb-3">Desglose por Provider</h3>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(summary.byProvider as Record<string, number>)
                .sort(([, a], [, b]) => b - a)
                .map(([provider, cost]) => (
                  <div key={provider} className="p-3 rounded-lg border styles.colors.border.default styles.colors.bg.tertiary">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium styles.colors.text.primary capitalize">
                        {provider}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          cost === 0
                            ? "border-green-500/40 text-green-300 bg-green-500/10"
                            : "border-amber-500/40 text-amber-300 bg-amber-500/10"
                        }
                      >
                        {cost === 0 ? "FREE" : `$${cost.toFixed(4)}`}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Top Users */}
          {!usersLoading && topUsers && topUsers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold styles.colors.text.primary mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" />
                Top 10 Usuarios por Costo de IA
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b styles.colors.border.default">
                      <th className="text-left py-2 px-2 styles.colors.text.secondary font-medium">
                        Usuario
                      </th>
                      <th className="text-right py-2 px-2 styles.colors.text.secondary font-medium">
                        Requests
                      </th>
                      <th className="text-right py-2 px-2 styles.colors.text.secondary font-medium">
                        Tokens
                      </th>
                      <th className="text-right py-2 px-2 styles.colors.text.secondary font-medium">
                        Costo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topUsers.map((user, index) => (
                      <tr key={user.userId} className="border-b styles.colors.border.default hover:styles.colors.bg.tertiary">
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs styles.colors.text.tertiary w-6">
                              #{index + 1}
                            </span>
                            <div>
                              <div className="styles.colors.text.primary text-sm">{user.name || 'Unknown'}</div>
                              <div className="styles.colors.text.tertiary text-xs">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right styles.colors.text.primary">
                          {user.requestCount.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-right styles.colors.text.primary">
                          {user.totalTokens.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-right styles.colors.text.primary font-mono">
                          ${user.totalCostUsd.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Debate Costs Analytics Table
 * Shows cost breakdown by phase for all debates
 */
function DebatesCostAnalyticsTable() {
  const { data: debates, isLoading } = api.admin.getDebatesCostAnalytics.useQuery();

  if (isLoading) {
    return (
      <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="styles.colors.text.primary">Análisis de Costos por Fase</CardTitle>
          <CardDescription className="styles.colors.text.secondary">
            Cargando datos...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Loader2 className="w-6 h-6 text-purple-500 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (!debates || debates.length === 0) {
    return (
      <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="styles.colors.text.primary">Análisis de Costos por Fase</CardTitle>
          <CardDescription className="styles.colors.text.secondary">
            No hay debates completados aún
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const phases: Array<'context' | 'experts' | 'strategy' | 'revision' | 'debate' | 'synthesis'> = [
    'context',
    'experts',
    'strategy',
    'revision',
    'debate',
    'synthesis',
  ];

  const phaseLabels: Record<typeof phases[number], string> = {
    context: 'Contexto',
    experts: 'Expertos',
    strategy: 'Estrategia',
    revision: 'Revisión',
    debate: 'Debate',
    synthesis: 'Síntesis',
  };

  return (
    <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="styles.colors.text.primary flex items-center gap-2">
          <Gauge className="h-5 w-5 text-purple-400" />
          Análisis de Costos por Fase
        </CardTitle>
        <CardDescription className="styles.colors.text.secondary">
          Desglose de créditos consumidos por fase de cada debate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b styles.colors.border.default">
                <th className="text-left py-3 px-2 styles.colors.text.secondary font-medium">
                  Usuario
                </th>
                <th className="text-left py-3 px-2 styles.colors.text.secondary font-medium">
                  Debate
                </th>
                <th className="text-left py-3 px-2 styles.colors.text.secondary font-medium">
                  Fecha
                </th>
                {phases.map((phase) => (
                  <th
                    key={phase}
                    className="text-right py-3 px-2 styles.colors.text.secondary font-medium"
                  >
                    {phaseLabels[phase]}
                  </th>
                ))}
                <th className="text-right py-3 px-2 styles.colors.text.primary font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {debates.map((debate) => {
                const costsByPhase = (debate.costsByPhase as Record<string, { creditsUsed: number }>) || {};
                const totalCredits = debate.totalCreditsUsed || 0;

                return (
                  <tr key={debate.id} className="border-b styles.colors.border.default hover:styles.colors.bg.tertiary">
                    <td className="py-3 px-2">
                      <div className="styles.colors.text.primary text-xs">{debate.userName}</div>
                      <div className="styles.colors.text.tertiary text-xs">
                        {debate.userEmail}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="styles.colors.text.primary text-xs max-w-[200px] truncate">
                        {debate.question}
                      </div>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {debate.totalRounds} rondas
                      </Badge>
                    </td>
                    <td className="py-3 px-2 styles.colors.text.secondary text-xs">
                      {debate.completedAt
                        ? new Date(debate.completedAt).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                          })
                        : '-'}
                    </td>
                    {phases.map((phase) => {
                      const credits = costsByPhase[phase]?.creditsUsed || 0;
                      return (
                        <td key={phase} className="py-3 px-2 text-right styles.colors.text.primary text-xs">
                          {credits > 0 ? credits.toLocaleString() : '-'}
                        </td>
                      );
                    })}
                    <td className="py-3 px-2 text-right styles.colors.text.primary font-semibold">
                      {totalCredits.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
