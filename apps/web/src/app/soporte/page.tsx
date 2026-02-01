"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  MessageSquare,
  Phone,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout";
import { LandingFooter } from "@/components/layout/landing-footer";
import { SectionHeader } from "@/components/ui/section-header";
import { IconCard } from "@/components/ui/icon-card";

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    description: "Respuesta en 24 horas",
    contact: "hola@quoorum.com",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: MessageSquare,
    title: "Chat en Vivo",
    description: "Lun-Vie 9am-6pm CET",
    contact: "Disponible en la app",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Phone,
    title: "Llamada",
    description: "Para planes Enterprise",
    contact: "Agenda una demo",
    gradient: "from-green-500 to-emerald-500",
  },
];

const faqs = [
  {
    question: "¿Cuánto tarda en responder un debate?",
    answer:
      "La mayoría de debates se resuelven en 2-5 minutos. Debates más complejos pueden tomar hasta 10 minutos.",
  },
  {
    question: "¿Puedo usar Quoorum para mi equipo?",
    answer:
      "Sí, ofrecemos planes Team y Enterprise con colaboración en tiempo real, gestión de equipos y más.",
  },
  {
    question: "¿Cómo aseguran la privacidad de mis datos?",
    answer:
      "Tus debates son privados y encriptados. Nunca entrenamos modelos con tus datos ni los compartimos con terceros.",
  },
  {
    question: "¿Ofrecen soporte técnico?",
    answer:
      "Sí, todos los planes incluyen soporte por email. Planes Pro y Enterprise incluyen soporte prioritario y asistencia por chat.",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: "",
        email: "",
        company: "",
        subject: "",
        message: "",
      });
    }, 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-[var(--theme-landing-bg)]">
      {/* Header */}
      <AppHeader variant="landing" showAuth={true} />

      {/* Hero */}
      <section className="pt-40 pb-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm styles.colors.text.secondary mb-8">
              <Mail className="w-4 h-4 text-purple-400" />
              <span>Contacto</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
              ¿Tienes preguntas?{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Hablemos
              </span>
            </h1>

            <p className="text-xl md:text-2xl styles.colors.text.secondary max-w-3xl mx-auto leading-relaxed">
              Estamos aquí para ayudarte. Ya sea que tengas una pregunta sobre
              características, precios, o necesites una demo personalizada.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="pb-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <div
                key={index}
                className="relative p-8 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform"
              >
                <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
                <div className="absolute inset-0 border border-white/10 rounded-3xl" />

                <div className="relative z-10">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${method.gradient} flex items-center justify-center mb-6`}
                  >
                    <method.icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">
                    {method.title}
                  </h3>
                  <p className="text-sm styles.colors.text.tertiary mb-4">
                    {method.description}
                  </p>
                  <p className="text-purple-400 font-medium">{method.contact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="pb-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="relative p-12 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-white/10 rounded-3xl" />

            <div className="relative z-10">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Envíanos un mensaje
                </h2>
                <p className="styles.colors.text.secondary">
                  Te responderemos en menos de 24 horas
                </p>
              </div>

              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    ¡Mensaje enviado!
                  </h3>
                  <p className="styles.colors.text.secondary">
                    Gracias por contactarnos. Te responderemos pronto.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium styles.colors.text.secondary mb-2"
                      >
                        Nombre *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:styles.colors.text.tertiary focus:outline-none focus:border-purple-500/50 transition-colors"
                        placeholder="Tu nombre"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium styles.colors.text.secondary mb-2"
                      >
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:styles.colors.text.tertiary focus:outline-none focus:border-purple-500/50 transition-colors"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="company"
                        className="block text-sm font-medium styles.colors.text.secondary mb-2"
                      >
                        Empresa
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:styles.colors.text.tertiary focus:outline-none focus:border-purple-500/50 transition-colors"
                        placeholder="Tu empresa"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium styles.colors.text.secondary mb-2"
                      >
                        Asunto *
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 transition-colors appearance-none"
                      >
                        <option value="" className="styles.colors.bg.primary">
                          Selecciona un asunto
                        </option>
                        <option value="sales" className="bg-[#0A0A0F]">
                          Consulta de ventas
                        </option>
                        <option value="support" className="bg-[#0A0A0F]">
                          Soporte técnico
                        </option>
                        <option value="demo" className="bg-[#0A0A0F]">
                          Solicitar demo
                        </option>
                        <option value="partnership" className="bg-[#0A0A0F]">
                          Partnership
                        </option>
                        <option value="other" className="bg-[#0A0A0F]">
                          Otro
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium styles.colors.text.secondary mb-2"
                    >
                      Mensaje *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:styles.colors.text.tertiary focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                      placeholder="Cuéntanos en qué podemos ayudarte..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Enviar mensaje
                        <Send className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Office Info */}
      <section className="pb-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="relative p-12 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-cyan-600/10 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-white/10 rounded-3xl" />

            <div className="relative z-10 grid md:grid-cols-2 gap-12">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Oficina</h3>
                    <p className="styles.colors.text.secondary text-sm">Sede principal</p>
                  </div>
                </div>

                <p className="styles.colors.text.secondary leading-relaxed">
                  Barcelona, España
                  <br />
                  Barrio de Gràcia
                  <br />
                  08012 Barcelona
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Horario</h3>
                    <p className="styles.colors.text.secondary text-sm">Atención al cliente</p>
                  </div>
                </div>

                <p className="styles.colors.text.secondary leading-relaxed">
                  Lunes - Viernes
                  <br />
                  9:00 AM - 6:00 PM (CET)
                  <br />
                  <span className="styles.colors.text.tertiary text-sm">
                    Soporte por email 24/7
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="pb-32 px-4">
        <div className="container mx-auto max-w-4xl">
          <SectionHeader
            title="Preguntas Frecuentes"
            subtitle="Respuestas rápidas a preguntas comunes"
          />

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="relative p-8 rounded-3xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
                <div className="absolute inset-0 border border-white/10 rounded-3xl" />

                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-4">
                    {faq.question}
                  </h3>
                  <p className="styles.colors.text.secondary leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="styles.colors.text.secondary">
              ¿No encuentras lo que buscas?{" "}
              <Link
                href="/blog"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Visita nuestro blog
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
