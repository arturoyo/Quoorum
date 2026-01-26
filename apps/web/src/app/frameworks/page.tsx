import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  Scale,
  Grid3x3,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { LandingFooter } from "@/components/layout/landing-footer";
import { SectionHeader } from "@/components/ui/section-header";
import { CTASection } from "@/components/ui/cta-section";
import { GradientCTAButton } from "@/components/ui/gradient-cta-button";

export const metadata: Metadata = {
  title: "Decision-Making Frameworks | AI-Powered Analysis | Quoorum",
  description:
    "Toma mejores decisiones con frameworks probados y análisis de IA experta. Pros/Cons, SWOT Analysis, Eisenhower Matrix - 100% gratis.",
  keywords: [
    "decision making frameworks",
    "frameworks de decisión",
    "pros and cons",
    "swot analysis",
    "eisenhower matrix",
    "análisis de decisiones",
    "IA para decisiones",
  ],
  openGraph: {
    title: "Decision-Making Frameworks | AI-Powered Analysis | Quoorum",
    description:
      "Toma mejores decisiones con frameworks probados y análisis de IA experta. 100% gratis.",
    type: "website",
  },
};

const frameworks = [
  {
    slug: "pros-and-cons",
    name: "Pros and Cons",
    description:
      "Analiza las ventajas y desventajas de tu decisión con debates multi-agente IA. Simple, claro, efectivo.",
    icon: Scale,
    gradient: "from-purple-500 to-pink-500",
    features: [
      "4 agentes de IA expertos",
      "Análisis balanceado",
      "Pesos cuantificados (0-100)",
      "Recomendación clara (YES/NO/Conditional)",
    ],
    useCases: [
      "Lanzar nuevo producto",
      "Contratar equipo",
      "Cambiar de estrategia",
      "Inversiones y deals",
    ],
    time: "3 min",
    status: "active" as const,
  },
  {
    slug: "swot-analysis",
    name: "SWOT Analysis",
    description:
      "Análisis SWOT (Fortalezas, Debilidades, Oportunidades, Amenazas) con 4 agentes expertos. Ideal para estrategia de negocio.",
    icon: Grid3x3,
    gradient: "from-blue-500 to-cyan-500",
    features: [
      "4 perspectivas (S.W.O.T)",
      "Análisis interno y externo",
      "Matriz visual 2x2",
      "Estrategias accionables",
    ],
    useCases: [
      "Planificación estratégica",
      "Análisis competitivo",
      "Evaluación de mercado",
      "Pivot de producto",
    ],
    time: "4 min",
    status: "coming-soon" as const,
  },
  {
    slug: "eisenhower-matrix",
    name: "Eisenhower Matrix",
    description:
      "Prioriza tareas según urgencia e importancia. Matriz 2x2 para decisiones de productividad y time management.",
    icon: CheckCircle2,
    gradient: "from-green-500 to-emerald-500",
    features: [
      "Clasificación automática",
      "Matriz 2x2 (Urgent/Important)",
      "Recomendaciones de acción",
      "Gestión de prioridades",
    ],
    useCases: [
      "Gestión de tareas",
      "Planificación semanal",
      "Delegación de trabajo",
      "Eliminar distracciones",
    ],
    time: "2 min",
    status: "coming-soon" as const,
  },
];

const comparisonData = [
  {
    situation: "Decisión binaria (hacer/no hacer)",
    framework: "Pros and Cons",
    reason: "Analiza ventajas vs desventajas y da recomendación clara",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    situation: "Planificación estratégica de negocio",
    framework: "SWOT Analysis",
    reason: "Considera factores internos y externos del negocio",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    situation: "Gestión de tareas y prioridades",
    framework: "Eisenhower Matrix",
    reason: "Clasifica por urgencia e importancia",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    situation: "Evaluación de inversión o deal",
    framework: "Pros and Cons",
    reason: "Pesos cuantificados para comparar opciones",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    situation: "Análisis de mercado o competencia",
    framework: "SWOT Analysis",
    reason: "Identifica oportunidades y amenazas externas",
    gradient: "from-blue-500 to-cyan-500",
  },
];

