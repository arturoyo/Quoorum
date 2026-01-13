"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Save,
} from "lucide-react";

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
  const { data: settings, isLoading } = api.notificationSettings.get.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Mutations
  const updateSettings = api.notificationSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Configuración guardada");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleToggle = (key: string, value: boolean) => {
    updateSettings.mutate({ [key]: value });
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
    { href: "/settings/api-keys", label: "API Keys", icon: Key, active: false },
    { href: "/settings/notifications", label: "Notificaciones", icon: Bell, active: true },
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
                <CardHeader>
                  <CardTitle className="text-white">Notificaciones por Email</CardTitle>
                  <CardDescription>
                    Gestiona qué notificaciones recibes por correo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="emailNotifications" className="text-white font-medium">
                        Notificaciones por email
                      </Label>
                      <p className="text-sm text-gray-400">
                        Recibir notificaciones importantes por correo
                      </p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings?.emailNotifications ?? true}
                      onCheckedChange={(checked) => handleToggle("emailNotifications", checked)}
                      disabled={updateSettings.isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="debateUpdates" className="text-white font-medium">
                        Actualizaciones de debates
                      </Label>
                      <p className="text-sm text-gray-400">
                        Notificaciones cuando tus debates tengan actualizaciones
                      </p>
                    </div>
                    <Switch
                      id="debateUpdates"
                      checked={settings?.debateUpdates ?? true}
                      onCheckedChange={(checked) => handleToggle("debateUpdates", checked)}
                      disabled={!settings?.emailNotifications || updateSettings.isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="weeklyDigest" className="text-white font-medium">
                        Resumen semanal
                      </Label>
                      <p className="text-sm text-gray-400">
                        Recibe un resumen semanal de tus debates y actividad
                      </p>
                    </div>
                    <Switch
                      id="weeklyDigest"
                      checked={settings?.weeklyDigest ?? true}
                      onCheckedChange={(checked) => handleToggle("weeklyDigest", checked)}
                      disabled={!settings?.emailNotifications || updateSettings.isLoading}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Notificaciones Push</CardTitle>
                  <CardDescription>
                    Notificaciones en tu navegador o dispositivo móvil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="pushNotifications" className="text-white font-medium">
                        Notificaciones push
                      </Label>
                      <p className="text-sm text-gray-400">
                        Recibir notificaciones instantáneas en tu dispositivo
                      </p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={settings?.pushNotifications ?? false}
                      onCheckedChange={(checked) => handleToggle("pushNotifications", checked)}
                      disabled={updateSettings.isLoading}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Seguridad y Marketing</CardTitle>
                  <CardDescription>
                    Alertas de seguridad y comunicaciones de marketing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="securityAlerts" className="text-white font-medium">
                        Alertas de seguridad
                      </Label>
                      <p className="text-sm text-gray-400">
                        Notificaciones importantes sobre la seguridad de tu cuenta
                      </p>
                    </div>
                    <Switch
                      id="securityAlerts"
                      checked={settings?.securityAlerts ?? true}
                      onCheckedChange={(checked) => handleToggle("securityAlerts", checked)}
                      disabled={updateSettings.isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="marketingEmails" className="text-white font-medium">
                        Emails de marketing
                      </Label>
                      <p className="text-sm text-gray-400">
                        Novedades, actualizaciones y ofertas especiales
                      </p>
                    </div>
                    <Switch
                      id="marketingEmails"
                      checked={settings?.marketingEmails ?? false}
                      onCheckedChange={(checked) => handleToggle("marketingEmails", checked)}
                      disabled={updateSettings.isLoading}
                    />
                  </div>
                </CardContent>
              </Card>

              {updateSettings.isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando cambios...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
