'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Building2, Plus, Edit2, Trash2, Check, Sparkles } from 'lucide-react'
import { api } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function CompanySetupPage() {
  const router = useRouter()
  const [isEditingCompany, setIsEditingCompany] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [companyContext, setCompanyContext] = useState('')

  // Queries
  const { data: company, isLoading: loadingCompany, refetch: refetchCompany } = api.companies.get.useQuery()
  const { data: departments, isLoading: loadingDepartments, refetch: refetchDepartments } = api.departments.list.useQuery(
    { companyId: company?.id ?? '' },
    { enabled: !!company?.id }
  )
  const { data: predefinedDepartments } = api.departments.listPredefined.useQuery()

  // Mutations
  const createCompanyMutation = api.companies.create.useMutation({
    onSuccess: (data) => {
      toast.success('Empresa creada')
      setIsEditingCompany(false)
      void refetchCompany()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const updateCompanyMutation = api.companies.update.useMutation({
    onSuccess: () => {
      toast.success('Empresa actualizada')
      setIsEditingCompany(false)
      void refetchCompany()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const seedDepartmentsMutation = api.departments.seedPredefined.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.length} departamentos creados`)
      void refetchDepartments()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const deleteDepartmentMutation = api.departments.delete.useMutation({
    onSuccess: () => {
      toast.success('Departamento eliminado')
      void refetchDepartments()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Handlers
  const handleSaveCompany = () => {
    if (!companyName || !companyContext) {
      toast.error('Completa todos los campos')
      return
    }

    if (company) {
      updateCompanyMutation.mutate({
        id: company.id,
        name: companyName,
        context: companyContext,
      })
    } else {
      createCompanyMutation.mutate({
        name: companyName,
        context: companyContext,
      })
    }
  }

  const handleSeedDepartments = () => {
    if (!company) {
      toast.error('Primero configura tu empresa')
      return
    }

    seedDepartmentsMutation.mutate({ companyId: company.id })
  }

  const handleDeleteDepartment = (id: string) => {
    if (confirm('¿Eliminar este departamento?')) {
      deleteDepartmentMutation.mutate({ id })
    }
  }

  // Auto-load company data when editing
  if (company && !isEditingCompany && !companyName) {
    setCompanyName(company.name)
    setCompanyContext(company.context)
  }

  if (loadingCompany) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-8 py-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Inteligencia Corporativa</h1>
        <p className="text-muted-foreground">
          Configura tu empresa y departamentos para debates contextualizados
        </p>
      </div>

      {/* Company Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Configuración de Empresa
              </CardTitle>
              <CardDescription>
                Capa 2: Contexto Maestro (misión, visión, valores)
              </CardDescription>
            </div>
            {company && !isEditingCompany && (
              <Button variant="outline" size="sm" onClick={() => setIsEditingCompany(true)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {company && !isEditingCompany ? (
            // Display mode
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Nombre</Label>
                <p className="text-lg font-medium">{company.name}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Contexto Maestro</Label>
                <p className="whitespace-pre-wrap text-sm">{company.context}</p>
              </div>
            </div>
          ) : (
            // Edit mode
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nombre de la Empresa</Label>
                <Input
                  id="company-name"
                  placeholder="Ej: Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-context">Contexto Maestro</Label>
                <Textarea
                  id="company-context"
                  placeholder="Misión, visión, valores, cultura de la empresa..."
                  rows={6}
                  value={companyContext}
                  onChange={(e) => setCompanyContext(e.target.value)}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Este contexto se inyectará en todos los debates para alinear las decisiones con la identidad de tu empresa
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveCompany}
                  disabled={createCompanyMutation.isPending || updateCompanyMutation.isPending}
                >
                  {(createCompanyMutation.isPending || updateCompanyMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Check className="mr-2 h-4 w-4" />
                  Guardar
                </Button>
                {company && (
                  <Button variant="outline" onClick={() => setIsEditingCompany(false)}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Departments Section */}
      {company && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Departamentos</h2>
              <p className="text-sm text-muted-foreground">
                Capa 3: Contextos Específicos + Capa 4: Prompts Personalizados
              </p>
            </div>
            <div className="flex gap-2">
              {(!departments || departments.length === 0) && predefinedDepartments && (
                <Button
                  variant="outline"
                  onClick={handleSeedDepartments}
                  disabled={seedDepartmentsMutation.isPending}
                >
                  {seedDepartmentsMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Crear {predefinedDepartments.length} Predefinidos
                </Button>
              )}
              <Button onClick={() => router.push('/company/departments/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Departamento
              </Button>
            </div>
          </div>

          {loadingDepartments ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : departments && departments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {departments.map((dept) => (
                <Card key={dept.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {dept.icon && <span>{dept.icon}</span>}
                          {dept.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {dept.description || dept.departmentContext.substring(0, 100) + '...'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{dept.type}</Badge>
                      <Badge variant="secondary">{dept.agentRole}</Badge>
                      {dept.isPredefined && <Badge>Predefinido</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/company/departments/${dept.id}`)}
                      >
                        <Edit2 className="mr-2 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDepartment(dept.id)}
                        disabled={deleteDepartmentMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 rounded-full bg-muted p-3">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-lg font-semibold">Sin departamentos</h3>
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  Crea departamentos para contextualizar tus debates
                </p>
                {predefinedDepartments && predefinedDepartments.length > 0 && (
                  <Button onClick={handleSeedDepartments} disabled={seedDepartmentsMutation.isPending}>
                    {seedDepartmentsMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Crear {predefinedDepartments.length} Predefinidos
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Info Cards */}
      {company && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Capa 1: Técnica</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Rol base del agente (Analista, Crítico, Sintetizador)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Capa 2: Maestra</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Contexto de empresa (misión, visión, valores)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Capas 3 & 4</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Contexto departamental + Prompt personalizado
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
