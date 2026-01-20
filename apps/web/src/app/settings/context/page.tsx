"use client";

import { useState, useEffect, useRef } from "react";
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
import { Switch } from "@/components/ui/switch";
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
  Trash2,
  Edit,
  FileText,
  Upload,
  File,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { getSettingsNav } from "@/lib/settings-nav";

export default function ContextFilesSettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    contentType: "text/plain" as string,
    tags: "",
    order: 0,
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
  const { data: files, isLoading, refetch } = api.contextFiles.list.useQuery(
    { activeOnly: false, limit: 100 },
    { enabled: isAuthenticated }
  );

  // Mutations
  const createFile = api.contextFiles.create.useMutation({
    onSuccess: () => {
      toast.success("Archivo de contexto creado correctamente");
      setIsDialogOpen(false);
      resetForm();
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateFile = api.contextFiles.update.useMutation({
    onSuccess: () => {
      toast.success("Archivo de contexto actualizado correctamente");
      setIsDialogOpen(false);
      setEditingFile(null);
      resetForm();
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteFile = api.contextFiles.delete.useMutation({
    onSuccess: () => {
      toast.success("Archivo eliminado");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const toggleActive = api.contextFiles.toggleActive.useMutation({
    onSuccess: () => {
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      content: "",
      contentType: "text/plain",
      tags: "",
      order: 0,
    });
    setEditingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = (file: NonNullable<typeof files>[number]) => {
    if (!file) return;
    setEditingFile(file.id);
    setFormData({
      name: file.name,
      description: file.description || "",
      content: file.content,
      contentType: file.contentType || "text/plain",
      tags: file.tags || "",
      order: file.order || 0,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error("Nombre y contenido son requeridos");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description || undefined,
      content: formData.content.trim(),
      contentType: formData.contentType,
      tags: formData.tags || undefined,
      order: formData.order,
    };

    if (editingFile) {
      updateFile.mutate({
        id: editingFile,
        ...payload,
      });
    } else {
      createFile.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este archivo? Esta acción no se puede deshacer.")) {
      deleteFile.mutate({ id });
    }
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    toggleActive.mutate({ id, isActive: !currentStatus });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    // Only accept text files
    if (!uploadedFile.type.startsWith('text/') && !uploadedFile.name.endsWith('.txt') && !uploadedFile.name.endsWith('.md')) {
      toast.error("Solo se permiten archivos de texto (.txt, .md)");
      return;
    }

    // Limit file size to ~500KB
    if (uploadedFile.size > 500000) {
      toast.error("El archivo es demasiado grande. Máximo 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        content: content,
        name: prev.name || uploadedFile.name.replace(/\.[^/.]+$/, ""), // Use filename without extension as default name
        contentType: uploadedFile.type || "text/plain",
      }));
    };
    reader.onerror = () => {
      toast.error("Error al leer el archivo");
    };
    reader.readAsText(uploadedFile);
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const settingsNav = getSettingsNav(pathname || '/settings/context');

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <AppHeader variant="app" />

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
                <h1 className="text-3xl font-bold text-white">Archivos de Contexto</h1>
                <p className="mt-2 text-gray-400">
                  Gestiona archivos de contexto que se incluyen automáticamente en tus debates. Útiles para proporcionar información sobre tu proyecto, empresa o situación.
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
                    Crear Archivo
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-white/10 bg-slate-900/95 backdrop-blur-xl text-white max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingFile ? "Editar Archivo de Contexto" : "Crear Nuevo Archivo de Contexto"}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Añade un archivo de texto que se incluirá automáticamente en tus debates para proporcionar contexto adicional.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Documentación Quoorum"
                        className="border-white/10 bg-slate-800/50 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Breve descripción del archivo..."
                        className="border-white/10 bg-slate-800/50 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Subir Archivo (opcional)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept=".txt,.md,text/*"
                          onChange={handleFileUpload}
                          className="border-white/10 bg-slate-800/50 text-white file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="border-white/10 bg-slate-800/50 text-white hover:bg-slate-800"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400">
                        Solo archivos de texto (.txt, .md). Máximo 500KB.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Contenido *</Label>
                      <Textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Pega o escribe el contenido del archivo aquí..."
                        className="border-white/10 bg-slate-800/50 text-white min-h-[200px] font-mono text-sm"
                      />
                      <p className="text-xs text-gray-400">
                        {formData.content.length} caracteres
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Orden</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.order}
                          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                          className="border-white/10 bg-slate-800/50 text-white"
                        />
                        <p className="text-xs text-gray-400">
                          Orden en que se incluyen los archivos (menor = primero)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Tags (separados por comas)</Label>
                        <Input
                          value={formData.tags}
                          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          placeholder="Ej: proyecto, landing, estrategia"
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
                      disabled={createFile.isPending || updateFile.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {(createFile.isPending || updateFile.isPending) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingFile ? "Actualizando..." : "Creando..."}
                        </>
                      ) : editingFile ? (
                        <>
                          <Edit className="mr-2 h-4 w-4" />
                          Actualizar
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Crear
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {!files || files.length === 0 ? (
              <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-300 mb-2">No tienes archivos de contexto aún</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Crea tu primer archivo de contexto para incluir información relevante en tus debates
                  </p>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Primer Archivo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {files.map((file) => (
                  <Card
                    key={file.id}
                    className={`border-white/10 bg-slate-900/60 backdrop-blur-xl hover:border-purple-500/30 transition-colors ${
                      !file.isActive ? "opacity-60" : ""
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white flex items-center gap-2">
                            <FileText className="h-5 w-5 text-purple-400" />
                            {file.name}
                            {!file.isActive && (
                              <Badge variant="outline" className="border-gray-500/50 text-gray-300 bg-gray-500/10">
                                Inactivo
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-gray-300 mt-1">
                            {file.description || "Sin descripción"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <span>Tamaño: {formatFileSize(file.fileSize)}</span>
                        {file.order !== null && file.order !== undefined && (
                          <>
                            <span>•</span>
                            <span>Orden: {file.order}</span>
                          </>
                        )}
                      </div>

                      {file.tags && (
                        <div className="flex flex-wrap gap-1">
                          {file.tags.split(',').map((tag, i) => (
                            <Badge key={i} variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10 text-xs">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <div className="flex items-center gap-2 flex-1">
                          <Switch
                            checked={file.isActive}
                            onCheckedChange={() => handleToggleActive(file.id, file.isActive)}
                            disabled={toggleActive.isPending}
                          />
                          <span className="text-sm text-gray-300">
                            {file.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(file)}
                          className="border-white/10 bg-slate-800/50 text-white hover:bg-slate-800"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(file.id)}
                          disabled={deleteFile.isPending}
                          className="border-red-500/40 text-red-300 hover:bg-red-500/20 hover:text-white hover:border-red-500/60 disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" />
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
