import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
  Scale,
  Target,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { LandingFooter } from "@/components/layout/landing-footer";
import { SectionHeader } from "@/components/ui/section-header";
import { CTASection } from "@/components/ui/cta-section";
import { GradientCTAButton } from "@/components/ui/gradient-cta-button";

export const metadata: Metadata = {
  title: "Free Pros and Cons Template - AI Powered | Quoorum",
  description:
    "Analiza decisiones con IA experta. Obtén un análisis balanceado de ventajas y desventajas en minutos. Template gratis con 4 IAs debatiendo tu decisión.",
  keywords: [
    "pros and cons",
    "ventajas y desventajas",
    "análisis de decisiones",
    "IA para decisiones",
    "plantilla pros and cons",
    "decision making",
  ],
  openGraph: {
    title: "Free Pros and Cons Template - AI Powered | Quoorum",
    description:
      "Analiza decisiones con IA experta. Obtén un análisis balanceado de ventajas y desventajas en minutos.",
    type: "website",
  },
};

const agents = [
  {
    name: "Optimizer",
    description: "Identifica TODOS los PROS (ventajas, beneficios, oportunidades)",
    icon: TrendingUp,
    gradient: "from-green-500 to-emerald-500",
    items: [
      "Beneficios directos e indirectos",
      "Oportunidades que abre",
      "Impacto positivo a largo plazo",
    ],
  },
  {
    name: "Critic",
    description: "Identifica TODOS los CONS (riesgos, desventajas, obstáculos)",
    icon: XCircle,
    gradient: "from-red-500 to-pink-500",
    items: [
      "Riesgos directos e indirectos",
      "Costos (tiempo, dinero, oportunidad)",
      "Obstáculos y blockers",
    ],
  },
  {
    name: "Analyst",
    description: "Evalúa factibilidad y contexto",
    icon: Target,
    gradient: "from-blue-500 to-cyan-500",
    items: [
      "Recursos necesarios",
      "Timeline realista",
      "Factores contextuales relevantes",
    ],
  },
  {
    name: "Synthesizer",
    description: "Crea recomendación balanceada",
    icon: Scale,
    gradient: "from-purple-500 to-pink-500",
    items: [
      "Decision: YES / NO / Conditional",
      "Rationale detallado",
      "Nivel de confianza",
    ],
  },
];

const features = [
  {
    icon: Users,
    title: "4 Perspectivas",
    description: "No solo pros y cons. Incluye análisis de factibilidad y síntesis balanceada.",
  },
  {
    icon: Clock,
    title: "3 Minutos",
    description: "Análisis completo en minutos. No necesitas reunir a un equipo ni hacer brainstorming.",
  },
  {
    icon: Scale,
    title: "Pesos Cuantificados",
    description: "Cada pro y con tiene un peso (0-100) para priorizar lo que más importa.",
  },
  {
    icon: Target,
    title: "Decisión Clara",
    description: "YES / NO / CONDITIONAL con rationale detallado. No más \"depende\".",
  },
  {
    icon: Sparkles,
    title: "IA Contextual",
    description: "Considera tu rol, industria y etapa de la empresa para análisis personalizado.",
  },
  {
    icon: CheckCircle2,
    title: "100% Gratis",
    description: "Sin límites. Sin tarjeta de crédito. Análisis ilimitados de pros and cons.",
  },
];

