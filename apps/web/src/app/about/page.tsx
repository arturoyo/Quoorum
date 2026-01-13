import Link from "next/link";
import {
  MessageCircle,
  Users,
  Target,
  Zap,
  Heart,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-xl bg-[#0A0A0F]/80">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
              Quoorum
            </span>
          </Link>

          <nav className="flex items-center gap-8">
            <Link
              href="/"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Inicio
            </Link>
            <Link
              href="/pricing"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Precios
            </Link>
            <Link
              href="/blog"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Blog
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                className="border-white/10 hover:bg-white/5 text-white"
              >
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0">
                Comenzar Gratis
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-40 pb-32 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-8">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Sobre Nosotros</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
              Construyendo el futuro de la{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                toma de decisiones
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
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
            <div className="absolute inset-0 border border-white/10 rounded-[3rem]" />

            <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/30 rounded-full blur-[100px]" />

            <div className="relative z-10 text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Nuestra Misión
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
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
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Nuestros Valores
            </h2>
            <p className="text-xl text-gray-400">
              Los principios que guían cada decisión que tomamos
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform"
              >
                <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
                <div className="absolute inset-0 border border-white/10 rounded-3xl" />

                <div className="relative z-10">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${value.gradient} flex items-center justify-center mb-6`}
                  >
                    <value.icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Nuestro Viaje
            </h2>
            <p className="text-xl text-gray-400">
              De la idea a la realidad
            </p>
          </div>

          <div className="space-y-12">
            {timeline.map((item, index) => (
              <div key={index} className="relative pl-12 border-l-2 border-white/10">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500" />

                <div className="text-sm font-mono text-purple-400 mb-2">
                  {item.year}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
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
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              El Equipo
            </h2>
            <p className="text-xl text-gray-400">
              Construido por personas que aman resolver problemas difíciles
            </p>
          </div>

          <div className="relative p-12 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-white/10 rounded-3xl" />

            <div className="relative z-10 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                {team[0]?.name}
              </h3>
              <p className="text-lg text-purple-400 mb-6">{team[0]?.role}</p>
              <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
                {team[0]?.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-4">
        <div className="container mx-auto">
          <div className="relative max-w-4xl mx-auto text-center p-16 rounded-[3rem] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-cyan-600/20 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-white/10 rounded-[3rem]" />

            <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/30 rounded-full blur-[100px]" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                Únete a la revolución de las decisiones
              </h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                Empieza a tomar mejores decisiones hoy. 5 debates gratis, sin
                tarjeta de crédito.
              </p>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="relative group overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 px-12 h-16 text-xl"
                >
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
