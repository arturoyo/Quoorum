import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Sparkles,
  ArrowRight,
  Grid2x2,
  Target,
  Users,
  TrendingUp,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { LandingFooter } from "@/components/layout/landing-footer";
import { SectionHeader } from "@/components/ui/section-header";
import { CTASection } from "@/components/ui/cta-section";
import { GradientCTAButton } from "@/components/ui/gradient-cta-button";

export const metadata: Metadata = {
  title: "Free Eisenhower Matrix Template - AI Powered | Quoorum",
  description:
    "Prioriza tareas con la Matriz de Eisenhower y IA. Clasifica según urgencia e importancia. Template gratis para productividad.",
  keywords: [
    "eisenhower matrix",
    "matriz de eisenhower",
    "priorización de tareas",
    "gestión del tiempo",
    "productividad",
    "urgente e importante",
    "time management",
  ],
  openGraph: {
    title: "Free Eisenhower Matrix Template - AI Powered | Quoorum",
    description:
      "Prioriza tareas con la Matriz de Eisenhower y IA. Template gratis para productividad.",
    type: "website",
  },
};

const quadrants = [
  {
    id: "Q1",
    title: "DO FIRST (Crisis)",
    description: "Emergencias que requieren acción inmediata",
    urgentLabel: "Urgente",
    importantLabel: "Importante",
    icon: AlertTriangle,
    gradient: "from-red-500 to-pink-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    textColor: "text-red-400",
    items: ["Crisis y emergencias", "Deadlines inminentes", "Problemas críticos"],
    tip: "Minimizar tiempo aquí. Si vives en Q1, estás en \"modo crisis\".",
  },
  {
    id: "Q2",
    title: "SCHEDULE (Crecimiento)",
    description: "El cuadrante más valioso - prevención y desarrollo",
    urgentLabel: "No Urgente",
    importantLabel: "Importante",
    icon: TrendingUp,
    gradient: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    textColor: "text-green-400",
    items: ["Planificación estratégica", "Prevención y mantenimiento", "Desarrollo personal"],
    tip: "¡Maximizar tiempo aquí! 50-60% de tu semana debería estar en Q2.",
  },
  {
    id: "Q3",
    title: "DELEGATE (Interrupciones)",
    description: "Urgente para otros, no importante para ti",
    urgentLabel: "Urgente",
    importantLabel: "No Importante",
    icon: Users,
    gradient: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    textColor: "text-orange-400",
    items: ["Interrupciones", "Algunas llamadas/emails", "Reuniones improductivas"],
    tip: "Delegar o rechazar. No confundir urgencia con importancia.",
  },
  {
    id: "Q4",
    title: "ELIMINATE (Time Wasters)",
    description: "Actividades que no aportan valor",
    urgentLabel: "No Urgente",
    importantLabel: "No Importante",
    icon: X,
    gradient: "from-gray-500 to-slate-500",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
    textColor: "text-[var(--theme-text-secondary)]",
    items: ["Time wasters", "Redes sociales sin propósito", "Busy work"],
    tip: "Eliminar completamente. Si estás aquí, estás perdiendo el tiempo.",
  },
];

const features = [
  {
    icon: Target,
    title: "Clasificación Objetiva",
    description: "IA clasifica sin sesgos emocionales. Urgencia ≠ Importancia.",
  },
  {
    icon: Clock,
    title: "Time Allocation",
    description: "Te dice qué % de tiempo dedicar a cada cuadrante.",
  },
  {
    icon: Grid2x2,
    title: "Matriz Visual",
    description: "Ve dónde pasas tu tiempo y dónde DEBERÍAS pasarlo.",
  },
];

export default function EisenhowerMatrixLandingPage() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Quoorum Eisenhower Matrix",
    applicationCategory: "ProductivityApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
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
              <Sparkles className="w-4 h-4 text-green-400" />
              <span>Matriz de Eisenhower Gratis - IA Experta</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
              Matriz de{" "}
              <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Eisenhower
              </span>{" "}
              con IA
            </h1>

            <p className="text-xl md:text-2xl text-[var(--theme-text-secondary)] max-w-3xl mx-auto leading-relaxed mb-8">
              Prioriza tareas según urgencia e importancia en 2 minutos.
              IA clasifica automáticamente en 4 cuadrantes y optimiza tu time management.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/debates/new-unified?framework=eisenhower-matrix&new=1">
                <GradientCTAButton size="lg">
                  Priorizar mis tareas gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </GradientCTAButton>
              </Link>
              <Link href="#matrix">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  Ver matriz
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
              <div>
                <div className="text-3xl font-bold text-green-400">4</div>
                <div className="text-sm text-[var(--theme-text-tertiary)]">Cuadrantes</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">2 min</div>
                <div className="text-sm text-[var(--theme-text-tertiary)]">Promedio</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">100%</div>
                <div className="text-sm text-[var(--theme-text-tertiary)]">Gratis</div>
              </div>
            </div>
          </div>
        </section>

        {/* Matrix Explanation */}
        <section id="matrix" className="py-24 px-4">
          <div className="container mx-auto max-w-6xl">
            <SectionHeader
              title="Los 4 Cuadrantes"
              subtitle="Clasifica tareas según dos dimensiones: Urgente vs Importante"
            />

            <div className="grid md:grid-cols-2 gap-6">
              {quadrants.map((quadrant) => {
                const Icon = quadrant.icon;
                return (
                  <div
                    key={quadrant.id}
                    className="relative p-6 rounded-2xl overflow-hidden"
                  >
                    <div className={`absolute inset-0 ${quadrant.bgColor} backdrop-blur-xl`} />
                    <div className={`absolute inset-0 border ${quadrant.borderColor} rounded-2xl`} />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className={`${quadrant.bgColor} ${quadrant.textColor} border ${quadrant.borderColor}`}>
                          {quadrant.id}
                        </Badge>
                        <div className="flex gap-2 text-xs text-[var(--theme-text-tertiary)]">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {quadrant.urgentLabel}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {quadrant.importantLabel}
                          </span>
                        </div>
                      </div>

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
                          <p className="text-xs text-[var(--theme-text-tertiary)]">{quadrant.description}</p>
                        </div>
                      </div>

                      <ul className="space-y-2 mb-4">
                        {quadrant.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-2 text-sm text-[var(--theme-text-secondary)]">
                            <Icon className={`w-4 h-4 ${quadrant.textColor} flex-shrink-0 mt-0.5`} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      <div className={`p-3 rounded-lg ${quadrant.bgColor}`}>
                        <p className={`text-xs ${quadrant.textColor}`}>
                          <strong>Objetivo:</strong> {quadrant.tip}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <SectionHeader
              title="¿Por qué usar IA para priorizar?"
            />

            <div className="grid sm:grid-cols-3 gap-6">
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
                      <Icon className="w-8 h-8 text-green-400 mb-4" />
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
            ¿Listo para optimizar tu tiempo?
          </h2>
          <p className="text-xl text-[var(--theme-text-secondary)] mb-10 max-w-2xl mx-auto">
            Clasifica tus tareas con IA en 2 minutos
          </p>
          <Link href="/debates/new-unified?framework=eisenhower-matrix&new=1">
            <GradientCTAButton size="lg">
              Crear Matriz de Eisenhower gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </GradientCTAButton>
          </Link>
        </CTASection>

        <LandingFooter />
      </div>
    </>
  );
}
