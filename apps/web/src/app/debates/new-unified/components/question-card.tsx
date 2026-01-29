/**
 * QuestionCard Component
 * 
 * Typeform-style question card: one question at a time, centered, visual.
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { api } from '@/lib/trpc/client'
import { ArrowRight, ArrowLeft, Loader2, Globe, Search, Sparkles, Eye, ChevronRight, ChevronDown } from 'lucide-react'
import { SuggestedAnswerCard } from './suggested-answer-card'
import { DebateStickyHeader } from './debate-sticky-header'
import type { Question } from '../types'

interface QuestionCardProps {
  question: Question
  answer?: string
  onAnswer: (answer: string) => void
  onBack?: () => void
  isLoading?: boolean
  isFirst?: boolean
  isLast?: boolean
  validationError?: string | null // Mensaje de error de validación si la respuesta no es relevante
  onSearchInternet?: () => void // Nueva prop para buscar en internet
  isSearching?: boolean // Si se está buscando en internet
  searchQuery?: string // Qué se está buscando
  questionNumber?: number // Número de pregunta actual (1-based)
  totalQuestions?: number // Total de preguntas
  isContextPhaseReady?: boolean; // Nuevo: si la fase de contexto está lista
  isAdmin?: boolean; // Si el usuario es admin (para mostrar debug)
  onShowSummary?: () => void
  answersCount?: number
  /** Progreso de contexto (0–100). Si se pasa, se muestra barra + % dentro del sticky. */
  contextProgress?: number
  /** Pasar a fase 2 (expertos). Se muestra a la derecha de Continuar solo si contextProgress >= 80. */
  onSkipToNextPhase?: () => void
}

/**
 * Determina si una pregunta merece búsqueda en internet
 * Solo para preguntas que requieren información externa, datos actuales, estadísticas, etc.
 */
