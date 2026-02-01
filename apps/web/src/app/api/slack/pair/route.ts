/**
 * Slack Pairing Endpoint
 * Handles /quoorum-pair slash command from Slack.
 * Validates the pairing code and links the Slack workspace.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@quoorum/db'
import { integrationPairings } from '@quoorum/db/schema'
import { eq, and, gt } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const text = (formData.get('text') as string)?.trim()
    const teamId = formData.get('team_id') as string
    const teamDomain = formData.get('team_domain') as string
    const channelId = formData.get('channel_id') as string

    if (!text || text.length !== 8) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Usage: /quoorum-pair <8-CHAR-CODE>\nGenerate a code from Settings > Integrations in Quoorum.',
      })
    }

    const code = text.toUpperCase()

    // Find pending pairing
    const [pairing] = await db
      .select()
      .from(integrationPairings)
      .where(and(
        eq(integrationPairings.pairingCode, code),
        eq(integrationPairings.status, 'pending'),
        eq(integrationPairings.platform, 'slack'),
        gt(integrationPairings.expiresAt, new Date()),
      ))

    if (!pairing) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Invalid or expired pairing code. Generate a new one from Quoorum Settings > Integrations.',
      })
    }

    // Complete the pairing
    await db
      .update(integrationPairings)
      .set({
        status: 'completed',
        externalId: teamId,
        externalChannelId: channelId,
        externalName: teamDomain,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(integrationPairings.id, pairing.id))

    return NextResponse.json({
      response_type: 'in_channel',
      text: `Quoorum linked successfully to this workspace! Debates can now be triggered from this channel.`,
    })
  } catch {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'An error occurred. Please try again.',
    }, { status: 500 })
  }
}
