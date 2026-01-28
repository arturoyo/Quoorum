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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
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
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-400" />
            Panel de Administración
          </h1>
          <p className="mt-2 text-[var(--theme-text-secondary)]">
            Configuración del sistema, variables de entorno y límites
          </p>
        </div>

        {/* Environment Variables Status */}
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-400" />
              Variables de Entorno
            </CardTitle>
            <CardDescription className="text-[var(--theme-text-secondary)]">
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
                    <span className="text-sm font-medium text-white capitalize">
                      {key}
                    </span>
                    {isConfigured ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
                    {isConfigured ? "Configurado" : "No configurado"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-400" />
              Features Habilitados
            </CardTitle>
            <CardDescription className="text-[var(--theme-text-secondary)]">
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
                      : "border-gray-500/40 text-[var(--theme-text-secondary)] bg-gray-500/10"
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
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Gauge className="h-5 w-5 text-purple-400" />
              Límites del Sistema
            </CardTitle>
            <CardDescription className="text-[var(--theme-text-secondary)]">
              Configuración de límites y cuotas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(limits).map(([limitName, value]) => (
                <div
                  key={limitName}
                  className="p-4 rounded-lg border border-white/10 bg-slate-800/50"
                >
                  <p className="text-xs text-[var(--theme-text-secondary)] mb-1 capitalize">
                    {limitName.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-xl font-bold text-white">
                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Debate Costs Analytics by Phase */}
        <DebatesCostAnalyticsTable />

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
 * Debate Costs Analytics Table
 * Shows cost breakdown by phase for all debates
 */
function DebatesCostAnalyticsTable() {
  const { data: debates, isLoading } = api.admin.getDebatesCostAnalytics.useQuery();

  if (isLoading) {
    return (
      <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Análisis de Costos por Fase</CardTitle>
          <CardDescription className="text-[var(--theme-text-secondary)]">
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
      <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Análisis de Costos por Fase</CardTitle>
          <CardDescription className="text-[var(--theme-text-secondary)]">
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
    <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Gauge className="h-5 w-5 text-purple-400" />
          Análisis de Costos por Fase
        </CardTitle>
        <CardDescription className="text-[var(--theme-text-secondary)]">
          Desglose de créditos consumidos por fase de cada debate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-2 text-[var(--theme-text-secondary)] font-medium">
                  Usuario
                </th>
                <th className="text-left py-3 px-2 text-[var(--theme-text-secondary)] font-medium">
                  Debate
                </th>
                <th className="text-left py-3 px-2 text-[var(--theme-text-secondary)] font-medium">
                  Fecha
                </th>
                {phases.map((phase) => (
                  <th
                    key={phase}
                    className="text-right py-3 px-2 text-[var(--theme-text-secondary)] font-medium"
                  >
                    {phaseLabels[phase]}
                  </th>
                ))}
                <th className="text-right py-3 px-2 text-white font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {debates.map((debate) => {
                const costsByPhase = (debate.costsByPhase as Record<string, { creditsUsed: number }>) || {};
                const totalCredits = debate.totalCreditsUsed || 0;

                return (
                  <tr key={debate.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-2">
                      <div className="text-white text-xs">{debate.userName}</div>
                      <div className="text-[var(--theme-text-tertiary)] text-xs">
                        {debate.userEmail}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-white text-xs max-w-[200px] truncate">
                        {debate.question}
                      </div>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {debate.totalRounds} rondas
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-[var(--theme-text-secondary)] text-xs">
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
                        <td key={phase} className="py-3 px-2 text-right text-white text-xs">
                          {credits > 0 ? credits.toLocaleString() : '-'}
                        </td>
                      );
                    })}
                    <td className="py-3 px-2 text-right text-white font-semibold">
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
