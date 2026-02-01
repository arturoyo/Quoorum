/**
 * PhaseContexto Component (Unified - Typeform Style)
 * 
 * Phase 1: Context gathering with guided chat (one question at a time).
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, CheckCircle2, Eye, X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QuestionCard } from './question-card'
import { ContextSummary } from './context-summary'
import { InternetSearchResults } from './internet-search-results'
import { DebateStickyHeader } from './debate-sticky-header'
import { RealCreditsTracker } from './real-credits-tracker'
import { ValidationShield, ValidationBadge } from './validation-indicator'
import { cn, styles } from '@/lib/utils'
import { getRandomSuggestedQuestions } from '@/lib/suggested-debate-questions'
import { api } from '@/lib/trpc/client'
import type { ContextoState } from '../types'
import { useBackstoryHeader } from '../hooks/use-backstory-header'

interface PhaseContextoProps {
  state: ContextoState
  contextProgress?: number // Progreso de la fase (0-100%)
  onInitialQuestion: (question: string) => void
  onAnswer: (answer: string) => void
  onEditAnswer?: (questionId: string, newAnswer: string) => void
  onEnableInternetSearch?: (questionId?: string) => void
  onToggleSearchResult?: (resultId: string) => void
  onUpdateCustomText?: (text: string) => void
  onApplySelectedResults?: () => void
  onContinueWithInternetContext?: () => void
  onEditInternetSearchSelection?: () => void
  onDeclineInternetSearch?: () => void
  onClearProgress?: () => void
  /** Llamar cuando el usuario pulsa "Pasar a siguiente fase" (solo si contextProgress >= 80%) */
  onSkipToNextPhase?: () => void
  isGeneratingQuestions: boolean
  isEvaluating: boolean
  isValidating?: boolean
  isAdmin?: boolean
}

