"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User,
  CreditCard,
  Key,
  Bell,
  Shield,
  Plus,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { getSettingsNav } from "@/lib/settings-nav";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [_user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    role: "",
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      setFormData({
        fullName: user.user_metadata?.full_name || "",
        email: user.email || "",
        company: user.user_metadata?.company || "",
        role: user.user_metadata?.role || "",
      });
      setIsLoading(false);
    }

    loadUser();
  }, [router, supabase.auth]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          company: formData.company,
          role: formData.role,
        },
      });

      if (error) {
        toast.error("Error al guardar los cambios");
        return;
      }

      toast.success("Cambios guardados correctamente");
    } catch {
      toast.error("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative bg-slate-950 flex items-center justify-center">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full blur-2xl opacity-30 animate-pulse" />
          <Loader2 className="relative w-8 h-8 text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  const settingsNav = getSettingsNav(pathname || '/settings');

  return (
    <div className="min-h-screen relative bg-slate-950">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      {/* Header */}
      <AppHeader variant="app" />

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
            <Card className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border-purple-500/20">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5" />
                <CardHeader className="relative">
                  <CardTitle className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                    Información Personal
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Actualiza tu información de perfil
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-blue-200">
                        Nombre completo
                      </Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className="bg-slate-900/60 backdrop-blur-sm border-purple-500/30 text-white focus:border-blue-500/50 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-blue-200">
                        Email
                      </Label>
                      <Input
                        id="email"
                        value={formData.email}
                        disabled
                        className="bg-slate-900/40 backdrop-blur-sm border-purple-500/20 text-gray-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-blue-200">
                        Empresa
                      </Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) =>
                          setFormData({ ...formData, company: e.target.value })
                        }
                        className="bg-slate-900/60 backdrop-blur-sm border-purple-500/30 text-white focus:border-blue-500/50 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-blue-200">
                        Cargo
                      </Label>
                      <Input
                        id="role"
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        className="bg-slate-900/60 backdrop-blur-sm border-purple-500/30 text-white focus:border-blue-500/50 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="relative group overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                    {isSaving ? (
                      <>
                        <Loader2 className="relative mr-2 h-4 w-4 animate-spin" />
                        <span className="relative">Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="relative mr-2 h-4 w-4" />
                        <span className="relative">Guardar Cambios</span>
                      </>
                    )}
                  </Button>
                </CardContent>
            </Card>

            <Separator className="bg-gradient-to-r from-purple-500/20 via-white/10 to-blue-500/20" />

            <Card className="relative overflow-hidden bg-red-950/40 backdrop-blur-xl border-red-500/30">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-red-900/5" />
                <CardHeader className="relative">
                  <CardTitle className="bg-gradient-to-r from-red-300 to-red-500 bg-clip-text text-transparent">
                    Zona de Peligro
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Acciones irreversibles para tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Cerrar sesión</p>
                      <p className="text-sm text-gray-400">
                        Cerrar sesión en este dispositivo
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                      className="relative group overflow-hidden border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-400/70 transition-all"
                    >
                      <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur" />
                      <span className="relative">Cerrar Sesión</span>
                    </Button>
                  </div>

                  <Separator className="bg-red-500/20" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Eliminar cuenta</p>
                      <p className="text-sm text-gray-400">
                        Eliminar permanentemente tu cuenta y todos tus datos
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="relative group overflow-hidden border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-400/70 transition-all"
                    >
                      <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur" />
                      <span className="relative">Eliminar Cuenta</span>
                    </Button>
                  </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
