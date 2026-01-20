'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2, Building2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface DepartmentSelectorProps {
  selectedDepartmentIds: string[]
  onSelectionChange: (ids: string[]) => void
  defaultOpen?: boolean
}

export function DepartmentSelector({
  selectedDepartmentIds,
  onSelectionChange,
  defaultOpen = false,
}: DepartmentSelectorProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(defaultOpen)

  // Get company
  const { data: company, isLoading: loadingCompany } = api.companies.get.useQuery()

  // Get departments (only if company exists)
  const { data: departments, isLoading: loadingDepartments } = api.departments.list.useQuery(
    { companyId: company?.id ?? '' },
    { enabled: !!company?.id }
  )

  const handleToggleDepartment = (departmentId: string) => {
    if (selectedDepartmentIds.includes(departmentId)) {
      onSelectionChange(selectedDepartmentIds.filter((id) => id !== departmentId))
    } else {
      onSelectionChange([...selectedDepartmentIds, departmentId])
    }
  }

  const handleSelectAll = () => {
    if (departments) {
      onSelectionChange(departments.map((d) => d.id))
    }
  }

  const handleClearAll = () => {
    onSelectionChange([])
  }

  if (loadingCompany) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (!company) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Departamentos Corporativos (Opcional)
          </CardTitle>
          <CardDescription>
            Añade contexto empresarial y departamental a tu debate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">Configura tu empresa primero</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Crea departamentos corporativos para debates más contextualizados
            </p>
            <Button
              className="mt-4"
              onClick={() => router.push('/settings/company')}
            >
              Configurar Empresa
            </Button>
          </div>
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-blue-400">¿Qué son los Departamentos Corporativos?</p>
                <p className="text-blue-300/80">
                  Son agentes especializados que debaten desde la perspectiva de cada área de tu empresa
                  (Finanzas, Marketing, Operaciones, etc.), inyectando el contexto específico de tu organización.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loadingDepartments) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (!departments || departments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Departamentos Corporativos (Opcional)
          </CardTitle>
          <CardDescription>
            Añade contexto empresarial y departamental a tu debate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">Sin departamentos configurados</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Crea departamentos para debates más contextualizados
            </p>
            <Button
              className="mt-4"
              onClick={() => router.push('/settings/company')}
            >
              Gestionar Departamentos
            </Button>
          </div>
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-blue-400">Debates Contextualizados</p>
                <p className="text-blue-300/80">
                  Los departamentos corporativos inyectan 4 capas de contexto:
                  empresa → departamento → rol → personalidad
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Departamentos Corporativos
            </CardTitle>
            <CardDescription>
              Selecciona departamentos para inyectar contexto corporativo
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={selectedDepartmentIds.length === departments.length}
            >
              Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={selectedDepartmentIds.length === 0}
            >
              Ninguno
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected count */}
        <div className="flex items-center justify-between rounded-lg bg-muted p-3">
          <span className="text-sm font-medium">Departamentos seleccionados:</span>
          <Badge variant={selectedDepartmentIds.length > 0 ? 'default' : 'secondary'}>
            {selectedDepartmentIds.length} / {departments.length}
          </Badge>
        </div>

        {/* Department list */}
        <div className="grid gap-3 md:grid-cols-2">
          {departments.map((dept) => {
            const isSelected = selectedDepartmentIds.includes(dept.id)

            return (
              <div
                key={dept.id}
                className={cn(
                  'group relative flex items-start space-x-3 rounded-lg border p-4 transition-colors cursor-pointer hover:border-primary/50',
                  isSelected && 'border-primary bg-primary/5'
                )}
                onClick={() => handleToggleDepartment(dept.id)}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggleDepartment(dept.id)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {dept.icon && <span>{dept.icon}</span>}
                    <p className="font-medium leading-none">{dept.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {dept.description || dept.departmentContext.substring(0, 80) + '...'}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Badge variant="outline" className="text-xs">
                      {dept.type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {dept.agentRole}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Info card */}
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-blue-400">Inyección de Contexto (4 Capas)</p>
              <ul className="space-y-1 text-blue-300/80">
                <li>• <strong>Capa 1:</strong> Rol técnico del agente</li>
                <li>• <strong>Capa 2:</strong> Contexto de {company.name} (misión/visión/valores)</li>
                <li>• <strong>Capa 3:</strong> Contexto departamental (KPIs/procesos)</li>
                <li>• <strong>Capa 4:</strong> Prompt personalizado del departamento</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
