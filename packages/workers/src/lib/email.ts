/**
 * Email utility for workers
 *
 * Uses Resend to send emails. Fails gracefully if RESEND_API_KEY is not configured.
 */

import { Resend } from 'resend'
import { logger } from './logger'

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.FROM_EMAIL || 'Quoorum <noreply@quoorum.ai>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://quoorum.ai'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    logger.warn('Email not sent (RESEND_API_KEY not configured)', { subject: options.subject })
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    if (result.error) {
      logger.error('Failed to send email', { to: options.to, error: result.error.message })
      return { success: false, error: result.error.message }
    }

    logger.info('Email sent successfully', { to: options.to, subject: options.subject, id: result.data?.id })
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error('Failed to send email', { to: options.to, error: message })
    return { success: false, error: message }
  }
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export function getReferralInviteEmailHtml(
  referrerName: string,
  code: string,
  customMessage?: string
): string {
  const signupUrl = `${APP_URL}/signup?ref=${code}`

  return `
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
              <span style="color: white; font-size: 24px;">🎁</span>
            </div>
            <h1 style="color: white; margin-top: 16px; font-size: 28px;">Quoorum</h1>
          </div>

          <h2 style="color: white; font-size: 24px; margin-bottom: 16px;">
            ${referrerName} te invita a Quoorum
          </h2>

          ${customMessage ? `
            <div style="background-color: #0f172a; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #9333ea;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0; font-style: italic;">
                "${customMessage}"
              </p>
            </div>
          ` : ''}

          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
            ${referrerName} cree que te encantara Quoorum - la plataforma donde expertos IA
            te ayudan a tomar mejores decisiones estrategicas.
          </p>

          <div style="background-color: #9333ea20; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="color: #a855f7; font-size: 14px; margin: 0 0 8px 0;">Tu codigo de invitacion:</p>
            <p style="color: white; font-size: 28px; font-weight: bold; margin: 0; font-family: monospace;">${code}</p>
          </div>

          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
            Al registrarte con este codigo, ambos recibiran beneficios exclusivos.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${signupUrl}"
               style="display: inline-block; background-color: #9333ea; color: white;
                      padding: 14px 32px; border-radius: 8px; text-decoration: none;
                      font-weight: 600;">
              Registrarme Ahora
            </a>
          </div>

          <p style="color: #64748b; font-size: 14px; margin-top: 32px; text-align: center;">
            Esta invitacion expira en 30 dias.
          </p>
        </div>
      </body>
    </html>
  `
}

export function getReferralInviteEmailText(
  referrerName: string,
  code: string,
  customMessage?: string
): string {
  const signupUrl = `${APP_URL}/signup?ref=${code}`

  return `
${referrerName} te invita a Quoorum!

${customMessage ? `Mensaje de ${referrerName}: "${customMessage}"\n\n` : ''}
${referrerName} cree que te encantara Quoorum - la plataforma donde expertos IA te ayudan a tomar mejores decisiones estrategicas.

Tu codigo de invitacion: ${code}

Al registrarte con este codigo, ambos recibiran beneficios exclusivos.

Registrate aqui: ${signupUrl}

Esta invitacion expira en 30 dias.
`.trim()
}

export async function sendReferralInviteEmail(
  to: string,
  referrerName: string,
  code: string,
  customMessage?: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to,
    subject: `${referrerName} te invita a Quoorum`,
    html: getReferralInviteEmailHtml(referrerName, code, customMessage),
    text: getReferralInviteEmailText(referrerName, code, customMessage),
  })
}

// ============================================================================
// TEAM INVITATION EMAIL
// ============================================================================

export function getTeamInvitationEmailHtml(
  inviterName: string,
  invitationToken: string,
  role: string
): string {
  const acceptUrl = `${APP_URL}/team/accept?token=${invitationToken}`
  const roleLabel = role === 'admin' ? 'Administrador' : role === 'viewer' ? 'Visualizador' : 'Miembro'

  return `
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
              <span style="color: white; font-size: 24px;">👥</span>
            </div>
            <h1 style="color: white; margin-top: 16px; font-size: 28px;">Quoorum</h1>
          </div>

          <h2 style="color: white; font-size: 24px; margin-bottom: 16px;">
            ${inviterName} te invita a su equipo
          </h2>

          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
            Has sido invitado a unirte al equipo de ${inviterName} en Quoorum
            con el rol de <strong style="color: #a855f7;">${roleLabel}</strong>.
          </p>

          <div style="background-color: #9333ea20; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="color: #a855f7; font-size: 14px; margin: 0 0 8px 0;">Beneficios del equipo:</p>
            <ul style="color: #94a3b8; margin: 0; padding-left: 20px;">
              <li>Creditos compartidos</li>
              <li>Debates colaborativos</li>
              <li>Historial de decisiones del equipo</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${acceptUrl}"
               style="display: inline-block; background-color: #9333ea; color: white;
                      padding: 14px 32px; border-radius: 8px; text-decoration: none;
                      font-weight: 600;">
              Aceptar Invitacion
            </a>
          </div>

          <p style="color: #64748b; font-size: 14px; margin-top: 32px; text-align: center;">
            Esta invitacion expira en 7 dias.
          </p>
        </div>
      </body>
    </html>
  `
}

export function getTeamInvitationEmailText(
  inviterName: string,
  invitationToken: string,
  role: string
): string {
  const acceptUrl = `${APP_URL}/team/accept?token=${invitationToken}`
  const roleLabel = role === 'admin' ? 'Administrador' : role === 'viewer' ? 'Visualizador' : 'Miembro'

  return `
${inviterName} te invita a su equipo en Quoorum!

Has sido invitado con el rol de ${roleLabel}.

Beneficios del equipo:
- Creditos compartidos
- Debates colaborativos
- Historial de decisiones del equipo

Acepta la invitacion aqui: ${acceptUrl}

Esta invitacion expira en 7 dias.
`.trim()
}

export async function sendTeamInvitationEmail(
  to: string,
  inviterName: string,
  invitationToken: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to,
    subject: `${inviterName} te invita a su equipo en Quoorum`,
    html: getTeamInvitationEmailHtml(inviterName, invitationToken, role),
    text: getTeamInvitationEmailText(inviterName, invitationToken, role),
  })
}
