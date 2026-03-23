'use client'

import { useState } from 'react'
import { Play, CheckCircle, Beaker } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'

interface PromptTestPanelProps {
  prompt: {
    id: string
    key: string
    name: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
}

export function PromptTestPanel({ prompt, open, onOpenChange, onClose }: PromptTestPanelProps) {
  const [testInput, setTestInput] = useState('')
  const [result, setResult] = useState<string | null>(null)

  const testPrompt = api.adminPrompts.test.useMutation({
    onSuccess: (data) => {
      setResult(data.response || 'Sin respuesta')
      toast.success('Test completado exitosamente')
    },
    onError: (error) => {
      toast.error(`Error en el test: ${error.message}`)
    },
  })

  const handleTest = () => {
    if (!testInput.trim()) {
      toast.error('Ingresa un input de prueba')
      return
    }

    testPrompt.mutate({
      promptId: prompt.id,
      testInput,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-purple-400" />
            Testear Prompt: {prompt.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Input de Prueba</Label>
            <Textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              rows={6}
              placeholder="Ingresa el contenido de prueba para el prompt..."
              className="font-mono text-sm"
            />
          </div>

          <Button onClick={handleTest} disabled={testPrompt.isPending} className="w-full">
            {testPrompt.isPending ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Ejecutando Test...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Ejecutar Test
              </>
            )}
          </Button>

          {result && (
            <div className="mt-4 p-4 rounded-lg bg-black/30 border border-white/10">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Resultado del Test
              </h4>
              <pre className="text-sm whitespace-pre-wrap text-muted-foreground">{result}</pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
