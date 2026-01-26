import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  Shield,
  ArrowRight,
  Grid3x3,
  Users,
  Clock,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { LandingFooter } from "@/components/layout/landing-footer";
import { SectionHeader } from "@/components/ui/section-header";
import { CTASection } from "@/components/ui/cta-section";
import { GradientCTAButton } from "@/components/ui/gradient-cta-button";

export const metadata: Metadata = {
  title: "Free SWOT Analysis Template - AI Powered | Quoorum",
  description:
    "Genera análisis SWOT profesional con IA en minutos. 4 expertos analizan Fortalezas, Debilidades, Oportunidades y Amenazas de tu negocio.",
  keywords: [
    "swot analysis",
    "análisis swot",
    "fortalezas debilidades",
    "oportunidades amenazas",
    "análisis estratégico",
    "IA para estrategia",
    "plantilla swot gratis",
  ],
  openGraph: {
    title: "Free SWOT Analysis Template - AI Powered | Quoorum",
    description:
      "Genera análisis SWOT profesional con IA en minutos. 4 expertos analizan tu negocio.",
    type: "website",
  },
};

const swotQuadrants = [
  {
    title: "Strengths (Fortalezas)",
    subtitle: "Factores internos positivos",
    icon: CheckCircle2,
    gradient: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    textColor: "text-green-400",
    items: [
      "Ventajas competitivas únicas",
      "Recursos y capacidades destacadas",
      "Assets valiosos (equipo, tech, marca)",
    ],
  },
  {
    title: "Weaknesses (Debilidades)",
    subtitle: "Factores internos negativos",
    icon: XCircle,
    gradient: "from-red-500 to-pink-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    textColor: "text-red-400",
    items: [
      "Recursos limitados o faltantes",
      "Capacidades insuficientes",
      "Gaps de conocimiento o experiencia",
    ],
  },
  {
    title: "Opportunities (Oportunidades)",
    subtitle: "Factores externos positivos",
    icon: TrendingUp,
    gradient: "from-cyan-500 to-blue-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    textColor: "text-cyan-400",
    items: [
      "Tendencias de mercado favorables",
      "Nuevos segmentos o nichos",
      "Partnerships potenciales",
    ],
  },
  {
    title: "Threats (Amenazas)",
    subtitle: "Factores externos negativos",
    icon: AlertTriangle,
    gradient: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    textColor: "text-orange-400",
    items: [
      "Competencia creciente",
      "Disrupciones tecnológicas",
      "Riesgos macroeconómicos",
    ],
  },
];

const features = [
  {
    icon: Users,
    title: "4 Agentes Expertos",
    description: "Cada dimensión analizada por un agente especializado en ese área.",
  },
  {
    icon: Clock,
    title: "4 Minutos",
    description: "SWOT completo en minutos. No necesitas reunir a un equipo.",
  },
  {
    icon: Grid3x3,
    title: "Matriz 2x2",
    description: "Visual clásico: Interno vs Externo, Positivo vs Negativo.",
  },
  {
    icon: Target,
    title: "Estrategias SO/WO/ST/WT",
    description: "No solo lista. Te da 4 tipos de estrategias accionables.",
  },
  {
    icon: Sparkles,
    title: "IA Contextual",
    description: "Considera tu industria, etapa y rol para análisis personalizado.",
  },
  {
    icon: CheckCircle2,
    title: "100% Gratis",
    description: "Sin límites. Sin tarjeta. Análisis SWOT ilimitados.",
  },
];

