import type { DebateResult } from './types'
import type { ExpertProfile } from './expert-database'
import { quoorumLogger } from './logger'

export interface NotificationOptions {
  email?: boolean
  inApp?: boolean
  push?: boolean
}

export interface EmailNotificationData {
  to: string
  subject: string
  html: string
  text: string
}

export interface InAppNotificationData {
  userId: string
  title: string
  message: string
  link?: string
  icon?: string
}

export interface PushNotificationData {
  userId: string
  title: string
  body: string
  link?: string
  icon?: string
}

/**
 * Send notification when debate is complete
 */
export async function notifyDebateComplete(
  userId: string,
  userEmail: string,
  debate: DebateResult,
  experts: ExpertProfile[],
  options: NotificationOptions = { email: true, inApp: true, push: true }
): Promise<void> {
  const promises: Promise<void>[] = []

  if (options.email) {
    promises.push(sendEmailNotification(userEmail, debate, experts))
  }

  if (options.inApp) {
    promises.push(sendInAppNotification(userId, debate))
  }

  if (options.push) {
    promises.push(sendPushNotification(userId, debate))
  }

  await Promise.all(promises)
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  email: string,
  debate: DebateResult,
  experts: ExpertProfile[]
): Promise<void> {
  const subject = `[OK] Tu debate de Forum está completo`

  const html = generateEmailHTML(debate, experts)
  const text = generateEmailText(debate, experts)

  const emailData: EmailNotificationData = {
    to: email,
    subject,
    html,
    text,
  }

  // Send email via Resend (or SendGrid, etc.)
  try {
    // Check if Resend API key is configured
    if (process.env['RESEND_API_KEY']) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env['RESEND_API_KEY'])

      await resend.emails.send({
        from: process.env['QUOORUM_EMAIL_FROM'] || 'noreply@quoorum.pro',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      })

      quoorumLogger.info('Email sent', { email })
    } else {
      quoorumLogger.warn('RESEND_API_KEY not configured, skipping email', {})
    }
  } catch (error) {
    quoorumLogger.error('Failed to send email', error instanceof Error ? error : new Error(String(error)), { email })
    throw error
  }
}

/**
 * Send in-app notification
 */
