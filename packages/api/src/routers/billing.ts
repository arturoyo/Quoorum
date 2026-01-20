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
import { usage, subscriptions } from '@quoorum/db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'

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
