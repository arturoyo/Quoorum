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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { getSettingsNav } from "@/lib/settings-nav";

export default function NotificationsPage() {
  const router = useRouter();
  const pathname = usePathname();
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

  const settingsNav = getSettingsNav(pathname || '/settings/notifications');

  return (
    <div className="min-h-screen bg-slate-900">
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
      </main>
    </div>
  );
}
