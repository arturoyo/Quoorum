'use client'

import { useState } from 'react'
import { Edit, Save, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { type PromptData } from './debate-flow-timeline'
import { MonacoPromptEditor } from '@/components/admin/monaco-prompt-editor'

interface PromptEditorDialogProps {
  prompt: PromptData
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
}

export function PromptEditorDialog({
  prompt,
  open,
  onOpenChange,
  onClose,
}: PromptEditorDialogProps) {
  const [formData, setFormData] = useState<{
    name: string
    description: string
    prompt: string
    system_prompt: string
    recommended_model: string
    economic_model: string
    balanced_model: string
    performance_model: string
    temperature: number
    max_tokens: number
    is_active: boolean
  }>({
    name: prompt.name,
    description: prompt.description || '',
    prompt: prompt.prompt || '',
    system_prompt: prompt.system_prompt || '',
    recommended_model: prompt.recommended_model || 'gpt-4-turbo',
    economic_model: prompt.economic_model || 'gpt-3.5-turbo',
    balanced_model: prompt.balanced_model || 'gpt-4-turbo',
    performance_model: prompt.performance_model || 'claude-opus-4-20250514',
    temperature: prompt.temperature ?? 0.7,
    max_tokens: prompt.max_tokens ?? 2000,
    is_active: prompt.is_active ?? true,
  })

  const updatePrompt = api.adminPrompts.update.useMutation({
    onSuccess: () => {
      toast.success('Prompt actualizado correctamente')
      onClose()
    },
    onError: (error) => {
      toast.error(`Error al actualizar: ${error.message}`)
    },
  })

  const handleSave = () => {
    updatePrompt.mutate({
      id: prompt.id,
      updates: formData,
      changeReason: 'Actualización manual desde UI',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-purple-400" />
            Editar Prompt: {prompt.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div>
            <Label>Nombre</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Description */}
          <div>
            <Label>Descripción</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Template - Monaco Editor */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              Template del Prompt
              {prompt.variables && prompt.variables.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Variables: {prompt.variables.join(', ')}
                </Badge>
              )}
            </Label>
            <MonacoPromptEditor
              value={formData.prompt}
              onChange={(value) => setFormData({ ...formData, prompt: value })}
              height="300px"
              placeholder="Escribe el template del prompt aquí..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Usa \${`{nombreVariable}`} para insertar variables dinámicas
            </p>
          </div>

          {/* System Prompt - Monaco Editor */}
          <div>
            <Label className="mb-2 block">System Prompt (Opcional)</Label>
            <MonacoPromptEditor
              value={formData.system_prompt}
              onChange={(value) => setFormData({ ...formData, system_prompt: value })}
              height="150px"
              placeholder="Ej: Eres un experto en..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Instrucciones de rol del agente (opcional)
            </p>
          </div>

          {/* Models */}
          <div className="space-y-3">
            <Label>Modelos por Nivel de Rendimiento</Label>

            <div>
              <Label className="text-sm text-green-400">Económico (0.3x coste)</Label>
              <Input
                value={formData.economic_model}
                onChange={(e) => setFormData({ ...formData, economic_model: e.target.value })}
                placeholder="gpt-3.5-turbo"
              />
            </div>

            <div>
              <Label className="text-sm text-blue-400">Equilibrado (1x coste)</Label>
              <Input
                value={formData.balanced_model}
                onChange={(e) => setFormData({ ...formData, balanced_model: e.target.value })}
                placeholder="gpt-4-turbo"
              />
            </div>

            <div>
              <Label className="text-sm text-purple-400">Alto Rendimiento (3x coste)</Label>
              <Input
                value={formData.performance_model}
                onChange={(e) =>
                  setFormData({ ...formData, performance_model: e.target.value })
                }
                placeholder="claude-opus-4-20250514"
              />
            </div>

            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <Label className="text-sm text-purple-300">Modelo Recomendado</Label>
              <Input
                value={formData.recommended_model}
                onChange={(e) =>
                  setFormData({ ...formData, recommended_model: e.target.value })
                }
                placeholder="gpt-4-turbo"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este será el modelo sugerido por defecto para esta función
              </p>
            </div>
          </div>

          {/* Temperature */}
          <div>
            <Label>Temperature: {formData.temperature}</Label>
            <Slider
              value={[formData.temperature]}
              onValueChange={([temp]) => temp !== undefined && setFormData({ ...formData, temperature: temp })}
              min={0}
              max={2}
              step={0.1}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              0 = Determinístico, 1 = Creativo
            </p>
          </div>

          {/* Max Tokens */}
          <div>
            <Label>Max Tokens: {formData.max_tokens}</Label>
            <Slider
              value={[formData.max_tokens]}
              onValueChange={([maxTokens]) => maxTokens !== undefined && setFormData({ ...formData, max_tokens: maxTokens })}
              min={100}
              max={4000}
              step={100}
              className="mt-2"
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>Prompt activo</Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updatePrompt.isPending}>
            <Save className="h-4 w-4 mr-1" />
            {updatePrompt.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
