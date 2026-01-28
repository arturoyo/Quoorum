/**
 * Quoorum Onboarding
 *
 * Interactive onboarding for new users
 */

'use client'

import { useState } from 'react'
import { useLocalStorage } from '~/hooks/use-forum'

// ============================================================================
// TYPES
// ============================================================================

interface OnboardingStep {
  id: string
  title: string
  description: string
  image?: string
  action?: {
    label: string
    onClick: () => void
  }
}

// ============================================================================
// ONBOARDING STEPS
// ============================================================================

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido al Quoorum!',
    description:
      'El Quoorum es tu asistente de decisiones estratégicas. Crea debates con expertos de IA que te ayudarán a tomar mejores decisiones de negocio.',
    image: '[INFO]',
  },
  {
    id: 'create-debate',
    title: 'Crea tu primer debate',
    description:
      'Haz una pregunta estratégica como "¿Debería pivotar a B2B?" o "¿Qué modelo de pricing debería usar?". Los expertos debatirán y llegarán a un consenso.',
    image: '💬',
  },
  {
    id: 'experts',
    title: 'Expertos especializados',
    description:
      'Tenemos 25+ expertos en áreas como Go-to-Market, Pricing, Product, Growth y más. El sistema selecciona automáticamente los mejores expertos para tu pregunta.',
    image: '👥',
  },
  {
    id: 'real-time',
    title: 'Debate en tiempo real',
    description:
      'Observa cómo los expertos debaten en tiempo real. Puedes ver cada mensaje, argumento y contraargumento mientras construyen consenso.',
    image: '⚡',
  },
  {
    id: 'results',
    title: 'Resultados accionables',
    description:
      'Al final, obtendrás un ranking de opciones con scores de éxito, razonamiento detallado y un PDF exportable para compartir con tu equipo.',
    image: '📊',
  },
]

// ============================================================================
// ONBOARDING MODAL
// ============================================================================

