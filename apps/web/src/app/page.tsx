'use client'

import Link from "next/link";
import Image from "next/image";
import {
  MessageCircle,
  Users,
  Zap,
  Shield,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Star,
  BarChart3,
  Brain,
  Target,
  Sparkles,
  Database,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/app-header";
import { LandingFooter } from "@/components/layout/landing-footer";
import { SectionHeader } from "@/components/ui/section-header";
import { CTASection } from "@/components/ui/cta-section";
import { GradientCTAButton } from "@/components/ui/gradient-cta-button";

const features = [
  {
    icon: Users,
    title: "93 Expertos en 8 Categorías",
    description:
      "SaaS, Venture Capital, Engineering, Legal, Design/UX, y más. Cada experto con su área de expertise verificada.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "Deliberación Multi-Agente",
    description:
      "Los expertos debaten entre sí automáticamente, identificando puntos ciegos y asunciones peligrosas en tiempo real.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "Debates Rastreables",
    description:
      "Historial completo de cada argumento, voto y cambio de opinión. Transparencia total del proceso de decisión.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: BarChart3,
    title: "Algoritmo de Consenso",
    description:
      "Calcula consenso dinámicamente basado en fuerza de argumentos, no en popularidad o sesgos.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Shield,
    title: "Métricas de Calidad en Tiempo Real",
    description:
      "Monitorea calidad de argumentos, profundidad de análisis y citaciones de fuentes automáticamente.",
    gradient: "from-red-500 to-rose-500",
  },
  {
    icon: Target,
    title: "Notificaciones Inteligentes",
    description:
      "Alertas cuando un debate alcanza consenso, cuando necesita tu input, o cuando hay divergencias importantes.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: Sparkles,
    title: "Exportación a PDF",
    description:
      "Genera reportes profesionales con análisis completo, argumentos, consenso y recomendaciones accionables.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Database,
    title: "Búsqueda Vectorial (Pinecone)",
    description:
      "Encuentra debates similares del pasado con búsqueda semántica. Reutiliza conocimiento acumulado.",
    gradient: "from-cyan-500 to-blue-500",
  },
];

const useCases = [
  {
    title: "Decisiones de Negocio",
    examples: [
      "¿A qué precio lanzar mi producto?",
      "¿Cómo responder a esta objeción del cliente VIP?",
      "¿Debo aceptar esta contraoferta?",
    ],
    icon: TrendingUp,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Estrategia",
    examples: [
      "¿Cuál es mi mejor estrategia de negociación?",
      "¿Cómo posicionarme frente a la competencia?",
      "¿Debo pivotar o duplicar mi apuesta?",
    ],
    icon: Target,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    title: "Inversiones",
    examples: [
      "¿Es este un buen momento para invertir?",
      "¿Qué riesgos debo considerar?",
      "¿Cuál es el ROI esperado?",
    ],
    icon: BarChart3,
    gradient: "from-green-500 to-emerald-500",
  },
];

const testimonials = [
  {
    quote:
      "Quoorum cambió la forma en que tomamos decisiones estratégicas. El consenso de expertos nos da confianza en cada paso.",
    author: "María García",
    role: "CEO @ TechStartup",
    avatar: "MG",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    quote:
      "Antes pasábamos semanas deliberando. Ahora en minutos tenemos perspectivas de 25 expertos. Increíble.",
    author: "Carlos Ruiz",
    role: "Director Estrategia @ Consulting",
    avatar: "CR",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    quote:
      "La calidad del análisis es impresionante. Es como tener un board de asesores disponible 24/7.",
    author: "Ana Martínez",
    role: "Fundadora @ InvestCo",
    avatar: "AM",
    gradient: "from-green-500 to-emerald-500",
  },
];

const pricing = [
  {
    name: "Free",
    price: "0",
    description: "Para probar el sistema",
    features: [
      "10 debates al mes",
      "Acceso a los 93 expertos",
      "Hasta 5 rondas por debate",
      "Historial 30 días",
      "Notificaciones básicas",
    ],
    cta: "Empezar Gratis",
    popular: false,
    gradient: "from-slate-500 to-slate-600",
  },
  {
    name: "Pro",
    price: "29",
    description: "Para profesionales y equipos pequeños",
    features: [
      "50 debates al mes",
      "Todos los 93 expertos",
      "Hasta 10 rondas por debate",
      "Historial ilimitado",
      "Exportar a PDF",
      "Notificaciones inteligentes",
      "Búsqueda vectorial (Pinecone)",
      "Soporte prioritario",
    ],
    cta: "Comenzar Prueba Gratis",
    popular: true,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Business",
    price: "99",
    description: "Para empresas y equipos grandes",
    features: [
      "Debates ilimitados",
      "Todos los 93 expertos",
      "Hasta 20 rondas por debate",
      "Expertos personalizados",
      "API access (85 routers)",
      "SSO / SAML",
      "Dashboard analytics",
      "Soporte dedicado",
    ],
    cta: "Contactar Ventas",
    popular: false,
    gradient: "from-blue-500 to-cyan-500",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--theme-landing-bg)] relative overflow-hidden transition-colors duration-300">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[var(--theme-landing-bg)] to-cyan-900/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 dark:bg-purple-500/30 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/30 dark:bg-cyan-500/30 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/20 dark:bg-pink-500/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(var(--theme-landing-grid)_1px,transparent_1px),linear-gradient(90deg,var(--theme-landing-grid)_1px,transparent_1px)] bg-[size:72px_72px]" />

      {/* Navigation */}
      <AppHeader variant="landing" showAuth={true} />

      {/* Hero Section */}
      <section className="pt-20 sm:pt-32 md:pt-40 pb-16 sm:pb-24 md:pb-32 px-4 relative">
        <div className="container mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-[var(--theme-landing-border)] backdrop-blur-xl mb-8 group hover:border-purple-500/40 transition-all">
            <Star className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
            <span className="text-sm bg-gradient-to-r from-[var(--theme-gradient-text-from)] to-[var(--theme-gradient-text-to)] bg-clip-text text-transparent font-medium">
              93 Expertos IA especializados en 8 áreas
            </span>
            <Sparkles className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-[var(--theme-text-primary)] max-w-5xl mx-auto leading-[1.1] mb-6 sm:mb-8 tracking-tight">
            Toma mejores decisiones
            <br />
            con{" "}
            <span className="relative inline-block">
              <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 blur-3xl opacity-50" />
              <span className="relative bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Quoorum
              </span>
            </span>
            <br />
            de expertos IA
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[var(--theme-text-secondary)] max-w-3xl mx-auto leading-relaxed">
            Sistema de deliberación multi-agente con{" "}
            <span className="text-[var(--theme-text-primary)] font-medium">
              93 expertos especializados en 8 áreas
            </span>{" "}
            que debaten automáticamente hasta alcanzar consenso. Con{" "}
            <span className="text-[var(--theme-text-primary)] font-medium">
              búsqueda vectorial, exportación a PDF, y métricas de calidad en tiempo real,
            </span>{" "}
            tomas decisiones informadas en minutos, no días.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
            <Link href="/signup">
              <GradientCTAButton size="lg">
                Empezar Gratis
              </GradientCTAButton>
            </Link>
            <Link href="#demo">
              <Button size="lg" className="relative group overflow-hidden bg-[var(--theme-landing-card)] hover:bg-[var(--theme-landing-card-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-landing-border)] hover:border-[var(--theme-landing-border-hover)] backdrop-blur-xl px-10 h-14 text-lg transition-all">
                <span className="relative z-10 flex items-center gap-2">
                  Ver Demo
                  <Layers className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </span>
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-8 mt-16 text-sm text-[var(--theme-text-tertiary)]">
            <div className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/20 group-hover:border-green-500/40 transition-all">
                <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
              </div>
              <span className="group-hover:text-[var(--theme-text-secondary)] transition-colors">No requiere tarjeta</span>
            </div>
            <div className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20 group-hover:border-purple-500/40 transition-all">
                <CheckCircle className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              </div>
              <span className="group-hover:text-[var(--theme-text-secondary)] transition-colors">5 debates gratis</span>
            </div>
            <div className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20 group-hover:border-cyan-500/40 transition-all">
                <CheckCircle className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              </div>
              <span className="group-hover:text-[var(--theme-text-secondary)] transition-colors">Setup en 2 minutos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Multiple AIs */}
      <section className="py-16 sm:py-24 md:py-32 px-4 relative">
        <div className="container mx-auto">
          <SectionHeader
            title="¿Por qué"
            gradientText="múltiples IAs?"
            subtitle="Porque ya sabes que cada una tiene su especialidad. El problema es el trabajo manual."
          />

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto mb-20">
            {/* Before */}
            <div className="relative p-10 rounded-3xl bg-gradient-to-br from-red-500/5 to-orange-500/5 border border-red-500/20 backdrop-blur-xl">
              <div className="absolute top-6 right-6 px-4 py-2 bg-red-500/20 rounded-full text-red-600 dark:text-red-300 text-sm font-medium">
                ❌ Antes (manual)
              </div>
              <div className="space-y-6 mt-12">
                {[
                  { step: "1", text: "Abro ChatGPT → Copy/paste respuesta" },
                  { step: "2", text: "Abro Claude → Copy/paste respuesta" },
                  { step: "3", text: "Abro Perplexity → Copy/paste respuesta" },
                  { step: "4", text: "Abro Gemini → Copy/paste respuesta" },
                  { step: "5", text: "Leo todo y sintetizo mentalmente 🤯" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-300 font-semibold shrink-0">
                      {item.step}
                    </div>
                    <p className="text-[var(--theme-text-secondary)] pt-1">{item.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-8 border-t border-red-500/20">
                <p className="text-red-600 dark:text-red-300 text-sm">
                  ⏱️ <strong>30-60 minutos</strong> de copiar/pegar y cambiar de pestañas
                </p>
              </div>
            </div>

            {/* After */}
            <div className="relative p-10 rounded-3xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/20 backdrop-blur-xl">
              <div className="absolute top-6 right-6 px-4 py-2 bg-green-500/20 rounded-full text-green-600 dark:text-green-300 text-sm font-medium">
                ✅ Con Quoorum
              </div>
              <div className="space-y-6 mt-12">
                {[
                  { step: "1", text: "Planteo mi pregunta una vez" },
                  { step: "2", text: "93 expertos debaten automáticamente" },
                  { step: "3", text: "Recibo consenso + análisis de divergencias + PDF" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-600 dark:text-green-300 font-semibold shrink-0">
                      {item.step}
                    </div>
                    <p className="text-[var(--theme-text-secondary)] pt-1">{item.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-8 border-t border-green-500/20">
                <p className="text-green-600 dark:text-green-300 text-sm">
                  ⚡ <strong>3-5 minutos</strong> para decisiones complejas
                </p>
              </div>
            </div>
          </div>

          {/* AI Specialties Grid */}
          <div className="max-w-5xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-[var(--theme-text-primary)] text-center mb-12">
              93 expertos organizados en 8 categorías especializadas
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { name: "SaaS & Startups", count: "24 expertos", examples: "April Dunford, Patrick Campbell, Jason Lemkin", icon: Target, gradient: "from-blue-500 to-cyan-500" },
                { name: "Venture Capital", count: "5 expertos", examples: "Marc Andreessen, Bill Gurley, Naval", icon: TrendingUp, gradient: "from-green-500 to-emerald-500" },
                { name: "Engineering", count: "5 expertos", examples: "CTO, Tech Lead, DevOps", icon: Zap, gradient: "from-yellow-500 to-orange-500" },
                { name: "Design & UX", count: "5 expertos", examples: "UX Research, Product Design", icon: Sparkles, gradient: "from-purple-500 to-pink-500" },
                { name: "Legal", count: "3 expertos", examples: "Corporate, IP, Compliance", icon: Shield, gradient: "from-red-500 to-rose-500" },
                { name: "General Purpose", count: "1 experto", examples: "Multi-disciplinary advisor", icon: Brain, gradient: "from-indigo-500 to-purple-500" },
                { name: "Vida Personal", count: "25 expertos", examples: "Finanzas, Salud, Relaciones", icon: Users, gradient: "from-pink-500 to-rose-500" },
                { name: "Figuras Históricas", count: "25 expertos", examples: "Filósofos, Estrategas, Líderes", icon: MessageCircle, gradient: "from-cyan-500 to-blue-500" },
              ].map((category) => (
                <div
                  key={category.name}
                  className="group relative p-6 rounded-2xl bg-[var(--theme-landing-card)] border border-[var(--theme-landing-border)] hover:border-[var(--theme-landing-border-hover)] transition-all backdrop-blur-xl"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl`} />
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <category.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-[var(--theme-text-primary)] mb-1">{category.name}</h4>
                    <p className="text-xs text-purple-400 font-medium mb-2">{category.count}</p>
                    <p className="text-xs text-[var(--theme-text-tertiary)]">{category.examples}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-[var(--theme-text-secondary)] text-base mt-8 font-medium">
              Todos los expertos configurables con IA de última generación (GPT-4o, Claude Sonnet, Gemini, DeepSeek)
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-y border-[var(--theme-landing-border)] backdrop-blur-xl bg-[var(--theme-landing-social-bg)]">
        <div className="container mx-auto px-4">
          <p className="text-center text-[var(--theme-landing-social-text)] text-sm mb-10 tracking-wider uppercase">
            Usado por equipos de estrategia en
          </p>
          <div className="flex items-center justify-center gap-16 flex-wrap">
            {["TechCorp", "StartupX", "ConsultingCo", "InvestGroup", "StrategyFirm"].map((company) => (
              <span key={company} className="text-[var(--theme-landing-social-text)] font-semibold text-xl hover:text-[var(--theme-text-secondary)] transition-colors cursor-default">
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Bento Grid */}
      <section id="features" className="py-32 px-4">
        <div className="container mx-auto">
          <SectionHeader
            title="Todo lo que necesitas para"
            gradientText="decidir con confianza"
            subtitle="Quoorum combina IA de última generación con metodología probada de toma de decisiones."
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative p-8 rounded-3xl bg-[var(--theme-landing-card)] border border-[var(--theme-landing-border)] hover:border-[var(--theme-landing-border-hover)] transition-all duration-500 backdrop-blur-xl overflow-hidden"
              >
                {/* Gradient glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl`} />

                {/* Icon */}
                <div className="relative mb-6">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity`} />
                  <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-[var(--theme-text-primary)] mb-3 transition-all">
                  {feature.title}
                </h3>
                <p className="text-[var(--theme-text-secondary)] text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--theme-landing-card-hover)] to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-32 px-4 relative">
        <div className="container mx-auto">
          <SectionHeader
            title="Casos de uso que"
            gradientText="transforman negocios"
            subtitle="Desde startups hasta enterprises, Quoorum ayuda a tomar decisiones críticas."
          />

          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="group relative p-8 rounded-3xl bg-[var(--theme-landing-card)] border border-[var(--theme-landing-border)] hover:border-[var(--theme-landing-border-hover)] transition-all duration-500 backdrop-blur-xl overflow-hidden"
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

                {/* Icon */}
                <div className="relative mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <useCase.icon className="w-8 h-8 text-white" />
                  </div>
                </div>

                <h3 className="text-2xl font-semibold text-[var(--theme-text-primary)] mb-6">{useCase.title}</h3>
                <ul className="space-y-4">
                  {useCase.examples.map((example) => (
                    <li key={example} className="flex items-start gap-3 text-[var(--theme-text-secondary)] group/item hover:text-[var(--theme-text-primary)] transition-colors">
                      <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${useCase.gradient} flex items-center justify-center shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform`}>
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="leading-relaxed">{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-4">
        <div className="container mx-auto">
          <SectionHeader
            title="Así de simple"
            gradientText="funciona"
          />

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Plantea tu pregunta",
                description: "Describe la decisión que necesitas tomar con todo el contexto relevante.",
                icon: MessageCircle,
                gradient: "from-purple-500 to-pink-500",
              },
              {
                step: "2",
                title: "93 expertos deliberan",
                description: "Múltiples rondas de debate automáticas hasta alcanzar consenso (≥70%) o identificar divergencias clave.",
                icon: Users,
                gradient: "from-cyan-500 to-blue-500",
              },
              {
                step: "3",
                title: "Recibe recomendaciones",
                description: "Obtén un análisis completo con la mejor opción, pros/contras y next steps.",
                icon: TrendingUp,
                gradient: "from-green-500 to-emerald-500",
              },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                {/* Step number with gradient */}
                <div className="relative mb-8 inline-block">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity`} />
                  <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center border-4 border-[var(--theme-landing-bg)] group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-[var(--theme-landing-bg)] border-2 border-[var(--theme-landing-border)] flex items-center justify-center">
                    <span className="text-2xl font-bold text-[var(--theme-text-primary)]">{item.step}</span>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold text-[var(--theme-text-primary)] mb-4">{item.title}</h3>
                <p className="text-[var(--theme-text-secondary)] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 md:py-32 px-4 relative">
        <div className="container mx-auto">
          <SectionHeader
            title="Lo que dicen"
            gradientText="nuestros usuarios"
          />

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.author}
                className="group relative p-8 rounded-3xl bg-[var(--theme-landing-card)] border border-[var(--theme-landing-border)] hover:border-[var(--theme-landing-border-hover)] transition-all duration-500 backdrop-blur-xl"
              >
                {/* Stars */}
                <div className="flex items-center gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-[var(--theme-text-secondary)] mb-8 leading-relaxed text-lg">
                  &quot;{testimonial.quote}&quot;
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-semibold text-lg group-hover:scale-110 transition-transform`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-[var(--theme-text-primary)] font-medium text-lg">{testimonial.author}</p>
                    <p className="text-[var(--theme-text-tertiary)] text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-4">
        <div className="container mx-auto">
          <SectionHeader
            title="Precios"
            gradientText="simples y transparentes"
            subtitle="Empieza gratis. Actualiza cuando lo necesites."
          />

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-10 rounded-3xl backdrop-blur-xl transition-all duration-500 ${
                  plan.popular
                    ? "bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20 scale-105"
                    : "bg-[var(--theme-landing-card)] border border-[var(--theme-landing-border)] hover:border-[var(--theme-landing-border-hover)]"
                }`}
              >
                {plan.popular && (
                  <>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-sm font-medium shadow-lg">
                      Más Popular
                    </div>
                    <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-10 rounded-3xl`} />
                  </>
                )}

                <div className="relative">
                  <h3 className="text-2xl font-semibold text-[var(--theme-text-primary)] mb-2">{plan.name}</h3>
                  <p className="text-[var(--theme-text-secondary)] text-sm mb-8">{plan.description}</p>

                  <div className="mb-8">
                    <span className="text-6xl font-bold text-[var(--theme-text-primary)]">${plan.price}</span>
                    <span className="text-[var(--theme-text-secondary)] text-lg">/mes</span>
                  </div>

                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-[var(--theme-text-secondary)]">
                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${plan.gradient} flex items-center justify-center shrink-0`}>
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/signup" className="block">
                    <Button
                      className={`w-full h-14 text-lg ${
                        plan.popular
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
                          : "bg-[var(--theme-landing-card)] hover:bg-[var(--theme-landing-card-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-landing-border)]"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTASection>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--theme-text-primary)] mb-6 tracking-tight">
          Empieza a tomar mejores decisiones hoy
        </h2>
        <p className="text-xl text-[var(--theme-text-secondary)] mb-10 max-w-2xl mx-auto">
          Únete a cientos de equipos que usan Quoorum para decisiones estratégicas.
          5 debates gratis, sin tarjeta de crédito.
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
