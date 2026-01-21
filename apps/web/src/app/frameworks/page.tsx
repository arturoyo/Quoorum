import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  XCircle,
  Scale,
  Grid3x3,
  Clock,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Decision-Making Frameworks | AI-Powered Analysis | Quoorum",
  description:
    "Toma mejores decisiones con frameworks probados y análisis de IA experta. Pros/Cons, SWOT Analysis, Eisenhower Matrix - 100% gratis.",
  keywords: [
    "decision making frameworks",
    "frameworks de decisión",
    "pros and cons",
    "swot analysis",
    "eisenhower matrix",
    "análisis de decisiones",
    "IA para decisiones",
  ],
  openGraph: {
    title: "Decision-Making Frameworks | AI-Powered Analysis | Quoorum",
    description:
      "Toma mejores decisiones con frameworks probados y análisis de IA experta. 100% gratis.",
    type: "website",
  },
};

const frameworks = [
  {
    slug: "pros-and-cons",
    name: "Pros and Cons",
    description:
      "Analiza las ventajas y desventajas de tu decisión con debates multi-agente IA. Simple, claro, efectivo.",
    icon: Scale,
    color: "purple",
    bgColor: "bg-purple-100 dark:bg-purple-900",
    textColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-800",
    features: [
      "4 agentes de IA expertos",
      "Análisis balanceado",
      "Pesos cuantificados (0-100)",
      "Recomendación clara (YES/NO/Conditional)",
    ],
    useCases: [
      "Lanzar nuevo producto",
      "Contratar equipo",
      "Cambiar de estrategia",
      "Inversiones y deals",
    ],
    time: "3 min",
    status: "active" as const,
  },
  {
    slug: "swot-analysis",
    name: "SWOT Analysis",
    description:
      "Análisis SWOT (Fortalezas, Debilidades, Oportunidades, Amenazas) con 4 agentes expertos. Ideal para estrategia de negocio.",
    icon: Grid3x3,
    color: "blue",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
    features: [
      "4 perspectivas (S.W.O.T)",
      "Análisis interno y externo",
      "Matriz visual 2x2",
      "Estrategias accionables",
    ],
    useCases: [
      "Planificación estratégica",
      "Análisis competitivo",
      "Evaluación de mercado",
      "Pivot de producto",
    ],
    time: "4 min",
    status: "coming-soon" as const,
  },
  {
    slug: "eisenhower-matrix",
    name: "Eisenhower Matrix",
    description:
      "Prioriza tareas según urgencia e importancia. Matriz 2x2 para decisiones de productividad y time management.",
    icon: CheckCircle2,
    color: "green",
    bgColor: "bg-green-100 dark:bg-green-900",
    textColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800",
    features: [
      "Clasificación automática",
      "Matriz 2x2 (Urgent/Important)",
      "Recomendaciones de acción",
      "Gestión de prioridades",
    ],
    useCases: [
      "Gestión de tareas",
      "Planificación semanal",
      "Delegación de trabajo",
      "Eliminar distracciones",
    ],
    time: "2 min",
    status: "coming-soon" as const,
  },
];

export default function FrameworksOverviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm dark:bg-gray-950/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <span className="text-xl font-bold">Quoorum</span>
          </Link>
          <nav className="flex items-center gap-4">
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
            3 Frameworks - 100% Gratis
          </Badge>

          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Decision-Making{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Frameworks
            </span>
          </h1>

          <p className="mb-8 text-xl text-muted-foreground">
            Toma mejores decisiones con frameworks probados y análisis de IA experta.
            <br />
            Elige el framework adecuado para tu tipo de decisión.
          </p>

          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>2-4 minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>4 IAs expertas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Análisis ilimitados</span>
            </div>
          </div>
        </div>
      </section>

      {/* Frameworks Grid */}
      <section className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {frameworks.map((framework) => {
              const Icon = framework.icon;
              const isActive = framework.status === "active";

              return (
                <Card
                  key={framework.slug}
                  className={`relative flex flex-col transition-all hover:shadow-lg ${
                    framework.borderColor
                  } ${!isActive && "opacity-75"}`}
                >
                  {framework.status === "coming-soon" && (
                    <div className="absolute right-4 top-4">
                      <Badge variant="outline" className="text-xs">
                        Próximamente
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${framework.bgColor}`}>
                      <Icon className={`h-6 w-6 ${framework.textColor}`} />
                    </div>
                    <CardTitle className="text-2xl">{framework.name}</CardTitle>
                    <CardDescription className="text-base">
                      {framework.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-6">
                    {/* Features */}
                    <div>
                      <div className="mb-2 text-sm font-medium">Características:</div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {framework.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className={`mt-0.5 h-4 w-4 flex-shrink-0 ${framework.textColor}`} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Use Cases */}
                    <div>
                      <div className="mb-2 text-sm font-medium">Casos de uso:</div>
                      <div className="flex flex-wrap gap-2">
                        {framework.useCases.map((useCase, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs font-normal"
                          >
                            {useCase}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Tiempo promedio: {framework.time}</span>
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-2">
                    {isActive ? (
                      <>
                        <Link href={`/frameworks/${framework.slug}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            Más info
                          </Button>
                        </Link>
                        <Link href={`/debates/new?framework=${framework.slug}`} className="flex-1">
                          <Button className={`w-full ${framework.bgColor} ${framework.textColor} hover:opacity-90`}>
                            Usar ahora
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <Button variant="outline" className="w-full" disabled>
                        Próximamente
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="border-y bg-gray-50 py-16 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 text-center text-3xl font-bold">
              ¿Qué framework usar?
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left font-semibold">Situación</th>
                    <th className="p-4 text-left font-semibold">Framework Recomendado</th>
                    <th className="p-4 text-left font-semibold">Por qué</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-4">Decisión binaria (hacer/no hacer)</td>
                    <td className="p-4">
                      <Badge className="bg-purple-100 text-purple-700">
                        Pros and Cons
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      Analiza ventajas vs desventajas y da recomendación clara
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4">Planificación estratégica de negocio</td>
                    <td className="p-4">
                      <Badge className="bg-blue-100 text-blue-700">
                        SWOT Analysis
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      Considera factores internos y externos del negocio
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4">Gestión de tareas y prioridades</td>
                    <td className="p-4">
                      <Badge className="bg-green-100 text-green-700">
                        Eisenhower Matrix
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      Clasifica por urgencia e importancia
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4">Evaluación de inversión o deal</td>
                    <td className="p-4">
                      <Badge className="bg-purple-100 text-purple-700">
                        Pros and Cons
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      Pesos cuantificados para comparar opciones
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4">Análisis de mercado o competencia</td>
                    <td className="p-4">
                      <Badge className="bg-blue-100 text-blue-700">
                        SWOT Analysis
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      Identifica oportunidades y amenazas externas
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            ¿Listo para tomar mejores decisiones?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Elige un framework y obtén análisis de IA experta en minutos
          </p>
          <Link href="/debates/new">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              Empezar análisis gratis
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
              <Link href="/frameworks/pros-and-cons" className="hover:text-foreground">
                Pros and Cons
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
  );
}
