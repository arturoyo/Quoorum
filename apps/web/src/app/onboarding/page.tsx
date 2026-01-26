"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  User,
  Building,
  Briefcase,
  TrendingUp,
  Zap,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { QuoorumLogo } from "@/components/ui/quoorum-logo";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { id: 1, title: "Tu Empresa", icon: Building },
  { id: 2, title: "Tu Rol", icon: Briefcase },
  { id: 3, title: "Tu Estilo", icon: Zap },
  { id: 4, title: "¡Listo!", icon: Sparkles },
];

const ROLES = [
  { value: "founder", label: "Fundador/a", emoji: "🚀" },
  { value: "ceo", label: "CEO", emoji: "👔" },
  { value: "cto", label: "CTO", emoji: "💻" },
  { value: "product_manager", label: "Product Manager", emoji: "📱" },
  { value: "investor", label: "Inversor/a", emoji: "💰" },
  { value: "consultant", label: "Consultor/a", emoji: "🎯" },
  { value: "team_lead", label: "Team Lead", emoji: "👥" },
  { value: "individual_contributor", label: "Individual Contributor", emoji: "⚡" },
  { value: "other", label: "Otro", emoji: "🔧" },
] as const;

const INDUSTRIES = [
  { value: "saas", label: "SaaS", emoji: "☁️" },
  { value: "ecommerce", label: "E-commerce", emoji: "🛒" },
  { value: "fintech", label: "Fintech", emoji: "💳" },
  { value: "healthtech", label: "Healthtech", emoji: "🏥" },
  { value: "edtech", label: "Edtech", emoji: "📚" },
  { value: "marketplace", label: "Marketplace", emoji: "🏪" },
  { value: "consumer", label: "Consumer", emoji: "🎨" },
  { value: "enterprise", label: "Enterprise", emoji: "🏢" },
  { value: "hardware", label: "Hardware", emoji: "🔌" },
  { value: "services", label: "Services", emoji: "🤝" },
  { value: "other", label: "Otro", emoji: "📦" },
] as const;

const COMPANY_SIZES = [
  { value: "solo", label: "Solo (1 persona)", emoji: "👤" },
  { value: "small_2_10", label: "Pequeña (2-10)", emoji: "👥" },
  { value: "medium_11_50", label: "Mediana (11-50)", emoji: "👨‍👩‍👧‍👦" },
  { value: "large_50_plus", label: "Grande (50+)", emoji: "🏢" },
] as const;

const COMPANY_STAGES = [
  { value: "idea", label: "Idea", description: "Validando la idea" },
  { value: "mvp", label: "MVP", description: "Construyendo el producto" },
  { value: "early_revenue", label: "Early Revenue", description: "Primeros clientes" },
  { value: "growth", label: "Growth", description: "Escalando ventas" },
  { value: "scale", label: "Scale", description: "Optimizando operaciones" },
  { value: "mature", label: "Mature", description: "Empresa establecida" },
] as const;

