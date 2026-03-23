'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Loader2,
  Plus,
  Trash2,
  Edit,
  FileText,
  Upload,
  UploadCloud,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/error-messages'

interface ContextSectionProps {
  isInModal?: boolean
}

export function ContextSection({ isInModal = false }: ContextSectionProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFile, setEditingFile] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const quickUploadRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    contentType: 'text/plain' as string,
    tags: '',
    order: 0,
  })

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!isInModal) {
          router.push('/login')
        }
        return
      }
      setIsAuthenticated(true)
    }
    checkAuth()
  }, [router, supabase.auth, isInModal])

  // Queries
  const { data: files, isLoading, refetch } = api.contextFiles.list.useQuery(
    { activeOnly: false, limit: 100 },
    { enabled: isAuthenticated }
  )

  // Mutations
  const createFile = api.contextFiles.create.useMutation({
    onSuccess: () => {
      toast.success('Archivo de contexto creado correctamente')
      setIsDialogOpen(false)
      resetForm()
      void refetch()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ERROR_MESSAGES.CONTEXT_CREATE))
    },
  })

  const updateFile = api.contextFiles.update.useMutation({
    onSuccess: () => {
      toast.success('Archivo de contexto actualizado correctamente')
      setIsDialogOpen(false)
      setEditingFile(null)
      resetForm()
      void refetch()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ERROR_MESSAGES.CONTEXT_UPDATE))
    },
  })

  const deleteFile = api.contextFiles.delete.useMutation({
    onSuccess: () => {
      toast.success('Archivo eliminado')
      void refetch()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ERROR_MESSAGES.CONTEXT_DELETE))
    },
  })

  const toggleActive = api.contextFiles.toggleActive.useMutation({
    onSuccess: () => {
      void refetch()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ERROR_MESSAGES.CONTEXT_UPDATE))
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      content: '',
      contentType: 'text/plain',
      tags: '',
      order: 0,
    })
    setEditingFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleEdit = (file: NonNullable<typeof files>[number]) => {
    if (!file) return
    setEditingFile(file.id)
    setFormData({
      name: file.name,
      description: file.description || '',
      content: file.content,
      contentType: file.contentType || 'text/plain',
      tags: file.tags || '',
      order: file.order || 0,
    })
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error('Nombre y contenido son requeridos')
      return
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description || undefined,
      content: formData.content.trim(),
      contentType: formData.contentType,
      tags: formData.tags || undefined,
      order: formData.order,
    }

    if (editingFile) {
      updateFile.mutate({
        id: editingFile,
        ...payload,
      })
    } else {
      createFile.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    setFileToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (fileToDelete) {
      deleteFile.mutate({ id: fileToDelete })
    }
    setDeleteDialogOpen(false)
    setFileToDelete(null)
  }

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    toggleActive.mutate({ id, isActive: !currentStatus })
  }

  const processFile = (uploadedFile: File, autoCreate = true) => {
    // Only accept text files
    if (!uploadedFile.type.startsWith('text/') && !uploadedFile.name.endsWith('.txt') && !uploadedFile.name.endsWith('.md')) {
      toast.error('Solo se permiten archivos de texto (.txt, .md)')
      return
    }

    // Limit file size to ~500KB
    if (uploadedFile.size > 500000) {
      toast.error('El archivo es demasiado grande. Máximo 500KB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const fileName = uploadedFile.name.replace(/\.[^/.]+$/, '') // Remove extension

      if (autoCreate) {
        // Auto-create file without opening dialog
        createFile.mutate({
          name: fileName,
          content: content,
          contentType: uploadedFile.type || 'text/plain',
          order: 0,
        })
      } else {
        // Manual mode: populate form and open dialog
        setFormData((prev) => ({
          ...prev,
          content: content,
          name: prev.name || fileName,
          contentType: uploadedFile.type || 'text/plain',
        }))
        toast.success(`Archivo "${uploadedFile.name}" cargado correctamente`)
      }
    }
    reader.onerror = () => {
      toast.error('Error al leer el archivo')
    }
    reader.readAsText(uploadedFile)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (!uploadedFile) return
    processFile(uploadedFile, true) // Auto-create by default
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file) {
        processFile(file, true) // Auto-create on main drop zone
      }
    }
  }

  const handleDropInDialog = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file) {
        processFile(file, false) // Don't auto-create, populate form
      }
    }
  }

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 styles.colors.text.primary">Archivos de Contexto</h1>
        <p className="styles.colors.text.secondary">
          Gestiona archivos de contexto que se incluyen automáticamente en tus debates
        </p>
      </div>

      <div className="flex justify-end mb-4">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Crear Archivo
            </Button>
          </DialogTrigger>
          <DialogContent className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl styles.colors.text.primary">
            <DialogHeader className="border-b-0 pb-0">
              <DialogTitle className="styles.colors.text.primary">
                {editingFile ? 'Editar Archivo de Contexto' : 'Crear Nuevo Archivo de Contexto'}
              </DialogTitle>
              <DialogDescription className="styles.colors.text.secondary">
                Añade un archivo de texto que se incluirá automáticamente en tus debates para proporcionar contexto adicional.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4">
              <div className="space-y-2">
                <Label className="styles.colors.text.secondary">Nombre *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Documentación Quoorum"
                   aria-label="Context file name"
                  className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="styles.colors.text.secondary">Descripción</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descripción del archivo..."
                   aria-label="Context file description"
                  className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="styles.colors.text.secondary">Subir Archivo (opcional)</Label>
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDropInDialog}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                    transition-all duration-200 ease-in-out
                    ${isDragging
                      ? 'border-purple-500 bg-purple-500/10 scale-[1.02]'
                      : 'styles.colors.border.default styles.colors.bg.tertiary hover:border-purple-500/50 hover:styles.colors.bg.input'
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,text/*"
                    onChange={(e) => {
                      const uploadedFile = e.target.files?.[0]
                      if (uploadedFile) processFile(uploadedFile, false) // Populate form, don't auto-create
                    }}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className={`
                      rounded-full p-3 transition-all duration-200
                      ${isDragging ? 'bg-purple-500/20 scale-110' : 'bg-purple-500/10'}
                    `}>
                      {isDragging ? (
                        <UploadCloud className="h-8 w-8 text-purple-400 animate-pulse" />
                      ) : (
                        <Upload className="h-8 w-8 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium styles.colors.text.primary mb-1">
                        {isDragging ? '¡Suelta el archivo aquí!' : 'Arrastra un archivo o haz clic para seleccionar'}
                      </p>
                      <p className="text-xs styles.colors.text.tertiary">
                        Solo archivos de texto (.txt, .md). Máximo 500KB.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="styles.colors.text.secondary">Contenido *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Pega o escribe el contenido del archivo aquí..."
                  className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs styles.colors.text.tertiary">
                  {formData.content.length} caracteres
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="styles.colors.text.secondary">Orden</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary"
                  />
                  <p className="text-xs styles.colors.text.tertiary">
                    Orden en que se incluyen los archivos (menor = primero)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="styles.colors.text.secondary">Tags (separados por comas)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Ej: proyecto, landing, estrategia"
                    className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary"
                  />
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="border-t-0 pt-0">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="styles.colors.border.default styles.colors.bg.tertiary styles.colors.text.primary hover:bg-purple-600 hover:border-purple-600"
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
                    {editingFile ? 'Actualizando...' : 'Creando...'}
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

      {/* Quick Upload Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => quickUploadRef.current?.click()}
        className={`
          mb-6 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragging
            ? 'border-purple-500 bg-purple-500/10 scale-[1.01]'
            : 'styles.colors.border.default styles.colors.bg.tertiary hover:border-purple-500/50 hover:styles.colors.bg.input'
          }
        `}
      >
        <input
          ref={quickUploadRef}
          type="file"
          accept=".txt,.md,text/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <div className={`
            rounded-full p-2 transition-all duration-200
            ${isDragging ? 'bg-purple-500/20 scale-110' : 'bg-purple-500/10'}
          `}>
            {isDragging ? (
              <UploadCloud className="h-6 w-6 text-purple-400 animate-pulse" />
            ) : (
              <Upload className="h-6 w-6 text-purple-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium styles.colors.text.primary">
              {isDragging ? '¡Suelta para subir!' : 'Arrastra archivos aquí para añadirlos rápidamente'}
            </p>
            <p className="text-xs styles.colors.text.tertiary">
              O haz clic para seleccionar • Solo .txt, .md • Máx 500KB
            </p>
          </div>
        </div>
      </div>

      {!files || files.length === 0 ? (
        <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 styles.colors.text.tertiary mb-4" />
            <p className="styles.colors.text.secondary mb-2">No tienes archivos de contexto aún</p>
            <p className="text-sm styles.colors.text.tertiary mb-4">
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
              className={`styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl hover:border-purple-500/30 transition-colors ${
                !file.isActive ? 'opacity-60' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="styles.colors.text.primary flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-400" />
                      {file.name}
                      {!file.isActive && (
                        <Badge variant="outline" className="styles.colors.border.default styles.colors.text.tertiary styles.colors.bg.tertiary">
                          Inactivo
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="styles.colors.text.secondary mt-1">
                      {file.description || 'Sin descripción'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-xs styles.colors.text.secondary">
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

                <div className="flex items-center gap-2 pt-2 border-t styles.colors.border.default">
                  <div className="flex items-center gap-2 flex-1">
                    <Switch
                      checked={file.isActive}
                      onCheckedChange={() => handleToggleActive(file.id, file.isActive)}
                      disabled={toggleActive.isPending}
                    />
                    <span className="text-sm styles.colors.text.secondary">
                      {file.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(file)}
                    className="styles.colors.border.default styles.colors.bg.tertiary styles.colors.text.primary hover:bg-purple-600 hover:border-purple-600"
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

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="¿Eliminar archivo?"
        description="Esta acción eliminará permanentemente este archivo de contexto. No se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteFile.isPending}
      />
    </div>
  )
}