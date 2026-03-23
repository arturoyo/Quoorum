'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Users, Briefcase, AlertCircle, Target } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface BuyerPersona {
  id: string
  name: string
  title?: string | null
  psychographics?: {
    jobsToBeDone?: string[]
    motivations?: string[]
    barriers?: string[]
  } | null
}

interface BuyerPersonaSelectorProps {
  personas: BuyerPersona[]
  selected: string[]
  onChange: (selected: string[]) => void
  isLoading?: boolean
}

export function BuyerPersonaSelector({
  personas,
  selected,
  onChange,
  isLoading = false,
}: BuyerPersonaSelectorProps) {
  const handleToggle = (personaId: string) => {
    if (selected.includes(personaId)) {
      onChange(selected.filter(id => id !== personaId))
    } else {
      if (selected.length < 10) {
        onChange([...selected, personaId])
      }
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            Buyer Personas
          </CardTitle>
          <CardDescription>Cargando perfiles...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-white/10">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (personas.length === 0) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-300">
            <AlertCircle className="h-5 w-5" />
            No hay Buyer Personas
          </CardTitle>
          <CardDescription>
            Crea al menos un Buyer Persona en Configuración para poder ejecutar simulaciones
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-400" />
          Buyer Personas
        </CardTitle>
        <CardDescription>
          Selecciona 1-10 perfiles para evaluar (máx. 10)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {personas.map(persona => {
          const isSelected = selected.includes(persona.id)
          const isDisabled = !isSelected && selected.length >= 10
          const psycho = persona.psychographics || {}

          return (
            <div
              key={persona.id}
              className={`
                flex items-start gap-3 p-3 rounded-lg border transition-all
                ${isSelected
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              onClick={() => !isDisabled && handleToggle(persona.id)}
            >
              <Checkbox
                checked={isSelected}
                disabled={isDisabled}
                onCheckedChange={() => handleToggle(persona.id)}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{persona.name}</h4>
                  {persona.title && (
                    <Badge variant="outline" className="text-xs">
                      {persona.title}
                    </Badge>
                  )}
                </div>

                {/* Jobs to be Done */}
                {psycho.jobsToBeDone && psycho.jobsToBeDone.length > 0 && (
                  <div className="text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Target className="h-3 w-3 text-blue-400" />
                      <span className="font-medium">JTBD:</span>
                    </div>
                    <ul className="ml-4 space-y-1">
                      {psycho.jobsToBeDone.slice(0, 2).map((job, i) => (
                        <li key={i} className="truncate">{job}</li>
                      ))}
                      {psycho.jobsToBeDone.length > 2 && (
                        <li className="text-purple-400">+{psycho.jobsToBeDone.length - 2} más...</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Barriers */}
                {psycho.barriers && psycho.barriers.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 mb-1">
                      <AlertCircle className="h-3 w-3 text-red-400" />
                      <span className="font-medium">Barreras:</span>
                    </div>
                    <ul className="ml-4 space-y-1">
                      {psycho.barriers.slice(0, 2).map((barrier, i) => (
                        <li key={i} className="truncate">{barrier}</li>
                      ))}
                      {psycho.barriers.length > 2 && (
                        <li className="text-purple-400">+{psycho.barriers.length - 2} más...</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {selected.length >= 10 && (
          <p className="text-xs text-amber-400 text-center">
            Máximo 10 Buyer Personas por simulación
          </p>
        )}
      </CardContent>
    </Card>
  )
}
