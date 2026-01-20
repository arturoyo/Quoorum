'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/error-messages'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface ExpertsSectionProps {
  isInModal?: boolean
}

export function ExpertsSection({ isInModal = false }: ExpertsSectionProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExpert, setEditingExpert] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [expertToDelete, setExpertToDelete] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    expertise: '',
    description: '',
    systemPrompt: '',
    category: '',
    provider: 'google' as 'openai' | 'anthropic' | 'google' | 'groq',
    model: 'gemini-2.0-flash-exp',
    temperature: 0.7,
    maxTokens: undefined as number | undefined,
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

  // Queries - Only user's custom experts
  const { data: experts, isLoading, refetch } = api.experts.myExperts.useQuery(
    { activeOnly: false, limit: 100 },
    { enabled: isAuthenticated }
  )

  // Mutations
  const createExpert = api.experts.create.useMutation({
    onSuccess: () => {
      toast.success('Experto creado correctamente')
      setIsDialogOpen(false)
      resetForm()
      void refetch()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ERROR_MESSAGES.EXPERT_CREATE))
    },
  })

  const updateExpert = api.experts.update.useMutation({
    onSuccess: () => {
      toast.success('Experto actualizado correctamente')
      setIsDialogOpen(false)
      setEditingExpert(null)
      resetForm()
      void refetch()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ERROR_MESSAGES.EXPERT_UPDATE))
    },
  })

  const deleteExpert = api.experts.delete.useMutation({
    onSuccess: () => {
      toast.success('Experto eliminado')
      void refetch()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ERROR_MESSAGES.EXPERT_DELETE))
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      expertise: '',
      description: '',
      systemPrompt: '',
      category: '',
      provider: 'google',
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7,
      maxTokens: undefined,
    })
    setEditingExpert(null)
  }

  const handleEdit = (expert: NonNullable<typeof experts>[number]) => {
    if (!expert) return
    setEditingExpert(expert.id)
    setFormData({
      name: expert.name,
      expertise: expert.expertise,
      description: expert.description || '',
      systemPrompt: expert.systemPrompt,
      category: expert.category || '',
      provider: expert.aiConfig.provider,
      model: expert.aiConfig.model,
      temperature: expert.aiConfig.temperature || 0.7,
      maxTokens: expert.aiConfig.maxTokens,
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
      expertise: formData.expertise.trim(),
      description: formData.description || undefined,
      systemPrompt: formData.systemPrompt.trim(),
      category: formData.category || undefined,
      aiConfig: {
        provider: formData.provider,
        model: formData.model,
        temperature: formData.temperature,
        maxTokens: formData.maxTokens,
      },
    }

    if (editingExpert) {
      updateExpert.mutate({
        id: editingExpert,
        ...payload,
      })
    } else {
      createExpert.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    setExpertToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (expertToDelete) {
      deleteExpert.mutate({ id: expertToDelete })
    }
    setDeleteDialogOpen(false)
    setExpertToDelete(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Expertos Personalizados</h1>
          <p className="mt-2 text-gray-400">
            Crea y gestiona tus propios expertos especializados para debates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/settings/experts/library">
            <Button variant="outline" className="border-purple-500/40 text-purple-300 hover:bg-purple-500/20 hover:text-white hover:border-purple-500/60">
              <BookOpen className="mr-2 h-4 w-4" />
              Ver Biblioteca
            </Button>
          </Link>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) {
              resetForm()
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="mr-2 h-4 w-4" />
                Crear Experto
              </Button>
            </DialogTrigger>
            <DialogContent className="border-white/10 bg-slate-900/95 backdrop-blur-xl text-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingExpert ? 'Editar Experto' : 'Crear Nuevo Experto'}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Define el nombre, expertise, prompt del sistema y configuración AI
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Experto en Ventas B2B"
                    className="border-white/10 bg-slate-800/50 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expertise *</Label>
                  <Input
                    value={formData.expertise}
                    onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                    placeholder="Ej: Ventas B2B, Estrategia de marketing, etc."
                    className="border-white/10 bg-slate-800/50 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Breve descripción del experto..."
                    className="border-white/10 bg-slate-800/50 text-white min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>System Prompt *</Label>
                  <Textarea
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                    placeholder="Instrucciones del sistema para el experto..."
                    className="border-white/10 bg-slate-800/50 text-white min-h-[150px] font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ej: Ventas, Marketing, Finanzas"
                    className="border-white/10 bg-slate-800/50 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Provider AI</Label>
                    <Select
                      value={formData.provider}
                      onValueChange={(v) => setFormData({ ...formData, provider: v as typeof formData.provider })}
                    >
                      <SelectTrigger className="border-white/10 bg-slate-800/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-slate-800 text-white">
                        <SelectItem
                          value="google"
                          className="focus:bg-purple-500/20 focus:text-white"
                        >
                          Google (Gemini)
                        </SelectItem>
                        <SelectItem
                          value="openai"
                          className="focus:bg-purple-500/20 focus:text-white"
                        >
                          OpenAI
                        </SelectItem>
                        <SelectItem
                          value="anthropic"
                          className="focus:bg-purple-500/20 focus:text-white"
                        >
                          Anthropic
                        </SelectItem>
                        <SelectItem
                          value="groq"
                          className="focus:bg-purple-500/20 focus:text-white"
                        >
                          Groq
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Input
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Ej: gemini-2.0-flash-exp"
                      className="border-white/10 bg-slate-800/50 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Temperature (0-2)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0.7 })}
                      className="border-white/10 bg-slate-800/50 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Tokens (opcional)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.maxTokens || ''}
                      onChange={(e) => setFormData({ ...formData, maxTokens: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Opcional"
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
                  disabled={createExpert.isPending || updateExpert.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {(createExpert.isPending || updateExpert.isPending) ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : editingExpert ? (
                    <Edit className="mr-2 h-4 w-4" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {editingExpert ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!experts || experts.length === 0 ? (
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Sparkles className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-300 mb-2">No tienes expertos personalizados aún</p>
            <p className="text-sm text-gray-400 mb-4">
              Crea tu primer experto especializado para usarlo en debates
            </p>
            <Link href="/settings/experts/library">
              <Button variant="outline" className="border-purple-500/40 text-purple-300 hover:bg-purple-500/20 hover:text-white hover:border-purple-500/60">
                <BookOpen className="mr-2 h-4 w-4" />
                Explorar Biblioteca de Expertos
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {experts.map((expert) => (
            <Card
              key={expert.id}
              className="border-white/10 bg-slate-900/60 backdrop-blur-xl hover:border-purple-500/30 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white">{expert.name}</CardTitle>
                    <CardDescription className="text-gray-300 mt-1">
                      {typeof expert.expertise === 'string'
                        ? expert.expertise
                        : JSON.stringify(expert.expertise, null, 2)}
                    </CardDescription>
                  </div>
                  {!expert.isActive && (
                    <Badge variant="outline" className="border-gray-500/50 text-gray-300 bg-gray-500/10">
                      Inactivo
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {expert.description && (
                  <p className="text-sm text-gray-300">
                    {typeof expert.description === 'string'
                      ? expert.description
                      : JSON.stringify(expert.description, null, 2)}
                  </p>
                )}

                {expert.category && (
                  <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10">
                    {expert.category}
                  </Badge>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <span>Provider: {expert.aiConfig.provider}</span>
                  <span>•</span>
                  <span>Model: {expert.aiConfig.model}</span>
                  {expert.aiConfig.temperature && (
                    <>
                      <span>•</span>
                      <span>Temp: {expert.aiConfig.temperature}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(expert)}
                    className="flex-1 border-white/10 bg-slate-800/50 text-white hover:bg-slate-800"
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(expert.id)}
                    disabled={deleteExpert.isPending}
                    className="border-red-500/40 text-red-300 hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/60 disabled:opacity-50"
                  >
                    {deleteExpert.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
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
        title="¿Eliminar experto?"
        description="Esta acción desactivará este experto. Podrás reactivarlo más tarde desde la configuración."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteExpert.isPending}
      />
    </>
  )
}