export function OnboardingModal() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useLocalStorage(
    'forum-onboarding-completed',
    false
  )
  const [currentStep, setCurrentStep] = useState(0)
  const [isOpen, setIsOpen] = useState(!hasSeenOnboarding)

  if (!isOpen) return null

  const step = ONBOARDING_STEPS[currentStep]
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1

  const handleNext = () => {
    if (isLastStep) {
      setHasSeenOnboarding(true)
      setIsOpen(false)
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSkip = () => {
    setHasSeenOnboarding(true)
    setIsOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-2xl rounded-lg bg-white p-8">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 text-2xl text-[var(--theme-text-secondary)] transition-colors hover:text-[var(--theme-text-tertiary)]"
        >
          ✕
        </button>

        {/* Progress indicator */}
        <div className="mb-8 flex gap-2">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="mb-8 text-center">
          {step?.image && <div className="mb-6 text-6xl">{step.image}</div>}
          <h2 className="mb-4 text-3xl font-bold text-[var(--theme-text-primary)]">{step?.title}</h2>
          <p className="text-lg text-[var(--theme-text-tertiary)]">{step?.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-[var(--theme-text-tertiary)] transition-colors hover:text-[var(--theme-text-secondary)]"
          >
            Saltar tutorial
          </button>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="rounded-lg border border-gray-300 px-6 py-2 transition-colors hover:bg-gray-50"
              >
                Anterior
              </button>
            )}
            <button
              onClick={handleNext}
              className="rounded-lg bg-blue-600 px-6 py-2 text-[var(--theme-text-primary)] transition-colors hover:bg-blue-700"
            >
              {isLastStep ? '¡Empezar!' : 'Siguiente'}
            </button>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mt-6 text-center text-sm text-[var(--theme-text-tertiary)]">
          Paso {currentStep + 1} de {ONBOARDING_STEPS.length}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// QUICK START GUIDE
// ============================================================================

export function QuickStartGuide() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
      >
        📖 Guía rápida
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[var(--theme-text-primary)]">Guía Rápida del Quoorum</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-2xl text-[var(--theme-text-secondary)] transition-colors hover:text-[var(--theme-text-tertiary)]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Section 1 */}
              <div>
                <h3 className="mb-2 text-lg font-semibold text-[var(--theme-text-primary)]">1. Crea un debate</h3>
                <p className="mb-2 text-[var(--theme-text-tertiary)]">Haz una pregunta estratégica clara. Ejemplos:</p>
                <ul className="list-inside list-disc space-y-1 text-[var(--theme-text-tertiary)]">
                  <li>"¿Debería pivotar de B2C a B2B?"</li>
                  <li>"¿Qué modelo de pricing maximiza revenue?"</li>
                  <li>"¿Cómo mejoro la retención de usuarios?"</li>
                </ul>
              </div>

              {/* Section 2 */}
              <div>
                <h3 className="mb-2 text-lg font-semibold text-[var(--theme-text-primary)]">2. Selecciona el modo</h3>
                <ul className="list-inside list-disc space-y-1 text-[var(--theme-text-tertiary)]">
                  <li>
                    <strong>Dinámico (recomendado):</strong> El sistema selecciona automáticamente
                    los mejores expertos
                  </li>
                  <li>
                    <strong>Estático:</strong> Usa un set predefinido de expertos
                  </li>
                </ul>
              </div>

              {/* Section 3 */}
              <div>
                <h3 className="mb-2 text-lg font-semibold text-[var(--theme-text-primary)]">3. Observa el debate</h3>
                <p className="text-[var(--theme-text-tertiary)]">Los expertos debatirán en tiempo real. Verás:</p>
                <ul className="list-inside list-disc space-y-1 text-[var(--theme-text-tertiary)]">
                  <li>Argumentos de cada experto</li>
                  <li>Contraargumentos y refutaciones</li>
                  <li>Construcción de consenso</li>
                  <li>Score de calidad en tiempo real</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div>
                <h3 className="mb-2 text-lg font-semibold text-[var(--theme-text-primary)]">
                  4. Revisa los resultados
                </h3>
                <p className="text-[var(--theme-text-tertiary)]">Al finalizar, obtendrás:</p>
                <ul className="list-inside list-disc space-y-1 text-[var(--theme-text-tertiary)]">
                  <li>Ranking de opciones con scores de éxito</li>
                  <li>Razonamiento detallado para cada opción</li>
                  <li>Score de consenso (0-100%)</li>
                  <li>Costo total del debate</li>
                </ul>
              </div>

              {/* Section 5 */}
              <div>
                <h3 className="mb-2 text-lg font-semibold text-[var(--theme-text-primary)]">5. Exporta y comparte</h3>
                <p className="text-[var(--theme-text-tertiary)]">
                  Puedes exportar el debate a PDF para compartir con tu equipo, añadir comentarios
                  para colaborar, y ver analytics de todos tus debates.
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full rounded-lg bg-blue-600 py-3 font-medium text-[var(--theme-text-primary)] transition-colors hover:bg-blue-700"
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ============================================================================
// FEATURE HIGHLIGHTS
// ============================================================================

export function FeatureHighlight({
  feature,
  onDismiss,
}: {
  feature: 'analytics' | 'export' | 'custom-experts' | 'team-collaboration'
  onDismiss: () => void
}) {
  const highlights = {
    analytics: {
      title: '📊 Analytics Dashboard',
      description:
        'Descubre insights sobre tus debates: consenso promedio, expertos más efectivos, tópicos más debatidos y más.',
    },
    export: {
      title: '📄 Exportar a PDF',
      description:
        'Exporta cualquier debate a PDF profesional para compartir con tu equipo o inversores.',
    },
    'custom-experts': {
      title: '👤 Expertos Personalizados',
      description:
        'Crea expertos personalizados con expertise específica para tu industria o caso de uso.',
    },
    'team-collaboration': {
      title: '💬 Colaboración en Equipo',
      description:
        'Añade comentarios, menciona a miembros del equipo y reacciona a debates para colaborar mejor.',
    },
  }

  const highlight = highlights[feature]

  return (
    <div className="mb-4 rounded-r-lg border-l-4 border-blue-600 bg-blue-50 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="mb-1 font-semibold text-blue-900">{highlight.title}</h4>
          <p className="text-sm text-blue-800">{highlight.description}</p>
        </div>
        <button
          onClick={onDismiss}
          className="ml-4 text-blue-600 transition-colors hover:text-blue-800"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// CONTEXTUAL HELP
// ============================================================================

export function ContextualHelp({ context }: { context: string }) {
  const [isOpen, setIsOpen] = useState(false)

  const helpContent: Record<string, { title: string; content: string }> = {
    'debate-mode': {
      title: 'Modo de Debate',
      content:
        'Dinámico: El sistema selecciona automáticamente los mejores expertos para tu pregunta. Estático: Usa un set predefinido de expertos.',
    },
    'consensus-score': {
      title: 'Score de Consenso',
      content:
        'Indica qué tan de acuerdo están los expertos. 70%+ es bueno, 90%+ es excelente. Bajo consenso puede indicar que la pregunta necesita más contexto.',
    },
    'success-rate': {
      title: 'Tasa de Éxito',
      content:
        'Probabilidad estimada de éxito de cada opción basada en los argumentos de los expertos. Considera múltiples factores como viabilidad, impacto y riesgo.',
    },
    'quality-score': {
      title: 'Score de Calidad',
      content:
        'Mide la calidad del debate: profundidad de argumentos, diversidad de perspectivas y construcción de consenso. El Meta-Moderator interviene si la calidad baja.',
    },
  }

  const help = helpContent[context]

  if (!help) return null

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-[var(--theme-text-secondary)] transition-colors hover:text-[var(--theme-text-tertiary)]"
        title="Ayuda"
      >
        ❓
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
            <h4 className="mb-2 font-semibold text-[var(--theme-text-primary)]">{help.title}</h4>
            <p className="text-sm text-[var(--theme-text-tertiary)]">{help.content}</p>
          </div>
        </>
      )}
    </div>
  )
}
