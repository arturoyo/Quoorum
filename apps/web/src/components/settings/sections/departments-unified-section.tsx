'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOpenSettings } from '@/hooks/use-open-settings'
import { useSettingsContext } from '../settings-context'
import { Loader2, Plus, Building2, BookOpen, Trash2, Edit, Check, ArrowLeft, Save, Copy } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn, styles } from '@/lib/utils'

const DEPARTMENT_TYPES = [
  { value: 'finance', label: 'Finanzas', icon: '💰' },
  { value: 'marketing', label: 'Marketing', icon: '📢' },
  { value: 'operations', label: 'Operaciones', icon: '⚙️' },
  { value: 'hr', label: 'Recursos Humanos', icon: '👥' },
  { value: 'sales', label: 'Ventas', icon: '💼' },
  { value: 'product', label: 'Producto', icon: '🎯' },
  { value: 'engineering', label: 'Ingeniería', icon: '🛠️' },
  { value: 'customer_success', label: 'Customer Success', icon: '🤝' },
  { value: 'legal', label: 'Legal y Compliance', icon: '⚖️' },
  { value: 'custom', label: 'Personalizado', icon: '📋' },
] as const

const AGENT_ROLES = [
  { value: 'analyst', label: 'Analista' },
  { value: 'critic', label: 'Crítico' },
  { value: 'synthesizer', label: 'Sintetizador' },
] as const

interface DepartmentsUnifiedSectionProps {
  isInModal?: boolean
}

interface FormData {
  name: string
  type: string
  departmentContext: string
  basePrompt: string
  customPrompt: string
  agentRole: string
  temperature: string
  description: string
  icon: string
  parentId: string | null
}

const initialFormData: FormData = {
  name: '',
  type: 'custom',
  departmentContext: '',
  basePrompt: '',
  customPrompt: '',
  agentRole: 'analyst',
  temperature: '0.7',
  description: '',
  icon: '',
  parentId: null,
}

