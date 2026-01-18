"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Target,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { QuoorumLogo } from "@/components/ui/quoorum-logo";

const STEPS = [
  { id: 1, title: "Perfil", icon: User },
  { id: 2, title: "Empresa", icon: Building },
  { id: 3, title: "Objetivos", icon: Target },
  { id: 4, title: "¡Listo!", icon: Sparkles },
];

const OBJECTIVES = [
  { id: "strategy", label: "Estrategia de negocio" },
  { id: "decisions", label: "Toma de decisiones" },
  { id: "negotiations", label: "Negociaciones" },
  { id: "investments", label: "Análisis de inversiones" },
  { id: "product", label: "Decisiones de producto" },
  { id: "other", label: "Otro" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    role: "",
    company: "",
    companySize: "",
    objective: "",
  });

  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Pre-fill from user metadata
      if (user.user_metadata?.full_name) {
        setFormData((prev) => ({
          ...prev,
          fullName: user.user_metadata.full_name,
        }));
      }
    }

    checkUser();
  }, [router, supabase.auth]);

  const handleNext = () => {
    if (currentStep === 1 && !formData.fullName) {
      toast.error("Por favor, introduce tu nombre");
      return;
    }
    if (currentStep === 2 && !formData.company) {
      toast.error("Por favor, introduce el nombre de tu empresa");
      return;
    }
    if (currentStep === 3 && !formData.objective) {
      toast.error("Por favor, selecciona un objetivo");
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
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          role: formData.role,
          company: formData.company,
          company_size: formData.companySize,
          objective: formData.objective,
          onboarding_completed: true,
        },
      });

      if (error) {
        toast.error("Error al guardar tu información");
        return;
      }

      toast.success("¡Perfil completado!");
      router.push("/dashboard");
    } catch {
      toast.error("Error al completar el onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-purple-600">
              <QuoorumLogo size={40} showGradient={true} />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">Quoorum</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 ${
                  step.id <= currentStep ? "text-purple-400" : "text-gray-600"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.id < currentStep
                      ? "bg-purple-600"
                      : step.id === currentStep
                      ? "bg-purple-500/30 border border-purple-500"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          {/* Step 1: Profile */}
          {currentStep === 1 && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">
                  ¡Bienvenido a Quoorum!
                </CardTitle>
                <CardDescription>
                  Cuéntanos un poco sobre ti
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-300">
                    ¿Cómo te llamas?
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Tu nombre completo"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-gray-300">
                    ¿Cuál es tu cargo? (opcional)
                  </Label>
                  <Input
                    id="role"
                    placeholder="Ej: CEO, Director, Manager..."
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Company */}
          {currentStep === 2 && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">
                  Tu empresa
                </CardTitle>
                <CardDescription>
                  Esto nos ayuda a personalizar las recomendaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-gray-300">
                    Nombre de tu empresa
                  </Label>
                  <Input
                    id="company"
                    placeholder="Nombre de la empresa"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">
                    Tamaño del equipo
                  </Label>
                  <RadioGroup
                    value={formData.companySize}
                    onValueChange={(value) =>
                      setFormData({ ...formData, companySize: value })
                    }
                    className="grid grid-cols-2 gap-3"
                  >
                    {[
                      { value: "1-10", label: "1-10" },
                      { value: "11-50", label: "11-50" },
                      { value: "51-200", label: "51-200" },
                      { value: "200+", label: "200+" },
                    ].map((size) => (
                      <div key={size.value}>
                        <RadioGroupItem
                          value={size.value}
                          id={size.value}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={size.value}
                          className="flex items-center justify-center p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:bg-purple-500/20 text-gray-300"
                        >
                          {size.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Objectives */}
          {currentStep === 3 && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">
                  Tu objetivo principal
                </CardTitle>
                <CardDescription>
                  ¿Para qué usarás Quoorum principalmente?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.objective}
                  onValueChange={(value) =>
                    setFormData({ ...formData, objective: value })
                  }
                  className="space-y-3"
                >
                  {OBJECTIVES.map((obj) => (
                    <div key={obj.id}>
                      <RadioGroupItem
                        value={obj.id}
                        id={obj.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={obj.id}
                        className="flex items-center p-4 rounded-lg border border-white/10 bg-white/5 cursor-pointer peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:bg-purple-500/20 text-gray-300"
                      >
                        {obj.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </>
          )}

          {/* Step 4: Complete */}
          {currentStep === 4 && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <CardTitle className="text-2xl text-white">
                  ¡Todo listo!
                </CardTitle>
                <CardDescription>
                  Ya puedes empezar a usar Quoorum para tomar mejores decisiones
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-4 mb-6">
                  <div className="p-4 rounded-lg bg-white/5">
                    <p className="text-gray-400 text-sm">Tu primer debate es gratis</p>
                    <p className="text-white font-medium">
                      Prueba Quoorum con una pregunta de estrategia
                    </p>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between p-6 border-t border-white/10">
            {currentStep > 1 && currentStep < 4 ? (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-gray-400 hover:text-white"
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
                className="bg-purple-600 hover:bg-purple-700"
              >
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? (
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