function shouldShowInternetSearch(question: Question): boolean {
  const content = question.content.toLowerCase()
  
  // Palabras clave que indican que la pregunta requiere información externa
  const internetSearchKeywords = [
    // Datos y estadísticas
    'cuánto', 'cuánta', 'cuántos', 'cuántas', 'estadística', 'estadísticas', 'dato', 'datos',
    'porcentaje', 'ratio', 'tasa', 'tendencia', 'tendencias', 'proyección', 'proyecciones',
    'mercado', 'industria', 'sector', 'competencia', 'competidores',
    
    // Información actual/externa
    'actual', 'actualmente', 'ahora', 'hoy', 'reciente', 'recientemente', 'último', 'última',
    'últimos', 'últimas', 'nuevo', 'nueva', 'nuevos', 'nuevas', 'noticia', 'noticias',
    'investigación', 'estudio', 'estudios', 'reporte', 'reportes', 'análisis',
    
    // Comparaciones y benchmarks
    'comparar', 'comparación', 'benchmark', 'benchmarks', 'referencia', 'referencias',
    'promedio', 'promedios', 'estándar', 'estándares', 'mejor práctica', 'mejores prácticas',
    
    // Información específica externa
    'precio', 'precios', 'costo', 'costos', 'tarifa', 'tarifas', 'valor', 'valores',
    'opción', 'opciones', 'alternativa', 'alternativas', 'solución', 'soluciones',
    'herramienta', 'herramientas', 'tecnología', 'tecnologías', 'plataforma', 'plataformas',
    
    // Tendencias y contexto de mercado
    'tendencia', 'tendencias', 'moda', 'popular', 'éxito', 'exitoso', 'fallo', 'fracaso',
    'caso de uso', 'casos de uso', 'ejemplo', 'ejemplos', 'historia', 'historias',
  ]
  
  // Patrones que indican que NO necesita búsqueda (preguntas personales/internas)
  // Estos tienen prioridad sobre las palabras clave de búsqueda
  
  // Patrones de exclusión (más específicos primero)
  const exclusionPatterns = [
    // Objetivos e intenciones personales
    /objetivo.*quieres|quieres.*objetivo|objetivo principal.*quieres|quieres lograr|objetivo.*lograr/,
    /cuál es.*objetivo|cuál es tu objetivo|cuál es el objetivo.*quieres/,
    /qué quieres|qué deseas|qué buscas|qué pretendes|qué persigues/,
    /tu objetivo|tus objetivos|tu meta|tus metas|tu propósito|tus propósitos/,
    
    // Preguntas sobre intenciones y preferencias
    /qué piensas|qué opinas|qué sientes|qué percibes|qué consideras/,
    /cómo sientes|cómo percibes|cómo ves|cómo consideras|cómo evalúas/,
    /cuál es tu|cuáles son tus|cuál es tu experiencia|cuál es tu situación/,
    
    // Preguntas personales/internas
    /tu empresa|tu negocio|tu equipo|tu producto|tu servicio/,
    /tus clientes|tus usuarios|tus recursos|tu contexto|tu caso/,
    /tu historia|tu visión|tu misión|tu estrategia|tu plan/,
    
    // Palabras que indican subjetividad/personal
    /personal|interno|interna|privado|privada|confidencial|subjetivo/,
    
    // Preguntas sobre decisiones y razones personales
    /por qué.*decidir|por qué.*elegir|por qué.*optar|razón.*decidir/,
    /motivo.*decidir|causa.*decidir|impulso.*decidir/,
  ]
  
  // Verificar patrones de exclusión primero (tienen prioridad)
  const matchesExclusionPattern = exclusionPatterns.some(pattern => pattern.test(content))
  if (matchesExclusionPattern) {
    return false
  }
  
  // Palabras clave simples de exclusión (backup)
  const noInternetSearchKeywords = [
    'tu', 'tus', 'tú', 'tu empresa', 'tu negocio', 'tu equipo', 'tu producto',
    'tus clientes', 'tus usuarios', 'tus objetivos', 'tus metas', 'tus recursos',
    'personal', 'interno', 'interna', 'privado', 'privada', 'confidencial',
    'qué piensas', 'qué opinas', 'cómo sientes', 'cómo percibes', 'tu experiencia',
    'tu situación', 'tu contexto', 'tu caso', 'tu historia', 'tu visión',
    'quieres lograr', 'quieres conseguir', 'quieres alcanzar',
  ]
  
  // Si tiene palabras que indican que NO necesita búsqueda, no mostrar
  const hasNoSearchKeywords = noInternetSearchKeywords.some(keyword => content.includes(keyword))
  if (hasNoSearchKeywords) {
    return false
  }
  
  // Si tiene palabras que indican que SÍ necesita búsqueda, mostrar
  const hasSearchKeywords = internetSearchKeywords.some(keyword => content.includes(keyword))
  if (hasSearchKeywords) {
    return true
  }
  
  // Por defecto, no mostrar (solo mostrar cuando sea explícitamente necesario)
  return false
}

/**
 * Determina si una pregunta requiere respuesta larga (párrafo) o corta (línea)
 * Basado en palabras clave y estructura de la pregunta
 */
