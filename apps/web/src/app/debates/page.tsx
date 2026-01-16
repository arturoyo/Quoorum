"use client";

import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

export default function DebatesPage() {
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

  // Fetch debates using tRPC (only if authenticated)
  const { data: debates = [], isLoading } = api.debates.list.useQuery(
    {
      limit: 50,
      offset: 0,
    },
    {
      enabled: isAuthenticated, // Only run when user is authenticated
    }
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header igual al dashboard */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Quoorum</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">
                Dashboard
              </Link>
              <Link href="/debates" className="text-sm text-purple-400 font-medium">
                Debates
              </Link>
              <Link href="/settings" className="text-sm text-gray-400 hover:text-white">
                Configuración
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Debates</h1>
            <p className="text-gray-400 mt-1">
              Gestiona tus debates y deliberaciones
            </p>
          </div>
          <Link href="/debates/new">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Debate
            </Button>
          </Link>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white/5 border-white/10">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 bg-white/10" />
                    <Skeleton className="h-4 w-full mt-2 bg-white/5" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full bg-white/5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : debates.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <MessageCircle className="h-12 w-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No tienes debates todavía
                </h3>
                <p className="text-gray-400 text-center mb-6">
                  Crea tu primer debate para empezar a deliberar con expertos IA
                </p>
                <Link href="/debates/new">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Primer Debate
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {debates.map((debate) => (
                <Card
                  key={debate.id}
                  className="bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
                  onClick={() => router.push(`/debates/${debate.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-white line-clamp-2">
                      {debate.question}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {debate.status === "draft" && (
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">
                          <Clock className="mr-1 h-3 w-3" />
                          Borrador
                        </Badge>
                      )}
                      {debate.status === "pending" && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                          <Clock className="mr-1 h-3 w-3" />
                          Pendiente
                        </Badge>
                      )}
                      {debate.status === "completed" && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completado
                        </Badge>
                      )}
                      {debate.status === "in_progress" && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          En progreso
                        </Badge>
                      )}
                      {debate.status === "failed" && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                          <XCircle className="mr-1 h-3 w-3" />
                          Fallido
                        </Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {debate.consensusScore
                          ? `Consenso: ${Math.round(debate.consensusScore * 100)}%`
                          : "Sin consenso aún"}
                      </span>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(debate.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
