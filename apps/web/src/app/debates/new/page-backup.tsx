"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  MessageCircle,
  ArrowLeft,
  Loader2,
  Users,
  Zap,
  Info,
  Lightbulb,
  ArrowRight,
  Target,
} from "lucide-react";
import { ContextReadiness } from "@/components/forum/context-readiness";
import type { ContextAssessment, ContextAnswers } from "@/lib/context-assessment/types";

const EXAMPLE_QUESTIONS = [
  "¿Cuál es la mejor estrategia para entrar en un nuevo mercado?",
  "¿Deberíamos pivotar hacia un modelo B2B o mantenernos en B2C?",
  "¿Es el momento adecuado para levantar una ronda de financiación?",
  "¿Cómo debemos responder a esta amenaza competitiva?",
  "¿Cuál es el precio óptimo para nuestro nuevo producto?",
];

const CATEGORIES = [
  { value: "strategy", label: "Estrategia de Negocio" },
  { value: "product", label: "Producto" },
  { value: "finance", label: "Finanzas / Inversión" },
  { value: "marketing", label: "Marketing / Ventas" },
  { value: "operations", label: "Operaciones" },
  { value: "hr", label: "Recursos Humanos" },
  { value: "other", label: "Otro" },
];

type Phase = "input" | "assessment" | "config" | "creating";

