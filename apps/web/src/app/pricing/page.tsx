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
import { QuoorumLogo } from "@/components/ui/quoorum-logo";
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
    description: "Para probar el sistema y decisiones ocasionales",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: {
      debates: "5 debates/mes",
      experts: "Hasta 4 expertos",
      rounds: "3 rondas por debate",
      history: "Historial 30 días",
      export: false,
      api: false,
      sso: false,
      support: "Comunidad",
      customExperts: false,
      teamMembers: "1 usuario",
      analytics: "Básicos",
    },
    cta: "Empezar Gratis",
    ctaLink: "/signup",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Para profesionales y equipos pequeños",
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: {
      debates: "50 debates/mes",
      experts: "Hasta 8 expertos",
      rounds: "5 rondas por debate",
      history: "Historial ilimitado",
      export: true,
      api: false,
      sso: false,
      support: "Email prioritario",
      customExperts: false,
      teamMembers: "Hasta 5 usuarios",
      analytics: "Avanzados",
    },
    cta: "Comenzar Prueba Gratis",
    ctaLink: "/signup?plan=pro",
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    description: "Para empresas y equipos grandes",
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: {
      debates: "Debates ilimitados",
      experts: "Hasta 15 expertos",
      rounds: "10 rondas por debate",
      history: "Historial ilimitado",
      export: true,
      api: true,
      sso: true,
      support: "Dedicado 24/7",
      customExperts: true,
      teamMembers: "Usuarios ilimitados",
      analytics: "Enterprise",
    },
    cta: "Contactar Ventas",
    ctaLink: "/contact?plan=business",
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
  { name: "Debates mensuales", free: "5", pro: "50", business: "Ilimitados" },
  { name: "Expertos por debate", free: "4", pro: "8", business: "15" },
  { name: "Rondas por debate", free: "3", pro: "5", business: "10" },
  { name: "Historial de debates", free: "30 días", pro: "Ilimitado", business: "Ilimitado" },
  { name: "Usuarios del equipo", free: "1", pro: "5", business: "Ilimitados" },
  { name: "Exportar a PDF", free: false, pro: true, business: true },
  { name: "Acceso API", free: false, pro: false, business: true },
  { name: "SSO / SAML", free: false, pro: false, business: true },
  { name: "Expertos personalizados", free: false, pro: false, business: true },
  { name: "Analytics", free: "Básicos", pro: "Avanzados", business: "Enterprise" },
  { name: "Soporte", free: "Comunidad", pro: "Email", business: "Dedicado 24/7" },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />
      {/* Navigation */}
      <header className="border-b border-white/5 backdrop-blur-2xl bg-black/50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition" />
                <div className="relative w-8 h-8 rounded-lg flex items-center justify-center bg-purple-600">
                  <QuoorumLogo size={24} showGradient={true} />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">Quoorum</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Empezar Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Header */}
      <section className="py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          Precios simples y transparentes
        </h1>
        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
          Elige el plan que mejor se adapte a tus necesidades. Todos incluyen acceso a
          nuestros expertos IA y pueden escalarse según crezcas.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <span className={`text-sm ${!isYearly ? "text-white" : "text-gray-400"}`}>
            Mensual
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-purple-600"
          />
          <span className={`text-sm ${isYearly ? "text-white" : "text-gray-400"}`}>
            Anual
          </span>
          {isYearly && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
              Ahorra 2 meses
            </span>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const period = isYearly ? "/año" : "/mes";

              return (
                <div
                  key={plan.id}
                  className={`p-8 rounded-2xl border ${
                    plan.popular
                      ? "bg-purple-500/20 border-purple-500"
                      : "bg-white/5 border-white/10"
                  } relative`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 rounded-full text-white text-sm font-medium flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Más Popular
                    </div>
                  )}

                  <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{plan.description}</p>

                  <div className="mt-6">
                    <span className="text-4xl font-bold text-white">${price}</span>
                    <span className="text-gray-400">{period}</span>
                    {isYearly && plan.yearlyPrice > 0 && (
                      <p className="text-sm text-green-400 mt-1">
                        ${plan.monthlyPrice * 12 - plan.yearlyPrice} de ahorro
                      </p>
                    )}
                  </div>

                  <ul className="mt-8 space-y-3">
                    <li className="flex items-center gap-3 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-purple-400 shrink-0" />
                      <span>{plan.features.debates}</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-purple-400 shrink-0" />
                      <span>{plan.features.experts}</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-purple-400 shrink-0" />
                      <span>{plan.features.rounds}</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-purple-400 shrink-0" />
                      <span>{plan.features.history}</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-purple-400 shrink-0" />
                      <span>{plan.features.teamMembers}</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      {plan.features.export ? (
                        <CheckCircle className="w-5 h-5 text-purple-400 shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-600 shrink-0" />
                      )}
                      <span className={!plan.features.export ? "text-gray-500" : ""}>
                        Exportar a PDF
                      </span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      {plan.features.api ? (
                        <CheckCircle className="w-5 h-5 text-purple-400 shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-600 shrink-0" />
                      )}
                      <span className={!plan.features.api ? "text-gray-500" : ""}>
                        Acceso API
                      </span>
                    </li>
                  </ul>

                  <Link href={plan.ctaLink} className="block mt-8">
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "bg-white/10 hover:bg-white/20 text-white"
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
      <section className="py-20 px-4 bg-white/5">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Comparación de planes
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Característica</th>
                  <th className="text-center py-4 px-4 text-white font-medium">Free</th>
                  <th className="text-center py-4 px-4 text-purple-400 font-medium">Pro</th>
                  <th className="text-center py-4 px-4 text-white font-medium">Business</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature) => (
                  <tr key={feature.name} className="border-b border-white/5">
                    <td className="py-4 px-4 text-gray-300">{feature.name}</td>
                    <td className="py-4 px-4 text-center">
                      {typeof feature.free === "boolean" ? (
                        feature.free ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-400">{feature.free}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center bg-purple-500/10">
                      {typeof feature.pro === "boolean" ? (
                        feature.pro ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-white">{feature.pro}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {typeof feature.business === "boolean" ? (
                        feature.business ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-300">{feature.business}</span>
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
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Preguntas frecuentes
          </h2>
          <p className="text-gray-400 text-center mb-12">
            ¿Tienes otras preguntas?{" "}
            <Link href="/contact" className="text-purple-400 hover:text-purple-300">
              Contáctanos
            </Link>
          </p>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-white/10 rounded-lg px-6 bg-white/5"
              >
                <AccordionTrigger className="text-white hover:text-purple-400 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
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
            <h2 className="text-3xl font-bold text-white">¿Aún tienes dudas?</h2>
            <p className="text-gray-300 mt-4">
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
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 px-8 h-12"
                >
                  Hablar con Ventas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="container mx-auto text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Quoorum. Todos los derechos reservados.</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Link href="/privacy" className="hover:text-white">Privacidad</Link>
            <Link href="/terms" className="hover:text-white">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
