/**
 * Billing Router
 *
 * Handles Stripe checkout sessions and credit purchases
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import Stripe from 'stripe'
import { router, protectedProcedure } from '../trpc'
import { env } from '../env'
import { db } from '@quoorum/db'
import { usage, subscriptions, users, plans } from '@quoorum/db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import { logger } from '../lib/logger'

// ============================================================================
// STRIPE CLIENT
// ============================================================================

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createCheckoutSessionSchema = z.object({
  planId: z.enum(['free', 'starter', 'pro', 'business']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

const purchaseCreditsSchema = z.object({
  amount: z.number().min(100).max(10000), // 100 to 10,000 credits
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

// ============================================================================
// PRICING CONFIGURATION
// ============================================================================

const PLAN_PRICES = {
  free: {
    monthly: 0,
    yearly: 0,
    credits: 1000,
    stripePriceId: null, // Free plan has no Stripe price
  },
  starter: {
    monthly: 2900, // $29/month (cents)
    yearly: 29000, // $290/year (16% discount)
    credits: 5000,
    stripePriceIdMonthly: env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    stripePriceIdYearly: env.STRIPE_STARTER_YEARLY_PRICE_ID,
  },
  pro: {
    monthly: 4900, // $49/month
    yearly: 49000, // $490/year
    credits: 10000,
    stripePriceIdMonthly: env.STRIPE_PRO_MONTHLY_PRICE_ID,
    stripePriceIdYearly: env.STRIPE_PRO_YEARLY_PRICE_ID,
  },
  business: {
    monthly: 9900, // $99/month
    yearly: 99000, // $990/year
    credits: 25000,
    stripePriceIdMonthly: env.STRIPE_BUSINESS_MONTHLY_PRICE_ID,
    stripePriceIdYearly: env.STRIPE_BUSINESS_YEARLY_PRICE_ID,
  },
}

// Credit packs (one-time purchases)
const CREDIT_PACKS = {
  100: {
    price: 100, // $1.00 (100 credits = $1)
    stripePriceId: env.STRIPE_CREDITS_100_PRICE_ID,
  },
  500: {
    price: 450, // $4.50 (10% discount)
    stripePriceId: env.STRIPE_CREDITS_500_PRICE_ID,
  },
  1000: {
    price: 850, // $8.50 (15% discount)
    stripePriceId: env.STRIPE_CREDITS_1000_PRICE_ID,
  },
  5000: {
    price: 4000, // $40.00 (20% discount)
    stripePriceId: env.STRIPE_CREDITS_5000_PRICE_ID,
  },
  10000: {
    price: 7500, // $75.00 (25% discount)
    stripePriceId: env.STRIPE_CREDITS_10000_PRICE_ID,
  },
}

// ============================================================================
// ROUTER
// ============================================================================

export const billingRouter = router({
  // --------------------------------------------------------------------------
  // CREATE CHECKOUT SESSION (Subscription)
  // --------------------------------------------------------------------------
  createCheckoutSession: protectedProcedure
    .input(createCheckoutSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const { planId, successUrl, cancelUrl } = input

      // Free plan doesn't require checkout
      if (planId === 'free') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Free plan does not require checkout',
        })
      }

      const plan = PLAN_PRICES[planId]

      try {
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [
            {
              price: plan.stripePriceIdMonthly, // Default to monthly
              quantity: 1,
            },
          ],
          success_url: successUrl || `${env.NEXT_PUBLIC_APP_URL}/account?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl || `${env.NEXT_PUBLIC_APP_URL}/account`,
          customer_email: ctx.user.email,
          metadata: {
            userId: ctx.userId,
            planId,
          },
          subscription_data: {
            metadata: {
              userId: ctx.userId,
              planId,
            },
          },
        })

        return {
          sessionId: session.id,
          url: session.url,
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create checkout session',
          cause: error,
        })
      }
    }),

  // --------------------------------------------------------------------------
  // PURCHASE CREDITS (One-time)
  // --------------------------------------------------------------------------
  purchaseCredits: protectedProcedure.input(purchaseCreditsSchema).mutation(async ({ ctx, input }) => {
    const { amount, successUrl, cancelUrl } = input

    // Find closest credit pack
    const packAmounts = Object.keys(CREDIT_PACKS)
      .map(Number)
      .sort((a, b) => a - b)
    const closestPack = packAmounts.reduce((prev, curr) =>
      Math.abs(curr - amount) < Math.abs(prev - amount) ? curr : prev
    )

    const pack = CREDIT_PACKS[closestPack as keyof typeof CREDIT_PACKS]

    if (!pack) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid credit amount',
      })
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price: pack.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: successUrl || `${env.NEXT_PUBLIC_APP_URL}/account?purchase=success`,
        cancel_url: cancelUrl || `${env.NEXT_PUBLIC_APP_URL}/account`,
        customer_email: ctx.user.email,
        metadata: {
          userId: ctx.userId,
          type: 'credit_purchase',
          credits: String(closestPack),
        },
      })

      return {
        sessionId: session.id,
        url: session.url,
        credits: closestPack,
        price: pack.price,
      }
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create credit purchase session',
        cause: error,
      })
    }
  }),

  // --------------------------------------------------------------------------
  // GET PRICING INFO
  // --------------------------------------------------------------------------
  getPricingInfo: protectedProcedure.query(() => {
    return {
      plans: PLAN_PRICES,
      creditPacks: CREDIT_PACKS,
    }
  }),

  // --------------------------------------------------------------------------
  // GET CURRENT PLAN
  // --------------------------------------------------------------------------
  getCurrentPlan: protectedProcedure.query(async ({ ctx }) => {
    return {
      tier: ctx.user.tier,
      credits: ctx.user.credits,
    }
  }),

  // --------------------------------------------------------------------------
  // GET MY USAGE HISTORY
  // --------------------------------------------------------------------------
  getMyUsageHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const results = await db
        .select()
        .from(usage)
        .where(eq(usage.userId, ctx.userId))
        .orderBy(desc(usage.periodStart))
        .limit(input.limit)
        .offset(input.offset)

      return results
    }),

  // --------------------------------------------------------------------------
  // GET MY SUBSCRIPTIONS (Payment History)
  // --------------------------------------------------------------------------
  getMySubscriptions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const results = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.userId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      return results
    }),
})

// ============================================================================
// WEBHOOK HANDLER (exported for Next.js API route)
// ============================================================================

/**
 * Handles Stripe webhook events
 * @param payload - Raw request body from Stripe
 * @param signature - Stripe signature header
 * @returns Success or error response
 */
