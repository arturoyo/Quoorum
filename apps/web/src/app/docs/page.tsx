'use client'

import Link from "next/link"
import { useState } from "react"
import {
  BookOpen,
  Rocket,
  Users,
  Coins,
  Lightbulb,
  Code,
  HelpCircle,
  ChevronRight,
  Search,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Target,
  Brain,
  Layers,
  Shield,
  Zap,
  CheckCircle2,
  FileText,
  Clock,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppHeader } from "@/components/layout/app-header"
import { LandingFooter } from "@/components/layout/landing-footer"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

interface DocSection {
  id: string
  title: string
  icon: typeof BookOpen
  description: string
}

interface QuickLink {
  title: string
  href: string
  description: string
  icon: typeof Rocket
}

// ============================================================================
// DATA
// ============================================================================

const sections: DocSection[] = [
  {
    id: "introduccion",
    title: "Introducción",
    icon: BookOpen,
    description: "Qué es Quoorum y cómo puede ayudarte",
  },
  {
    id: "inicio-rapido",
    title: "Inicio Rápido",
    icon: Rocket,
    description: "Crea tu primer debate en 5 minutos",
  },
  {
    id: "expertos",
    title: "Expertos",
    icon: Users,
    description: "Conoce a los 80+ expertos disponibles",
  },
  {
    id: "creditos",
    title: "Sistema de Créditos",
    icon: Coins,
    description: "Cómo funcionan los créditos y planes",
  },
  {
    id: "mejores-practicas",
    title: "Mejores Prácticas",
    icon: Lightbulb,
    description: "Consejos para obtener mejores resultados",
  },
  {
    id: "api",
    title: "API",
    icon: Code,
    description: "Integra Quoorum en tus aplicaciones",
  },
  {
    id: "faq",
    title: "FAQ",
    icon: HelpCircle,
    description: "Preguntas frecuentes",
  },
]

const quickLinks: QuickLink[] = [
  {
    title: "Crear primer debate",
    href: "/debates/new-unified",
    description: "Empieza con un debate guiado",
    icon: MessageSquare,
  },
  {
    title: "Ver ejemplos",
    href: "/debates",
    description: "Explora debates de ejemplo",
    icon: FileText,
  },
  {
    title: "Contactar soporte",
    href: "/contact",
    description: "Obtén ayuda personalizada",
    icon: HelpCircle,
  },
]

const phases = [
  {
    number: 1,
    title: "Contexto",
    description: "Define tu pregunta y añade información relevante",
    icon: FileText,
  },
  {
    number: 2,
    title: "Expertos",
    description: "Selecciona los expertos que participarán",
    icon: Users,
  },
  {
    number: 3,
    title: "Estrategia",
    description: "Configura el enfoque del debate",
    icon: Target,
  },
  {
    number: 4,
    title: "Debate",
    description: "Los expertos debaten hasta alcanzar consenso",
    icon: MessageSquare,
  },
]

const expertCategories = [
  {
    name: "SaaS & Startups",
    count: 25,
    examples: ["April Dunford", "Patrick Campbell", "Jason Lemkin"],
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Venture Capital",
    count: 15,
    examples: ["Marc Andreessen", "Bill Gurley", "Naval Ravikant"],
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Estrategia General",
    count: 20,
    examples: ["Peter Drucker", "Clayton Christensen", "Michael Porter"],
    gradient: "from-green-500 to-emerald-500",
  },
  {
    name: "Vida Personal",
    count: 10,
    examples: ["Esther Perel", "Brené Brown", "Adam Grant"],
    gradient: "from-orange-500 to-yellow-500",
  },
  {
    name: "Históricos",
    count: 10,
    examples: ["Steve Jobs", "Warren Buffett", "Charlie Munger"],
    gradient: "from-red-500 to-rose-500",
  },
]

const faqs = [
  {
    question: "¿Qué tipo de preguntas puedo hacer?",
    answer: "Quoorum es ideal para decisiones estratégicas complejas: lanzar un producto, pivotear, expandir a un nuevo mercado, contratar a un ejecutivo, negociar un deal, etc. Funciona mejor con preguntas que no tienen una respuesta correcta obvia.",
  },
  {
    question: "¿Cuántos créditos consume un debate?",
    answer: "Depende de la complejidad. Un debate simple (3-4 expertos, 5 rondas) consume aproximadamente 5-10 créditos. Debates más complejos con más expertos y contexto pueden consumir 20-50 créditos.",
  },
  {
    question: "¿Los debates son privados?",
    answer: "Sí, completamente. Tus debates son privados y solo tú puedes verlos. No compartimos ni usamos tu información para entrenar modelos.",
  },
  {
    question: "¿Puedo exportar los resultados?",
    answer: "Sí, puedes exportar el debate completo a PDF incluyendo todas las opiniones, el análisis de consenso y las recomendaciones finales.",
  },
  {
    question: "¿Cómo funcionan los expertos?",
    answer: "Cada experto es una personalidad de IA entrenada para razonar como el experto real. Tienen su propia perspectiva, sesgos conocidos y área de especialización.",
  },
]

