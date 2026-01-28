/**
 * Messaging Integrations
 *
 * Slack and Discord integrations for debate notifications
 */

import type { DebateResult } from '../types'
import { quoorumLogger } from '../quoorum-logger'

// ============================================================================
// SLACK INTEGRATION
// ============================================================================

const SLACK_WEBHOOK_URL = process.env['SLACK_WEBHOOK_URL']
const SLACK_BOT_TOKEN = process.env['SLACK_BOT_TOKEN']

interface SlackAttachment {
  color?: string
  fields?: Array<{
    title?: string
    value?: string
    short?: boolean
  }>
  [key: string]: unknown
}

export async function sendSlackNotification(
  message: string,
  options: {
    channel?: string
    username?: string
    iconEmoji?: string
    attachments?: SlackAttachment[]
  } = {}
): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL && !SLACK_BOT_TOKEN) {
    quoorumLogger.warn('Slack not configured')
    return false
  }

  try {
    const payload = {
      text: message,
      username: options.username || 'Forum Bot',
      icon_emoji: options.iconEmoji || ':robot_face:',
      channel: options.channel,
      attachments: options.attachments,
    }

    const url = SLACK_WEBHOOK_URL || 'https://slack.com/api/chat.postMessage'
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (SLACK_BOT_TOKEN) {
      headers['Authorization'] = `Bearer ${SLACK_BOT_TOKEN}`
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`)
    }

    return true
  } catch (error) {
    quoorumLogger.error(
      'Failed to send Slack notification',
      error instanceof Error ? error : new Error(String(error))
    )
    return false
  }
}

export async function notifyDebateStarted(
  debate: { id: string; question: string },
  channel?: string
): Promise<boolean> {
  const message = `[INFO] *Nuevo debate iniciado*\n\n*Pregunta:* ${debate.question}\n*ID:* ${debate.id}`

  return sendSlackNotification(message, {
    channel,
    attachments: [
      {
        color: '#3AA3E3',
        fields: [
          {
            title: 'Estado',
            value: 'En progreso',
            short: true,
          },
        ],
      },
    ],
  })
}

export async function notifyDebateCompleted(
  debate: DebateResult,
  channel?: string
): Promise<boolean> {
  const topOption = debate.ranking?.[0]
  const consensusEmoji =
    debate.consensusScore >= 0.9 ? '[INFO]' : debate.consensusScore >= 0.7 ? '[OK]' : '[WARN]'

  const message = `${consensusEmoji} *Debate completado*\n\n*Pregunta:* ${debate.question}\n*Consenso:* ${(debate.consensusScore * 100).toFixed(0)}%\n*Top Recomendación:* ${topOption?.option || 'N/A'}`

  const attachments = []

  if (debate.ranking && debate.ranking.length > 0) {
    const fields = debate.ranking.slice(0, 3).map((option, i) => ({
      title: `${i + 1}. ${option.option}`,
      value: `Success Rate: ${option.successRate.toFixed(1)}%`,
      short: true,
    }))

    attachments.push({
      color: debate.consensusScore >= 0.7 ? '#36A64F' : '#FF9900',
      fields,
    })
  }

  return sendSlackNotification(message, {
    channel,
    attachments,
  })
}

// ============================================================================
// DISCORD INTEGRATION
// ============================================================================

const DISCORD_WEBHOOK_URL = process.env['DISCORD_WEBHOOK_URL']

interface DiscordEmbed {
  title?: string
  color?: number
  fields?: Array<{
    name: string
    value: string
    inline?: boolean
  }>
  timestamp?: string
  [key: string]: unknown
}

export async function sendDiscordNotification(
  content: string,
  options: {
    username?: string
    avatarUrl?: string
    embeds?: DiscordEmbed[]
  } = {}
): Promise<boolean> {
  if (!DISCORD_WEBHOOK_URL) {
    quoorumLogger.warn('Discord not configured')
    return false
  }

  try {
    const payload = {
      content,
      username: options.username || 'Forum Bot',
      avatar_url: options.avatarUrl,
      embeds: options.embeds,
    }

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.statusText}`)
    }

    return true
  } catch (error) {
    quoorumLogger.error(
      'Failed to send Discord notification',
      error instanceof Error ? error : new Error(String(error))
    )
    return false
  }
}

