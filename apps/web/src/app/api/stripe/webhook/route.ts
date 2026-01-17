import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { logError, logWarning } from "@/lib/monitoring";
import { db } from "@quoorum/db";
import { subscriptions, plans, usage, webhookEvents, users } from "@quoorum/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  checkWebhookRateLimit,
  getRateLimitHeaders,
  getClientIp,
} from "@/lib/rate-limit/webhook-limiter";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function getOrCreatePlan(planId: string) {
  const existingPlan = await db.query.plans.findFirst({
    where: eq(plans.id, planId),
  });

  if (existingPlan) return existingPlan;

  // Create default plans if they don't exist
  const defaultPlans = {
    free: {
      name: "Free",
      tier: "free" as const,
      monthlyPriceUsd: 0,
      yearlyPriceUsd: 0,
      debatesPerMonth: 5,
      maxExperts: 4,
      maxRoundsPerDebate: 3,
      maxTeamMembers: 1,
    },
    pro: {
      name: "Pro",
      tier: "pro" as const,
      monthlyPriceUsd: 2900,
      yearlyPriceUsd: 29000,
      debatesPerMonth: 50,
      maxExperts: 8,
      maxRoundsPerDebate: 5,
      maxTeamMembers: 5,
    },
    business: {
      name: "Business",
      tier: "business" as const,
      monthlyPriceUsd: 9900,
      yearlyPriceUsd: 99000,
      debatesPerMonth: 999999,
      maxExperts: 15,
      maxRoundsPerDebate: 10,
      maxTeamMembers: 999999,
    },
  };

  const planConfig = defaultPlans[planId as keyof typeof defaultPlans] || defaultPlans.free;

  const [newPlan] = await db.insert(plans).values({
    ...planConfig,
    features: {
      pdfExport: planId !== "free",
      apiAccess: planId === "business",
      customExperts: planId === "business",
      prioritySupport: planId !== "free",
      whiteLabel: planId === "business",
      analytics: planId !== "free",
      webhooks: planId === "business",
    },
  }).returning();

  if (!newPlan) {
    throw new Error("Failed to create plan");
  }

  return newPlan;
}

