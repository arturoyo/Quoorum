/**
 * useUnifiedDebateState Hook
 * 
 * Centralized state management for the unified Typeform-style debate creation flow.
 */

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import type {
  UnifiedPhase,
  PhaseProgress,
  ContextoState,
  ExpertosState,
  EstrategiaState,
  RevisionState,
  DebateState,
  ContextEvaluation,
  InternetSearchResult,
  Message,
} from '../types'

const INITIAL_INTERNET_SEARCH = {
  enabled: false,
  isSearching: false,
  results: [] as InternetSearchResult[],
  context: null as string | null,
  customText: null as string | null,
  error: null as string | null,
  currentQuestionId: undefined as string | undefined,
  currentSearchQuery: undefined as string | undefined,
  isApplied: false,
}

const INITIAL_CONTEXTO: ContextoState = {
  mainQuestion: '',
  answers: {},
  currentQuestionIndex: 0,
  questions: [],
  messages: [],
  contextScore: 0,
  evaluation: null,
  phase: 'initial',
  internetSearch: { ...INITIAL_INTERNET_SEARCH },
  userDeclinedInternetSearch: false, // Por defecto, no ha rechazado
  draftId: undefined, // Se crea cuando el usuario escribe la primera pregunta
  realCreditsDeducted: 0, // Créditos reales deducidos durante la fase de contexto
}

const INITIAL_EXPERTOS: ExpertosState = {
  participantTypes: { expertos: true, departamentos: true, trabajadores: true },
  selectedExpertIds: [],
  selectedDepartmentIds: [],
  selectedWorkerIds: [],
  recommendedExpertIds: [],
}

const INITIAL_ESTRATEGIA: EstrategiaState = {
  selectedStrategy: '',
  recommendedStrategy: null,
  selectedFrameworkId: null,
}

const INITIAL_REVISION: RevisionState = {
  canProceed: false,
  summary: {
    question: '',
    expertCount: 0,
    strategy: '',
    contextScore: 0,
  },
}

const INITIAL_DEBATE: DebateState = {
  debateId: null,
  messages: [],
  input: '',
  isLoading: false,
}

const INITIAL_PROGRESS: PhaseProgress = {
  contexto: 0,
  expertos: 0,
  estrategia: 0,
  revision: 0,
  debate: 0,
}

// Helper para obtener la clave de storage basada en sessionId
function getStorageKey(sessionId: string): string {
  return `quoorum-debate-creation-state-${sessionId}`
}

// Generar ID único para la sesión de creación de debate
function generateSessionId(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID()
  }
  // Fallback para navegadores que no soportan crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

// Helper para guardar estado en localStorage
// SOLO guarda si hay al menos una respuesta (pregunta 1 completada)
function saveStateToStorage(state: {
  sessionId: string
  currentPhase: UnifiedPhase
  phaseProgress: PhaseProgress
  contexto: ContextoState
  expertos: ExpertosState
  estrategia: EstrategiaState
  revision: RevisionState
}) {
  try {
    if (typeof window !== 'undefined') {
      // NO guardar si no hay al menos una respuesta (no ha pasado de la pregunta 1)
      const hasAtLeastOneAnswer = Object.keys(state.contexto.answers).length > 0
      
      if (!hasAtLeastOneAnswer) {
        // Si no hay respuestas, no guardar nada
        return
      }
      
      const storageKey = getStorageKey(state.sessionId)
      localStorage.setItem('quoorum-debate-creation-last-session', state.sessionId)
      localStorage.setItem(storageKey, JSON.stringify({
        sessionId: state.sessionId, // Incluir sessionId único
        currentPhase: state.currentPhase,
        phaseProgress: state.phaseProgress,
        contexto: {
          ...state.contexto,
          // Convertir Date a string para serialización
          messages: state.contexto.messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString(),
          })),
          evaluation: state.contexto.evaluation ? {
            ...state.contexto.evaluation,
          } : null,
        },
        expertos: state.expertos,
        estrategia: state.estrategia,
        revision: state.revision,
        savedAt: new Date().toISOString(),
      }))
    }
  } catch (error) {
    logger.error('Error saving state to localStorage', { error })
  }
}

// Helper para cargar estado desde localStorage
function loadStateFromStorage(sessionId: string): {
  sessionId: string
  currentPhase: UnifiedPhase
  phaseProgress: PhaseProgress
  contexto: ContextoState
  expertos: ExpertosState
  estrategia: EstrategiaState
  revision: RevisionState
} | null {
  try {
    if (typeof window !== 'undefined') {
      const storageKey = getStorageKey(sessionId)
      const saved = localStorage.getItem(storageKey)
      if (!saved) return null
      
      const parsed = JSON.parse(saved)
      
      // Verificar que no sea muy antiguo (más de 24 horas)
      if (parsed.savedAt) {
        const savedAt = new Date(parsed.savedAt)
        const now = new Date()
        const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60)
        if (hoursDiff > 24) {
          localStorage.removeItem(storageKey)
          return null
        }
      }
      
      const loadedContexto = {
        ...parsed.contexto,
        draftId: parsed.contexto.draftId || undefined, // Cargar draftId si existe
        messages: parsed.contexto.messages.map((msg: { timestamp: string }) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
        evaluation: parsed.contexto.evaluation || null,
        internetSearch: {
          enabled: parsed.contexto.internetSearch?.enabled || false,
          isSearching: parsed.contexto.internetSearch?.isSearching || false,
          results: parsed.contexto.internetSearch?.results || [],
          context: parsed.contexto.internetSearch?.context || null,
          customText: parsed.contexto.internetSearch?.customText || null,
          error: parsed.contexto.internetSearch?.error || null,
          currentQuestionId: parsed.contexto.internetSearch?.currentQuestionId || undefined,
          currentSearchQuery: parsed.contexto.internetSearch?.currentSearchQuery || undefined,
          isApplied: parsed.contexto.internetSearch?.isApplied || false,
        },
        userDeclinedInternetSearch: parsed.contexto.userDeclinedInternetSearch || false, // Cargar decisión del usuario
      }
      
      // Validar que currentQuestionIndex esté dentro del rango de questions
      const questions = loadedContexto.questions || []
      const currentQuestionIndex = loadedContexto.currentQuestionIndex || 0
      
      // Si el índice está fuera de rango, ajustarlo
      if (currentQuestionIndex >= questions.length && questions.length > 0) {
        loadedContexto.currentQuestionIndex = questions.length - 1
      } else if (currentQuestionIndex < 0) {
        loadedContexto.currentQuestionIndex = 0
      }
      
      // Si no hay preguntas pero el índice es > 0, resetear
      if (questions.length === 0 && currentQuestionIndex > 0) {
        loadedContexto.currentQuestionIndex = 0
      }
      
      return {
        sessionId: parsed.sessionId || generateSessionId(), // Cargar sessionId o generar uno nuevo
        currentPhase: parsed.currentPhase || 1,
        phaseProgress: parsed.phaseProgress || INITIAL_PROGRESS,
        contexto: loadedContexto,
        expertos: { ...INITIAL_EXPERTOS, ...parsed.expertos },
        estrategia: parsed.estrategia || INITIAL_ESTRATEGIA,
        revision: parsed.revision || INITIAL_REVISION,
      }
    }
  } catch (error) {
    logger.error('Error loading state from localStorage', { error })
    return null
  }
  return null
}

