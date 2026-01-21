'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, BookOpen, Copy, Plus, Building2 } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface DepartmentsLibrarySectionProps {
  isInModal?: boolean
}

export function DepartmentsLibrarySection({ isInModal = false }: DepartmentsLibrarySectionProps) {
  const router = useRouter()
  const [selectedDepartment, setSelectedDepartment] = useState<{
    id: string
    name: string
  } | null>(null)
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false)

  // Queries
  const { data: company } = api.companies.get.useQuery()
  const { data: predefinedDepartments, isLoading } = api.departments.listPredefined.useQuery()
  const { data: userDepartments, refetch: refetchUserDepartments } = api.departments.list.useQuery(
    { companyId: company?.id ?? '' },
    { enabled: !!company?.id }
  )

  // Mutation para clonar/usar plantilla
  const seedPredefined = api.departments.seedPredefined.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.length} departamentos creados exitosamente`)
      void refetchUserDepartments()
      setIsCloneDialogOpen(false)
      setSelectedDepartment(null)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleUseTemplate = (dept: { id: string; name: string }) => {
    if (!company) {
      toast.error('Primero configura tu empresa en la sección Empresa')
      return
    }

    setSelectedDepartment(dept)
    setIsCloneDialogOpen(true)
  }

  const handleConfirmClone = () => {
    if (!company) {
      toast.error('Primero configura tu empresa')
      return
    }

    seedPredefined.mutate({ companyId: company.id })
  }

  const handleUseAllTemplates = () => {
    if (!company) {
      toast.error('Primero configura tu empresa en la sección Empresa')
      router.push('/settings/company')
      return
    }

    seedPredefined.mutate({ companyId: company.id })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {!isInModal && (
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">Plantillas de Departamentos</h1>
          <p className="text-gray-400">
            Usa plantillas predefinidas para configurar rápidamente tu empresa
          </p>
        </div>
      )}

      {/* Info sobre empresa */}
      {company ? (
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Building2 className="h-5 w-5" />
                  {company.name}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {userDepartments?.length || 0} departamentos configurados
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/settings/departments')}
                  className="border-white/10 bg-slate-800/50 text-white hover:bg-slate-800"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Custom
                </Button>
                {predefinedDepartments && predefinedDepartments.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleUseAllTemplates}
                    disabled={seedPredefined.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {seedPredefined.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    Usar Todas las Plantillas ({predefinedDepartments.length})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-purple-500/10 p-3">
              <Building2 className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-white">Configura tu empresa primero</h3>
            <p className="mb-4 text-center text-sm text-gray-400">
              Necesitas configurar tu empresa antes de usar plantillas
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
      )}

      {/* Plantillas Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : predefinedDepartments && predefinedDepartments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {predefinedDepartments.map((dept) => (
            <Card key={dept.id} className="relative border-white/10 bg-slate-900/60 backdrop-blur-xl hover:border-purple-500/30 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg text-white">
                      {dept.icon && <span>{dept.icon}</span>}
                      {dept.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-gray-400">
                      {dept.departmentContext.substring(0, 100) + '...'}
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
                  <Badge variant="secondary" className="bg-slate-800/50 text-gray-300">
                    {dept.agentRole}
                  </Badge>
                  <Badge className="bg-purple-600 text-white">Plantilla</Badge>
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

                {/* Contexto preview */}
                {dept.departmentContext && (
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-xs font-medium text-gray-400">Contexto</span>
                    <p className="text-xs text-gray-500 line-clamp-3 mt-1">
                      {dept.departmentContext}
                    </p>
                  </div>
                )}

                {/* Botón usar plantilla */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-purple-500/40 text-purple-300 hover:bg-purple-500/20"
                  onClick={() => handleUseTemplate({ id: dept.id, name: dept.name })}
                  disabled={!company || seedPredefined.isPending}
                >
                  <Copy className="mr-2 h-3 w-3" />
                  Usar Esta Plantilla
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-purple-500/10 p-3">
              <BookOpen className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-white">No hay plantillas disponibles</h3>
            <p className="mb-4 text-center text-sm text-gray-400">
              Las plantillas predefinidas aparecerán aquí
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmación */}
      <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
        <DialogContent className="border-white/10 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle>Usar Plantillas de Departamentos</DialogTitle>
            <DialogDescription className="text-gray-400">
              Esto creará todos los departamentos predefinidos para {company?.name || 'tu empresa'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-300">
              Se crearán <strong>{predefinedDepartments?.length || 0} departamentos</strong> con configuración predefinida.
              Podrás editarlos después según tus necesidades.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCloneDialogOpen(false)}
              className="border-white/10 bg-slate-800/50 text-white hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmClone}
              disabled={seedPredefined.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {seedPredefined.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
