"use client";

import { useState, useEffect } from "react";
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
  Sparkles,
  Users,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

// Type definitions based on context-assessment router output schema
interface ContextDimension {
  id: string;
  name: string;
  description: string;
  weight: number;
  score: number;
  status: "missing" | "partial" | "complete";
  suggestions: string[];
}

interface ContextAssumption {
  id: string;
  dimension: string;
  assumption: string;
  confidence: number;
  confirmed: boolean | null;
  alternatives?: string[];
}

interface ClarifyingQuestion {
  id: string;
  question: string;
  dimension: string;
  priority: "critical" | "important" | "nice-to-have";
  multipleChoice?: {
    options: string[];
    allowMultiple: boolean;
  };
  freeText?: boolean;
  dependsOn?: string;
}

interface ContextAssessment {
  overallScore: number;
  readinessLevel: "insufficient" | "basic" | "good" | "excellent";
  dimensions: ContextDimension[];
  assumptions: ContextAssumption[];
  clarifyingQuestions: ClarifyingQuestion[];
  summary: string;
  recommendedAction: "proceed" | "clarify" | "refine";
}

interface ContextAnswers {
  assumptionResponses: Record<string, boolean>;
  questionResponses: Record<string, string>;
  additionalContext: string;
}

const categories = [
  { value: "business", label: "Negocios" },
  { value: "tech", label: "Tecnología" },
  { value: "finance", label: "Finanzas" },
  { value: "legal", label: "Legal" },
  { value: "ethics", label: "Ética" },
  { value: "strategy", label: "Estrategia" },
  { value: "product", label: "Producto" },
  { value: "marketing", label: "Marketing" },
  { value: "hr", label: "Recursos Humanos" },
  { value: "other", label: "Otro" },
];

type Phase = "input" | "assessment" | "config" | "creating";

