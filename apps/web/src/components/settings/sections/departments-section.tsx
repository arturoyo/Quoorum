'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Edit2, Trash2, Sparkles, Building2, Network } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface DepartmentsSectionProps {
  isInModal?: boolean
}

export function DepartmentsSection({ isInModal = false }: DepartmentsSectionProps) {
  const router = useRouter()

  // Queries
  const { data: company } = api.companies.get.useQuery()
  const { data: departments, isLoading: loadingDepartments, refetch: refetchDepartments } = api.departments.list.useQuery(
    { companyId: company?.id ?? '' },
    { enabled: !!company?.id }
  )
  const { data: predefinedDepartments } = api.departments.listPredefined.useQuery()

  // Mutations
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
  const handleSeedDepartments = () => {
    if (!company) {
      toast.error('Primero configura tu empresa en la sección Empresa')
      return
    }

    seedDepartmentsMutation.mutate({ companyId: company.id })
  }

  const handleDeleteDepartment = (id: string) => {
    if (confirm('¿Eliminar este departamento?')) {
      deleteDepartmentMutation.mutate({ id })
    }
  }

  // Si no hay empresa, mostrar mensaje
  if (!company) {
    return (
      <div className="space-y-6">
        {!isInModal && (
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">Departamentos</h1>
            <p className="text-gray-400">
              Organiza y configura los departamentos de tu empresa
            </p>
          </div>
        )}

        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-purple-500/10 p-3">
              <Building2 className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-white">Configura tu empresa primero</h3>
            <p className="mb-4 text-center text-sm text-gray-400">
              Necesitas configurar tu empresa antes de crear departamentos
            </p>
            <Button
              onClick={() => router.push('/settings/company')}
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
    <div className="space-y-6">
      {/* Header */}
      {!isInModal && (
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">Departamentos</h1>
          <p className="text-gray-400">
            Capa 3: Contextos Específicos + Capa 4: Prompts Personalizados
          </p>
        </div>
      )}

      {/* Info sobre la empresa actual */}
      <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Building2 className="h-5 w-5" />
                {company.name}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {company.industry || 'Empresa'} · Departamentos configurados
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/settings/company')}
              className="border-white/10 bg-slate-800/50 text-white hover:bg-slate-800"
            >
              Ver empresa
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Tus Departamentos ({departments?.length || 0})
          </h2>
          <p className="text-sm text-gray-400">
            Configura contextos específicos por departamento
          </p>
        </div>
        <div className="flex gap-2">
          {(!departments || departments.length === 0) && predefinedDepartments && (
            <Button
              variant="outline"
              onClick={handleSeedDepartments}
              disabled={seedDepartmentsMutation.isPending}
              className="border-white/10 bg-slate-800/50 text-white hover:bg-slate-800"
            >
              {seedDepartmentsMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Crear {predefinedDepartments.length} Predefinidos
            </Button>
          )}
          <Button
            onClick={() => router.push('/settings/company/departments/new')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear Departamento
          </Button>
        </div>
      </div>

      {/* Departments Grid */}
      {loadingDepartments ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : departments && departments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id} className="relative border-white/10 bg-slate-900/60 backdrop-blur-xl hover:border-purple-500/30 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg text-white">
                        {dept.icon && <span>{dept.icon}</span>}
                        {dept.name}
                      </CardTitle>
                      {/* Estado activo/inactivo */}
                      <div className={`h-2 w-2 rounded-full ${dept.isActive ? 'bg-green-500' : 'bg-gray-500'}`} title={dept.isActive ? 'Activo' : 'Inactivo'} />
                    </div>
                    <CardDescription className="line-clamp-2 text-gray-400">
                      {dept.description || dept.departmentContext.substring(0, 100) + '...'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Badges principales */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10">{dept.type}</Badge>
                  <Badge variant="secondary" className="bg-slate-800/50 text-gray-300">{dept.agentRole}</Badge>
                  {dept.isPredefined && <Badge className="bg-purple-600 text-white">Predefinido</Badge>}
                </div>

                {/* Temperatura */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Temperatura</span>
                    <span className="text-xs font-medium text-purple-300">{dept.temperature || '0.7'}</span>
                  </div>
                  <div className="h-1 bg-slate-800/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                      style={{ width: `${((parseFloat(dept.temperature || '0.7')) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Prompts (solo si existen) */}
                {(dept.basePrompt || dept.customPrompt) && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    {dept.basePrompt && (
                      <div>
                        <span className="text-xs font-medium text-gray-400">Base Prompt</span>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {dept.basePrompt}
                        </p>
                      </div>
                    )}
                    {dept.customPrompt && (
                      <div>
                        <span className="text-xs font-medium text-purple-400">Custom Prompt</span>
                        <p className="text-xs text-purple-300/70 line-clamp-2 mt-1">
                          {dept.customPrompt}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-white/10 bg-slate-800/50 text-white hover:bg-slate-800"
                    onClick={() => router.push(`/settings/company/departments/${dept.id}`)}
                  >
                    <Edit2 className="mr-2 h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDepartment(dept.id)}
                    disabled={deleteDepartmentMutation.isPending}
                    className="border-red-500/40 text-red-300 hover:bg-red-500/20 hover:text-white hover:border-red-500/60"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-purple-500/10 p-3">
              <Network className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-white">Sin departamentos</h3>
            <p className="mb-4 text-center text-sm text-gray-400">
              Crea departamentos para contextualizar tus debates con información específica
            </p>
            {predefinedDepartments && predefinedDepartments.length > 0 && (
              <Button onClick={handleSeedDepartments} disabled={seedDepartmentsMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
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

      {/* Info Cards sobre las capas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white">Capa 1: Técnica</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400">
              Rol base del agente (Analista, Crítico, Sintetizador)
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white">Capa 2: Maestra</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400">
              Contexto de empresa (misión, visión, valores)
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white">Capas 3 & 4</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400">
              Contexto departamental + Prompt personalizado
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
