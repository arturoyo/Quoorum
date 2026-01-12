import Link from "next/link";
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
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Users,
    title: "Panel de 25+ Expertos IA",
    description:
      "Expertos en estrategia, tecnología, finanzas, ética y más debaten tus decisiones.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "Consenso Inteligente",
    description:
      "Algoritmo de consenso que analiza argumentos y calcula probabilidad de éxito.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "Tiempo Real",
    description:
      "Observa cómo los expertos deliberan y construyen consenso en vivo.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: BarChart3,
    title: "Analytics Avanzados",
    description:
      "Métricas de calidad, historial de debates y tendencias de decisiones.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Shield,
    title: "Seguridad Enterprise",
    description:
      "Encriptación end-to-end, SOC 2 compliant, datos nunca compartidos.",
    gradient: "from-red-500 to-rose-500",
  },
  {
    icon: Target,
    title: "Recomendaciones Accionables",
    description:
      "Estrategias claras con puntos a favor, en contra y próximos pasos.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: Sparkles,
    title: "Debates Auto-Mejorados",
    description:
      "Sistema de control de calidad que detecta argumentos superficiales y redirige automáticamente hacia mayor profundidad y rigor analítico.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Database,
    title: "Memoria Institucional",
    description:
      "Encuentra y capitaliza debates similares del pasado. Tu conocimiento organizacional crece con cada decisión.",
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
      "Forum cambió la forma en que tomamos decisiones estratégicas. El consenso de expertos nos da confianza en cada paso.",
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
      "5 debates al mes",
      "Hasta 4 expertos",
      "3 rondas por debate",
      "Historial 30 días",
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
      "Hasta 8 expertos",
      "5 rondas por debate",
      "Historial ilimitado",
      "Exportar a PDF",
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
      "Hasta 15 expertos",
      "10 rondas por debate",
      "API access",
      "SSO / SAML",
      "Soporte dedicado",
      "Custom experts",
    ],
    cta: "Contactar Ventas",
    popular: false,
    gradient: "from-blue-500 to-cyan-500",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-2xl bg-black/50">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                Forum
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-gray-400 hover:text-white transition-colors relative group">
                Características
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-full transition-all" />
              </Link>
              <Link href="#use-cases" className="text-sm text-gray-400 hover:text-white transition-colors relative group">
                Casos de Uso
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-full transition-all" />
              </Link>
              <Link href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors relative group">
                Precios
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-full transition-all" />
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="relative group overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0">
                  <span className="relative z-10">Empezar Gratis</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-4 relative">
        <div className="container mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 backdrop-blur-xl mb-8 group hover:border-purple-500/40 transition-all">
            <Star className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
            <span className="text-sm bg-gradient-to-r from-purple-200 to-cyan-200 bg-clip-text text-transparent font-medium">
              25+ Expertos IA para tus decisiones estratégicas
            </span>
            <Sparkles className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white max-w-5xl mx-auto leading-[1.1] mb-8 tracking-tight">
            Toma mejores decisiones con{" "}
            <span className="relative inline-block">
              <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 blur-3xl opacity-50" />
              <span className="relative bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                consenso de expertos IA
              </span>
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Forum reúne 25+ expertos de IA que deliberan en tiempo real sobre tus decisiones
            más importantes.{" "}
            <span className="text-white font-medium">
              A diferencia de un chatbot, nuestro sistema auto-mejora la calidad 
              del debate y aprende de cada decisión.
            </span>{" "}
            Obtén análisis profundo, consenso fundamentado 
            y recomendaciones accionables en minutos, no semanas.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
            <Link href="/signup">
              <Button size="lg" className="relative group overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 px-10 h-14 text-lg">
                <span className="relative z-10 flex items-center gap-2">
                  Empezar Gratis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="border-white/10 text-white hover:bg-white/5 backdrop-blur-xl px-10 h-14 text-lg group">
                <span className="flex items-center gap-2">
                  Ver Demo
                  <Layers className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </span>
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-8 mt-16 text-sm text-gray-500">
            <div className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/20 group-hover:border-green-500/40 transition-all">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <span className="group-hover:text-gray-400 transition-colors">No requiere tarjeta</span>
            </div>
            <div className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20 group-hover:border-purple-500/40 transition-all">
                <CheckCircle className="w-4 h-4 text-purple-400" />
              </div>
              <span className="group-hover:text-gray-400 transition-colors">5 debates gratis</span>
            </div>
            <div className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20 group-hover:border-cyan-500/40 transition-all">
                <CheckCircle className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="group-hover:text-gray-400 transition-colors">Setup en 2 minutos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-y border-white/5 backdrop-blur-xl bg-white/[0.02]">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-600 text-sm mb-10 tracking-wider uppercase">
            Usado por equipos de estrategia en
          </p>
          <div className="flex items-center justify-center gap-16 flex-wrap">
            {["TechCorp", "StartupX", "ConsultingCo", "InvestGroup", "StrategyFirm"].map((company) => (
              <span key={company} className="text-gray-700 font-semibold text-xl hover:text-gray-500 transition-colors cursor-default">
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Bento Grid */}
      <section id="features" className="py-32 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Todo lo que necesitas para{" "}
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                decidir con confianza
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Forum combina IA de última generación con metodología probada de toma de decisiones.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`group relative p-8 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 hover:border-white/10 transition-all duration-500 backdrop-blur-xl overflow-hidden ${
                  index === 6 || index === 7 ? 'lg:col-span-2' : ''
                }`}
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
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-gray-300 transition-all">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-32 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Casos de uso que{" "}
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                transforman negocios
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Desde startups hasta enterprises, Forum ayuda a tomar decisiones críticas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="group relative p-8 rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 hover:border-white/20 transition-all duration-500 backdrop-blur-xl overflow-hidden"
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                
                {/* Icon */}
                <div className="relative mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <useCase.icon className="w-8 h-8 text-white" />
                  </div>
                </div>

                <h3 className="text-2xl font-semibold text-white mb-6">{useCase.title}</h3>
                <ul className="space-y-4">
                  {useCase.examples.map((example) => (
                    <li key={example} className="flex items-start gap-3 text-gray-400 group/item hover:text-gray-300 transition-colors">
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
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Así de simple{" "}
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                funciona
              </span>
            </h2>
          </div>

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
                title: "Los expertos deliberan",
                description: "25+ expertos IA analizan, debaten y construyen consenso en tiempo real.",
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
                  <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center border-4 border-black group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-black border-2 border-white/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{item.step}</span>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold text-white mb-4">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Lo que dicen{" "}
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                nuestros usuarios
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.author}
                className="group relative p-8 rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 hover:border-white/20 transition-all duration-500 backdrop-blur-xl"
              >
                {/* Stars */}
                <div className="flex items-center gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-300 mb-8 leading-relaxed text-lg">
                  &quot;{testimonial.quote}&quot;
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-semibold text-lg group-hover:scale-110 transition-transform`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-white font-medium text-lg">{testimonial.author}</p>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
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
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Precios{" "}
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                simples y transparentes
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Empieza gratis. Actualiza cuando lo necesites.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-10 rounded-3xl backdrop-blur-xl transition-all duration-500 ${
                  plan.popular
                    ? "bg-gradient-to-br from-white/10 to-white/5 border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20 scale-105"
                    : "bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 hover:border-white/20"
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
                  <h3 className="text-2xl font-semibold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-8">{plan.description}</p>

                  <div className="mb-8">
                    <span className="text-6xl font-bold text-white">${plan.price}</span>
                    <span className="text-gray-400 text-lg">/mes</span>
                  </div>

                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-gray-300">
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
                          : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
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
      <section className="py-32 px-4">
        <div className="container mx-auto">
          <div className="relative max-w-4xl mx-auto text-center p-16 rounded-[3rem] overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-cyan-600/20 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-white/10 rounded-[3rem]" />
            
            {/* Glow effects */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/30 rounded-full blur-[100px]" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                Empieza a tomar mejores decisiones hoy
              </h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                Únete a cientos de equipos que usan Forum para decisiones estratégicas.
                5 debates gratis, sin tarjeta de crédito.
              </p>
              <Link href="/signup">
                <Button size="lg" className="relative group overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 px-12 h-16 text-xl">
                  <span className="relative z-10 flex items-center gap-2">
                    Crear Cuenta Gratis
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-4 backdrop-blur-xl bg-white/[0.02]">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-6 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition" />
                  <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                  Forum
                </span>
              </Link>
              <p className="text-gray-500 text-sm leading-relaxed">
                Sistema de deliberación multi-agente para decisiones estratégicas.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Producto</h4>
              <ul className="space-y-3">
                <li><Link href="#features" className="text-gray-500 hover:text-white text-sm transition-colors">Características</Link></li>
                <li><Link href="#pricing" className="text-gray-500 hover:text-white text-sm transition-colors">Precios</Link></li>
                <li><Link href="#use-cases" className="text-gray-500 hover:text-white text-sm transition-colors">Casos de Uso</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Empresa</h4>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-gray-500 hover:text-white text-sm transition-colors">Sobre Nosotros</Link></li>
                <li><Link href="/blog" className="text-gray-500 hover:text-white text-sm transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="text-gray-500 hover:text-white text-sm transition-colors">Contacto</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="/privacy" className="text-gray-500 hover:text-white text-sm transition-colors">Privacidad</Link></li>
                <li><Link href="/terms" className="text-gray-500 hover:text-white text-sm transition-colors">Términos</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 text-center text-gray-600 text-sm">
            <p>&copy; {new Date().getFullYear()} Forum. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
