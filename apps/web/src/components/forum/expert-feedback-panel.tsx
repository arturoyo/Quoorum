'use client'
// @ts-nocheck

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  Eye,
  Lightbulb,
  Loader2,
  Minus,
  Sparkles,
  Star,
  Target,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

// ============================================================================
// Types
// ============================================================================

interface ExpertFeedbackPanelProps {
  debateId: string
  experts: Array<{
    id: string
    name: string
    specialty?: string
  }>
  onComplete?: () => void
}

type Sentiment = 'positive' | 'neutral' | 'negative'

interface ExpertFeedback {
  rating: number
  sentiment: Sentiment
  insightfulness: number
  relevance: number
  clarity: number
  actionability: number
  comment: string
  wasFollowed: boolean | null
}

// ============================================================================
// Sub-components
// ============================================================================

function StarRating({
  value,
  onChange,
  size = 'md',
}: {
  value: number
  onChange: (val: number) => void
  size?: 'sm' | 'md' | 'lg'
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              sizeClasses[size],
              'transition-colors',
              (hovered !== null ? star <= hovered : star <= value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-[#8696a0]'
            )}
          />
        </button>
      ))}
    </div>
  )
}

function SentimentSelector({
  value,
  onChange,
}: {
  value: Sentiment
  onChange: (val: Sentiment) => void
}) {
  const options: { value: Sentiment; icon: typeof ThumbsUp; label: string; color: string }[] = [
    { value: 'positive', icon: ThumbsUp, label: 'Positivo', color: 'text-green-400' },
    { value: 'neutral', icon: Minus, label: 'Neutral', color: 'text-[#8696a0]' },
    { value: 'negative', icon: ThumbsDown, label: 'Negativo', color: 'text-red-400' },
  ]

  return (
    <div className="flex items-center gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 transition-all',
            value === opt.value
              ? 'border-[#00a884] bg-[#00a884]/10'
              : 'border-[#2a3942] bg-[#111b21] hover:border-[#8696a0]'
          )}
        >
          <opt.icon className={cn('h-4 w-4', value === opt.value ? opt.color : 'text-[#8696a0]')} />
          <span
            className={cn('text-sm', value === opt.value ? 'text-[#e9edef]' : 'text-[#8696a0]')}
          >
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  )
}

function AspectRating({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: typeof Lightbulb
  label: string
  value: number
  onChange: (val: number) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#111b21] p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#8696a0]" />
        <span className="text-sm text-[#e9edef]">{label}</span>
      </div>
      <StarRating value={value} onChange={onChange} size="sm" />
    </div>
  )
}

