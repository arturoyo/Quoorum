import Link from "next/link";
import {
  ArrowRight,
  Clock,
  User,
  TrendingUp,
  Brain,
  Target,
  Lightbulb,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/app-header";

const blogPosts = [
  {
    id: 1,
    title: "Por qué las decisiones importantes necesitan debate, no respuestas instantáneas",
    excerpt:
      "ChatGPT te da una respuesta en segundos. Pero ¿es suficiente para decisiones que impactan tu negocio? Exploramos por qué la deliberación multi-perspectiva es crucial.",
    author: "Equipo Quoorum",
    date: "15 Enero 2026",
    readTime: "8 min",
    category: "Pensamiento Estratégico",
    icon: Brain,
    gradient: "from-purple-500 to-pink-500",
    image: "bg-gradient-to-br from-purple-600/20 to-pink-600/20",
  },
  {
    id: 2,
    title: "Cómo funcionan los sistemas multi-agente de IA",
    excerpt:
      "Detrás de Quoorum hay tecnología fascinante. Te explicamos cómo múltiples IAs pueden debatir para encontrar mejores soluciones que una sola IA trabajando aislada.",
    author: "Equipo Quoorum",
    date: "10 Enero 2026",
    readTime: "12 min",
    category: "Tecnología",
    icon: Zap,
    gradient: "from-cyan-500 to-blue-500",
    image: "bg-gradient-to-br from-cyan-600/20 to-blue-600/20",
  },
  {
    id: 3,
    title: "5 errores comunes al usar IA para decisiones de negocio",
    excerpt:
      "La IA es poderosa, pero también puede llevarte por el camino equivocado si no la usas correctamente. Evita estos errores que hemos visto una y otra vez.",
    author: "Equipo Quoorum",
    date: "5 Enero 2026",
    readTime: "6 min",
    category: "Mejores Prácticas",
    icon: Target,
    gradient: "from-yellow-500 to-orange-500",
    image: "bg-gradient-to-br from-yellow-600/20 to-orange-600/20",
  },
  {
    id: 4,
    title: "Caso de estudio: Cómo una startup validó su estrategia de pricing con Quoorum",
    excerpt:
      "Una startup B2B SaaS no sabía si cobrar $50 o $200/mes. Usaron Quoorum para analizar la decisión desde múltiples ángulos. Los resultados los sorprendieron.",
    author: "Equipo Quoorum",
    date: "28 Diciembre 2025",
    readTime: "10 min",
    category: "Casos de Uso",
    icon: TrendingUp,
    gradient: "from-green-500 to-emerald-500",
    image: "bg-gradient-to-br from-green-600/20 to-emerald-600/20",
  },
  {
    id: 5,
    title: "El futuro de la toma de decisiones asistida por IA",
    excerpt:
      "¿Hacia dónde va esta tecnología? Exploramos las tendencias emergentes en sistemas de deliberación inteligente y qué significa para tu negocio.",
    author: "Equipo Quoorum",
    date: "20 Diciembre 2025",
    readTime: "9 min",
    category: "Futuro",
    icon: Lightbulb,
    gradient: "from-indigo-500 to-purple-500",
    image: "bg-gradient-to-br from-indigo-600/20 to-purple-600/20",
  },
  {
    id: 6,
    title: "Ética y transparencia en sistemas de IA multi-agente",
    excerpt:
      "Cuando múltiples IAs debaten, ¿cómo aseguramos que el proceso sea justo y transparente? Nuestro enfoque para mantener la ética en el centro.",
    author: "Equipo Quoorum",
    date: "15 Diciembre 2025",
    readTime: "7 min",
    category: "Ética",
    icon: Shield,
    gradient: "from-red-500 to-rose-500",
    image: "bg-gradient-to-br from-red-600/20 to-rose-600/20",
  },
];

const categories = [
  "Todos",
  "Pensamiento Estratégico",
  "Tecnología",
  "Mejores Prácticas",
  "Casos de Uso",
  "Futuro",
  "Ética",
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Header */}
      <AppHeader variant="landing" showAuth={true} />

      {/* Hero */}
      <section className="pt-40 pb-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-8">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>Blog de Quoorum</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
              Insights sobre{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                decisiones inteligentes
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Artículos, casos de estudio y reflexiones sobre cómo la IA está
              transformando la manera en que tomamos decisiones importantes.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-6 py-2 rounded-full text-sm transition-all ${
                  category === "Todos"
                    ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white"
                    : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="pb-32 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="group relative rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
                <div className="absolute inset-0 border border-white/10 rounded-3xl" />

                <div className="relative z-10 p-8">
                  {/* Image placeholder with gradient */}
                  <div
                    className={`${post.image} h-48 rounded-2xl mb-6 flex items-center justify-center`}
                  >
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${post.gradient} flex items-center justify-center`}
                    >
                      <post.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Category */}
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${post.gradient} bg-opacity-10 text-xs font-medium text-white mb-4`}
                  >
                    {post.category}
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-400 transition-colors">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    {post.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="mt-4 text-xs text-gray-600">{post.date}</div>

                  {/* Read More */}
                  <div className="mt-6 flex items-center gap-2 text-purple-400 group-hover:gap-3 transition-all">
                    <span className="text-sm font-medium">Leer más</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-16">
            <Button
              variant="outline"
              className="border-white/10 hover:bg-white/5 text-white px-8"
            >
              Cargar más artículos
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="relative p-16 rounded-[3rem] overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-cyan-600/20 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-white/10 rounded-[3rem]" />

            <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/30 rounded-full blur-[100px]" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Recibe nuevos artículos en tu inbox
              </h2>
              <p className="text-xl text-gray-300 mb-10">
                Únete a cientos de profesionales que reciben nuestros insights
                semanales sobre decisiones estratégicas y tecnología.
              </p>

              <div className="flex gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
                <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 px-8">
                  Suscribirse
                </Button>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                Sin spam. Cancela cuando quieras.
              </p>
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
                  <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center bg-[#0A0A0F]">
                    <QuoorumLogo size={48} showGradient={true} />
                  </div>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                  Quoorum
                </span>
              </Link>
              <p className="text-gray-500 text-sm leading-relaxed">
                Sistema de deliberación multi-agente para decisiones estratégicas.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Producto</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/#features"
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                  >
                    Características
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                  >
                    Precios
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Empresa</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/about"
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                  >
                    Sobre Nosotros
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                  >
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                  >
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                  >
                    Términos
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 text-center text-gray-600 text-sm">
            <p>
              &copy; {new Date().getFullYear()} Quoorum. Todos los derechos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