// Helper para limpiar estado guardado
function clearSavedState(sessionId?: string) {
  try {
    if (typeof window !== 'undefined') {
      if (sessionId) {
        // Limpiar solo el estado de esta sesión
        const storageKey = getStorageKey(sessionId)
        localStorage.removeItem(storageKey)
      } else {
        // Limpiar todos los estados (fallback para compatibilidad)
        // Buscar todas las claves que empiecen con el prefijo
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith('quoorum-debate-creation-state-')) {
            localStorage.removeItem(key)
          }
        })
      }
    }
  } catch (error) {
    logger.error('Error clearing saved state', { error })
  }
}

export function useUnifiedDebateState(urlSessionId?: string) {
  const _router = useRouter()
  
  // Mutations
  const generateCriticalQuestions = api.debates.generateCriticalQuestions.useMutation()
  const evaluateContext = api.debates.evaluateContextQuality.useMutation()
  const createDraft = api.debates.createDraft.useMutation()
  const createDebate = api.debates.create.useMutation()
  const validateAnswer = api.debates.validateAnswerRelevance.useMutation()
  const autoResearch = api.contextAssessment.autoResearch.useMutation()
  
  // Usar sessionId de la URL si está disponible, sino generar uno nuevo
  const [sessionId, setSessionId] = useState<string>(() => {
    return urlSessionId || generateSessionId()
  })
  
  // State - SIEMPRE inicializar con valores por defecto para evitar hydration mismatch
  const [currentPhase, setCurrentPhase] = useState<UnifiedPhase>(1)
  const [phaseProgress, setPhaseProgress] = useState<PhaseProgress>(INITIAL_PROGRESS)
  const [contexto, setContexto] = useState<ContextoState>(INITIAL_CONTEXTO)
  const [expertos, setExpertos] = useState<ExpertosState>(INITIAL_EXPERTOS)
  const [estrategia, setEstrategia] = useState<EstrategiaState>(INITIAL_ESTRATEGIA)
  const [revision, setRevision] = useState<RevisionState>(INITIAL_REVISION)
  const [hasLoadedSavedState, setHasLoadedSavedState] = useState(false)
  const [debate, setDebate] = useState<DebateState>(INITIAL_DEBATE)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isCreatingDebate, setIsCreatingDebate] = useState(false)
  const [_currentValidationError, setCurrentValidationError] = useState<string | null>(null)
  
  // Si el sessionId de la URL cambia, resetear todo el estado
  useEffect(() => {
    if (urlSessionId && urlSessionId !== sessionId) {
      // Nuevo sessionId en la URL - resetear completamente
      clearSavedState(sessionId) // Limpiar estado anterior
      setSessionId(urlSessionId)
      setCurrentPhase(1)
      setPhaseProgress(INITIAL_PROGRESS)
      setContexto(INITIAL_CONTEXTO)
      setExpertos(INITIAL_EXPERTOS)
      setEstrategia(INITIAL_ESTRATEGIA)
      setRevision(INITIAL_REVISION)
      setDebate(INITIAL_DEBATE)
      setIsGeneratingQuestions(false)
      setIsEvaluating(false)
      setIsCreatingDebate(false)
      setCurrentValidationError(null)
      setHasLoadedSavedState(false)
      logger.info('[useUnifiedDebateState] Nuevo sessionId detectado, estado reseteado', { urlSessionId })
    }
  }, [urlSessionId, sessionId])

  // Cargar estado guardado DESPUÉS del montaje para evitar hydration mismatch
  useEffect(() => {
    if (hasLoadedSavedState) return

    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const explicitNew = params.get('new') === '1'
    const shouldReset = params.get('reset') === 'true'

    if (explicitNew) {
      clearSavedState(sessionId)
      const url = new URL(window.location.href)
      url.searchParams.delete('new')
      const rest = url.searchParams.toString()
      const path = url.pathname + (rest ? `?${rest}` : '')
      window.history.replaceState({}, '', path)
      setHasLoadedSavedState(true)
      logger.info('[useUnifiedDebateState] ?new=1: inicio siempre nuevo, sin restaurar')
      return
    }

    if (shouldReset) {
      // Limpiar localStorage
      clearSavedState(sessionId)
      // Resetear TODO el estado del componente a valores iniciales
      setCurrentPhase(1)
      setPhaseProgress(INITIAL_PROGRESS)
      setContexto(INITIAL_CONTEXTO)
      setExpertos(INITIAL_EXPERTOS)
      setEstrategia(INITIAL_ESTRATEGIA)
      setRevision(INITIAL_REVISION)
      setDebate(INITIAL_DEBATE)
      setIsGeneratingQuestions(false)
      setIsEvaluating(false)
      setIsCreatingDebate(false)
      setCurrentValidationError(null)
      // Remover el parámetro de la URL sin recargar la página
      const url = new URL(window.location.href)
      url.searchParams.delete('reset')
      window.history.replaceState({}, '', url.toString())
      setHasLoadedSavedState(true)
      logger.info('[useUnifiedDebateState] Estado completamente reseteado por reset=true')
      return
    }

    // Cargar estado guardado
    const savedState = loadStateFromStorage(sessionId)
    if (savedState) {
      // Si hay estado guardado, usar su sessionId (mantener continuidad)
      // Si no, el sessionId ya fue generado arriba
      setCurrentPhase(savedState.currentPhase)
      setPhaseProgress(savedState.phaseProgress)
      setContexto(savedState.contexto)
      setExpertos(savedState.expertos)
      setEstrategia(savedState.estrategia)
      setRevision(savedState.revision)
    }
    setHasLoadedSavedState(true)
  }, [hasLoadedSavedState, sessionId])
  
  // Guardar estado automáticamente cuando cambia
  useEffect(() => {
    // Solo guardar si hay al menos una respuesta (ha pasado de la pregunta 1)
    // La función saveStateToStorage ya verifica esto, pero lo hacemos aquí también para claridad
    const hasAtLeastOneAnswer = Object.keys(contexto.answers).length > 0
    
    if (hasAtLeastOneAnswer) {
      saveStateToStorage({
        sessionId, // Incluir sessionId único
        currentPhase,
        phaseProgress,
        contexto,
        expertos,
        estrategia,
        revision,
      })
    }
  }, [sessionId, currentPhase, phaseProgress, contexto, expertos, estrategia, revision, debate])
  
  // Mostrar notificación si se recuperó estado guardado
  useEffect(() => {
    if (hasLoadedSavedState && contexto.mainQuestion) {
      toast.info('Progreso anterior recuperado', {
        description: 'Hemos restaurado tu progreso anterior. Puedes continuar donde lo dejaste.',
        duration: 4000,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoadedSavedState])
  
  // Calculate if can go next/back
  const canGoNext = useCallback(() => {
    switch (currentPhase) {
      case 1: // Contexto
        return contexto.contextScore >= 40 && contexto.phase === 'ready'
      case 2: // Participantes (Expertos / Departamentos / Profesionales)
        {
          const { participantTypes } = expertos
          const atLeastOne = participantTypes.expertos || participantTypes.departamentos || participantTypes.trabajadores
          const expertsOk = !participantTypes.expertos || expertos.selectedExpertIds.length > 0
          const deptsOk = !participantTypes.departamentos || expertos.selectedDepartmentIds.length > 0
          const workersOk = !participantTypes.trabajadores || expertos.selectedWorkerIds.length > 0
          return !!atLeastOne && expertsOk && deptsOk && workersOk
        }
      case 3: // Estrategia
        return estrategia.selectedStrategy !== ''
      case 4: // Revision
        return revision.canProceed
      case 5: // Debate
        return false // Can't go next from debate
      default:
        return false
    }
  }, [currentPhase, contexto, expertos, estrategia, revision])
  
  const canGoBack = useCallback(() => {
    return currentPhase > 1
  }, [currentPhase])
  
  // Update phase progress (never decrease, only increase or maintain)
  const updatePhaseProgress = useCallback((phase: UnifiedPhase, progress: number) => {
    setPhaseProgress((prev) => {
      const phaseNames: (keyof PhaseProgress)[] = ['contexto', 'expertos', 'estrategia', 'revision', 'debate']
      const phaseName = phaseNames[phase - 1] as keyof PhaseProgress
      if (!phaseName) return prev
      const currentProgress = prev[phaseName] || 0
      // Solo actualizar si el nuevo progreso es mayor (nunca retroceder)
      const newProgress = Math.max(currentProgress, Math.max(0, Math.min(100, progress)))
      return { ...prev, [phaseName]: newProgress }
    })
  }, [])
  
  // Contexto handlers
  const handleInitialQuestion = useCallback(async (question: string) => {
    if (!question.trim()) return
    
    // Validar longitud mínima (10 caracteres como requiere el backend)
    if (question.trim().length < 10) {
      toast.error('La pregunta es demasiado corta', {
        description: 'Por favor, escribe al menos 10 caracteres para poder generar las preguntas de contexto.',
        duration: 5000,
      })
      return
    }

    // CRÍTICO: Establecer estado de carga ANTES de cualquier cambio de fase
    // Esto previene que el componente muestre "estado corrupto" durante la carga
    setIsGeneratingQuestions(true)

    // Crear draft del debate inmediatamente cuando el usuario escribe la primera pregunta
    let draftId: string | undefined
    try {
      logger.info('Creating draft debate for initial question...')
      const draft = await createDraft.mutateAsync({ question })
      draftId = draft.id
      logger.info('Draft debate created', { draftId: draft.id, title: draft.title })
      
      toast.success('Debate guardado', {
        description: 'Tu debate se ha guardado automáticamente. Puedes continuar sin perder tu progreso.',
        duration: 3000,
      })
    } catch (error) {
      logger.error('Error creating draft debate:', error instanceof Error ? error : undefined)
      // No bloquear el flujo si falla el draft, pero loguear el error
      toast.warning('No se pudo guardar el borrador', {
        description: 'Puedes continuar, pero asegúrate de completar el debate para guardarlo.',
        duration: 4000,
      })
    }
    
    setContexto((prev) => ({
      ...prev,
      mainQuestion: question,
      draftId, // Guardar el ID del draft
      messages: [
        {
          id: 'msg-0',
          role: 'user',
          content: question,
          type: 'answer',
          timestamp: new Date(),
        },
      ],
      phase: 'critical',
    }))

    updatePhaseProgress(1, 10)

    try {
      const response = await generateCriticalQuestions.mutateAsync({ 
        question,
      })
      // El endpoint retorna { questions, creditsDeducted, remainingCredits }
      const rawQuestions = response.questions

      if (!rawQuestions || !Array.isArray(rawQuestions)) {
        throw new Error('No se recibieron preguntas válidas del servidor')
      }

      // Ensure all questions have ALL required fields (id, priority, questionType)
      // IMPORTANTE: Normalizar questionType para evitar que falten campos de input
      const validTypes = ['yes_no', 'multiple_choice', 'free_text'] as const
      const questions = rawQuestions.map((q, i) => {
        // Validar que questionType sea uno de los tipos válidos
        const normalizedType = validTypes.includes(q.questionType)
          ? q.questionType
          : 'free_text' // Por defecto, usar texto libre

        return {
          ...q,
          id: q.id || `q-${Date.now()}-${i}`,
          priority: (q.priority || 'medium') as 'critical' | 'high' | 'medium' | 'low',
          questionType: normalizedType,
          // Si es multiple_choice pero no tiene options, cambiar a free_text
          ...(normalizedType === 'multiple_choice' && (!q.options || q.options.length === 0)
            ? { questionType: 'free_text' as const }
            : {}),
        }
      })

      const introMessage: Message | null = questions.length > 0
        ? {
            id: `ai-${Date.now()}`,
            role: 'ai',
            content: questions[0]!.content,
            type: 'question',
            timestamp: new Date(),
          }
        : null

      setContexto((prev) => ({
        ...prev,
        questions,
        currentQuestionIndex: 0,
        // Actualizar créditos deducidos si el servidor los reporta
        realCreditsDeducted: prev.realCreditsDeducted + (response.creditsDeducted ?? 0),
        messages: [
          ...prev.messages,
          ...(introMessage ? [introMessage] : []),
        ],
      }))

      updatePhaseProgress(1, 20)
      setIsGeneratingQuestions(false)

      logger.info('Critical questions generated successfully', {
        questionCount: questions.length,
        creditsDeducted: response.creditsDeducted,
        remainingCredits: response.remainingCredits,
      })
    } catch (error) {
      logger.error('Error generating critical questions:', error instanceof Error ? error : undefined)
      toast.error('Error al generar preguntas', {
        description: 'Por favor, intenta de nuevo.',
        duration: 5000,
      })
      // CRÍTICO: Resetear al estado inicial si falla la generación de preguntas
      // para evitar el estado "corrupto" donde phase='critical' pero questions=[]
      setContexto((prev) => ({
        ...prev,
        mainQuestion: '',
        phase: 'initial',
        questions: [],
        messages: [],
      }))
      setIsGeneratingQuestions(false)
      updatePhaseProgress(1, 0)
    }
  }, [generateCriticalQuestions, updatePhaseProgress, createDraft])
  
  // Helper para construir mensaje de evaluación con advertencias
  const buildEvaluationMessage = useCallback((result: ContextEvaluation) => {
    let message = `**Contexto evaluado: ${result.score}/100**\n\n${result.reasoning}`
    
    if (result.contradictions && result.contradictions.length > 0) {
      message += `\n\n**Contradicciones detectadas:**\n${result.contradictions.map(c => `- ${c}`).join('\n')}\n\nPor favor, revisa tus respuestas anteriores.`
    }
    
    if (result.duplicatedInfo && result.duplicatedInfo.length > 0) {
      message += `\n\n**Información duplicada:**\n${result.duplicatedInfo.map(d => `- ${d}`).join('\n')}`
    }
    
    if (result.qualityIssues && result.qualityIssues.length > 0) {
      const issues = result.qualityIssues.includes('vague_answers') ? 'Respuestas vagas detectadas' : ''
      const missing = result.qualityIssues.includes('missing_critical_info') ? 'Información crítica faltante' : ''
      const issuesList = [issues, missing].filter(Boolean).join(', ')
      if (issuesList) {
        message += `\n\n**Problemas de calidad:** ${issuesList}`
      }
    }
    
    return message
  }, [])

  const MAX_CONTEXT_ANSWERS = 8

  const evaluateContextQuality = useCallback(async (answers: Record<string, string>) => {
    setIsEvaluating(true)
    const totalAnswersCount = Object.keys(answers).length

    try {
      const result = await evaluateContext.mutateAsync({
        question: contexto.mainQuestion,
        answers,
        currentPhase: contexto.phase === 'critical' ? 'critical' : contexto.phase === 'deep' ? 'deep' : 'refine',
        internetContext: contexto.internetSearch?.context,
        totalAnswersCount,
      })

      // Cap: máx 8 respuestas y solo 1 ronda de follow-ups (critical → deep)
      const allowMore = result.shouldContinue && result.followUpQuestions.length > 0 && totalAnswersCount < MAX_CONTEXT_ANSWERS
      const nextPhase = allowMore && contexto.phase === 'critical' ? 'deep' : 'ready'
      // Ensure follow-up questions have ALL required fields (id, priority, questionType)
      // IMPORTANTE: Normalizar questionType para evitar que falten campos de input
      const followUpWithIds = result.followUpQuestions.map((q, i) => {
        // Validar que questionType sea uno de los tipos válidos
        const validTypes = ['yes_no', 'multiple_choice', 'free_text'] as const
        const normalizedType = validTypes.includes(q.questionType)
          ? q.questionType
          : 'free_text' // Por defecto, usar texto libre para preguntas de seguimiento

        return {
          ...q,
          id: q.id || `followup-${Date.now()}-${i}`,
          priority: (q.priority || 'medium') as 'critical' | 'high' | 'medium' | 'low',
          questionType: normalizedType,
          // Si es multiple_choice pero no tiene options, cambiar a free_text
          ...(normalizedType === 'multiple_choice' && (!q.options || q.options.length === 0)
            ? { questionType: 'free_text' as const }
            : {}),
        }
      })

      // Actualizar créditos reales deducidos si la evaluación retornó créditos deducidos
      const creditsDeducted = (result as { creditsDeducted?: number }).creditsDeducted || 0

      const normalizedEvaluation: ContextEvaluation = {
        score: result.score,
        reasoning: result.reasoning,
        missingAspects: result.missingAspects ?? [],
        contradictions: result.contradictions,
        duplicatedInfo: result.duplicatedInfo,
        qualityIssues: result.qualityIssues,
        shouldContinue: result.shouldContinue,
        followUpQuestions: followUpWithIds,
      }
      
      setContexto((prev) => ({
        ...prev,
        evaluation: normalizedEvaluation,
        contextScore: normalizedEvaluation.score,
        phase: nextPhase,
        questions: allowMore ? followUpWithIds : prev.questions,
        currentQuestionIndex: allowMore ? 0 : prev.currentQuestionIndex,
        realCreditsDeducted: (prev.realCreditsDeducted || 0) + creditsDeducted,
        messages: [
          ...prev.messages,
          {
            id: `eval-${Date.now()}`,
            role: 'ai',
            content: buildEvaluationMessage(normalizedEvaluation),
            type: 'evaluation',
            timestamp: new Date(),
          },
        ],
      }))
      
      // ═══════════════════════════════════════════════════════════
      // UNIFICAR MÉTRICAS: El progreso de la fase debe reflejar el score de calidad
      // ═══════════════════════════════════════════════════════════
      // El contextScore (65/100) es la calidad del contexto evaluada por la IA
      // El phaseProgress debe ser consistente: si el contexto está completo (ready), 100%
      // Si no está completo, usar el score de calidad como base del progreso
      if (nextPhase === 'ready') {
        // Si el contexto está completo, progreso = 100%
        updatePhaseProgress(1, 100)
      } else {
        // Si aún faltan preguntas, el progreso refleja la calidad actual del contexto
        // Usar el score de calidad directamente (0-100) como progreso base
        // Añadir un pequeño bonus por número de respuestas (máx 10%)
        const qualityProgress = result.score // 0-100 (ej: 65)
        const answersBonus = Math.min(10, totalAnswersCount * 2) // Máx 10% bonus
        const calculatedProgress = Math.min(90, qualityProgress + answersBonus) // Máx 90% hasta completar
        updatePhaseProgress(1, calculatedProgress)
      }
      setIsEvaluating(false)

      if (allowMore) {
        const firstFollowUp = result.followUpQuestions[0]!
        setContexto((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: `ai-${Date.now()}`,
              role: 'ai',
              content: firstFollowUp.content,
              type: 'question',
              timestamp: new Date(),
            },
          ],
        }))
      }
    } catch (error) {
      toast.error('Error al evaluar contexto')
      setIsEvaluating(false)
    }
  }, [contexto.mainQuestion, contexto.phase, evaluateContext, updatePhaseProgress])
  
  const handleAnswer = useCallback(async (answer: string, questionId?: string) => {
    const currentQ = questionId
      ? contexto.questions.find((q) => q.id === questionId)
      : contexto.questions[contexto.currentQuestionIndex]
    if (!currentQ) return

    // Validar relevancia de la respuesta antes de aceptarla
    setIsValidating(true)
    try {
      const validation = await validateAnswer.mutateAsync({
        question: currentQ.content,
        answer: answer,
        previousAnswers: contexto.answers, // Pasar respuestas anteriores para detectar contradicciones
      })
      
      // Detectar problemas de calidad
      const hasQualityIssues = validation.isVague || validation.isTooShort || (validation.qualityIssues && validation.qualityIssues.length > 0)
      
      // Si la respuesta no es relevante, requiere explicación, o tiene problemas de calidad
      if (!validation.isRelevant || validation.requiresExplanation || hasQualityIssues) {
        // Construir mensaje de error específico según el tipo de problema
        let errorMessage = ''
        let warningTitle = ''
        
        if (!validation.isRelevant) {
          warningTitle = 'Respuesta no relacionada'
          errorMessage = `${validation.reasoning}\n\n${validation.suggestion || 'Por favor, proporciona una respuesta más relevante o explica la conexión.'}`
        } else if (validation.isVague) {
          warningTitle = 'Respuesta demasiado vaga'
          errorMessage = `Tu respuesta es demasiado genérica o vaga.\n\n${validation.suggestion || validation.reasoning}\n\nPor favor, proporciona más detalles específicos.`
        } else if (validation.isTooShort) {
          warningTitle = 'Respuesta demasiado corta'
          errorMessage = `Tu respuesta es demasiado breve para esta pregunta.\n\n${validation.suggestion || validation.reasoning}\n\nPor favor, desarrolla más tu respuesta.`
        } else if (validation.qualityIssues && validation.qualityIssues.includes('evasive')) {
          warningTitle = 'Respuesta evasiva'
          errorMessage = `Tu respuesta parece evasiva ("no sé", "depende", etc.).\n\n${validation.suggestion || validation.reasoning}\n\nPor favor, intenta proporcionar información útil aunque sea aproximada.`
        } else if (validation.requiresExplanation) {
          warningTitle = 'Necesita más contexto'
          errorMessage = `${validation.suggestion || validation.reasoning}\n\nPor favor, explica cómo tu respuesta se relaciona con la pregunta.`
        } else {
          warningTitle = 'Respuesta necesita mejorar'
          errorMessage = `${validation.suggestion || validation.reasoning}`
        }
        
        // Guardar el error de validación para mostrarlo en el componente
        setCurrentValidationError(errorMessage)
        
        // Mostrar mensaje de advertencia en el chat
        const warningMessage = `**${warningTitle}**\n\n${errorMessage}`
        
        setContexto((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: `user-${Date.now()}`,
              role: 'user',
              content: answer,
              type: 'answer',
              timestamp: new Date(),
            },
            {
              id: `validation-${Date.now()}`,
              role: 'ai',
              content: warningMessage,
              type: 'validation',
              timestamp: new Date(),
            },
          ],
        }))
        
        // Toast específico según el tipo de problema
        const toastMessage = !validation.isRelevant
          ? 'Tu respuesta no parece relacionada con la pregunta'
          : validation.isVague
          ? 'Tu respuesta es demasiado vaga'
          : validation.isTooShort
          ? 'Tu respuesta es demasiado corta'
          : validation.qualityIssues && validation.qualityIssues.includes('evasive')
          ? 'Tu respuesta parece evasiva'
          : 'Tu respuesta necesita más contexto'
        
        toast.warning(toastMessage, {
          description: validation.suggestion || validation.reasoning,
          duration: 6000,
        })

        // Terminar validación
        setIsValidating(false)

        // No avanzar hasta que la respuesta sea válida
        // El usuario puede editar su respuesta o proporcionar explicación
        return
      }

      // Respuesta válida, limpiar error de validación
      setCurrentValidationError(null)
      setIsValidating(false)
      
      // Actualizar créditos reales deducidos si la validación retornó créditos deducidos
      if (validation.creditsDeducted) {
        setContexto((prev) => ({
          ...prev,
          realCreditsDeducted: (prev.realCreditsDeducted || 0) + validation.creditsDeducted,
        }))
      }
    } catch (error) {
      // Si falla la validación por error de red o servidor, avisar al usuario
      logger.error('Error validating answer', { error })

      // Mostrar error al usuario
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al validar la respuesta'

      // Si es error de créditos, mostrar mensaje específico y BLOQUEAR
      if (errorMessage.includes('insuficientes') || errorMessage.includes('PAYMENT_REQUIRED')) {
        toast.error('Créditos insuficientes', {
          description: 'No tienes suficientes créditos para validar esta respuesta. Recarga créditos para continuar.',
          duration: 8000,
        })

        setContexto((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: `user-${Date.now()}`,
              role: 'user',
              content: answer,
              type: 'answer',
              timestamp: new Date(),
            },
            {
              id: `error-${Date.now()}`,
              role: 'ai',
              content: '**⚠️ Créditos insuficientes**\n\nNo puedo validar tu respuesta porque no tienes créditos suficientes. Por favor, recarga créditos para continuar con el debate.',
              type: 'error',
              timestamp: new Date(),
            },
          ],
        }))

        // Terminar validación
        setIsValidating(false)

        // NO CONTINUAR - bloquear hasta que recargue créditos
        return
      }

      // Para otros errores (red, servidor), avisar pero permitir continuar
      setIsValidating(false)

      toast.warning('No se pudo validar la respuesta', {
        description: 'Hubo un problema al validar tu respuesta. Continuamos sin validar, pero por favor revisa que sea relevante.',
        duration: 6000,
      })

      setContexto((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: `warning-${Date.now()}`,
            role: 'ai',
            content: '⚠️ **No se pudo validar tu respuesta** (error de conexión). Continuamos sin validar, pero asegúrate de que sea relevante y útil para el debate.',
            type: 'warning',
            timestamp: new Date(),
          },
        ],
      }))
    }

    // Respuesta válida (o no validada por error de conexión), proceder normalmente
    const newAnswers = { ...contexto.answers, [currentQ.id]: answer }
    const newIndex = contexto.currentQuestionIndex + 1
    
    setContexto((prev) => ({
      ...prev,
      answers: newAnswers,
      currentQuestionIndex: newIndex,
      messages: [
        ...prev.messages,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: answer,
          type: 'answer',
          timestamp: new Date(),
        },
      ],
    }))
    
    // Update progress based on answered questions
    // Base 20% + (answered questions / total questions) * 70%
    // Esto asegura progreso incremental sin retrocesos
    // IMPORTANTE: Usar el número total de respuestas dadas, no solo el índice actual
    const totalQuestions = contexto.questions.length
    const totalAnsweredQuestions = Object.keys(newAnswers).length // Total de respuestas dadas (incluye todas las rondas)
    const answeredInCurrentRound = newIndex // Preguntas respondidas en la ronda actual
    
    // Calcular progreso: base 20% + progreso incremental basado en respuestas
    // Si hay preguntas, usar el ratio de respuestas dadas vs preguntas actuales
    // Pero también considerar que pueden generarse más preguntas
    let progress = 20 // Base
    
    if (totalQuestions > 0) {
      // Progreso basado en preguntas respondidas en esta ronda
      const roundProgress = (answeredInCurrentRound / totalQuestions) * 50 // 50% del progreso viene de completar la ronda actual
      // Progreso adicional basado en respuestas acumuladas (puede haber múltiples rondas)
      const accumulatedProgress = Math.min(20, (totalAnsweredQuestions / Math.max(totalQuestions, totalAnsweredQuestions)) * 20) // 20% adicional por respuestas acumuladas
      progress = Math.min(90, 20 + roundProgress + accumulatedProgress)
    }
    
    updatePhaseProgress(1, progress)
    
    // If more questions, show next
    if (newIndex < contexto.questions.length) {
      const nextQ = contexto.questions[newIndex]!
      setContexto((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: `ai-${Date.now()}`,
            role: 'ai',
            content: nextQ.content,
            type: 'question',
            timestamp: new Date(),
          },
        ],
      }))
    } else {
      // All questions answered, evaluate
      await evaluateContextQuality(newAnswers)
    }
  }, [contexto, updatePhaseProgress, evaluateContextQuality, validateAnswer])
  
  // Participantes: actualización parcial (tipos, expertos, departamentos, profesionales)
  const handleParticipantUpdate = useCallback(
    (update: Partial<ExpertosState>) => {
      setExpertos((prev) => ({ ...prev, ...update }))
      const merged = { ...expertos, ...update }
      const { participantTypes } = merged
      const atLeastOne = participantTypes.expertos || participantTypes.departamentos || participantTypes.trabajadores
      const expertsOk = !participantTypes.expertos || merged.selectedExpertIds.length > 0
      const deptsOk = !participantTypes.departamentos || merged.selectedDepartmentIds.length > 0
      const workersOk = !participantTypes.trabajadores || merged.selectedWorkerIds.length > 0
      const complete = !!atLeastOne && expertsOk && deptsOk && workersOk
      updatePhaseProgress(2, complete ? 100 : 0)
    },
    [expertos, updatePhaseProgress]
  )
  
  // Estrategia handlers
  const handleStrategySelection = useCallback((strategy: string) => {
    setEstrategia((prev) => ({
      ...prev,
      selectedStrategy: strategy,
      recommendedStrategy: null, // TODO: Get recommendation from API
    }))
    updatePhaseProgress(3, strategy ? 100 : 0)
  }, [updatePhaseProgress])

  const handleFrameworkSelection = useCallback((frameworkId: string | null) => {
    setEstrategia((prev) => ({
      ...prev,
      selectedFrameworkId: frameworkId,
    }))
  }, [])
  
  // Create debate
  const handleCreateDebate = useCallback(async () => {
    setIsCreatingDebate(true)
    
    try {
      // Construir contexto completo y estructurado con toda la información
      const buildFullContext = () => {
        const sections: string[] = []
        
        // 1. Pregunta principal
        sections.push(`# PREGUNTA PRINCIPAL DEL DEBATE\n\n${contexto.mainQuestion}\n`)
        
        // 2. Metadatos del contexto
        sections.push(`## METADATOS DEL CONTEXTO\n`)
        sections.push(`- Puntuación de contexto: ${contexto.contextScore}/100`)
        sections.push(`- Fase completada: ${contexto.phase === 'ready' ? 'Completa' : contexto.phase === 'deep' ? 'Profunda' : contexto.phase === 'critical' ? 'Crítica' : 'Inicial'}`)
        sections.push(`- Total de preguntas respondidas: ${Object.keys(contexto.answers).length}`)
        if (contexto.evaluation) {
          sections.push(`- Nivel de preparación: ${contexto.evaluation.readinessLevel}`)
          sections.push(`- Resumen de evaluación: ${contexto.evaluation.summary}`)
        }
        sections.push('')
        
        // 3. Preguntas y respuestas detalladas
        if (Object.keys(contexto.answers).length > 0) {
          sections.push(`## PREGUNTAS Y RESPUESTAS DE CONTEXTO\n`)
          
          // Ordenar preguntas por su índice en el array original para mantener el orden
          const answeredQuestions = contexto.questions
            .filter(q => contexto.answers[q.id])
            .map(q => ({
              question: q,
              answer: contexto.answers[q.id]!,
              index: contexto.questions.indexOf(q)
            }))
            .sort((a, b) => a.index - b.index)
          
          answeredQuestions.forEach(({ question, answer }, index) => {
            sections.push(`### Pregunta ${index + 1}: ${question.content}`)
            sections.push(`\n**Respuesta:**\n${answer}\n`)
            
            // Añadir tipo de pregunta si es relevante
            if (question.questionType === 'yes_no') {
              sections.push(`*Tipo: Sí/No*\n`)
            } else if (question.questionType === 'multiple_choice' && question.options) {
              sections.push(`*Tipo: Opción múltiple*\n`)
            } else {
              sections.push(`*Tipo: Texto libre*\n`)
            }
          })
        }
        
        // 4. Contexto de internet (si está disponible)
        if (contexto.internetSearch?.context) {
          sections.push(`\n## CONTEXTO ADICIONAL DE INTERNET\n`)
          sections.push(contexto.internetSearch.context)
          
          // Añadir información sobre los resultados seleccionados si están disponibles
          if (contexto.internetSearch.results && contexto.internetSearch.results.length > 0) {
            const selectedResults = contexto.internetSearch.results.filter(r => r.selected)
            if (selectedResults.length > 0) {
              sections.push(`\n### Fuentes consultadas (${selectedResults.length}):`)
              selectedResults.forEach((result, idx) => {
                sections.push(`${idx + 1}. ${result.title}${result.url ? ` (${result.url})` : ''}`)
              })
            }
          }
          sections.push('')
        }
        
        // 5. Resumen final
        sections.push(`## RESUMEN EJECUTIVO\n`)
        sections.push(`Este debate aborda la siguiente pregunta: "${contexto.mainQuestion}"`)
        sections.push(`\nSe han recopilado ${Object.keys(contexto.answers).length} respuestas de contexto que proporcionan información detallada sobre la situación.`)
        if (contexto.internetSearch?.context) {
          sections.push(`Adicionalmente, se ha incluido contexto relevante obtenido de búsquedas en internet.`)
        }
        sections.push(`\nEl nivel de preparación del contexto es: ${contexto.contextScore}/100 (${contexto.contextScore >= 70 ? 'Alto' : contexto.contextScore >= 40 ? 'Medio' : 'Bajo'}).`)
        
        return sections.join('\n')
      }
      
      const fullContext = buildFullContext()
      
      logger.info('Creating debate...', {
        question: contexto.mainQuestion.substring(0, 50),
        expertCount: expertos.selectedExpertIds.length,
        departmentCount: expertos.selectedDepartmentIds.length,
        workerCount: expertos.selectedWorkerIds.length,
      })
      
      const newDebate = await createDebate.mutateAsync({
        draftId: contexto.draftId, // Si existe un draft, actualizarlo en lugar de crear uno nuevo
        question: contexto.mainQuestion,
        category: 'strategy', // TODO: Detect from question
        selectedExpertIds: expertos.selectedExpertIds,
        selectedDepartmentIds: expertos.selectedDepartmentIds.length > 0 ? expertos.selectedDepartmentIds : undefined,
        selectedWorkerIds: expertos.selectedWorkerIds.length > 0 ? expertos.selectedWorkerIds : undefined,
        frameworkId: estrategia.selectedFrameworkId || undefined, // Framework de decisión seleccionado
        context: fullContext, // Pass as string, not object
      })
      
      logger.info('Debate created successfully', {
        debateId: newDebate.id,
        status: newDebate.status,
      })
      
      // Update debate state immediately
      setDebate({
        debateId: newDebate.id,
        messages: [],
        input: '',
        isLoading: false,
      })
      
      updatePhaseProgress(5, 0)
      setCurrentPhase(5)
      
      // Limpiar estado guardado después de crear debate exitosamente
      clearSavedState(sessionId)
      
      toast.success('¡Debate creado!', {
        description: `Debate ID: ${newDebate.id.substring(0, 8)}...`,
        duration: 5000,
      })
      
      // Redirección se maneja en PhaseDebate component cuando debateId está disponible
      // Force a small delay to ensure state update propagates
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Ensure isCreatingDebate is reset after successful creation
      setIsCreatingDebate(false)
    } catch (error) {
      // Log detailed error information
      const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : { error: String(error) }
      
      logger.error('Error creating debate:', error instanceof Error ? error : undefined, errorDetails)
      
      // Check if it's a network error
      const isNetworkError = error instanceof Error && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('fetch')
      )
      
      toast.error('Error al crear debate', {
        description: isNetworkError 
          ? 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.'
          : (error instanceof Error ? error.message : 'Error desconocido'),
        duration: 6000,
      })
      setIsCreatingDebate(false)
    }
  }, [contexto, expertos, createDebate, createDraft, updatePhaseProgress, sessionId, clearSavedState])
  
  // Editar respuesta individual
  const handleEditAnswer = useCallback((questionId: string, newAnswer: string) => {
    setContexto((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: newAnswer,
      },
      // Si editamos una respuesta, puede que necesitemos re-evaluar
      // pero por ahora solo actualizamos la respuesta
    }))
    
    toast.success('Respuesta actualizada')
  }, [])

  // Habilitar búsqueda en internet para una pregunta específica
  const handleEnableInternetSearch = useCallback(async (questionId?: string) => {
    const currentQ = questionId 
      ? contexto.questions.find(q => q.id === questionId)
      : contexto.questions[contexto.currentQuestionIndex]
    
    if (!currentQ) return

    const searchQuery = `${contexto.mainQuestion} ${currentQ.content}`
    
    // Activar estado de búsqueda
    setContexto((prev) => ({
      ...prev,
      internetSearch: {
        ...prev.internetSearch || INITIAL_INTERNET_SEARCH,
        enabled: true,
        isSearching: true,
        currentSearchQuery: searchQuery,
        currentQuestionId: currentQ.id,
        error: null,
        customText: null, // Reset texto alternativo al iniciar nueva búsqueda
        isApplied: false, // Reset estado aplicado
      },
    }))

    try {
      // Llamar a la API de auto-research con la pregunta específica
      const result = await autoResearch.mutateAsync({
        question: searchQuery,
      })

      // Convertir resultados a formato InternetSearchResult
      const searchResults: InternetSearchResult[] = (result.researchResults || []).map((r: { title: string; summary: string; url?: string }, index: number) => ({
        id: `result-${index}`,
        title: r.title || 'Sin título',
        summary: r.summary || '',
        url: r.url,
        selected: false, // Por defecto no seleccionados, el usuario decide
      }))

      // Si no hay resultados, cerrar automáticamente y mostrar toast
      if (searchResults.length === 0) {
        setContexto((prev) => ({
          ...prev,
          internetSearch: INITIAL_INTERNET_SEARCH, // Cerrar búsqueda automáticamente
        }))
        toast.info('No se encontraron resultados en internet', {
          description: 'Puedes responder manualmente a la pregunta.',
          duration: 4000,
        })
        return
      }

      // Actualizar con los resultados (sin incluir automáticamente en contexto)
      setContexto((prev) => ({
        ...prev,
        internetSearch: {
          enabled: true,
          isSearching: false,
          results: searchResults,
          context: null, // Se actualizará cuando el usuario seleccione resultados
          customText: null, // Texto alternativo del usuario
          currentSearchQuery: searchQuery,
          currentQuestionId: currentQ.id,
          error: null,
          isApplied: false, // Aún no aplicado
        },
      }))

      toast.success(`${searchResults.length} resultado${searchResults.length !== 1 ? 's' : ''} encontrado${searchResults.length !== 1 ? 's' : ''}`, {
        description: 'Revisa los resultados y selecciona los que quieras incluir en el contexto.',
      })
    } catch (error) {
      // Cerrar automáticamente la búsqueda
      setContexto((prev) => ({
        ...prev,
        internetSearch: INITIAL_INTERNET_SEARCH, // Cerrar búsqueda automáticamente
      }))
      
      // Detectar error de créditos insuficientes (TRPCError con código PAYMENT_REQUIRED)
      // El error puede venir en múltiples formatos:
      // 1. error.data.code (TRPCError directo)
      // 2. error.cause.responseBody[0].error.json.data.code (TRPCClientError)
      // 3. Mensaje de error que contiene "402 Payment Required" o "Créditos insuficientes"
      
      const errorObj = error && typeof error === 'object' ? error as Record<string, unknown> : null
      const isTRPCError = errorObj && 'data' in errorObj
      let isPaymentRequired = false
      
      // Ruta 1: error.data.code (TRPCError directo)
      if (isTRPCError && errorObj.data && typeof errorObj.data === 'object') {
        const data = errorObj.data as Record<string, unknown>
        isPaymentRequired = data.code === 'PAYMENT_REQUIRED'
      }
      
      // Ruta 2: error.cause.responseBody (TRPCClientError)
      if (!isPaymentRequired && errorObj && 'cause' in errorObj && errorObj.cause && typeof errorObj.cause === 'object') {
        const cause = errorObj.cause as Record<string, unknown>
        if (cause.responseBody && Array.isArray(cause.responseBody) && cause.responseBody.length > 0) {
          const firstError = cause.responseBody[0] as Record<string, unknown>
          if (firstError.error && typeof firstError.error === 'object') {
            const errorData = firstError.error as Record<string, unknown>
            if (errorData.json && typeof errorData.json === 'object') {
              const jsonData = errorData.json as Record<string, unknown>
              if (jsonData.data && typeof jsonData.data === 'object') {
                const data = jsonData.data as Record<string, unknown>
                isPaymentRequired = data.code === 'PAYMENT_REQUIRED'
              }
            }
          }
        }
        // También verificar status 402 en cause
        if (!isPaymentRequired && cause.status === 402) {
          isPaymentRequired = true
        }
      }
      
      // Ruta 3: Mensaje de error
      const errorMessage = error instanceof Error ? error.message : 
                          (errorObj && 'message' in errorObj) ? String(errorObj.message) : 
                          'Error desconocido'
      const isCreditsError = isPaymentRequired || 
                            errorMessage.includes('Créditos insuficientes') || 
                            errorMessage.includes('402 Payment Required') ||
                            errorMessage.includes('PAYMENT_REQUIRED')
      
      if (isCreditsError) {
        // Extraer información del error si está disponible
        let errorDetails = 'No tienes suficientes créditos para buscar en internet.'
        
        // Intentar extraer información detallada del error
        if (errorObj && 'cause' in errorObj && errorObj.cause && typeof errorObj.cause === 'object') {
          const cause = errorObj.cause as Record<string, unknown>
          
          // Buscar en responseBody
          if (cause.responseBody && Array.isArray(cause.responseBody) && cause.responseBody.length > 0) {
            const firstError = cause.responseBody[0] as Record<string, unknown>
            if (firstError.error && typeof firstError.error === 'object') {
              const errorData = firstError.error as Record<string, unknown>
              if (errorData.json && typeof errorData.json === 'object') {
                const jsonData = errorData.json as Record<string, unknown>
                // El mensaje detallado está en jsonData.message
                if (jsonData.message && typeof jsonData.message === 'string') {
                  errorDetails = jsonData.message
                }
              }
            }
          }
        }
        
        // Error esperado de créditos insuficientes - solo loguear como warning, no como error
        logger.warn('Búsqueda en internet cancelada: créditos insuficientes', {
          error: error instanceof Error ? error.message : String(error),
        })
        toast.error('Créditos insuficientes', {
          description: errorDetails,
          duration: 6000,
        })
      } else {
        // Error inesperado - loguear como error para debugging
        logger.error('Error en búsqueda de internet:', error instanceof Error ? error : undefined)
        toast.error('No se pudo buscar en internet', {
          description: 'Puedes responder manualmente a la pregunta.',
          duration: 4000,
        })
      }
    }
  }, [contexto.mainQuestion, autoResearch])

  // Toggle selección de resultado de búsqueda
  const handleToggleSearchResult = useCallback((resultId: string) => {
    setContexto((prev) => {
      if (!prev.internetSearch) {
        return prev
      }

      const updatedResults = prev.internetSearch.results.map((r) =>
        r.id === resultId ? { ...r, selected: !r.selected } : r
      )

      // Construir contexto solo con resultados seleccionados
      const selectedResults = updatedResults.filter((r) => r.selected)
      const newContext = selectedResults.length > 0
        ? selectedResults.map((r) => `${r.title}: ${r.summary}`).join('\n\n')
        : null

      return {
        ...prev,
        internetSearch: {
          ...prev.internetSearch,
          results: updatedResults,
          context: newContext,
        },
      }
    })
  }, [])

  // Actualizar texto alternativo del usuario
  const handleUpdateCustomText = useCallback((text: string) => {
    setContexto((prev) => {
      if (!prev.internetSearch) {
        return prev
      }
      return {
        ...prev,
        internetSearch: {
          ...prev.internetSearch,
          customText: text.trim() || null,
        },
      }
    })
  }, [])

  // Aplicar resultados seleccionados al contexto (sin cerrar, permite editar)
  const handleApplySelectedResults = useCallback(() => {
    if (!contexto.internetSearch || !contexto.internetSearch.currentQuestionId) {
      toast.warning('No hay búsqueda activa o pregunta asociada.')
      return
    }

    const selectedResults = contexto.internetSearch.results.filter((r) => r.selected)
    const customText = contexto.internetSearch.customText?.trim()

    // Construir contexto combinando resultados seleccionados y texto alternativo
    let finalContext = ''

    if (selectedResults.length > 0) {
      finalContext = selectedResults.map(r => `${r.title}: ${r.summary}`).join('\n\n')
    }

    if (customText) {
      if (finalContext) {
        finalContext += '\n\n--- Texto adicional del usuario ---\n' + customText
      } else {
        finalContext = customText
      }
    }

    if (!finalContext) {
      toast.warning('Selecciona al menos un resultado o introduce un texto alternativo')
      return
    }

    // Marcar como aplicado (pero no cerrar, permite editar)
    setContexto((prev) => ({
      ...prev,
      internetSearch: {
        ...prev.internetSearch!,
        context: finalContext,
        isApplied: true, // Marcar como aplicado
      },
    }))

    toast.success('Contexto de internet guardado. Puedes continuar o editar la selección.')
  }, [contexto.internetSearch])

  // Continuar con el contexto aplicado (cerrar y usar como respuesta)
  const handleContinueWithInternetContext = useCallback(() => {
    if (!contexto.internetSearch || !contexto.internetSearch.currentQuestionId || !contexto.internetSearch.context) {
      toast.warning('No hay contexto de internet aplicado')
      return
    }

    // Usar el contexto como respuesta a la pregunta actual
    handleAnswer(contexto.internetSearch.context, contexto.internetSearch.currentQuestionId)

    // Limpiar el estado de búsqueda de internet para esta pregunta
    setContexto((prev) => ({
      ...prev,
      internetSearch: {
        ...INITIAL_INTERNET_SEARCH, // Reset internet search state
        enabled: true, // Keep enabled if user wants to search again for other questions
      },
    }))

    toast.success('Contexto de internet aplicado a la respuesta')
  }, [contexto.internetSearch, handleAnswer])

  // Permitir volver a editar la selección
  const handleEditInternetSearchSelection = useCallback(() => {
    setContexto((prev) => ({
      ...prev,
      internetSearch: prev.internetSearch ? {
        ...prev.internetSearch,
        isApplied: false, // Permitir editar de nuevo
      } : prev.internetSearch,
    }))
  }, [])

  // Marcar que el usuario rechazó la búsqueda en internet (no volver a preguntar)
  const handleDeclineInternetSearch = useCallback(() => {
    setContexto((prev) => ({
      ...prev,
      userDeclinedInternetSearch: true,
    }))
  }, [])

  // Limpiar progreso guardado manualmente
  const clearProgress = useCallback(() => {
    clearSavedState(sessionId)
    setCurrentPhase(1)
    setPhaseProgress(INITIAL_PROGRESS)
    setContexto(INITIAL_CONTEXTO)
    setExpertos(INITIAL_EXPERTOS)
    setEstrategia(INITIAL_ESTRATEGIA)
    setRevision(INITIAL_REVISION)
    toast.success('Progreso limpiado')
  }, [])
  
  // Navigation handlers
  const goToNextPhase = useCallback(() => {
    if (!canGoNext()) return
    
    if (currentPhase === 4) {
      // From revision, create debate
      handleCreateDebate()
    } else {
      // Update revision summary before going to phase 4
      if (currentPhase === 3) {
        setRevision({
          canProceed: true,
          summary: {
            question: contexto.mainQuestion,
            expertCount: expertos.selectedExpertIds.length,
            strategy: estrategia.selectedStrategy,
            contextScore: contexto.contextScore,
          },
        })
        updatePhaseProgress(4, 100)
      }
      
      setCurrentPhase((prev) => Math.min(5, prev + 1) as UnifiedPhase)
    }
  }, [currentPhase, canGoNext, contexto, expertos, estrategia, updatePhaseProgress, handleCreateDebate])
  
  const goToPreviousPhase = useCallback(() => {
    if (!canGoBack()) return
    setCurrentPhase((prev) => Math.max(1, prev - 1) as UnifiedPhase)
  }, [canGoBack])
  
  const goToPhase = useCallback((phase: UnifiedPhase) => {
    const phaseProgressValues = Object.values(phaseProgress)
    const targetPhaseIndex = phase - 1
    const canGoToPhase = phase <= currentPhase || phaseProgressValues[targetPhaseIndex] === 100
    
    if (canGoToPhase) {
      setCurrentPhase(phase)
    }
  }, [currentPhase, phaseProgress])

  /** Saltar a Expertos desde Contexto cuando el usuario pulsa "Pasar a siguiente fase" (contextProgress >= 80%). No aplica las restricciones de goToPhase. */
  const skipContextoAndGoToExpertos = useCallback(() => {
    if (currentPhase !== 1) return
    updatePhaseProgress(1, 100)
    setCurrentPhase(2)
  }, [currentPhase, updatePhaseProgress])

  return {
    // State
    sessionId, // ID único de la sesión de creación de debate
    currentPhase,
    phaseProgress,
    contexto,
    expertos,
    estrategia,
    revision,
    debate,
    isGeneratingQuestions,
    isEvaluating,
    isValidating,
    isCreatingDebate,

    // Navigation
    canGoNext: canGoNext(),
    canGoBack: canGoBack(),
    goToNextPhase,
    goToPreviousPhase,
    goToPhase,
    skipContextoAndGoToExpertos,
    
    // Handlers
    handleInitialQuestion,
    handleAnswer,
          handleEditAnswer, // Nuevo: editar respuesta individual
          handleEnableInternetSearch, // Nuevo: búsqueda en internet
          handleToggleSearchResult, // Nuevo: toggle selección de resultado
          handleUpdateCustomText, // Nuevo: actualizar texto alternativo
          handleApplySelectedResults, // Nuevo: aplicar resultados seleccionados (guardar sin cerrar)
          handleContinueWithInternetContext, // Nuevo: continuar con contexto aplicado
          handleEditInternetSearchSelection, // Nuevo: volver a editar selección
          handleDeclineInternetSearch, // Nuevo: rechazar búsqueda en internet
    handleParticipantUpdate,
    handleStrategySelection,
    handleFrameworkSelection,
    handleCreateDebate,
    clearProgress, // Nuevo: limpiar progreso guardado
  }
}
