import { Shield, Database, Eye, Lock, UserCheck, Cookie, Clock, RefreshCw, Mail } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { LandingFooter } from "@/components/layout/landing-footer";

export const metadata = {
  title: "Política de Privacidad - Quoorum",
  description: "Política de privacidad de Quoorum",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--theme-landing-bg)]">
      {/* Header */}
      <AppHeader variant="landing" showAuth={true} />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 border-b border-white/5">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[var(--theme-text-secondary)] mb-6">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Legal</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Política de{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Privacidad
              </span>
            </h1>

            <p className="text-xl text-[var(--theme-text-secondary)] max-w-2xl mx-auto">
              Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="space-y-12">
          {/* Sección 1: Información que Recopilamos */}
          <section id="informacion" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                  <Database className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">1. Información que Recopilamos</h2>
              </div>
              <div className="text-[var(--theme-text-secondary)] space-y-4">
                <p>
                  En Quoorum, recopilamos información que nos proporcionas directamente:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Información de cuenta: nombre, email, contraseña</li>
                  <li>Información de perfil: foto, cargo, empresa</li>
                  <li>Contenido de debates: preguntas, respuestas, decisiones</li>
                  <li>Información de pago: procesada de forma segura por Stripe</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Sección 2: Cómo Usamos tu Información */}
          <section id="uso" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">2. Cómo Usamos tu Información</h2>
              </div>
              <div className="text-[var(--theme-text-secondary)] space-y-4">
                <p>Utilizamos la información recopilada para:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Proporcionar y mantener nuestros servicios</li>
                  <li>Procesar transacciones y enviar notificaciones relacionadas</li>
                  <li>Responder a tus comentarios y preguntas</li>
                  <li>Mejorar nuestros servicios y desarrollar nuevas funcionalidades</li>
                  <li>Enviar comunicaciones de marketing (con tu consentimiento)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Sección 3: Compartir Información */}
          <section id="compartir" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-pink-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">3. Compartir Información</h2>
              </div>
              <div className="text-[var(--theme-text-secondary)] space-y-4">
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
            </div>
          </section>

          {/* Sección 4: Seguridad de Datos */}
          <section id="seguridad" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">4. Seguridad de Datos</h2>
              </div>
              <div className="text-[var(--theme-text-secondary)] space-y-4">
                <p>
                  Implementamos medidas de seguridad técnicas y organizativas para proteger
                  tu información:
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-green-400 font-semibold mb-2">🔐 Encriptación</div>
                    <p className="text-sm">TLS 1.3 en tránsito y AES-256 en reposo</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-green-400 font-semibold mb-2">👥 Acceso</div>
                    <p className="text-sm">Acceso restringido basado en roles</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-green-400 font-semibold mb-2">🔍 Auditorías</div>
                    <p className="text-sm">Auditorías de seguridad regulares</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-green-400 font-semibold mb-2">💾 Backups</div>
                    <p className="text-sm">Backups automáticos y encriptados</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Sección 5: Tus Derechos */}
          <section id="derechos" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">5. Tus Derechos</h2>
              </div>
              <div className="text-[var(--theme-text-secondary)] space-y-4">
                <p>Tienes derecho a:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Acceder a tus datos personales</li>
                  <li>Rectificar datos incorrectos</li>
                  <li>Solicitar la eliminación de tus datos</li>
                  <li>Exportar tus datos en formato portable</li>
                  <li>Oponerte al procesamiento de tus datos</li>
                  <li>Retirar tu consentimiento en cualquier momento</li>
                </ul>
                <p className="mt-4">
                  Para ejercer estos derechos, contacta con nosotros en{" "}
                  <a href="mailto:privacy@quoorum.com" className="text-purple-400 hover:text-purple-300 underline underline-offset-4">
                    privacy@quoorum.com
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Sección 6: Cookies */}
          <section id="cookies" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                  <Cookie className="w-6 h-6 text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">6. Cookies</h2>
              </div>
              <div className="text-[var(--theme-text-secondary)] space-y-4">
                <p>
                  Utilizamos cookies esenciales para el funcionamiento del servicio y cookies
                  analíticas para mejorar la experiencia. Puedes gestionar tus preferencias
                  de cookies en cualquier momento.
                </p>
              </div>
            </div>
          </section>

          {/* Sección 7: Retención de Datos */}
          <section id="retencion" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">7. Retención de Datos</h2>
              </div>
              <div className="text-[var(--theme-text-secondary)] space-y-4">
                <p>
                  Conservamos tus datos mientras tu cuenta esté activa o según sea necesario
                  para proporcionarte servicios. Puedes solicitar la eliminación de tu cuenta
                  y datos en cualquier momento.
                </p>
              </div>
            </div>
          </section>

          {/* Sección 8: Cambios a esta Política */}
          <section id="cambios" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-teal-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">8. Cambios a esta Política</h2>
              </div>
              <div className="text-[var(--theme-text-secondary)] space-y-4">
                <p>
                  Podemos actualizar esta política ocasionalmente. Te notificaremos sobre
                  cambios significativos por email o mediante un aviso destacado en nuestro
                  servicio.
                </p>
              </div>
            </div>
          </section>

          {/* Sección 9: Contacto */}
          <section id="contacto" className="scroll-mt-32">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-cyan-500/10 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">9. Contacto</h2>
              </div>
              <div className="text-[var(--theme-text-secondary)] space-y-4">
                <p>
                  Si tienes preguntas sobre esta política de privacidad, puedes contactarnos:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-purple-400" />
                    <a href="mailto:privacy@quoorum.com" className="text-purple-400 hover:text-purple-300">
                      privacy@quoorum.com
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
