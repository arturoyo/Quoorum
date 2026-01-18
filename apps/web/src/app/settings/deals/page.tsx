"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Edit,
  DollarSign,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { QuoorumLogo } from "@/components/ui/quoorum-logo";
import { getSettingsNav } from "@/lib/settings-nav";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  qualified: 'Calificado',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
  commitment: 'Compromiso',
  closed_won: 'Cerrado - Ganado',
  closed_lost: 'Cerrado - Perdido',
};

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-gray-500/20 text-gray-400',
  qualified: 'bg-blue-500/20 text-blue-400',
  proposal: 'bg-purple-500/20 text-purple-400',
  negotiation: 'bg-yellow-500/20 text-yellow-400',
  commitment: 'bg-green-500/20 text-green-400',
  closed_won: 'bg-green-600/20 text-green-500',
  closed_lost: 'bg-red-500/20 text-red-400',
};

export default function DealsSettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    clientId: "",
    stage: "lead" as "lead" | "qualified" | "proposal" | "negotiation" | "commitment" | "closed_won" | "closed_lost",
    value: "",
    currency: "EUR",
    probability: "",
    expectedCloseDate: "",
    description: "",
    notes: "",
  });

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
  const { data: deals, isLoading, refetch } = api.deals.list.useQuery(
    { 
      limit: 100,
      offset: 0,
      stage: stageFilter !== 'all' ? (stageFilter as any) : undefined,
      search: searchTerm || undefined,
    },
    { enabled: isAuthenticated }
  );


  // Mutations
  const createDeal = api.deals.create.useMutation({
    onSuccess: () => {
      toast.success("Oportunidad creada correctamente");
      setIsDialogOpen(false);
      resetForm();
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateDeal = api.deals.update.useMutation({
    onSuccess: () => {
      toast.success("Oportunidad actualizada correctamente");
      setIsDialogOpen(false);
      setEditingDeal(null);
      resetForm();
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteDeal = api.deals.delete.useMutation({
    onSuccess: () => {
      toast.success("Oportunidad eliminada");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      clientId: "",
      stage: "lead",
      value: "",
      currency: "EUR",
      probability: "",
      expectedCloseDate: "",
      description: "",
      notes: "",
    });
    setEditingDeal(null);
  };

  const handleEdit = (deal: NonNullable<typeof deals>[number]) => {
    if (!deal) return;
    setEditingDeal(deal.id);
    setFormData({
      name: deal.name,
      clientId: deal.clientId || "",
      stage: deal.stage as any,
      value: deal.value ? String(deal.value) : "",
      currency: deal.currency || "EUR",
      probability: deal.probability ? String(deal.probability) : "",
      expectedCloseDate: deal.expectedCloseDate
        ? format(new Date(deal.expectedCloseDate), "yyyy-MM-dd")
        : "",
      description: deal.description || "",
      notes: deal.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    // Validate probability (0-100)
    let probability: number | undefined
    if (formData.probability) {
      const probValue = parseFloat(formData.probability)
      if (isNaN(probValue) || probValue < 0 || probValue > 100) {
        toast.error("La probabilidad debe estar entre 0 y 100");
        return
      }
      probability = probValue
    }

    // Format expectedCloseDate as ISO string if provided
    let expectedCloseDate: string | undefined
    if (formData.expectedCloseDate) {
      // Convert yyyy-MM-dd to ISO datetime string
      const date = new Date(formData.expectedCloseDate + 'T00:00:00')
      if (isNaN(date.getTime())) {
        toast.error("Fecha de cierre inválida");
        return
      }
      expectedCloseDate = date.toISOString()
    }

    const payload = {
      name: formData.name.trim(),
      clientId: formData.clientId || undefined,
      stage: formData.stage,
      value: formData.value ? parseFloat(formData.value) : undefined,
      currency: formData.currency,
      probability,
      expectedCloseDate,
      description: formData.description || undefined,
      notes: formData.notes || undefined,
    };

    if (editingDeal) {
      updateDeal.mutate({
        id: editingDeal,
        ...payload,
      });
    } else {
      createDeal.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta oportunidad?")) {
      deleteDeal.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const settingsNav = getSettingsNav(pathname || '/settings/deals');

  const filteredDeals = deals || [];

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
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg blur-lg opacity-50" />
                  <div className="relative w-8 h-8 rounded-lg flex items-center justify-center bg-purple-600">
                    <QuoorumLogo size={24} showGradient={true} />
                  </div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                  Quoorum
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
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
                        <Icon className="relative h-5 w-5" />
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

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Oportunidades</h1>
                <p className="mt-2 text-gray-400">
                  Gestiona tus oportunidades de venta y vincúlalas con debates
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  resetForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Oportunidad
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-white/10 bg-slate-900/95 backdrop-blur-xl text-white max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingDeal ? "Editar Oportunidad" : "Crear Nueva Oportunidad"}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Define los detalles de la oportunidad de venta
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Oportunidad Q1 2024"
                        className="border-white/10 bg-slate-800/50 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Etapa</Label>
                      <Select
                        value={formData.stage}
                        onValueChange={(v) => setFormData({ ...formData, stage: v as any })}
                      >
                        <SelectTrigger className="border-white/10 bg-slate-800/50 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STAGE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Valor (€)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.value}
                          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                          placeholder="0.00"
                          className="border-white/10 bg-slate-800/50 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Probabilidad (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={formData.probability}
                          onChange={(e) => {
                            const val = e.target.value
                            // Only allow 0-100
                            if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 100)) {
                              setFormData({ ...formData, probability: val })
                            }
                          }}
                          placeholder="0-100"
                          className="border-white/10 bg-slate-800/50 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Fecha de Cierre Esperada</Label>
                      <Input
                        type="date"
                        value={formData.expectedCloseDate}
                        onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                        className="border-white/10 bg-slate-800/50 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descripción de la oportunidad..."
                        className="border-white/10 bg-slate-800/50 text-white min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Notas</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Notas adicionales..."
                        className="border-white/10 bg-slate-800/50 text-white min-h-[80px]"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="border-white/10 bg-slate-800/50 text-white hover:bg-slate-800"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={createDeal.isPending || updateDeal.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {(createDeal.isPending || updateDeal.isPending) ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : editingDeal ? (
                        <Edit className="mr-2 h-4 w-4" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      {editingDeal ? "Actualizar" : "Crear"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-white/10 bg-slate-800/50 text-white"
              />
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[180px] border-white/10 bg-slate-800/50 text-white">
                  <SelectValue placeholder="Filtrar por etapa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las etapas</SelectItem>
                  {Object.entries(STAGE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!filteredDeals || filteredDeals.length === 0 ? (
              <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <DollarSign className="h-12 w-12 text-gray-500 mb-4" />
                  <p className="text-gray-400 mb-2">No tienes oportunidades aún</p>
                  <p className="text-sm text-gray-500">
                    Crea tu primera oportunidad para vincularla con debates
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredDeals.map((deal) => (
                  <Card
                    key={deal.id}
                    className="border-white/10 bg-slate-900/60 backdrop-blur-xl hover:border-purple-500/30 transition-colors"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white">{deal.name}</CardTitle>
                          <CardDescription className="text-gray-400 mt-1 flex items-center gap-2">
                            <Badge className={STAGE_COLORS[deal.stage]}>
                              {STAGE_LABELS[deal.stage]}
                            </Badge>
                            {deal.value && (
                              <span className="flex items-center gap-1 text-green-400">
                                <DollarSign className="h-4 w-4" />
                                {Number(deal.value).toLocaleString('es-ES', {
                                  style: 'currency',
                                  currency: deal.currency || 'EUR',
                                })}
                              </span>
                            )}
                            {deal.probability && (
                              <span className="flex items-center gap-1 text-blue-400">
                                <TrendingUp className="h-4 w-4" />
                                {Math.round(deal.probability)}%
                              </span>
                            )}
                            {deal.expectedCloseDate && (
                              <span className="flex items-center gap-1 text-purple-400">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(deal.expectedCloseDate), "dd MMM yyyy", { locale: es })}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {deal.description && (
                        <p className="text-sm text-gray-300">{deal.description}</p>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(deal)}
                          className="flex-1 border-white/10 bg-slate-800/50 text-white hover:bg-slate-800"
                        >
                          <Edit className="mr-2 h-3 w-3" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(deal.id)}
                          disabled={deleteDeal.isPending}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          {deleteDeal.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