const DECISION_STYLES = [
  {
    value: "fast_intuitive",
    label: "Rápido e Intuitivo",
    description: "Prefiero decidir rápido basándome en mi intuición",
    emoji: "⚡",
  },
  {
    value: "balanced",
    label: "Equilibrado",
    description: "Combino análisis con intuición según la situación",
    emoji: "⚖️",
  },
  {
    value: "thorough_analytical",
    label: "Analítico y Exhaustivo",
    description: "Prefiero analizar todos los datos antes de decidir",
    emoji: "🔬",
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    companyName: "",
    role: "" as typeof ROLES[number]["value"] | "",
    industry: "" as typeof INDUSTRIES[number]["value"] | "",
    companySize: "" as typeof COMPANY_SIZES[number]["value"] | "",
    companyStage: "" as typeof COMPANY_STAGES[number]["value"] | "",
    decisionStyle: "" as typeof DECISION_STYLES[number]["value"] | "",
    additionalContext: "",
  });

  const upsertBackstory = api.userBackstory.upsert.useMutation({
    onSuccess: () => {
      toast.success("¡Perfil completado!");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Error al guardar tu información");
    },
  });

  // Check if already completed
  const { data: backstoryCheck } = api.userBackstory.hasCompleted.useQuery();

  useEffect(() => {
    if (backstoryCheck?.completed) {
      router.push("/dashboard");
    }
  }, [backstoryCheck, router]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.companyName || !formData.industry || !formData.companySize || !formData.companyStage) {
        toast.error("Por favor, completa todos los campos obligatorios");
        return;
      }
    }
    if (currentStep === 2 && !formData.role) {
      toast.error("Por favor, selecciona tu rol");
      return;
    }
    if (currentStep === 3 && !formData.decisionStyle) {
      toast.error("Por favor, selecciona tu estilo de decisión");
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    await upsertBackstory.mutateAsync({
      companyName: formData.companyName,
      role: formData.role || undefined,
      industry: formData.industry || undefined,
      companySize: formData.companySize || undefined,
      companyStage: formData.companyStage || undefined,
      decisionStyle: formData.decisionStyle || undefined,
      additionalContext: formData.additionalContext || undefined,
      preferences: {
        defaultMode: "deep",
        focusAreas: [],
      },
    });
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-purple-600">
              <QuoorumLogo size={40} showGradient={true} />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
              Quoorum
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 ${
                  step.id <= currentStep ? "text-purple-400" : "text-[var(--theme-text-tertiary)]"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step.id < currentStep
                      ? "bg-purple-600"
                      : step.id === currentStep
                      ? "bg-purple-500/30 border-2 border-purple-500"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className="text-sm font-medium hidden sm:block">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {/* Step 1: Company */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-white">
                    Cuéntanos sobre tu empresa
                  </CardTitle>
                  <CardDescription>
                    Esto nos ayuda a personalizar los debates para tu contexto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-[var(--theme-text-secondary)]">
                      Nombre de tu empresa
                    </Label>
                    <Input
                      id="companyName"
                      placeholder="Ej: Acme Inc."
                      value={formData.companyName}
                      onChange={(e) =>
                        setFormData({ ...formData, companyName: e.target.value })
                      }
                      className="bg-white/5 border-white/10 text-white placeholder:text-[var(--theme-text-tertiary)]"
                    />
                  </div>

                  {/* Industry */}
                  <div className="space-y-2">
                    <Label className="text-[var(--theme-text-secondary)]">Industria</Label>
                    <RadioGroup
                      value={formData.industry}
                      onValueChange={(value) =>
                        setFormData({ ...formData, industry: value as typeof INDUSTRIES[number]["value"] })
                      }
                      className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                    >
                      {INDUSTRIES.map((industry) => (
                        <div key={industry.value}>
                          <RadioGroupItem
                            value={industry.value}
                            id={industry.value}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={industry.value}
                            className="flex flex-col items-center justify-center p-4 rounded-lg border border-white/10 bg-white/5 cursor-pointer peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:bg-purple-500/20 text-[var(--theme-text-secondary)] hover:bg-white/10 transition-colors"
                          >
                            <span className="text-2xl mb-1">{industry.emoji}</span>
                            <span className="text-xs">{industry.label}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Company Size */}
                  <div className="space-y-2">
                    <Label className="text-[var(--theme-text-secondary)]">Tamaño del equipo</Label>
                    <RadioGroup
                      value={formData.companySize}
                      onValueChange={(value) =>
                        setFormData({ ...formData, companySize: value as typeof COMPANY_SIZES[number]["value"] })
                      }
                      className="grid grid-cols-2 gap-3"
                    >
                      {COMPANY_SIZES.map((size) => (
                        <div key={size.value}>
                          <RadioGroupItem
                            value={size.value}
                            id={size.value}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={size.value}
                            className="flex items-center gap-2 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:bg-purple-500/20 text-[var(--theme-text-secondary)] hover:bg-white/10 transition-colors"
                          >
                            <span className="text-xl">{size.emoji}</span>
                            <span className="text-sm">{size.label}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Company Stage */}
                  <div className="space-y-2">
                    <Label className="text-[var(--theme-text-secondary)]">Etapa de la empresa</Label>
                    <RadioGroup
                      value={formData.companyStage}
                      onValueChange={(value) =>
                        setFormData({ ...formData, companyStage: value as typeof COMPANY_STAGES[number]["value"] })
                      }
                      className="space-y-2"
                    >
                      {COMPANY_STAGES.map((stage) => (
                        <div key={stage.value}>
                          <RadioGroupItem
                            value={stage.value}
                            id={stage.value}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={stage.value}
                            className="flex items-start gap-3 p-4 rounded-lg border border-white/10 bg-white/5 cursor-pointer peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:bg-purple-500/20 text-[var(--theme-text-secondary)] hover:bg-white/10 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-white">{stage.label}</div>
                              <div className="text-xs text-[var(--theme-text-secondary)] mt-1">{stage.description}</div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </motion.div>
            )}

            {/* Step 2: Role */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-white">
                    ¿Cuál es tu rol?
                  </CardTitle>
                  <CardDescription>
                    Esto nos ayuda a seleccionar los expertos más relevantes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value as typeof ROLES[number]["value"] })
                    }
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                  >
                    {ROLES.map((role) => (
                      <div key={role.value}>
                        <RadioGroupItem
                          value={role.value}
                          id={role.value}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={role.value}
                          className="flex flex-col items-center justify-center p-4 rounded-lg border border-white/10 bg-white/5 cursor-pointer peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:bg-purple-500/20 text-[var(--theme-text-secondary)] hover:bg-white/10 transition-colors min-h-[100px]"
                        >
                          <span className="text-2xl mb-2">{role.emoji}</span>
                          <span className="text-xs text-center">{role.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </motion.div>
            )}

            {/* Step 3: Decision Style */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-white">
                    ¿Cómo tomas decisiones?
                  </CardTitle>
                  <CardDescription>
                    Adaptaremos el análisis a tu estilo preferido
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={formData.decisionStyle}
                    onValueChange={(value) =>
                      setFormData({ ...formData, decisionStyle: value as typeof DECISION_STYLES[number]["value"] })
                    }
                    className="space-y-3"
                  >
                    {DECISION_STYLES.map((style) => (
                      <div key={style.value}>
                        <RadioGroupItem
                          value={style.value}
                          id={style.value}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={style.value}
                          className="flex items-start gap-4 p-4 rounded-lg border border-white/10 bg-white/5 cursor-pointer peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:bg-purple-500/20 text-[var(--theme-text-secondary)] hover:bg-white/10 transition-colors"
                        >
                          <span className="text-3xl flex-shrink-0">{style.emoji}</span>
                          <div className="flex-1">
                            <div className="font-medium text-white text-base">{style.label}</div>
                            <div className="text-sm text-[var(--theme-text-secondary)] mt-1">{style.description}</div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  {/* Additional Context */}
                  <div className="space-y-2 pt-4 border-t border-white/10">
                    <Label htmlFor="additionalContext" className="text-[var(--theme-text-secondary)]">
                      Contexto adicional (opcional)
                    </Label>
                    <Textarea
                      id="additionalContext"
                      placeholder="¿Hay algo más que quieras que sepamos? Ej: industrias específicas, tipos de decisiones que tomas frecuentemente..."
                      value={formData.additionalContext}
                      onChange={(e) =>
                        setFormData({ ...formData, additionalContext: e.target.value })
                      }
                      className="bg-white/5 border-white/10 text-white placeholder:text-[var(--theme-text-tertiary)] min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <CardHeader className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="mx-auto w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mb-4"
                  >
                    <Sparkles className="w-10 h-10 text-purple-400" />
                  </motion.div>
                  <CardTitle className="text-3xl text-white">
                    ¡Todo listo!
                  </CardTitle>
                  <CardDescription className="text-base">
                    Ya puedes empezar a usar Quoorum para tomar mejores decisiones
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="text-2xl mb-2">🧠</div>
                      <div className="text-sm text-[var(--theme-text-secondary)]">4 expertos IA</div>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="text-2xl mb-2">⚡</div>
                      <div className="text-sm text-[var(--theme-text-secondary)]">Análisis en 30s</div>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="text-2xl mb-2">🎯</div>
                      <div className="text-sm text-[var(--theme-text-secondary)]">Personalizado</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-white font-medium mb-1">
                      Tu primer debate es gratis
                    </p>
                    <p className="text-[var(--theme-text-secondary)] text-sm">
                      Prueba Quoorum con cualquier decisión estratégica
                    </p>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between p-6 border-t border-white/10">
            {currentStep > 1 && currentStep < 4 ? (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-[var(--theme-text-secondary)] hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                className="bg-purple-600 hover:bg-purple-700 ml-auto"
              >
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={upsertBackstory.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {upsertBackstory.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completando...
                  </>
                ) : (
                  <>
                    Ir al Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
