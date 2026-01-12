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
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Users,
    title: "Panel de 25+ Expertos IA",
    description:
      "Expertos en estrategia, tecnología, finanzas, ética y más debaten tus decisiones.",
  },
  {
    icon: Brain,
    title: "Consenso Inteligente",
    description:
      "Algoritmo de consenso que analiza argumentos y calcula probabilidad de éxito.",
  },
  {
    icon: Zap,
    title: "Tiempo Real",
    description:
      "Observa cómo los expertos deliberan y construyen consenso en vivo.",
  },
  {
    icon: BarChart3,
    title: "Analytics Avanzados",
    description:
      "Métricas de calidad, historial de debates y tendencias de decisiones.",
  },
  {
    icon: Shield,
    title: "Seguridad Enterprise",
    description:
      "Encriptación end-to-end, SOC 2 compliant, datos nunca compartidos.",
  },
  {
    icon: Target,
    title: "Recomendaciones Accionables",
    description:
      "Estrategias claras con puntos a favor, en contra y próximos pasos.",
  },
  {
    icon: Sparkles,
    title: "Debates Auto-Mejorados",
    description:
      "Sistema de control de calidad que detecta argumentos superficiales y redirige automáticamente hacia mayor profundidad y rigor analítico.",
  },
  {
    icon: Database,
    title: "Memoria Institucional",
    description:
      "Encuentra y capitaliza debates similares del pasado. Tu conocimiento organizacional crece con cada decisión.",
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
  },
  {
    title: "Estrategia",
    examples: [
      "¿Cuál es mi mejor estrategia de negociación?",
      "¿Cómo posicionarme frente a la competencia?",
      "¿Debo pivotar o duplicar mi apuesta?",
    ],
  },
  {
    title: "Inversiones",
    examples: [
      "¿Es este un buen momento para invertir?",
      "¿Qué riesgos debo considerar?",
      "¿Cuál es el ROI esperado?",
    ],
  },
];

const testimonials = [
  {
    quote:
      "Forum cambió la forma en que tomamos decisiones estratégicas. El consenso de expertos nos da confianza en cada paso.",
    author: "María García",
    role: "CEO @ TechStartup",
    avatar: "MG",
  },
  {
    quote:
      "Antes pasábamos semanas deliberando. Ahora en minutos tenemos perspectivas de 25 expertos. Increíble.",
    author: "Carlos Ruiz",
    role: "Director Estrategia @ Consulting",
    avatar: "CR",
  },
  {
    quote:
      "La calidad del análisis es impresionante. Es como tener un board de asesores disponible 24/7.",
    author: "Ana Martínez",
    role: "Fundadora @ InvestCo",
    avatar: "AM",
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
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Forum</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-gray-300 hover:text-white transition">
                Características
              </Link>
              <Link href="#use-cases" className="text-sm text-gray-300 hover:text-white transition">
                Casos de Uso
              </Link>
              <Link href="#pricing" className="text-sm text-gray-300 hover:text-white transition">
                Precios
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Empezar Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm mb-8">
            <Star className="w-4 h-4" />
            <span>25+ Expertos IA para tus decisiones estratégicas</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white max-w-4xl mx-auto leading-tight">
            Toma mejores decisiones con{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              consenso de expertos IA
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mt-6">
            Forum reúne 25+ expertos de IA que deliberan en tiempo real sobre tus decisiones
            más importantes. A diferencia de un chatbot, nuestro sistema auto-mejora la calidad 
            del debate y aprende de cada decisión. Obtén análisis profundo, consenso fundamentado 
            y recomendaciones accionables en minutos, no semanas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link href="/signup">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 h-12">
                Empezar Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 h-12">
                Ver Demo
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>No requiere tarjeta</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>5 debates gratis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Setup en 2 minutos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-white/10 bg-white/5">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-500 text-sm mb-8">
            Usado por equipos de estrategia en
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-50">
            {["TechCorp", "StartupX", "ConsultingCo", "InvestGroup", "StrategyFirm"].map((company) => (
              <span key={company} className="text-white font-semibold text-lg">
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Todo lo que necesitas para{" "}
              <span className="text-purple-400">decidir con confianza</span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
              Forum combina IA de última generación con metodología probada de toma de decisiones.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition">
                  <feature.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-24 px-4 bg-white/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Casos de uso que <span className="text-purple-400">transforman negocios</span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
              Desde startups hasta enterprises, Forum ayuda a tomar decisiones críticas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="p-6 rounded-2xl bg-slate-800/50 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">{useCase.title}</h3>
                <ul className="space-y-3">
                  {useCase.examples.map((example) => (
                    <li key={example} className="flex items-start gap-3 text-gray-400">
                      <CheckCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Así de simple <span className="text-purple-400">funciona</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Plantea tu pregunta",
                description: "Describe la decisión que necesitas tomar con todo el contexto relevante.",
                icon: MessageCircle,
              },
              {
                step: "2",
                title: "Los expertos deliberan",
                description: "25+ expertos IA analizan, debaten y construyen consenso en tiempo real.",
                icon: Users,
              },
              {
                step: "3",
                title: "Recibe recomendaciones",
                description: "Obtén un análisis completo con la mejor opción, pros/contras y next steps.",
                icon: TrendingUp,
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-purple-400" />
                </div>
                <div className="text-4xl font-bold text-purple-400 mb-2">{item.step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-white/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Lo que dicen <span className="text-purple-400">nuestros usuarios</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.author}
                className="p-6 rounded-2xl bg-slate-800/50 border border-white/10"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-300 font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-white font-medium">{testimonial.author}</p>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Precios <span className="text-purple-400">simples y transparentes</span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
              Empieza gratis. Actualiza cuando lo necesites.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`p-8 rounded-2xl border ${
                  plan.popular
                    ? "bg-purple-500/20 border-purple-500"
                    : "bg-white/5 border-white/10"
                } relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 rounded-full text-white text-sm font-medium">
                    Más Popular
                  </div>
                )}

                <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{plan.description}</p>

                <div className="mt-6">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-gray-400">/mes</span>
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-purple-400 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/signup" className="block mt-8">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Empieza a tomar mejores decisiones hoy
            </h2>
            <p className="text-gray-300 mt-4">
              Únete a cientos de equipos que usan Forum para decisiones estratégicas.
              5 debates gratis, sin tarjeta de crédito.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link href="/signup">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 h-12">
                  Crear Cuenta Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Forum</span>
              </Link>
              <p className="text-gray-400 text-sm mt-4">
                Sistema de deliberación multi-agente para decisiones estratégicas.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Producto</h4>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-gray-400 hover:text-white text-sm">Características</Link></li>
                <li><Link href="#pricing" className="text-gray-400 hover:text-white text-sm">Precios</Link></li>
                <li><Link href="#use-cases" className="text-gray-400 hover:text-white text-sm">Casos de Uso</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white text-sm">Sobre Nosotros</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white text-sm">Blog</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white text-sm">Contacto</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-gray-400 hover:text-white text-sm">Privacidad</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white text-sm">Términos</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Forum. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
