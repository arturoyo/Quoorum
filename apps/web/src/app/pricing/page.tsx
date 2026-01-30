"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle,
  X,
  ArrowRight,
  Zap,
} from "lucide-react";
import { AppHeader } from "@/components/layout";
import { LandingFooter } from "@/components/layout/landing-footer";
import { AnimatedBackground } from "@/components/layout/animated-background";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
  {
    id: "free",
    name: "Free",
    description: "Para probar el sistema",
    monthlyPrice: 0,
    yearlyPrice: 0,
    featureList: [
      "100 créditos una vez",
      "93 expertos especializados",
      "Deliberación multi-agente",
      "Historial 30 días",
      "Exportar a PDF",
    ],
    cta: "Empezar Gratis",
    ctaLink: "/signup",
    popular: false,
  },
  {
    id: "starter",
    name: "Starter",
    description: "Síntesis estratégica de alta calidad",
    monthlyPrice: 29,
    yearlyPrice: 290, // 29€/mes * 10 = 290€/año con 17% descuento
    featureList: [
      "3,500 créditos/mes",
      "93 expertos especializados",
      "300 créditos diarios de actualización",
      "Modelos de IA estándar",
      "Sistema de 4 capas de contexto",
      "Acceso anticipado a funciones beta",
    ],
    cta: "Comenzar Prueba Gratis",
    ctaLink: "/signup?plan=starter",
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Inteligencia Corporativa de espectro completo",
    monthlyPrice: 79,
    yearlyPrice: 790, // 79€/mes * 10 = 790€/año con 17% descuento
    featureList: [
      "10,000 créditos/mes",
      "93 expertos + 7 departamentos corporativos",
      "Modelos de IA especializados",
      "Personalización de BasePrompts",
      "Exportar a PDF profesional",
      "Soporte prioritario",
    ],
    cta: "Comenzar Prueba Gratis",
    ctaLink: "/signup?plan=pro",
    popular: false,
  },
  {
    id: "business",
    name: "Business",
    description: "Control estratégico empresarial",
    monthlyPrice: 199,
    yearlyPrice: 1990, // 199€/mes * 10 = 1990€/año con 17% descuento
    featureList: [
      "30,000 créditos/mes",
      "93 expertos + 7 departamentos corporativos",
      "Los mejores modelos de IA",
      "Panel de Administración completo",
      "Gestión de usuarios y equipos",
      "Multiplicador de crédito ajustable",
      "SLA y seguridad empresarial",
      "Soporte dedicado 24/7",
    ],
    cta: "Contactar Ventas",
    ctaLink: "/soporte?plan=business",
    popular: false,
  },
];

const faqs = [
  {
    question: "¿Cómo funciona la prueba gratuita?",
    answer:
      "Puedes empezar con el plan Free que incluye 5 debates al mes. Si quieres probar Pro, tienes 14 días de prueba gratuita sin necesidad de tarjeta de crédito.",
  },
  {
    question: "¿Puedo cambiar de plan en cualquier momento?",
    answer:
      "Sí, puedes actualizar o degradar tu plan cuando quieras. Si actualizas, solo pagas la diferencia prorrateada. Si degradas, el cambio se aplica al final del período de facturación.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Aceptamos todas las tarjetas de crédito principales (Visa, Mastercard, Amex) y transferencia bancaria para planes Business.",
  },
  {
    question: "¿Qué son los 'expertos' del sistema?",
    answer:
      "Los expertos son agentes de IA especializados en diferentes áreas: estrategia, finanzas, marketing, tecnología, ética, recursos humanos, etc. Cada experto aporta una perspectiva única al debate.",
  },
  {
    question: "¿Qué pasa si excedo el límite de debates?",
    answer:
      "Te notificaremos cuando estés cerca del límite. Puedes actualizar tu plan o esperar al siguiente mes. Los debates no usados no se acumulan.",
  },
  {
    question: "¿Ofrecen descuentos para startups o ONGs?",
    answer:
      "Sí, ofrecemos un 50% de descuento para startups en fase inicial (pre-Series A) y organizaciones sin ánimo de lucro. Contáctanos para más información.",
  },
];

