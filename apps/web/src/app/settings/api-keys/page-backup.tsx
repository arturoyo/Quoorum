"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  MessageCircle,
  User,
  CreditCard,
  Key,
  Bell,
  Shield,
  ArrowLeft,
  Loader2,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed: string | null;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadApiKeys() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // TODO: Replace with actual API call
      setApiKeys([
        {
          id: "1",
          name: "Production API",
          prefix: "forum_live_abc123",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          name: "Development",
          prefix: "forum_test_xyz789",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastUsed: null,
        },
      ]);

      setIsLoading(false);
    }

    loadApiKeys();
  }, [router, supabase.auth]);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Por favor, introduce un nombre para la API key");
      return;
    }

    setIsCreating(true);

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const generatedKey = `forum_live_${Math.random().toString(36).substring(2, 15)}`;
      setNewKey(generatedKey);

      setApiKeys([
        ...apiKeys,
        {
          id: String(apiKeys.length + 1),
          name: newKeyName,
          prefix: generatedKey.substring(0, 20) + "...",
          createdAt: new Date().toISOString(),
          lastUsed: null,
        },
      ]);

      toast.success("API key creada correctamente");
    } catch {
      toast.error("Error al crear la API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setApiKeys(apiKeys.filter((key) => key.id !== id));
      toast.success("API key eliminada");
    } catch {
      toast.error("Error al eliminar la API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const settingsNav = [
    { href: "/settings", label: "Perfil", icon: User, active: false },
    { href: "/settings/billing", label: "Facturación", icon: CreditCard, active: false },
    { href: "/settings/api-keys", label: "API Keys", icon: Key, active: true },
    { href: "/settings/notifications", label: "Notificaciones", icon: Bell, active: false },
    { href: "/settings/security", label: "Seguridad", icon: Shield, active: false },
  ];

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

            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Forum</span>
            </Link>

            <div className="w-32" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Configuración</h1>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Sidebar Nav */}
            <div className="space-y-1">
              {settingsNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                    item.active
                      ? "bg-purple-500/20 text-purple-400"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Content */}
            <div className="md:col-span-3 space-y-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white">API Keys</CardTitle>
                    <CardDescription>
                      Gestiona tus claves de acceso a la API de Forum
                    </CardDescription>
                  </div>
                  <Dialog>
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
                              onClick={() => {
                                setNewKey(null);
                                setNewKeyName("");
                              }}
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
                              disabled={isCreating}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              {isCreating ? (
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
                  {apiKeys.length === 0 ? (
                    <div className="text-center py-8">
                      <Key className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No tienes API keys aún</p>
                      <p className="text-gray-500 text-sm mt-1">
                        Crea una para empezar a usar la API de Forum
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {apiKeys.map((key) => (
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
                              {key.lastUsed && (
                                <span>
                                  Último uso:{" "}
                                  {new Date(key.lastUsed).toLocaleDateString("es-ES")}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteKey(key.id)}
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
                    Aprende a usar la API de Forum
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-slate-800/50 font-mono text-sm">
                    <p className="text-gray-400"># Ejemplo de uso</p>
                    <p className="text-purple-400 mt-2">
                      curl https://api.forum.ai/v1/debates \
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
        </div>
      </main>
    </div>
  );
}
