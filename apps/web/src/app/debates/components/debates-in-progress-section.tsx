/**
 * DebatesInProgressSection Component
 *
 * Shows list of draft debates that user can continue.
 * Displays drafts from both localStorage (recent sessions) and database (older drafts).
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  Play,
  Trash2,
  Loader2,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { cn, styles } from '@/lib/utils'
import { toast } from 'sonner'

interface LocalDraft {
  sessionId: string
  currentPhase: number
  mainQuestion: string
  timestamp: number
  phaseProgress: {
    contexto: number
    expertos: number
    estrategia: number
  }
}

export function DebatesInProgressSection() {
  const [localDrafts, setLocalDrafts] = useState<LocalDraft[]>([])
  const [isLoadingLocal, setIsLoadingLocal] = useState(true)

  // Get database drafts
  const { data: dbDrafts, isLoading: isLoadingDb, refetch } = api.debates.list.useQuery({
    limit: 10,
    status: 'draft',
  })

  // Load local drafts from localStorage
  useEffect(() => {
    const loadLocalDrafts = () => {
      try {
        const drafts: LocalDraft[] = []
        const keys = Object.keys(localStorage)

        keys.forEach((key) => {
          if (key.startsWith('quoorum-debate-creation-state-')) {
            try {
              const data = JSON.parse(localStorage.getItem(key) || '{}')
              const sessionId = key.replace('quoorum-debate-creation-state-', '')

              // Check if draft is not too old (24 hours)
              const timestamp = data.timestamp || data.contexto?.timestamp || Date.now()
              const ageInHours = (Date.now() - timestamp) / (1000 * 60 * 60)

              if (ageInHours <= 24 && data.contexto?.mainQuestion) {
                drafts.push({
                  sessionId,
                  currentPhase: data.currentPhase || 1,
                  mainQuestion: data.contexto.mainQuestion,
                  timestamp,
                  phaseProgress: data.phaseProgress || { contexto: 0, expertos: 0, estrategia: 0 },
                })
              }
            } catch {
              // Ignore invalid drafts
            }
          }
        })

        // Sort by timestamp (most recent first)
        drafts.sort((a, b) => b.timestamp - a.timestamp)
        setLocalDrafts(drafts)
      } catch (error) {
        console.error('Error loading local drafts:', error)
      } finally {
        setIsLoadingLocal(false)
      }
    }

    loadLocalDrafts()
  }, [])

  const deleteMutation = api.debates.delete.useMutation({
    onSuccess: () => {
      toast.success('Borrador eliminado')
      void refetch()
    },
    onError: () => {
      toast.error('Error al eliminar borrador')
    },
  })

  const deleteLocalDraft = (sessionId: string) => {
    try {
      localStorage.removeItem(`quoorum-debate-creation-state-${sessionId}`)
      setLocalDrafts((prev) => prev.filter((d) => d.sessionId !== sessionId))
      toast.success('Borrador local eliminado')
    } catch {
      toast.error('Error al eliminar borrador')
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 60) return `Hace ${minutes} minutos`
    if (hours < 24) return `Hace ${hours} horas`
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  const getPhaseLabel = (phase: number) => {
    const labels = ['', 'Contexto', 'Expertos', 'Estrategia', 'Revisión', 'Debate']
    return labels[phase] || 'Desconocida'
  }

  const totalDrafts = localDrafts.length + (dbDrafts?.length || 0)

  if (isLoadingLocal || isLoadingDb) {
    return (
      <Card className={cn("backdrop-blur-xl", styles.colors.border.default, styles.colors.bg.secondary)}>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        </CardContent>
      </Card>
    )
  }

  if (totalDrafts === 0) {
    return null // Don't show section if no drafts
  }

  return (
    <Card className={cn("backdrop-blur-xl", styles.colors.border.default, styles.colors.bg.secondary)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={cn("flex items-center gap-2", styles.colors.text.primary)}>
              <Clock className="h-5 w-5 text-amber-400" />
              Debates en Progreso
            </CardTitle>
            <CardDescription className={styles.colors.text.secondary}>
              Continúa donde lo dejaste
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-amber-500/40 text-amber-400">
            {totalDrafts} {totalDrafts === 1 ? 'borrador' : 'borradores'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Local drafts (localStorage) */}
        {localDrafts.map((draft) => (
          <div
            key={draft.sessionId}
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg border transition-colors",
              "hover:border-purple-500/50",
              styles.colors.border.default,
              styles.colors.bg.tertiary
            )}
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium truncate", styles.colors.text.primary)}>
                {draft.mainQuestion}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="border-purple-500/40 text-purple-300 text-xs">
                  Fase {draft.currentPhase}: {getPhaseLabel(draft.currentPhase)}
                </Badge>
                <span className={cn("text-xs", styles.colors.text.tertiary)}>
                  {formatDate(draft.timestamp)}
                </span>
                <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                  Local
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/debates/new-unified/${draft.sessionId}`}>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-500"
                >
                  <Play className="h-3.5 w-3.5 mr-1" />
                  Continuar
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteLocalDraft(draft.sessionId)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {/* Database drafts */}
        {dbDrafts?.map((draft) => (
          <div
            key={draft.id}
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg border transition-colors",
              "hover:border-purple-500/50",
              styles.colors.border.default,
              styles.colors.bg.tertiary
            )}
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium truncate", styles.colors.text.primary)}>
                {draft.question}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("text-xs", styles.colors.text.tertiary)}>
                  {formatDate(new Date(draft.createdAt).getTime())}
                </span>
                <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                  Guardado en DB
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/debates/${draft.id}`}>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500"
                >
                  <Play className="h-3.5 w-3.5 mr-1" />
                  Ver
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteMutation.mutate({ id: draft.id })}
                disabled={deleteMutation.isPending}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {/* Info message */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <AlertCircle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300">
            Los borradores locales se guardan por 24 horas. Los borradores en base de datos se mantienen hasta que los elimines.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
