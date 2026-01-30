'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Building2, BookOpen } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface DepartmentsSectionProps {
  isInModal?: boolean
}

export function DepartmentsSection({ isInModal = false }: DepartmentsSectionProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    departmentContext: '',
    basePrompt: '',
    customPrompt: '',
    agentRole: 'analyst',
    temperature: '0.7',
    icon: '📊',
  })

  // Queries
  const { data: company } = api.companies.get.useQuery()

  // Mutations
  const createDepartment = api.departments.create.useMutation({
    onSuccess: () => {
      toast.success('Departamento creado exitosamente')
      setFormData({
        name: '',
        description: '',
        departmentContext: '',
        basePrompt: '',
        customPrompt: '',
        agentRole: 'analyst',
        temperature: '0.7',
        icon: '📊',
      })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = () => {
    if (!company) {
      toast.error('Primero configura tu empresa en la sección Empresa')
      return
    }

    if (!formData.name || !formData.departmentContext) {
      toast.error('El nombre y contexto son obligatorios')
      return
    }

    if (!company?.id) {
      toast.error('Primero configura tu empresa')
      return
    }

    createDepartment.mutate({
      companyId: company.id,
      name: formData.name,
      description: formData.description || undefined,
      departmentContext: formData.departmentContext,
      basePrompt: formData.basePrompt || undefined,
      customPrompt: formData.customPrompt || undefined,
      agentRole: formData.agentRole as 'critic' | 'analyst' | 'synthesizer',
      temperature: formData.temperature,
      icon: formData.icon || undefined,
      type: 'custom',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {!isInModal && (
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight styles.colors.text.primary">Crear Departamento</h1>
          <p className="styles.colors.text.tertiary">
            Crea un departamento personalizado con contexto específico
          </p>
        </div>
      )}

      {/* Info sobre empresa */}
      {company && (
        <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 styles.colors.text.primary">
                  <Building2 className="h-5 w-5" />
                  {company.name}
                </CardTitle>
                <CardDescription className="styles.colors.text.tertiary">
                  Creando departamento para esta empresa
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/settings/departments/library')}
                className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary hover:styles.colors.bg.tertiary"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Ver Plantillas
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Formulario de creación */}
      <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="styles.colors.text.primary">Información Básica</CardTitle>
          <CardDescription className="styles.colors.text.tertiary">
            Define el nombre y contexto del departamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="styles.colors.text.primary">Nombre del Departamento *</Label>
              <Input
                id="name"
                placeholder="Ej: Ventas, Marketing, Producto"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon" className="styles.colors.text.primary">Icono</Label>
              <Input
                id="icon"
                placeholder="📊"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="styles.colors.text.primary">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Breve descripción del departamento..."
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="resize-none styles.colors.border.default styles.colors.bg.input styles.colors.text.primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="departmentContext" className="styles.colors.text.primary">Contexto del Departamento *</Label>
            <Textarea
              id="departmentContext"
              placeholder="Describe el propósito, responsabilidades y enfoque de este departamento..."
              rows={4}
              value={formData.departmentContext}
              onChange={(e) => setFormData(prev => ({ ...prev, departmentContext: e.target.value }))}
              className="resize-none styles.colors.border.default styles.colors.bg.input styles.colors.text.primary"
            />
            <p className="text-xs styles.colors.text.tertiary">
              Este contexto se inyectará en debates relacionados con este departamento
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configuración avanzada */}
      <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="styles.colors.text.primary">Configuración del Agente IA</CardTitle>
          <CardDescription className="styles.colors.text.tertiary">
            Personaliza el comportamiento del agente para este departamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agentRole" className="styles.colors.text.primary">Rol del Agente</Label>
              <Select value={formData.agentRole} onValueChange={(value) => setFormData(prev => ({ ...prev, agentRole: value }))}>
                <SelectTrigger className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analyst">Analista (datos y hechos)</SelectItem>
                  <SelectItem value="critic">Crítico (identifica riesgos)</SelectItem>
                  <SelectItem value="synthesizer">Sintetizador (conclusiones)</SelectItem>
                  <SelectItem value="optimizer">Optimizador (mejora procesos)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature" className="styles.colors.text.primary">Temperatura ({formData.temperature})</Label>
              <Input
                id="temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                className="styles.colors.border.default styles.colors.bg.input"
              />
              <p className="text-xs styles.colors.text.tertiary">
                0.0 = Preciso y conservador | 1.0 = Creativo y exploratorio
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="basePrompt" className="styles.colors.text.primary">Base Prompt (Template)</Label>
            <Textarea
              id="basePrompt"
              placeholder="Prompt base del sistema para este departamento..."
              rows={3}
              value={formData.basePrompt}
              onChange={(e) => setFormData(prev => ({ ...prev, basePrompt: e.target.value }))}
              className="resize-none styles.colors.border.default styles.colors.bg.input styles.colors.text.primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customPrompt" className="styles.colors.text.primary">Custom Prompt (Personalización)</Label>
            <Textarea
              id="customPrompt"
              placeholder="Personalización adicional del prompt..."
              rows={3}
              value={formData.customPrompt}
              onChange={(e) => setFormData(prev => ({ ...prev, customPrompt: e.target.value }))}
              className="resize-none styles.colors.border.default styles.colors.bg.input styles.colors.text.primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Botón de crear */}
      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={createDepartment.isPending || !company}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {createDepartment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Plus className="mr-2 h-4 w-4" />
          Crear Departamento
        </Button>
        {!company && (
          <Button
            variant="outline"
            onClick={() => router.push('/settings/company')}
            className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary hover:styles.colors.bg.tertiary"
          >
            <Building2 className="mr-2 h-4 w-4" />
            Configurar Empresa Primero
          </Button>
        )}
      </div>
    </div>
  )
}
