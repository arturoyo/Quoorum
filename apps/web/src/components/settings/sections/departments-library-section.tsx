'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOpenSettings } from '@/hooks/use-open-settings'
import { useSettingsContext } from '../settings-context'
import { Loader2, BookOpen, Copy, Plus, Building2 } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn, styles } from '@/lib/utils'

interface DepartmentsLibrarySectionProps {
  isInModal?: boolean
}

export function DepartmentsLibrarySection({ isInModal = false }: DepartmentsLibrarySectionProps) {
  const router = useRouter()
  const openSettings = useOpenSettings()
  const { setCurrentSection } = useSettingsContext()
  const [selectedDepartment, setSelectedDepartment] = useState<{
    id: string
    name: string
    type: string
  } | null>(null)
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false)

  // Queries
  const { data: company } = api.companies.get.useQuery()
  const { data: predefinedDepartments, isLoading } = api.departments.listPredefined.useQuery()
  const { data: userDepartments, refetch: refetchUserDepartments } = api.departments.list.useQuery(
    { companyId: company?.id ?? '00000000-0000-0000-0000-000000000000' },
    { enabled: !!company?.id }
  )

  // Mutation para clonar UNA plantilla
  const createFromTemplate = api.departments.createFromTemplate.useMutation({
    onSuccess: (data) => {
      toast.success(`Departamento "${data.name}" creado exitosamente`)
      void refetchUserDepartments()
      setIsCloneDialogOpen(false)
      setSelectedDepartment(null)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Mutation para clonar TODAS las plantillas
  const seedPredefined = api.departments.seedPredefined.useMutation({
    onSuccess: (data) => {
      const createdCount = data?.length ?? 0
      toast.success(`${createdCount} departamentos creados exitosamente`)
      void refetchUserDepartments()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleUseTemplate = (dept: { id: string; name: string; type: string }) => {
    if (!company) {
      toast.error('Primero configura tu empresa en la sección Empresa')
      return
    }

    setSelectedDepartment(dept)
    setIsCloneDialogOpen(true)
  }

  const handleConfirmClone = () => {
    if (!company || !selectedDepartment) {
      toast.error('Primero configura tu empresa')
      return
    }

    // Crear solo el departamento seleccionado
    createFromTemplate.mutate({
      companyId: company.id,
      templateType: selectedDepartment.type as 'finance' | 'marketing' | 'operations' | 'hr' | 'sales' | 'product' | 'engineering' | 'customer_success' | 'legal',
    })
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
    <div className={cn('space-y-6', isInModal ? 'pb-8' : 'pb-0')}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 styles.colors.text.primary">Plantillas</h1>
        <p className="styles.colors.text.secondary">
          Usa plantillas predefinidas para configurar rápidamente tu empresa
        </p>
      </div>

      {/* Info sobre empresa */}
      {company ? (
        <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
          <CardHeader>
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/settings/departments')}
                  className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary hover:styles.colors.bg.tertiary"
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
        <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-purple-500/10 p-3">
              <Building2 className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="mb-1 text-lg font-semibold styles.colors.text.primary">Configura tu empresa primero</h3>
            <p className="mb-4 text-center text-sm styles.colors.text.tertiary">
              Necesitas configurar tu empresa antes de usar plantillas
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
      )}

      {/* Plantillas Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : predefinedDepartments && predefinedDepartments.length > 0 ? (
        <div
          className={cn(
            'grid gap-4 md:grid-cols-2 lg:grid-cols-3',
            predefinedDepartments.length > 9
              ? 'max-h-[calc(100vh-300px)] overflow-y-auto pr-2'
              : '',
            isInModal ? 'pb-8' : ''
          )}
        >
          {predefinedDepartments.map((dept, index) => {
            const deptId = 'id' in dept ? String(dept.id) : String(dept.type)
            return (
            <Card key={deptId || `dept-${index}`} className="relative styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl hover:border-purple-500/30 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg styles.colors.text.primary">
                      {dept.icon && <span>{dept.icon}</span>}
                      {dept.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 styles.colors.text.tertiary">
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
                  <Badge variant="secondary" className="styles.colors.bg.tertiary styles.colors.text.secondary">
                    {dept.agentRole}
                  </Badge>
                  <Badge className="bg-purple-600 text-white">Plantilla</Badge>
                </div>

                {/* Capa 3: Contexto Departamental */}
                {dept.departmentContext && (
                  <div className="pt-2 border-t styles.colors.border.default">
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Capa 3: Contexto</span>
                    <p className="text-xs styles.colors.text.tertiary line-clamp-2 mt-1 styles.colors.bg.tertiary p-2 rounded">
                      {dept.departmentContext}
                    </p>
                  </div>
                )}

                {/* Capa 4: Personalidad IA */}
                <div className="space-y-2 pt-2 border-t styles.colors.border.default">
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Capa 4: Personalidad IA</span>

                  {/* Temperatura */}
                  <div className="space-y-1">
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
                      {parseFloat(dept.temperature || '0.7') <= 0.3 ? 'Muy conservador' :
                       parseFloat(dept.temperature || '0.7') <= 0.5 ? 'Conservador' :
                       parseFloat(dept.temperature || '0.7') <= 0.7 ? 'Balanceado' : 'Creativo'}
                    </p>
                  </div>

                  {/* Base Prompt */}
                  {dept.basePrompt && (
                    <div>
                      <span className="text-xs font-medium styles.colors.text.tertiary">Base Prompt</span>
                      <p className="text-xs styles.colors.text.secondary line-clamp-2 mt-1 styles.colors.bg.tertiary p-2 rounded">
                        {dept.basePrompt}
                      </p>
                    </div>
                  )}
                </div>

                {/* Botón usar plantilla */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-purple-500/40 text-purple-300 hover:bg-purple-500/20"
                  onClick={() => handleUseTemplate({ id: deptId, name: dept.name, type: dept.type })}
                  disabled={!company || createFromTemplate.isPending}
                >
                  <Copy className="mr-2 h-3 w-3" />
                  Usar Esta Plantilla
                </Button>
              </CardContent>
            </Card>
          )})}
        </div>
      ) : (
        <Card className="styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-purple-500/10 p-3">
              <BookOpen className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="mb-1 text-lg font-semibold styles.colors.text.primary">No hay plantillas disponibles</h3>
            <p className="mb-4 text-center text-sm styles.colors.text.tertiary">
              Las plantillas predefinidas aparecerán aquí
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmación */}
      <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
        <DialogContent className="styles.colors.border.default styles.colors.bg.secondary styles.colors.text.primary">
          <DialogHeader>
            <DialogTitle>Usar Plantilla: {selectedDepartment?.name}</DialogTitle>
            <DialogDescription className="styles.colors.text.tertiary">
              Esto creará el departamento "{selectedDepartment?.name}" para {company?.name || 'tu empresa'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm styles.colors.text.secondary">
              Se creará <strong>1 departamento</strong> con la configuración predefinida de {selectedDepartment?.name}.
              Podrás editarlo después según tus necesidades.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCloneDialogOpen(false)}
              className="styles.colors.border.default styles.colors.bg.input styles.colors.text.primary hover:styles.colors.bg.tertiary"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmClone}
              disabled={createFromTemplate.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createFromTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Departamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