function inferAnswerType(question: Question): 'short' | 'long' {
  // Si ya está especificado, usarlo
  if (question.expectedAnswerType) {
    return question.expectedAnswerType
  }
  
  const content = question.content.toLowerCase()
  
  // Palabras clave que indican respuesta larga (párrafo)
  const longAnswerKeywords = [
    'describe', 'explica', 'explain', 'detalla', 'cuéntame', 'cuéntanos',
    'narrar', 'relata', 'desarrolla', 'expande', 'amplía', 'justifica',
    'razona', 'argumenta', 'analiza', 'evalúa', 'considera', 'reflexiona',
    'qué piensas', 'qué opinas', 'cómo ves', 'cómo percibes',
    'contexto', 'situación', 'historial', 'antecedentes', 'background',
    'motivos', 'razones', 'causas', 'consecuencias', 'impacto', 'efectos'
  ]
  
  // Palabras clave que indican respuesta corta (una línea)
  const shortAnswerKeywords = [
    'cuánto', 'cuánta', 'cuántos', 'cuántas', 'cuánto tiempo',
    'cuál', 'cuáles', 'qué fecha', 'qué día', 'qué mes', 'qué año',
    'dónde', 'dónde está', 'dónde se', 'cuándo', 'a qué hora',
    'quién', 'quiénes', 'nombre', 'título', 'valor', 'precio', 'costo',
    'número', 'cantidad', 'porcentaje', 'ratio', 'tasa'
  ]
  
  // Verificar palabras clave de respuesta larga
  const hasLongKeywords = longAnswerKeywords.some(keyword => content.includes(keyword))
  
  // Verificar palabras clave de respuesta corta
  const hasShortKeywords = shortAnswerKeywords.some(keyword => content.includes(keyword))
  
  // Si tiene palabras de respuesta larga, usar Textarea
  if (hasLongKeywords && !hasShortKeywords) {
    return 'long'
  }
  
  // Si tiene palabras de respuesta corta, usar Input
  if (hasShortKeywords && !hasLongKeywords) {
    return 'short'
  }
  
  // Si la pregunta es muy larga (más de 100 caracteres), probablemente requiere respuesta larga
  if (question.content.length > 100) {
    return 'long'
  }
  
  // Por defecto, usar Input (respuesta corta) para mantener la experiencia rápida
  return 'short'
}

