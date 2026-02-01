'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Pause, Play, Plus, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface InteractiveControlsProps {
  debateId: string
  status: 'draft' | 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  isPaused?: boolean
  className?: string
}

export function InteractiveControls({
  debateId,
  status,
  isPaused = false,
  className,
}: InteractiveControlsProps) {
  const [addContextOpen, setAddContextOpen] = useState(false)
  const [contextInput, setContextInput] = useState('')

  const utils = api.useUtils()

  // Mutations
  const pauseMutation = api.debates.pause.useMutation({
    onSuccess: () => {
      toast.success('Debate pausado')
      void utils.debates.get.invalidate({ id: debateId })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const resumeMutation = api.debates.resume.useMutation({
    onSuccess: () => {
      toast.success('Debate reanudado')
      void utils.debates.get.invalidate({ id: debateId })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const addContextMutation = api.debates.addContext.useMutation({
    onSuccess: () => {
      toast.success('Contexto añadido al debate')
      setAddContextOpen(false)
      setContextInput('')
      void utils.debates.get.invalidate({ id: debateId })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const forceConsensusMutation = api.debates.forceConsensus.useMutation({
    onSuccess: () => {
      toast.success('Se forzará consenso en la próxima ronda')
      void utils.debates.get.invalidate({ id: debateId })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Only show controls for in_progress debates
  if (status !== 'in_progress') {
    return null
  }

  const handlePause = () => {
    pauseMutation.mutate({ id: debateId })
  }

  const handleResume = () => {
    resumeMutation.mutate({ id: debateId })
  }

  const handleAddContext = () => {
    if (contextInput.trim().length < 10) {
      toast.error('El contexto debe tener al menos 10 caracteres')
      return
    }
    addContextMutation.mutate({
      id: debateId,
      context: contextInput.trim(),
    })
  }

  const handleForceConsensus = () => {
    if (confirm('¿Estás seguro de que quieres forzar el consenso? El debate terminará anticipadamente.')) {
      forceConsensusMutation.mutate({ id: debateId })
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Pause/Resume Button */}
      {isPaused ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResume}
          disabled={resumeMutation.isPending}
          className="gap-2"
        >
          <Play className="h-4 w-4" />
          {resumeMutation.isPending ? 'Reanudando...' : 'Reanudar'}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePause}
          disabled={pauseMutation.isPending}
          className="gap-2"
        >
          <Pause className="h-4 w-4" />
          {pauseMutation.isPending ? 'Pausando...' : 'Pausar'}
        </Button>
      )}

      {/* Add Context Dialog */}
      <Dialog open={addContextOpen} onOpenChange={setAddContextOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Añadir Contexto
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Contexto al Debate</DialogTitle>
            <DialogDescription>
              El contexto adicional será considerado por los expertos en las siguientes rondas.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Escribe contexto adicional para el debate..."
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {contextInput.length}/1000 caracteres
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddContextOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddContext}
              disabled={addContextMutation.isPending || contextInput.trim().length < 10}
            >
              {addContextMutation.isPending ? 'Añadiendo...' : 'Añadir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force Consensus Button */}
      <Button
        variant="destructive"
        size="sm"
        onClick={handleForceConsensus}
        disabled={forceConsensusMutation.isPending}
        className="gap-2"
      >
        <Zap className="h-4 w-4" />
        {forceConsensusMutation.isPending ? 'Forzando...' : 'Forzar Consenso'}
      </Button>
    </div>
  )
}