export async function POST(request: Request) {
  const headersList = await headers();

  // ============================================================================
  // RATE LIMITING (First defense - before expensive operations)
  // ============================================================================

  const clientIp = getClientIp(headersList);
  const rateLimitResult = await checkWebhookRateLimit(clientIp);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }

  // ============================================================================
  // SIGNATURE VERIFICATION
  // ============================================================================

  const body = await request.text();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), { context: "Webhook signature verification" });
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // ============================================================================
  // IDEMPOTENCY CHECK
  // ============================================================================

  const eventId = event.id;

  // Check if event was already processed
  const [existingEvent] = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.stripeEventId, eventId));

  if (existingEvent) {
    if (existingEvent.processed) {
      // Already processed - return success
      return NextResponse.json({
        received: true,
        message: "Event already processed"
      });
    }

    // Event exists but not processed (retry scenario)
    // Update retry count
    await db
      .update(webhookEvents)
      .set({
        retryCount: String(Number(existingEvent.retryCount) + 1),
        processingStartedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(webhookEvents.id, existingEvent.id));
  } else {
    // Create new webhook event record
    await db.insert(webhookEvents).values({
      stripeEventId: eventId,
      eventType: event.type,
      processed: false,
      processingStartedAt: new Date(),
      payload: event.data.object as Record<string, unknown>,
    });
  }

  // ============================================================================
  // PROCESS EVENT
  // ============================================================================

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const purchaseType = session.metadata?.type; // 'credit_purchase' or undefined (subscription)

        if (!userId) {
          logWarning("No userId in session metadata", { sessionId: session.id });
          break;
        }

        // ========================================================================
        // CASE 1: ONE-TIME CREDIT PURCHASE
        // ========================================================================

        if (purchaseType === 'credit_purchase') {
          const creditsToAdd = Number(session.metadata?.credits || 0);

          if (creditsToAdd > 0) {
            // Add credits atomically to user balance
            await db
              .update(users)
              .set({
                credits: sql`${users.credits} + ${creditsToAdd}`,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId));

            logWarning(`Added ${creditsToAdd} credits to user ${userId} (one-time purchase)`);
          }

          break;
        }

        // ========================================================================
        // CASE 2: SUBSCRIPTION CHECKOUT
        // ========================================================================

        const planId = session.metadata?.planId || "pro";
        const plan = await getOrCreatePlan(planId);

        // Get plan-specific monthly credits allocation
        const monthlyCreditsMap: Record<string, number> = {
          free: 1000,
          starter: 5000,
          pro: 10000,
          business: 25000,
        };
        const monthlyCredits = monthlyCreditsMap[planId] || 1000;

        // Update user tier and add monthly credits
        await db
          .update(users)
          .set({
            tier: planId as "free" | "starter" | "pro" | "business",
            credits: sql`${users.credits} + ${monthlyCredits}`, // Add monthly allocation
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        // Create or update subscription
        const [existingSubscription] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, userId));

        if (existingSubscription) {
          await db.update(subscriptions)
            .set({
              planId: plan.id,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              status: "active",
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              monthlyCredits, // Store monthly credit allocation
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, existingSubscription.id));
        } else {
          await db.insert(subscriptions).values({
            userId,
            planId: plan.id,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            status: "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            monthlyCredits, // Store monthly credit allocation
          });

          // Initialize usage record
          const now = new Date();
          await db.insert(usage).values({
            userId,
            periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
            periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
            debatesUsed: 0,
            apiCallsUsed: 0,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription & {
          current_period_start: number;
          current_period_end: number;
        };
        const customerId = subscription.customer as string;

        await db.update(subscriptions)
          .set({
            status: subscription.status === "active" ? "active" :
                   subscription.status === "past_due" ? "past_due" :
                   subscription.status === "canceled" ? "canceled" : "active",
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeCustomerId, customerId));
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get free plan
        const freePlan = await getOrCreatePlan("free");

        // Get subscription to find userId
        const [sub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeCustomerId, customerId));

        if (sub) {
          // Downgrade user to free tier
          await db
            .update(users)
            .set({
              tier: "free",
              updatedAt: new Date(),
            })
            .where(eq(users.id, sub.userId));
        }

        // Cancel subscription
        await db.update(subscriptions)
          .set({
            status: "canceled",
            planId: freePlan.id,
            canceledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeCustomerId, customerId));
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Get subscription to find userId and monthlyCredits
        const [sub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeCustomerId, customerId));

        if (sub) {
          // Add monthly credits to user balance (renewal)
          // Only add credits if this is NOT the first invoice (billing_reason !== 'subscription_create')
          if (invoice.billing_reason !== 'subscription_create') {
            await db
              .update(users)
              .set({
                credits: sql`${users.credits} + ${sub.monthlyCredits}`,
                updatedAt: new Date(),
              })
              .where(eq(users.id, sub.userId));

            logWarning(`Renewed ${sub.monthlyCredits} credits for user ${sub.userId} (monthly renewal)`);
          }

          // Reset usage for new billing period
          const now = new Date();
          await db.update(usage)
            .set({
              debatesUsed: 0,
              apiCallsUsed: 0,
              periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
              periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
              updatedAt: new Date(),
            })
            .where(eq(usage.userId, sub.userId));
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await db.update(subscriptions)
          .set({
            status: "past_due",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeCustomerId, customerId));
        break;
      }

      default:
        logWarning(`Unhandled event type: ${event.type}`);
    }

    // ============================================================================
    // MARK AS PROCESSED
    // ============================================================================

    await db
      .update(webhookEvents)
      .set({
        processed: true,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(webhookEvents.stripeEventId, eventId));

    return NextResponse.json({ received: true });
  } catch (error) {
    // ============================================================================
    // RECORD ERROR
    // ============================================================================

    await db
      .update(webhookEvents)
      .set({
        error: error instanceof Error ? error.message : String(error),
        updatedAt: new Date(),
      })
      .where(eq(webhookEvents.stripeEventId, eventId));

    logError(error instanceof Error ? error : new Error(String(error)), { context: "Webhook handler" });
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
