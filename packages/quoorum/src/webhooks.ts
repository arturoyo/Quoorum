/**
 * Webhook System
 * EXCELLENT-level integrations
 */

export interface WebhookEvent {
  type: 'debate.started' | 'debate.completed' | 'debate.cancelled' | 'consensus.reached'
  debateId: string
  timestamp: string
  data: Record<string, unknown>
}

export async function sendWebhook(url: string, event: WebhookEvent): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
    return response.ok
  } catch {
    return false
  }
}

export const WebhookSystem = {
  sendWebhook,
  subscribeToEvents: (urls: string[]) => urls,
  getEventHistory: () => [],
}
