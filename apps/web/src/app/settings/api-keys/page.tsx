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
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { getSettingsNav } from "@/lib/settings-nav";

export default function ApiKeysPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Auth check (runs BEFORE query)
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

  // Queries (only execute when authenticated)
  const { data: apiKeys, isLoading, refetch } = api.apiKeys.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Mutations
  const createKey = api.apiKeys.create.useMutation({
    onSuccess: (data) => {
      setNewKey(data.key);
      setNewKeyName("");
      toast.success("API key creada correctamente");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteKey = api.apiKeys.delete.useMutation({
    onSuccess: () => {
      toast.success("API key eliminada");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast.error("Por favor, introduce un nombre para la API key");
      return;
    }
    createKey.mutate({ name: newKeyName });
  };

  const handleDeleteKey = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta API key? Esta acción no se puede deshacer.")) {
      deleteKey.mutate({ id });
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  const handleCloseDialog = () => {
    setNewKey(null);
    setNewKeyName("");
    setShowKey(false);
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const settingsNav = getSettingsNav(pathname || '/settings/api-keys');

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
            <Card className="bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white">API Keys</CardTitle>
                    <CardDescription>
                      Gestiona tus claves de acceso a la API de Quoorum
                    </CardDescription>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva API Key
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-white/10">
                      <DialogHeader>
                        <DialogTitle className="text-white">
                          Crear Nueva API Key
                        </DialogTitle>
                        <DialogDescription>
                          Dale un nombre descriptivo a tu API key para identificarla
                          fácilmente.
                        </DialogDescription>
                      </DialogHeader>

                      {newKey ? (
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
                              <div>
                                <p className="text-yellow-300 font-medium">
                                  Guarda esta key ahora
                                </p>
                                <p className="text-yellow-200/70 text-sm mt-1">
                                  No podrás ver esta key de nuevo. Guárdala en un lugar
                                  seguro.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Input
                              type={showKey ? "text" : "password"}
                              value={newKey}
                              readOnly
                              className="bg-white/5 border-white/10 text-white font-mono"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowKey(!showKey)}
                              className="text-gray-400 hover:text-white"
                            >
                              {showKey ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(newKey)}
                              className="text-gray-400 hover:text-white"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>

                          <DialogFooter>
                            <Button
                              onClick={handleCloseDialog}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              Listo
                            </Button>
                          </DialogFooter>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="keyName" className="text-gray-300">
                                Nombre
                              </Label>
                              <Input
                                id="keyName"
                                placeholder="Ej: Production API"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                              />
                            </div>
                          </div>

                          <DialogFooter>
                            <Button
                              onClick={handleCreateKey}
                              disabled={createKey.isLoading}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              {createKey.isLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Creando...
                                </>
                              ) : (
                                "Crear API Key"
                              )}
                            </Button>
                          </DialogFooter>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {apiKeys && apiKeys.length === 0 ? (
                    <div className="text-center py-8">
                      <Key className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No tienes API keys aún</p>
                      <p className="text-gray-500 text-sm mt-1">
                        Crea una para empezar a usar la API de Quoorum
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {apiKeys?.map((key) => (
                        <div
                          key={key.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-white/5"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium">{key.name}</p>
                              <Badge className="bg-gray-500/20 text-gray-400">
                                {key.prefix}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <span>
                                Creada:{" "}
                                {new Date(key.createdAt).toLocaleDateString("es-ES")}
                              </span>
                              {key.lastUsedAt && (
                                <span>
                                  Último uso:{" "}
                                  {new Date(key.lastUsedAt).toLocaleDateString("es-ES")}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteKey(key.id)}
                            disabled={deleteKey.isLoading}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Documentación API</CardTitle>
                  <CardDescription>
                    Aprende a usar la API de Quoorum
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-slate-800/50 font-mono text-sm">
                    <p className="text-gray-400"># Ejemplo de uso</p>
                    <p className="text-purple-400 mt-2">
                      curl https://api.quoorum.ai/v1/debates \
                    </p>
                    <p className="text-gray-300 pl-4">
                      -H &quot;Authorization: Bearer YOUR_API_KEY&quot; \
                    </p>
                    <p className="text-gray-300 pl-4">
                      -H &quot;Content-Type: application/json&quot; \
                    </p>
                    <p className="text-gray-300 pl-4">
                      -d &apos;&#123;&quot;question&quot;: &quot;...&quot;&#125;&apos;
                    </p>
                  </div>

                  <Link href="/docs/api" className="block mt-4">
                    <Button
                      variant="outline"
                      className="w-full border-white/10 text-white hover:bg-white/10"
                    >
                      Ver Documentación Completa
                    </Button>
                  </Link>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