export function PhaseContexto({
  state,
  contextProgress = 0,
  onInitialQuestion,
  onAnswer,
  onEditAnswer,
  onEnableInternetSearch,
  onToggleSearchResult,
  onUpdateCustomText,
  onApplySelectedResults,
  onContinueWithInternetContext,
  onEditInternetSearchSelection,
  onDeclineInternetSearch: _onDeclineInternetSearch,
  onClearProgress,
  onSkipToNextPhase,
  isGeneratingQuestions,
  isEvaluating,
  isValidating = false,
  isAdmin = false,
}: PhaseContextoProps) {
  const router = useRouter()
  const [initialQuestion, setInitialQuestion] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  
  // Estado para detectar si el componente está montado en el cliente (evita hydration mismatch)
  const [isMounted, setIsMounted] = useState(false)
  
  // Generar preguntas sugeridas solo en el cliente para evitar hydration mismatch
  // Los hooks DEBEN estar fuera de condicionales (React Rules of Hooks)
  // Inicializar con fallback para que siempre haya preguntas visibles
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(() => {
    // Inicializar con preguntas fallback inmediatamente para evitar UI vacía
    if (typeof window !== 'undefined') {
      return getRandomSuggestedQuestions(3)
    }
    return []
  })
  
  // Get dynamic header based on user's backstory (company, role, industry, etc.)
  // Falls back to random prompt if no backstory is configured
  const backstoryHeader = useBackstoryHeader()
  
  // Marcar componente como montado solo en el cliente
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ========================================================================
  // CONTEXT HUB: Fetch complete user context once (centralized)
  // ========================================================================
  const { data: contextHub, isLoading: isLoadingContext } = api.debates.getUserContextHub.useQuery(
    undefined,
    {
      enabled: isMounted && state.phase === 'initial' && typeof window !== 'undefined',
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: 1,
    }
  )

  // ========================================================================
  // PERSONALIZED PROMPT: Replaced by useBackstoryHeader hook
  // Now using direct backstory data instead of AI-generated prompts
  // ========================================================================
  
  // Generar preguntas sugeridas contextualizadas usando IA
  // Los hooks DEBEN llamarse incondicionalmente (React Rules of Hooks)
  const { data: suggestedQuestionsData, isLoading: isLoadingSuggestions, error: suggestionsError } = api.debates.suggestInitialQuestions.useQuery(
    { 
      count: 3,
      contextText: contextHub?.fullContextText, // Pass cached context to avoid redundant queries
    },
    {
      enabled: isMounted && state.phase === 'initial' && typeof window !== 'undefined',
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: 1, // Only retry once if it fails
    }
  )

  // Update suggested questions when data arrives or on error
  useEffect(() => {
    if (suggestedQuestionsData && suggestedQuestionsData.length > 0) {
      setSuggestedQuestions(suggestedQuestionsData)
    } else if (isMounted && state.phase === 'initial' && !isLoadingSuggestions) {
      // Fallback to random questions if AI generation fails, returns empty, or errors
      if (!suggestedQuestionsData || suggestedQuestionsData.length === 0 || suggestionsError) {
        const fallbackQuestions = getRandomSuggestedQuestions(3)
        setSuggestedQuestions(fallbackQuestions)
      }
    }
  }, [suggestedQuestionsData, isMounted, state.phase, isLoadingSuggestions, suggestionsError])
  
  // Asegurar que las funciones siempre estén definidas
  const handleToggleSearchResult = onToggleSearchResult || (() => {})
  // onUpdateCustomText del hook ya tiene la firma correcta (text: string) => void
  const handleUpdateCustomText = onUpdateCustomText || (() => {})
  const handleApplySelectedResults = onApplySelectedResults || (() => {})
  const handleContinueWithInternetContext = onContinueWithInternetContext || (() => {})
  const handleEditInternetSearchSelection = onEditInternetSearchSelection || (() => {})
  
  // Show initial question input
  if (state.phase === 'initial') {
    // Si estamos generando preguntas, mostrar estado de carga centrado en pantalla
    if (isGeneratingQuestions) {
      return (
        <div className={cn(
          'fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm',
          styles.colors.bg.primary,
          'bg-opacity-80'
        )}>
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
            <p className={cn('text-lg', styles.colors.text.primary)}>Generando preguntas...</p>
          </div>
        </div>
      )
    }

    const contextProgressBar = (
      <div className="flex items-center gap-4">
        <div className={cn('flex-1 min-w-0 h-4 rounded-full overflow-hidden relative', styles.colors.bg.input)}>
          <div
            className={cn(
              'absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-purple-400 to-blue-500 transition-all duration-500 ease-out rounded-full',
              `w-[${Math.max(contextProgress, 2)}%]`
            )}
          />
        </div>
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 border-2 border-purple-400 flex items-center justify-center">
          <span className={cn('text-sm font-bold', styles.colors.text.primary)} suppressHydrationWarning>
            {Math.round(contextProgress)}%
          </span>
        </div>
      </div>
    )

    return (
      <div className="w-full max-w-2xl mx-auto">
        <DebateStickyHeader
          topContent={contextProgressBar}
          phaseNumber={1}
          title={backstoryHeader.title}
          subtitle={backstoryHeader.subtitle}
        />

        {/* Mostrar créditos gastados en tiempo real si hay algún consumo */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          {state.realCreditsDeducted > 0 && (
            <RealCreditsTracker
              realCreditsDeducted={state.realCreditsDeducted}
              variant="inline"
            />
          )}

          {/* Indicador de validación activa */}
          {state.phase !== 'initial' && (
            <ValidationShield />
          )}

          {/* Indicador en tiempo real de validación */}
          {isValidating && (
            <ValidationBadge isValidating={true} />
          )}
        </div>

        <div className="mt-4 mb-6">
          {initialQuestion.trim().length > 0 && initialQuestion.trim().length < 10 && (
            <p className="text-sm text-amber-400 mt-2">
              Necesitas al menos {10 - initialQuestion.trim().length} carácter{10 - initialQuestion.trim().length !== 1 ? 'es' : ''} más
            </p>
          )}
        </div>
        <div className="space-y-5">
          {/* 3 Preguntas sugeridas - Siempre mostrar si hay preguntas disponibles */}
          <div suppressHydrationWarning>
            {isMounted && suggestedQuestions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm styles.colors.text.tertiary font-medium">Preguntas sugeridas:</p>
                  {isLoadingSuggestions && (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                  )}
                </div>
                {isLoadingSuggestions && suggestedQuestions.length === 0 ? (
                  <div className="grid gap-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-4 rounded-lg border-2 styles.colors.border.default styles.colors.bg.secondary animate-pulse"
                      >
                        <div className="h-4 styles.colors.bg.tertiary rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {suggestedQuestions.map((suggested, index) => (
                    <button
                      key={`${suggested}-${index}`}
                      onClick={() => {
                        setInitialQuestion(suggested)
                        // Auto-submit si cumple requisitos
                        if (suggested.trim().length >= 10) {
                          onInitialQuestion(suggested.trim())
                        }
                      }}
                      disabled={isGeneratingQuestions}
                      className={cn(
                        'p-4 rounded-lg border-2 text-left transition-all',
                        'styles.colors.bg.secondary styles.colors.border.default styles.colors.text.primary',
                        'hover:border-purple-500 hover:bg-purple-500/10',
                        'focus:outline-none focus:ring-2 focus:ring-purple-500',
                        isGeneratingQuestions && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-base leading-relaxed">{suggested}</span>
                        <Sparkles className="h-4 w-4 text-purple-400 flex-shrink-0 mt-1" />
                      </div>
                    </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative py-1.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t styles.colors.border.default"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 styles.colors.bg.primary styles.colors.text.tertiary">O escribe tu propia pregunta</span>
            </div>
          </div>

          <Input
            value={initialQuestion}
            onChange={(e) => setInitialQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (initialQuestion.trim() && initialQuestion.trim().length >= 10) {
                  onInitialQuestion(initialQuestion.trim())
                }
              }
            }}
            placeholder="Ej: ¿Debería lanzar mi producto ahora o esperar 3 meses? (mínimo 10 caracteres)"
            disabled={isGeneratingQuestions}
            className={cn(
              'h-16 text-lg styles.colors.bg.secondary styles.colors.border.default styles.colors.text.primary',
              'placeholder:styles.colors.text.tertiary focus-visible:ring-purple-500',
              'focus-visible:border-purple-500',
              initialQuestion.trim().length > 0 && initialQuestion.trim().length < 10 && 'border-amber-500/50 focus-visible:ring-amber-500 focus-visible:border-amber-500'
            )}
            autoFocus
          />
          <div className="pt-1.5">
            <Button
              onClick={() => {
                if (initialQuestion.trim() && initialQuestion.trim().length >= 10) {
                  onInitialQuestion(initialQuestion.trim())
                }
              }}
              disabled={!initialQuestion.trim() || initialQuestion.trim().length < 10 || isGeneratingQuestions}
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white text-lg"
            >
              {isGeneratingQuestions ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generando preguntas...
                </>
              ) : (
                <>
                  Comenzar
                  <Sparkles className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  // Show summary view if requested
  if (showSummary) {
    return (
      <div className="w-full">
        <ContextSummary
          contexto={state}
          onEditAnswer={onEditAnswer || (() => {})}
          onClose={() => setShowSummary(false)}
        />
      </div>
    )
  }

  // Mostrar resultados de búsqueda para selección
  if (
    state.internetSearch?.enabled &&
    !state.internetSearch.isSearching &&
    state.internetSearch.results.length > 0 &&
    showSearchResults &&
    !state.internetSearch.context
  ) {
    return (
      <InternetSearchResults
        internetSearch={state.internetSearch}
        onToggleResult={handleToggleSearchResult}
        onUpdateCustomText={handleUpdateCustomText}
        onApplyResults={() => {
          handleApplySelectedResults()
          setShowSearchResults(false)
        }}
        onContinue={handleContinueWithInternetContext}
        onEdit={handleEditInternetSearchSelection}
        onSkip={() => {
          setShowSearchResults(false)
        }}
      />
    )
  }

  // Show evaluation result
  if (state.evaluation && state.phase === 'ready') {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold styles.colors.text.primary mb-4">
            ¡Contexto completado!
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30">
            <span className="text-2xl font-bold text-purple-300">{state.contextScore}</span>
            <span className="styles.colors.text.secondary">/ 100</span>
          </div>
        </div>
        
        <div className="styles.colors.bg.secondary border styles.colors.border.default rounded-lg p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold styles.colors.text.primary">Evaluación del contexto</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm styles.colors.text.secondary">Calidad:</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
                  <span className="text-base font-bold text-purple-300">{state.contextScore}</span>
                  <span className="text-xs styles.colors.text.tertiary">/100</span>
                </span>
              </div>
            </div>
            <p className="styles.colors.text.secondary whitespace-pre-wrap mb-3">{state.evaluation.reasoning}</p>
            <div className="styles.colors.bg.tertiary border styles.colors.border.default rounded-lg p-3 mt-3">
              <p className="text-xs styles.colors.text.secondary">
                <strong className="styles.colors.text.primary">💡 Diferencia entre las métricas:</strong>
              </p>
              <ul className="text-xs styles.colors.text.tertiary mt-2 space-y-1 list-disc list-inside">
                <li><strong className="text-purple-300">{state.contextScore}/100</strong>: Calidad del contexto (qué tan completo y útil es)</li>
                <li><strong className="text-blue-300">{contextProgress ?? 0}%</strong>: Progreso de la fase (cuánto has avanzado respondiendo preguntas)</li>
              </ul>
            </div>
          </div>
          
          {state.evaluation.missingAspects.length > 0 && (
            <div>
              <h4 className="text-sm font-medium styles.colors.text.secondary mb-2">Aspectos a considerar:</h4>
              <ul className="list-disc list-inside space-y-1 styles.colors.text.secondary">
                {state.evaluation.missingAspects.map((aspect, index) => (
                  <li key={index}>{aspect}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Botón para ver resumen completo */}
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => setShowSummary(true)}
            className="w-full styles.colors.border.default styles.colors.bg.secondary styles.colors.text.primary hover:styles.colors.bg.tertiary"
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver resumen completo de preguntas y respuestas
          </Button>
        </div>
      </div>
    )
  }
  
  // Show current question
  const currentQuestion = state.questions[state.currentQuestionIndex]
  
  // Solo mostrar "Cargando..." si realmente estamos generando preguntas
  // Si no hay pregunta pero tampoco estamos generando, volver a la fase inicial
  if (!currentQuestion) {
    // Si estamos generando preguntas, mostrar loading centrado
    if (isGeneratingQuestions) {
      return (
        <div className="w-full max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            <p className="styles.colors.text.secondary text-lg">Generando preguntas...</p>
          </div>
        </div>
      )
    }
    
    // Si no hay preguntas y no estamos generando, ofrecer opciones
    if (state.questions.length === 0) {
      return (
        <div className="w-full max-w-2xl mx-auto text-center space-y-4">
          <p className="styles.colors.text.secondary mb-4">
            No hay preguntas disponibles. El estado guardado puede estar corrupto.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => {
                // Limpiar estado usando la función del hook
                if (onClearProgress) {
                  onClearProgress()
                } else {
                  // Fallback: limpiar localStorage y recargar
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('quoorum-debate-creation-state')
                    window.location.reload()
                  }
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Limpiar estado y comenzar de nuevo
            </Button>
            <Button
              onClick={() => {
                // Navegar a la página de debates (lista de debates)
                router.push('/debates')
              }}
              variant="outline"
              className="styles.colors.border.default styles.colors.bg.secondary styles.colors.text.primary hover:styles.colors.bg.tertiary"
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      )
    }
    
    // Si hay preguntas pero el índice está fuera de rango
    // Verificar si estamos en transición (evaluando o generando) antes de mostrar error
    if (state.questions.length > 0 && state.currentQuestionIndex >= state.questions.length) {
      // Si estamos en transición, mostrar loading en lugar de error
      if (isEvaluating || isGeneratingQuestions) {
        return (
          <div className="fixed inset-0 flex items-center justify-center z-50 styles.colors.bg.primary/80 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
              <p className="text-lg styles.colors.text.primary">Cargando siguiente pregunta...</p>
            </div>
          </div>
        )
      }
      
      // Solo mostrar error si NO estamos en transición (error real)
      return (
        <div className="w-full max-w-2xl mx-auto text-center space-y-4">
          <p className="styles.colors.text.secondary mb-4">
            El índice de pregunta está fuera de rango. Limpiando estado...
          </p>
          <Button
            onClick={() => {
              // Limpiar estado usando la función del hook
              if (onClearProgress) {
                onClearProgress()
              } else {
                // Fallback: limpiar localStorage y recargar
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('quoorum-debate-creation-state')
                  window.location.reload()
                }
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Limpiar estado y comenzar de nuevo
          </Button>
        </div>
      )
    }
    
    // Si no hay pregunta pero hay preguntas en el array y estamos en transición
    if (state.questions.length > 0 && (isEvaluating || isGeneratingQuestions)) {
      return (
        <div className="fixed inset-0 flex items-center justify-center z-50 styles.colors.bg.primary/80 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
            <p className="text-lg styles.colors.text.primary">Cargando siguiente pregunta...</p>
          </div>
        </div>
      )
    }
    
    // Si llegamos aquí, algo está mal pero no sabemos qué
    return null
  }
  
  // Buscar mensaje de validación más reciente para esta pregunta
  // Solo mostrar si es para la pregunta actual (no para preguntas anteriores)
  const _currentQuestionId = currentQuestion.id
  const validationMessage = state.messages
    .filter(msg => msg.type === 'validation')
    .slice(-1)[0]
  
  // Verificar que el mensaje de validación es reciente (últimos 2 mensajes)
  const recentMessages = state.messages.slice(-2)
  const isRecentValidation = recentMessages.some(msg => msg.type === 'validation')
  
  const validationError = validationMessage && isRecentValidation
    ? validationMessage.content.replace(/\u26A0\uFE0F \*\*.*?\*\*\n\n|\u274C \*\*.*?\*\*\n\n/g, '').trim()
    : null

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {state.internetSearch?.enabled && (
        <div className={cn(
          "rounded-lg border p-4",
          state.internetSearch.isSearching
            ? "bg-purple-500/10 border-purple-500/30"
            : state.internetSearch.context
            ? "bg-green-500/10 border-green-500/30"
            : "bg-yellow-500/10 border-yellow-500/30"
        )}>
          <div className="flex items-center gap-3">
            {state.internetSearch.isSearching ? (
              <>
                <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
                <div>
                  <p className="text-sm font-medium styles.colors.text.primary">Buscando en internet...</p>
                  <p className="text-xs styles.colors.text.secondary">Puedes continuar respondiendo mientras buscamos</p>
                </div>
              </>
            ) : state.internetSearch.context ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium styles.colors.text.primary">Contexto de internet incluido</p>
                  <p className="text-xs styles.colors.text.secondary">
                    {state.internetSearch.results.filter((r) => r.selected).length} resultado{state.internetSearch.results.filter((r) => r.selected).length !== 1 ? 's' : ''} seleccionado{state.internetSearch.results.filter((r) => r.selected).length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSearchResults(true)
                  }}
                  className="text-purple-400 hover:text-purple-300"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver resultados
                </Button>
              </>
            ) : state.internetSearch.results.length > 0 ? (
              <>
                <CheckCircle className="h-5 w-5 text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium styles.colors.text.primary">Resultados disponibles</p>
                  <p className="text-xs styles.colors.text.secondary">
                    {state.internetSearch.results.length} resultado{state.internetSearch.results.length !== 1 ? 's' : ''} encontrado{state.internetSearch.results.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSearchResults(true)
                  }}
                  className="text-purple-400 hover:text-purple-300"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver y seleccionar
                </Button>
              </>
            ) : (
              <>
                <X className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-sm font-medium styles.colors.text.primary">No se encontró contexto en internet</p>
                  <p className="text-xs styles.colors.text.secondary">{state.internetSearch.error || 'Continuaremos sin contexto adicional'}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

            <QuestionCard
              key={currentQuestion.id}
              question={currentQuestion}
              answer={state.answers[currentQuestion.id]}
              onAnswer={onAnswer}
              isLoading={isEvaluating}
              isFirst={state.currentQuestionIndex === 0}
              isLast={state.currentQuestionIndex === state.questions.length - 1}
              validationError={validationError}
              onSearchInternet={() => onEnableInternetSearch?.(currentQuestion.id)}
              isSearching={state.internetSearch?.isSearching && state.internetSearch?.currentQuestionId === currentQuestion.id}
              searchQuery={state.internetSearch?.currentSearchQuery}
              questionNumber={Object.keys(state.answers).length + 1}
              totalQuestions={state.questions.length > 0 ? state.questions.length : undefined}
              isContextPhaseReady={state.phase === 'ready'}
              isAdmin={isAdmin}
              onShowSummary={() => setShowSummary(true)}
              answersCount={Object.keys(state.answers).length}
              contextProgress={contextProgress}
              onSkipToNextPhase={onSkipToNextPhase}
            />
            
            {/* Mostrar resultados de búsqueda si están disponibles para esta pregunta */}
            {state.internetSearch?.enabled && 
             !state.internetSearch.isSearching && 
             state.internetSearch.results.length > 0 &&
             state.internetSearch.currentQuestionId === currentQuestion.id && (
              <div className="mt-6">
                <InternetSearchResults
                  internetSearch={state.internetSearch}
                  onToggleResult={handleToggleSearchResult}
                  onUpdateCustomText={handleUpdateCustomText}
                  onApplyResults={handleApplySelectedResults}
                  onContinue={handleContinueWithInternetContext}
                  onEdit={handleEditInternetSearchSelection}
                  onSkip={() => {
                    // Permitir responder manualmente sin usar resultados
                    // El usuario puede simplemente escribir su respuesta
                  }}
                />
              </div>
            )}
    </div>
  )
}