export async function handleStripeWebhook(payload: string | Buffer, signature: string) {
  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    logger.error('Webhook signature verification failed', err instanceof Error ? err : new Error(String(err)))
    return { success: false, error: 'Invalid signature' }
  }

  logger.info('Stripe webhook received', { eventType: event.type })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
          // Handle subscription payment
          await handleSubscriptionPayment(session)
        } else if (session.mode === 'payment' && session.metadata?.type === 'credit_purchase') {
          // Handle one-time credit purchase
          await handleCreditPurchase(session)
        }

        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice

        // Renew subscription credits
        await handleInvoicePaid(invoice)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Downgrade user to free plan
        await handleSubscriptionCanceled(subscription)

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Update subscription status (e.g., past_due, canceled)
        await handleSubscriptionUpdated(subscription)

        break
      }

      default:
        logger.info('Stripe webhook unhandled event', { eventType: event.type })
    }

    return { success: true }
  } catch (error) {
    logger.error(`Stripe webhook error processing ${event.type}`, error instanceof Error ? error : new Error(String(error)))
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// WEBHOOK EVENT HANDLERS
// ============================================================================

async function handleSubscriptionPayment(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const planId = session.metadata?.planId as keyof typeof PLAN_PRICES

  if (!userId || !planId) {
    throw new Error('Missing userId or planId in session metadata')
  }

  logger.info('Webhook processing subscription payment', { userId, planId })

  const plan = PLAN_PRICES[planId]

  // 1. Create or update subscription record
  const stripeSubscriptionId = session.subscription as string
  const stripeCustomerId = session.customer as string

  const [existingSub] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId)))
    .limit(1)

  if (existingSub) {
    // Update existing subscription
    await db
      .update(subscriptions)
      .set({
        status: 'active',
        currentPeriodStart: new Date(session.created * 1000),
        currentPeriodEnd: new Date((session.created + 30 * 24 * 60 * 60) * 1000), // Approx 30 days
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, existingSub.id))
  } else {
    // Get plan ID from DB (we need the actual UUID)
    const [dbPlan] = await db.select().from(plans).where(eq(plans.tier, planId)).limit(1)

    if (!dbPlan) {
      throw new Error(`Plan ${planId} not found in database`)
    }

    // Create new subscription
    await db.insert(subscriptions).values({
      userId,
      planId: dbPlan.id,
      status: 'active',
      stripeCustomerId,
      stripeSubscriptionId,
      currentPeriodStart: new Date(session.created * 1000),
      currentPeriodEnd: new Date((session.created + 30 * 24 * 60 * 60) * 1000),
      monthlyCredits: plan.credits,
    })
  }

  // 2. Update user tier and add credits
  await db
    .update(users)
    .set({
      tier: planId,
      credits: sql`${users.credits} + ${plan.credits}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  logger.info('Webhook subscription activated', { userId, planId, creditsAdded: plan.credits })
}

async function handleCreditPurchase(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const creditsStr = session.metadata?.credits

  if (!userId || !creditsStr) {
    throw new Error('Missing userId or credits in session metadata')
  }

  const credits = parseInt(creditsStr, 10)

  logger.info('Webhook processing credit purchase', { userId, credits })

  // Add credits to user account
  await db
    .update(users)
    .set({
      credits: sql`${users.credits} + ${credits}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  logger.info('Webhook credits added', { userId, credits })
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const userId = invoice.subscription_details?.metadata?.userId

  if (!userId) {
    logger.warn('Webhook invoice missing userId', {})
    return
  }

  logger.info('Webhook processing invoice paid', { userId })

  // Get current subscription to know the monthly credit allocation
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
    .limit(1)

  if (!sub) {
    logger.warn('Webhook no active subscription for renewal', {})
    return
  }

  // Renew monthly credits
  await db
    .update(users)
    .set({
      credits: sql`${users.credits} + ${sub.monthlyCredits}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  // Update subscription period
  await db
    .update(subscriptions)
    .set({
      currentPeriodStart: new Date(invoice.period_start * 1000),
      currentPeriodEnd: new Date(invoice.period_end * 1000),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, sub.id))

  logger.info('Webhook credits renewed', { userId, monthlyCredits: sub.monthlyCredits })
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId

  if (!userId) {
    throw new Error('Missing userId in subscription metadata')
  }

  logger.info('Webhook processing subscription cancellation', { userId })

  // Update subscription status
  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id))

  // Downgrade user to free tier (but keep their remaining credits)
  await db
    .update(users)
    .set({
      tier: 'free',
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  logger.info('Webhook subscription canceled', { userId, tier: 'free' })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.info('Webhook processing subscription update', { subscriptionId: subscription.id })

  // Map Stripe status to our enum
  const statusMap: Record<string, string> = {
    active: 'active',
    canceled: 'canceled',
    past_due: 'past_due',
    trialing: 'trialing',
    paused: 'paused',
    unpaid: 'unpaid',
  }

  const status = statusMap[subscription.status] || 'active'

  // Update subscription status
  await db
    .update(subscriptions)
    .set({
      status: status as any,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id))

  logger.info('Webhook subscription updated', { subscriptionId: subscription.id, status })
}
