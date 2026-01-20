'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { api } from '@/lib/trpc'
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
import { Badge } from '@/components/ui/badge'

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

export default function EditDepartmentPage() {
  const router = useRouter()
  const params = useParams()
  const departmentId = params?.id as string

  const [name, setName] = useState('')
  const [type, setType] = useState<string>('custom')
  const [departmentContext, setDepartmentContext] = useState('')
  const [basePrompt, setBasePrompt] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [agentRole, setAgentRole] = useState('analyst')
  const [temperature, setTemperature] = useState('0.7')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')

  // Get department
  const { data: department, isLoading } = api.departments.getById.useQuery(
    { id: departmentId },
    { enabled: !!departmentId }
  )

  // Update mutation
  const updateMutation = api.departments.update.useMutation({
    onSuccess: () => {
      toast.success('Departamento actualizado')
      router.push('/company/setup')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Load department data
  useEffect(() => {
    if (department) {
      setName(department.name)
      setType(department.type)
      setDepartmentContext(department.departmentContext)
      setBasePrompt(department.basePrompt)
      setCustomPrompt(department.customPrompt || '')
      setAgentRole(department.agentRole || 'analyst')
      setTemperature(department.temperature || '0.7')
      setDescription(department.description || '')
      setIcon(department.icon || '')
    }
  }, [department])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !departmentContext || !basePrompt) {
      toast.error('Completa los campos obligatorios')
      return
    }

    updateMutation.mutate({
      id: departmentId,
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!department) {
    router.push('/company/setup')
    return null
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-8">
      {/* Header */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/company/setup')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Editar Departamento</h1>
          {department.isPredefined && <Badge>Predefinido</Badge>}
        </div>
        <p className="text-muted-foreground">
          Personaliza el departamento según las necesidades de tu empresa
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
          </CardContent>
        </Card>

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
            disabled={updateMutation.isPending}
            className="flex-1"
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="mr-2 h-4 w-4" />
            Guardar Cambios
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/company/setup')}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
