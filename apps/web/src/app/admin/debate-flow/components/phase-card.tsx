'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PromptItem } from './prompt-item'
import { type PromptData } from './debate-flow-timeline'

interface PhaseInfo {
  num: number
  title: string
  desc: string
  icon: LucideIcon
  color: string
}

interface PhaseCardProps {
  phase: PhaseInfo
  prompts: PromptData[]
  onPromptEdit: (prompt: PromptData) => void
  onPromptTest: (prompt: PromptData) => void
}

export function PhaseCard({ phase, prompts, onPromptEdit, onPromptTest }: PhaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const Icon = phase.icon

  const colorClasses = {
    green: 'border-green-500 bg-green-500/20 text-green-400',
    blue: 'border-blue-500 bg-blue-500/20 text-blue-400',
    orange: 'border-orange-500 bg-orange-500/20 text-orange-400',
    pink: 'border-pink-500 bg-pink-500/20 text-pink-400',
    purple: 'border-purple-500 bg-purple-500/20 text-purple-400',
  }

  const badgeClass = colorClasses[phase.color as keyof typeof colorClasses] || colorClasses.purple

  return (
    <div className="relative pl-20">
      {/* Phase number badge */}
      <div
        className={`absolute left-0 top-0 flex items-center justify-center w-16 h-16 rounded-full border-2 ${badgeClass}`}
      >
        <span className="text-2xl font-bold">{phase.num}</span>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="h-6 w-6 text-purple-400" />
              <div>
                <CardTitle>
                  Fase {phase.num}: {phase.title}
                </CardTitle>
                <CardDescription className="mt-1">{phase.desc}</CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="secondary">{prompts.length} prompts IA</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && prompts.length > 0 && (
          <CardContent>
            <div className="space-y-3">
              {prompts.map((prompt) => (
                <PromptItem
                  key={prompt.id}
                  prompt={prompt}
                  onEdit={() => onPromptEdit(prompt)}
                  onTest={() => onPromptTest(prompt)}
                />
              ))}
            </div>
          </CardContent>
        )}

        {isExpanded && prompts.length === 0 && (
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay prompts configurados para esta fase
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
