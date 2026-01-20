"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Loader2,
  Settings,
  Users,
  Search,
  Plus,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAddCreditsDialogOpen, setIsAddCreditsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    email: string;
    name: string;
    credits: number;
  } | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState(1000);
  const [creditReason, setCreditReason] = useState("");
  const [userSearch, setUserSearch] = useState("");

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
  const { data: creditMultiplier } = api.admin.getCreditMultiplier.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: stripeConfig } = api.admin.getStripeConfig.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: modelHealth, refetch: refetchHealth } = api.admin.getModelHealth.useQuery(
    undefined,
    { enabled: isAuthenticated, refetchInterval: 30000 } // Refresh every 30s
  );

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = api.admin.searchUsers.useQuery(
    {
      search: userSearch || undefined,
      limit: 20,
    },
    { enabled: isAuthenticated && userSearch.length >= 3 }
  );

  // Mutations
  const addCredits = api.admin.addCredits.useMutation({
    onSuccess: (data) => {
      toast.success(`✓ ${data.creditsAdded} créditos añadidos. Nuevo saldo: ${data.newBalance}`);
      setIsAddCreditsDialogOpen(false);
      setSelectedUser(null);
      setCreditsToAdd(1000);
      setCreditReason("");
      void refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddCredits = (user: NonNullable<typeof users>[number]) => {
    setSelectedUser({
      id: user.id,
      email: user.email,
      name: user.name,
      credits: user.credits,
    });
    setIsAddCreditsDialogOpen(true);
  };

  const confirmAddCredits = () => {
    if (!selectedUser) return;
    if (creditsToAdd <= 0) {
      toast.error("Los créditos deben ser positivos");
      return;
    }

    addCredits.mutate({
      userId: selectedUser.id,
      credits: creditsToAdd,
      reason: creditReason || undefined,
    });
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-400 bg-green-500/10 border-green-500/30";
      case "degraded":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "down":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      default:
        return "text-gray-300 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4" />;
      case "degraded":
        return <AlertCircle className="h-4 w-4" />;
      case "down":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Settings className="h-8 w-8 text-purple-400" />
              Panel de Administración
            </h1>
            <p className="mt-2 text-gray-400">
              Control de margen, gestión de usuarios y monitor de APIs
            </p>
          </div>

          {/* Credit Multiplier Control */}
          <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-400" />
                Control de Margen (CREDIT_MULTIPLIER)
              </CardTitle>
              <CardDescription className="text-gray-300">
                Multiplicador de margen para cálculo de créditos. Fórmula: créditos = (costUsd × multiplicador) / 0.005
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {creditMultiplier && (
                <>
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Valor Actual</p>
                        <p className="text-2xl font-bold text-white">{creditMultiplier.multiplier}</p>
                      </div>
                      <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10">
                        Configurado en código
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Fórmula:</p>
                    <code className="text-sm text-gray-300 font-mono">
                      {creditMultiplier.formula}
                    </code>
                  </div>

                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-xs text-yellow-300">
                      ⚠️ <strong>Nota:</strong> Para cambiar el multiplicador, edita <code className="font-mono text-xs">CREDIT_MULTIPLIER</code> en{" "}
                      <code className="font-mono text-xs">packages/quoorum/src/analytics/cost.ts</code> y reinicia el servidor.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* User Management */}
          <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                Gestión de Usuarios
              </CardTitle>
              <CardDescription className="text-gray-300">
                Busca usuarios por email y gestiona sus créditos (para soporte técnico)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por email o nombre (mínimo 3 caracteres)..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10 border-white/10 bg-slate-800/50 text-white"
                  />
                </div>
              </div>

              {usersLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
                </div>
              )}

              {!usersLoading && userSearch.length >= 3 && users && users.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No se encontraron usuarios
                </div>
              )}

              {!usersLoading && users && users.length > 0 && (
                <div className="border border-white/10 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-300">Email</TableHead>
                        <TableHead className="text-gray-300">Nombre</TableHead>
                        <TableHead className="text-gray-300">Tier</TableHead>
                        <TableHead className="text-gray-300">Créditos</TableHead>
                        <TableHead className="text-gray-300">Rol</TableHead>
                        <TableHead className="text-gray-300">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="border-white/10">
                          <TableCell className="text-white">{user.email}</TableCell>
                          <TableCell className="text-gray-300">{user.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10">
                              {user.tier}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white font-mono">
                            {user.credits.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-blue-500/40 text-blue-300 bg-blue-500/10">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleAddCredits(user)}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Añadir Créditos
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {userSearch.length < 3 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Escribe al menos 3 caracteres para buscar usuarios
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stripe Configuration */}
          <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-400" />
                Configuración de Stripe
              </CardTitle>
              <CardDescription className="text-gray-300">
                Variables de entorno de Stripe (solo lectura - configurar en .env o Vercel)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stripeConfig && (
                <div className="space-y-4">
                  {/* Stripe Keys */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-3 rounded-lg border border-white/10 bg-slate-800/50">
                      <p className="text-xs text-gray-400 mb-1">STRIPE_SECRET_KEY</p>
                      <p className={`text-sm font-mono ${stripeConfig.hasSecretKey ? 'text-green-400' : 'text-red-400'}`}>
                        {stripeConfig.secretKeyPrefix}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-white/10 bg-slate-800/50">
                      <p className="text-xs text-gray-400 mb-1">STRIPE_WEBHOOK_SECRET</p>
                      <p className={`text-sm font-mono ${stripeConfig.hasWebhookSecret ? 'text-green-400' : 'text-red-400'}`}>
                        {stripeConfig.webhookSecretPrefix}
                      </p>
                    </div>
                  </div>

                  {/* Subscription Price IDs */}
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">Price IDs - Suscripciones</p>
                    <div className="space-y-2">
                      {Object.entries(stripeConfig.priceIds).map(([plan, prices]) => (
                        <div key={plan} className="p-3 rounded-lg border border-white/10 bg-slate-800/50">
                          <p className="text-xs font-medium text-purple-300 mb-2 capitalize">{plan}</p>
                          <div className="grid gap-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Mensual:</span>
                              <code className={`font-mono ${prices.monthly !== 'NO CONFIGURADO' ? 'text-green-400' : 'text-red-400'}`}>
                                {prices.monthly}
                              </code>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Anual:</span>
                              <code className={`font-mono ${prices.yearly !== 'NO CONFIGURADO' ? 'text-green-400' : 'text-red-400'}`}>
                                {prices.yearly}
                              </code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Credit Pack Price IDs */}
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">Price IDs - Paquetes de Créditos</p>
                    <div className="grid gap-2 md:grid-cols-3">
                      {Object.entries(stripeConfig.creditPacks).map(([credits, priceId]) => (
                        <div key={credits} className="p-3 rounded-lg border border-white/10 bg-slate-800/50">
                          <p className="text-xs text-gray-400 mb-1">{credits} créditos</p>
                          <code className={`text-xs font-mono block truncate ${priceId !== 'NO CONFIGURADO' ? 'text-green-400' : 'text-red-400'}`}>
                            {priceId}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* App URL */}
                  <div className="p-3 rounded-lg border border-white/10 bg-slate-800/50">
                    <p className="text-xs text-gray-400 mb-1">NEXT_PUBLIC_APP_URL</p>
                    <code className="text-sm font-mono text-blue-400">{stripeConfig.appUrl}</code>
                  </div>

                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-xs text-yellow-300">
                      ⚠️ <strong>Nota:</strong> Estas variables se configuran en el archivo <code className="font-mono text-xs">.env</code> local o en el panel de Vercel para producción. No se pueden modificar desde aquí por seguridad.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Model Health Monitor */}
          <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-400" />
                    Monitor de APIs
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Estado de salud de los modelos de IA y proveedores
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void refetchHealth()}
                  className="border-white/10 bg-slate-800/50 text-white hover:bg-white/10"
                >
                  <Loader2 className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {modelHealth && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge
                      variant="outline"
                      className={
                        modelHealth.overallHealth === "healthy"
                          ? "border-green-500/40 text-green-300 bg-green-500/10"
                          : modelHealth.overallHealth === "degraded"
                          ? "border-yellow-500/40 text-yellow-300 bg-yellow-500/10"
                          : "border-red-500/40 text-red-300 bg-red-500/10"
                      }
                    >
                      Estado General: {modelHealth.overallHealth === "healthy" ? "Saludable" : modelHealth.overallHealth === "degraded" ? "Degradado" : "Caído"}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      Última verificación: {format(new Date(modelHealth.lastChecked), "PPp", { locale: es })}
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {modelHealth.models.map((model, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${getHealthStatusColor(model.status)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getHealthStatusIcon(model.status)}
                            <span className="font-medium text-sm">{model.provider}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              model.status === "healthy"
                                ? "border-green-500/40 text-green-300 bg-green-500/10 text-xs"
                                : model.status === "degraded"
                                ? "border-yellow-500/40 text-yellow-300 bg-yellow-500/10 text-xs"
                                : "border-red-500/40 text-red-300 bg-red-500/10 text-xs"
                            }
                          >
                            {model.status === "healthy" ? "Saludable" : model.status === "degraded" ? "Degradado" : "Caído"}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-300 mb-2">{model.model}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Latencia: {model.latency}ms</span>
                          <span>Error: {(model.errorRate * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Add Credits Dialog */}
      <Dialog open={isAddCreditsDialogOpen} onOpenChange={setIsAddCreditsDialogOpen}>
        <DialogContent className="border-white/10 bg-slate-900/95 backdrop-blur-xl text-white">
          <DialogHeader>
            <DialogTitle>Añadir Créditos</DialogTitle>
            <DialogDescription className="text-gray-400">
              Añadir créditos a <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Saldo Actual</p>
              <p className="text-xl font-bold text-white">{selectedUser?.credits.toLocaleString() || 0} créditos</p>
            </div>

            <div className="space-y-2">
              <Label>Cantidad de Créditos</Label>
              <Input
                type="number"
                min="1"
                value={creditsToAdd}
                onChange={(e) => setCreditsToAdd(parseInt(e.target.value) || 0)}
                className="border-white/10 bg-slate-800/50 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label>Razón (opcional)</Label>
              <Input
                placeholder="Ej: Créditos de bienvenida, soporte técnico..."
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                className="border-white/10 bg-slate-800/50 text-white"
              />
            </div>

            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <p className="text-xs text-gray-300">
                Nuevo saldo: <strong className="text-white">{(selectedUser?.credits || 0) + creditsToAdd}</strong> créditos
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddCreditsDialogOpen(false)}
              className="border-white/10 bg-slate-800/50 text-white hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmAddCredits}
              disabled={addCredits.isPending || creditsToAdd <= 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {addCredits.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Añadiendo...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir Créditos
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
