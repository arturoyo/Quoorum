'use client'

import { useState } from 'react'
import { Activity, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/trpc/client'
import { DebateFlowTimeline, type PromptData } from './components/debate-flow-timeline'
import { PerformanceLevelSelector } from './components/performance-level-selector'
import { PromptEditorDialog } from './components/prompt-editor-dialog'
import { PromptTestPanel } from './components/prompt-test-panel'

export default function DebateFlowPage() {
  const [selectedPrompt, setSelectedPrompt] = useState<PromptData | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [testPanelOpen, setTestPanelOpen] = useState(false)

  // Fetch all prompts with phase info
  const { data: prompts, isLoading, refetch } = api.adminPrompts.list.useQuery(undefined)

  // Group prompts by phase
  const promptsByPhase = prompts?.reduce((acc, prompt) => {
    const phase = (prompt).phase || 0
    if (!acc[phase]) {
      acc[phase] = []
    }
    acc[phase].push(prompt as PromptData)
    return acc
  }, {} as Record<number, PromptData[]>)

  const handlePromptEdit = (prompt: PromptData) => {
    setSelectedPrompt(prompt)
    setEditorOpen(true)
  }

  const handlePromptTest = (prompt: PromptData) => {
    setSelectedPrompt(prompt)
    setTestPanelOpen(true)
  }

  const handleEditorClose = () => {
    setEditorOpen(false)
    setSelectedPrompt(null)
    refetch()
  }

  const handleTestClose = () => {
    setTestPanelOpen(false)
    setSelectedPrompt(null)
  }

  // Count active prompts
  const activePromptsCount = prompts?.filter((p) => (p).is_active).length || 0
  const totalPromptsCount = prompts?.length || 0

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Activity className="h-6 w-6 animate-spin" />
            <span>Cargando prompts...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="h-8 w-8 text-purple-400" />
          <h1 className="text-3xl font-bold">
            Flujo de Debates - Gestión de Prompts IA
          </h1>
        </div>
        <p className="text-muted-foreground">
          Controla todos los prompts de IA en el sistema de debates. {activePromptsCount} de{' '}
          {totalPromptsCount} prompts activos.
        </p>
        <div className="flex gap-2 mt-3">
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
            {promptsByPhase?.[1]?.length || 0} Fase 1: Contexto
          </Badge>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
            {promptsByPhase?.[2]?.length || 0} Fase 2: Expertos
          </Badge>
          <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
            {promptsByPhase?.[3]?.length || 0} Fase 3: Estrategia
          </Badge>
          <Badge variant="outline" className="bg-pink-500/10 text-pink-400 border-pink-500/30">
            {promptsByPhase?.[4]?.length || 0} Fase 4: Revisión
          </Badge>
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
            {promptsByPhase?.[5]?.length || 0} Fase 5: Debate
          </Badge>
        </div>
      </header>

      {/* Performance Level Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            Nivel de Rendimiento Global
          </CardTitle>
          <CardDescription>
            Configura el balance entre coste y calidad para todos los usuarios por defecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PerformanceLevelSelector />
        </CardContent>
      </Card>

      {/* Timeline */}
      <DebateFlowTimeline
        promptsByPhase={promptsByPhase || {}}
        onPromptEdit={handlePromptEdit}
        onPromptTest={handlePromptTest}
      />

      {/* Dialogs */}
      {selectedPrompt && (
        <>
          <PromptEditorDialog
            prompt={selectedPrompt}
            open={editorOpen}
            onOpenChange={setEditorOpen}
            onClose={handleEditorClose}
          />
          <PromptTestPanel
            prompt={selectedPrompt}
            open={testPanelOpen}
            onOpenChange={setTestPanelOpen}
            onClose={handleTestClose}
          />
        </>
      )}
    </div>
  )
}
