/**
 * Scenarios Management Section
 * 
 * CRUD completo de escenarios (Decision Playbooks) con capacidad de:
 * - Ver lista de escenarios con filtros
 * - Crear nuevos escenarios
 * - Editar escenarios existentes
 * - Archivar escenarios
 * - Ver estadísticas de uso
 */

'use client'

import { useState, useEffect } from 'react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Search,
  Rocket,
  Users,
  Building2,
  Sparkles,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface ScenariosSectionProps {
  isInModal?: boolean
}

const segmentIcons = {
  entrepreneur: Rocket,
  sme: Users,
  corporate: Building2,
}

const segmentLabels = {
  entrepreneur: 'Emprendedor',
  sme: 'Pyme / Autónomo',
  corporate: 'Corporate / Inversor',
}

const segmentColors = {
  entrepreneur: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  sme: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  corporate: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
}

const statusLabels = {
  draft: 'Borrador',
  active: 'Activo',
  archived: 'Archivado',
}

const statusColors = {
  draft: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  archived: 'bg-red-500/20 text-red-300 border-red-500/30',
}

export function ScenariosSection({ isInModal = false }: ScenariosSectionProps) {
  const [search, setSearch] = useState('')
  const [segmentFilter, setSegmentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingScenario, setEditingScenario] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    segment: 'entrepreneur' as 'entrepreneur' | 'sme' | 'corporate',
    status: 'active' as 'draft' | 'active' | 'archived',
    expertIds: [] as string[],
    requiresDepartments: false,
    departmentIds: [] as string[],
    frameworkId: '',
    masterPromptTemplate: '',
    promptVariables: {} as Record<string, { label: string; description: string; defaultValue?: string; required: boolean }>,
    successMetrics: [] as Array<{ key: string; label: string; description: string; type: 'number' | 'boolean' | 'string' | 'array'; extractor?: string }>,
    agentBehaviorOverrides: {} as Record<string, { role?: string; temperature?: number; specialInstructions?: string }>,
    tokenOptimization: { enabled: true, maxTokensPerMessage: 50, compressionEnabled: true },
    generateCertificate: true,
    certificateTemplate: '',
    minTier: 'free',
    isPublic: true,
  })

  // Queries
  const { data: scenariosData, isLoading, refetch } = api.scenarios.list.useQuery({
    segment: segmentFilter !== 'all' ? (segmentFilter as any) : undefined,
    status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
    search: search || undefined,
    limit: 100,
  })

  const scenarios = scenariosData?.items || []

  // Get scenario by ID for editing
  const { data: editingScenarioData } = api.scenarios.getById.useQuery(
    { id: editingScenario! },
    { enabled: !!editingScenario }
  )

  // Load editing scenario data
  useEffect(() => {
    if (editingScenarioData) {
      setFormData({
        name: editingScenarioData.name,
        description: editingScenarioData.description,
        shortDescription: editingScenarioData.shortDescription || '',
        segment: editingScenarioData.segment,
        status: editingScenarioData.status,
        expertIds: editingScenarioData.expertIds || [],
        requiresDepartments: editingScenarioData.requiresDepartments || false,
        departmentIds: editingScenarioData.departmentIds || [],
        frameworkId: editingScenarioData.frameworkId || '',
        masterPromptTemplate: editingScenarioData.masterPromptTemplate,
        promptVariables: editingScenarioData.promptVariables || {},
        successMetrics: editingScenarioData.successMetrics || [],
        agentBehaviorOverrides: editingScenarioData.agentBehaviorOverrides || {},
        tokenOptimization: editingScenarioData.tokenOptimization || { enabled: true },
        generateCertificate: editingScenarioData.generateCertificate ?? true,
        certificateTemplate: editingScenarioData.certificateTemplate || '',
        minTier: editingScenarioData.minTier || 'free',
        isPublic: editingScenarioData.isPublic ?? true,
      })
    }
  }, [editingScenarioData])

  // Mutations
  const createScenario = api.scenarios.create.useMutation({
    onSuccess: () => {
      toast.success('Escenario creado exitosamente')
      setIsCreateDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast.error(`Error al crear escenario: ${error.message}`)
    },
  })

  const updateScenario = api.scenarios.update.useMutation({
    onSuccess: () => {
      toast.success('Escenario actualizado exitosamente')
      setEditingScenario(null)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast.error(`Error al actualizar escenario: ${error.message}`)
    },
  })

  const deleteScenario = api.scenarios.delete.useMutation({
    onSuccess: () => {
      toast.success('Escenario archivado exitosamente')
      setDeleteDialogOpen(false)
      setScenarioToDelete(null)
      refetch()
    },
    onError: (error) => {
      toast.error(`Error al archivar escenario: ${error.message}`)
    },
  })

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      shortDescription: '',
      segment: 'entrepreneur',
      status: 'active',
      expertIds: [],
      requiresDepartments: false,
      departmentIds: [],
      frameworkId: '',
      masterPromptTemplate: '',
      promptVariables: {},
      successMetrics: [],
      agentBehaviorOverrides: {},
      tokenOptimization: { enabled: true, maxTokensPerMessage: 50, compressionEnabled: true },
      generateCertificate: true,
      certificateTemplate: '',
      minTier: 'free',
      isPublic: true,
    })
  }

  function handleCreate() {
    createScenario.mutate(formData as any)
  }

  function handleUpdate() {
    if (!editingScenario) return
    updateScenario.mutate({
      id: editingScenario,
      ...formData,
    } as any)
  }

  function handleDelete() {
    if (!scenarioToDelete) return
    deleteScenario.mutate({ id: scenarioToDelete })
  }

  function handleEdit(scenarioId: string) {
    setEditingScenario(scenarioId)
    setIsCreateDialogOpen(true)
  }

  function handleDeleteClick(scenarioId: string) {
    setScenarioToDelete(scenarioId)
    setDeleteDialogOpen(true)
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-400" />
            Gestión de Escenarios
          </h2>
          <p className="text-sm text-[var(--theme-text-secondary)] mt-1">
            Administra los Decision Playbooks (Escenarios)
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setEditingScenario(null)
            setIsCreateDialogOpen(true)
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Escenario
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="text-[var(--theme-text-secondary)]">Buscar</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-secondary)]" />
                <Input
                  placeholder="Buscar escenarios..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                />
              </div>
            </div>
            <div>
              <Label className="text-[var(--theme-text-secondary)]">Segmento</Label>
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger className="mt-2 bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="entrepreneur">Emprendedor</SelectItem>
                  <SelectItem value="sme">Pyme / Autónomo</SelectItem>
                  <SelectItem value="corporate">Corporate / Inversor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[var(--theme-text-secondary)]">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-2 bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="archived">Archivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenarios Table */}
      <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-text-primary)]">
            Escenarios ({scenarios.length})
          </CardTitle>
          <CardDescription className="text-[var(--theme-text-secondary)]">
            Lista de todos los escenarios configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scenarios.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--theme-text-secondary)]">
                No se encontraron escenarios
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[var(--theme-border)]">
                    <TableHead className="text-[var(--theme-text-primary)]">Nombre</TableHead>
                    <TableHead className="text-[var(--theme-text-primary)]">Segmento</TableHead>
                    <TableHead className="text-[var(--theme-text-primary)]">Estado</TableHead>
                    <TableHead className="text-[var(--theme-text-primary)]">Expertos</TableHead>
                    <TableHead className="text-[var(--theme-text-primary)]">Usos</TableHead>
                    <TableHead className="text-[var(--theme-text-primary)]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scenarios.map((scenario) => {
                    const SegmentIcon = segmentIcons[scenario.segment]
                    return (
                      <TableRow key={scenario.id} className="border-[var(--theme-border)]">
                        <TableCell className="text-[var(--theme-text-primary)]">
                          <div>
                            <div className="font-medium">{scenario.name}</div>
                            {scenario.shortDescription && (
                              <div className="text-sm text-[var(--theme-text-secondary)]">
                                {scenario.shortDescription}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={segmentColors[scenario.segment]}>
                            <SegmentIcon className="h-3 w-3 mr-1" />
                            {segmentLabels[scenario.segment]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[scenario.status]}>
                            {statusLabels[scenario.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[var(--theme-text-secondary)]">
                          {scenario.expertIds?.length || 0} expertos
                        </TableCell>
                        <TableCell className="text-[var(--theme-text-secondary)]">
                          {scenario.usageCount || 0}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(scenario.id)}
                              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteClick(scenario.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--theme-text-primary)]">
              {editingScenario ? 'Editar Escenario' : 'Nuevo Escenario'}
            </DialogTitle>
            <DialogDescription className="text-[var(--theme-text-secondary)]">
              {editingScenario
                ? 'Modifica la configuración del escenario'
                : 'Crea un nuevo Decision Playbook'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-[var(--theme-text-secondary)]">Nombre *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-2 bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                  placeholder="Ej: Validación de Idea & Product-Market Fit"
                />
              </div>
              <div>
                <Label className="text-[var(--theme-text-secondary)]">Segmento *</Label>
                <Select
                  value={formData.segment}
                  onValueChange={(value) =>
                    setFormData({ ...formData, segment: value as any })
                  }
                >
                  <SelectTrigger className="mt-2 bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrepreneur">Emprendedor</SelectItem>
                    <SelectItem value="sme">Pyme / Autónomo</SelectItem>
                    <SelectItem value="corporate">Corporate / Inversor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[var(--theme-text-secondary)]">Descripción Corta</Label>
              <Input
                value={formData.shortDescription}
                onChange={(e) =>
                  setFormData({ ...formData, shortDescription: e.target.value })
                }
                className="mt-2 bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                placeholder="Breve descripción (máx. 500 caracteres)"
                maxLength={500}
              />
            </div>

            <div>
              <Label className="text-[var(--theme-text-secondary)]">Descripción Completa *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-2 bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)] min-h-[100px]"
                placeholder="Descripción detallada del escenario..."
              />
            </div>

            <div>
              <Label className="text-[var(--theme-text-secondary)]">Master Prompt Template *</Label>
              <Textarea
                value={formData.masterPromptTemplate}
                onChange={(e) =>
                  setFormData({ ...formData, masterPromptTemplate: e.target.value })
                }
                className="mt-2 bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)] min-h-[200px] font-mono text-sm"
                placeholder="Template con variables {{user_input}}, {{context}}, etc."
              />
              <p className="text-xs text-[var(--theme-text-tertiary)] mt-1">
                Usa variables como {'{{user_input}}'}, {'{{context}}'}, {'{{#if var}}...{{/if}}'}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-[var(--theme-text-secondary)]">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger className="mt-2 bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="archived">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[var(--theme-text-secondary)]">Tier Mínimo</Label>
                <Select
                  value={formData.minTier}
                  onValueChange={(value) => setFormData({ ...formData, minTier: value })}
                >
                  <SelectTrigger className="mt-2 bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="rounded border-[var(--theme-border)]"
                aria-label="Escenario público"
                title="Escenario público (visible para todos los usuarios)"
              />
              <Label htmlFor="isPublic" className="text-[var(--theme-text-secondary)]">
                Escenario público (visible para todos los usuarios)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                resetForm()
                setEditingScenario(null)
              }}
              className="border-[var(--theme-border)] text-[var(--theme-text-primary)]"
            >
              Cancelar
            </Button>
            <Button
              onClick={editingScenario ? handleUpdate : handleCreate}
              disabled={createScenario.isPending || updateScenario.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {(createScenario.isPending || updateScenario.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingScenario ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="¿Archivar escenario?"
        description="El escenario será archivado (soft delete) y dejará de estar disponible para nuevos debates."
        confirmText="Archivar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={deleteScenario.isPending}
      />
    </div>
  )
}
