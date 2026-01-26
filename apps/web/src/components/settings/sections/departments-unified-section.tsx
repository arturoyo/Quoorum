'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOpenSettings } from '@/hooks/use-open-settings'
import { useSettingsContext } from '../settings-context'
import { Loader2, Plus, Building2, BookOpen, Trash2, Edit, Check } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface DepartmentsUnifiedSectionProps {
  isInModal?: boolean
}

export function DepartmentsUnifiedSection({ isInModal = false }: DepartmentsUnifiedSectionProps) {
  const router = useRouter()
  const openSettings = useOpenSettings()
  const { setCurrentSection } = useSettingsContext()
  const [departmentToDelete, setDepartmentToDelete] = useState<{ id: string; name: string } | null>(null)

  // Queries
  const { data: company, isLoading: loadingCompany } = api.companies.get.useQuery()
  const { data: userDepartments, isLoading: loadingDepartments, refetch: refetchDepartments } = api.departments.list.useQuery(
    { companyId: company?.id ?? '00000000-0000-0000-0000-000000000000' },
    { enabled: !!company?.id }
  )

  // Mutations
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
        <Card className="border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-purple-500/10 p-3">
              <Building2 className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-[var(--theme-text-primary)]">Configura tu empresa primero</h3>
            <p className="mb-4 text-center text-sm text-[var(--theme-text-tertiary)]">
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
        <h1 className="text-3xl font-bold mb-2 text-[var(--theme-text-primary)]">Mis Departamentos</h1>
        <p className="text-[var(--theme-text-secondary)]">
          Gestiona los departamentos de {company.name} para debates con contexto corporativo
        </p>
      </div>

      {/* Resumen de empresa */}
      <Card className="border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] backdrop-blur-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-[var(--theme-text-primary)]">
                <Building2 className="h-5 w-5" />
                {company.name}
              </CardTitle>
              <CardDescription className="text-[var(--theme-text-tertiary)]">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userDepartments.map((dept) => (
            <Card key={dept.id} className="relative border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] backdrop-blur-xl hover:border-purple-500/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg text-[var(--theme-text-primary)]">
                      {dept.icon && <span>{dept.icon}</span>}
                      {dept.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-[var(--theme-text-tertiary)]">
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
                  <Badge variant="secondary" className="bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-secondary)]">
                    {dept.agentRole}
                  </Badge>
                  {dept.isPredefined && (
                    <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/40">Plantilla</Badge>
                  )}
                </div>

                {/* Layer 4: Personalidad */}
                <div className="space-y-1 pt-2 border-t border-[var(--theme-border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--theme-text-tertiary)]">Temperatura</span>
                    <span className="text-xs font-medium text-purple-300">{dept.temperature || '0.7'}</span>
                  </div>
                  <div className="h-1.5 bg-[var(--theme-bg-tertiary)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                      style={{ width: `${(parseFloat(dept.temperature || '0.7') * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--theme-text-tertiary)]">
                    {getTemperatureLabel(dept.temperature || '0.7')}
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-tertiary)]"
                    onClick={() => router.push(`/settings/company/departments/${dept.id}`)}
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
      ) : (
        <Card className="border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-purple-500/10 p-3">
              <Building2 className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-[var(--theme-text-primary)]">Sin departamentos</h3>
            <p className="mb-4 text-center text-sm text-[var(--theme-text-tertiary)]">
              Crea tu primer departamento o usa las plantillas predefinidas
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push('/settings/company/departments/new')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Nuevo
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/settings/departments/library')}
                className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-tertiary)]"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Ver Plantillas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={!!departmentToDelete} onOpenChange={() => setDepartmentToDelete(null)}>
        <DialogContent className="border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] text-[var(--theme-text-primary)]">
          <DialogHeader>
            <DialogTitle>¿Eliminar departamento?</DialogTitle>
            <DialogDescription className="text-[var(--theme-text-tertiary)]">
              Esta acción no se puede deshacer. Se eliminará "{departmentToDelete?.name}" permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDepartmentToDelete(null)}
              className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-tertiary)]"
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
