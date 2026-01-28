/**
 * Referral Invites Workers
 *
 * Inngest functions for sending referral invitations via email
 */

import { inngest } from '../client'
import { logger } from '../lib/logger'
import { sendReferralInviteEmail } from '../lib/email'
import { db } from '@quoorum/db'
import { profiles, referrals } from '@quoorum/db/schema'
import { eq } from 'drizzle-orm'
import type { Inngest } from 'inngest'

// ============================================================================
// HELPER: Get referrer info
// ============================================================================

async function getReferrerInfo(referrerId: string): Promise<{ name: string | null; email: string | null } | null> {
  const result = await db
    .select({
      name: profiles.name,
      email: profiles.email,
    })
    .from(profiles)
    .where(eq(profiles.id, referrerId))
    .limit(1)

  return result[0] || null
}

// ============================================================================
// EMAIL INVITE
// ============================================================================

export const sendEmailInvite = (inngest as unknown as Inngest).createFunction(
  {
    id: 'referrals/send-email-invite',
    name: 'Send Email Referral Invite',
    retries: 3,
  },
  { event: 'referrals/invite.email' },
  async ({ event, step }: { event: any; step: any }) => {
    const { referralId, email, code, message, referrerId } = event.data

    // Get referrer info
    const referrerInfo = await step.run('get-referrer-info', async () => {
      if (!referrerId) {
        logger.warn('No referrerId provided', { referralId })
        return { name: 'Un amigo', email: '' }
      }
      const info = await getReferrerInfo(referrerId)
      return info || { name: 'Un amigo', email: '' }
    })

    // Send the email
    await step.run('send-email', async () => {
      const emailResult = await sendReferralInviteEmail(
        email,
        referrerInfo.name || 'Un amigo',
        code,
        message
      )

      if (!emailResult.success) {
        logger.error('Failed to send referral email', {
          referralId,
          email,
          error: emailResult.error,
        })
        throw new Error(emailResult.error || 'Failed to send email')
      }

      return emailResult
    })

    // Update referral record with sent timestamp
    await step.run('update-referral', async () => {
      await db
        .update(referrals)
        .set({
          invitationSentAt: new Date(),
          invitationMethod: 'email',
          updatedAt: new Date(),
        })
        .where(eq(referrals.id, referralId))
    })

    logger.info('Referral email sent successfully', {
      referralId,
      email,
      referrerName: referrerInfo.name,
    })

    return {
      success: true,
      referralId,
      method: 'email',
      sentTo: email,
    }
  }
)

// ============================================================================
// WHATSAPP INVITE (Placeholder - requires WhatsApp Business API)
// ============================================================================

export const sendWhatsappInvite = (inngest as unknown as Inngest).createFunction(
  {
    id: 'referrals/send-whatsapp-invite',
    name: 'Send WhatsApp Referral Invite',
    retries: 3,
  },
  { event: 'referrals/invite.whatsapp' },
  async ({ event, step }: { event: any; step: any }) => {
    const { referralId, phoneNumber, code, referrerId } = event.data

    // Add random delay to prevent spam detection (1-5 minutes)
    const delayMs = Math.floor(Math.random() * 4 * 60 * 1000) + 60 * 1000
    await step.sleep('random-delay', `${delayMs}ms`)

    // Get referrer info
    const referrerInfo = await step.run('get-referrer-info', async () => {
      if (!referrerId) return { name: 'Un amigo' }
      const info = await getReferrerInfo(referrerId)
      return info || { name: 'Un amigo' }
    })

    // TODO: Implement WhatsApp Business API integration
    // For now, log the invitation - WhatsApp requires business verification
    logger.info('WhatsApp invite queued (API integration pending)', {
      referralId,
      phoneNumber: phoneNumber ? `${phoneNumber.slice(0, 4)}****` : 'unknown',
      code,
      referrerName: referrerInfo.name,
    })

    // Update referral record
    await step.run('update-referral', async () => {
      await db
        .update(referrals)
        .set({
          invitationMethod: 'whatsapp',
          updatedAt: new Date(),
          metadata: {
            whatsappPending: true,
            queuedAt: new Date().toISOString(),
          },
        })
        .where(eq(referrals.id, referralId))
    })

    return {
      success: true,
      referralId,
      method: 'whatsapp',
      note: 'WhatsApp API integration pending - invitation logged',
    }
  }
)

// ============================================================================
// BATCH EMAIL INVITES
// ============================================================================

export const batchSendEmailInvites = (inngest as unknown as Inngest).createFunction(
  {
    id: 'referrals/batch-email-invites',
    name: 'Batch Send Email Referral Invites',
    retries: 2,
  },
  { event: 'referrals/invite.batch-email' },
  async ({ event, step }: { event: any; step: any }) => {
    const { invites, referrerId, code, message } = event.data

    // Get referrer info once
    const referrerInfo = await step.run('get-referrer-info', async () => {
      if (!referrerId) return { name: 'Un amigo', email: '' }
      const info = await getReferrerInfo(referrerId)
      return info || { name: 'Un amigo', email: '' }
    })

    // Process invitations with delays to avoid rate limits
    const results: Array<{ email: string; success: boolean; error?: string }> = []

    for (let i = 0; i < invites.length; i++) {
      const invite = invites[i]

      // Progressive delay: 5 seconds between each email
      if (i > 0) {
        await step.sleep(`delay-${i}`, '5s')
      }

      const result = await step.run(`send-email-${i}`, async () => {
        const emailResult = await sendReferralInviteEmail(
          invite.email,
          referrerInfo.name || 'Un amigo',
          code,
          message
        )

        // Update referral record if referralId provided
        if (invite.referralId && emailResult.success) {
          await db
            .update(referrals)
            .set({
              invitationSentAt: new Date(),
              invitationMethod: 'email',
              updatedAt: new Date(),
            })
            .where(eq(referrals.id, invite.referralId))
        }

        return {
          email: invite.email,
          ...emailResult,
        }
      })

      results.push(result)
    }

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    logger.info('Batch referral emails completed', {
      total: invites.length,
      success: successCount,
      failed: failCount,
    })

    return {
      success: failCount === 0,
      totalSent: successCount,
      totalFailed: failCount,
      results,
    }
  }
)
