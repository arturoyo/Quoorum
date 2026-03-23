import Link from "next/link";
import { cn, styles } from '@/lib/utils'
import { FileText, Scale, Shield, CreditCard, Users, AlertTriangle, Lock, XCircle, RefreshCw, Gavel, Mail } from "lucide-react";
import { AppHeader } from "@/components/layout";
import { LandingFooter } from "@/components/layout/landing-footer";

export const metadata = {
  title: "Términos de Servicio - Quoorum",
  description: "Términos y condiciones de uso de Quoorum",
};

const sections = [
  { id: "aceptacion", title: "Aceptación de los Términos", icon: Scale },
  { id: "descripcion", title: "Descripción del Servicio", icon: FileText },
  { id: "registro", title: "Registro y Cuenta", icon: Users },
  { id: "pagos", title: "Planes y Pagos", icon: CreditCard },
  { id: "uso", title: "Uso Aceptable", icon: Shield },
  { id: "propiedad", title: "Propiedad Intelectual", icon: Lock },
  { id: "responsabilidad", title: "Limitación de Responsabilidad", icon: AlertTriangle },
  { id: "privacidad", title: "Privacidad", icon: Shield },
  { id: "terminacion", title: "Terminación", icon: XCircle },
  { id: "modificaciones", title: "Modificaciones", icon: RefreshCw },
  { id: "ley", title: "Ley Aplicable", icon: Gavel },
  { id: "contacto", title: "Contacto", icon: Mail },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--theme-landing-bg)]">
      {/* Header */}
      <AppHeader variant="landing" showAuth={true} />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 border-b border-white/5">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm styles.colors.text.secondary mb-6">
              <Scale className="w-4 h-4 text-purple-400" />
              <span>Legal</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Términos de{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Servicio
              </span>
            </h1>

            <p className="text-xl styles.colors.text.secondary max-w-2xl mx-auto">
              Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="space-y-12">
          {/* Sección 1: Aceptación */}
          <section id="aceptacion" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                  <Scale className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">1. Aceptación de los Términos</h2>
              </div>
              <div className="styles.colors.text.secondary space-y-4">
                <p>
                  Al acceder y utilizar Quoorum (&quot;el Servicio&quot;), aceptas estar vinculado por estos
                  Términos de Servicio. Si no estás de acuerdo con alguna parte de los términos,
                  no podrás acceder al Servicio.
                </p>
              </div>
            </div>
          </section>

          {/* Sección 2: Descripción */}
          <section id="descripcion" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">2. Descripción del Servicio</h2>
              </div>
              <div className="styles.colors.text.secondary space-y-4">
                <p>
                  Quoorum es la única plataforma que simula un Comité Ejecutivo de expertos de IA
                  (la Capa de Inteligencia Corporativa) para debatir, criticar y sintetizar la mejor
                  decisión estratégica, eliminando los sesgos humanos y la lentitud de las reuniones,
                  y entregando un consenso accionable en minutos.
                </p>
                <p className="font-medium text-white">El Servicio incluye:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Acceso a expertos IA especializados</li>
                  <li>Sistema de debates y consenso</li>
                  <li>Analytics y métricas de decisiones</li>
                  <li>Exportación de informes</li>
                  <li>API para integraciones (según plan)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Sección 3: Registro */}
          <section id="registro" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-pink-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">3. Registro y Cuenta</h2>
              </div>
              <div className="styles.colors.text.secondary space-y-4">
                <p>Para usar el Servicio debes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Tener al menos 18 años de edad</li>
                  <li>Proporcionar información veraz y completa</li>
                  <li>Mantener la seguridad de tu cuenta y contraseña</li>
                  <li>Notificarnos inmediatamente de cualquier uso no autorizado</li>
                </ul>
                <p>
                  Eres responsable de todas las actividades que ocurran bajo tu cuenta.
                </p>
              </div>
            </div>
          </section>

          {/* Sección 4: Pagos */}
          <section id="pagos" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">4. Planes y Pagos</h2>
              </div>
              <div className="styles.colors.text.secondary space-y-4">
                <p>
                  Ofrecemos diferentes planes de suscripción. Al seleccionar un plan de pago:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Aceptas pagar las tarifas aplicables según el plan elegido</li>
                  <li>Los pagos se procesan de forma segura a través de Stripe</li>
                  <li>Las suscripciones se renuevan automáticamente</li>
                  <li>Puedes cancelar en cualquier momento (efectivo al final del período)</li>
                  <li>No ofrecemos reembolsos por períodos parciales</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Sección 5: Uso Aceptable */}
          <section id="uso" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">5. Uso Aceptable</h2>
              </div>
              <div className="styles.colors.text.secondary space-y-4">
                <p>Te comprometes a NO usar el Servicio para:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Violar leyes o regulaciones aplicables</li>
                  <li>Infringir derechos de propiedad intelectual de terceros</li>
                  <li>Transmitir contenido ilegal, dañino o fraudulento</li>
                  <li>Intentar acceder a sistemas o datos no autorizados</li>
                  <li>Interferir con el funcionamiento del Servicio</li>
                  <li>Revender o redistribuir el Servicio sin autorización</li>
                  <li>Usar el Servicio para entrenar otros modelos de IA</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Sección 6: Propiedad Intelectual */}
          <section id="propiedad" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">6. Propiedad Intelectual</h2>
              </div>
              <div className="styles.colors.text.secondary space-y-4">
                <p>
                  El Servicio y su contenido original, características y funcionalidad son
                  propiedad de Quoorum y están protegidos por leyes de propiedad intelectual.
                </p>
                <p>
                  El contenido que subas permanece siendo tu propiedad. Nos otorgas una licencia
                  limitada para usar dicho contenido únicamente para proporcionar el Servicio.
                </p>
              </div>
            </div>
          </section>

          {/* Sección 7: Limitación de Responsabilidad */}
          <section id="responsabilidad" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">7. Limitación de Responsabilidad</h2>
              </div>
              <div className="styles.colors.text.secondary space-y-4">
                <p>
                  El Servicio proporciona recomendaciones basadas en IA. Estas recomendaciones
                  son orientativas y NO constituyen asesoramiento profesional.
                </p>
                <p>Quoorum no será responsable de:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Decisiones tomadas basándose en las recomendaciones del Servicio</li>
                  <li>Pérdidas económicas o daños indirectos</li>
                  <li>Interrupciones temporales del Servicio</li>
                  <li>Acciones de terceros</li>
                </ul>
                <p>
                  Nuestra responsabilidad total está limitada al importe pagado en los últimos
                  12 meses.
                </p>
              </div>
            </div>
          </section>

          {/* Sección 8: Privacidad */}
          <section id="privacidad" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">8. Privacidad</h2>
              </div>
              <div className="styles.colors.text.secondary space-y-4">
                <p>
                  Tu uso del Servicio está sujeto a nuestra{" "}
                  <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline underline-offset-4">
                    Política de Privacidad
                  </Link>
                  , que describe cómo recopilamos, usamos y protegemos tu información.
                </p>
              </div>
            </div>
          </section>

          {/* Sección 9: Terminación */}
          <section id="terminacion" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">9. Terminación</h2>
              </div>
              <div className="styles.colors.text.secondary space-y-4">
                <p>
                  Podemos suspender o terminar tu acceso al Servicio inmediatamente, sin previo
                  aviso, por cualquier razón, incluyendo violación de estos Términos.
                </p>
                <p>
                  Puedes terminar tu cuenta en cualquier momento desde la configuración de tu
                  cuenta o contactando con soporte.
                </p>
              </div>
            </div>
          </section>

          {/* Sección 10: Modificaciones */}
          <section id="modificaciones" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-teal-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">10. Modificaciones</h2>
              </div>
              <div className="styles.colors.text.secondary space-y-4">
                <p>
                  Nos reservamos el derecho de modificar estos Términos en cualquier momento.
                  Los cambios significativos serán notificados por email o mediante aviso en
                  el Servicio.
                </p>
                <p>
                  El uso continuado del Servicio después de la notificación constituye aceptación
                  de los nuevos términos.
                </p>
              </div>
            </div>
          </section>

          {/* Sección 11: Ley Aplicable */}
          <section id="ley" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                  <Gavel className="w-6 h-6 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">11. Ley Aplicable</h2>
              </div>
              <div className="styles.colors.text.secondary space-y-4">
                <p>
                  Estos Términos se regirán e interpretarán de acuerdo con las leyes de España,
                  sin tener en cuenta sus disposiciones sobre conflictos de leyes.
                </p>
                <p>
                  Cualquier disputa se resolverá en los tribunales de Madrid, España.
                </p>
              </div>
            </div>
          </section>

          {/* Sección 12: Contacto */}
          <section id="contacto" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-cyan-500/10 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">12. Contacto</h2>
              </div>
              <div className="styles.colors.text.secondary space-y-4">
                <p>
                  Para cualquier pregunta sobre estos Términos, contacta con nosotros:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-purple-400" />
                    <a href="mailto:legal@quoorum.com" className="text-purple-400 hover:text-purple-300">
                      legal@quoorum.com
                    </a>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 flex items-center justify-center text-purple-400">📍</span>
                    <span>Quoorum AI, Barcelona, España</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