export default function SWOTAnalysisLandingPage() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Quoorum SWOT Analysis",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "143",
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
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>SWOT Analysis Gratis - 4 IAs Expertas</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
              Análisis{" "}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
                SWOT
              </span>{" "}
              con IA
            </h1>

            <p className="text-xl md:text-2xl text-[var(--theme-text-secondary)] max-w-3xl mx-auto leading-relaxed mb-8">
              Genera un análisis SWOT profesional en 4 minutos.
              4 agentes de IA expertos analizan Fortalezas, Debilidades, Oportunidades y Amenazas.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/debates/new-unified?framework=swot-analysis&new=1">
                <GradientCTAButton size="lg">
                  Crear mi análisis SWOT gratis
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
                <div className="text-3xl font-bold text-blue-400">4</div>
                <div className="text-sm text-[var(--theme-text-tertiary)]">Dimensiones SWOT</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">4 min</div>
                <div className="text-sm text-[var(--theme-text-tertiary)]">Promedio</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">100%</div>
                <div className="text-sm text-[var(--theme-text-tertiary)]">Gratis</div>
              </div>
            </div>
          </div>
        </section>

        {/* SWOT Matrix Explanation */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-6xl">
            <SectionHeader
              title="¿Qué es el análisis SWOT?"
              subtitle="Un framework estratégico que analiza factores internos y externos de tu negocio"
            />

            <div className="grid md:grid-cols-2 gap-6">
              {swotQuadrants.map((quadrant, idx) => {
                const Icon = quadrant.icon;
                return (
                  <div
                    key={idx}
                    className="relative p-6 rounded-2xl overflow-hidden"
                  >
                    <div className={`absolute inset-0 ${quadrant.bgColor} backdrop-blur-xl`} />
                    <div className={`absolute inset-0 border ${quadrant.borderColor} rounded-2xl`} />

                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${quadrant.gradient} flex items-center justify-center`}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className={`text-lg font-semibold ${quadrant.textColor}`}>
                            {quadrant.title}
                          </h3>
                          <p className="text-xs text-[var(--theme-text-tertiary)]">{quadrant.subtitle}</p>
                        </div>
                      </div>

                      <ul className="space-y-2">
                        {quadrant.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-2 text-sm text-[var(--theme-text-secondary)]">
                            <Icon className={`w-4 h-4 ${quadrant.textColor} flex-shrink-0 mt-0.5`} />
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
              title="Ejemplo de Análisis SWOT"
              subtitle="&quot;Análisis SWOT de nuestra estrategia de expansion a Latinoamérica&quot;"
            />

            <div className="grid md:grid-cols-2 gap-4">
              {/* Strengths Example */}
              <div className="relative p-6 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-green-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 border border-green-500/20 rounded-2xl" />

                <div className="relative z-10">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-green-400 mb-4">
                    <CheckCircle2 className="w-5 h-5" />
                    STRENGTHS (3)
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">Producto localizado</span>
                        <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">Impact: 90</Badge>
                      </div>
                      <p className="text-xs text-[var(--theme-text-secondary)]">Ya tenemos versión en español con pagos locales integrados</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">Equipo multicultural</span>
                        <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">Impact: 85</Badge>
                      </div>
                      <p className="text-xs text-[var(--theme-text-secondary)]">3 miembros del equipo de México, Argentina y Colombia</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weaknesses Example */}
              <div className="relative p-6 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-red-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 border border-red-500/20 rounded-2xl" />

                <div className="relative z-10">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-red-400 mb-4">
                    <XCircle className="w-5 h-5" />
                    WEAKNESSES (2)
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">Sin presencia física</span>
                        <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">Severity: 70</Badge>
                      </div>
                      <p className="text-xs text-[var(--theme-text-secondary)]">No tenemos oficina ni equipo on-the-ground en LATAM</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">Budget limitado</span>
                        <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">Severity: 65</Badge>
                      </div>
                      <p className="text-xs text-[var(--theme-text-secondary)]">Solo $50k para GTM de toda la región</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opportunities Example */}
              <div className="relative p-6 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 border border-cyan-500/20 rounded-2xl" />

                <div className="relative z-10">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-cyan-400 mb-4">
                    <TrendingUp className="w-5 h-5" />
                    OPPORTUNITIES (3)
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">Mercado desatendido</span>
                        <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">Potential: 95</Badge>
                      </div>
                      <p className="text-xs text-[var(--theme-text-secondary)]">Pocos competidores con producto localizado en español</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">Crecimiento SaaS LATAM</span>
                        <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">Potential: 85</Badge>
                      </div>
                      <p className="text-xs text-[var(--theme-text-secondary)]">Mercado SaaS en LATAM creciendo 25% anual</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Threats Example */}
              <div className="relative p-6 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-orange-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 border border-orange-500/20 rounded-2xl" />

                <div className="relative z-10">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-orange-400 mb-4">
                    <AlertTriangle className="w-5 h-5" />
                    THREATS (2)
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">Players locales agresivos</span>
                        <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-400">Risk: 75</Badge>
                      </div>
                      <p className="text-xs text-[var(--theme-text-secondary)]">Startups locales con mejor network y pricing más bajo</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">Volatilidad económica</span>
                        <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-400">Risk: 70</Badge>
                      </div>
                      <p className="text-xs text-[var(--theme-text-secondary)]">Inflación y tipo de cambio volátil afecta pricing</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategies */}
            <div className="relative p-6 rounded-2xl overflow-hidden mt-6">
              <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-xl" />
              <div className="absolute inset-0 border border-blue-500/20 rounded-2xl" />

              <div className="relative z-10">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-400 mb-6">
                  <Grid3x3 className="w-5 h-5" />
                  Estrategias Recomendadas
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 font-medium text-white mb-2">
                      <Shield className="h-4 w-4 text-green-400" />
                      SO (Strengths + Opportunities)
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)]">
                      1. Lanzar GTM digital-first aprovechando producto localizado<br />
                      2. Posicionar como alternativa "hecha para LATAM" vs gringos
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-medium text-white mb-2">
                      <Target className="h-4 w-4 text-red-400" />
                      WO (Weaknesses + Opportunities)
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)]">
                      1. Contratar 1-2 SDRs locales remote antes de abrir oficina<br />
                      2. Partner con aceleradora local para network sin CAPEX
                    </p>
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
              title="¿Por qué Quoorum SWOT Analysis?"
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
                      <Icon className="w-8 h-8 text-blue-400 mb-4" />
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
            ¿Listo para tu análisis SWOT?
          </h2>
          <p className="text-xl text-[var(--theme-text-secondary)] mb-10 max-w-2xl mx-auto">
            Genera un SWOT profesional con IA en 4 minutos
          </p>
          <Link href="/debates/new-unified?framework=swot-analysis&new=1">
            <GradientCTAButton size="lg">
              Crear SWOT Analysis gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </GradientCTAButton>
          </Link>
        </CTASection>

        <LandingFooter />
      </div>
    </>
  );
}
