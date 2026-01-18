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
  Sparkles,
  BookOpen,
} from "lucide-react";
import { QuoorumLogo } from "@/components/ui/quoorum-logo";
import { getSettingsNav } from "@/lib/settings-nav";

export default function ExpertsSettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpert, setEditingExpert] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    expertise: "",
    description: "",
    systemPrompt: "",
    category: "",
    provider: "google" as "openai" | "anthropic" | "google" | "groq",
    model: "gemini-2.0-flash-exp",
    temperature: 0.7,
    maxTokens: undefined as number | undefined,
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

  // Queries - Only user's custom experts
  const { data: experts, isLoading, refetch } = api.experts.myExperts.useQuery(
    { activeOnly: false, limit: 100 },
    { enabled: isAuthenticated }
  );

  // Mutations
  const createExpert = api.experts.create.useMutation({
    onSuccess: () => {
      toast.success("Experto creado correctamente");
      setIsDialogOpen(false);
      resetForm();
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateExpert = api.experts.update.useMutation({
    onSuccess: () => {
      toast.success("Experto actualizado correctamente");
      setIsDialogOpen(false);
      setEditingExpert(null);
      resetForm();
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteExpert = api.experts.delete.useMutation({
    onSuccess: () => {
      toast.success("Experto eliminado");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      expertise: "",
      description: "",
      systemPrompt: "",
      category: "",
      provider: "google",
      model: "gemini-2.0-flash-exp",
      temperature: 0.7,
      maxTokens: undefined,
    });
    setEditingExpert(null);
  };

  const handleEdit = (expert: NonNullable<typeof experts>[number]) => {
    if (!expert) return;
    setEditingExpert(expert.id);
    setFormData({
      name: expert.name,
      expertise: expert.expertise,
      description: expert.description || "",
      systemPrompt: expert.systemPrompt,
      category: expert.category || "",
      provider: expert.aiConfig.provider,
      model: expert.aiConfig.model,
      temperature: expert.aiConfig.temperature || 0.7,
      maxTokens: expert.aiConfig.maxTokens,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    if (!formData.name.trim() || !formData.expertise.trim() || !formData.systemPrompt.trim()) {
      toast.error("Nombre, expertise y system prompt son requeridos");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      expertise: formData.expertise.trim(),
      description: formData.description || undefined,
      systemPrompt: formData.systemPrompt.trim(),
      category: formData.category || undefined,
      aiConfig: {
        provider: formData.provider,
        model: formData.model,
        temperature: formData.temperature,
        maxTokens: formData.maxTokens,
      },
    };

    if (editingExpert) {
      updateExpert.mutate({
        id: editingExpert,
        ...payload,
      });
    } else {
      createExpert.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este experto? Esta acción lo desactivará.")) {
      deleteExpert.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const settingsNav = getSettingsNav(pathname || '/settings/experts');

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
                <h1 className="text-3xl font-bold text-white">Expertos Personalizados</h1>
                <p className="mt-2 text-gray-400">
                  Crea y gestiona tus propios expertos especializados para debates
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/settings/experts/library">
                  <Button variant="outline" className="border-purple-500/40 text-purple-300 hover:bg-purple-500/20 hover:text-white hover:border-purple-500/60">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Ver Biblioteca
                  </Button>
                </Link>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  resetForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Experto
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-white/10 bg-slate-900/95 backdrop-blur-xl text-white max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingExpert ? "Editar Experto" : "Crear Nuevo Experto"}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Define el nombre, expertise, prompt del sistema y configuración AI
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Experto en Ventas B2B"
                        className="border-white/10 bg-slate-800/50 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Expertise *</Label>
                      <Input
                        value={formData.expertise}
                        onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                        placeholder="Ej: Ventas B2B, Estrategia de marketing, etc."
                        className="border-white/10 bg-slate-800/50 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Breve descripción del experto..."
                        className="border-white/10 bg-slate-800/50 text-white min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>System Prompt *</Label>
                      <Textarea
                        value={formData.systemPrompt}
                        onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                        placeholder="Instrucciones del sistema para el experto..."
                        className="border-white/10 bg-slate-800/50 text-white min-h-[150px] font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Categoría</Label>
                      <Input
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Ej: Ventas, Marketing, Finanzas"
                        className="border-white/10 bg-slate-800/50 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Provider AI</Label>
                        <Select
                          value={formData.provider}
                          onValueChange={(v) => setFormData({ ...formData, provider: v as typeof formData.provider })}
                        >
                          <SelectTrigger className="border-white/10 bg-slate-800/50 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-white/10 bg-slate-800 text-white">
                            <SelectItem 
                              value="google"
                              className="focus:bg-purple-500/20 focus:text-white"
                            >
                              Google (Gemini)
                            </SelectItem>
                            <SelectItem 
                              value="openai"
                              className="focus:bg-purple-500/20 focus:text-white"
                            >
                              OpenAI
                            </SelectItem>
                            <SelectItem 
                              value="anthropic"
                              className="focus:bg-purple-500/20 focus:text-white"
                            >
                              Anthropic
                            </SelectItem>
                            <SelectItem 
                              value="groq"
                              className="focus:bg-purple-500/20 focus:text-white"
                            >
                              Groq
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Modelo</Label>
                        <Input
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          placeholder="Ej: gemini-2.0-flash-exp"
                          className="border-white/10 bg-slate-800/50 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Temperature (0-2)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="2"
                          step="0.1"
                          value={formData.temperature}
                          onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0.7 })}
                          className="border-white/10 bg-slate-800/50 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Max Tokens (opcional)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.maxTokens || ""}
                          onChange={(e) => setFormData({ ...formData, maxTokens: e.target.value ? parseInt(e.target.value) : undefined })}
                          placeholder="Opcional"
                          className="border-white/10 bg-slate-800/50 text-white"
                        />
                      </div>
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
                      disabled={createExpert.isPending || updateExpert.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {(createExpert.isPending || updateExpert.isPending) ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : editingExpert ? (
                        <Edit className="mr-2 h-4 w-4" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      {editingExpert ? "Actualizar" : "Crear"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            {!experts || experts.length === 0 ? (
              <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Sparkles className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-300 mb-2">No tienes expertos personalizados aún</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Crea tu primer experto especializado para usarlo en debates
                  </p>
                  <Link href="/settings/experts/library">
                    <Button variant="outline" className="border-purple-500/40 text-purple-300 hover:bg-purple-500/20 hover:text-white hover:border-purple-500/60">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Explorar Biblioteca de Expertos
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {experts.map((expert) => (
                  <Card
                    key={expert.id}
                    className="border-white/10 bg-slate-900/60 backdrop-blur-xl hover:border-purple-500/30 transition-colors"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white">{expert.name}</CardTitle>
                          <CardDescription className="text-gray-300 mt-1">
                            {typeof expert.expertise === 'string'
                              ? expert.expertise
                              : JSON.stringify(expert.expertise, null, 2)}
                          </CardDescription>
                        </div>
                        {!expert.isActive && (
                          <Badge variant="outline" className="border-gray-500/50 text-gray-400 bg-gray-500/10">
                            Inactivo
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {expert.description && (
                        <p className="text-sm text-gray-300">
                          {typeof expert.description === 'string'
                            ? expert.description
                            : JSON.stringify(expert.description, null, 2)}
                        </p>
                      )}

                      {expert.category && (
                        <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10">
                          {expert.category}
                        </Badge>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <span>Provider: {expert.aiConfig.provider}</span>
                        <span>•</span>
                        <span>Model: {expert.aiConfig.model}</span>
                        {expert.aiConfig.temperature && (
                          <>
                            <span>•</span>
                            <span>Temp: {expert.aiConfig.temperature}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(expert)}
                          className="flex-1 border-white/10 bg-slate-800/50 text-white hover:bg-slate-800"
                        >
                          <Edit className="mr-2 h-3 w-3" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(expert.id)}
                          disabled={deleteExpert.isPending}
                          className="border-red-500/40 text-red-300 hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/60 disabled:opacity-50"
                        >
                          {deleteExpert.isPending ? (
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
