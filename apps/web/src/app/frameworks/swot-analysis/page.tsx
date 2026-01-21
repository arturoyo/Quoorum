import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Brain,
  Grid3x3,
  Users,
  Clock,
} from "lucide-react";

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

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
        {/* Header */}
        <header className="border-b bg-white/50 backdrop-blur-sm dark:bg-gray-950/50">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-blue-600" />
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
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Probar gratis
                </Button>
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              <Sparkles className="mr-1 h-3 w-3" />
              SWOT Analysis Gratis - 4 IAs Expertas
            </Badge>

            <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Análisis{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                SWOT
              </span>{" "}
              con IA
            </h1>

            <p className="mb-8 text-xl text-muted-foreground">
              Genera un análisis SWOT profesional en 4 minutos.
              <br />
              4 agentes de IA expertos analizan Fortalezas, Debilidades, Oportunidades y Amenazas.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/debates/new?framework=swot-analysis">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Crear mi análisis SWOT gratis
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
                <div className="text-3xl font-bold text-blue-600">4</div>
                <div className="text-sm text-muted-foreground">Dimensiones SWOT</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">4 min</div>
                <div className="text-sm text-muted-foreground">Promedio</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">100%</div>
                <div className="text-sm text-muted-foreground">Gratis</div>
              </div>
            </div>
          </div>
        </section>

        {/* SWOT Matrix Explanation */}
        <section className="border-y bg-gray-50 py-16 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold">¿Qué es el análisis SWOT?</h2>
                <p className="text-lg text-muted-foreground">
                  Un framework estratégico que analiza factores internos y externos de tu negocio
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Strengths */}
                <Card className="border-green-200 dark:border-green-900">
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Strengths (Fortalezas)</CardTitle>
                        <CardDescription className="text-xs">Factores internos positivos</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                        <span>Ventajas competitivas únicas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                        <span>Recursos y capacidades destacadas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                        <span>Assets valiosos (equipo, tech, marca)</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Weaknesses */}
                <Card className="border-red-200 dark:border-red-900">
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Weaknesses (Debilidades)</CardTitle>
                        <CardDescription className="text-xs">Factores internos negativos</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                        <span>Recursos limitados o faltantes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                        <span>Capacidades insuficientes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                        <span>Gaps de conocimiento o experiencia</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Opportunities */}
                <Card className="border-cyan-200 dark:border-cyan-900">
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900">
                        <TrendingUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Opportunities (Oportunidades)</CardTitle>
                        <CardDescription className="text-xs">Factores externos positivos</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-600" />
                        <span>Tendencias de mercado favorables</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-600" />
                        <span>Nuevos segmentos o nichos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-600" />
                        <span>Partnerships potenciales</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Threats */}
                <Card className="border-orange-200 dark:border-orange-900">
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Threats (Amenazas)</CardTitle>
                        <CardDescription className="text-xs">Factores externos negativos</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
                        <span>Competencia creciente</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
                        <span>Disrupciones tecnológicas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
                        <span>Riesgos macroeconómicos</span>
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
                <h2 className="mb-4 text-3xl font-bold">Ejemplo de Análisis SWOT</h2>
                <p className="text-lg text-muted-foreground">
                  "Análisis SWOT de nuestra estrategia de expansion a Latinoamérica"
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Strengths Example */}
                <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      STRENGTHS (3)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium text-sm">Producto localizado</span>
                        <Badge variant="outline" className="text-xs">Impact: 90</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ya tenemos versión en español con pagos locales integrados
                      </p>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium text-sm">Equipo multicultural</span>
                        <Badge variant="outline" className="text-xs">Impact: 85</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        3 miembros del equipo de México, Argentina y Colombia
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Weaknesses Example */}
                <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <XCircle className="h-5 w-5" />
                      WEAKNESSES (2)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium text-sm">Sin presencia física</span>
                        <Badge variant="outline" className="text-xs">Severity: 70</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        No tenemos oficina ni equipo on-the-ground en LATAM
                      </p>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium text-sm">Budget limitado</span>
                        <Badge variant="outline" className="text-xs">Severity: 65</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Solo $50k para GTM de toda la región
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Opportunities Example */}
                <Card className="border-cyan-200 bg-cyan-50 dark:border-cyan-900 dark:bg-cyan-950">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
                      <TrendingUp className="h-5 w-5" />
                      OPPORTUNITIES (3)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium text-sm">Mercado desatendido</span>
                        <Badge variant="outline" className="text-xs">Potential: 95</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Pocos competidores con producto localizado en español
                      </p>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium text-sm">Crecimiento SaaS LATAM</span>
                        <Badge variant="outline" className="text-xs">Potential: 85</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Mercado SaaS en LATAM creciendo 25% anual
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Threats Example */}
                <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                      <AlertTriangle className="h-5 w-5" />
                      THREATS (2)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium text-sm">Players locales agresivos</span>
                        <Badge variant="outline" className="text-xs">Risk: 75</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Startups locales con mejor network y pricing más bajo
                      </p>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium text-sm">Volatilidad económica</span>
                        <Badge variant="outline" className="text-xs">Risk: 70</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Inflación y tipo de cambio volátil afecta pricing
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Strategies */}
              <Card className="mt-6 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <Grid3x3 className="h-5 w-5" />
                    Estrategias Recomendadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <div className="mb-2 flex items-center gap-2 font-medium">
                      <Shield className="h-4 w-4 text-green-600" />
                      SO (Strengths + Opportunities)
                    </div>
                    <p className="text-xs text-muted-foreground">
                      1. Lanzar GTM digital-first aprovechando producto localizado
                      <br />
                      2. Posicionar como alternativa "hecha para LATAM" vs gringos
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2 font-medium">
                      <Target className="h-4 w-4 text-red-600" />
                      WO (Weaknesses + Opportunities)
                    </div>
                    <p className="text-xs text-muted-foreground">
                      1. Contratar 1-2 SDRs locales remote antes de abrir oficina
                      <br />
                      2. Partner con aceleradora local para network sin CAPEX
                    </p>
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
                <h2 className="mb-4 text-3xl font-bold">¿Por qué Quoorum SWOT Analysis?</h2>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <Users className="mb-2 h-8 w-8 text-blue-600" />
                    <CardTitle className="text-lg">4 Agentes Expertos</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Cada dimensión analizada por un agente especializado en ese área.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Clock className="mb-2 h-8 w-8 text-blue-600" />
                    <CardTitle className="text-lg">4 Minutos</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    SWOT completo en minutos. No necesitas reunir a un equipo.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Brain className="mb-2 h-8 w-8 text-blue-600" />
                    <CardTitle className="text-lg">IA Contextual</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Considera tu industria, etapa y rol para análisis personalizado.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Grid3x3 className="mb-2 h-8 w-8 text-blue-600" />
                    <CardTitle className="text-lg">Matriz 2x2</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Visual clásico: Interno vs Externo, Positivo vs Negativo.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Target className="mb-2 h-8 w-8 text-blue-600" />
                    <CardTitle className="text-lg">Estrategias SO/WO/ST/WT</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    No solo lista. Te da 4 tipos de estrategias accionables.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Sparkles className="mb-2 h-8 w-8 text-blue-600" />
                    <CardTitle className="text-lg">100% Gratis</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Sin límites. Sin tarjeta. Análisis SWOT ilimitados.
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="bg-gradient-to-r from-blue-600 to-cyan-600 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              ¿Listo para tu análisis SWOT?
            </h2>
            <p className="mb-8 text-lg opacity-90">
              Genera un SWOT profesional con IA en 4 minutos
            </p>
            <Link href="/debates/new?framework=swot-analysis">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                Crear SWOT Analysis gratis
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
                <Brain className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Quoorum</span>
              </div>
              <nav className="flex gap-6 text-sm text-muted-foreground">
                <Link href="/frameworks" className="hover:text-foreground">
                  Frameworks
                </Link>
                <Link href="/frameworks/pros-and-cons" className="hover:text-foreground">
                  Pros and Cons
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
