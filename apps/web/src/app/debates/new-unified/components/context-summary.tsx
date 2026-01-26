/**
 * ContextSummary Component
 * 
 * Muestra un resumen visual completo de todas las preguntas y respuestas
 * recopiladas en la fase de contexto.
 */

'use client'

import React, { useState } from 'react'
import { Edit, CheckCircle2, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { ContextoState, Question } from '../types'

interface ContextSummaryProps {
  contexto: ContextoState
  onEditAnswer: (questionId: string, newAnswer: string) => void
  onClose?: () => void
}

export function ContextSummary({
  contexto,
  onEditAnswer,
  onClose,
}: ContextSummaryProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main', 'answers']))

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const startEdit = (questionId: string, currentAnswer: string) => {
    setEditingId(questionId)
    setEditValue(currentAnswer)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const saveEdit = (questionId: string) => {
    if (editValue.trim()) {
      onEditAnswer(questionId, editValue.trim())
      cancelEdit()
    }
  }

  const getQuestionById = (id: string): Question | undefined => {
    return contexto.questions.find((q) => q.id === id)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-[var(--theme-text-primary)] mb-2">Resumen del Contexto</h2>
          <p className="text-[var(--theme-text-tertiary)]">
            Revisa y edita todas tus respuestas antes de continuar
          </p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)]"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Pregunta Principal */}
      <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
        <CardHeader
          className="cursor-pointer hover:bg-[var(--theme-bg-tertiary)] transition-colors"
          onClick={() => toggleSection('main')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-[var(--theme-text-primary)] flex items-center gap-2">
              <span>Pregunta Principal</span>
              <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                Inicio
              </Badge>
            </CardTitle>
            {expandedSections.has('main') ? (
              <ChevronUp className="h-5 w-5 text-[var(--theme-text-tertiary)]" />
            ) : (
              <ChevronDown className="h-5 w-5 text-[var(--theme-text-tertiary)]" />
            )}
          </div>
        </CardHeader>
        {expandedSections.has('main') && (
          <CardContent>
            <p className="text-lg text-[var(--theme-text-primary)]">{contexto.mainQuestion}</p>
          </CardContent>
        )}
      </Card>

      {/* Respuestas */}
      <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
        <CardHeader
          className="cursor-pointer hover:bg-[var(--theme-bg-tertiary)] transition-colors"
          onClick={() => toggleSection('answers')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-[var(--theme-text-primary)] flex items-center gap-2">
              <span>Preguntas y Respuestas</span>
              <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                {Object.keys(contexto.answers).length} respuesta{Object.keys(contexto.answers).length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            {expandedSections.has('answers') ? (
              <ChevronUp className="h-5 w-5 text-[var(--theme-text-tertiary)]" />
            ) : (
              <ChevronDown className="h-5 w-5 text-[var(--theme-text-tertiary)]" />
            )}
          </div>
        </CardHeader>
        {expandedSections.has('answers') && (
          <CardContent className="space-y-4">
            {Object.entries(contexto.answers).map(([questionId, answer]) => {
              const question = getQuestionById(questionId)
              const isEditing = editingId === questionId
              const answerType = question?.expectedAnswerType || (answer.length > 100 ? 'long' : 'short')

              return (
                <div
                  key={questionId}
                  className="p-4 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] space-y-3"
                >
                  {/* Pregunta */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {question?.priority === 'critical' && (
                          <Badge variant="outline" className="border-red-500/30 text-red-300 text-xs">
                            Crítica
                          </Badge>
                        )}
                        {question?.questionType && (
                          <Badge variant="outline" className="border-blue-500/30 text-blue-300 text-xs">
                            {question.questionType === 'yes_no' ? 'Sí/No' : 
                             question.questionType === 'multiple_choice' ? 'Opción múltiple' : 
                             'Texto libre'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[var(--theme-text-primary)] font-medium">{question?.content || `Pregunta ${questionId}`}</p>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(questionId, answer)}
                        className="text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)]"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Respuesta */}
                  {isEditing ? (
                    <div className="space-y-3">
                      {answerType === 'long' ? (
                        <Textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="Escribe tu respuesta..."
                          rows={4}
                          className={cn(
                            'bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] text-[var(--theme-text-primary)]',
                            'placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500',
                            'focus-visible:border-purple-500'
                          )}
                          autoFocus
                        />
                      ) : (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="Escribe tu respuesta..."
                          className={cn(
                            'bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] text-[var(--theme-text-primary)]',
                            'placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500',
                            'focus-visible:border-purple-500'
                          )}
                          autoFocus
                        />
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveEdit(questionId)}
                          disabled={!editValue.trim()}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEdit}
                          className="text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)]"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)]">
                      <p className="text-[var(--theme-text-secondary)] whitespace-pre-wrap">{answer}</p>
                    </div>
                  )}
                </div>
              )
            })}

            {Object.keys(contexto.answers).length === 0 && (
              <div className="text-center py-8 text-[var(--theme-text-tertiary)]">
                No hay respuestas aún
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Evaluación */}
      {contexto.evaluation && (
        <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
          <CardHeader
            className="cursor-pointer hover:bg-[var(--theme-bg-tertiary)] transition-colors"
            onClick={() => toggleSection('evaluation')}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-[var(--theme-text-primary)] flex items-center gap-2">
                <span>Evaluación del Contexto</span>
                <Badge variant="outline" className="border-green-500/30 text-green-300">
                  {contexto.contextScore}/100
                </Badge>
              </CardTitle>
              {expandedSections.has('evaluation') ? (
                <ChevronUp className="h-5 w-5 text-[var(--theme-text-tertiary)]" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[var(--theme-text-tertiary)]" />
              )}
            </div>
          </CardHeader>
          {expandedSections.has('evaluation') && (
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-[var(--theme-text-tertiary)] mb-2">Análisis</h4>
                <p className="text-[var(--theme-text-secondary)] whitespace-pre-wrap">{contexto.evaluation.reasoning}</p>
              </div>

              {contexto.evaluation.contradictions && contexto.evaluation.contradictions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-400 mb-2">⚠️ Contradicciones detectadas</h4>
                  <ul className="list-disc list-inside space-y-1 text-[var(--theme-text-secondary)]">
                    {contexto.evaluation.contradictions.map((contradiction, index) => (
                      <li key={index}>{contradiction}</li>
                    ))}
                  </ul>
                </div>
              )}

              {contexto.evaluation.duplicatedInfo && contexto.evaluation.duplicatedInfo.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-blue-400 mb-2">ℹ️ Información duplicada</h4>
                  <ul className="list-disc list-inside space-y-1 text-[var(--theme-text-secondary)]">
                    {contexto.evaluation.duplicatedInfo.map((dup, index) => (
                      <li key={index}>{dup}</li>
                    ))}
                  </ul>
                </div>
              )}

              {contexto.evaluation.missingAspects.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--theme-text-tertiary)] mb-2">Aspectos a considerar</h4>
                  <ul className="list-disc list-inside space-y-1 text-[var(--theme-text-secondary)]">
                    {contexto.evaluation.missingAspects.map((aspect, index) => (
                      <li key={index}>{aspect}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