export default function NewDebatePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("input");
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    question: "",
    context: "",
    category: "",
    expertCount: 6,
    maxRounds: 5,
  });

  const [assessment, setAssessment] = useState<ContextAssessment | null>(null);
  const [answers, setAnswers] = useState<ContextAnswers>({
    assumptionResponses: {},
    questionResponses: {},
    additionalContext: "",
  });

  const supabase = createClient();

  // tRPC mutations
  const analyzeMutation = api.contextAssessment.analyze.useMutation({
    onSuccess: (data) => {
      setAssessment(data);
      setPhase("assessment");
    },
    onError: (error) => {
      toast.error(`Error analizando contexto: ${error.message}`);
    },
  });

  const refineMutation = api.contextAssessment.refine.useMutation({
    onSuccess: (data) => {
      setAssessment(data);
      toast.success("Contexto actualizado");
    },
    onError: (error) => {
      toast.error(`Error refinando contexto: ${error.message}`);
    },
  });

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
      }
    }

    checkUser();
  }, [router, supabase.auth]);

  const handleAnalyzeContext = () => {
    if (!formData.question.trim()) {
      toast.error("Por favor, escribe tu pregunta");
      return;
    }

    if (formData.question.length < 20) {
      toast.error("La pregunta debe tener al menos 20 caracteres");
      return;
    }

    const fullInput = formData.context
      ? `${formData.question}\n\nContexto adicional:\n${formData.context}`
      : formData.question;

    const debateType = formData.category === "strategy"
      ? "strategy"
      : formData.category === "product"
      ? "product"
      : formData.category
      ? "business_decision"
      : undefined;

    analyzeMutation.mutate({
      userInput: fullInput,
      debateType,
    });
  };

  const handleAnswersChange = useCallback((newAnswers: ContextAnswers) => {
    setAnswers(newAnswers);
  }, []);

  const handleRefine = () => {
    if (!assessment) return;

    const fullInput = formData.context
      ? `${formData.question}\n\nContexto adicional:\n${formData.context}`
      : formData.question;

    refineMutation.mutate({
      originalInput: fullInput,
      answers,
      previousAssessment: assessment,
    });
  };

  const handleProceedToConfig = () => {
    setPhase("config");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhase("creating");
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call to create debate
      // For now, simulate creation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("¡Debate creado! Los expertos están deliberando...");
      router.push("/debates/demo-debate-id");
    } catch {
      toast.error("Error al crear el debate");
      setPhase("config");
    } finally {
      setIsLoading(false);
    }
  };

  const useExample = (example: string) => {
    setFormData({ ...formData, question: example });
  };

  const isAnalyzing = analyzeMutation.isPending || refineMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </div>

            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Forum</span>
            </Link>

            <div className="w-32" />
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-8">
            <StepIndicator
              step={1}
              label="Pregunta"
              active={phase === "input"}
              completed={phase !== "input"}
            />
            <div className="h-px w-12 bg-gray-700" />
            <StepIndicator
              step={2}
              label="Contexto"
              active={phase === "assessment"}
              completed={phase === "config" || phase === "creating"}
            />
            <div className="h-px w-12 bg-gray-700" />
            <StepIndicator
              step={3}
              label="Configurar"
              active={phase === "config"}
              completed={phase === "creating"}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-8">
        <div className="max-w-3xl mx-auto">
          {phase === "input" && (
            <>
              <h1 className="text-3xl font-bold text-white mb-2">Nuevo Debate</h1>
              <p className="text-gray-400 mb-8">
                Plantea tu pregunta estratégica y deja que nuestros expertos IA deliberen.
              </p>

              <Card className="bg-white/5 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Tu Pregunta</CardTitle>
                  <CardDescription>
                    Describe la decisión que necesitas tomar con todo el contexto relevante
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="question" className="text-gray-300">
                      Pregunta principal *
                    </Label>
                    <Textarea
                      id="question"
                      placeholder="Ej: ¿Cuál es la mejor estrategia para entrar en el mercado europeo con nuestro producto SaaS B2B?"
                      value={formData.question}
                      onChange={(e) =>
                        setFormData({ ...formData, question: e.target.value })
                      }
                      className="min-h-[100px] bg-white/5 border-white/10 text-white"
                    />
                    <p className="text-xs text-gray-500">
                      {formData.question.length} / 500 caracteres
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="context" className="text-gray-300">
                      Contexto adicional (opcional)
                    </Label>
                    <Textarea
                      id="context"
                      placeholder="Información adicional: datos del mercado, situación actual, restricciones, objetivos..."
                      value={formData.context}
                      onChange={(e) =>
                        setFormData({ ...formData, context: e.target.value })
                      }
                      className="min-h-[80px] bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-gray-300">
                      Categoría
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 mb-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    ¿Necesitas inspiración?
                  </CardTitle>
                  <CardDescription>
                    Prueba con alguna de estas preguntas de ejemplo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_QUESTIONS.map((example) => (
                      <Button
                        key={example}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => useExample(example)}
                        className="border-white/10 text-gray-300 hover:bg-white/10 text-left h-auto py-2"
                      >
                        {example.slice(0, 40)}...
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleAnalyzeContext}
                  disabled={isAnalyzing || formData.question.length < 20}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analizando contexto...
                    </>
                  ) : (
                    <>
                      <Target className="mr-2 h-4 w-4" />
                      Analizar y continuar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {phase === "assessment" && assessment && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPhase("input")}
                  className="text-gray-400 hover:text-white -ml-2"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Editar pregunta
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Preparación del Contexto
              </h1>
              <p className="text-gray-400 mb-8">
                Mejora la calidad del debate completando la información clave
              </p>

              <ContextReadiness
                assessment={assessment}
                onAnswersChange={handleAnswersChange}
                onRefine={handleRefine}
                onProceed={handleProceedToConfig}
                isAnalyzing={isAnalyzing}
              />
            </>
          )}

          {phase === "config" && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPhase("assessment")}
                  className="text-gray-400 hover:text-white -ml-2"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Volver al contexto
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Configurar Debate
              </h1>
              <p className="text-gray-400 mb-8">
                Ajusta los parámetros del debate según tus necesidades
              </p>

              <form onSubmit={handleSubmit}>
                <Card className="bg-white/5 border-white/10 mb-6">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Configuración del Debate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">
                          Número de expertos: {formData.expertCount}
                        </Label>
                        <span className="text-sm text-gray-500">
                          Más expertos = más perspectivas
                        </span>
                      </div>
                      <Slider
                        value={[formData.expertCount]}
                        onValueChange={([value]) =>
                          setFormData({ ...formData, expertCount: value ?? formData.expertCount })
                        }
                        min={4}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">
                          Rondas máximas: {formData.maxRounds}
                        </Label>
                        <span className="text-sm text-gray-500">
                          Más rondas = más profundidad
                        </span>
                      </div>
                      <Slider
                        value={[formData.maxRounds]}
                        onValueChange={([value]) =>
                          setFormData({ ...formData, maxRounds: value ?? formData.maxRounds })
                        }
                        min={3}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-blue-300 font-medium">¿Cómo funciona?</p>
                          <p className="text-blue-200/70 text-sm mt-1">
                            Los expertos deliberarán en rondas hasta alcanzar consenso o
                            el máximo de rondas. Puedes ver el debate en tiempo real.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Context Summary */}
                    {assessment && (
                      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <div className="flex items-start gap-3">
                          <Target className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-purple-300 font-medium">
                              Contexto preparado: {assessment.overallScore}%
                            </p>
                            <p className="text-purple-200/70 text-sm mt-1">
                              {assessment.summary}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Este debate usará 1 de tus debates mensuales
                  </p>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando debate...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Iniciar Debate
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}

          {phase === "creating" && (
            <div className="text-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Iniciando debate...
              </h2>
              <p className="text-gray-400">
                Los expertos están preparando sus posiciones iniciales
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Step Indicator Component
function StepIndicator({
  step,
  label,
  active,
  completed,
}: {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
          ${completed ? "bg-purple-600 text-white" : ""}
          ${active ? "bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900" : ""}
          ${!active && !completed ? "bg-gray-700 text-gray-400" : ""}
        `}
      >
        {completed ? "✓" : step}
      </div>
      <span
        className={`text-sm ${active || completed ? "text-white" : "text-gray-500"}`}
      >
        {label}
      </span>
    </div>
  );
}