const comparisonFeatures = [
  { name: "Créditos mensuales", free: "100 (una vez)", starter: "3,500", pro: "10,000", business: "30,000" },
  { name: "Expertos disponibles", free: "93", starter: "93", pro: "93 + 7 dept.", business: "93 + 7 dept." },
  { name: "Créditos diarios de actualización", free: "-", starter: "300", pro: "300", business: "300" },
  { name: "Modelos de IA", free: "Básicos", starter: "Estándar", pro: "Especializados", business: "Los mejores" },
  { name: "Historial", free: "30 días", starter: "Ilimitado", pro: "Ilimitado", business: "Ilimitado" },
  { name: "Exportar a PDF", free: true, starter: true, pro: true, business: true },
  { name: "Sistema de 4 capas de contexto", free: false, starter: true, pro: true, business: true },
  { name: "Inteligencia Corporativa (7 dept.)", free: false, starter: false, pro: true, business: true },
  { name: "Panel de Administración", free: false, starter: false, pro: false, business: true },
  { name: "Multiplicador de crédito ajustable", free: false, starter: false, pro: false, business: true },
  { name: "SLA empresarial", free: false, starter: false, pro: false, business: true },
  { name: "Soporte", free: "Comunidad", starter: "Prioritario", pro: "Prioritario", business: "Dedicado 24/7" },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--theme-landing-bg)] relative overflow-hidden">
      <AnimatedBackground />
      {/* Navigation */}
      <AppHeader variant="landing" showAuth={true} />

      {/* Header */}
      <section className="py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold styles.colors.text.primary">
          Precios simples y transparentes
        </h1>
        <p className="styles.colors.text.secondary mt-4 max-w-2xl mx-auto">
          Elige el plan que mejor se adapte a tus necesidades. Todos incluyen acceso a
          nuestros expertos IA y pueden escalarse según crezcas.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <span className={`text-sm ${!isYearly ? "styles.colors.text.primary" : "styles.colors.text.secondary"}`}>
            Mensualmente
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-purple-600"
          />
          <span className={`text-sm ${isYearly ? "styles.colors.text.primary" : "styles.colors.text.secondary"}`}>
            Anualmente
          </span>
          {isYearly && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
              Ahorra 17%
            </span>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => {
              // Para anual, mostrar el precio mensual equivalente
              const monthlyEquivalent = isYearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;
              const savings = isYearly && plan.yearlyPrice > 0
                ? plan.monthlyPrice * 12 - plan.yearlyPrice
                : 0;

              return (
                <div
                  key={plan.id}
                  className={`p-6 rounded-2xl border ${
                    plan.popular
                      ? "bg-purple-500/20 border-purple-500"
                      : "bg-[var(--theme-landing-card)] border-[var(--theme-landing-border)]"
                  } relative flex flex-col`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 rounded-full text-white text-sm font-medium flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Más Popular
                    </div>
                  )}

                  <h3 className="text-xl font-semibold styles.colors.text.primary">{plan.name}</h3>
                  <p className="styles.colors.text.secondary text-sm mt-1 min-h-[40px]">{plan.description}</p>

                  <div className="mt-6">
                    <span className="text-4xl font-bold styles.colors.text.primary">{monthlyEquivalent}€</span>
                    <span className="styles.colors.text.secondary"> / mes</span>
                    {isYearly && savings > 0 && (
                      <p className="text-sm text-green-400 mt-1">
                        {savings}€ de ahorro al año
                      </p>
                    )}
                  </div>

                  <ul className="mt-6 space-y-3 flex-1">
                    {plan.featureList.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 styles.colors.text.secondary">
                        <CheckCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.ctaLink} className="block mt-6">
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "bg-[var(--theme-landing-card)] border border-[var(--theme-landing-border)] hover:bg-[var(--theme-landing-card-hover)] styles.colors.text.primary"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 px-4 bg-[var(--theme-landing-card)]">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold styles.colors.text.primary text-center mb-12">
            Comparación de planes
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--theme-landing-border)]">
                  <th className="text-left py-4 px-3 styles.colors.text.secondary font-medium">Característica</th>
                  <th className="text-center py-4 px-3 styles.colors.text.primary font-medium">Free</th>
                  <th className="text-center py-4 px-3 text-purple-400 font-medium">Starter</th>
                  <th className="text-center py-4 px-3 styles.colors.text.primary font-medium">Pro</th>
                  <th className="text-center py-4 px-3 styles.colors.text.primary font-medium">Business</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature) => (
                  <tr key={feature.name} className="border-b border-[var(--theme-landing-border)]">
                    <td className="py-4 px-3 styles.colors.text.secondary text-sm">{feature.name}</td>
                    <td className="py-4 px-3 text-center">
                      {typeof feature.free === "boolean" ? (
                        feature.free ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 styles.colors.text.tertiary mx-auto" />
                        )
                      ) : (
                        <span className="styles.colors.text.secondary text-sm">{feature.free}</span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-center bg-purple-500/10">
                      {typeof feature.starter === "boolean" ? (
                        feature.starter ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 styles.colors.text.tertiary mx-auto" />
                        )
                      ) : (
                        <span className="styles.colors.text.primary text-sm">{feature.starter}</span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {typeof feature.pro === "boolean" ? (
                        feature.pro ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 styles.colors.text.tertiary mx-auto" />
                        )
                      ) : (
                        <span className="styles.colors.text.secondary text-sm">{feature.pro}</span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {typeof feature.business === "boolean" ? (
                        feature.business ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 styles.colors.text.tertiary mx-auto" />
                        )
                      ) : (
                        <span className="styles.colors.text.secondary text-sm">{feature.business}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold styles.colors.text.primary text-center mb-4">
            Preguntas frecuentes
          </h2>
          <p className="styles.colors.text.secondary text-center mb-12">
            ¿Tienes otras preguntas?{" "}
            <Link href="/soporte" className="text-purple-400 hover:text-purple-300">
              Contáctanos
            </Link>
          </p>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-[var(--theme-landing-border)] rounded-lg px-6 bg-[var(--theme-landing-card)]"
              >
                <AccordionTrigger className="styles.colors.text.primary hover:text-purple-400 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="styles.colors.text.secondary">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30">
            <h2 className="text-3xl font-bold styles.colors.text.primary">¿Aún tienes dudas?</h2>
            <p className="styles.colors.text.secondary mt-4">
              Empieza gratis y experimenta el poder de los debates de expertos IA. No
              requiere tarjeta de crédito.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 h-12"
                >
                  Empezar Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/soporte">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[var(--theme-landing-border)] bg-[var(--theme-landing-card)] styles.colors.text.primary hover:bg-[var(--theme-landing-card-hover)] px-8 h-12"
                >
                  Hablar con Ventas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
