'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Loader2,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExpertSelector } from '@/components/quoorum/expert-selector'

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
interface Question {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  questionType: 'yes_no' | 'multiple_choice' | 'free_text'
  content: string
  options?: string[]
  answer?: string
}

interface ContextEvaluation {
  score: number
  reasoning: string
  missingAspects: string[]
  shouldContinue: boolean
  followUpQuestions: Question[]
}

type Phase = 'initial' | 'critical' | 'deep' | 'refine' | 'ready'

interface Message {
  id: string
  role: 'ai' | 'user'
  content: string
  type?: 'question' | 'answer' | 'evaluation' | 'system'
  timestamp: Date
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════
export default function NewDebatePageV2() {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Core state
  const [phase, setPhase] = useState<Phase>('initial')
  const [mainQuestion, setMainQuestion] = useState('')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})

  // Questions state
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Evaluation state
  const [contextScore, setContextScore] = useState(0)
  const [evaluation, setEvaluation] = useState<ContextEvaluation | null>(null)

  // Expert selection state
  const [showExpertSelector, setShowExpertSelector] = useState(false)
  const [selectedExpertIds, setSelectedExpertIds] = useState<string[]>([])

  // Loading states
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [isCreatingDebate, setIsCreatingDebate] = useState(false)

  // Mutations
  const generateCriticalQuestions = api.debates.generateCriticalQuestions.useMutation()
  const evaluateContext = api.debates.evaluateContextQuality.useMutation()
  const createDebate = api.debates.create.useMutation()

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Handle initial question submission
   */
  const handleInitialQuestion = async () => {
    if (!mainQuestion.trim()) return

    setMessages([
      {
        id: 'msg-0',
        role: 'user',
        content: mainQuestion,
        type: 'answer',
        timestamp: new Date(),
      },
    ])

    setPhase('critical')
    setIsGeneratingQuestions(true)

    try {
      const questions = await generateCriticalQuestions.mutateAsync({
        question: mainQuestion,
      })

      setCurrentQuestions(questions)
      setCurrentQuestionIndex(0)

      // Show first question
      if (questions.length > 0) {
        const firstQ = questions[0]!
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'ai',
            content: firstQ.content,
            type: 'question',
            timestamp: new Date(),
          },
        ])
      }

      setIsGeneratingQuestions(false)
    } catch (error) {
      toast.error('Error al generar preguntas')
      setIsGeneratingQuestions(false)
    }
  }

  /**
   * Handle answer (button or text)
   */
  const handleAnswer = async (answer: string) => {
    const currentQ = currentQuestions[currentQuestionIndex]
    if (!currentQ) return

    // Save answer
    const newAnswers = { ...answers, [currentQ.id]: answer }
    setAnswers(newAnswers)

    // Show user message
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: answer,
        type: 'answer',
        timestamp: new Date(),
      },
    ])

    setInput('')

    // Check if more questions in current batch
    if (currentQuestionIndex < currentQuestions.length - 1) {
      // Show next question
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      const nextQ = currentQuestions[currentQuestionIndex + 1]!
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: nextQ.content,
          type: 'question',
          timestamp: new Date(),
        },
      ])
    } else {
      // All questions answered, evaluate context
      await evaluateContextQuality(newAnswers)
    }
  }

  /**
   * Evaluate context quality and generate follow-ups
   */
  const evaluateContextQuality = async (currentAnswers: Record<string, string>) => {
    setIsEvaluating(true)

    try {
      const result = await evaluateContext.mutateAsync({
        question: mainQuestion,
        answers: currentAnswers,
        currentPhase: phase === 'critical' ? 'critical' : phase === 'deep' ? 'deep' : 'refine',
      })

      setEvaluation(result)
      setContextScore(result.score)

      // Show evaluation message
      setMessages((prev) => [
        ...prev,
        {
          id: `eval-${Date.now()}`,
          role: 'ai',
          content: `📊 **Contexto evaluado: ${result.score}/100**\n\n${result.reasoning}${
            result.missingAspects.length > 0
              ? `\n\n**Podríamos profundizar en:**\n${result.missingAspects.map((a) => `• ${a}`).join('\n')}`
              : ''
          }`,
          type: 'evaluation',
          timestamp: new Date(),
        },
      ])

      // If should continue and has follow-ups, show them
      if (result.shouldContinue && result.followUpQuestions.length > 0) {
        setCurrentQuestions(result.followUpQuestions)
        setCurrentQuestionIndex(0)
        setPhase(phase === 'critical' ? 'deep' : 'refine')

        // Show first follow-up
        const firstFollowUp = result.followUpQuestions[0]!
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: 'ai',
              content: firstFollowUp.content,
              type: 'question',
              timestamp: new Date(),
            },
          ])
        }, 1000)
      } else {
        // Context is good enough
        setPhase('ready')
      }

      setIsEvaluating(false)
    } catch (error) {
      toast.error('Error al evaluar contexto')
      setIsEvaluating(false)
    }
  }

  /**
   * Handle manual context addition
   */
  const handleAddContext = async () => {
    if (!input.trim()) return

    const newAnswers = { ...answers, [`manual_${Date.now()}`]: input }
    setAnswers(newAnswers)

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: input,
        type: 'answer',
        timestamp: new Date(),
      },
    ])

    setInput('')

    // Re-evaluate with new context
    await evaluateContextQuality(newAnswers)
  }

  /**
   * Skip to expert selection
   */
  const handleSkipToExperts = () => {
    if (contextScore < 40) {
      toast.error('Necesitas proporcionar más contexto antes de continuar (mínimo 40%)')
      return
    }

    setShowExpertSelector(true)
  }

  /**
   * Handle expert selection and create debate
   */
  const handleExpertsSelected = async (expertIds: string[]) => {
    setSelectedExpertIds(expertIds)
    setShowExpertSelector(false)
    setIsCreatingDebate(true)

    try {
      // Build full context from answers
      const fullContext = Object.entries(answers)
        .map(([id, answer]) => `${id}: ${answer}`)
        .join('\n')

      const debate = await createDebate.mutateAsync({
        question: mainQuestion,
        category: 'strategy', // TODO: Detect from question
        selectedExpertIds: expertIds,
        context: {
          summary: fullContext,
          score: contextScore,
        },
      })

      toast.success('¡Debate creado! Redirigiendo...')
      router.push(`/debates/${debate.id}`)
    } catch (error) {
      toast.error('Error al crear debate')
      setIsCreatingDebate(false)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════

  const currentQuestion = currentQuestions[currentQuestionIndex]
  const canStartExpertSelection = contextScore >= 60 && phase !== 'initial'
  const showContextInput = phase !== 'initial' && !showExpertSelector

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header with Score */}
        {phase !== 'initial' && (
          <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Calidad del Contexto
                </h2>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {contextScore}%
                </p>
              </div>

              {/* Progress bar */}
              <div className="flex-1 mx-8">
                <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={cn(
                      'h-3 rounded-full transition-all duration-500',
                      contextScore >= 80
                        ? 'bg-green-500'
                        : contextScore >= 60
                        ? 'bg-blue-500'
                        : contextScore >= 40
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    )}
                    style={{ width: `${contextScore}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {contextScore >= 80
                    ? '¡Excelente! Contexto muy completo'
                    : contextScore >= 60
                    ? 'Buen contexto para deliberar'
                    : contextScore >= 40
                    ? 'Contexto básico, puedes mejorar'
                    : 'Necesitas más información'}
                </p>
              </div>

              {/* Phase indicator */}
              <div className="text-right">
                <span
                  className={cn(
                    'inline-block rounded-full px-3 py-1 text-xs font-medium',
                    phase === 'critical'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : phase === 'deep'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : phase === 'refine'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  )}
                >
                  {phase === 'critical'
                    ? 'Fase 1: Crítica'
                    : phase === 'deep'
                    ? 'Fase 2: Profundización'
                    : phase === 'refine'
                    ? 'Fase 3: Refinamiento'
                    : 'Listo'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="rounded-lg border bg-white shadow-lg dark:bg-gray-800">
          {/* Initial Question Input */}
          {phase === 'initial' && (
            <div className="p-8">
              <div className="mb-6 text-center">
                <Sparkles className="mx-auto mb-4 h-12 w-12 text-blue-500" />
                <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                  Nuevo Debate Estratégico
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Describe la decisión que necesitas tomar y te ayudaré a recopilar el contexto necesario
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  value={mainQuestion}
                  onChange={(e) => setMainQuestion(e.target.value)}
                  placeholder="¿Qué decisión estratégica necesitas tomar?"
                  className="text-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void handleInitialQuestion()
                    }
                  }}
                />
                <Button
                  onClick={() => void handleInitialQuestion()}
                  disabled={!mainQuestion.trim() || isGeneratingQuestions}
                  className="w-full"
                  size="lg"
                >
                  {isGeneratingQuestions ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analizando pregunta...
                    </>
                  ) : (
                    <>
                      Comenzar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Chat Interface */}
          {phase !== 'initial' && !showExpertSelector && (
            <div className="flex flex-col" style={{ height: '600px' }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-4 py-3',
                        msg.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : msg.type === 'evaluation'
                          ? 'bg-purple-50 text-purple-900 dark:bg-purple-900 dark:text-purple-50'
                          : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {isEvaluating && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-gray-100 px-4 py-3 dark:bg-gray-700">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Current Question Buttons */}
              {currentQuestion && !isEvaluating && phase !== 'ready' && (
                <div className="border-t p-4 bg-gray-50 dark:bg-gray-900">
                  {currentQuestion.questionType === 'yes_no' && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => void handleAnswer('Sí')}
                        variant="outline"
                        className="flex-1"
                      >
                        ✅ Sí
                      </Button>
                      <Button
                        onClick={() => void handleAnswer('No')}
                        variant="outline"
                        className="flex-1"
                      >
                        ❌ No
                      </Button>
                    </div>
                  )}

                  {currentQuestion.questionType === 'multiple_choice' &&
                    currentQuestion.options && (
                      <div className="grid grid-cols-2 gap-3">
                        {currentQuestion.options.map((option) => (
                          <Button
                            key={option}
                            onClick={() => void handleAnswer(option)}
                            variant="outline"
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    )}
                </div>
              )}

              {/* Input for free text or additional context */}
              {showContextInput && (
                <div className="border-t p-4">
                  <div className="flex gap-3">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={
                        currentQuestion?.questionType === 'free_text'
                          ? 'Escribe tu respuesta...'
                          : 'Añadir contexto adicional (opcional)...'
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          if (currentQuestion?.questionType === 'free_text') {
                            void handleAnswer(input)
                          } else {
                            void handleAddContext()
                          }
                        }
                      }}
                      disabled={isEvaluating}
                    />
                    <Button
                      onClick={() =>
                        currentQuestion?.questionType === 'free_text'
                          ? void handleAnswer(input)
                          : void handleAddContext()
                      }
                      disabled={!input.trim() || isEvaluating}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* CTA to start expert selection */}
                  {canStartExpertSelection && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        onClick={handleSkipToExperts}
                        className="w-full"
                        size="lg"
                        variant="default"
                      >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Tengo suficiente contexto → Seleccionar Expertos
                      </Button>
                      <p className="mt-2 text-center text-xs text-gray-500">
                        O sigue añadiendo contexto para mejorar el resultado
                      </p>
                    </div>
                  )}

                  {contextScore < 60 && contextScore > 0 && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>
                        Recomendamos llegar al menos a 60% de contexto para obtener mejores resultados
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Expert Selector */}
          {showExpertSelector && (
            <div className="p-6">
              <ExpertSelector
                isOpen={showExpertSelector}
                onClose={() => setShowExpertSelector(false)}
                selectedExpertIds={selectedExpertIds}
                onSelectionChange={setSelectedExpertIds}
                onConfirm={handleExpertsSelected}
                question={mainQuestion}
                context={Object.values(answers).join('\n')}
                selectionMode="auto"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
