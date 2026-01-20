'use client'

import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Sparkles, Info } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ThemeSelectorProps {
  question: string
  context?: string
  onThemeToggle?: (enabled: boolean) => void
  enabled?: boolean
}

export function ThemeSelector({ question, context, onThemeToggle, enabled = true }: ThemeSelectorProps) {
  const [themeEnabled, setThemeEnabled] = useState(enabled)

  const {
    data: themePreview,
    isLoading,
  } = api.debates.previewTheme.useQuery(
    {
      question: question || '',
      context,
    },
    { enabled: question.length >= 10 }
  )

  useEffect(() => {
    if (onThemeToggle) {
      onThemeToggle(themeEnabled)
    }
  }, [themeEnabled, onThemeToggle])

  if (!question || question.length < 10) {
    return (
      <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <CardContent className="py-6 text-center text-sm text-gray-400">
          Escribe una pregunta para ver el tema narrativo sugerido
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <CardTitle className="text-white">Tema Narrativo</CardTitle>
          </div>
          <Switch
            checked={themeEnabled}
            onCheckedChange={setThemeEnabled}
            className="data-[state=checked]:bg-indigo-600"
          />
        </div>
        <CardDescription className="text-gray-400">
          {themeEnabled ? 'Los expertos tendrán identidades narrativas' : 'Los expertos usarán nombres genéricos'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
        ) : themePreview && themeEnabled ? (
          <>
            {/* Theme Preview */}
            <div className={`rounded-lg border-2 p-4 ${
              themePreview.shouldUseTheme
                ? 'border-indigo-500/50 bg-indigo-900/20'
                : 'border-yellow-500/50 bg-yellow-900/20'
            }`}>
              <div className="flex items-start gap-3">
                <div className="text-4xl">{themePreview.themeEmoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">{themePreview.themeName}</h3>
                    <Badge className={`${
                      themePreview.shouldUseTheme
                        ? 'bg-indigo-600 text-white'
                        : 'bg-yellow-600 text-white'
                    }`}>
                      {Math.round(themePreview.confidence * 100)}% confianza
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    {themePreview.themeDescription}
                  </p>
                  <p className="text-xs text-gray-400 italic">
                    {themePreview.reason}
                  </p>
                </div>
              </div>
            </div>

            {/* Confidence Explanation */}
            {!themePreview.shouldUseTheme && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-900/10 p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-yellow-400 mt-0.5" />
                  <div className="text-xs text-gray-300">
                    <p className="font-medium text-yellow-400 mb-1">Confianza baja</p>
                    <p>
                      La pregunta no se ajusta claramente a ningún tema narrativo.
                      Se usarán nombres genéricos (Experto 1, Experto 2, etc.) para mayor claridad.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* What are narrative themes? */}
            <div className="rounded-lg border border-white/5 bg-slate-800/30 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-400" />
                <Label className="text-xs text-gray-400">¿Qué son los temas narrativos?</Label>
              </div>
              <p className="text-xs text-gray-300">
                Los temas narrativos asignan identidades de personajes a los expertos del debate
                (ej: Atenea, Lancelot, Steve Jobs) para hacer la experiencia más inmersiva.
                Los modelos de IA (GPT, Claude, etc.) quedan ocultos para el usuario.
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-white/5 bg-slate-800/30 p-4 text-center">
            <p className="text-sm text-gray-400">
              Los expertos usarán nombres genéricos (Experto 1, Experto 2...)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
