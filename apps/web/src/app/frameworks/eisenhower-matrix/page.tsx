import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Sparkles,
  ArrowRight,
  Brain,
  Grid2x2,
  Target,
  Users,
  TrendingUp,
} from "lucide-react";

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

export default function EisenhowerMatrixLandingPage() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Quoorum Eisenhower Matrix",
    applicationCategory: "ProductivityApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency": "EUR",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-950">
        {/* Header */}
        <header className="border-b bg-white/50 backdrop-blur-sm dark:bg-gray-950/50">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-green-600" />
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
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  Probar gratis
                </Button>
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              <Sparkles className="mr-1 h-3 w-3" />
              Matriz de Eisenhower Gratis - IA Experta
            </Badge>

            <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Matriz de{" "}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Eisenhower
              </span>
              {" "}con IA
            </h1>

            <p className="mb-8 text-xl text-muted-foreground">
              Prioriza tareas según urgencia e importancia en 2 minutos.
              <br />
              IA clasifica automáticamente en 4 cuadrantes y optimiza tu time management.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/debates/new?framework=eisenhower-matrix">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  Priorizar mis tareas gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#matrix">
                <Button size="lg" variant="outline">
                  Ver matriz
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-8 border-t pt-8">
              <div>
                <div className="text-3xl font-bold text-green-600">4</div>
                <div className="text-sm text-muted-foreground">Cuadrantes</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">2 min</div>
                <div className="text-sm text-muted-foreground">Promedio</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">100%</div>
                <div className="text-sm text-muted-foreground">Gratis</div>
              </div>
            </div>
          </div>
        </section>

        {/* Matrix Explanation */}
        <section id="matrix" className="border-y bg-gray-50 py-16 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold">Los 4 Cuadrantes</h2>
                <p className="text-lg text-muted-foreground">
                  Clasifica tareas según dos dimensiones: Urgente vs Importante
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Q1 */}
                <Card className="border-red-200 dark:border-red-900">
                  <CardHeader>
                    <div className="mb-2 flex items-center justify-between">
                      <Badge className="bg-red-100 text-red-700">Q1</Badge>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Urgente
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Importante
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-lg text-red-600">DO FIRST (Crisis)</CardTitle>
                    <CardDescription>Emergencias que requieren acción inmediata</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                        <span>Crisis y emergencias</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                        <span>Deadlines inminentes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                        <span>Problemas críticos</span>
                      </li>
                    </ul>
                    <div className="mt-4 rounded-lg bg-red-50 p-3 dark:bg-red-950">
                      <p className="text-xs text-red-700 dark:text-red-400">
                        <strong>Objetivo:</strong> Minimizar tiempo aquí. Si vives en Q1, estás en "modo crisis".
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Q2 */}
                <Card className="border-green-200 dark:border-green-900">
                  <CardHeader>
                    <div className="mb-2 flex items-center justify-between">
                      <Badge className="bg-green-100 text-green-700">Q2</Badge>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> No Urgente
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Importante
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-lg text-green-600">SCHEDULE (Crecimiento)</CardTitle>
                    <CardDescription>El cuadrante más valioso - prevención y desarrollo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                        <span>Planificación estratégica</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                        <span>Prevención y mantenimiento</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                        <span>Desarrollo personal</span>
                      </li>
                    </ul>
                    <div className="mt-4 rounded-lg bg-green-50 p-3 dark:bg-green-950">
                      <p className="text-xs text-green-700 dark:text-green-400">
                        <strong>Objetivo:</strong> ¡Maximizar tiempo aquí! 50-60% de tu semana debería estar en Q2.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Q3 */}
                <Card className="border-orange-200 dark:border-orange-900">
                  <CardHeader>
                    <div className="mb-2 flex items-center justify-between">
                      <Badge className="bg-orange-100 text-orange-700">Q3</Badge>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Urgente
                        </span>
                        <span className="flex items-center gap-1">
                          <X className="h-3 w-3" /> No Importante
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-lg text-orange-600">DELEGATE (Interrupciones)</CardTitle>
                    <CardDescription>Urgente para otros, no importante para ti</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
                        <span>Interrupciones</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
                        <span>Algunas llamadas/emails</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
                        <span>Reuniones improductivas</span>
                      </li>
                    </ul>
                    <div className="mt-4 rounded-lg bg-orange-50 p-3 dark:bg-orange-950">
                      <p className="text-xs text-orange-700 dark:text-orange-400">
                        <strong>Objetivo:</strong> Delegar o rechazar. No confundir urgencia con importancia.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Q4 */}
                <Card className="border-gray-200 dark:border-gray-800">
                  <CardHeader>
                    <div className="mb-2 flex items-center justify-between">
                      <Badge className="bg-gray-100 text-gray-700">Q4</Badge>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> No Urgente
                        </span>
                        <span className="flex items-center gap-1">
                          <X className="h-3 w-3" /> No Importante
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-lg text-gray-600">ELIMINATE (Time Wasters)</CardTitle>
                    <CardDescription>Actividades que no aportan valor</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600" />
                        <span>Time wasters</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600" />
                        <span>Redes sociales sin propósito</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600" />
                        <span>Busy work</span>
                      </li>
                    </ul>
                    <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-950">
                      <p className="text-xs text-gray-700 dark:text-gray-400">
                        <strong>Objetivo:</strong> Eliminar completamente. Si estás aquí, estás perdiendo el tiempo.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold">¿Por qué usar IA para priorizar?</h2>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <Brain className="mb-2 h-8 w-8 text-green-600" />
                    <CardTitle className="text-lg">Clasificación Objetiva</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    IA clasifica sin sesgos emocionales. Urgencia ≠ Importancia.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Target className="mb-2 h-8 w-8 text-green-600" />
                    <CardTitle className="text-lg">Time Allocation</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Te dice qué % de tiempo dedicar a cada cuadrante.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Grid2x2 className="mb-2 h-8 w-8 text-green-600" />
                    <CardTitle className="text-lg">Matriz Visual</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Ve dónde pasas tu tiempo y dónde DEBERÍAS pasarlo.
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="bg-gradient-to-r from-green-600 to-emerald-600 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              ¿Listo para optimizar tu tiempo?
            </h2>
            <p className="mb-8 text-lg opacity-90">
              Clasifica tus tareas con IA en 2 minutos
            </p>
            <Link href="/debates/new?framework=eisenhower-matrix">
              <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                Crear Matriz de Eisenhower gratis
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
                <Brain className="h-5 w-5 text-green-600" />
                <span className="font-semibold">Quoorum</span>
              </div>
              <nav className="flex gap-6 text-sm text-muted-foreground">
                <Link href="/frameworks" className="hover:text-foreground">
                  Frameworks
                </Link>
                <Link href="/frameworks/pros-and-cons" className="hover:text-foreground">
                  Pros and Cons
                </Link>
                <Link href="/frameworks/swot-analysis" className="hover:text-foreground">
                  SWOT Analysis
                </Link>
              </nav>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
