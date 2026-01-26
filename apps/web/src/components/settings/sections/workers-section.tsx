/**
 * Workers Section Component (Profesionales)
 * 
 * Manages internal company professionals (vs external experts).
 * Professionals are virtual AI representations of employees that can participate
 * in internal debates using their department context.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
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
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Loader2,
  Plus,
  Trash2,
  Edit,
  Users,
  Building2,
  BookOpen,
} from 'lucide-react'
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/error-messages'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface WorkersSectionProps {
  isInModal?: boolean
}

const WORKER_ROLES = [
  { value: 'ceo', label: 'CEO' },
  { value: 'cto', label: 'CTO' },
  { value: 'cfo', label: 'CFO' },
  { value: 'cmo', label: 'CMO' },
  { value: 'coo', label: 'COO' },
  { value: 'vp_sales', label: 'VP de Ventas' },
  { value: 'vp_product', label: 'VP de Producto' },
  { value: 'vp_engineering', label: 'VP de Ingeniería' },
  { value: 'director', label: 'Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'senior', label: 'Senior' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'junior', label: 'Junior' },
  { value: 'intern', label: 'Intern' },
  { value: 'consultant', label: 'Consultor' },
  { value: 'advisor', label: 'Asesor' },
  { value: 'custom', label: 'Personalizado' },
] as const

export function WorkersSection({ isInModal = false }: WorkersSectionProps) {
  // ═══════════════════════════════════════════════════════════
  // ALL HOOKS MUST BE CALLED IN THE SAME ORDER EVERY RENDER
  // ═══════════════════════════════════════════════════════════
  
  // 1. Router hook
  const router = useRouter()
  
  // 2. State hooks (always in same order)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [workerToDelete, setWorkerToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    role: 'custom' as const,
    departmentId: '' as string | undefined,
    expertise: '',
    description: '',
    responsibilities: '',
    systemPrompt: '',
    provider: 'google' as 'openai' | 'anthropic' | 'google' | 'groq',
    model: 'gemini-2.0-flash-exp',
    temperature: 0.7,
    maxTokens: undefined as number | undefined,
    avatar: '',
    email: '',
    phone: '',
  })

  // 3. Effect hooks
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
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
  }, [router, isInModal])

  // 4. Query hooks (always call, even if disabled)
  const { data: company } = api.companies.get.useQuery(undefined, {
    enabled: isAuthenticated,
  })
  const { data: departments } = api.departments.list.useQuery(
    { companyId: company?.id ?? '00000000-0000-0000-0000-000000000000' },
    { enabled: !!company?.id }
  )
  const { data: workers, isLoading: isLoadingWorkers, refetch } = api.workers.list.useQuery(
    { activeOnly: false, limit: 100 },
    { enabled: isAuthenticated }
  )
  const { data: libraryWorkers, isLoading: isLoadingLibrary } = api.workers.libraryList.useQuery(
    { activeOnly: true, limit: 100 },
    { enabled: isAuthenticated }
  )

  // 5. Helper functions (defined before mutations that use them)
  // Note: resetForm doesn't depend on any props/state, so empty deps array is fine
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      role: 'custom',
      departmentId: undefined,
      expertise: '',
      description: '',
      responsibilities: '',
      systemPrompt: '',
      provider: 'google',
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7,
      maxTokens: undefined,
      avatar: '',
      email: '',
      phone: '',
    })
    setEditingWorker(null)
  }, []) // Empty deps - only uses setters which are stable

  // 6. Mutation hooks (always call)
  const createWorker = api.workers.create.useMutation({
    onSuccess: () => {
      toast.success('Profesional creado correctamente')
      setIsDialogOpen(false)
      resetForm()
      void refetch()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Error al crear profesional'))
    },
  })

  const updateWorker = api.workers.update.useMutation({
    onSuccess: () => {
      toast.success('Profesional actualizado correctamente')
      setIsDialogOpen(false)
      setEditingWorker(null)
      resetForm()
      void refetch()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Error al actualizar profesional'))
    },
  })

  const deleteWorker = api.workers.delete.useMutation({
    onSuccess: () => {
      toast.success('Profesional eliminado')
      void refetch()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Error al eliminar profesional'))
    },
  })

  const handleEdit = (worker: NonNullable<typeof workers>[number]) => {
    if (!worker) return
    setEditingWorker(worker.id)
    setFormData({
      name: worker.name,
      role: worker.role as any,
      departmentId: worker.departmentId || undefined,
      expertise: worker.expertise,
      description: worker.description || '',
      responsibilities: worker.responsibilities || '',
      systemPrompt: worker.systemPrompt,
      provider: worker.aiConfig.provider,
      model: worker.aiConfig.model,
      temperature: worker.aiConfig.temperature || 0.7,
      maxTokens: worker.aiConfig.maxTokens,
      avatar: worker.avatar || '',
      email: worker.email || '',
      phone: worker.phone || '',
    })
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    if (!formData.name.trim() || !formData.expertise.trim() || !formData.systemPrompt.trim()) {
      toast.error('Nombre, expertise y system prompt son requeridos')
      return
    }

    const payload = {
      name: formData.name.trim(),
      role: formData.role,
      departmentId: formData.departmentId || undefined,
      expertise: formData.expertise.trim(),
      description: formData.description || undefined,
      responsibilities: formData.responsibilities || undefined,
      systemPrompt: formData.systemPrompt.trim(),
      aiConfig: {
        provider: formData.provider,
        model: formData.model,
        temperature: formData.temperature,
        maxTokens: formData.maxTokens,
      },
      avatar: formData.avatar || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
    }

    if (editingWorker) {
      updateWorker.mutate({
        id: editingWorker,
        ...payload,
      })
    } else {
      createWorker.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    setWorkerToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (workerToDelete) {
      deleteWorker.mutate({ id: workerToDelete })
      setDeleteDialogOpen(false)
      setWorkerToDelete(null)
    }
  }

  const handleLoadTemplate = (template: NonNullable<typeof libraryWorkers>[number]) => {
    setFormData({
      name: template.name,
      role: template.role as any,
      departmentId: undefined,
      expertise: template.expertise,
      description: template.description || '',
      responsibilities: template.responsibilities || '',
      systemPrompt: template.systemPrompt || '',
      provider: template.aiConfig.provider,
      model: template.aiConfig.model,
      temperature: template.aiConfig.temperature || 0.7,
      maxTokens: template.aiConfig.maxTokens,
      avatar: template.avatar || '',
      email: '',
      phone: '',
    })
    setIsDialogOpen(true)
  }

  // Loading state check (after all hooks)
  const isLoading = isLoadingWorkers || isLoadingLibrary || !isAuthenticated

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--theme-text-primary)]">Profesionales Internos</h2>
          <p className="text-sm text-[var(--theme-text-tertiary)] mt-1">
            Gestiona los profesionales virtuales de tu empresa que participan en debates internos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm()
                setIsDialogOpen(true)
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Profesional
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
            <DialogHeader className="border-b-0 pb-0">
              <DialogTitle className="text-[var(--theme-text-primary)]">
                {editingWorker ? 'Editar Profesional' : 'Nuevo Profesional'}
              </DialogTitle>
              <DialogDescription className="text-[var(--theme-text-tertiary)]">
                {editingWorker
                  ? 'Modifica la información del profesional'
                  : 'Crea un profesional virtual que represente a un empleado de tu empresa'}
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[var(--theme-text-secondary)]">
                    Nombre *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Juan García"
                    className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-[var(--theme-text-secondary)]">
                    Rol *
                  </Label>
                  <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger id="role" className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKER_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-[var(--theme-text-secondary)]">
                  Departamento (Opcional)
                </Label>
                <Select
                  value={formData.departmentId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: value === 'none' ? undefined : value })}
                >
                  <SelectTrigger id="department" className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]">
                    <SelectValue placeholder="Sin departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin departamento</SelectItem>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.icon && <span className="mr-2">{dept.icon}</span>}
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Expertise */}
              <div className="space-y-2">
                <Label htmlFor="expertise" className="text-[var(--theme-text-secondary)]">
                  Expertise *
                </Label>
                <Input
                  id="expertise"
                  value={formData.expertise}
                  onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                  placeholder="Ej: Marketing digital, SEO, Content strategy"
                  className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[var(--theme-text-secondary)]">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descripción del profesional..."
                  rows={2}
                  className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                />
              </div>

              {/* Responsibilities */}
              <div className="space-y-2">
                <Label htmlFor="responsibilities" className="text-[var(--theme-text-secondary)]">
                  Responsabilidades
                </Label>
                <Textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  placeholder="Ej: Gestiona campañas, analiza métricas..."
                  rows={3}
                  className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                />
              </div>

              {/* System Prompt */}
              <div className="space-y-2">
                <Label htmlFor="systemPrompt" className="text-[var(--theme-text-secondary)]">
                  System Prompt *
                </Label>
                <Textarea
                  id="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  placeholder="Define el comportamiento y rol del profesional en debates..."
                  rows={6}
                  className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono text-sm"
                />
              </div>

              {/* AI Config */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="provider" className="text-[var(--theme-text-secondary)]">
                    Provider
                  </Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value: any) => setFormData({ ...formData, provider: value })}
                  >
                    <SelectTrigger id="provider" className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="groq">Groq</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-[var(--theme-text-secondary)]">
                    Modelo
                  </Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="gemini-2.0-flash-exp"
                    className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature" className="text-[var(--theme-text-secondary)]">
                    Temperature
                  </Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0.7 })}
                    className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                  />
                </div>
              </div>

              {/* Optional fields */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="avatar" className="text-[var(--theme-text-secondary)]">
                    Avatar (Emoji)
                  </Label>
                  <Input
                    id="avatar"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="👔"
                    maxLength={2}
                    className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[var(--theme-text-secondary)]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="profesional@empresa.com"
                    className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[var(--theme-text-secondary)]">
                    Teléfono
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+34 600 000 000"
                    className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                  />
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="border-t-0 pt-0">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  resetForm()
                }}
                className="border-purple-500/40 text-purple-300 hover:bg-purple-500/20"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createWorker.isPending || updateWorker.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {(createWorker.isPending || updateWorker.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingWorker ? 'Guardar Cambios' : 'Crear Profesional'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Library Templates */}
      {libraryWorkers && libraryWorkers.length > 0 && (
        <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
          <CardHeader>
            <CardTitle className="text-[var(--theme-text-primary)] flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-400" />
              Plantillas de Profesionales
            </CardTitle>
            <CardDescription className="text-[var(--theme-text-tertiary)]">
              Usa estas plantillas como base para crear tus profesionales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {libraryWorkers.map((template) => (
                <Card
                  key={template.id}
                  className="bg-[var(--theme-bg-tertiary)] border-[var(--theme-border)] hover:border-purple-500/30 cursor-pointer transition-colors"
                  onClick={() => handleLoadTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {template.avatar && (
                        <div className="text-2xl">{template.avatar}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[var(--theme-text-primary)] truncate">{template.name}</h4>
                        <p className="text-xs text-[var(--theme-text-tertiary)] mt-1">{template.role}</p>
                        <p className="text-sm text-[var(--theme-text-secondary)] mt-2 line-clamp-2">{template.expertise}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workers List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--theme-text-primary)]">Tus Profesionales</h3>
        {!workers || workers.length === 0 ? (
          <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
            <CardContent className="py-8 text-center">
              <Users className="h-12 w-12 text-[var(--theme-text-tertiary)] mx-auto mb-4" />
              <p className="text-[var(--theme-text-tertiary)]">No tienes profesionales creados aún</p>
              <p className="text-sm text-[var(--theme-text-tertiary)] mt-2">
                Crea tu primer profesional o usa una plantilla de arriba
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workers.map((worker) => {
              const department = departments?.find((d) => d.id === worker.departmentId)
              return (
                <Card key={worker.id} className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {worker.avatar && (
                          <div className="text-2xl">{worker.avatar}</div>
                        )}
                        <div>
                          <CardTitle className="text-[var(--theme-text-primary)]">{worker.name}</CardTitle>
                          <CardDescription className="text-[var(--theme-text-tertiary)]">
                            {WORKER_ROLES.find((r) => r.value === worker.role)?.label || worker.role}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(worker)}
                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(worker.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-[var(--theme-text-secondary)]">{worker.expertise}</p>
                    {department && (
                      <div className="flex items-center gap-2 text-xs text-[var(--theme-text-tertiary)]">
                        <Building2 className="h-3 w-3" />
                        <span>{department.icon} {department.name}</span>
                      </div>
                    )}
                    {worker.description && (
                      <p className="text-xs text-[var(--theme-text-tertiary)] line-clamp-2">{worker.description}</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Eliminar Profesional"
        description="¿Estás seguro de que quieres eliminar este profesional? Esta acción no se puede deshacer."
      />
    </div>
  )
}
