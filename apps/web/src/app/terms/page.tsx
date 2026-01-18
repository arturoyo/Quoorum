import Link from "next/link";
import {
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoorumLogo } from "@/components/ui/quoorum-logo";

export const metadata = {
  title: "Términos de Servicio - Quoorum",
  description: "Términos y condiciones de uso de Quoorum",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
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

            <Link href="/">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold text-white mb-8">
            Términos de Servicio
          </h1>

          <div className="prose prose-invert prose-purple max-w-none">
            <p className="text-gray-300 text-lg mb-8">
              Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
            </p>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Aceptación de los Términos</h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  Al acceder y utilizar Quoorum (&quot;el Servicio&quot;), aceptas estar vinculado por estos
                  Términos de Servicio. Si no estás de acuerdo con alguna parte de los términos,
                  no podrás acceder al Servicio.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Descripción del Servicio</h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  Quoorum es una plataforma de deliberación multi-agente que utiliza inteligencia
                  artificial para facilitar la toma de decisiones estratégicas. El Servicio incluye:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Acceso a expertos IA especializados</li>
                  <li>Sistema de debates y consenso</li>
                  <li>Analytics y métricas de decisiones</li>
                  <li>Exportación de informes</li>
                  <li>API para integraciones (según plan)</li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">3. Registro y Cuenta</h2>
              <div className="text-gray-300 space-y-4">
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
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Planes y Pagos</h2>
              <div className="text-gray-300 space-y-4">
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
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Uso Aceptable</h2>
              <div className="text-gray-300 space-y-4">
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
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Propiedad Intelectual</h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  El Servicio y su contenido original, características y funcionalidad son
                  propiedad de Quoorum y están protegidos por leyes de propiedad intelectual.
                </p>
                <p>
                  El contenido que subas permanece siendo tu propiedad. Nos otorgas una licencia
                  limitada para usar dicho contenido únicamente para proporcionar el Servicio.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Limitación de Responsabilidad</h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  El Servicio proporciona recomendaciones basadas en IA. Estas recomendaciones
                  son orientativas y NO constituyen asesoramiento profesional.
                </p>
                <p>
                  Quoorum no será responsable de:
                </p>
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
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Privacidad</h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  Tu uso del Servicio está sujeto a nuestra{" "}
                  <Link href="/privacy" className="text-purple-400 hover:text-purple-300">
                    Política de Privacidad
                  </Link>
                  , que describe cómo recopilamos, usamos y protegemos tu información.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Terminación</h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  Podemos suspender o terminar tu acceso al Servicio inmediatamente, sin previo
                  aviso, por cualquier razón, incluyendo violación de estos Términos.
                </p>
                <p>
                  Puedes terminar tu cuenta en cualquier momento desde la configuración de tu
                  cuenta o contactando con soporte.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">10. Modificaciones</h2>
              <div className="text-gray-300 space-y-4">
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
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">11. Ley Aplicable</h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  Estos Términos se regirán e interpretarán de acuerdo con las leyes de España,
                  sin tener en cuenta sus disposiciones sobre conflictos de leyes.
                </p>
                <p>
                  Cualquier disputa se resolverá en los tribunales de Madrid, España.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">12. Contacto</h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  Para cualquier pregunta sobre estos Términos, contacta con nosotros:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Email: <a href="mailto:legal@forum.ai" className="text-purple-400 hover:text-purple-300">legal@forum.ai</a></li>
                  <li>Dirección: Quoorum AI, Madrid, España</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="container mx-auto text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Quoorum. Todos los derechos reservados.</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Link href="/privacy" className="hover:text-white">Privacidad</Link>
            <Link href="/terms" className="text-purple-400">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