// ============================================================================
// COMPONENTS
// ============================================================================

function TableOfContents({
  activeSection,
  onSectionClick,
}: {
  activeSection: string
  onSectionClick: (id: string) => void
}) {
  return (
    <nav className="space-y-1">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onSectionClick(section.id)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
            activeSection === section.id
              ? "bg-purple-500/20 text-white border border-purple-500/30"
              : "text-[var(--theme-text-secondary)] hover:text-white hover:bg-white/5"
          )}
        >
          <section.icon className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{section.title}</span>
        </button>
      ))}
    </nav>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("introduccion")
  const [searchQuery, setSearchQuery] = useState("")

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--theme-landing-bg)]">
      {/* Header */}
      <AppHeader variant="landing" showAuth={true} />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 border-b border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[var(--theme-text-secondary)] mb-6">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span>Documentación</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Aprende a usar{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Quoorum
              </span>
            </h1>

            <p className="text-xl text-[var(--theme-text-secondary)] max-w-2xl mx-auto">
              Todo lo que necesitas saber para tomar mejores decisiones con tu
              comité de expertos de IA.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--theme-text-tertiary)]" />
              <Input
                type="text"
                placeholder="Buscar en la documentación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-[var(--theme-text-tertiary)] rounded-2xl focus:border-purple-500/50 focus:ring-purple-500/20"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative p-6 rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform"
              >
                <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
                <div className="absolute inset-0 border border-white/10 rounded-2xl group-hover:border-purple-500/30 transition-colors" />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <link.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1 group-hover:text-purple-400 transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-sm text-[var(--theme-text-tertiary)]">{link.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--theme-text-tertiary)] group-hover:text-purple-400 group-hover:translate-x-1 transition-all ml-auto" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <div className="grid lg:grid-cols-[280px_1fr] gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-32">
              <h3 className="text-sm font-semibold text-[var(--theme-text-tertiary)] uppercase tracking-wider mb-4 px-4">
                Contenido
              </h3>
              <TableOfContents
                activeSection={activeSection}
                onSectionClick={scrollToSection}
              />
            </div>
          </aside>

          {/* Content */}
          <main className="space-y-24">
            {/* Introducción */}
            <section id="introduccion" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-3xl font-bold text-white">Introducción</h2>
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-[var(--theme-text-secondary)] leading-relaxed mb-8">
                  <strong className="text-white">Quoorum</strong> es una plataforma que simula un
                  Comité Ejecutivo de expertos de IA para ayudarte a tomar decisiones estratégicas
                  complejas. En lugar de obtener una respuesta simple de un único modelo de IA,
                  Quoorum organiza un debate entre múltiples perspectivas expertas hasta alcanzar
                  un consenso fundamentado.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <Brain className="w-8 h-8 text-purple-400 mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">
                      Pensamiento Multi-Perspectiva
                    </h4>
                    <p className="text-[var(--theme-text-secondary)] text-sm">
                      Cada experto aporta su perspectiva única, identificando oportunidades
                      y riesgos que un análisis simple podría pasar por alto.
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <Target className="w-8 h-8 text-cyan-400 mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">
                      Consenso Fundamentado
                    </h4>
                    <p className="text-[var(--theme-text-secondary)] text-sm">
                      El debate continúa hasta que los expertos alcanzan un consenso,
                      proporcionando recomendaciones con justificación clara.
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-white mb-4">
                  ¿Para qué sirve Quoorum?
                </h3>
                <ul className="space-y-3 text-[var(--theme-text-secondary)]">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Validar estrategias de negocio antes de ejecutarlas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Evaluar oportunidades de inversión desde múltiples ángulos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Tomar decisiones de producto con análisis profundo</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Resolver dilemas personales complejos con perspectiva</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Inicio Rápido */}
            <section id="inicio-rapido" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-3xl font-bold text-white">Inicio Rápido</h2>
              </div>

              <p className="text-lg text-[var(--theme-text-secondary)] mb-8">
                Crea tu primer debate en menos de 5 minutos siguiendo estas 4 fases:
              </p>

              <div className="space-y-6">
                {phases.map((phase, index) => (
                  <div
                    key={phase.number}
                    className="relative pl-16 pb-8 border-l-2 border-white/10 last:border-l-0 last:pb-0"
                  >
                    <div className="absolute -left-[25px] top-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {phase.number}
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <phase.icon className="w-5 h-5 text-purple-400" />
                        <h3 className="text-xl font-semibold text-white">
                          {phase.title}
                        </h3>
                      </div>
                      <p className="text-[var(--theme-text-secondary)]">{phase.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link href="/debates/new-unified">
                  <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Crear mi primer debate
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </section>

            {/* Expertos */}
            <section id="expertos" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-pink-400" />
                </div>
                <h2 className="text-3xl font-bold text-white">Expertos</h2>
              </div>

              <p className="text-lg text-[var(--theme-text-secondary)] mb-8">
                Quoorum cuenta con más de <strong className="text-white">80 expertos</strong> en
                diferentes áreas, cada uno con su perspectiva y metodología única.
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {expertCategories.map((category) => (
                  <div
                    key={category.name}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white">{category.name}</h4>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r text-white",
                        category.gradient
                      )}>
                        {category.count}+
                      </span>
                    </div>
                    <div className="space-y-2">
                      {category.examples.map((expert) => (
                        <div
                          key={expert}
                          className="text-sm text-[var(--theme-text-secondary)] flex items-center gap-2"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                          {expert}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-start gap-4">
                  <Lightbulb className="w-6 h-6 text-purple-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold mb-2">
                      Consejo: Selección de expertos
                    </h4>
                    <p className="text-[var(--theme-text-secondary)] text-sm">
                      Para obtener mejores resultados, selecciona expertos con perspectivas
                      diversas. Incluir un &quot;crítico&quot; junto con expertos optimistas
                      produce debates más equilibrados.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Sistema de Créditos */}
            <section id="creditos" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-yellow-400" />
                </div>
                <h2 className="text-3xl font-bold text-white">Sistema de Créditos</h2>
              </div>

              <p className="text-lg text-[var(--theme-text-secondary)] mb-8">
                Los créditos son la moneda de Quoorum. Cada debate consume créditos
                según su complejidad.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <Clock className="w-8 h-8 text-green-400 mx-auto mb-4" />
                  <h4 className="text-2xl font-bold text-white mb-2">5-10</h4>
                  <p className="text-[var(--theme-text-secondary)] text-sm">
                    Créditos para un debate simple (3-4 expertos, 5 rondas)
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <TrendingUp className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
                  <h4 className="text-2xl font-bold text-white mb-2">20-30</h4>
                  <p className="text-[var(--theme-text-secondary)] text-sm">
                    Créditos para un debate moderado (5-6 expertos, contexto adicional)
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <Zap className="w-8 h-8 text-purple-400 mx-auto mb-4" />
                  <h4 className="text-2xl font-bold text-white mb-2">50+</h4>
                  <p className="text-[var(--theme-text-secondary)] text-sm">
                    Créditos para debates complejos (8+ expertos, múltiples documentos)
                  </p>
                </div>
              </div>

              <Link href="/pricing">
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                  Ver planes y precios
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </section>

            {/* Mejores Prácticas */}
            <section id="mejores-practicas" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-3xl font-bold text-white">Mejores Prácticas</h2>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-sm font-bold">1</span>
                    Formula preguntas específicas
                  </h4>
                  <p className="text-[var(--theme-text-secondary)] mb-4">
                    En lugar de &quot;¿Debería expandir mi negocio?&quot;, pregunta
                    &quot;¿Debería expandir mi SaaS de $2M ARR al mercado español en Q2 2026,
                    dado que tenemos 50% de margen y 3 competidores locales?&quot;
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-red-400">❌ Vago</span>
                    <span className="text-green-400">✅ Específico con contexto</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-sm font-bold">2</span>
                    Añade contexto relevante
                  </h4>
                  <p className="text-[var(--theme-text-secondary)]">
                    Sube documentos, comparte métricas y proporciona background.
                    Cuanto más contexto, mejores serán las recomendaciones de los expertos.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-sm font-bold">3</span>
                    Diversifica tus expertos
                  </h4>
                  <p className="text-[var(--theme-text-secondary)]">
                    Incluye perspectivas opuestas: un optimista y un crítico,
                    un estratega y un operativo, un financiero y un de producto.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-sm font-bold">4</span>
                    Usa las preguntas críticas
                  </h4>
                  <p className="text-[var(--theme-text-secondary)]">
                    Responde las preguntas críticas que te hace el sistema en la fase de contexto.
                    Esto ayuda a los expertos a entender mejor tu situación.
                  </p>
                </div>
              </div>
            </section>

            {/* API */}
            <section id="api" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                  <Code className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold text-white">API</h2>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Layers className="w-6 h-6 text-blue-400" />
                  <h4 className="text-lg font-semibold text-white">API Pública</h4>
                  <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                    Próximamente
                  </span>
                </div>
                <p className="text-[var(--theme-text-secondary)] mb-4">
                  Estamos trabajando en una API pública para que puedas integrar
                  Quoorum en tus aplicaciones y flujos de trabajo.
                </p>
                <Link href="/contact">
                  <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                    Solicitar acceso anticipado
                  </Button>
                </Link>
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-orange-400" />
                </div>
                <h2 className="text-3xl font-bold text-white">FAQ</h2>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <h4 className="text-lg font-semibold text-white mb-3">
                      {faq.question}
                    </h4>
                    <p className="text-[var(--theme-text-secondary)]">{faq.answer}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <h4 className="text-white font-semibold mb-2">
                  ¿Tienes más preguntas?
                </h4>
                <p className="text-[var(--theme-text-secondary)] text-sm mb-4">
                  Nuestro equipo está aquí para ayudarte.
                </p>
                <Link href="/contact">
                  <Button className="bg-purple-600 hover:bg-purple-500 text-white">
                    Contactar soporte
                  </Button>
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
