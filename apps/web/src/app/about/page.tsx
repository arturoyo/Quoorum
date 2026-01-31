'use client'

import Link from "next/link";
import {
  Users,
  Target,
  Zap,
  Heart,
  Lightbulb,
} from "lucide-react";
import { AppHeader } from "@/components/layout";
import { LandingFooter } from "@/components/layout/landing-footer";
import { SectionHeader } from "@/components/ui/section-header";
import { CTASection } from "@/components/ui/cta-section";
import { GradientCTAButton } from "@/components/ui/gradient-cta-button";
import { IconCard } from "@/components/ui/icon-card";

const values = [
  {
    icon: Lightbulb,
    title: "Pensamiento Crítico",
    description:
      "No aceptamos respuestas fáciles. Cuestionamos asunciones y exploramos múltiples perspectivas antes de llegar a conclusiones.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Users,
    title: "Colaboración Aumentada",
    description:
      "La IA no reemplaza a las personas, las potencia. Ayudamos a equipos a tomar mejores decisiones juntos.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Target,
    title: "Resultados Accionables",
    description:
      "No solo insights bonitos. Nuestro objetivo es que cada debate termine con pasos claros a seguir.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Heart,
    title: "Ética First",
    description:
      "Privacidad, transparencia y control de datos son fundamentales. Tu información es tuya.",
    gradient: "from-red-500 to-rose-500",
  },
];

const team = [
  {
    name: "Equipo Fundador",
    role: "Construyendo el futuro de la toma de decisiones",
    description:
      "Somos un equipo multidisciplinar de ingenieros, investigadores de IA y especialistas en estrategia de negocio.",
  },
];

const timeline = [
  {
    year: "2024",
    title: "El Nacimiento de Quoorum",
    description:
      "Nos dimos cuenta de que las herramientas de IA existentes daban respuestas demasiado simplistas para decisiones complejas. Necesitábamos algo mejor.",
  },
  {
    year: "2025",
    title: "Sistema Multi-Agente",
    description:
      "Desarrollamos el primer motor de deliberación que permite a múltiples IAs debatir desde diferentes perspectivas para encontrar la mejor solución.",
  },
  {
    year: "2026",
    title: "Lanzamiento Público",
    description:
      "Después de meses de pruebas con empresas early adopters, lanzamos Quoorum al público. La respuesta ha superado nuestras expectativas.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--theme-landing-bg)]">
      {/* Header */}
      <AppHeader variant="landing" showAuth={true} />

      {/* Hero */}
      <section className="pt-40 pb-32 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-landing-card)] border border-[var(--theme-landing-border)] text-sm styles.colors.text.secondary mb-8">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Sobre Nosotros</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold styles.colors.text.primary mb-8 tracking-tight">
              Construyendo el futuro de la{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                toma de decisiones
              </span>
            </h1>

            <p className="text-xl md:text-2xl styles.colors.text.secondary max-w-3xl mx-auto leading-relaxed">
              Quoorum nació de una frustración simple: las herramientas de IA nos
              dan respuestas rápidas, pero las decisiones importantes necesitan
              debate, perspectivas múltiples y pensamiento crítico.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="relative p-16 rounded-[3rem] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-cyan-600/20 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-[var(--theme-landing-border)] rounded-[3rem]" />

            <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/30 rounded-full blur-[100px]" />

            <div className="relative z-10 text-center">
              <h2 className="text-4xl md:text-5xl font-bold styles.colors.text.primary mb-6">
                Nuestra Misión
              </h2>
              <p className="text-xl styles.colors.text.secondary max-w-3xl mx-auto leading-relaxed">
                Democratizar el acceso a deliberación de clase mundial. Cada equipo,
                sin importar su tamaño, debería poder analizar decisiones complejas
                con la misma profundidad que las mejores consultoras del mundo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <SectionHeader
            title="Nuestros Valores"
            subtitle="Los principios que guían cada decisión que tomamos"
          />

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <IconCard
                key={index}
                icon={value.icon}
                title={value.title}
                description={value.description}
                gradient={value.gradient}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <SectionHeader
            title="Nuestro Viaje"
            subtitle="De la idea a la realidad"
          />

          <div className="space-y-12">
            {timeline.map((item, index) => (
              <div key={index} className="relative pl-12 border-l-2 border-[var(--theme-landing-border)]">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500" />

                <div className="text-sm font-mono text-purple-400 mb-2">
                  {item.year}
                </div>
                <h3 className="text-2xl font-bold styles.colors.text.primary mb-3">
                  {item.title}
                </h3>
                <p className="styles.colors.text.secondary leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <SectionHeader
            title="El Equipo"
            subtitle="Construido por personas que aman resolver problemas difíciles"
          />

          <div className="relative p-12 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-[var(--theme-landing-card)] backdrop-blur-xl" />
            <div className="absolute inset-0 border border-[var(--theme-landing-border)] rounded-3xl" />

            <div className="relative z-10 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-bold styles.colors.text.primary mb-4">
                {team[0]?.name}
              </h3>
              <p className="text-lg text-purple-400 mb-6">{team[0]?.role}</p>
              <p className="styles.colors.text.secondary max-w-2xl mx-auto leading-relaxed">
                {team[0]?.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTASection>
        <h2 className="text-4xl md:text-6xl font-bold styles.colors.text.primary mb-6 tracking-tight">
          Únete a la revolución de las decisiones
        </h2>
        <p className="text-xl styles.colors.text.secondary mb-10 max-w-2xl mx-auto">
          Empieza a tomar mejores decisiones hoy. 5 debates gratis, sin
          tarjeta de crédito.
        </p>
        <Link href="/signup">
          <GradientCTAButton size="lg">
            Crear Cuenta Gratis
          </GradientCTAButton>
        </Link>
      </CTASection>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
