'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Plus,
  FileText,
  X,
  Upload,
} from "lucide-react";
import { cn } from '@/lib/utils'
import { StrategySelector } from '@/components/quoorum/strategy-selector'
import { ExpertSelector } from '@/components/quoorum/expert-selector'
import { DepartmentSelector } from '@/components/quoorum/department-selector'

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
  showApprovalDialog?: boolean // Show meta-prompt approval dialog
  // Structured prompting fields (from course)
  userRole?: string // "Soy CEO de startup B2B SaaS"
  budget?: string // "€50k - €100k"
  deadline?: string // "3 meses"
  teamSize?: string // "5-10 personas"
  successCriteria?: string[] // ["ROI > 20%", "Churn < 5%"]
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
  const [selectedStrategy, setSelectedStrategy] = useState<string>('')
  const [selectedExpertIds, setSelectedExpertIds] = useState<string[]>([])
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([])
  const [showStructuredFields, setShowStructuredFields] = useState(false)
  
  // File attachments state
  interface AttachedFile {
    id: string
    file: File
    name: string
    size: number
    type: string
    content?: string // Extracted text content
    isProcessing?: boolean
  }
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Random prompt phrases
  const promptPhrases = [
    "¿Qué decisión quieres tomar?",
    "¿Qué pregunta estratégica necesitas resolver?",
    "¿Qué situación quieres analizar?",
    "¿Qué desafío enfrentas?",
    "¿Qué elección necesitas hacer?",
    "¿Qué problema quieres resolver?",
    "¿Qué oportunidad quieres evaluar?",
    "¿Qué dilema necesitas resolver?",
    "¿Qué estrategia quieres validar?",
    "¿Qué camino quieres explorar?",
    "¿Qué opción quieres comparar?",
    "¿Qué escenario quieres analizar?",
    "¿Qué decisión estratégica necesitas?",
    "¿Qué pregunta de negocio tienes?",
    "¿Qué situación compleja enfrentas?",
    "¿Qué elección importante necesitas?",
    "¿Qué desafío estratégico tienes?",
    "¿Qué problema quieres deliberar?",
    "¿Qué oportunidad quieres examinar?",
    "¿Qué decisión crítica necesitas?",
  ]

  const [selectedPrompt, setSelectedPrompt] = useState<string>('¿Qué decisión quieres tomar?')

  // Set random prompt only on client after hydration
  useEffect(() => {
    setSelectedPrompt(promptPhrases[Math.floor(Math.random() * promptPhrases.length)])
  }, [])

  // Example questions pool
  const exampleQuestions = [
    {
      question: "¿Debería pivotar mi startup de B2C a B2B?",
      description: "Análisis estratégico de cambio de modelo"
    },
    {
      question: "¿Qué modelo de pricing maximiza el revenue sin perder clientes?",
      description: "Optimización de estrategia comercial"
    },
    {
      question: "¿Cómo puedo mejorar la retención de usuarios en mi SaaS?",
      description: "Estrategia de crecimiento y retención"
    },
    {
      question: "¿Debería expandirme internacionalmente ahora o esperar?",
      description: "Análisis de timing y expansión"
    },
    {
      question: "¿Qué características de producto priorizo para el próximo trimestre?",
      description: "Roadmap y priorización"
    },
    {
      question: "¿Cómo estructuro mi equipo de ventas para escalar?",
      description: "Organización y escalamiento"
    },
    {
      question: "¿Debería buscar inversión o bootstrappear mi negocio?",
      description: "Estrategia de financiación"
    },
    {
      question: "¿Qué canal de adquisición de clientes es más rentable?",
      description: "Marketing y adquisición"
    },
    {
      question: "¿Cómo puedo diferenciarme de mis competidores?",
      description: "Posicionamiento competitivo"
    },
    {
      question: "¿Qué métricas debería priorizar para medir el éxito?",
      description: "KPIs y medición"
    },
    {
      question: "¿Debería construir o comprar esta funcionalidad?",
      description: "Decisión build vs buy"
    },
    {
      question: "¿Cómo optimizo mi funnel de conversión?",
      description: "Optimización de conversión"
    },
    {
      question: "¿Qué estrategia de contenido genera más engagement?",
      description: "Marketing de contenido"
    },
    {
      question: "¿Debería lanzar el producto ahora o perfeccionarlo más?",
      description: "Timing de lanzamiento"
    },
    {
      question: "¿Cómo estructuro mi modelo de comisiones de ventas?",
      description: "Compensación y incentivos"
    },
    {
      question: "¿Qué tecnología debería adoptar para escalar?",
      description: "Stack tecnológico"
    },
    {
      question: "¿Cómo puedo reducir el churn sin aumentar costos?",
      description: "Retención y eficiencia"
    },
    {
      question: "¿Debería asociarme con esta empresa o competir directamente?",
      description: "Estrategia de alianzas"
    },
    {
      question: "¿Qué segmento de mercado debería atacar primero?",
      description: "Segmentación y targeting"
    },
    {
      question: "¿Cómo puedo mejorar mi propuesta de valor?",
      description: "Desarrollo de producto"
    }
  ]

  // Select 3 random examples - initialize with empty array, set in useEffect to avoid hydration mismatch
  const [selectedExamples, setSelectedExamples] = useState<typeof exampleQuestions>([])

  // Set random examples only on client after hydration
  useEffect(() => {
    const shuffled = [...exampleQuestions].sort(() => Math.random() - 0.5)
    setSelectedExamples(shuffled.slice(0, 3))
  }, [])

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
  const { data: draftDebate } = api.debates.get.useQuery(
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
        category: retryDebate.context?.sources?.[0]?.content || 'general',
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
        debateTitle: (draftDebate.metadata?.title as string) || draftDebate.question,
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

      // Only show assumptions/questions if context score is insufficient (< 70%)
      // If score is high enough, skip to ready state directly
      if (data.overallScore >= 70) {
        // Context is sufficient, ready to start
        setContextState((prev) => ({ ...prev, readyToStart: true }))
        const newMsg: Message = {
          id: `msg-${Date.now()}`,
          role: 'ai',
          content: `¡Perfecto! Tengo suficiente contexto (${data.overallScore}% de calidad). ¿Quieres que empiece la deliberación con los expertos?`,
          type: 'summary',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, newMsg])
        setIsLoading(false)
        return
      }

      // Context insufficient - show assumptions/questions
      if (data.assumptions.length > 0) {
        const firstAssumption = data.assumptions[0]
        if (firstAssumption) {
          // Ensure content is always a string
          const assumptionContent = typeof firstAssumption.assumption === 'string' 
            ? firstAssumption.assumption 
            : JSON.stringify(firstAssumption.assumption)
          
          const newMsg: Message = {
            id: `msg-${Date.now()}`,
            role: 'ai',
            content: assumptionContent,
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
          // Ensure content is always a string
          const questionContent = typeof firstQuestion.question === 'string'
            ? firstQuestion.question
            : JSON.stringify(firstQuestion.question)
          
          const newMsg: Message = {
            id: `msg-${Date.now()}`,
            role: 'ai',
            content: questionContent,
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
          content: `¡Perfecto! Tengo suficiente contexto (${data.overallScore}% de calidad). Puedes continuar a la selección de expertos o añadir más contexto si lo deseas.`,
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

      // If score is sufficient (>= 70%), mark as ready without showing more questions
      if (data.overallScore >= 70) {
        setContextState((prev) => ({ ...prev, readyToStart: true }))
        const newMsg: Message = {
          id: `msg-${Date.now()}`,
          role: 'ai',
          content: `¡Excelente! Tengo toda la información necesaria (${data.overallScore}% de calidad). Puedes iniciar la deliberación ahora, o si prefieres, añadir más contexto escribiendo abajo.`,
          type: 'summary',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, newMsg])
        setIsLoading(false)
        return
      }

      // Score insufficient - continue with questions/assumptions
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
        // Ensure content is always a string
        const assumptionContent = typeof unansweredAssumption.assumption === 'string'
          ? unansweredAssumption.assumption
          : JSON.stringify(unansweredAssumption.assumption)
        
        const newMsg: Message = {
          id: `msg-${Date.now()}`,
          role: 'ai',
          content: assumptionContent,
          type: 'assumption',
          questionType: unansweredAssumption.questionType || 'yes_no',
          options: unansweredAssumption.questionType === 'multiple_choice' ? unansweredAssumption.alternatives : undefined,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, newMsg])
        setPendingQuestionId(unansweredAssumption.id)
      } else if (unansweredQuestion) {
        // Ensure content is always a string
        const questionContent = typeof unansweredQuestion.question === 'string'
          ? unansweredQuestion.question
          : JSON.stringify(unansweredQuestion.question)
        
        const newMsg: Message = {
          id: `msg-${Date.now()}`,
          role: 'ai',
          content: questionContent,
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
          content: `¡Excelente! Tengo toda la información necesaria (${data.overallScore}% de calidad). Puedes continuar a la selección de expertos o añadir más contexto si lo deseas.`,
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

    // Build content with attached files
    let fullContent = typeof input === 'string' ? input : String(input)
    
    // Add attached files content if any
    if (attachedFiles.length > 0) {
      const filesContent = attachedFiles
        .filter(f => f.content && !f.isProcessing)
        .map(f => `\n\n--- Contenido del archivo: ${f.name} ---\n${f.content}`)
        .join('\n\n')
      
      if (filesContent) {
        fullContent = `${fullContent}${filesContent}`
      }
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: fullContent,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    // First message is the main question
    if (messages.length === 0) {
      setContextState((prev) => ({ ...prev, question: input }))
      setIsGeneratingQuestions(true)

      // Generate dynamic contextual questions
      try {
        const questions = await generateQuestionsMutation.mutateAsync({
          question: input,
          context: fullContent !== input ? fullContent : undefined,
        })

        // Add IDs to questions
        const questionsWithIds = questions.map((q: any, index: number) => ({
          ...q,
          id: `q-${index}`,
        }))

        setContextualQuestions(questionsWithIds)
        setCurrentQuestionIndex(0)
        setIsGeneratingQuestions(false)

        // Show first question
        if (questionsWithIds.length > 0) {
          const firstQuestion = questionsWithIds[0]
          const questionMsg: Message = {
            id: `msg-${Date.now()}`,
            role: 'ai',
            content: firstQuestion.content,
            type: firstQuestion.type,
            questionType: firstQuestion.questionType,
            options: firstQuestion.options,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, questionMsg])
        }

        setIsLoading(false)
      } catch (error) {
        setIsGeneratingQuestions(false)
        setIsLoading(false)
        toast.error('Error al generar preguntas. Intenta de nuevo.')
      }
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

  const handleQuestionResponse = async (questionId: string, response: string) => {
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: response,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    const updatedResponses = { ...contextState.responses, [questionId]: response }

    setContextState((prev) => ({
      ...prev,
      responses: updatedResponses,
    }))

    setPendingQuestionId(null)

    console.log('[DEBUG] Answering question:', questionId, 'with:', response)
    console.log('[DEBUG] Updated responses:', updatedResponses)

    // Refine with question response
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

    // Generate meta-prompt silently (no intermediate messages shown to user)
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

      // Save optimized prompt and show approval dialog
      setContextState((prev) => ({
        ...prev,
        optimizedPrompt: metaPromptResult,
        isGeneratingPrompt: false,
        showApprovalDialog: true, // Show dialog to user
      }))

      setIsLoading(false) // Stop loading while waiting for user approval
    } catch (error) {
      console.error('[DEBUG] Error generating optimized prompt:', error)
      toast.error(`Error al generar el prompt: ${String(error)}`)
      setIsLoading(false)
      setContextState((prev) => ({ ...prev, isGeneratingPrompt: false }))
    }
  }

  // Handler to approve and start debate with optimized prompt
  const handleApproveAndStart = async () => {
    console.log('[DEBUG] handleApproveAndStart called')
    setIsLoading(true)

    try {
      // Build enriched context with structured fields
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

      // Add structured fields to context
      const structuredInfo: string[] = []
      if (contextState.userRole) structuredInfo.push(`Rol: ${contextState.userRole}`)
      if (contextState.teamSize) structuredInfo.push(`Equipo: ${contextState.teamSize}`)
      if (contextState.budget) structuredInfo.push(`Presupuesto: ${contextState.budget}`)
      if (contextState.deadline) structuredInfo.push(`Plazo: ${contextState.deadline}`)
      if (contextState.successCriteria && contextState.successCriteria.length > 0) {
        structuredInfo.push(`Criterios de éxito:\n- ${contextState.successCriteria.join('\n- ')}`)
      }

      const finalContext = [enrichedContext, ...structuredInfo].filter(Boolean).join('\n\n')

      console.log('[DEBUG] About to call createDebateMutation.mutate with optimized prompt')

      // Map strategy pattern to execution strategy (for simple pattern)
      // Patterns that benefit from parallel: 'parallel', 'ensemble'
      // Others use sequential (agents see each other's responses)
      const executionStrategy: 'sequential' | 'parallel' = 
        selectedStrategy === 'parallel' || selectedStrategy === 'ensemble' 
          ? 'parallel' 
          : 'sequential'

      // Type-safe pattern conversion
      const pattern = selectedStrategy && (
        selectedStrategy === 'simple' ||
        selectedStrategy === 'conditional' ||
        selectedStrategy === 'iterative' ||
        selectedStrategy === 'tournament' ||
        selectedStrategy === 'adversarial' ||
        selectedStrategy === 'ensemble' ||
        selectedStrategy === 'hierarchical' ||
        selectedStrategy === 'parallel'
      ) ? selectedStrategy : undefined

      createDebateMutation.mutate({
        draftId: contextState.debateId, // Use existing draft if available
        question: contextState.optimizedPrompt || contextState.question, // Use optimized prompt
        context: finalContext,
        category: 'general',
        expertCount: 6, // Metadata only - not used by deliberation system
        maxRounds: 5, // Metadata only - not used by deliberation system
        executionStrategy, // Pass execution strategy (for simple pattern)
        pattern, // Pass orchestration pattern (if different from simple)
        selectedExpertIds, // Pass selected experts
        selectedDepartmentIds, // Pass selected corporate departments
      })
      console.log('[DEBUG] createDebateMutation.mutate called successfully with draftId:', contextState.debateId)
    } catch (error) {
      console.error('[DEBUG] Error creating debate:', error)
      toast.error(`Error al crear debate: ${String(error)}`)
      setIsLoading(false)
    }
  }

  // Handler to use original question without optimization
  const handleUseOriginal = () => {
    setContextState(prev => ({
      ...prev,
      showApprovalDialog: false,
      optimizedPrompt: undefined,
    }))
    // Directly start with original
    void handleApproveAndStart()
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
  // DYNAMIC CONTEXTUAL QUESTIONS SYSTEM
  // ═══════════════════════════════════════════════════════════
  interface ContextualQuestion {
    id: string
    type: 'question' | 'assumption'
    questionType: 'yes_no' | 'multiple_choice' | 'free_text'
    content: string
    options?: string[]
    answer?: string | boolean
  }

  const [contextualQuestions, setContextualQuestions] = useState<ContextualQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)

  // Mutation to generate contextual questions
  const generateQuestionsMutation = api.debates.generateContextualQuestions.useMutation()

  // Handler for button responses (yes/no or multiple choice)
  const handleButtonResponse = async (answer: string | boolean) => {
    const currentQuestion = contextualQuestions[currentQuestionIndex]
    if (!currentQuestion) return

    // Update question with answer
    const updatedQuestions = [...contextualQuestions]
    updatedQuestions[currentQuestionIndex] = {
      ...currentQuestion,
      answer,
    }
    setContextualQuestions(updatedQuestions)

    // Add user message showing the answer
    let displayContent: string
    if (typeof answer === 'boolean') {
      displayContent = answer ? 'Sí' : 'No'
    } else {
      displayContent = answer
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: displayContent,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])

    // Move to next question or finish
    if (currentQuestionIndex < contextualQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setIsLoading(true)

      // Show next question after delay
      setTimeout(() => {
        const nextQuestion = updatedQuestions[currentQuestionIndex + 1]
        if (nextQuestion) {
          const questionMsg: Message = {
            id: `msg-${Date.now()}`,
            role: 'ai',
            content: nextQuestion.content,
            type: nextQuestion.type,
            questionType: nextQuestion.questionType,
            options: nextQuestion.options,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, questionMsg])
        }
        setIsLoading(false)
      }, 800)
    } else {
      // All questions answered, move to experts phase
      setContextState(prev => ({ ...prev, readyToStart: true }))
      setCurrentPhase('expertos')
      setIsLoading(false)

      toast.success('¡Contexto completado! Ahora selecciona los expertos.')
    }
  }

  // Handler for free text responses
  const handleTextResponse = async () => {
    if (!input.trim()) return

    const currentQuestion = contextualQuestions[currentQuestionIndex]
    if (!currentQuestion) return

    await handleButtonResponse(input)
    setInput('')
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  const lastMessage = messages[messages.length - 1]
  const isAssumptionPending = lastMessage?.role === 'ai' && lastMessage.type === 'assumption'

  // Phase management
  type Phase = 'contexto' | 'expertos' | 'estrategia' | 'debate' | 'conclusion'
  const [currentPhase, setCurrentPhase] = useState<Phase>('contexto')
  
  // Auto-open ExpertSelector when entering expertos phase
  useEffect(() => {
    if (currentPhase === 'expertos' && selectedExpertIds.length === 0) {
      // ExpertSelector will auto-suggest experts when opened
      // The component handles this internally
    }
  }, [currentPhase, selectedExpertIds.length])
  
  // Auto-select strategy when entering estrategia phase (if not already selected)
  useEffect(() => {
    if (currentPhase === 'estrategia' && !selectedStrategy) {
      // StrategySelector will auto-select recommended strategy
      // The component handles this internally via api.debateStrategy.analyzeStrategy
    }
  }, [currentPhase, selectedStrategy])
  
  // Determine phase display state
  const getPhaseState = (phase: Phase): 'active' | 'completed' | 'pending' => {
    if (phase === currentPhase) return 'active'
    if (phase === 'contexto' && currentPhase !== 'contexto') return 'completed'
    if (phase === 'expertos' && (currentPhase === 'estrategia' || currentPhase === 'debate' || currentPhase === 'conclusion')) return 'completed'
    if (phase === 'estrategia' && (currentPhase === 'debate' || currentPhase === 'conclusion')) return 'completed'
    if (phase === 'debate' && currentPhase === 'conclusion') return 'completed'
    return 'pending'
  }
  
  // Handle phase transitions
  const handleContinueToExpertos = () => {
    if (contextState.readyToStart) {
      setCurrentPhase('expertos')
    }
  }
  
  const handleContinueToEstrategia = () => {
    if (selectedExpertIds.length > 0) {
      setCurrentPhase('estrategia')
    } else {
      toast.error('Debes seleccionar al menos un experto')
    }
  }
  
  const handleContinueToDebate = () => {
    if (selectedStrategy) {
      // Start deliberation - this will redirect to /debates/[id]
      void handleStartDeliberation()
    } else {
      toast.error('Debes seleccionar una estrategia')
    }
  }
  
  // When debate is created, we'll be redirected, so we don't need to change phase here
  // The redirect happens in handleStartDeliberation -> createDebateMutation

  // File handling functions
  const MAX_FILES = 5
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = [
    'text/plain',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ]

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedExtensions = ['.txt', '.pdf', '.xls', '.xlsx', '.csv']
    const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))

    if (!ALLOWED_TYPES.includes(file.type) && !hasValidExtension) {
      return 'Solo se permiten archivos: TXT, PDF, Excel (.xls, .xlsx) y CSV'
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `El archivo "${file.name}" es demasiado grande. Máximo 10MB por archivo.`
    }
    
    // Check total files limit
    if (attachedFiles.length >= MAX_FILES) {
      return `Máximo ${MAX_FILES} archivos permitidos`
    }
    
    // Check for duplicates
    if (attachedFiles.some(f => f.name === file.name && f.size === file.size)) {
      return `El archivo "${file.name}" ya está adjunto`
    }
    
    return null
  }

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
          // Read text file
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve(e.target?.result as string)
          }
          reader.onerror = () => reject(new Error('Error al leer el archivo'))
          reader.readAsText(file, 'UTF-8')
        } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          // Extract PDF text using pdfjs-dist
          const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js')

          // Configure worker
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

          const arrayBuffer = await file.arrayBuffer()
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
          const pdf = await loadingTask.promise

          const textParts: string[] = []

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum)
            const textContent = await page.getTextContent()
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ')

            if (pageText.trim()) {
              textParts.push(`\n--- Página ${pageNum} ---\n${pageText}`)
            }
          }

          resolve(textParts.join('\n\n'))
        } else if (
          file.type === 'application/vnd.ms-excel' ||
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'text/csv' ||
          file.name.toLowerCase().endsWith('.xls') ||
          file.name.toLowerCase().endsWith('.xlsx') ||
          file.name.toLowerCase().endsWith('.csv')
        ) {
          // Extract Excel/CSV data using xlsx
          const XLSX = await import('xlsx')
          const arrayBuffer = await file.arrayBuffer()
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })

          const textParts: string[] = []

          for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName]
            if (!worksheet) continue

            const csv = XLSX.utils.sheet_to_csv(worksheet)
            if (csv.trim()) {
              textParts.push(`\n--- Hoja: ${sheetName} ---\n${csv}`)
            }
          }

          resolve(textParts.join('\n\n'))
        } else {
          reject(new Error('Tipo de archivo no soportado'))
        }
      } catch (error) {
        reject(new Error(`Error al procesar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`))
      }
    })
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newFiles: AttachedFile[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const error = validateFile(file)
      
      if (error) {
        toast.error(error)
        continue
      }

      const fileId = `file-${Date.now()}-${i}`
      const attachedFile: AttachedFile = {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        isProcessing: true,
      }
      
      newFiles.push(attachedFile)
      
      // Extract text content asynchronously
      extractTextFromFile(file)
        .then(content => {
          setAttachedFiles(prev => 
            prev.map(f => f.id === fileId ? { ...f, content, isProcessing: false } : f)
          )
        })
        .catch(error => {
          console.error('Error extracting file content:', error)
          toast.error(`Error al procesar "${file.name}"`)
          setAttachedFiles(prev => prev.filter(f => f.id !== fileId))
        })
    }

    if (newFiles.length > 0) {
      setAttachedFiles(prev => [...prev, ...newFiles])
      toast.success(`${newFiles.length} archivo(s) adjuntado(s)`)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId))
    toast.success('Archivo eliminado')
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      void handleFileSelect(files)
    }
  }

  return (
    <div className="flex h-full flex-col relative bg-slate-950">
      {/* Phase Indicator - 5 Phases */}
      <div className="relative border-b border-white/10 bg-slate-900/40 backdrop-blur-xl px-4 py-3">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {(['contexto', 'expertos', 'estrategia', 'debate', 'conclusion'] as Phase[]).map((phase, index) => {
              const phaseState = getPhaseState(phase)
              const phaseLabels: Record<Phase, string> = {
                contexto: 'Contexto',
                expertos: 'Expertos',
                estrategia: 'Estrategia',
                debate: 'Debate',
                conclusion: 'Conclusión',
              }
              
              return (
                <div key={phase} className="flex items-center flex-1 max-w-[120px]">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all flex-shrink-0",
                      phaseState === 'active'
                        ? "bg-purple-600 border-purple-400 text-white"
                        : phaseState === 'completed'
                        ? "bg-purple-600/50 border-purple-600/50 text-purple-300"
                        : "bg-slate-800/50 border-slate-600/50 text-slate-500"
                    )}>
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <span className={cn(
                      "text-xs sm:text-sm font-medium transition-colors truncate",
                      phaseState === 'active'
                        ? "text-white"
                        : phaseState === 'completed'
                        ? "text-purple-300"
                        : "text-slate-500"
                    )}>
                      {phaseLabels[phase]}
                    </span>
                  </div>
                  {index < 4 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-2 transition-colors min-w-[20px]",
                      phaseState === 'completed' || (phaseState === 'active' && currentPhase !== phase)
                        ? "bg-purple-600/50"
                        : "bg-slate-700/50"
                    )} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Phase Content - Show only active phase, each phase occupies full screen/centered */}
      
      {/* PHASE 1: CONTEXTO */}
      {currentPhase === 'contexto' && (
        <div className="flex-1 flex items-start justify-center px-4 py-6 overflow-auto">
          <div className="w-full max-w-4xl space-y-6">
            {/* Compact Header with Progress */}
            {contextState.currentScore > 0 && (
              <div className="relative border-b border-white/10 bg-slate-900/60 backdrop-blur-xl px-4 py-3 rounded-lg">
                <div className="flex items-center justify-between">
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
            )}

            {/* Messages or Initial State */}
            {messages.length === 0 ? (
              /* Initial Centered State */
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center">
                {/* Banners */}
                {actualRetryId && isLoadingRetry && (
                  <div className="relative rounded-lg border-2 border-purple-500/30 bg-purple-900/20 backdrop-blur-xl p-6 w-full max-w-2xl">
                    <div className="flex items-start gap-4">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                      <div className="flex-1">
                        <h2 className="text-lg font-bold text-white mb-1">Cargando debate anterior...</h2>
                        <p className="text-sm text-gray-300">Estamos recuperando el contexto del debate para que puedas reintentarlo.</p>
                      </div>
                    </div>
                  </div>
                )}

                {actualRetryId && retryDebate && !isLoadingRetry && (
                  <div className="relative rounded-lg border-2 border-green-500/30 bg-green-900/20 backdrop-blur-xl p-6 w-full max-w-2xl">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-600">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-white mb-2">🔄 Reintentando debate</h2>
                        <p className="text-sm text-gray-300 mb-2">El contexto del debate anterior se ha cargado en el campo de texto.</p>
                        <p className="text-xs text-gray-400 italic">Debate original: "{retryDebate.question}"</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Centered Prompt */}
                <div className="space-y-6 w-full max-w-2xl">
                  <div className="space-y-4">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                      {selectedPrompt}
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-base">
                      Escribe tu pregunta o describe la situación que necesitas analizar
                    </p>
                  </div>

                  {/* Input Section */}
                  <div className="space-y-4">
                    {/* Character counter */}
                    {input.length > 0 && (
                      <div className="flex items-center justify-center px-1">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'h-2 w-2 rounded-full transition-colors',
                            input.length < 20 ? 'bg-red-500' : input.length < 30 ? 'bg-yellow-500' : 'bg-green-500'
                          )} />
                          <span className={cn(
                            'text-xs font-medium transition-colors',
                            input.length < 20 ? 'text-red-400' : input.length < 30 ? 'text-yellow-400' : 'text-green-400'
                          )}>
                            {input.length < 20 ? (
                              <>Mínimo 20 caracteres requeridos ({input.length}/20)</>
                            ) : (
                              <>✓ Longitud válida ({input.length} caracteres)</>
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Attached Files */}
                    {attachedFiles.length > 0 && (
                      <div className="space-y-2">
                        {attachedFiles.map((attachedFile) => (
                          <div key={attachedFile.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-purple-500/20">
                            <FileText className="h-4 w-4 text-purple-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{attachedFile.name}</p>
                              <p className="text-xs text-gray-400">
                                {(attachedFile.size / 1024).toFixed(1)} KB
                                {attachedFile.isProcessing && ' • Procesando...'}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveFile(attachedFile.id)}
                              className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                              title="Eliminar archivo"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input Field */}
                    <div 
                      className={cn(
                        "flex gap-2 items-stretch relative",
                        isDragging && "ring-2 ring-purple-500 rounded-lg p-2"
                      )}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.pdf,.xls,.xlsx,.csv"
                        multiple
                        onChange={handleFileInputChange}
                        className="hidden"
                        aria-label="Añadir archivos de contexto"
                        title="Añadir archivos (TXT, PDF, Excel, CSV)"
                      />
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={attachedFiles.length >= MAX_FILES || isLoading}
                        className="bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all h-full min-w-[50px] w-[50px] flex items-center justify-center"
                        title={attachedFiles.length >= MAX_FILES ? `Máximo ${MAX_FILES} archivos` : "Añadir archivos (TXT, PDF, Excel, CSV)"}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                      
                      {isDragging && (
                        <div className="absolute inset-0 flex items-center justify-center bg-purple-900/20 backdrop-blur-sm rounded-lg border-2 border-dashed border-purple-500 z-10">
                          <div className="text-center">
                            <Upload className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                            <p className="text-sm text-purple-300 font-medium">Suelta los archivos aquí</p>
                            <p className="text-xs text-gray-400 mt-1">TXT, PDF, Excel, CSV (máx. 10MB c/u)</p>
                          </div>
                        </div>
                      )}
                      
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            if (input.trim().length < 20) {
                              toast.error('La pregunta debe tener al menos 20 caracteres')
                              return
                            }
                            void handleSendMessage()
                          }
                        }}
                        placeholder="Ej: ¿Debería lanzar el producto en marzo o esperar a abril? (mínimo 20 caracteres)"
                        disabled={isLoading}
                        className={cn(
                          "flex-1 border-2 bg-slate-900/60 backdrop-blur-sm text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 transition-all text-base sm:text-lg h-full",
                          input.length > 0 && input.length < 20
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-purple-500/30 focus:border-purple-500"
                        )}
                        autoFocus
                      />
                      <Button
                        onClick={() => {
                          if (input.trim().length < 20) {
                            toast.error('La pregunta debe tener al menos 20 caracteres')
                            return
                          }
                          void handleSendMessage()
                        }}
                        disabled={isLoading || !input.trim() || input.trim().length < 20}
                        className="bg-purple-600 hover:bg-purple-500 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all h-full min-w-[60px] w-[60px] flex items-center justify-center"
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>

                    {/* Structured Fields (Optional) */}
                    <div className="pt-4">
                      <button
                        onClick={() => setShowStructuredFields(!showStructuredFields)}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-purple-400 transition-colors"
                      >
                        <span>{showStructuredFields ? '▼' : '▶'}</span>
                        <span>Información adicional (opcional)</span>
                      </button>

                      {showStructuredFields && (
                        <div className="mt-4 space-y-4 p-4 rounded-lg border border-purple-500/20 bg-slate-900/40">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* User Role */}
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">Tu rol/contexto</label>
                              <Input
                                value={contextState.userRole || ''}
                                onChange={(e) => setContextState(prev => ({ ...prev, userRole: e.target.value }))}
                                placeholder="Ej: CEO de startup B2B SaaS"
                                className="bg-slate-800/60 border-purple-500/20 text-white text-sm"
                              />
                            </div>

                            {/* Team Size */}
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">Tamaño del equipo</label>
                              <Input
                                value={contextState.teamSize || ''}
                                onChange={(e) => setContextState(prev => ({ ...prev, teamSize: e.target.value }))}
                                placeholder="Ej: 5-10 personas"
                                className="bg-slate-800/60 border-purple-500/20 text-white text-sm"
                              />
                            </div>

                            {/* Budget */}
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">Presupuesto</label>
                              <Input
                                value={contextState.budget || ''}
                                onChange={(e) => setContextState(prev => ({ ...prev, budget: e.target.value }))}
                                placeholder="Ej: €50k - €100k"
                                className="bg-slate-800/60 border-purple-500/20 text-white text-sm"
                              />
                            </div>

                            {/* Deadline */}
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">Plazo</label>
                              <Input
                                value={contextState.deadline || ''}
                                onChange={(e) => setContextState(prev => ({ ...prev, deadline: e.target.value }))}
                                placeholder="Ej: 3 meses"
                                className="bg-slate-800/60 border-purple-500/20 text-white text-sm"
                              />
                            </div>
                          </div>

                          {/* Success Criteria */}
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Criterios de éxito (uno por línea)</label>
                            <textarea
                              value={(contextState.successCriteria || []).join('\n')}
                              onChange={(e) => setContextState(prev => ({
                                ...prev,
                                successCriteria: e.target.value.split('\n').filter(line => line.trim())
                              }))}
                              placeholder="ROI > 20%&#10;Churn < 5%&#10;Tiempo de implementación < 6 meses"
                              rows={3}
                              className="w-full bg-slate-800/60 border-2 border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Example Questions */}
                    <div className="pt-4 space-y-3">
                      <p className="text-sm text-gray-500 mb-4">Ejemplos para empezar:</p>
                      <div className="flex flex-col gap-3">
                        {selectedExamples.map((example, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setInput(example.question)
                              setTimeout(() => {
                                const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement
                                inputElement?.focus()
                              }, 100)
                            }}
                            className="group relative text-left p-4 rounded-lg border border-purple-500/20 bg-purple-900/10 hover:bg-purple-900/20 hover:border-purple-500/40 transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                                <Sparkles className="h-4 w-4 text-purple-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white group-hover:text-purple-200 transition-colors line-clamp-2">
                                  {example.question}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{example.description}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Messages View - Context gathering */
              <div className="space-y-4">
                {/* Messages */}
                <div className="space-y-4">
                  {messages.map((msg, index) => {
                    const isLastMessage = index === messages.length - 1
                    const hasQuestionType = msg.questionType && msg.role === 'ai' && isLastMessage && !isLoading

                    return (
                      <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                          'rounded-lg px-4 py-3 relative max-w-[80%]',
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                            : 'bg-blue-700 text-white shadow-md'
                        )}>
                          {/* Badge for assumptions */}
                          {msg.type === 'assumption' && (
                            <div className="mb-2 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-blue-200" />
                              <span className="text-xs text-blue-200 font-medium">Suposición</span>
                            </div>
                          )}

                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {/* Dynamic buttons for yes/no questions */}
                          {hasQuestionType && msg.questionType === 'yes_no' && (
                            <div className="mt-4 flex gap-2">
                              <Button
                                onClick={() => void handleButtonResponse(true)}
                                disabled={isLoading}
                                className="flex-1 bg-green-600 hover:bg-green-500 text-white border-0"
                              >
                                Sí
                              </Button>
                              <Button
                                onClick={() => void handleButtonResponse(false)}
                                disabled={isLoading}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white border-0"
                              >
                                No
                              </Button>
                            </div>
                          )}

                          {/* Dynamic buttons for multiple choice */}
                          {hasQuestionType && msg.questionType === 'multiple_choice' && msg.options && (
                            <div className="mt-4 flex flex-col gap-2">
                              {msg.options.map((option, optIdx) => (
                                <Button
                                  key={optIdx}
                                  onClick={() => void handleButtonResponse(option)}
                                  disabled={isLoading}
                                  className="w-full bg-purple-600 hover:bg-purple-500 text-white border-0 justify-start"
                                >
                                  {option}
                                </Button>
                              ))}
                            </div>
                          )}

                          {/* Timestamp */}
                          <div className="mt-1 text-xs text-gray-300">
                            {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Continue Button when ready */}
                {contextState.readyToStart && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={handleContinueToExpertos}
                      className="bg-purple-600 hover:bg-purple-500 text-white border-0 shadow-lg shadow-purple-500/30 px-8 py-6 text-lg"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Continuar a Selección de Expertos
                      </span>
                    </Button>
                  </div>
                )}

                {/* Input for free text responses or when no buttons needed */}
                {!isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'ai' &&
                 messages[messages.length - 1]?.questionType === 'free_text' && (
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex gap-2 items-stretch">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            void handleTextResponse()
                          }
                        }}
                        placeholder="Escribe tu respuesta..."
                        disabled={isLoading}
                        className="flex-1 border-2 bg-slate-900/60 backdrop-blur-sm text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 border-purple-500/30 h-full"
                        autoFocus
                      />
                      <Button
                        onClick={() => void handleTextResponse()}
                        disabled={isLoading || !input.trim()}
                        className="bg-purple-600 hover:bg-purple-500 text-white border-0 h-full min-w-[60px] w-[60px] flex items-center justify-center"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PHASE 2: EXPERTOS */}
      {currentPhase === 'expertos' && (
        <div className="flex-1 flex items-center justify-center px-4 py-6 overflow-auto">
          <div className="w-full max-w-4xl space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-white">Selecciona los Expertos</h2>
              <p className="text-gray-400">El sistema ha propuesto expertos automáticamente. Puedes modificarlos si lo deseas.</p>
            </div>
            
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-lg p-6 border border-white/10">
              <ExpertSelector
                selectedExpertIds={selectedExpertIds}
                onSelectionChange={setSelectedExpertIds}
                question={contextState.question}
                context={contextState.context}
                defaultOpen={true} // Auto-open in expertos phase
              />
            </div>

            {/* Corporate Departments Selector */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-lg p-6 border border-white/10">
              <DepartmentSelector
                selectedDepartmentIds={selectedDepartmentIds}
                onSelectionChange={setSelectedDepartmentIds}
                defaultOpen={false}
              />
            </div>

            <div className="flex justify-center pt-4">
              <Button
                onClick={handleContinueToEstrategia}
                disabled={selectedExpertIds.length === 0}
                className="bg-purple-600 hover:bg-purple-500 text-white border-0 shadow-lg shadow-purple-500/30 px-8 py-6 text-lg disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Continuar a Selección de Estrategia
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: ESTRATEGIA */}
      {currentPhase === 'estrategia' && (
        <div className="flex-1 flex items-center justify-center px-4 py-6 overflow-auto">
          <div className="w-full max-w-4xl space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-white">Selecciona la Estrategia</h2>
              <p className="text-gray-400">El sistema ha propuesto una estrategia. Puedes cambiarla si lo deseas.</p>
            </div>
            
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-lg p-6 border border-white/10">
              <StrategySelector
                question={contextState.question}
                onStrategySelect={setSelectedStrategy}
                selectedPattern={selectedStrategy}
              />
            </div>

            <div className="flex justify-center pt-4">
              <Button
                onClick={handleContinueToDebate}
                disabled={!selectedStrategy}
                className="bg-purple-600 hover:bg-purple-500 text-white border-0 shadow-lg shadow-purple-500/30 px-8 py-6 text-lg disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Iniciar Debate
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 4: DEBATE - Keep existing view */}
      {currentPhase === 'debate' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Compact Header with Progress */}
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
                    Debate en progreso
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-auto px-4 py-6">
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'rounded-lg px-4 py-3 relative',
                    msg.role === 'user'
                      ? 'max-w-[80%] bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                      : msg.id === '1'
                      ? 'max-w-[85%] bg-blue-600 text-white border-2 border-blue-400/30 shadow-lg shadow-blue-500/30'
                      : 'max-w-[80%] bg-blue-700 text-white shadow-md'
                  )}>
                    {msg.role === 'ai' && msg.type === 'assumption' && (
                      <div className="mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-200" />
                        <span className="text-xs text-blue-200 font-medium">Suposición</span>
                      </div>
                    )}
                    {msg.role === 'ai' && msg.id === '1' && (
                      <div className="mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-white" />
                        <span className="text-xs font-semibold text-white">Asistente IA</span>
                      </div>
                    )}
                    <p className={cn("whitespace-pre-wrap", msg.id === '1' ? "text-base font-medium" : "")}>
                      {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2)}
                    </p>
                    <div className="mt-1 text-xs text-[#aebac1]">
                      {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
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
              {/* Attached Files */}
              {attachedFiles.length > 0 && (
                <div className="mb-4 space-y-2">
                  {attachedFiles.map((attachedFile) => (
                    <div key={attachedFile.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-purple-500/20">
                      <FileText className="h-4 w-4 text-purple-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{attachedFile.name}</p>
                        <p className="text-xs text-gray-400">
                          {(attachedFile.size / 1024).toFixed(1)} KB
                          {attachedFile.isProcessing && ' • Procesando...'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(attachedFile.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                        title="Eliminar archivo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Field */}
              <div 
                className={cn(
                  "flex gap-2 items-stretch relative",
                  isDragging && "ring-2 ring-purple-500 rounded-lg p-2"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                  aria-label="Añadir archivos de texto o PDF"
                  title="Añadir archivos (TXT, PDF)"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachedFiles.length >= MAX_FILES || isLoading}
                  className="bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all h-full min-w-[50px] w-[50px] flex items-center justify-center"
                  title={attachedFiles.length >= MAX_FILES ? `Máximo ${MAX_FILES} archivos` : "Añadir archivos (TXT, PDF)"}
                >
                  <Plus className="h-5 w-5" />
                </Button>
                
                {isDragging && (
                  <div className="absolute inset-0 flex items-center justify-center bg-purple-900/20 backdrop-blur-sm rounded-lg border-2 border-dashed border-purple-500 z-10">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-sm text-purple-300 font-medium">Suelta los archivos aquí</p>
                      <p className="text-xs text-gray-400 mt-1">Solo TXT y PDF (máx. 10MB cada uno)</p>
                    </div>
                  </div>
                )}
                
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void handleSendMessage()
                    }
                  }}
                  placeholder="Escribe más contexto o responde la pregunta..."
                  disabled={isLoading}
                  className="flex-1 border-2 bg-slate-900/60 backdrop-blur-sm text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 border-purple-500/30 h-full"
                />
                <Button
                  onClick={() => void handleSendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="bg-purple-600 hover:bg-purple-500 text-white border-0 h-full min-w-[60px] w-[60px] flex items-center justify-center"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meta-Prompt Approval Dialog */}
      <Dialog open={contextState.showApprovalDialog} onOpenChange={(open) => {
        if (!open) {
          setContextState(prev => ({ ...prev, showApprovalDialog: false }))
        }
      }}>
        <DialogContent className="bg-slate-900 border border-purple-500/30 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            🔍 Prompt Optimizado por IA
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Hemos mejorado tu pregunta para obtener mejores resultados. Puedes aprobarla, editarla o usar la original.
          </DialogDescription>

          <div className="space-y-6 mt-6">
            {/* Original Question */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Tu pregunta original:</h3>
              <div className="p-4 rounded-lg bg-slate-800/60 border border-gray-700">
                <p className="text-gray-300 whitespace-pre-wrap">{contextState.question}</p>
              </div>
            </div>

            {/* Optimized Prompt */}
            <div>
              <h3 className="text-sm font-semibold text-purple-400 mb-2">✨ Prompt optimizado:</h3>
              <div className="p-4 rounded-lg bg-purple-900/20 border-2 border-purple-500/30">
                <textarea
                  value={contextState.optimizedPrompt || ''}
                  onChange={(e) => setContextState(prev => ({ ...prev, optimizedPrompt: e.target.value }))}
                  className="w-full bg-transparent border-none text-white placeholder:text-gray-400 focus:ring-0 focus:outline-none resize-none"
                  rows={6}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Puedes editar el prompt si lo deseas</p>
            </div>

            {/* Structured Fields Summary */}
            {(contextState.userRole || contextState.budget || contextState.deadline || contextState.teamSize || (contextState.successCriteria && contextState.successCriteria.length > 0)) && (
              <div>
                <h3 className="text-sm font-semibold text-blue-400 mb-2">📋 Información adicional capturada:</h3>
                <div className="p-4 rounded-lg bg-blue-900/10 border border-blue-500/20 space-y-2 text-sm">
                  {contextState.userRole && <p><strong>Rol:</strong> {contextState.userRole}</p>}
                  {contextState.teamSize && <p><strong>Equipo:</strong> {contextState.teamSize}</p>}
                  {contextState.budget && <p><strong>Presupuesto:</strong> {contextState.budget}</p>}
                  {contextState.deadline && <p><strong>Plazo:</strong> {contextState.deadline}</p>}
                  {contextState.successCriteria && contextState.successCriteria.length > 0 && (
                    <div>
                      <strong>Criterios de éxito:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        {contextState.successCriteria.map((criterion, idx) => (
                          <li key={idx}>{criterion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setContextState(prev => ({ ...prev, showApprovalDialog: false }))
                  void handleApproveAndStart()
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Iniciando...</>
                ) : (
                  <>✅ Usar optimizado</>
                )}
              </Button>
              <Button
                onClick={handleUseOriginal}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-slate-800"
                disabled={isLoading}
              >
                ← Usar original
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
