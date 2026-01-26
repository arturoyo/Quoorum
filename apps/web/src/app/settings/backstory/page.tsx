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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Save,
  User,
  Building,
  Briefcase,
  TrendingUp,
  Zap,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ROLES = [
  { value: "founder", label: "Fundador/a" },
  { value: "ceo", label: "CEO" },
  { value: "cto", label: "CTO" },
  { value: "product_manager", label: "Product Manager" },
  { value: "investor", label: "Inversor/a" },
  { value: "consultant", label: "Consultor/a" },
  { value: "team_lead", label: "Team Lead" },
  { value: "individual_contributor", label: "Individual Contributor" },
  { value: "other", label: "Otro" },
] as const;

const INDUSTRIES = [
  { value: "saas", label: "SaaS" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "fintech", label: "Fintech" },
  { value: "healthtech", label: "Healthtech" },
  { value: "edtech", label: "Edtech" },
  { value: "marketplace", label: "Marketplace" },
  { value: "consumer", label: "Consumer" },
  { value: "enterprise", label: "Enterprise" },
  { value: "hardware", label: "Hardware" },
  { value: "services", label: "Services" },
  { value: "other", label: "Otro" },
] as const;

const COMPANY_SIZES = [
  { value: "solo", label: "Solo (1 persona)" },
  { value: "small_2_10", label: "Pequeña (2-10)" },
  { value: "medium_11_50", label: "Mediana (11-50)" },
  { value: "large_50_plus", label: "Grande (50+)" },
] as const;

const COMPANY_STAGES = [
  { value: "idea", label: "Idea - Validando la idea" },
  { value: "mvp", label: "MVP - Construyendo el producto" },
  { value: "early_revenue", label: "Early Revenue - Primeros clientes" },
  { value: "growth", label: "Growth - Escalando ventas" },
  { value: "scale", label: "Scale - Optimizando operaciones" },
  { value: "mature", label: "Mature - Empresa establecida" },
] as const;

const DECISION_STYLES = [
  {
    value: "fast_intuitive",
    label: "Rápido e Intuitivo",
  },
  {
    value: "balanced",
    label: "Equilibrado",
  },
  {
    value: "thorough_analytical",
    label: "Analítico y Exhaustivo",
  },
] as const;

