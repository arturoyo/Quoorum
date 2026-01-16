'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Send, Loader2, Sparkles, MessageSquare, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
interface Message {
  id: string
  role: 'ai' | 'user'
  content: string
  type?: 'question' | 'assumption' | 'info' | 'summary'
  questionType?: 'yes_no' | 'multiple_choice' | 'free_text' // AI decides optimal input type
  options?: string[] // Only for multiple_choice questions
  timestamp: Date
}

interface ContextState {
  question: string
  context: string
  category: string
  responses: Record<string, string | boolean>
  currentScore: number
  readyToStart: boolean
  debateId?: string
  debateTitle?: string
  optimizedPrompt?: string // Meta-prompt optimized by AI before deliberation
  isGeneratingPrompt?: boolean // Generating meta-prompt
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════
export default function NewDebatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const retryDebateId = searchParams.get('retry')
  const draftId = searchParams.get('draft')
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Debug: log searchParams to identify caching issues
  useEffect(() => {
    console.log('[NewDebate] searchParams.retry =', retryDebateId)
    console.log('[NewDebate] window.location.search =', window.location.search)
  }, [retryDebateId])

  const [messages, setMessages] = useState<Message[]>([])

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [contextState, setContextState] = useState<ContextState>({
    question: '',
    context: '',
    category: '',
    responses: {},
    currentScore: 0,
    readyToStart: false,
  })

  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null)
  const [assessment, setAssessment] = useState<any>(null)

  // Validate retry param from actual URL (not cached searchParams)
  const [actualRetryId, setActualRetryId] = useState<string | null>(null)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const retryParam = urlParams.get('retry')
      setActualRetryId(retryParam)
    }
  }, [])

  // Load debate data if retrying (only if URL actually has retry param)
  const { data: retryDebate, isLoading: isLoadingRetry } = api.debates.get.useQuery(
    { id: actualRetryId! },
    { enabled: !!actualRetryId }
  )

  // Load draft debate if coming from sidebar
  const { data: draftDebate, isLoading: isLoadingDraft } = api.debates.get.useQuery(
    { id: draftId! },
    { enabled: !!draftId }
  )

  // Pre-fill with retry debate context
  useEffect(() => {
    if (retryDebate && retryDebate.context) {
      const contextText = retryDebate.context.background || ''
      const fullText = contextText ? `${retryDebate.question}\n\nContexto: ${contextText}` : retryDebate.question

      setInput(fullText)
      setContextState((prev) => ({
        ...prev,
        question: retryDebate.question,
        context: contextText,
        category: retryDebate.context.sources?.[0]?.content || 'general',
      }))

      toast.info('📝 Debate anterior cargado. Presiona Enter para continuar o modifica la pregunta.')
    }
  }, [retryDebate])

  // Pre-fill with draft debate
  useEffect(() => {
    if (draftDebate && draftDebate.status === 'draft') {
      setInput(draftDebate.question)
      setContextState((prev) => ({
        ...prev,
        debateId: draftDebate.id,
        debateTitle: draftDebate.metadata?.title || draftDebate.question,
        question: draftDebate.question,
      }))

      toast.info('📝 Borrador cargado. Continúa escribiendo o presiona Enter.')
    }
  }, [draftDebate])

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      }
    }
    void checkAuth()
  }, [router, supabase.auth])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils()

  // tRPC mutations
  const createDraftMutation = api.debates.createDraft.useMutation({
    onSuccess: (data) => {
      console.log('[DEBUG] createDraftMutation.onSuccess', data)
      setContextState((prev) => ({
        ...prev,
        debateId: data.id,
        debateTitle: data.title,
      }))
      // Invalidate debates list cache so draft appears immediately
      void utils.debates.list.invalidate()
      // Show subtle toast notification
      toast.success('✅ Draft guardado', { duration: 2000 })
    },
    onError: (error) => {
      console.error('[DEBUG] createDraftMutation.onError', error)
      // Don't show error toast for draft auto-save to avoid annoying user
    },
  })

  // ═══════════════════════════════════════════════════════════
  // AUTO-SAVE DRAFT when user starts typing
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    // Only auto-save for the initial question (not responses to AI)
    if (messages.length > 0) return

    // Don't save if input is too short (minimum 20 chars required)
    if (input.trim().length < 20) return

    // Don't create duplicate draft
    if (contextState.debateId) return

    // Debounce: wait 2 seconds after user stops typing
    const timeoutId = setTimeout(() => {
      console.log('[AUTO-SAVE] Creating draft with question:', input)
      createDraftMutation.mutate({ question: input })
    }, 2000)

    // Cleanup timeout if user keeps typing
    return () => clearTimeout(timeoutId)
  }, [input, messages.length, contextState.debateId])

  const analyzeMutation = api.contextAssessment.analyze.useMutation({
    onSuccess: (data) => {
      console.log('[DEBUG] analyzeMutation.onSuccess', data)
      setAssessment(data)
      setContextState((prev) => ({ ...prev, currentScore: data.overallScore }))

      // AI sends next question or assumption
      if (data.assumptions.length > 0) {
        const firstAssumption = data.assumptions[0]
        if (firstAssumption) {
          const newMsg: Message = {
            id: `msg-${Date.now()}`,
            role: 'ai',
            content: firstAssumption.assumption,
            type: 'assumption',
            questionType: firstAssumption.questionType || 'yes_no', // Default to yes/no
            options: firstAssumption.questionType === 'multiple_choice' ? firstAssumption.alternatives : undefined,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, newMsg])
          setPendingQuestionId(firstAssumption.id)
        }
      } else if (data.clarifyingQuestions.length > 0) {
        const firstQuestion = data.clarifyingQuestions[0]
        if (firstQuestion) {
          const newMsg: Message = {
            id: `msg-${Date.now()}`,
            role: 'ai',
            content: firstQuestion.question,
            type: 'question',
            questionType: firstQuestion.questionType || 'free_text', // Default to free text
            options: firstQuestion.questionType === 'multiple_choice' && firstQuestion.multipleChoice
              ? firstQuestion.multipleChoice.options
              : undefined,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, newMsg])
          setPendingQuestionId(firstQuestion.id)
        }
      } else {
        // No more questions, ready to start
        setContextState((prev) => ({ ...prev, readyToStart: true }))
        const newMsg: Message = {
          id: `msg-${Date.now()}`,
          role: 'ai',
          content: `¡Perfecto! Tengo suficiente contexto (${data.overallScore}% de calidad). ¿Quieres que empiece la deliberación con los expertos?`,
          type: 'summary',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, newMsg])
      }

      setIsLoading(false)
    },
    onError: (error) => {
      console.error('[DEBUG] analyzeMutation.onError', error)
      toast.error(`Error: ${error.message}`)
      setIsLoading(false)
    },
  })

  const refineMutation = api.contextAssessment.refine.useMutation({
    onSuccess: (data) => {
      console.log('[DEBUG] refineMutation.onSuccess', data)
      setAssessment(data)
      setContextState((prev) => ({ ...prev, currentScore: data.overallScore }))

      // Find next unanswered question/assumption
      const unansweredAssumption = data.assumptions.find(
        (a) => !contextState.responses[a.id]
      )
      const unansweredQuestion = data.clarifyingQuestions.find(
        (q) => !contextState.responses[q.id]
      )

      console.log('[DEBUG] Unanswered assumption:', unansweredAssumption)
      console.log('[DEBUG] Unanswered question:', unansweredQuestion)

      if (unansweredAssumption) {
        const newMsg: Message = {
          id: `msg-${Date.now()}`,
          role: 'ai',
          content: unansweredAssumption.assumption,
          type: 'assumption',
          questionType: unansweredAssumption.questionType || 'yes_no',
          options: unansweredAssumption.questionType === 'multiple_choice' ? unansweredAssumption.alternatives : undefined,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, newMsg])
        setPendingQuestionId(unansweredAssumption.id)
      } else if (unansweredQuestion) {
        const newMsg: Message = {
          id: `msg-${Date.now()}`,
          role: 'ai',
          content: unansweredQuestion.question,
          type: 'question',
          questionType: unansweredQuestion.questionType || 'free_text',
          options: unansweredQuestion.questionType === 'multiple_choice' && unansweredQuestion.multipleChoice
            ? unansweredQuestion.multipleChoice.options
            : undefined,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, newMsg])
        setPendingQuestionId(unansweredQuestion.id)
      } else {
        // All answered
        console.log('[DEBUG] All questions answered, ready to start')
        setContextState((prev) => ({ ...prev, readyToStart: true }))
        const newMsg: Message = {
          id: `msg-${Date.now()}`,
          role: 'ai',
          content: `¡Excelente! Tengo toda la información necesaria (${data.overallScore}% de calidad). Puedes iniciar la deliberación ahora, o si prefieres, añadir más contexto escribiendo abajo.`,
          type: 'summary',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, newMsg])
      }

      setIsLoading(false)
    },
    onError: (error) => {
      console.error('[DEBUG] refineMutation.onError', error)
      toast.error(`Error: ${error.message}`)
      setIsLoading(false)
    },
  })

  const createDebateMutation = api.debates.create.useMutation({
    onSuccess: (data) => {
      console.log('[DEBUG] Debate created successfully:', data)
      toast.success('¡Debate creado! Los expertos están deliberando...')
      router.push(`/debates/${data.id}`)
    },
    onError: (error) => {
      console.error('[DEBUG] debates.create error:', error)
      // Show detailed error to user
      if (error.message.includes('Database')) {
        toast.error('❌ Base de datos no disponible. Por favor, activa Supabase primero.')
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        toast.error('Error de conexión. Verifica tu conexión a internet.')
      } else {
        toast.error(`Error al crear debate: ${error.message}`)
      }
      setIsLoading(false)
    },
  })

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    // First message is the main question
    if (messages.length === 0) {
      console.log('[DEBUG] Setting question:', input)
      setContextState((prev) => ({ ...prev, question: input }))

      // First, save the debate as draft
      console.log('[DEBUG] Creating draft debate with question:', input)
      createDraftMutation.mutate(
        { question: input },
        {
          onSuccess: (draftData) => {
            console.log('[DEBUG] Draft created successfully:', draftData)
            // Now analyze the question
            analyzeMutation.mutate({
              userInput: input,
              debateType: 'general',
            })
          },
          onError: (error) => {
            console.error('[DEBUG] Failed to create draft:', error)
            // Continue with analysis even if draft creation fails
            analyzeMutation.mutate({
              userInput: input,
              debateType: 'general',
            })
          },
        }
      )
    } else if (pendingQuestionId) {
      // Check if pending is an assumption or a question
      const isAssumption = assessment?.assumptions.some((a: any) => a.id === pendingQuestionId)

      if (isAssumption) {
        // User is adding additional context during assumption
        // Don't clear pendingQuestionId, just add the context
        console.log('[DEBUG] Adding additional context during assumption:', input)

        if (assessment) {
          const assumptionResponses: Record<string, boolean> = {}
          const questionResponses: Record<string, string> = {}

          Object.entries(contextState.responses).forEach(([id, value]) => {
            if (typeof value === 'boolean') {
              assumptionResponses[id] = value
            } else {
              questionResponses[id] = String(value)
            }
          })

          refineMutation.mutate({
            originalInput: contextState.question,
            answers: {
              assumptionResponses,
              questionResponses,
              additionalContext: input, // User's additional context
            },
            previousAssessment: assessment,
          })
        }
      } else {
        // Answer to a pending question
        const updatedResponses = { ...contextState.responses, [pendingQuestionId]: input }

        setContextState((prev) => ({
          ...prev,
          responses: updatedResponses,
        }))

        setPendingQuestionId(null)

        console.log('[DEBUG] Answering question:', pendingQuestionId, 'with:', input)
        console.log('[DEBUG] Updated responses:', updatedResponses)

        // Refine with new answer
        if (assessment) {
          // Separate assumptions (boolean) from questions (string)
          const assumptionResponses: Record<string, boolean> = {}
          const questionResponses: Record<string, string> = {}

          Object.entries(updatedResponses).forEach(([id, value]) => {
            if (typeof value === 'boolean') {
              assumptionResponses[id] = value
            } else {
              questionResponses[id] = String(value)
            }
          })

          console.log('[DEBUG] Calling refine with:', { assumptionResponses, questionResponses })

          refineMutation.mutate({
            originalInput: contextState.question,
            answers: {
              assumptionResponses,
              questionResponses,
              additionalContext: '',
            },
            previousAssessment: assessment,
          })
        }
      }
    } else if (contextState.readyToStart && assessment) {
      // User is adding additional context AFTER system said "ready to start"
      console.log('[DEBUG] Adding additional context after readyToStart:', input)

      // Separate assumptions (boolean) from questions (string)
      const assumptionResponses: Record<string, boolean> = {}
      const questionResponses: Record<string, string> = {}

      Object.entries(contextState.responses).forEach(([id, value]) => {
        if (typeof value === 'boolean') {
          assumptionResponses[id] = value
        } else {
          questionResponses[id] = String(value)
        }
      })

      // Call refine with additional context
      refineMutation.mutate({
        originalInput: contextState.question,
        answers: {
          assumptionResponses,
          questionResponses,
          additionalContext: input, // User's additional context
        },
        previousAssessment: assessment,
      })
    }
  }

  const handleAssumptionResponse = async (assumptionId: string, response: boolean | string) => {
    // Display the actual response text in the user message
    let displayContent: string
    if (typeof response === 'boolean') {
      displayContent = response ? 'Sí, es correcto' : 'No, es incorrecto'
    } else {
      displayContent = response // The selected alternative text
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: displayContent,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    const updatedResponses = { ...contextState.responses, [assumptionId]: response }

    setContextState((prev) => ({
      ...prev,
      responses: updatedResponses,
    }))

    setPendingQuestionId(null)

    console.log('[DEBUG] Answering assumption:', assumptionId, 'with:', response)
    console.log('[DEBUG] Updated responses:', updatedResponses)

    // Refine with assumption response
    if (assessment) {
      // Separate assumptions (boolean or string) from questions (string)
      const assumptionResponses: Record<string, boolean | string> = {}
      const questionResponses: Record<string, string> = {}

      Object.entries(updatedResponses).forEach(([id, value]) => {
        // Check if this is an assumption or a question
        const isAssumption = assessment.assumptions.some((a: any) => a.id === id)

        if (isAssumption) {
          assumptionResponses[id] = value as boolean | string
        } else {
          questionResponses[id] = String(value)
        }
      })

      console.log('[DEBUG] Calling refine with:', { assumptionResponses, questionResponses })

      refineMutation.mutate({
        originalInput: contextState.question,
        answers: {
          assumptionResponses,
          questionResponses,
          additionalContext: '',
        },
        previousAssessment: assessment,
      })
    }
  }

  const handleStartDeliberation = async () => {
    console.log('[DEBUG] handleStartDeliberation called')
    console.log('[DEBUG] contextState:', contextState)
    console.log('[DEBUG] messages.length:', messages.length)

    // Validar que hay una pregunta
    if (!contextState.question || contextState.question.trim().length < 10) {
      const errorMsg = `Por favor, escribe primero tu pregunta (mínimo 10 caracteres). Pregunta actual: "${contextState.question}" (${contextState.question?.length || 0} caracteres)`
      console.error('[DEBUG] Validation failed:', errorMsg)
      toast.error(errorMsg)
      return
    }

    console.log('[DEBUG] Validation passed, starting meta-prompt generation')
    setIsLoading(true)
    setContextState((prev) => ({ ...prev, isGeneratingPrompt: true }))

    console.log('[DEBUG] Generating optimized prompt with question:', contextState.question)
    console.log('[DEBUG] Context responses:', contextState.responses)
    console.log('[DEBUG] Assessment:', assessment)

    // Add AI message explaining meta-prompt generation
    const aiMetaMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'ai',
      content: 'Perfecto! Ahora voy a crear un prompt optimizado para el debate basándome en toda la información que me has dado...',
      type: 'info',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, aiMetaMsg])

    const enrichedContext = Object.entries(contextState.responses)
      .map(([id, value]) => {
        const assumption = assessment?.assumptions.find((a: any) => a.id === id)
        const question = assessment?.clarifyingQuestions.find((q: any) => q.id === id)
        if (assumption) return `${assumption.assumption}: ${value ? 'Sí' : 'No'}`
        if (question) return `${question.question}: ${value}`
        return ''
      })
      .filter(Boolean)
      .join('\n')

    // Build complete context for meta-prompt
    const completeContext = enrichedContext
      ? `${contextState.question}\n\nContexto adicional:\n${enrichedContext}`
      : contextState.question

    console.log('[DEBUG] Complete context for meta-prompt:', completeContext)

    // STEP 1: Generate optimized meta-prompt
    try {
      const metaPromptResult = await generateOptimizedPrompt(completeContext)
      console.log('[DEBUG] Generated optimized prompt:', metaPromptResult)

      // Show optimized prompt in chat
      const aiOptimizedMsg: Message = {
        id: `msg-${Date.now()}`,
        role: 'ai',
        content: `He generado este prompt optimizado para el debate:\n\n"${metaPromptResult}"\n\nIniciando la deliberación con los expertos...`,
        type: 'info',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiOptimizedMsg])

      // Save optimized prompt
      setContextState((prev) => ({
        ...prev,
        optimizedPrompt: metaPromptResult,
        isGeneratingPrompt: false,
      }))

      // STEP 2: Start deliberation with optimized prompt
      console.log('[DEBUG] About to call createDebateMutation.mutate with optimized prompt')

      createDebateMutation.mutate({
        draftId: contextState.debateId, // Use existing draft if available
        question: metaPromptResult, // Use optimized prompt instead of original
        context: enrichedContext,
        category: 'general',
        expertCount: 6, // Metadata only - not used by deliberation system
        maxRounds: 5, // Metadata only - not used by deliberation system
      })
      console.log('[DEBUG] createDebateMutation.mutate called successfully with draftId:', contextState.debateId)
    } catch (error) {
      console.error('[DEBUG] Error generating optimized prompt or creating debate:', error)
      toast.error(`Error al generar el prompt: ${String(error)}`)
      setIsLoading(false)
      setContextState((prev) => ({ ...prev, isGeneratingPrompt: false }))
    }
  }

  // Mutation for generating optimized meta-prompt
  const generatePromptMutation = api.debates.generateOptimizedPrompt.useMutation()

  // Generate optimized meta-prompt using AI
  const generateOptimizedPrompt = async (contextInfo: string): Promise<string> => {
    try {
      console.log('[DEBUG] Calling debates.generateOptimizedPrompt')

      // Call AI via tRPC to generate optimized prompt
      const result = await generatePromptMutation.mutateAsync({
        contextInfo,
      })

      console.log('[DEBUG] Meta-prompt generation result:', result)
      return result || contextInfo // Fallback to original if AI fails
    } catch (error) {
      console.error('[DEBUG] Error calling AI for meta-prompt:', error)
      toast.error('Error al generar prompt optimizado, usando pregunta original')
      // Fallback to original context if AI fails
      return contextInfo
    }
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  const lastMessage = messages[messages.length - 1]
  const isAssumptionPending = lastMessage?.role === 'ai' && lastMessage.type === 'assumption'

  return (
    <div className="flex h-full flex-col relative bg-slate-950">
      {/* Compact Header with Progress (inside right panel) with gradient */}
      <div className="relative border-b border-white/10 bg-slate-900/60 backdrop-blur-xl px-4 py-3">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full blur-md opacity-50 animate-pulse" />
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-semibold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                {contextState.debateTitle || 'Nueva Deliberación'}
              </h1>
              <p className="text-xs bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                {contextState.currentScore > 0 ? `${contextState.currentScore}% contexto` : 'Responde las preguntas'}
              </p>
            </div>
          </div>

          {/* Progress Circle with gradient */}
          {contextState.currentScore > 0 && (
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 opacity-20 blur-sm" />
              <div className="relative h-10 w-10 rounded-full border-4 border-white/10 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                {contextState.currentScore >= 70 ? (
                  <CheckCircle2 className="h-5 w-5 text-blue-400" />
                ) : (
                  <span className="text-xs font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                    {contextState.currentScore}%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar with gradient */}
        {contextState.currentScore > 0 && (
          <div className="relative mt-2">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${contextState.currentScore}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Loading retry banner */}
          {actualRetryId && isLoadingRetry && (
            <div className="relative rounded-lg border-2 border-purple-500/30 bg-purple-900/20 backdrop-blur-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white mb-1">
                    Cargando debate anterior...
                  </h2>
                  <p className="text-sm text-gray-300">
                    Estamos recuperando el contexto del debate para que puedas reintentarlo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Retry info banner */}
          {actualRetryId && retryDebate && !isLoadingRetry && messages.length === 0 && (
            <div className="relative rounded-lg border-2 border-green-500/30 bg-green-900/20 backdrop-blur-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-600">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-2">
                    🔄 Reintentando debate
                  </h2>
                  <p className="text-sm text-gray-300 mb-2">
                    El contexto del debate anterior se ha cargado en el campo de texto.
                    Puedes modificarlo si quieres o presionar Enter para continuar.
                  </p>
                  <p className="text-xs text-gray-400 italic">
                    Debate original: "{retryDebate.question}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Welcome Card (only show at the beginning if not retrying) */}
          {messages.length === 0 && !actualRetryId && (
            <div className="relative rounded-lg border-2 border-blue-500/30 bg-blue-900/20 backdrop-blur-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-2">
                    ¡Bienvenido al Asistente de Deliberación!
                  </h2>
                  <p className="text-sm text-gray-300">
                    Te ayudaré a estructurar tu pregunta para obtener la mejor deliberación posible de nuestros expertos IA.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                  'rounded-lg px-4 py-3 relative',
                  msg.role === 'user'
                    ? 'max-w-[80%] bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : msg.id === '1'
                    ? 'max-w-[85%] bg-blue-600 text-white border-2 border-blue-400/30 shadow-lg shadow-blue-500/30'
                    : 'max-w-[80%] bg-blue-700 text-white shadow-md'
                )}
              >
                {msg.role === 'ai' && msg.type === 'assumption' && (
                  <div className="mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-200" />
                    <span className="text-xs text-blue-200 font-medium">
                      Suposición
                    </span>
                  </div>
                )}
                {msg.role === 'ai' && msg.id === '1' && (
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-white" />
                    <span className="text-xs font-semibold text-white">Asistente IA</span>
                  </div>
                )}
                <p className={cn(
                  "whitespace-pre-wrap",
                  msg.id === '1' ? "text-base font-medium" : ""
                )}>{msg.content}</p>

                {/* Dynamic Question Inputs - AI decides optimal type */}
                {msg.role === 'ai' && msg.type === 'assumption' && msg === lastMessage && (
                  <div className="mt-3 space-y-2">
                    {/* YES/NO questions - Simple binary choice */}
                    {msg.questionType === 'yes_no' && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (pendingQuestionId) {
                              void handleAssumptionResponse(pendingQuestionId, true)
                            }
                          }}
                          className="transition-all bg-green-600 hover:bg-green-500 text-white border-0 shadow-md"
                          disabled={isLoading}
                        >
                          ✓ Sí, correcto
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (pendingQuestionId) {
                              void handleAssumptionResponse(pendingQuestionId, false)
                            }
                          }}
                          className="transition-all border-red-500/30 bg-red-600/20 text-red-200 hover:bg-red-600/30 hover:text-red-100"
                          disabled={isLoading}
                        >
                          ✗ No, incorrecto
                        </Button>
                      </div>
                    )}

                    {/* MULTIPLE CHOICE questions - Select from alternatives */}
                    {msg.questionType === 'multiple_choice' && msg.options && (
                      <div className="flex flex-wrap gap-2">
                        {msg.options.map((option, index) => (
                          <Button
                            key={index}
                            size="sm"
                            onClick={() => {
                              if (pendingQuestionId) {
                                void handleAssumptionResponse(pendingQuestionId, option)
                              }
                            }}
                            className={cn(
                              'transition-all whitespace-normal text-left break-words h-auto min-h-[2rem] py-2',
                              index === 0
                                ? 'bg-purple-600 hover:bg-purple-500 text-white border-0 shadow-md'
                                : 'border-blue-500/30 bg-blue-600/20 text-blue-200 hover:bg-blue-600/30 hover:text-blue-100'
                            )}
                            disabled={isLoading}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* FREE TEXT questions - Open ended */}
                    {msg.questionType === 'free_text' && (
                      <p className="text-xs text-purple-300 italic flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Escribe tu respuesta abajo para continuar
                      </p>
                    )}

                    <p className="text-xs text-gray-400 italic flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      También puedes dar más contexto escribiendo abajo antes de responder
                    </p>
                  </div>
                )}

                {/* Dynamic Question Inputs - Also for clarifying questions */}
                {msg.role === 'ai' && msg.type === 'question' && msg === lastMessage && (
                  <div className="mt-3 space-y-2">
                    {/* YES/NO questions */}
                    {msg.questionType === 'yes_no' && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (pendingQuestionId) {
                              void handleQuestionResponse(pendingQuestionId, 'Sí')
                            }
                          }}
                          className="transition-all bg-green-600 hover:bg-green-500 text-white border-0 shadow-md"
                          disabled={isLoading}
                        >
                          ✓ Sí
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (pendingQuestionId) {
                              void handleQuestionResponse(pendingQuestionId, 'No')
                            }
                          }}
                          className="transition-all border-red-500/30 bg-red-600/20 text-red-200 hover:bg-red-600/30 hover:text-red-100"
                          disabled={isLoading}
                        >
                          ✗ No
                        </Button>
                      </div>
                    )}

                    {/* MULTIPLE CHOICE questions */}
                    {msg.questionType === 'multiple_choice' && msg.options && (
                      <div className="flex flex-wrap gap-2">
                        {msg.options.map((option, index) => (
                          <Button
                            key={index}
                            size="sm"
                            onClick={() => {
                              if (pendingQuestionId) {
                                void handleQuestionResponse(pendingQuestionId, option)
                              }
                            }}
                            className={cn(
                              'transition-all whitespace-normal text-left break-words h-auto min-h-[2rem] py-2',
                              index === 0
                                ? 'bg-purple-600 hover:bg-purple-500 text-white border-0 shadow-md'
                                : 'border-blue-500/30 bg-blue-600/20 text-blue-200 hover:bg-blue-600/30 hover:text-blue-100'
                            )}
                            disabled={isLoading}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* FREE TEXT questions */}
                    {msg.questionType === 'free_text' && (
                      <p className="text-xs text-purple-300 italic flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Escribe tu respuesta abajo
                      </p>
                    )}

                    <p className="text-xs text-gray-400 italic">
                      O escribe una respuesta personalizada abajo
                    </p>
                  </div>
                )}

                <div className="mt-1 text-xs text-[#aebac1]">
                  {msg.timestamp.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-slate-900/60 backdrop-blur-sm border border-white/10 px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="relative border-t border-white/10 bg-slate-900/60 backdrop-blur-xl px-4 py-3">
        <div className="mx-auto max-w-3xl space-y-2">
          {/* Show "Start Deliberation" button ONLY when AI determines context is sufficient */}
          {contextState.readyToStart && (
            <Button
              onClick={() => {
                console.log('[DEBUG] Button clicked!')
                handleStartDeliberation()
              }}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white border-0 shadow-lg shadow-purple-500/30"
            >
              <span className="flex items-center justify-center">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando deliberación...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Iniciar Deliberación
                  </>
                )}
              </span>
            </Button>
          )}

          {/* Character counter and validation (only show for first message) */}
          {messages.length === 0 && input.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full transition-colors',
                    input.length < 20
                      ? 'bg-red-500'
                      : input.length < 30
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  )}
                />
                <span
                  className={cn(
                    'text-xs font-medium transition-colors',
                    input.length < 20
                      ? 'text-red-400'
                      : input.length < 30
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  )}
                >
                  {input.length < 20 ? (
                    <>Mínimo 20 caracteres requeridos ({input.length}/20)</>
                  ) : (
                    <>✓ Longitud válida ({input.length} caracteres)</>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* ALWAYS show input so user can continue adding context */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  // Only allow submission if first message meets minimum length
                  if (messages.length === 0 && input.trim().length < 20) {
                    toast.error('La pregunta debe tener al menos 20 caracteres')
                    return
                  }
                  void handleSendMessage()
                }
              }}
              placeholder={
                isAssumptionPending
                  ? 'Añade contexto adicional (opcional) o usa los botones Sí/No arriba...'
                  : messages.length === 0
                  ? '¿Cuál es la decisión que necesitas tomar? Escribe aquí...'
                  : 'Escribe más contexto o responde la pregunta...'
              }
              disabled={isLoading}
              className={cn(
                "flex-1 border-2 bg-slate-900/60 backdrop-blur-sm text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 transition-all",
                messages.length === 0 && input.length > 0 && input.length < 20
                  ? "border-red-500/50 focus:border-red-500"
                  : "border-purple-500/30 focus:border-purple-500"
              )}
              autoFocus
            />
            <Button
              onClick={() => {
                // Validate minimum length for first message
                if (messages.length === 0 && input.trim().length < 20) {
                  toast.error('La pregunta debe tener al menos 20 caracteres')
                  return
                }
                void handleSendMessage()
              }}
              disabled={isLoading || !input.trim() || (messages.length === 0 && input.trim().length < 20)}
              className="bg-purple-600 hover:bg-purple-500 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