export function DepartmentsUnifiedSection({ isInModal = false }: DepartmentsUnifiedSectionProps) {
  const router = useRouter()
  const openSettings = useOpenSettings()
  const { setCurrentSection } = useSettingsContext()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isTemplatesDialogOpen, setIsTemplatesDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: string; name: string; type: string } | null>(null)
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null)
  const [departmentToDelete, setDepartmentToDelete] = useState<{ id: string; name: string } | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)

  // Queries
  const { data: company, isLoading: loadingCompany } = api.companies.get.useQuery()
  const { data: userDepartments, isLoading: loadingDepartments, refetch: refetchDepartments } = api.departments.list.useQuery(
    { companyId: company?.id ?? '00000000-0000-0000-0000-000000000000' },
    { enabled: !!company?.id }
  )
  const { data: predefinedDepartments } = api.departments.listPredefined.useQuery()

  // Mutations
  const createDepartment = api.departments.create.useMutation({
    onSuccess: () => {
      toast.success('Departamento creado correctamente')
      setIsCreateDialogOpen(false)
      setFormData(initialFormData)
      void refetchDepartments()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const updateDepartment = api.departments.update.useMutation({
    onSuccess: () => {
      toast.success('Departamento actualizado')
      setIsCreateDialogOpen(false)
      setEditingDepartment(null)
      setFormData(initialFormData)
      void refetchDepartments()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const deleteDepartment = api.departments.delete.useMutation({
    onSuccess: () => {
      toast.success('Departamento eliminado')
      void refetchDepartments()
      setDepartmentToDelete(null)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const createFromTemplate = api.departments.createFromTemplate.useMutation({
    onSuccess: (data) => {
      toast.success(`Departamento "${data.name}" creado exitosamente`)
      void refetchDepartments()
      setIsTemplatesDialogOpen(false)
      setSelectedTemplate(null)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const seedPredefined = api.departments.seedPredefined.useMutation({
    onSuccess: (data) => {
      const createdCount = data?.length ?? 0
      toast.success(`${createdCount} departamentos creados exitosamente`)
      void refetchDepartments()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingDepartment(null)
  }

  const handleCreateOrUpdate = () => {
    if (!company) {
      toast.error('Empresa no configurada')
      return
    }

    if (!formData.name.trim() || !formData.departmentContext.trim() || !formData.basePrompt.trim()) {
      toast.error('Nombre, contexto y prompt base son requeridos')
      return
    }

    if (editingDepartment) {
      updateDepartment.mutate({
        id: editingDepartment,
        companyId: company.id,
        name: formData.name,
        type: formData.type as any,
        departmentContext: formData.departmentContext,
        basePrompt: formData.basePrompt,
        customPrompt: formData.customPrompt || undefined,
        agentRole: formData.agentRole as any,
        temperature: formData.temperature,
        description: formData.description || undefined,
        icon: formData.icon || undefined,
        parentId: formData.parentId || undefined,
      })
    } else {
      createDepartment.mutate({
        companyId: company.id,
        name: formData.name,
        type: formData.type as any,
        departmentContext: formData.departmentContext,
        basePrompt: formData.basePrompt,
        customPrompt: formData.customPrompt || undefined,
        agentRole: formData.agentRole as any,
        temperature: formData.temperature,
        description: formData.description || undefined,
        icon: formData.icon || undefined,
        parentId: formData.parentId || undefined,
      })
    }
  }

  const handleEdit = (dept: NonNullable<typeof userDepartments>[number]) => {
    setFormData({
      name: dept.name,
      type: dept.type,
      departmentContext: dept.departmentContext,
      basePrompt: dept.basePrompt,
      customPrompt: dept.customPrompt || '',
      agentRole: dept.agentRole,
      temperature: dept.temperature || '0.7',
      description: dept.description || '',
      icon: dept.icon || '',
      parentId: dept.parentId || null,
    })
    setEditingDepartment(dept.id)
    setIsCreateDialogOpen(true)
  }

  const handleLoadTemplate = (templateType: string) => {
    const template = predefinedDepartments?.find((d) => d.type === templateType)
    if (template) {
      setFormData((prev) => ({
        ...prev,
        name: template.name,
        type: template.type,
        departmentContext: template.departmentContext,
        basePrompt: template.basePrompt,
        agentRole: template.agentRole,
        description: template.description || '',
        icon: template.icon || '',
      }))
      toast.success('Plantilla cargada. Personaliza según necesites')
    }
  }

  const getTemperatureLabel = (temp: string) => {
    const t = parseFloat(temp)
    if (t <= 0.3) return 'Muy conservador'
    if (t <= 0.5) return 'Conservador'
    if (t <= 0.7) return 'Balanceado'
    return 'Creativo'
  }

  // Estado de carga inicial
  if (loadingCompany) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </div>
    )
  }

  // Si no hay empresa configurada
  if (!company) {
    return (
      <div className="space-y-6">
        <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-purple-500/10 p-3">
              <Building2 className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="mb-1 text-lg font-semibold styles.colors.text.primary">Configura tu empresa primero</h3>
            <p className="mb-4 text-center text-sm styles.colors.text.tertiary">
              Necesitas configurar tu empresa antes de crear departamentos
            </p>
            <Button
              onClick={() => {
                if (isInModal && setCurrentSection) {
                  // Si estamos en el modal, cambiar la sección directamente
                  setCurrentSection('/settings/company')
                } else {
                  // Si estamos en una página, abrir el modal
                  openSettings('/settings/company')
                }
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Configurar Empresa
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', isInModal ? 'pb-8' : 'pb-0')}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 styles.colors.text.primary">Mis Departamentos</h1>
        <p className="styles.colors.text.secondary">
          Gestiona los departamentos de {company.name} para debates con contexto corporativo
        </p>
      </div>

      {/* Resumen de empresa */}
      <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 styles.colors.text.primary">
                <Building2 className="h-5 w-5" />
                {company.name}
              </CardTitle>
              <CardDescription className="styles.colors.text.tertiary">
                {userDepartments?.length || 0} departamentos configurados
              </CardDescription>
            </div>
            {userDepartments && userDepartments.length > 0 && (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/40">
                <Check className="mr-1 h-3 w-3" />
                Activo
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Lista de departamentos */}
      {loadingDepartments ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : userDepartments && userDepartments.length > 0 ? (
        <>
          {/* Botones de acción cuando hay departamentos */}
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => {
                resetForm()
                setIsCreateDialogOpen(true)
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear Nuevo
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsTemplatesDialogOpen(true)}
              className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary hover:styles.colors.bg.tertiary"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Ver Plantillas
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userDepartments.map((dept) => (
            <Card key={dept.id} className="relative styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl hover:border-purple-500/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg styles.colors.text.primary">
                      {dept.icon && <span>{dept.icon}</span>}
                      {dept.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 styles.colors.text.tertiary">
                      {dept.description || dept.departmentContext?.substring(0, 80) + '...'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10">
                    {dept.type}
                  </Badge>
                  <Badge variant="secondary" className="styles.colors.bg.tertiary styles.colors.text.secondary">
                    {dept.agentRole}
                  </Badge>
                  {dept.isPredefined && (
                    <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/40">Plantilla</Badge>
                  )}
                </div>

                {/* Layer 4: Personalidad */}
                <div className="space-y-1 pt-2 border-t styles.colors.border.default">
                  <div className="flex items-center justify-between">
                    <span className="text-xs styles.colors.text.tertiary">Temperatura</span>
                    <span className="text-xs font-medium text-purple-300">{dept.temperature || '0.7'}</span>
                  </div>
                  <progress
                    className={cn("h-1.5 w-full rounded-full overflow-hidden", styles.colors.bg.tertiary, "accent-purple-500")}
                    value={parseFloat(dept.temperature || '0.7') * 100}
                    max={100}
                  />
                  <p className="text-[10px] styles.colors.text.tertiary">
                    {getTemperatureLabel(dept.temperature || '0.7')}
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 styles.colors.border.default styles.colors.text.primary hover:styles.colors.bg.tertiary"
                    onClick={() => handleEdit(dept)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/40 text-red-300 hover:bg-red-500/20"
                    onClick={() => setDepartmentToDelete({ id: dept.id, name: dept.name })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </>
      ) : (
        <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-purple-500/10 p-3">
              <Building2 className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="mb-1 text-lg font-semibold styles.colors.text.primary">Sin departamentos</h3>
            <p className="mb-4 text-center text-sm styles.colors.text.tertiary">
              Crea tu primer departamento o usa las plantillas predefinidas
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  resetForm()
                  setIsCreateDialogOpen(true)
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Nuevo
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsTemplatesDialogOpen(true)}
                className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary hover:styles.colors.bg.tertiary"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Ver Plantillas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de creación/edición */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto styles.colors.border.default styles.colors.bg.secondary styles.colors.text.primary p-6">
          <DialogHeader>
            <DialogTitle>{editingDepartment ? 'Editar Departamento' : 'Nuevo Departamento'}</DialogTitle>
            <DialogDescription className="styles.colors.text.tertiary">
              {editingDepartment ? 'Modifica los detalles del departamento' : 'Crea un departamento personalizado para tu empresa'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="font-semibold styles.colors.text.primary">Información Básica</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="styles.colors.text.secondary">Nombre *</Label>
                  <Input
                    placeholder="Ej: Finanzas"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="styles.colors.bg.input styles.colors.border.default styles.colors.text.primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="styles.colors.text.secondary">Ícono (Emoji)</Label>
                  <Input
                    placeholder="Ej: 💰"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    maxLength={2}
                    className="styles.colors.bg.input styles.colors.border.default styles.colors.text.primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="styles.colors.text.secondary">Tipo de Departamento</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="styles.colors.bg.input styles.colors.border.default styles.colors.text.primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENT_TYPES.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>
                        {dt.icon} {dt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="styles.colors.text.secondary">Descripción</Label>
                <Textarea
                  placeholder="Breve descripción del departamento..."
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="styles.colors.bg.input styles.colors.border.default styles.colors.text.primary"
                />
              </div>
            </div>

            {/* Plantillas predefinidas */}
            {!editingDepartment && predefinedDepartments && predefinedDepartments.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold styles.colors.text.primary">Cargar Plantilla Predefinida</h3>
                <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
                  {predefinedDepartments.slice(0, 6).map((template) => (
                    <Button
                      key={template.type}
                      type="button"
                      variant="outline"
                      onClick={() => handleLoadTemplate(template.type)}
                      className="styles.colors.border.default styles.colors.text.primary hover:styles.colors.bg.tertiary"
                    >
                      {template.icon} {template.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Contexto Departamental */}
            <div className="space-y-2">
              <h3 className="font-semibold styles.colors.text.primary">Contexto Departamental *</h3>
              <Textarea
                placeholder="Ej: KPIs: Revenue, Cash Flow, EBITDA&#10;Procesos: Presupuestación, forecasting&#10;Informes: P&L mensuales, balance sheets"
                rows={5}
                value={formData.departmentContext}
                onChange={(e) => setFormData({ ...formData, departmentContext: e.target.value })}
                className="styles.colors.bg.input styles.colors.border.default styles.colors.text.primary font-mono text-sm"
              />
              <p className="text-xs styles.colors.text.tertiary">
                Este contexto se inyecta para aportar datos específicos del área
              </p>
            </div>

            {/* Prompts del Agente */}
            <div className="space-y-4">
              <h3 className="font-semibold styles.colors.text.primary">Prompts del Agente</h3>
              <div className="space-y-2">
                <Label className="styles.colors.text.secondary">Prompt Base (Plantilla) *</Label>
                <Textarea
                  placeholder="Eres el [Cargo] de la empresa. Tu rol es:&#10;- Analizar...&#10;- Evaluar...&#10;- Identificar..."
                  rows={6}
                  value={formData.basePrompt}
                  onChange={(e) => setFormData({ ...formData, basePrompt: e.target.value })}
                  className="styles.colors.bg.input styles.colors.border.default styles.colors.text.primary font-mono text-sm"
                />
                <p className="text-xs styles.colors.text.tertiary">
                  Plantilla del sistema para el rol del agente
                </p>
              </div>

              <div className="space-y-2">
                <Label className="styles.colors.text.secondary">Prompt Personalizado (Opcional)</Label>
                <Textarea
                  placeholder="Personaliza el tono, enfoque o prioridades específicas..."
                  rows={4}
                  value={formData.customPrompt}
                  onChange={(e) => setFormData({ ...formData, customPrompt: e.target.value })}
                  className="styles.colors.bg.input styles.colors.border.default styles.colors.text.primary font-mono text-sm"
                />
                <p className="text-xs styles.colors.text.tertiary">
                  Personalización adicional del tono y estilo
                </p>
              </div>
            </div>

            {/* Configuración del Agente */}
            <div className="space-y-4">
              <h3 className="font-semibold styles.colors.text.primary">Configuración del Agente</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="styles.colors.text.secondary">Rol del Agente</Label>
                  <Select value={formData.agentRole} onValueChange={(value) => setFormData({ ...formData, agentRole: value })}>
                    <SelectTrigger className="styles.colors.bg.input styles.colors.border.default styles.colors.text.primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="styles.colors.text.secondary">Temperature</Label>
                    <span className="text-sm font-semibold text-purple-400">{(parseFloat(formData.temperature) || 0.7).toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[parseFloat(formData.temperature) || 0.7]}
                    onValueChange={(value) => {
                      const nextValue = value[0] ?? 0.7
                      setFormData({ ...formData, temperature: nextValue.toString() })
                    }}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs styles.colors.text.tertiary">
                    0.0 = Preciso, 1.0 = Balanceado, 2.0 = Creativo
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t styles.colors.border.default pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                resetForm()
              }}
              className="styles.colors.border.default styles.colors.text.primary hover:styles.colors.bg.tertiary"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateOrUpdate}
              disabled={createDepartment.isPending || updateDepartment.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {(createDepartment.isPending || updateDepartment.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              {editingDepartment ? 'Guardar Cambios' : 'Crear Departamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de plantillas */}
      <Dialog open={isTemplatesDialogOpen} onOpenChange={setIsTemplatesDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto styles.colors.border.default styles.colors.bg.secondary styles.colors.text.primary p-6">
          <DialogHeader>
            <DialogTitle>Plantillas de Departamentos</DialogTitle>
            <DialogDescription className="styles.colors.text.tertiary">
              Usa plantillas predefinidas para configurar rápidamente departamentos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Botón para usar todas las plantillas */}
            {predefinedDepartments && predefinedDepartments.length > 0 && (
              <div className="mb-6 pb-6 border-b styles.colors.border.default">
                <p className="text-sm styles.colors.text.secondary mb-3">
                  O crea todos los departamentos predefinidos de una vez:
                </p>
                <Button
                  onClick={() => seedPredefined.mutate({ companyId: company?.id || '' })}
                  disabled={seedPredefined.isPending || !company}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {seedPredefined.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Copy className="mr-2 h-4 w-4" />
                  Usar Todas las Plantillas ({predefinedDepartments.length})
                </Button>
              </div>
            )}

            {/* Grid de plantillas */}
            {predefinedDepartments && predefinedDepartments.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {predefinedDepartments.map((template) => {
                  const templateId = 'id' in template ? String(template.id) : template.type
                  return (
                  <Card
                    key={templateId}
                    className="styles.colors.bg.tertiary styles.colors.border.default hover:border-purple-500/30 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedTemplate({ id: templateId, name: template.name, type: template.type })
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-1">
                          <CardTitle className="flex items-center gap-2 text-lg styles.colors.text.primary">
                            {template.icon && <span className="text-2xl">{template.icon}</span>}
                            {template.name}
                          </CardTitle>
                          <CardDescription className="line-clamp-2 styles.colors.text.tertiary">
                            {template.description || template.departmentContext?.substring(0, 80)}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10">
                          {template.type}
                        </Badge>
                        <Badge variant="secondary" className="styles.colors.bg.tertiary styles.colors.text.secondary">
                          {template.agentRole}
                        </Badge>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTemplate({ id: templateId, name: template.name, type: template.type })
                        }}
                        size="sm"
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Usar Plantilla
                      </Button>
                    </CardContent>
                  </Card>
                )})}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="styles.colors.text.tertiary">No hay plantillas disponibles</p>
              </div>
            )}
          </div>

          <DialogFooter className="border-t styles.colors.border.default pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsTemplatesDialogOpen(false)
                setSelectedTemplate(null)
              }}
              className="styles.colors.border.default styles.colors.text.primary hover:styles.colors.bg.tertiary"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para usar plantilla */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => selectedTemplate && setSelectedTemplate(null)}>
        <DialogContent className="styles.colors.border.default styles.colors.bg.secondary styles.colors.text.primary p-6">
          <DialogHeader>
            <DialogTitle>¿Usar plantilla "{selectedTemplate?.name}"?</DialogTitle>
            <DialogDescription className="styles.colors.text.tertiary">
              Se creará un nuevo departamento basado en esta plantilla predefinida que podrás personalizar después.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedTemplate(null)}
              className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary hover:styles.colors.bg.tertiary"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedTemplate && company) {
                  createFromTemplate.mutate({
                    companyId: company.id,
                    templateType: selectedTemplate.type as any,
                  })
                }
              }}
              disabled={createFromTemplate.isPending || !company}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createFromTemplate.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Plus className="mr-2 h-4 w-4" />
              Crear Departamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={!!departmentToDelete} onOpenChange={() => setDepartmentToDelete(null)}>
        <DialogContent className="styles.colors.border.default styles.colors.bg.secondary styles.colors.text.primary p-6">
          <DialogHeader>
            <DialogTitle>¿Eliminar departamento?</DialogTitle>
            <DialogDescription className="styles.colors.text.tertiary">
              Esta acción no se puede deshacer. Se eliminará "{departmentToDelete?.name}" permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDepartmentToDelete(null)}
              className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary hover:styles.colors.bg.tertiary"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => departmentToDelete && deleteDepartment.mutate({ id: departmentToDelete.id })}
              disabled={deleteDepartment.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteDepartment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