export default function FrameworksOverviewPage() {
  return (
    <div className="min-h-screen bg-[var(--theme-landing-bg)]">
      {/* Header */}
      <AppHeader variant="landing" showAuth={true} />

      {/* Hero */}
      <section className="pt-40 pb-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[var(--theme-text-secondary)] mb-8">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>3 Frameworks - 100% Gratis</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
              Decision-Making{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Frameworks
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-[var(--theme-text-secondary)] max-w-3xl mx-auto leading-relaxed mb-8">
              Toma mejores decisiones con frameworks probados y análisis de IA experta.
              Elige el framework adecuado para tu tipo de decisión.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-[var(--theme-text-secondary)]">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-400" />
                <span>2-4 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>4 IAs expertas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span>Análisis ilimitados</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frameworks Grid */}
      <section className="pb-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {frameworks.map((framework) => {
              const Icon = framework.icon;
              const isActive = framework.status === "active";

              return (
                <div
                  key={framework.slug}
                  className={`relative p-8 rounded-3xl overflow-hidden transition-transform ${
                    isActive ? "hover:scale-[1.02]" : "opacity-75"
                  }`}
                >
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
                  <div className="absolute inset-0 border border-white/10 rounded-3xl" />

                  {framework.status === "coming-soon" && (
                    <div className="absolute right-4 top-4 z-10">
                      <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                        Próximamente
                      </span>
                    </div>
                  )}

                  <div className="relative z-10">
                    {/* Icon */}
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${framework.gradient} flex items-center justify-center mb-6`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {framework.name}
                    </h3>
                    <p className="text-[var(--theme-text-secondary)] mb-6 leading-relaxed">
                      {framework.description}
                    </p>

                    {/* Features */}
                    <div className="mb-6">
                      <div className="text-sm font-medium text-[var(--theme-text-secondary)] mb-3">Características:</div>
                      <ul className="space-y-2">
                        {framework.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-[var(--theme-text-secondary)]">
                            <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Use Cases */}
                    <div className="mb-6">
                      <div className="text-sm font-medium text-[var(--theme-text-secondary)] mb-3">Casos de uso:</div>
                      <div className="flex flex-wrap gap-2">
                        {framework.useCases.map((useCase, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[var(--theme-text-secondary)]"
                          >
                            {useCase}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 text-sm text-[var(--theme-text-tertiary)] mb-6">
                      <Clock className="h-4 w-4" />
                      <span>Tiempo promedio: {framework.time}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      {isActive ? (
                        <>
                          <Link href={`/frameworks/${framework.slug}`} className="flex-1">
                            <Button
                              variant="outline"
                              className="w-full border-white/10 text-white hover:bg-white/5"
                            >
                              Más info
                            </Button>
                          </Link>
                          <Link href={`/debates/new-unified?framework=${framework.slug}&new=1`} className="flex-1">
                            <Button
                              className={`w-full bg-gradient-to-r ${framework.gradient} text-white border-0 hover:opacity-90`}
                            >
                              Usar ahora
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full border-white/10 text-[var(--theme-text-tertiary)]"
                          disabled
                        >
                          Próximamente
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <SectionHeader
            title="¿Qué framework usar?"
            subtitle="Guía rápida para elegir el framework adecuado"
          />

          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-white/10 rounded-3xl" />

            <div className="relative z-10 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-6 text-left text-sm font-semibold text-[var(--theme-text-secondary)]">Situación</th>
                    <th className="p-6 text-left text-sm font-semibold text-[var(--theme-text-secondary)]">Framework</th>
                    <th className="p-6 text-left text-sm font-semibold text-[var(--theme-text-secondary)]">Por qué</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {comparisonData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="p-6 text-white">{row.situation}</td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${row.gradient} text-white text-sm font-medium`}>
                          {row.framework}
                        </span>
                      </td>
                      <td className="p-6 text-[var(--theme-text-secondary)] text-sm">{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTASection>
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
          ¿Listo para tomar mejores decisiones?
        </h2>
        <p className="text-xl text-[var(--theme-text-secondary)] mb-10 max-w-2xl mx-auto">
          Elige un framework y obtén análisis de IA experta en minutos. 100% gratis.
        </p>
        <Link href="/debates/new-unified?new=1">
          <GradientCTAButton size="lg">
            Empezar análisis gratis
            <ArrowRight className="ml-2 h-5 w-5" />
          </GradientCTAButton>
        </Link>
      </CTASection>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