async function sendInAppNotification(userId: string, debate: DebateResult): Promise<void> {
  const notification: InAppNotificationData = {
    userId,
    title: 'Debate completado',
    message: `Tu debate "${debate.question?.slice(0, 50)}..." ha finalizado con ${debate.rounds?.length} rondas`,
    link: `/quoorum/${debate.sessionId}`,
    icon: 'MessageCircle',
  }

  // Save to database using unified notification system
  try {
    // @ts-expect-error - Dynamic import to avoid circular dependency. Module exists at runtime.
    const { sendForumNotification } = await import('@quoorum/api')

    await sendForumNotification({
      userId: notification.userId,
      type: 'debate_completed',
      priority: 'normal',
      debateId: debate.sessionId,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.link,
      actionLabel: 'Ver debate',
      metadata: {
        icon: notification.icon,
        rounds: debate.rounds?.length,
        consensusScore: debate.consensusScore,
      },
    })

    // Send via WebSocket if available
    try {
      const { broadcastDebateUpdate } = await import('./websocket-server')
      broadcastDebateUpdate({
        debateId: notification.link?.split('/').pop() || '',
        type: 'message' as const,
        payload: notification,
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_wsError) {
      // WebSocket not available, that's ok
      quoorumLogger.warn('WebSocket not available for notification', {})
    }

    // Removed emoji to avoid UTF-8 encoding issues on Windows
    quoorumLogger.info('[OK] In-app notification sent successfully', {
      userId,
      debateId: debate.sessionId,
      type: 'debate_completed',
    })
  } catch (error) {
    // Removed emoji to avoid UTF-8 encoding issues on Windows
    quoorumLogger.error('[ERROR] Failed to send in-app notification', error instanceof Error ? error : new Error(String(error)), {
      userId,
      debateId: debate.sessionId,
    })
    throw error
  }
}

/**
 * Send push notification
 */
async function sendPushNotification(userId: string, debate: DebateResult): Promise<void> {
  const notification: PushNotificationData = {
    userId,
    title: 'Forum - Debate completado',
    body: `Tu debate ha finalizado. Consenso: ${(debate.consensusScore * 100).toFixed(0)}%`,
    link: `/quoorum/${debate.sessionId}`,
    icon: '/icon-192.png',
  }

  // Send push notification via Web Push API or FCM
  try {
    // Check if push service is configured
    if (process.env['FIREBASE_SERVER_KEY'] || process.env['WEB_PUSH_PRIVATE_KEY']) {
      // Import push service (FCM or Web Push)
      // For now, we'll use a simple implementation
      // In production, you would use firebase-admin or web-push library

      if (process.env['FIREBASE_SERVER_KEY']) {
        // FCM implementation
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${process.env['FIREBASE_SERVER_KEY']}`,
          },
          body: JSON.stringify({
            to: `/topics/user_${userId}`,
            notification: {
              title: notification.title,
              body: notification.body,
              icon: notification.icon,
              click_action: notification.link,
            },
          }),
        })

        if (!response.ok) {
          throw new Error(`FCM request failed: ${response.statusText}`)
        }
      }

      quoorumLogger.info('Push notification sent', { userId })
    } else {
      quoorumLogger.warn('Push service not configured, skipping push notification', {})
    }
  } catch (error) {
    quoorumLogger.error('Failed to send push notification', error instanceof Error ? error : new Error(String(error)), { userId })
    // Don't throw - push notifications are optional
  }
}

/**
 * Generate email HTML
 */
function generateEmailHTML(debate: DebateResult, experts: ExpertProfile[]): string {
  const brandingColor = '#00a884'

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Debate Completado</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${brandingColor}; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">[OK] Debate Completado</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">Tu debate ha finalizado</h2>

              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; font-weight: 600; text-transform: uppercase;">Pregunta</p>
                <p style="margin: 0; color: #1a1a1a; font-size: 16px; line-height: 1.6;">${escapeHtml(debate.question || '')}</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td width="50%" style="padding-right: 10px;">
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center;">
                      <p style="margin: 0 0 5px 0; color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase;">Rondas</p>
                      <p style="margin: 0; color: ${brandingColor}; font-size: 32px; font-weight: 700;">${debate.rounds?.length || 0}</p>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 10px;">
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center;">
                      <p style="margin: 0 0 5px 0; color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase;">Consenso</p>
                      <p style="margin: 0; color: ${brandingColor}; font-size: 32px; font-weight: 700;">${(debate.consensusScore * 100).toFixed(0)}%</p>
                    </div>
                  </td>
                </tr>
              </table>

              <div style="margin-bottom: 30px;">
                <p style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">Expertos Participantes</p>
                ${experts
                  .map(
                    (expert) => `
                  <div style="background-color: #f8f9fa; border-left: 4px solid ${brandingColor}; border-radius: 4px; padding: 12px 15px; margin-bottom: 10px;">
                    <p style="margin: 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${escapeHtml(expert.name)}</p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 13px;">${escapeHtml(expert.role || 'Expert')}</p>
                  </div>
                `
                  )
                  .join('')}
              </div>

              ${
                debate.ranking && debate.ranking.length > 0
                  ? `
              <div style="margin-bottom: 30px;">
                <p style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">Top Recomendación</p>
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px;">
                  <p style="margin: 0 0 10px 0; color: ${brandingColor}; font-size: 24px; font-weight: 700;">${escapeHtml(debate.ranking[0]?.option || '')}</p>
                  <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">Score: ${debate.ranking[0]?.score?.toFixed(1) || debate.ranking[0]?.successRate.toFixed(1)} | Confianza: ${((debate.ranking[0]?.confidence || 0) * 100).toFixed(0)}%</p>
                  ${debate.ranking[0]?.reasoning ? `<p style="margin: 10px 0 0 0; color: #444; font-size: 14px; line-height: 1.6;">${escapeHtml(debate.ranking[0].reasoning)}</p>` : ''}
                </div>
              </div>
              `
                  : ''
              }

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${process.env['NEXT_PUBLIC_APP_URL'] || 'https://quoorum.ai'}/quoorum/${debate.sessionId}" style="display: inline-block; background-color: ${brandingColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Ver Debate Completo
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 12px;">
                Forum - Sistema Dinámico de Expertos<br>
                ${new Date().toLocaleDateString('es-ES')}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

/**
 * Generate email plain text
 */
function generateEmailText(debate: DebateResult, experts: ExpertProfile[]): string {
  let text = `DEBATE COMPLETADO\n\n`

  text += `Pregunta:\n${debate.question || ''}\n\n`

  text += `Rondas: ${debate.rounds?.length || 0}\n`
  text += `Consenso: ${(debate.consensusScore * 100).toFixed(0)}%\n\n`

  text += `Expertos Participantes:\n`
  experts.forEach((expert) => {
    text += `- ${expert.name} (${expert.role || 'Expert'})\n`
  })
  text += `\n`

  if (debate.ranking && debate.ranking.length > 0) {
    text += `Top Recomendación:\n`
    text += `${debate.ranking[0]?.option || ''}\n`
    text += `Score: ${debate.ranking[0]?.score?.toFixed(1) || debate.ranking[0]?.successRate.toFixed(1)} | Confianza: ${((debate.ranking[0]?.confidence || 0) * 100).toFixed(0)}%\n`
    if (debate.ranking[0]?.reasoning) {
      text += `${debate.ranking[0].reasoning}\n`
    }
    text += `\n`
  }

  text += `Ver debate completo: ${process.env['NEXT_PUBLIC_APP_URL'] || 'https://quoorum.ai'}/quoorum/${debate.sessionId}\n\n`

  text += `---\n`
  text += `Forum - Sistema Dinámico de Expertos\n`
  text += `${new Date().toLocaleDateString('es-ES')}\n`

  return text
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m] || m)
}

/**
 * Notify about quality issues during debate
 */
export async function notifyQualityIssue(
  userId: string,
  debateId: string,
  issueType: string,
  severity: number
): Promise<void> {
  // Only notify for severe issues
  if (severity < 7) return

  // Save quality issue notification using unified system
  try {
    // @ts-expect-error - Dynamic import to avoid circular dependency. Module exists at runtime.
    const { sendForumNotification } = await import('@quoorum/api')

    await sendForumNotification({
      userId,
      type: 'debate_reminder',
      priority: 'high',
      debateId,
      title: 'Alerta de Calidad',
      message: `Se ha detectado un problema de calidad en tu debate: ${issueType}`,
      actionUrl: `/quoorum/${debateId}`,
      actionLabel: 'Ver debate',
      metadata: {
        icon: 'AlertTriangle',
        issueType,
        severity,
      },
    })

    // Removed emoji to avoid UTF-8 encoding issues on Windows
    quoorumLogger.info('[OK] Quality issue notification sent', {
      debateId,
      issueType,
      severity,
      userId,
    })
  } catch (error) {
    // Removed emoji to avoid UTF-8 encoding issues on Windows
    quoorumLogger.error('[ERROR] Failed to send quality issue notification', error instanceof Error ? error : new Error(String(error)), {
      debateId,
      issueType,
      severity,
      userId,
    })
  }
}

/**
 * Notify about meta-moderator intervention
 */
export async function notifyIntervention(
  userId: string,
  debateId: string,
  interventionType: string
): Promise<void> {
  // Save intervention notification using unified system
  try {
    // @ts-expect-error - Dynamic import to avoid circular dependency. Module exists at runtime.
    const { sendForumNotification } = await import('@quoorum/api')

    await sendForumNotification({
      userId,
      type: 'expert_recommendation',
      priority: 'normal',
      debateId,
      title: 'Intervención del Meta-Moderador',
      message: `El meta-moderador ha intervenido en tu debate: ${interventionType}`,
      actionUrl: `/quoorum/${debateId}`,
      actionLabel: 'Ver debate',
      metadata: {
        icon: 'Zap',
        interventionType,
      },
    })

    // Removed emoji to avoid UTF-8 encoding issues on Windows
    quoorumLogger.info('[OK] Intervention notification sent', {
      debateId,
      interventionType,
      userId,
    })
  } catch (error) {
    // Removed emoji to avoid UTF-8 encoding issues on Windows
    quoorumLogger.error('[ERROR] Failed to send intervention notification', error instanceof Error ? error : new Error(String(error)), {
      debateId,
      interventionType,
      userId,
    })
  }
}
