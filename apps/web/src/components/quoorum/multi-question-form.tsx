'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Send, AlertCircle } from 'lucide-react'
import { cn, styles } from '@/lib/utils'

interface ClarifyingQuestion {
  id: string
  question: string
  dimension: string
  priority: 'critical' | 'important' | 'nice-to-have'
  questionType: 'yes_no' | 'multiple_choice' | 'free_text'
  multipleChoice?: {
    options: string[]
    allowMultiple: boolean
  }
  freeText?: boolean
}

interface MultiQuestionFormProps {
  questions: ClarifyingQuestion[]
  onSubmit: (answers: Record<string, string | string[] | boolean>) => Promise<void>
  isLoading?: boolean
}

const PRIORITY_COLORS = {
  critical: {
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
  important: {
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/5',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  'nice-to-have': {
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/5',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
}

export function MultiQuestionForm({ questions, onSubmit, isLoading = false }: MultiQuestionFormProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[] | boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Ordenar por prioridad
  const sortedQuestions = [...questions].sort((a, b) => {
    const priorityOrder = { critical: 0, important: 1, 'nice-to-have': 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const handleSubmit = async () => {
    // Validar que las preguntas cr�ticas tengan respuesta
    const newErrors: Record<string, string> = {}
    sortedQuestions.forEach((q) => {
      if (q.priority === 'critical' && !answers[q.id]) {
        newErrors[q.id] = 'Esta pregunta cr�tica requiere respuesta'
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    await onSubmit(answers)
  }

  const handleYesNo = (questionId: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[questionId]
      return newErrors
    })
  }

  const handleMultipleChoice = (questionId: string, value: string, allowMultiple: boolean) => {
    if (allowMultiple) {
      setAnswers(prev => {
        const current = (prev[questionId] as string[]) || []
        const newValue = current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value]
        return { ...prev, [questionId]: newValue }
      })
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: value }))
    }
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[questionId]
      return newErrors
    })
  }

  const handleFreeText = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[questionId]
      return newErrors
    })
  }

  const answeredCount = Object.keys(answers).filter(key => {
    const value = answers[key]
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'string') return value.trim().length > 0
    return true
  }).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold styles.colors.text.primary">
            Completa la informaci�n faltante
          </h3>
          <p className="text-xs styles.colors.text.secondary mt-1">
            {answeredCount} de {sortedQuestions.length} respondidas
          </p>
        </div>
        <div className="text-xs styles.colors.text.tertiary">
          <AlertCircle className="inline h-3 w-3 mr-1" />
          Las marcadas como "Cr�tico" son obligatorias
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {sortedQuestions.map((question, index) => {
          const colors = PRIORITY_COLORS[question.priority]
          const hasError = !!errors[question.id]
          const answer = answers[question.id]

          return (
            <div
              key={question.id}
              className={cn(
                "border rounded-lg p-4 transition-colors",
                colors.border,
                colors.bg,
                hasError && "ring-2 ring-red-500/50"
              )}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold styles.colors.text.secondary">
                      {index + 1}.
                    </span>
                    {question.priority === 'critical' && (
                      <span className={cn("text-xs px-2 py-0.5 rounded border", colors.badge)}>
                        Cr�tico
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium styles.colors.text.primary leading-relaxed">
                    {question.question}
                  </p>
                </div>
              </div>

              {/* Answer Input */}
              <div className="mt-3">
                {/* Yes/No */}
                {question.questionType === 'yes_no' && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => handleYesNo(question.id, true)}
                      className={cn(
                        "flex-1",
                        answer === true
                          ? "bg-green-600 hover:bg-green-500 text-white border-0"
                          : "styles.colors.bg.tertiary hover:styles.colors.bg.input styles.colors.text.secondary styles.colors.border.default"
                      )}
                      disabled={isLoading}
                    >
                      S�
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleYesNo(question.id, false)}
                      className={cn(
                        "flex-1",
                        answer === false
                          ? "bg-red-600 hover:bg-red-500 text-white border-0"
                          : "styles.colors.bg.tertiary hover:styles.colors.bg.input styles.colors.text.secondary styles.colors.border.default"
                      )}
                      disabled={isLoading}
                    >
                      No
                    </Button>
                  </div>
                )}

                {/* Multiple Choice */}
                {question.questionType === 'multiple_choice' && question.multipleChoice && (
                  <div className="space-y-2">
                    {question.multipleChoice.options.map((option) => {
                      const isSelected = question.multipleChoice?.allowMultiple
                        ? (answer as string[] || []).includes(option)
                        : answer === option

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleMultipleChoice(question.id, option, question.multipleChoice?.allowMultiple || false)}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-lg border-2 transition-all",
                            isSelected
                              ? "bg-purple-600/20 border-purple-500 text-white"
                              : "styles.colors.bg.tertiary styles.colors.border.default styles.colors.text.secondary hover:border-purple-500/50 hover:styles.colors.bg.tertiary"
                          )}
                          disabled={isLoading}
                        >
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0",
                              isSelected ? "bg-purple-600 border-purple-500" : "border-[#aebac1]"
                            )}>
                              {isSelected && (
                                <svg className="w-3 h-3 styles.colors.text.primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm">{option}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Free Text */}
                {question.questionType === 'free_text' && (
                  <Input
                    type="text"
                    value={(answer as string) || ''}
                    onChange={(e) => handleFreeText(question.id, e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="styles.colors.bg.input styles.colors.border.default styles.colors.text.primary placeholder:styles.colors.text.tertiary focus:border-purple-500"
                    disabled={isLoading}
                  />
                )}
              </div>

              {/* Error Message */}
              {hasError && (
                <p className="text-xs text-red-400 mt-2">
                  {errors[question.id]}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Submit Button */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || answeredCount === 0}
          className="flex-1 bg-purple-600 hover:bg-purple-500 text-white border-0 py-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar Respuestas ({answeredCount}/{sortedQuestions.length})
            </>
          )}
        </Button>
        {answeredCount < sortedQuestions.length && (
          <Button
            onClick={handleSubmit}
            variant="outline"
            disabled={isLoading}
            className="styles.colors.border.default styles.colors.text.secondary hover:styles.colors.bg.tertiary"
          >
            Omitir opcionales
          </Button>
        )}
      </div>
    </div>
  )
}
