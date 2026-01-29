"use client";

import { useEffect, useState } from "react";
import _Link from "next/link";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  MessageSquare as _MessageSquare,
  Tag,
  X,
  Filter,
} from "lucide-react";
import { getContextualIcon, IconType as _IconType } from '@/lib/icons/contextual-icons'
import { AppHeader } from "@/components/layout/app-header";
import { toast } from "sonner";
import { QuoorumLogo } from "@/components/ui/quoorum-logo";

// Pattern labels in Spanish
function getPatternLabel(pattern: string): string {
  const labels: Record<string, string> = {
    simple: 'Simple',
    sequential: 'Secuencial',
    parallel: 'Paralelo',
    conditional: 'Condicional',
    iterative: 'Iterativo',
    tournament: 'Torneo',
    adversarial: 'Adversarial',
    ensemble: 'Ensemble',
    hierarchical: 'Jerárquico',
  }
  return labels[pattern] || pattern
}

export default function DebatesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedDebates, setSelectedDebates] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

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
  const { data: debates = [], isLoading, error, refetch } = api.debates.list.useQuery(
    {
      limit: 50,
      offset: 0,
      tags: selectedTags.length > 0 ? selectedTags : undefined, // Filtrar por tags si hay seleccionados
    },
    {
      enabled: isAuthenticated, // Only run when user is authenticated
      // Poll every 5 seconds if there are any debates in progress
      refetchInterval: (data) => {
        const hasInProgress = data?.some((debate) => debate.status === 'in_progress' || debate.status === 'pending')
        return hasInProgress ? 5000 : false
      },
      refetchIntervalInBackground: true,
    }
  );

  // Extraer todos los tags únicos de los debates
  useEffect(() => {
    const allTags = new Set<string>();
    debates.forEach((debate) => {
      if (debate.metadata?.tags && Array.isArray(debate.metadata.tags)) {
        debate.metadata.tags.forEach((tag: string) => {
          if (tag && typeof tag === 'string' && tag.trim().length > 0) {
            allTags.add(tag.trim());
          }
        });
      }
    });
    setAvailableTags(Array.from(allTags).sort());
  }, [debates]);

  // Delete mutation
  const deleteDebate = api.debates.delete.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  // Handlers
  const handleToggleSelect = (debateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDebates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(debateId)) {
        newSet.delete(debateId);
      } else {
        newSet.add(debateId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedDebates.size === debates.length) {
      setSelectedDebates(new Set());
    } else {
      setSelectedDebates(new Set(debates.map((d) => d.id)));
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const selectedIds = Array.from(selectedDebates);

      // Delete all selected debates in parallel
      await Promise.all(
        selectedIds.map((id) => deleteDebate.mutateAsync({ id }))
      );

      toast.success(
        `${selectedIds.length} debate${selectedIds.length > 1 ? 's' : ''} eliminado${selectedIds.length > 1 ? 's' : ''}`
      );
      setSelectedDebates(new Set());
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error('Error al eliminar debates');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg-primary)]">
      {/* Header */}
      <AppHeader variant="app" />

      <main className="container mx-auto px-4 pt-20 pb-24 sm:pb-28 md:pb-32">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--theme-text-primary)]">Debates</h1>
            <p className="text-sm sm:text-base text-[var(--theme-text-secondary)] mt-1">
              Gestiona tus debates y deliberaciones
            </p>
          </div>
          <div className="flex items-center gap-2">
            {debates.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="border-purple-500/30 bg-purple-500/10 text-white hover:bg-purple-500/20 hover:border-purple-500/50"
              >
                <Checkbox
                  checked={selectedDebates.size === debates.length && debates.length > 0}
                  className="mr-2 border-white/40"
                />
                {selectedDebates.size === debates.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </Button>
            )}
            <Button 
              onClick={async (e) => {
                try {
                  e.preventDefault()
                  e.stopPropagation()
                  const generateSessionId = () => {
                    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
                      return window.crypto.randomUUID()
                    }
                    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
                  }
                  const sessionId = generateSessionId()
                  const targetUrl = `/debates/new-unified/${sessionId}?new=1`
                  await router.push(targetUrl)
                } catch (error) {
                  toast.error('Error al crear nuevo debate', {
                    description: error instanceof Error ? error.message : 'Error desconocido'
                  })
                }
              }}
              className="bg-purple-600 hover:bg-purple-700"
              type="button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Debate
            </Button>
          </div>
        </div>

        {/* Filtro de Tags */}
        {availableTags.length > 0 && (
          <div className="mb-6 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-[var(--theme-text-secondary)]" />
              <span className="text-sm text-[var(--theme-text-secondary)]">Filtrar por tags:</span>
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTags(selectedTags.filter((t) => t !== tag));
                      } else {
                        setSelectedTags([...selectedTags, tag]);
                      }
                    }}
                    className={`
                      inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors
                      ${isSelected
                        ? 'bg-purple-600 text-white border border-purple-500'
                        : 'bg-white/5 text-[var(--theme-text-secondary)] border border-white/10 hover:bg-white/10 hover:border-purple-500/50'
                      }
                    `}
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                    {isSelected && <X className="h-3 w-3" />}
                  </button>
                );
              })}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs text-purple-400 hover:text-purple-300 underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
            {selectedTags.length > 0 && (
              <p className="text-xs text-[var(--theme-text-tertiary)]">
                Mostrando debates con {selectedTags.length === 1 ? 'el tag' : 'los tags'}: {selectedTags.join(', ')}
              </p>
            )}
          </div>
        )}

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
          ) : error ? (
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <XCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-[var(--theme-text-primary)] mb-2">
                  Error al cargar debates
                </h3>
                <p className="text-[var(--theme-text-secondary)] text-center mb-4">
                  {error.message || 'No se pudo conectar a la base de datos'}
                </p>
                <p className="text-sm text-[var(--theme-text-tertiary)] text-center">
                  Asegúrate de que Docker Desktop esté corriendo y PostgreSQL esté iniciado
                </p>
              </CardContent>
            </Card>
          ) : debates.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <QuoorumLogo size={48} showGradient={true} className="mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No tienes debates todavía
                </h3>
                <p className="text-[var(--theme-text-secondary)] text-center mb-6">
                  Crea tu primer debate para empezar a deliberar con expertos IA
                </p>
                <Button 
                  onClick={async (e) => {
                    try {
                      e.preventDefault()
                      e.stopPropagation()
                      const generateSessionId = () => {
                        if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
                          return window.crypto.randomUUID()
                        }
                        return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
                      }
                      const sessionId = generateSessionId()
                      const targetUrl = `/debates/new-unified/${sessionId}?new=1`
                      await router.push(targetUrl)
                    } catch (error) {
                      toast.error('Error al crear nuevo debate', {
                        description: error instanceof Error ? error.message : 'Error desconocido'
                      })
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                  type="button"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primer Debate
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {debates.map((debate) => {
                // Obtener icono contextual único y representativo
                const ContextualIcon = getContextualIcon(
                  debate.question,
                  debate.id,
                  debate.metadata?.tags,
                  debate.metadata?.topics,
                  debate.metadata?.areas
                )

                return (
                  <Card
                    key={debate.id}
                    className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-tertiary)] cursor-pointer transition-colors relative group"
                    onClick={(e) => {
                      // Si no estamos seleccionando, navegar
                      if (selectedDebates.size === 0) {
                        router.push(`/debates/${debate.id}`);
                      }
                    }}
                  >
                    {/* Icon/Checkbox - Contextual icon by default, checkbox on hover or when in selection mode */}
                    <div
                      className="absolute top-4 left-10 -translate-x-1/2 z-10 transition-all cursor-pointer"
                      onClick={(e) => handleToggleSelect(debate.id, e)}
                    >
                      {/* Show checkbox when any debate is selected or on hover, otherwise show contextual icon */}
                      {(selectedDebates.size > 0 || selectedDebates.has(debate.id)) ? (
                        <div className="bg-[var(--theme-bg-tertiary)]/90 backdrop-blur-sm p-2 rounded-lg border-2 border-[var(--theme-border)] hover:border-purple-500 hover:bg-purple-500/20 transition-all">
                          <Checkbox
                            checked={selectedDebates.has(debate.id)}
                            className="h-6 w-6 border-2 border-white/60 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                          />
                        </div>
                      ) : (
                        <>
                          {/* Icon visible by default, checkbox on hover */}
                          <div className="group-hover:hidden bg-purple-500/10 p-2 rounded-lg">
                            <ContextualIcon className="h-6 w-6 text-purple-400" />
                          </div>
                          <div className="hidden group-hover:block bg-[var(--theme-bg-tertiary)]/90 backdrop-blur-sm p-2 rounded-lg border-2 border-[var(--theme-border)] hover:border-purple-500 hover:bg-purple-500/20 transition-all">
                            <Checkbox
                              checked={false}
                              className="h-6 w-6 border-2 border-white/60"
                            />
                          </div>
                        </>
                      )}
                    </div>

                  <CardHeader className="pl-16 pr-6">
                    <CardTitle className="text-white line-clamp-2 break-words">
                      {debate.question}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 flex-wrap">
                      {(debate.status === "draft" || debate.status === "pending" || debate.status === "in_progress") && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          En progreso
                        </Badge>
                      )}
                      {debate.status === "completed" && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completado
                        </Badge>
                      )}
                      {debate.status === "failed" && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                          <XCircle className="mr-1 h-3 w-3" />
                          Error
                        </Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {debate.metadata?.pattern && (
                          <Badge
                            variant="outline"
                            className="border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs"
                          >
                            {getPatternLabel(debate.metadata.pattern as string)}
                          </Badge>
                        )}
                        {debate.metadata?.tags && Array.isArray(debate.metadata.tags) && debate.metadata.tags.length > 0 && (
                          <>
                            {debate.metadata.tags.slice(0, 3).map((tag: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs flex items-center gap-1"
                              >
                                <Tag className="h-3 w-3" />
                                {tag}
                              </Badge>
                            ))}
                            {debate.metadata.tags.length > 3 && (
                              <Badge
                                variant="outline"
                                className="border-gray-500/30 bg-gray-500/10 text-[var(--theme-text-secondary)] text-xs"
                              >
                                +{debate.metadata.tags.length - 3}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--theme-text-secondary)]">
                          {debate.consensusScore
                            ? `Consenso: ${Math.round(debate.consensusScore * 100)}%`
                            : "Sin consenso aún"}
                        </span>
                        <span className="text-[var(--theme-text-tertiary)] flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(debate.createdAt).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Floating Action Bar */}
        {selectedDebates.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
            <Card className="border-[var(--theme-border)] bg-[var(--theme-bg-secondary)]/95 backdrop-blur-xl shadow-2xl">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedDebates.size === debates.length}
                    onCheckedChange={handleSelectAll}
                    className="h-5 w-5"
                  />
                  <span className="text-[var(--theme-text-primary)] font-medium">
                    {selectedDebates.size} debate{selectedDebates.size > 1 ? 's' : ''} seleccionado{selectedDebates.size > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="h-6 w-px bg-[var(--theme-border)]" />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={deleteDebate.isPending}
                >
                  {deleteDebate.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="¿Eliminar debates seleccionados?"
          description={`Estás a punto de eliminar ${selectedDebates.size} debate${selectedDebates.size > 1 ? 's' : ''}. Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={handleDeleteSelected}
          variant="destructive"
          isLoading={deleteDebate.isPending}
        />
      </main>
    </div>
  );
}