export function QuestionCard({
  question,
  answer,
  onAnswer,
  onBack,
  isLoading = false,
  isFirst = false,
  isLast: _isLast = false,
  validationError = null,
  onSearchInternet,
  isSearching = false,
  searchQuery,
  questionNumber,
  totalQuestions: _totalQuestions,
  isContextPhaseReady: _isContextPhaseReady = false,
  isAdmin = false,
  onShowSummary,
  answersCount = 0,
  contextProgress,
  onSkipToNextPhase,
}: QuestionCardProps) {
  const [localAnswer, setLocalAnswer] = React.useState('')
  const [showAnswerInput, _setShowAnswerInput] = React.useState(true) // Mostrar input de respuesta por defecto
  const [yesNoAnswer, setYesNoAnswer] = React.useState<string | null>(null) // Para rastrear si se respondió Sí/No
  const [additionalContext, setAdditionalContext] = React.useState('') // Contexto adicional para respuestas "Sí"
  const [showDebugInfo, setShowDebugInfo] = React.useState(false) // Mostrar/ocultar info de debug
  const answerType = inferAnswerType(question)
  
  // Resetear COMPLETAMENTE todos los estados cuando cambia la pregunta (question.id)
  // Esto asegura que cada pregunta nueva empiece con campos completamente limpios
  React.useEffect(() => {
    // SIEMPRE resetear primero a vacío cuando cambia la pregunta
    setLocalAnswer('')
    setYesNoAnswer(null)
    setAdditionalContext('')
    // showAnswerInput siempre es true (ya no hay botón para ocultarlo)
    
    // Luego, si hay una respuesta guardada para esta pregunta específica, usarla
    // Esto permite cargar respuestas guardadas cuando se edita o se vuelve a una pregunta
    if (answer && answer.trim()) {
      setLocalAnswer(answer)
    }
  }, [question.id]) // SOLO resetear cuando cambia question.id (no cuando cambia answer)
  
  // Sincronizar localAnswer con answer prop cuando cambia (solo si corresponde a esta pregunta)
  // Esto maneja el caso donde se carga una respuesta guardada después del mount
  React.useEffect(() => {
    // Solo actualizar si answer cambia y es diferente al valor actual
    // Pero NO resetear si answer es undefined (puede ser que simplemente no haya respuesta aún)
    if (answer !== undefined) {
      if (answer !== localAnswer) {
        setLocalAnswer(answer)
      }
    }
  }, [answer]) // Solo cuando answer cambia externamente
  
  // Limpiar error de validación cuando el usuario edita la respuesta
  React.useEffect(() => {
    if (validationError && localAnswer.trim() && localAnswer !== answer) {
      // El usuario está editando, el error se limpiará en el próximo submit
    }
  }, [localAnswer, validationError, answer])
  
  const handleSubmit = () => {
    if (localAnswer.trim()) {
      onAnswer(localAnswer.trim())
      // No limpiar el campo si hay error de validación (para que el usuario pueda editar)
      if (!validationError) {
        setLocalAnswer('')
      }
    }
  }
  
  const handleOptionClick = (option: string) => {
    // Si es una pregunta yes_no y se responde "Sí", mostrar campo de contexto adicional
    if (question.questionType === 'yes_no' && option === 'Sí') {
      setYesNoAnswer('Sí')
      // No llamar a onAnswer todavía, esperar a que el usuario añada contexto o confirme
    } else if (question.questionType === 'yes_no' && option === 'No') {
      // Si es "No", enviar directamente sin contexto adicional
      onAnswer('No')
    } else {
      // Para otras opciones (multiple_choice), enviar directamente
      onAnswer(option)
    }
  }

  const handleYesWithContext = () => {
    // Combinar "Sí" con el contexto adicional si existe
    const finalAnswer = additionalContext.trim()
      ? `Sí. ${additionalContext.trim()}`
      : 'Sí'
    onAnswer(finalAnswer)
    // Resetear estados
    setYesNoAnswer(null)
    setAdditionalContext('')
  }

  const handleYesWithoutContext = () => {
    onAnswer('Sí')
    setYesNoAnswer(null)
    setAdditionalContext('')
  }

  // IMPORTANTE: También considerar como texto si es multiple_choice sin opciones válidas
  const isTextOrTextarea =
    (showAnswerInput || !!answer) &&
    (
      (question.questionType !== 'multiple_choice' && question.questionType !== 'yes_no') ||
      (question.questionType === 'multiple_choice' && (!question.options || question.options.length === 0))
    )

  const showSkipPhase =
    (contextProgress ?? 0) >= 80 && typeof onSkipToNextPhase === 'function'

  /** Botón "Pasar a siguiente fase" (derecha), solo si contextProgress >= 80% */
  const skipPhaseButton = showSkipPhase ? (
    <Button
      variant="outline"
      onClick={onSkipToNextPhase}
      className="border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/60 hover:text-[var(--theme-text-primary)] shrink-0"
    >
      Pasar a siguiente fase
      <ChevronRight className="ml-2 h-4 w-4" />
    </Button>
  ) : null

  // ═══════════════════════════════════════════════════════════
  // RESPUESTAS SUGERIDAS DINÁMICAS CON IA (en lugar de hardcodeadas)
  // ═══════════════════════════════════════════════════════════
  const { data: suggestedAnswersData, isLoading: isLoadingSuggestedAnswers } = api.debates.suggestAnswersForQuestion.useQuery(
    { 
      question: question.content,
      count: 3,
    },
    {
      enabled: !answer && question.content.trim().length >= 10,
      staleTime: 2 * 60 * 1000, // Cache por 2 minutos
      retry: 1,
    }
  )

  // Generar respuestas sugeridas - usar IA si está disponible, fallback si falla
  const suggestedAnswers = React.useMemo(() => {
    // Mostrar respuestas sugeridas para TODAS las preguntas (no solo la primera)
    if (answer) return []
    
    // Si tenemos respuestas de IA, usarlas
    if (suggestedAnswersData && suggestedAnswersData.length > 0) {
      return suggestedAnswersData
    }
    
    // Fallback: respuestas genéricas variadas (solo si la IA falla)
    const genericSuggestions = [
      {
        id: 'suggested-1',
        text: `Estoy evaluando opciones concretas (timing, recursos, impacto en el negocio) y necesito contrastar riesgos y beneficios a corto y largo plazo con datos o referencias del sector antes de decidir.`,
        description: 'Evaluación con datos y referencias',
      },
      {
        id: 'suggested-2',
        text: `Quiero comparar alternativas específicas —costes, plazos, viabilidad— y ver cómo encajan con mis objetivos actuales. Busco criterios claros para priorizar y descartar opciones.`,
        description: 'Comparación de alternativas',
      },
      {
        id: 'suggested-3',
        text: `Busco una recomendación fundamentada con datos, mejores prácticas del sector y mi contexto, que concrete pasos o criterios aplicables para esta decisión.`,
        description: 'Recomendación aplicable',
      },
    ]
    
    // Por defecto, usar respuestas genéricas variadas (solo si la IA falla)
    return genericSuggestions
  }, [answer, question.content, suggestedAnswersData])
  
  const priorityBadge =
    question.priority === 'critical' ? (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm text-purple-400 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30">
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
          Pregunta crítica
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-amber-300 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
          ~1 crédito
        </span>
      </div>
    ) : question.priority === 'high' ? (
      <span className="inline-flex items-center gap-1.5 text-sm text-orange-400 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30">
        <span className="w-2 h-2 bg-orange-400 rounded-full" />
        Pregunta importante
      </span>
    ) : question.priority === 'medium' ? (
      <span className="inline-flex items-center gap-1.5 text-sm text-blue-400 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
        <span className="w-2 h-2 bg-blue-400 rounded-full" />
        Pregunta relevante
      </span>
    ) : question.priority === 'low' ? (
      <span className="inline-flex items-center gap-1.5 text-sm text-[var(--theme-text-secondary)] px-3 py-1 rounded-full bg-gray-500/10 border border-gray-500/30">
        <span className="w-2 h-2 bg-gray-400 rounded-full" />
        Pregunta complementaria
      </span>
    ) : null

  const progressBar =
    contextProgress != null ? (
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0 h-4 bg-[var(--theme-bg-input)] rounded-full overflow-hidden relative">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-purple-400 to-blue-500 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${Math.max(contextProgress, 2)}%` }}
          />
        </div>
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 border-2 border-purple-400 flex items-center justify-center">
          <span className="text-sm font-bold text-[var(--theme-text-primary)]" suppressHydrationWarning>
            {Math.round(contextProgress)}%
          </span>
        </div>
      </div>
    ) : undefined

  return (
    <div className="w-full max-w-2xl mx-auto">
      <DebateStickyHeader
        topContent={progressBar}
        badges={
          <>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {questionNumber !== undefined ? `Pregunta ${questionNumber}` : 'Pregunta'}
            </span>
            {priorityBadge}
          </>
        }
        title={question.content}
        actions={
          onShowSummary && answersCount != null && answersCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onShowSummary}
              className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-500/50 ml-auto"
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver resumen ({answersCount} respuesta{answersCount !== 1 ? 's' : ''})
            </Button>
          ) : undefined
        }
        className="mb-4"
      />

      {/* Answer Input: z-0 para que quede siempre debajo del header sticky al hacer scroll */}
      <div className="relative z-0 space-y-4">
        {/* Mensaje de debug (mostrar/ocultar) - SIEMPRE visible si está activado */}
        {process.env.NODE_ENV === 'development' && isAdmin && showDebugInfo && (
          <div className="mb-4 p-3 rounded-lg border border-blue-500/50 bg-blue-500/10">
            <p className="text-xs text-blue-300">
              🔍 DEBUG (Admin): isFirst={String(isFirst)}, hasAnswer={String(!!answer)}, 
              suggestedAnswersCount={suggestedAnswers.length}, questionId={question.id}
            </p>
          </div>
        )}
        
        {/* 3 Respuestas sugeridas DINÁMICAS (generadas con IA) - En desplegable */}
        {!answer && (isLoadingSuggestedAnswers || suggestedAnswers.length > 0) && (
          <div className="mb-6">
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-lg border transition-all',
                    'bg-blue-500/10 border-blue-500/30 text-blue-300',
                    'hover:border-blue-500 hover:bg-blue-500/20',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium">Ver respuestas sugeridas</span>
                    {isLoadingSuggestedAnswers ? (
                      <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                    ) : (
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs">
                        {suggestedAnswers.length}
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1">
                {isLoadingSuggestedAnswers ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-4 rounded-lg border-2 border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] animate-pulse"
                      >
                        <div className="h-4 bg-[var(--theme-bg-tertiary)] rounded w-3/4 mb-2" />
                        <div className="h-3 bg-[var(--theme-bg-tertiary)] rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {suggestedAnswers.map((suggested) => (
                        <SuggestedAnswerCard
                          key={suggested.id}
                          id={suggested.id}
                          description={suggested.description}
                          text={suggested.text}
                          disabled={isLoading}
                          onClick={() => {
                            setLocalAnswer(suggested.text)
                            setTimeout(() => {
                              const textarea = document.querySelector('textarea[placeholder*="respuesta"]') as HTMLTextAreaElement
                              if (textarea) {
                                textarea.focus()
                                textarea.scrollIntoView({ behavior: 'smooth', block: 'center' })
                              }
                            }, 100)
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-blue-400/80 text-center mt-2">
                      💡 Haz clic en una respuesta sugerida para pre-llenarla y editarla, o escribe tu propia respuesta abajo
                    </p>
                    {/* Icono de lupa para debug (solo admin en desarrollo) */}
                    {process.env.NODE_ENV === 'development' && isAdmin && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowDebugInfo(!showDebugInfo)}
                          className="p-1.5 rounded-md hover:bg-blue-500/20 transition-colors text-blue-400 hover:text-blue-300"
                          title="Mostrar/ocultar información de debug"
                        >
                          <Search className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Opción: Buscar en internet (solo si la pregunta lo merece) */}
        {!answer && !isSearching && shouldShowInternetSearch(question) && (
          <div className="space-y-3 mb-4">
            <Button
              onClick={() => {
                onSearchInternet?.()
              }}
              variant="outline"
              className={cn(
                'w-full h-14 text-base',
                'border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] text-[var(--theme-text-primary)] hover:bg-blue-600 hover:border-blue-600'
              )}
            >
              <Globe className="mr-2 h-4 w-4" />
              Buscar en internet
            </Button>
            {/* Información de costo de búsqueda */}
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
              <p className="text-sm text-blue-300 flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span>
                  Esta búsqueda consumirá <strong className="text-[var(--theme-text-primary)]">1 crédito</strong> (~$0.01 USD)
                </span>
              </p>
              <p className="text-xs text-blue-400/80 mt-1">
                Buscaremos información relevante en internet para enriquecer el contexto de tu debate
              </p>
            </div>
          </div>
        )}

        {/* Indicador de búsqueda en progreso */}
        {isSearching && (
          <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4 mb-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--theme-text-primary)]">Buscando en internet...</p>
                {searchQuery && (
                  <p className="text-xs text-blue-300 mt-1">Buscando: "{searchQuery}"</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Input de respuesta (solo si showAnswerInput es true o ya hay respuesta) */}
        {(showAnswerInput || answer) && question.questionType === 'multiple_choice' && question.options ? (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                disabled={isLoading}
                className={cn(
                  'w-full p-4 rounded-lg border-2 text-left transition-all',
                  'bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] text-[var(--theme-text-primary)]',
                  'hover:border-purple-500 hover:bg-purple-500/10',
                  'focus:outline-none focus:ring-2 focus:ring-purple-500',
                  isLoading && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{option}</span>
                  <ArrowRight className="h-5 w-5 text-[var(--theme-text-secondary)]" />
                </div>
              </button>
            ))}
          </div>
        ) : (showAnswerInput || answer) && question.questionType === 'yes_no' ? (
          <>
            {/* Si ya se respondió "Sí" y se está añadiendo contexto */}
            {yesNoAnswer === 'Sí' && !answer ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                  <p className="text-sm text-green-300 mb-3">
                    Has respondido <strong className="text-[var(--theme-text-primary)]">Sí</strong>. Puedes añadir más contexto para enriquecer la respuesta (opcional):
                  </p>
                  <Textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Explica más detalles... (opcional)"
                    disabled={isLoading}
                    className={cn(
                      'min-h-[100px] text-base bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] text-[var(--theme-text-primary)]',
                      'placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500',
                      'focus-visible:border-purple-500 resize-y'
                    )}
                    autoFocus
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleYesWithContext}
                      disabled={isLoading}
                      className="h-12 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {additionalContext.trim() ? 'Confirmar con contexto' : 'Continuar con "Sí"'}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button
                      onClick={handleYesWithoutContext}
                      variant="outline"
                      disabled={isLoading}
                      className="h-12 border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-tertiary)]"
                    >
                      Solo "Sí" sin contexto
                    </Button>
                  </div>
                  {skipPhaseButton}
                </div>
              </div>
            ) : (
              /* Botones Sí/No iniciales */
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleOptionClick('Sí')}
                  disabled={isLoading || !!answer}
                  className={cn(
                    'p-6 rounded-lg border-2 text-lg font-medium transition-all',
                    answer === 'Sí' || (answer && answer.startsWith('Sí'))
                      ? 'bg-green-500/20 border-green-500 text-green-300'
                      : 'bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:border-green-500 hover:bg-green-500/10',
                    isLoading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  Sí
                </button>
                <button
                  onClick={() => handleOptionClick('No')}
                  disabled={isLoading || !!answer}
                  className={cn(
                    'p-6 rounded-lg border-2 text-lg font-medium transition-all',
                    answer === 'No'
                      ? 'bg-red-500/20 border-red-500 text-red-300'
                      : 'bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:border-red-500 hover:bg-red-500/10',
                    isLoading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  No
                </button>
              </div>
            )}
          </>
        ) : null}
        
        {/* Input de texto (para preguntas que no son multiple_choice ni yes_no) */}
        {/* IMPORTANTE: También mostrar texto si es multiple_choice pero NO tiene opciones válidas */}
        {(showAnswerInput || answer) && (
          question.questionType !== 'multiple_choice' && question.questionType !== 'yes_no' ||
          (question.questionType === 'multiple_choice' && (!question.options || question.options.length === 0))
        ) && (
          <div className="space-y-4">
            {answerType === 'long' ? (
              <Textarea
                value={localAnswer}
                onChange={(e) => setLocalAnswer(e.target.value)}
                onKeyDown={(e) => {
                  // Permitir Enter para nueva línea, Ctrl+Enter para enviar
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder="Escribe tu respuesta... (Ctrl+Enter para enviar)"
                disabled={isLoading}
                className={cn(
                  'min-h-[140px] text-base bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] text-[var(--theme-text-primary)]',
                  'placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500',
                  'focus-visible:border-purple-500 resize-y',
                  validationError && 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500'
                )}
                autoFocus
              />
            ) : (
              <Input
                value={localAnswer}
                onChange={(e) => setLocalAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder="Escribe tu respuesta..."
                disabled={isLoading}
                className={cn(
                  'h-16 text-lg bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] text-[var(--theme-text-primary)]',
                  'placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500',
                  'focus-visible:border-purple-500',
                  validationError && 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500'
                )}
                autoFocus
              />
            )}
            
            {/* Mensaje de validación */}
            {validationError && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
                <p className="text-sm text-red-300 font-medium mb-1">[WARN] Respuesta no válida</p>
                <p className="text-sm text-red-200 whitespace-pre-wrap">{validationError}</p>
                <p className="text-xs text-red-300/80 mt-2">
                  Por favor, edita tu respuesta o explica cómo se relaciona con la pregunta.
                </p>
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                {!isFirst && onBack && (
                  <Button
                    onClick={onBack}
                    variant="ghost"
                    className="h-12 text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] shrink-0"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Atrás
                  </Button>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={!localAnswer.trim() || isLoading}
                  className="h-12 bg-purple-600 hover:bg-purple-700 text-white text-lg shrink-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
              {skipPhaseButton}
            </div>
          </div>
        )}
      </div>

      {/* Navigation (Atrás). Oculto si ya está integrado en la fila de Continuar (texto/textarea). */}
      {!isFirst && onBack && !isTextOrTextarea && (
        <div className="mt-6">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-[var(--theme-text-secondary)] hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Atrás
          </Button>
        </div>
      )}
    </div>
  )
}