function FollowedSelector({
  value,
  onChange,
}: {
  value: boolean | null
  onChange: (val: boolean | null) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-4 py-2 transition-all',
          value === true
            ? 'border-green-500 bg-green-500/10'
            : 'border-[#2a3942] bg-[#111b21] hover:border-[#8696a0]'
        )}
      >
        <CheckCircle
          className={cn('h-4 w-4', value === true ? 'text-green-400' : 'text-[#8696a0]')}
        />
        <span className={cn('text-sm', value === true ? 'text-green-400' : 'text-[#8696a0]')}>
          Sí
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-4 py-2 transition-all',
          value === false
            ? 'border-red-500 bg-red-500/10'
            : 'border-[#2a3942] bg-[#111b21] hover:border-[#8696a0]'
        )}
      >
        <XCircle className={cn('h-4 w-4', value === false ? 'text-red-400' : 'text-[#8696a0]')} />
        <span className={cn('text-sm', value === false ? 'text-red-400' : 'text-[#8696a0]')}>
          No
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-4 py-2 transition-all',
          value === null
            ? 'border-[#8696a0] bg-[#8696a0]/10'
            : 'border-[#2a3942] bg-[#111b21] hover:border-[#8696a0]'
        )}
      >
        <span className={cn('text-sm', value === null ? 'text-[#e9edef]' : 'text-[#8696a0]')}>
          No sé aún
        </span>
      </button>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ExpertFeedbackPanel({ debateId, experts, onComplete }: ExpertFeedbackPanelProps) {
  const [currentExpertIndex, setCurrentExpertIndex] = useState(0)
  const [feedback, setFeedback] = useState<Record<string, ExpertFeedback>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentExpert = experts[currentExpertIndex]
  const expertId = currentExpert?.id ?? ''
  const currentFeedback: ExpertFeedback = feedback[expertId] ?? {
    rating: 0,
    sentiment: 'neutral',
    insightfulness: 0,
    relevance: 0,
    clarity: 0,
    actionability: 0,
    comment: '',
    wasFollowed: null,
  }

  const submitFeedback = api.forumFeedback.submit.useMutation({
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const updateCurrentFeedback = (updates: Partial<ExpertFeedback>) => {
    if (!currentExpert) return
    setFeedback((prev) => ({
      ...prev,
      [currentExpert.id]: { ...currentFeedback, ...updates },
    }))
  }

  const handleSubmitAll = async () => {
    setIsSubmitting(true)
    try {
      for (const expert of experts) {
        const expertFeedback = feedback[expert.id]
        if (expertFeedback && expertFeedback.rating > 0) {
          await submitFeedback.mutateAsync({
            debateId,
            expertId: expert.id,
            rating: expertFeedback.rating,
            sentiment:
              expertFeedback.sentiment === 'positive'
                ? 'helpful'
                : expertFeedback.sentiment === 'negative'
                  ? 'unhelpful'
                  : 'neutral',
            insightfulness: expertFeedback.insightfulness || undefined,
            relevance: expertFeedback.relevance || undefined,
            clarity: expertFeedback.clarity || undefined,
            actionability: expertFeedback.actionability || undefined,
            comment: expertFeedback.comment || undefined,
            wasFollowed: expertFeedback.wasFollowed ?? undefined,
          })
        }
      }
      toast.success('Feedback enviado correctamente')
      onComplete?.()
    } catch {
      // Error handled in mutation onError
    } finally {
      setIsSubmitting(false)
    }
  }

  const isCurrentValid = currentFeedback.rating > 0
  const hasAnyFeedback = Object.values(feedback).some((f) => f.rating > 0)
  const progress = ((currentExpertIndex + 1) / experts.length) * 100

  if (!currentExpert) {
    return null
  }

  return (
    <Card className="border-[#2a3942] bg-[#202c33]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-[#e9edef]">
              <Star className="h-5 w-5 text-yellow-400" />
              Valorar Expertos
            </CardTitle>
            <CardDescription className="text-[#8696a0]">
              Tu feedback mejora las futuras recomendaciones
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-[#8696a0] text-[#8696a0]">
            {currentExpertIndex + 1} / {experts.length}
          </Badge>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 w-full rounded-full bg-[#111b21]">
          <div
            className="h-full rounded-full bg-[#00a884] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Expert header */}
        <div className="flex items-center gap-4 rounded-lg bg-[#111b21] p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-lg font-bold text-white">
            {currentExpert.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-[#e9edef]">{currentExpert.name}</h3>
            {currentExpert.specialty && (
              <p className="text-sm text-[#8696a0]">{currentExpert.specialty}</p>
            )}
          </div>
        </div>

        {/* Overall rating */}
        <div className="space-y-2">
          <Label className="text-[#e9edef]">Valoración General</Label>
          <div className="flex items-center gap-4">
            <StarRating
              value={currentFeedback.rating}
              onChange={(val) => updateCurrentFeedback({ rating: val })}
              size="lg"
            />
            {currentFeedback.rating > 0 && (
              <span className="text-sm text-[#8696a0]">
                {currentFeedback.rating === 5
                  ? 'Excelente'
                  : currentFeedback.rating === 4
                    ? 'Muy bueno'
                    : currentFeedback.rating === 3
                      ? 'Bueno'
                      : currentFeedback.rating === 2
                        ? 'Regular'
                        : 'Mejorable'}
              </span>
            )}
          </div>
        </div>

        {/* Sentiment */}
        <div className="space-y-2">
          <Label className="text-[#e9edef]">Sentimiento General</Label>
          <SentimentSelector
            value={currentFeedback.sentiment}
            onChange={(val) => updateCurrentFeedback({ sentiment: val })}
          />
        </div>

        {/* Aspect ratings */}
        <div className="space-y-2">
          <Label className="text-[#e9edef]">Aspectos Detallados (opcional)</Label>
          <div className="space-y-2">
            <AspectRating
              icon={Lightbulb}
              label="Perspicacia"
              value={currentFeedback.insightfulness}
              onChange={(val) => updateCurrentFeedback({ insightfulness: val })}
            />
            <AspectRating
              icon={Target}
              label="Relevancia"
              value={currentFeedback.relevance}
              onChange={(val) => updateCurrentFeedback({ relevance: val })}
            />
            <AspectRating
              icon={Eye}
              label="Claridad"
              value={currentFeedback.clarity}
              onChange={(val) => updateCurrentFeedback({ clarity: val })}
            />
            <AspectRating
              icon={Sparkles}
              label="Accionabilidad"
              value={currentFeedback.actionability}
              onChange={(val) => updateCurrentFeedback({ actionability: val })}
            />
          </div>
        </div>

        {/* Followed recommendation */}
        <div className="space-y-2">
          <Label className="text-[#e9edef]">¿Seguiste su recomendación?</Label>
          <FollowedSelector
            value={currentFeedback.wasFollowed}
            onChange={(val) => updateCurrentFeedback({ wasFollowed: val })}
          />
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <Label className="text-[#e9edef]">Comentario (opcional)</Label>
          <Textarea
            placeholder="¿Algo más que quieras compartir sobre este experto?"
            value={currentFeedback.comment}
            onChange={(e) => updateCurrentFeedback({ comment: e.target.value })}
            className="min-h-[80px] border-[#2a3942] bg-[#111b21] text-[#e9edef] placeholder:text-[#8696a0]"
          />
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentExpertIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentExpertIndex === 0}
            className="border-[#2a3942] bg-[#111b21] text-[#e9edef]"
          >
            Anterior
          </Button>

          <div className="flex items-center gap-2">
            {currentExpertIndex < experts.length - 1 ? (
              <Button
                onClick={() => setCurrentExpertIndex((prev) => prev + 1)}
                disabled={!isCurrentValid}
                className="bg-[#00a884] hover:bg-[#00a884]/90"
              >
                Siguiente
              </Button>
            ) : (
              <Button
                onClick={handleSubmitAll}
                disabled={!hasAnyFeedback || isSubmitting}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Feedback'
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
