import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
  Brain,
  Scale,
  Target
} from "lucide-react";

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

export default function ProsAndConsLandingPage() {
  // Schema.org JSON-LD for SEO
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

      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-950">
        {/* Header */}
        <header className="border-b bg-white/50 backdrop-blur-sm dark:bg-gray-950/50">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              <span className="text-xl font-bold">Quoorum</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/frameworks" className="text-sm text-muted-foreground hover:text-foreground">
                Frameworks
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/debates/new">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  Probar gratis
                </Button>
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              <Sparkles className="mr-1 h-3 w-3" />
              Framework Gratis - 4 IAs Expertas
            </Badge>

            <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Análisis{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Pros and Cons
              </span>{" "}
              con IA
            </h1>

            <p className="mb-8 text-xl text-muted-foreground">
              Obtén un análisis balanceado de ventajas y desventajas en minutos.
              <br />
              4 agentes de IA expertos debaten tu decisión desde diferentes perspectivas.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/debates/new?framework=pros-and-cons">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  Analizar mi decisión gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#example">
                <Button size="lg" variant="outline">
                  Ver ejemplo
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-8 border-t pt-8">
              <div>
                <div className="text-3xl font-bold text-purple-600">4</div>
                <div className="text-sm text-muted-foreground">IAs Expertas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">3 min</div>
                <div className="text-sm text-muted-foreground">Promedio</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">100%</div>
                <div className="text-sm text-muted-foreground">Gratis</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-y bg-gray-50 py-16 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold">¿Cómo funciona?</h2>
                <p className="text-lg text-muted-foreground">
                  4 agentes de IA expertos analizan tu decisión desde diferentes ángulos
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Optimizer */}
                <Card>
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <CardTitle className="text-lg">1. Optimizer</CardTitle>
                    </div>
                    <CardDescription>
                      Identifica TODOS los PROS (ventajas, beneficios, oportunidades)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                        <span>Beneficios directos e indirectos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                        <span>Oportunidades que abre</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                        <span>Impacto positivo a largo plazo</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Critic */}
                <Card>
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <CardTitle className="text-lg">2. Critic</CardTitle>
                    </div>
                    <CardDescription>
                      Identifica TODOS los CONS (riesgos, desventajas, obstáculos)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <XCircle className="mt-0.5 h-4 w-4 text-red-600" />
                        <span>Riesgos directos e indirectos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="mt-0.5 h-4 w-4 text-red-600" />
                        <span>Costos (tiempo, dinero, oportunidad)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="mt-0.5 h-4 w-4 text-red-600" />
                        <span>Obstáculos y blockers</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Analyst */}
                <Card>
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle className="text-lg">3. Analyst</CardTitle>
                    </div>
                    <CardDescription>
                      Evalúa factibilidad y contexto
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Target className="mt-0.5 h-4 w-4 text-blue-600" />
                        <span>Recursos necesarios</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Target className="mt-0.5 h-4 w-4 text-blue-600" />
                        <span>Timeline realista</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Target className="mt-0.5 h-4 w-4 text-blue-600" />
                        <span>Factores contextuales relevantes</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Synthesizer */}
                <Card>
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                        <Scale className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <CardTitle className="text-lg">4. Synthesizer</CardTitle>
                    </div>
                    <CardDescription>
                      Crea recomendación balanceada
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Scale className="mt-0.5 h-4 w-4 text-purple-600" />
                        <span>Decision: YES / NO / Conditional</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Scale className="mt-0.5 h-4 w-4 text-purple-600" />
                        <span>Rationale detallado</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Scale className="mt-0.5 h-4 w-4 text-purple-600" />
                        <span>Nivel de confianza</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Example Section */}
        <section id="example" className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold">Ejemplo de Análisis</h2>
                <p className="text-lg text-muted-foreground">
                  "¿Debo lanzar mi SaaS en freemium o solo planes de pago?"
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* PROS */}
                <Card className="border-green-200 dark:border-green-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      PROS (4 identificados)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="mb-1 font-medium">Adquisición viral (peso: 85)</div>
                      <p className="text-sm text-muted-foreground">
                        El modelo freemium genera crecimiento orgánico exponencial. Los usuarios gratis son marketing gratuito.
                      </p>
                    </div>
                    <div>
                      <div className="mb-1 font-medium">Reduce fricción de entrada (peso: 80)</div>
                      <p className="text-sm text-muted-foreground">
                        Sin tarjeta de crédito, más usuarios prueban. La conversión sucede después cuando ya ven valor.
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      + 2 pros más con pesos de 70 y 65
                    </div>
                  </CardContent>
                </Card>

                {/* CONS */}
                <Card className="border-red-200 dark:border-red-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <XCircle className="h-5 w-5" />
                      CONS (3 identificados)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="mb-1 font-medium">Costos de infraestructura (peso: 75)</div>
                      <p className="text-sm text-muted-foreground">
                        Miles de usuarios gratis pueden generar costos significativos de servidor antes de monetizar.
                      </p>
                    </div>
                    <div>
                      <div className="mb-1 font-medium">Usuarios low-quality (peso: 60)</div>
                      <p className="text-sm text-muted-foreground">
                        Freemium atrae usuarios que nunca pagarán. Puede contaminar métricas y feedback.
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      + 1 con más con peso de 55
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendation */}
              <Card className="mt-6 border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <Scale className="h-5 w-5" />
                    Recomendación: CONDITIONAL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm">
                    <strong>Rationale:</strong> El modelo freemium es recomendable SI tienes runway para soportar 6-12 meses sin revenue significativo Y tu producto tiene un hook claro que genera conversión natural. Los PROS (85+80) superan a los CONS (75+60), pero requiere capital inicial suficiente.
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">PROS Weight:</span> 75/100
                    </div>
                    <div>
                      <span className="font-medium">CONS Weight:</span> 63/100
                    </div>
                    <div>
                      <span className="font-medium">Confianza:</span> 82/100
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-y bg-gray-50 py-16 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold">¿Por qué Quoorum Pros and Cons?</h2>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <Users className="mb-2 h-8 w-8 text-purple-600" />
                    <CardTitle className="text-lg">4 Perspectivas</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    No solo pros y cons. Incluye análisis de factibilidad y síntesis balanceada.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Clock className="mb-2 h-8 w-8 text-purple-600" />
                    <CardTitle className="text-lg">3 Minutos</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Análisis completo en minutos. No necesitas reunir a un equipo ni hacer brainstorming.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Brain className="mb-2 h-8 w-8 text-purple-600" />
                    <CardTitle className="text-lg">IA Contextual</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Considera tu rol, industria y etapa de la empresa para análisis personalizado.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Scale className="mb-2 h-8 w-8 text-purple-600" />
                    <CardTitle className="text-lg">Pesos Cuantificados</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Cada pro y con tiene un peso (0-100) para priorizar lo que más importa.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Target className="mb-2 h-8 w-8 text-purple-600" />
                    <CardTitle className="text-lg">Decisión Clara</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    YES / NO / CONDITIONAL con rationale detallado. No más "depende".
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Sparkles className="mb-2 h-8 w-8 text-purple-600" />
                    <CardTitle className="text-lg">100% Gratis</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Sin límites. Sin tarjeta de crédito. Análisis ilimitados de pros and cons.
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              ¿Tienes una decisión que tomar?
            </h2>
            <p className="mb-8 text-lg opacity-90">
              Obtén un análisis balanceado de pros y cons en 3 minutos
            </p>
            <Link href="/debates/new?framework=pros-and-cons">
              <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                Analizar mi decisión gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">Quoorum</span>
              </div>
              <nav className="flex gap-6 text-sm text-muted-foreground">
                <Link href="/frameworks" className="hover:text-foreground">
                  Frameworks
                </Link>
                <Link href="/frameworks/swot-analysis" className="hover:text-foreground">
                  SWOT Analysis
                </Link>
                <Link href="/frameworks/eisenhower-matrix" className="hover:text-foreground">
                  Eisenhower Matrix
                </Link>
              </nav>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