export default function BackstorySettingsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: "",
    role: "" as (typeof ROLES)[number]["value"] | "",
    industry: "" as (typeof INDUSTRIES)[number]["value"] | "",
    companySize: "" as (typeof COMPANY_SIZES)[number]["value"] | "",
    companyStage: "" as (typeof COMPANY_STAGES)[number]["value"] | "",
    decisionStyle: "" as (typeof DECISION_STYLES)[number]["value"] | "",
    additionalContext: "",
  });

  // Get backstory
  const { data: backstory, isLoading } = api.userBackstory.get.useQuery();

  // Update mutation
  const upsertBackstory = api.userBackstory.upsert.useMutation({
    onSuccess: () => {
      toast.success("Información actualizada correctamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al guardar");
    },
  });

  // Delete mutation
  const deleteBackstory = api.userBackstory.delete.useMutation({
    onSuccess: () => {
      toast.success("Información eliminada");
      router.push("/onboarding");
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar");
    },
  });

  // Load backstory data
  useEffect(() => {
    if (backstory) {
      setFormData({
        companyName: backstory.companyName || "",
        role: (backstory.role || "") as (typeof ROLES)[number]["value"] | "",
        industry: (backstory.industry || "") as (typeof INDUSTRIES)[number]["value"] | "",
        companySize: (backstory.companySize || "") as (typeof COMPANY_SIZES)[number]["value"] | "",
        companyStage: (backstory.companyStage || "") as (typeof COMPANY_STAGES)[number]["value"] | "",
        decisionStyle: (backstory.decisionStyle || "") as (typeof DECISION_STYLES)[number]["value"] | "",
        additionalContext: backstory.additionalContext || "",
      });
    }
  }, [backstory]);

  const handleSave = async () => {
    if (!formData.role || !formData.industry) {
      toast.error("El rol y la industria son obligatorios");
      return;
    }

    await upsertBackstory.mutateAsync({
      companyName: formData.companyName || undefined,
      role: formData.role || undefined,
      industry: formData.industry || undefined,
      companySize: formData.companySize || undefined,
      companyStage: formData.companyStage || undefined,
      decisionStyle: formData.decisionStyle || undefined,
      additionalContext: formData.additionalContext || undefined,
    });
  };

  const handleDelete = async () => {
    await deleteBackstory.mutateAsync();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-8">
      {/* Header */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/settings")}
          className="text-[var(--theme-text-secondary)] hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Settings
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Mi Información
        </h1>
        <p className="text-[var(--theme-text-secondary)]">
          Personaliza cómo Quoorum adapta los debates a tu contexto
        </p>
      </div>

      {/* Company Info */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-white">Información de tu Empresa</CardTitle>
          </div>
          <CardDescription>
            Ayúdanos a entender tu contexto empresarial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-[var(--theme-text-secondary)]">
              Nombre de la empresa
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
            <Label htmlFor="industry" className="text-[var(--theme-text-secondary)]">
              Industria *
            </Label>
            <Select
              value={formData.industry}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  industry: value as (typeof INDUSTRIES)[number]["value"],
                })
              }
            >
              <SelectTrigger
                id="industry"
                className="bg-white/5 border-white/10 text-white"
              >
                <SelectValue placeholder="Selecciona una industria" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                {INDUSTRIES.map((industry) => (
                  <SelectItem key={industry.value} value={industry.value}>
                    {industry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Company Size */}
            <div className="space-y-2">
              <Label htmlFor="companySize" className="text-[var(--theme-text-secondary)]">
                Tamaño
              </Label>
              <Select
                value={formData.companySize}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    companySize: value as (typeof COMPANY_SIZES)[number]["value"],
                  })
                }
              >
                <SelectTrigger
                  id="companySize"
                  className="bg-white/5 border-white/10 text-white"
                >
                  <SelectValue placeholder="Selecciona tamaño" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  {COMPANY_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company Stage */}
            <div className="space-y-2">
              <Label htmlFor="companyStage" className="text-[var(--theme-text-secondary)]">
                Etapa
              </Label>
              <Select
                value={formData.companyStage}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    companyStage: value as (typeof COMPANY_STAGES)[number]["value"],
                  })
                }
              >
                <SelectTrigger
                  id="companyStage"
                  className="bg-white/5 border-white/10 text-white"
                >
                  <SelectValue placeholder="Selecciona etapa" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  {COMPANY_STAGES.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-white">Tu Rol</CardTitle>
          </div>
          <CardDescription>
            Cuéntanos qué haces en la empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-[var(--theme-text-secondary)]">
              Rol *
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  role: value as (typeof ROLES)[number]["value"],
                })
              }
            >
              <SelectTrigger
                id="role"
                className="bg-white/5 border-white/10 text-white"
              >
                <SelectValue placeholder="Selecciona tu rol" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Decision Style */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-white">Estilo de Decisión</CardTitle>
          </div>
          <CardDescription>
            ¿Cómo prefieres tomar decisiones?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Decision Style */}
          <div className="space-y-2">
            <Label htmlFor="decisionStyle" className="text-[var(--theme-text-secondary)]">
              Estilo
            </Label>
            <Select
              value={formData.decisionStyle}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  decisionStyle: value as (typeof DECISION_STYLES)[number]["value"],
                })
              }
            >
              <SelectTrigger
                id="decisionStyle"
                className="bg-white/5 border-white/10 text-white"
              >
                <SelectValue placeholder="Selecciona tu estilo" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                {DECISION_STYLES.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Context */}
          <div className="space-y-2">
            <Label htmlFor="additionalContext" className="text-[var(--theme-text-secondary)]">
              Contexto adicional (opcional)
            </Label>
            <Textarea
              id="additionalContext"
              placeholder="Cuéntanos más sobre tu situación, desafíos actuales, o lo que necesites..."
              value={formData.additionalContext}
              onChange={(e) =>
                setFormData({ ...formData, additionalContext: e.target.value })
              }
              rows={4}
              className="bg-white/5 border-white/10 text-white placeholder:text-[var(--theme-text-tertiary)]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar información
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-slate-900 border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                ¿Eliminar tu información?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esto eliminará toda tu información de perfil. Tendrás que
                completar el onboarding de nuevo. Esta acción no se puede
                deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteBackstory.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteBackstory.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Eliminar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          onClick={handleSave}
          disabled={upsertBackstory.isPending}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {upsertBackstory.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