export async function notifyDiscordDebateStarted(debate: {
  id: string
  question: string
}): Promise<boolean> {
  const content = '[INFO] **Nuevo debate iniciado**'

  const embeds = [
    {
      title: debate.question,
      color: 0x3aa3e3,
      fields: [
        {
          name: 'ID',
          value: debate.id,
          inline: true,
        },
        {
          name: 'Estado',
          value: 'En progreso',
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    },
  ]

  return sendDiscordNotification(content, { embeds })
}

export async function notifyDiscordDebateCompleted(debate: DebateResult): Promise<boolean> {
  const topOption = debate.ranking?.[0]
  const consensusEmoji =
    debate.consensusScore >= 0.9 ? '[INFO]' : debate.consensusScore >= 0.7 ? '[OK]' : '[WARN]'

  const content = `${consensusEmoji} **Debate completado**`

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    {
      name: 'Pregunta',
      value: debate.question || '',
      inline: false,
    },
    {
      name: 'Consenso',
      value: `${(debate.consensusScore * 100).toFixed(0)}%`,
      inline: true,
    },
    {
      name: 'Rondas',
      value: `${debate.rounds?.length || 0}`,
      inline: true,
    },
  ]

  if (topOption) {
    fields.push({
      name: 'Top Recomendación',
      value: `${topOption.option} (${topOption.successRate.toFixed(1)}%)`,
      inline: false,
    })
  }

  const embeds: DiscordEmbed[] = [
    {
      title: 'Resultados del Debate',
      color: debate.consensusScore >= 0.7 ? 0x36a64f : 0xff9900,
      fields,
      timestamp: new Date().toISOString(),
    },
  ]

  return sendDiscordNotification(content, { embeds })
}

// ============================================================================
// UNIFIED NOTIFICATION
// ============================================================================

export async function notifyAllChannels(
  type: 'debate-started' | 'debate-completed',
  data: { id: string; question: string } | DebateResult,
  options: {
    slackChannel?: string
  } = {}
): Promise<{ slack: boolean; discord: boolean }> {
  const results = {
    slack: false,
    discord: false,
  }

  switch (type) {
    case 'debate-started':
      results.slack = await notifyDebateStarted(
        data as { id: string; question: string },
        options.slackChannel
      )
      results.discord = await notifyDiscordDebateStarted(data as { id: string; question: string })
      break

    case 'debate-completed':
      results.slack = await notifyDebateCompleted(data as DebateResult, options.slackChannel)
      results.discord = await notifyDiscordDebateCompleted(data as DebateResult)
      break
  }

  return results
}

// ============================================================================
// WEBHOOK MANAGEMENT
// ============================================================================

export interface WebhookConfig {
  id: string
  userId: string
  platform: 'slack' | 'discord'
  webhookUrl: string
  channel?: string
  events: Array<'debate-started' | 'debate-completed' | 'debate-failed'>
  enabled: boolean
  createdAt: Date
}

const webhooks = new Map<string, WebhookConfig>()

export function addWebhook(
  userId: string,
  platform: 'slack' | 'discord',
  webhookUrl: string,
  events: WebhookConfig['events'],
  channel?: string
): WebhookConfig {
  const id = `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const webhook: WebhookConfig = {
    id,
    userId,
    platform,
    webhookUrl,
    channel,
    events,
    enabled: true,
    createdAt: new Date(),
  }

  webhooks.set(id, webhook)
  return webhook
}

export function removeWebhook(id: string): boolean {
  return webhooks.delete(id)
}

export function listWebhooks(userId: string): WebhookConfig[] {
  return Array.from(webhooks.values()).filter((w) => w.userId === userId)
}

export async function triggerWebhooks(
  userId: string,
  event: WebhookConfig['events'][number],
  data: unknown
): Promise<void> {
  const userWebhooks = listWebhooks(userId).filter((w) => w.enabled && w.events.includes(event))

  for (const webhook of userWebhooks) {
    try {
      if (webhook.platform === 'slack') {
        await sendSlackNotification(JSON.stringify(data), {
          channel: webhook.channel,
        })
      } else if (webhook.platform === 'discord') {
        await sendDiscordNotification(JSON.stringify(data))
      }
    } catch (error) {
      quoorumLogger.error(
        `Failed to trigger webhook ${webhook.id}`,
        error instanceof Error ? error : new Error(String(error)),
        { webhookId: webhook.id }
      )
    }
  }
}

// ============================================================================
// SLASH COMMANDS (for Slack/Discord bots)
// ============================================================================

export function handleSlashCommand(command: string, _args: string[]): string {
  switch (command) {
    case '/forum-debate':
      return `Para crear un debate, usa: /forum-debate "tu pregunta aquí"`

    case '/forum-status':
      return `Debates activos: 3\nDebates completados hoy: 5`

    case '/forum-help':
      return `Comandos disponibles:
- /forum-debate "pregunta" - Crear nuevo debate
- /forum-status - Ver estado de debates
- /forum-list - Listar debates recientes
- /forum-help - Ver esta ayuda`

    default:
      return `Comando no reconocido. Usa /forum-help para ver comandos disponibles.`
  }
}
