import { Resend } from "resend";
import { logWarning, logError, logInfo } from "@/lib/monitoring";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

if (!resend && process.env.NODE_ENV === "development") {
  logWarning("RESEND_API_KEY is not set. Emails will not be sent.");
}

const FROM_EMAIL = process.env.FROM_EMAIL || "Quoorum <noreply@quoorum.ai>";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!resend) {
    logInfo("Email not sent (Resend not configured)", { subject: options.subject });
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "Email", to: options.to });
    return false;
  }
}

// Predefined email templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: "¡Bienvenido a Quoorum!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #e2e8f0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 40px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; background-color: #9333ea; padding: 12px; border-radius: 12px;">
                <span style="color: white; font-size: 24px;">💬</span>
              </div>
              <h1 style="color: white; margin-top: 16px; font-size: 28px;">Quoorum</h1>
            </div>

            <h2 style="color: white; font-size: 24px; margin-bottom: 16px;">
              ¡Hola ${name}!
            </h2>

            <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
              Gracias por unirte a Quoorum. Estás a un paso de tomar mejores decisiones
              con la ayuda de nuestros expertos IA.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                 style="display: inline-block; background-color: #9333ea; color: white;
                        padding: 14px 32px; border-radius: 8px; text-decoration: none;
                        font-weight: 600;">
                Ir al Dashboard
              </a>
            </div>

            <p style="color: #64748b; font-size: 14px; margin-top: 32px; text-align: center;">
              ¿Tienes preguntas? Responde a este email, estamos para ayudarte.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `¡Hola ${name}!\n\nGracias por unirte a Quoorum. Estás a un paso de tomar mejores decisiones con la ayuda de nuestros expertos IA.\n\nVe al dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  }),

  debateCompleted: (name: string, debateQuestion: string, consensusScore: number) => ({
    subject: "Tu debate ha finalizado",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #e2e8f0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 40px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; background-color: #22c55e; padding: 12px; border-radius: 12px;">
                <span style="color: white; font-size: 24px;">✓</span>
              </div>
            </div>

            <h2 style="color: white; font-size: 24px; margin-bottom: 16px;">
              ¡Tu debate ha finalizado!
            </h2>

            <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
              Hola ${name}, los expertos han alcanzado una conclusión sobre tu pregunta.
            </p>

            <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0;">Tu pregunta:</p>
              <p style="color: white; font-size: 16px; margin: 0;">${debateQuestion}</p>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <div style="display: inline-block; background-color: #9333ea20; border-radius: 12px; padding: 20px 40px;">
                <p style="color: #a855f7; font-size: 14px; margin: 0 0 8px 0;">Consenso alcanzado</p>
                <p style="color: white; font-size: 36px; font-weight: bold; margin: 0;">${consensusScore}%</p>
              </div>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/debates"
                 style="display: inline-block; background-color: #9333ea; color: white;
                        padding: 14px 32px; border-radius: 8px; text-decoration: none;
                        font-weight: 600;">
                Ver Resultados Completos
              </a>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `¡Tu debate ha finalizado!\n\nHola ${name}, los expertos han alcanzado una conclusión.\n\nPregunta: ${debateQuestion}\nConsenso: ${consensusScore}%\n\nVer resultados: ${process.env.NEXT_PUBLIC_APP_URL}/debates`,
  }),

  passwordReset: (resetLink: string) => ({
    subject: "Restablecer tu contraseña",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #e2e8f0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 40px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; background-color: #9333ea; padding: 12px; border-radius: 12px;">
                <span style="color: white; font-size: 24px;">🔑</span>
              </div>
            </div>

            <h2 style="color: white; font-size: 24px; margin-bottom: 16px;">
              Restablecer contraseña
            </h2>

            <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
              Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en
              el botón de abajo para crear una nueva.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}"
                 style="display: inline-block; background-color: #9333ea; color: white;
                        padding: 14px 32px; border-radius: 8px; text-decoration: none;
                        font-weight: 600;">
                Restablecer Contraseña
              </a>
            </div>

            <p style="color: #64748b; font-size: 14px; margin-top: 32px;">
              Si no solicitaste este cambio, puedes ignorar este email. El enlace
              expirará en 24 horas.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Restablecer contraseña\n\nHemos recibido una solicitud para restablecer tu contraseña.\n\nRestablecer: ${resetLink}\n\nSi no solicitaste este cambio, ignora este email.`,
  }),

  subscriptionUpdated: (name: string, planName: string, amount: number) => ({
    subject: `Tu suscripción a ${planName} está activa`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #e2e8f0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 40px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; background-color: #22c55e; padding: 12px; border-radius: 12px;">
                <span style="color: white; font-size: 24px;">⚡</span>
              </div>
            </div>

            <h2 style="color: white; font-size: 24px; margin-bottom: 16px;">
              ¡Gracias por actualizar a ${planName}!
            </h2>

            <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
              Hola ${name}, tu suscripción ha sido activada. Ya puedes disfrutar de
              todas las características de tu nuevo plan.
            </p>

            <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="color: #64748b; font-size: 14px; margin: 0 0 4px 0;">Plan</p>
                  <p style="color: white; font-size: 18px; font-weight: 600; margin: 0;">${planName}</p>
                </div>
                <div style="text-align: right;">
                  <p style="color: #64748b; font-size: 14px; margin: 0 0 4px 0;">Precio</p>
                  <p style="color: white; font-size: 18px; font-weight: 600; margin: 0;">$${amount}/mes</p>
                </div>
              </div>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                 style="display: inline-block; background-color: #9333ea; color: white;
                        padding: 14px 32px; border-radius: 8px; text-decoration: none;
                        font-weight: 600;">
                Ir al Dashboard
              </a>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `¡Gracias por actualizar a ${planName}!\n\nHola ${name}, tu suscripción ha sido activada.\n\nPlan: ${planName}\nPrecio: $${amount}/mes\n\nIr al dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  }),
};

// Helper functions for sending specific emails
export async function sendWelcomeEmail(to: string, name: string) {
  const template = emailTemplates.welcome(name);
  return sendEmail({ to, ...template });
}

export async function sendDebateCompletedEmail(
  to: string,
  name: string,
  debateQuestion: string,
  consensusScore: number
) {
  const template = emailTemplates.debateCompleted(name, debateQuestion, consensusScore);
  return sendEmail({ to, ...template });
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const template = emailTemplates.passwordReset(resetLink);
  return sendEmail({ to, ...template });
}

export async function sendSubscriptionUpdatedEmail(
  to: string,
  name: string,
  planName: string,
  amount: number
) {
  const template = emailTemplates.subscriptionUpdated(name, planName, amount);
  return sendEmail({ to, ...template });
}