export function DebateForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("input");
  const [_isLoading, setIsLoading] = useState(false);

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

  const createDebateMutation = api.debates.create.useMutation({
    onSuccess: (data) => {
      toast.success("¡Debate creado! Los expertos están deliberando...");
      router.push(`/debates/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Error creando debate: ${error.message}`);
      setIsLoading(false);
    },
  });

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      }
    }
    checkAuth();
  }, [router, supabase.auth]);

  const handleAnalyze = async () => {
    if (!formData.question.trim()) {
      toast.error("Por favor ingresa una pregunta");
      return;
    }

    // Combine question and context into userInput
    const userInput = formData.context
      ? `${formData.question}\n\nContexto:\n${formData.context}`
      : formData.question;

    // Map category to debateType
    const debateTypeMap: Record<string, "business_decision" | "strategy" | "product" | "general"> = {
      business: "business_decision",
      strategy: "strategy",
      product: "product",
    };
    const debateType = debateTypeMap[formData.category] || "general";

    analyzeMutation.mutate({
      userInput,
      debateType,
    });
  };

  const handleRefine = async () => {
    if (!assessment) return;

    // Combine question and context into originalInput
    const originalInput = formData.context
      ? `${formData.question}\n\nContexto:\n${formData.context}`
      : formData.question;

    refineMutation.mutate({
      originalInput,
      answers,
      previousAssessment: assessment,
    });
  };

  const handleProceedToConfig = () => {
    setPhase("config");
  };

  const handleCreateDebate = async () => {
    setIsLoading(true);
    setPhase("creating");

    const enrichedContext = assessment
      ? `${formData.context}\n\nAsunciones validadas:\n${Object.entries(answers.assumptionResponses)
          .map(([id, accepted]) => {
            const assumption = assessment.assumptions.find((a) => a.id === id);
            return `- ${assumption?.assumption}: ${accepted ? "Sí" : "No"}`;
          })
          .join("\n")}\n\nRespuestas adicionales:\n${Object.entries(answers.questionResponses)
          .map(([id, answer]) => {
            const question = assessment.clarifyingQuestions.find((q) => q.id === id);
            return `- ${question?.question}: ${answer}`;
          })
          .join("\n")}\n\n${answers.additionalContext}`
      : formData.context;

    createDebateMutation.mutate({
      question: formData.question,
      context: enrichedContext,
      category: formData.category,
      expertCount: formData.expertCount,
      maxRounds: formData.maxRounds,
    });
  };

  const exampleQuestions = [
    "¿Debería pivotear mi startup de B2B a B2C?",
    "¿Vale la pena migrar nuestra infraestructura a Kubernetes?",
    "¿Cómo debería estructurar el equity para mi equipo fundador?",
  ];

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
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Quoorum</span>
            </Link>

            <Link href="/debates">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Debates
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Phase Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  phase === "input"
                    ? "bg-purple-600 text-white"
                    : "bg-purple-600/20 text-purple-400"
                }`}
              >
                1
              </div>
              <span className={phase === "input" ? "text-white font-medium" : "text-gray-500"}>
                Pregunta
              </span>
            </div>

            <div className="flex-1 h-px bg-white/10 mx-4" />

            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  phase === "assessment"
                    ? "bg-purple-600 text-white"
                    : phase === "config" || phase === "creating"
                      ? "bg-purple-600/20 text-purple-400"
                      : "bg-white/5 text-gray-600"
                }`}
              >
                2
              </div>
              <span
                className={
                  phase === "assessment"
                    ? "text-white font-medium"
                    : phase === "config" || phase === "creating"
                      ? "text-gray-500"
                      : "text-gray-600"
                }
              >
                Evaluación
              </span>
            </div>

            <div className="flex-1 h-px bg-white/10 mx-4" />

            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  phase === "config" || phase === "creating"
                    ? "bg-purple-600 text-white"
                    : "bg-white/5 text-gray-600"
                }`}
              >
                3
              </div>
              <span
                className={
                  phase === "config" || phase === "creating"
                    ? "text-white font-medium"
                    : "text-gray-600"
                }
              >
                Configuración
              </span>
            </div>
          </div>
        </div>

        {/* Phase 1: Input */}
        {phase === "input" && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Nueva Deliberación</CardTitle>
              <CardDescription className="text-gray-400">
                Plantea tu pregunta y proporciona contexto para una deliberación profunda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question */}
              <div className="space-y-2">
                <Label htmlFor="question" className="text-white">
                  Pregunta o Decisión
                </Label>
                <Textarea
                  id="question"
                  placeholder="¿Cuál es la decisión que necesitas tomar?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Example Questions */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-400">Ejemplos:</Label>
                <div className="flex flex-wrap gap-2">
                  {exampleQuestions.map((example) => (
                    <Button
                      key={example}
                      variant="outline"
                      size="sm"
                      onClick={() => useExample(example)}
                      className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white text-xs"
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Context */}
              <div className="space-y-2">
                <Label htmlFor="context" className="text-white">
                  Contexto (Opcional)
                </Label>
                <Textarea
                  id="context"
                  placeholder="Proporciona información relevante: objetivos, restricciones, stakeholders..."
                  value={formData.context}
                  onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                  className="min-h-[150px] bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-white">
                  Categoría
                </Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !formData.question.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analizando contexto...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analizar Contexto
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Phase 2: Assessment */}
        {phase === "assessment" && assessment && (
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Evaluación de Contexto</CardTitle>
                <CardDescription className="text-gray-400">
                  Ayúdanos a refinar el contexto para una mejor deliberación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Context Quality */}
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Calidad del Contexto</span>
                      <span className="text-lg font-bold text-white">{assessment.overallScore}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all"
                        style={{ width: `${assessment.overallScore}%` }}
                      />
                    </div>
                  </div>
                  {assessment.overallScore >= 80 ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                  )}
                </div>

                {/* Assumptions */}
                {assessment.assumptions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Asunciones Detectadas</h3>
                    {assessment.assumptions.map((assumption) => (
                      <div key={assumption.id} className="p-4 bg-white/5 rounded-lg space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="text-white flex-1">{assumption.assumption}</p>
                          <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                            Confianza: {Math.round(assumption.confidence * 100)}%
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={answers.assumptionResponses[assumption.id] === true ? "default" : "outline"}
                            onClick={() =>
                              setAnswers({
                                ...answers,
                                assumptionResponses: {
                                  ...answers.assumptionResponses,
                                  [assumption.id]: true,
                                },
                              })
                            }
                            className="flex-1"
                          >
                            Sí, es correcto
                          </Button>
                          <Button
                            size="sm"
                            variant={answers.assumptionResponses[assumption.id] === false ? "default" : "outline"}
                            onClick={() =>
                              setAnswers({
                                ...answers,
                                assumptionResponses: {
                                  ...answers.assumptionResponses,
                                  [assumption.id]: false,
                                },
                              })
                            }
                            className="flex-1"
                          >
                            No, es incorrecto
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Clarifying Questions */}
                {assessment.clarifyingQuestions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Preguntas Aclaratorias</h3>
                    {assessment.clarifyingQuestions.map((q) => (
                      <div key={q.id} className="space-y-2">
                        <Label className="text-white">{q.question}</Label>
                        <p className="text-sm text-gray-400">Dimensión: {q.dimension}</p>
                        <Textarea
                          placeholder="Tu respuesta..."
                          value={answers.questionResponses[q.id] || ""}
                          onChange={(e) =>
                            setAnswers({
                              ...answers,
                              questionResponses: {
                                ...answers.questionResponses,
                                [q.id]: e.target.value,
                              },
                            })
                          }
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Context */}
                <div className="space-y-2">
                  <Label className="text-white">Contexto Adicional</Label>
                  <Textarea
                    placeholder="¿Hay algo más que debamos saber?"
                    value={answers.additionalContext}
                    onChange={(e) => setAnswers({ ...answers, additionalContext: e.target.value })}
                    className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleRefine} disabled={isAnalyzing} variant="outline" className="flex-1">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Refinando...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Refinar Contexto
                      </>
                    )}
                  </Button>
                  <Button onClick={handleProceedToConfig} className="flex-1 bg-purple-600 hover:bg-purple-700">
                    Continuar a Configuración
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Phase 3: Configuration */}
        {(phase === "config" || phase === "creating") && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Configuración del Debate</CardTitle>
              <CardDescription className="text-gray-400">
                Ajusta los parámetros para la deliberación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Expert Count */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Número de Expertos</Label>
                  <span className="text-2xl font-bold text-purple-400">{formData.expertCount}</span>
                </div>
                <Slider
                  value={[formData.expertCount]}
                  onValueChange={([value]) => setFormData({ ...formData, expertCount: value || 3 })}
                  min={3}
                  max={15}
                  step={1}
                  className="w-full"
                  disabled={phase === "creating"}
                />
                <p className="text-sm text-gray-400">Más expertos = perspectivas más diversas, pero más tiempo</p>
              </div>

              {/* Max Rounds */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Rondas Máximas</Label>
                  <span className="text-2xl font-bold text-purple-400">{formData.maxRounds}</span>
                </div>
                <Slider
                  value={[formData.maxRounds]}
                  onValueChange={([value]) => setFormData({ ...formData, maxRounds: value || 3 })}
                  min={3}
                  max={10}
                  step={1}
                  className="w-full"
                  disabled={phase === "creating"}
                />
                <p className="text-sm text-gray-400">Más rondas = deliberación más profunda</p>
              </div>

              {/* Estimated Time */}
              {formData.expertCount && formData.maxRounds && (
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-medium">Estimación</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Rondas máximas:</span>
                      <span className="ml-2 text-white font-medium">{formData.maxRounds}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Tiempo aprox:</span>
                      <span className="ml-2 text-white font-medium">{formData.maxRounds * 2}-{formData.maxRounds * 3} min</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleCreateDebate}
                disabled={phase === "creating"}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {phase === "creating" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando debate...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Iniciar Deliberación
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
