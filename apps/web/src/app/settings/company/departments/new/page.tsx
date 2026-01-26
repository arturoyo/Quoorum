'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { toast } from 'sonner'

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
  { value: 'custom', label: 'Personalizado', icon: '✨' },
] as const

const AGENT_ROLES = [
  { value: 'analyst', label: 'Analista' },
  { value: 'critic', label: 'Crítico' },
  { value: 'synthesizer', label: 'Sintetizador' },
] as const

export default function NewDepartmentPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState<string>('custom')
  const [departmentContext, setDepartmentContext] = useState('')
  const [basePrompt, setBasePrompt] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [agentRole, setAgentRole] = useState('analyst')
  const [temperature, setTemperature] = useState('0.7')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)

  // Get company
  const { data: company, isLoading: loadingCompany } = api.companies.get.useQuery()

  // Get existing departments for parent selection
  const { data: existingDepartments } = api.departments.list.useQuery(
    { companyId: company?.id ?? '00000000-0000-0000-0000-000000000000' },
    { enabled: !!company?.id }
  )

  // Get predefined departments for templates
  const { data: predefinedDepartments } = api.departments.listPredefined.useQuery()

  // Create mutation
  const createMutation = api.departments.create.useMutation({
    onSuccess: () => {
      toast.success('Departamento creado')
      router.push('/settings/company')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!company) {
      toast.error('Primero configura tu empresa')
      router.push('/settings/company')
      return
    }

    if (!name || !departmentContext || !basePrompt) {
      toast.error('Completa los campos obligatorios')
      return
    }

    createMutation.mutate({
      companyId: company.id,
      parentId: parentId || undefined,
      name,
      type: type as any,
      departmentContext,
      basePrompt,
      customPrompt: customPrompt || undefined,
      agentRole: agentRole as any,
      temperature,
      description: description || undefined,
      icon: icon || undefined,
    })
  }

  const handleLoadTemplate = (templateType: string) => {
    const template = predefinedDepartments?.find((d) => d.type === templateType)
    if (template) {
      setName(template.name)
      setType(template.type)
      setDepartmentContext(template.departmentContext)
      setBasePrompt(template.basePrompt)
      setAgentRole(template.agentRole)
      setDescription(template.description || '')
      setIcon(template.icon || '')
      toast.success('Plantilla cargada. Personaliza según necesites')
    }
  }

  if (loadingCompany) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!company) {
    router.push('/settings/company')
    return null
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-8">
      {/* Header */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/settings/company')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Departamento</h1>
        <p className="text-muted-foreground">
          Crea un departamento personalizado para tu empresa
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Identifica el departamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Finanzas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icono (Emoji)</Label>
                <Input
                  id="icon"
                  placeholder="Ej: 💰"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Departamento</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
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
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Breve descripción del departamento..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Departamento Padre (Opcional)</Label>
              <Select value={parentId || 'none'} onValueChange={(value) => setParentId(value === 'none' ? null : value)}>
                <SelectTrigger id="parent">
                  <SelectValue placeholder="Sin departamento padre (nivel raíz)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin departamento padre (nivel raíz)</SelectItem>
                  {existingDepartments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.icon && <span className="mr-2">{dept.icon}</span>}
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecciona un departamento padre si este depende de otro (ej: "Redes Sociales" depende de "Marketing")
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Load Template */}
        {predefinedDepartments && predefinedDepartments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cargar Plantilla Predefinida</CardTitle>
              <CardDescription>
                Comienza con una plantilla y personalízala según necesites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-3">
                {predefinedDepartments.slice(0, 9).map((template) => (
                  <Button
                    key={template.type}
                    type="button"
                    variant="outline"
                    onClick={() => handleLoadTemplate(template.type)}
                  >
                    {template.icon} {template.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Layer 3: Department Context */}
        <Card>
          <CardHeader>
            <CardTitle>Capa 3: Contexto Departamental *</CardTitle>
            <CardDescription>
              KPIs, procesos, informes específicos del departamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              id="department-context"
              placeholder="Ej: KPIs: Revenue, Cash Flow, EBITDA&#10;Procesos: Presupuestación, forecasting&#10;Informes: P&L mensuales, balance sheets"
              rows={6}
              value={departmentContext}
              onChange={(e) => setDepartmentContext(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Este contexto se inyecta para aportar datos específicos del área
            </p>
          </CardContent>
        </Card>

        {/* Layer 4: Prompt Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Capa 4: Prompts del Agente</CardTitle>
            <CardDescription>
              Define el rol y comportamiento del agente departamental
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="base-prompt">Prompt Base (Plantilla) *</Label>
              <Textarea
                id="base-prompt"
                placeholder="Eres el [Cargo] de la empresa. Tu rol es:&#10;- Analizar...&#10;- Evaluar...&#10;- Identificar..."
                rows={8}
                value={basePrompt}
                onChange={(e) => setBasePrompt(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Plantilla sugerida por el sistema para el rol del agente
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-prompt">Prompt Personalizado (Opcional)</Label>
              <Textarea
                id="custom-prompt"
                placeholder="Personaliza el tono, enfoque o prioridades específicas..."
                rows={4}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Personalización adicional del tono y estilo del agente
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Agent Config */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración del Agente</CardTitle>
            <CardDescription>
              Parámetros técnicos del modelo de IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="agent-role">Rol del Agente</Label>
                <Select value={agentRole} onValueChange={setAgentRole}>
                  <SelectTrigger id="agent-role">
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

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  0.0 = Preciso, 1.0 = Balanceado, 2.0 = Creativo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1"
          >
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="mr-2 h-4 w-4" />
            Crear Departamento
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/settings/company')}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
