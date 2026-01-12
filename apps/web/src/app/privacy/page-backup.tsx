import Link from "next/link";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Política de Privacidad - Forum",
  description: "Política de privacidad de Forum",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Forum</span>
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
            Política de Privacidad
          </h1>

          <div className="prose prose-invert prose-purple max-w-none">
            <p className="text-gray-300 text-lg mb-8">
              Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
            </p>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Información que Recopilamos</h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  En Forum, recopilamos información que nos proporcionas directamente:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Información de cuenta: nombre, email, contraseña</li>
                  <li>Información de perfil: foto, cargo, empresa</li>
                  <li>Contenido de debates: preguntas, respuestas, decisiones</li>
                  <li>Información de pago: procesada de forma segura por Stripe</li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Cómo Usamos tu Información</h2>
              <div className="text-gray-300 space-y-4">
                <p>Utilizamos la información recopilada para:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Proporcionar y mantener nuestros servicios</li>
                  <li>Procesar transacciones y enviar notificaciones relacionadas</li>
                  <li>Responder a tus comentarios y preguntas</li>
                  <li>Mejorar nuestros servicios y desarrollar nuevas funcionalidades</li>
                  <li>Enviar comunicaciones de marketing (con tu consentimiento)</li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">3. Compartir Información</h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  No vendemos, alquilamos ni compartimos tu información personal con terceros
                  para fines de marketing sin tu consentimiento explícito.
                </p>
                <p>Podemos compartir información con:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Proveedores de servicios que nos ayudan a operar (hosting, pagos, analytics)</li>
                  <li>Autoridades legales cuando sea requerido por ley</li>
                  <li>En caso de fusión o adquisición, con la empresa sucesora</li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Seguridad de Datos</h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  Implementamos medidas de seguridad técnicas y organizativas para proteger
                  tu información:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Encriptación en tránsito (TLS 1.3) y en reposo (AES-256)</li>
                  <li>Acceso restringido basado en roles</li>
                  <li>Auditorías de seguridad regulares</li>
                  <li>Backups automáticos y encriptados</li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Tus Derechos</h2>
              <div className="text-gray-300 space-y-4">
                <p>Tienes derecho a:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Acceder a tus datos personales</li>
                  <li>Rectificar datos incorrectos</li>
                  <li>Solicitar la eliminación de tus datos</li>
                  <li>Exportar tus datos en formato portable</li>
                  <li>Oponerte al procesamiento de tus datos</li>
                  <li>Retirar tu consentimiento en cualquier momento</li>
                </ul>
                <p>
                  Para ejercer estos derechos, contacta con nosotros en{" "}
                  <a href="mailto:privacy@forum.ai" className="text-purple-400 hover:text-purple-300">
                    privacy@forum.ai
                  </a>
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Cookies</h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  Utilizamos cookies esenciales para el funcionamiento del servicio y cookies
                  analíticas para mejorar la experiencia. Puedes gestionar tus preferencias
                  de cookies en cualquier momento.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Retención de Datos</h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  Conservamos tus datos mientras tu cuenta esté activa o según sea necesario
                  para proporcionarte servicios. Puedes solicitar la eliminación de tu cuenta
                  y datos en cualquier momento.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Cambios a esta Política</h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  Podemos actualizar esta política ocasionalmente. Te notificaremos sobre
                  cambios significativos por email o mediante un aviso destacado en nuestro
                  servicio.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Contacto</h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  Si tienes preguntas sobre esta política de privacidad, puedes contactarnos:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Email: <a href="mailto:privacy@forum.ai" className="text-purple-400 hover:text-purple-300">privacy@forum.ai</a></li>
                  <li>Dirección: Forum AI, Madrid, España</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="container mx-auto text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Forum. Todos los derechos reservados.</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Link href="/privacy" className="text-purple-400">Privacidad</Link>
            <Link href="/terms" className="hover:text-white">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
