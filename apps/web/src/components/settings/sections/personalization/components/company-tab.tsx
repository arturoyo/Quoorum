'use client'

/**
 * CompanyTab Component
 *
 * Company configuration form with auto-save functionality.
 * Simplified version with only: Name, Industry, Size, Description, Master Context
 */

import { useState, useEffect } from 'react'
import { Loader2, Building2, Save } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function CompanyTab() {
  const [isEditing, setIsEditing] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [companyContext, setCompanyContext] = useState('')
  const [companyIndustry, setCompanyIndustry] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')

  // Queries
  const { data: company, isLoading: loadingCompany, refetch: refetchCompany } = api.companies.get.useQuery()

  // Mutations
  const createCompanyMutation = api.companies.create.useMutation({
    onSuccess: () => {
      toast.success('Empresa creada')
      setIsEditing(false)
      void refetchCompany()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const updateCompanyMutation = api.companies.update.useMutation({
    onSuccess: () => {
      toast.success('Empresa actualizada')
      setIsEditing(false)
      void refetchCompany()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Auto-load company data when component mounts or company changes
  useEffect(() => {
    if (company) {
      setCompanyName(company.name)
      setCompanyContext(company.context)
      setCompanyIndustry(company.industry || '')
      setCompanySize(company.size || '')
      setCompanyDescription(company.description || '')
      // If company exists, start in edit mode
      setIsEditing(true)
    } else {
      // If no company, start in edit mode to create one
      setIsEditing(true)
    }
  }, [company])

  const handleSave = () => {
    if (!companyName || !companyContext) {
      toast.error('Nombre y contexto son requeridos')
      return
    }

    if (companyContext.length < 10) {
      toast.error('El contexto maestro debe tener al menos 10 caracteres')
      return
    }

    const payload = {
      name: companyName,
      context: companyContext,
      industry: companyIndustry || undefined,
      size: companySize || undefined,
      description: companyDescription || undefined,
    }

    if (company) {
      updateCompanyMutation.mutate({
        id: company.id,
        ...payload,
      })
    } else {
      createCompanyMutation.mutate(payload)
    }
  }

  if (loadingCompany) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <Card className="relative overflow-hidden bg-[var(--theme-bg-secondary)] backdrop-blur-xl border-[var(--theme-border)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--theme-text-primary)]">
          <Building2 className="h-5 w-5" />
          Empresa
        </CardTitle>
        <CardDescription className="text-[var(--theme-text-secondary)]">
          Configura tu empresa para debates con contexto corporativo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          // Edit mode
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-name" className="text-[var(--theme-text-primary)]">
                  Nombre de la Empresa *
                </Label>
                <Input
                  id="company-name"
                  placeholder="Ej: Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500 focus-visible:border-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-industry" className="text-[var(--theme-text-primary)]">
                  Industria
                </Label>
                <Input
                  id="company-industry"
                  placeholder="Ej: SaaS B2B, E-commerce, Fintech"
                  value={companyIndustry}
                  onChange={(e) => setCompanyIndustry(e.target.value)}
                  className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500 focus-visible:border-purple-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-size" className="text-[var(--theme-text-primary)]">
                Tamaño
              </Label>
              <Input
                id="company-size"
                placeholder="Ej: 1-10, 11-50, 51-200, 200+"
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500 focus-visible:border-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-description" className="text-[var(--theme-text-primary)]">
                Descripción
              </Label>
              <Textarea
                id="company-description"
                placeholder="Breve descripción de tu empresa..."
                rows={2}
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500 focus-visible:border-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-context" className="text-[var(--theme-text-primary)]">
                Contexto Maestro *
              </Label>
              <Textarea
                id="company-context"
                placeholder="Misión, visión, valores, cultura de la empresa..."
                rows={6}
                value={companyContext}
                onChange={(e) => setCompanyContext(e.target.value)}
                className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500 focus-visible:border-purple-500"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--theme-text-tertiary)]">
                  Este contexto se inyectará en todos los debates para alinear las decisiones con la identidad de tu empresa
                </p>
                <p className={cn(
                  'text-xs',
                  companyContext.length < 10
                    ? 'text-red-400'
                    : 'text-[var(--theme-text-tertiary)]'
                )}>
                  {companyContext.length} / 10 caracteres mínimos
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={createCompanyMutation.isPending || updateCompanyMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {createCompanyMutation.isPending || updateCompanyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Display mode (shouldn't happen with current logic, but kept for safety)
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm text-[var(--theme-text-tertiary)]">Nombre</Label>
                <p className="text-lg font-medium text-[var(--theme-text-primary)]">{company?.name}</p>
              </div>
              {company?.industry && (
                <div>
                  <Label className="text-sm text-[var(--theme-text-tertiary)]">Industria</Label>
                  <p className="text-lg font-medium text-[var(--theme-text-primary)]">{company.industry}</p>
                </div>
              )}
            </div>
            {company?.size && (
              <div>
                <Label className="text-sm text-[var(--theme-text-tertiary)]">Tamaño</Label>
                <p className="text-[var(--theme-text-primary)]">{company.size}</p>
              </div>
            )}
            {company?.description && (
              <div>
                <Label className="text-sm text-[var(--theme-text-tertiary)]">Descripción</Label>
                <p className="text-sm text-[var(--theme-text-secondary)]">{company.description}</p>
              </div>
            )}
            <div>
              <Label className="text-sm text-[var(--theme-text-tertiary)]">Contexto Maestro (Misión, Visión, Valores)</Label>
              <p className="whitespace-pre-wrap text-sm text-[var(--theme-text-secondary)]">{company?.context}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
