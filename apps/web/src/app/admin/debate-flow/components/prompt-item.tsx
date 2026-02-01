'use client'

import { Sparkles, Edit, Beaker } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PromptItemProps {
  prompt: {
    id: string
    key: string
    name: string
    description: string
    category: string
    recommended_model?: string
    temperature?: number
    max_tokens?: number
    variables?: string[]
    version: number
  }
  onEdit: () => void
  onTest: () => void
}

export function PromptItem({ prompt, onEdit, onTest }: PromptItemProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <h4 className="font-medium">{prompt.name}</h4>

          {/* Category badge */}
          <Badge variant="outline" className="text-xs">
            {prompt.category}
          </Badge>

          {/* Recommended model badge */}
          {prompt.recommended_model && (
            <Badge className="bg-purple-500/20 text-purple-300 text-xs">
              {prompt.recommended_model} ⭐
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground">{prompt.description}</p>

        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          {prompt.temperature !== undefined && <span>Temp: {prompt.temperature}</span>}
          {prompt.max_tokens !== undefined && <span>MaxTokens: {prompt.max_tokens}</span>}
          {prompt.variables && <span>Variables: {prompt.variables.length}</span>}
          <span>v{prompt.version}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onTest}>
          <Beaker className="h-4 w-4 mr-1" />
          Testear
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
      </div>
    </div>
  )
}