export default function ProsAndConsLandingPage() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Quoorum Pros and Cons Analysis",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "127",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="min-h-screen bg-[var(--theme-landing-bg)]">
        <AppHeader variant="landing" showAuth={true} />

        {/* Hero */}
        <section className="pt-40 pb-24 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[var(--theme-text-secondary)] mb-8">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Framework Gratis - 4 IAs Expertas</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
              Análisis{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Pros and Cons
              </span>{" "}
              con IA
            </h1>

            <p className="text-xl md:text-2xl text-[var(--theme-text-secondary)] max-w-3xl mx-auto leading-relaxed mb-8">
              Obtén un análisis balanceado de ventajas y desventajas en minutos.
              4 agentes de IA expertos debaten tu decisión desde diferentes perspectivas.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/debates/new-unified?framework=pros-and-cons&new=1">
                <GradientCTAButton size="lg">
                  Analizar mi decisión gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </GradientCTAButton>
              </Link>
              <Link href="#example">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  Ver ejemplo
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
              <div>
                <div className="text-3xl font-bold text-purple-400">4</div>
                <div className="text-sm text-[var(--theme-text-tertiary)]">IAs Expertas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">3 min</div>
                <div className="text-sm text-[var(--theme-text-tertiary)]">Promedio</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">100%</div>
                <div className="text-sm text-[var(--theme-text-tertiary)]">Gratis</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-6xl">
            <SectionHeader
              title="¿Cómo funciona?"
              subtitle="4 agentes de IA expertos analizan tu decisión desde diferentes ángulos"
            />

            <div className="grid md:grid-cols-2 gap-6">
              {agents.map((agent, idx) => {
                const Icon = agent.icon;
                return (
                  <div
                    key={idx}
                    className="relative p-6 rounded-2xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
                    <div className="absolute inset-0 border border-white/10 rounded-2xl" />

                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center`}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {idx + 1}. {agent.name}
                          </h3>
                          <p className="text-sm text-[var(--theme-text-secondary)]">{agent.description}</p>
                        </div>
                      </div>

                      <ul className="space-y-2">
                        {agent.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-2 text-sm text-[var(--theme-text-secondary)]">
                            <Icon className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Example Section */}
        <section id="example" className="py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <SectionHeader
              title="Ejemplo de Análisis"
              subtitle="&quot;¿Debo lanzar mi SaaS en freemium o solo planes de pago?&quot;"
            />

            <div className="grid md:grid-cols-2 gap-6">
              {/* PROS */}
              <div className="relative p-6 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-green-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 border border-green-500/20 rounded-2xl" />

                <div className="relative z-10">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-green-400 mb-4">
                    <CheckCircle2 className="w-5 h-5" />
                    PROS (4 identificados)
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <div className="mb-1 font-medium text-white">Adquisición viral (peso: 85)</div>
                      <p className="text-sm text-[var(--theme-text-secondary)]">
                        El modelo freemium genera crecimiento orgánico exponencial. Los usuarios gratis son marketing gratuito.
                      </p>
                    </div>
                    <div>
                      <div className="mb-1 font-medium text-white">Reduce fricción de entrada (peso: 80)</div>
                      <p className="text-sm text-[var(--theme-text-secondary)]">
                        Sin tarjeta de crédito, más usuarios prueban. La conversión sucede después cuando ya ven valor.
                      </p>
                    </div>
                    <p className="text-sm text-[var(--theme-text-tertiary)]">+ 2 pros más con pesos de 70 y 65</p>
                  </div>
                </div>
              </div>

              {/* CONS */}
              <div className="relative p-6 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-red-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 border border-red-500/20 rounded-2xl" />

                <div className="relative z-10">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-red-400 mb-4">
                    <XCircle className="w-5 h-5" />
                    CONS (3 identificados)
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <div className="mb-1 font-medium text-white">Costos de infraestructura (peso: 75)</div>
                      <p className="text-sm text-[var(--theme-text-secondary)]">
                        Miles de usuarios gratis pueden generar costos significativos de servidor antes de monetizar.
                      </p>
                    </div>
                    <div>
                      <div className="mb-1 font-medium text-white">Usuarios low-quality (peso: 60)</div>
                      <p className="text-sm text-[var(--theme-text-secondary)]">
                        Freemium atrae usuarios que nunca pagarán. Puede contaminar métricas y feedback.
                      </p>
                    </div>
                    <p className="text-sm text-[var(--theme-text-tertiary)]">+ 1 con más con peso de 55</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="relative p-6 rounded-2xl overflow-hidden mt-6">
              <div className="absolute inset-0 bg-purple-500/10 backdrop-blur-xl" />
              <div className="absolute inset-0 border border-purple-500/20 rounded-2xl" />

              <div className="relative z-10">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-purple-400 mb-4">
                  <Scale className="w-5 h-5" />
                  Recomendación: CONDITIONAL
                </h3>

                <p className="text-[var(--theme-text-secondary)] mb-4">
                  <strong className="text-white">Rationale:</strong> El modelo freemium es recomendable SI tienes runway para soportar 6-12 meses sin revenue significativo Y tu producto tiene un hook claro que genera conversión natural. Los PROS (85+80) superan a los CONS (75+60), pero requiere capital inicial suficiente.
                </p>

                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <span className="text-[var(--theme-text-secondary)]">PROS Weight:</span>{" "}
                    <span className="text-white font-medium">75/100</span>
                  </div>
                  <div>
                    <span className="text-[var(--theme-text-secondary)]">CONS Weight:</span>{" "}
                    <span className="text-white font-medium">63/100</span>
                  </div>
                  <div>
                    <span className="text-[var(--theme-text-secondary)]">Confianza:</span>{" "}
                    <span className="text-white font-medium">82/100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-6xl">
            <SectionHeader
              title="¿Por qué Quoorum Pros and Cons?"
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className="relative p-6 rounded-2xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
                    <div className="absolute inset-0 border border-white/10 rounded-2xl" />

                    <div className="relative z-10">
                      <Icon className="w-8 h-8 text-purple-400 mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-sm text-[var(--theme-text-secondary)]">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <CTASection>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            ¿Tienes una decisión que tomar?
          </h2>
          <p className="text-xl text-[var(--theme-text-secondary)] mb-10 max-w-2xl mx-auto">
            Obtén un análisis balanceado de pros y cons en 3 minutos
          </p>
          <Link href="/debates/new-unified?framework=pros-and-cons&new=1">
            <GradientCTAButton size="lg">
              Analizar mi decisión gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </GradientCTAButton>
          </Link>
        </CTASection>

        <LandingFooter />
      </div>
    </>
  );
}
