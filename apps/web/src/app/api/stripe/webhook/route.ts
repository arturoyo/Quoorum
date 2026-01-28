import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { logError, logWarning } from "@/lib/monitoring";
import { db } from "@quoorum/db";
import { subscriptions, plans, usage, webhookEvents, users, creditTransactions } from "@quoorum/db/schema";
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
    const currentRetryCount = Number(existingEvent.retryCount);

    // Check if we've exceeded max retries (3 attempts)
    if (currentRetryCount >= 3) {
      // Mark as failed after 3 retries
      await db
        .update(webhookEvents)
        .set({
          error: 'Maximum retry attempts exceeded (3)',
          updatedAt: new Date(),
        })
        .where(eq(webhookEvents.id, existingEvent.id));

      // Admin notification for persistent failure
      logError(new Error(`Webhook event failed after 3 retries: ${event.type}`), {
        context: 'stripe_webhook_max_retries_exceeded',
        eventId: event.id,
        eventType: event.type,
        retryCount: currentRetryCount,
        lastError: existingEvent.error || 'Unknown error',
      });

      return NextResponse.json(
        { error: "Maximum retry attempts exceeded" },
        { status: 400 }
      );
    }

    // Update retry count (still have retries left)
    await db
      .update(webhookEvents)
      .set({
        retryCount: String(currentRetryCount + 1),
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
      payload: event.data.object as unknown as Record<string, unknown>,
    });
  }

  // ============================================================================
  // PROCESS EVENT
  // ============================================================================

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
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
            // Get current balance before update
            const [userBefore] = await db
              .select({ credits: users.credits })
              .from(users)
              .where(eq(users.id, userId));

            const balanceBefore = userBefore?.credits || 0;

            // Add credits atomically to user balance
            const [updatedUser] = await db
              .update(users)
              .set({
                credits: sql`${users.credits} + ${creditsToAdd}`,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId))
              .returning({ credits: users.credits });

            const balanceAfter = updatedUser?.credits || balanceBefore + creditsToAdd;

            // Record transaction for audit trail
            await db.insert(creditTransactions).values({
              userId,
              debateId: null,
              type: 'addition',
              source: 'purchase',
              amount: creditsToAdd,
              balanceBefore,
              balanceAfter,
              reason: `One-time credit purchase: ${creditsToAdd} credits`,
              metadata: {
                stripeSessionId: session.id,
                stripeCustomerId: session.customer as string,
                amountPaidUsd: session.amount_total ? session.amount_total / 100 : 0,
                timestamp: new Date().toISOString(),
              },
            });

            // Admin notification for large purchases (>10,000 credits)
            if (creditsToAdd > 10000) {
              logWarning(`[ALERT] LARGE CREDIT PURCHASE: ${creditsToAdd} credits purchased by user ${userId}`, {
                userId,
                credits: creditsToAdd,
                amountUsd: session.amount_total ? session.amount_total / 100 : 0,
                stripeSessionId: session.id,
                stripeCustomerId: session.customer as string,
                balanceBefore,
                balanceAfter,
                context: 'stripe_webhook_large_purchase',
              });
            }

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

        // Get current balance before update
        const [userBefore] = await db
          .select({ credits: users.credits })
          .from(users)
          .where(eq(users.id, userId));

        const balanceBefore = userBefore?.credits || 0;

        // Update user tier and add monthly credits
        const [updatedUser] = await db
          .update(users)
          .set({
            tier: planId as "free" | "starter" | "pro" | "business",
            credits: sql`${users.credits} + ${monthlyCredits}`, // Add monthly allocation
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning({ credits: users.credits });

        const balanceAfter = updatedUser?.credits || balanceBefore + monthlyCredits;

        // Record transaction for audit trail
        await db.insert(creditTransactions).values({
          userId,
          debateId: null,
          type: 'addition',
          source: 'monthly_allocation',
          amount: monthlyCredits,
          balanceBefore,
          balanceAfter,
          reason: `Subscription started: ${plan.name} plan (${monthlyCredits} monthly credits)`,
          metadata: {
            planId,
            planName: plan.name,
            stripeSessionId: session.id,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            timestamp: new Date().toISOString(),
          },
        });

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
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Get free plan
        const freePlan = await getOrCreatePlan("free");

        // Get subscription to find userId and current plan
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

          // Admin notification for subscription cancellation
          logWarning(`[ALERT] SUBSCRIPTION CANCELED: User ${sub.userId} canceled subscription`, {
            userId: sub.userId,
            previousPlanId: sub.planId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            cancelReason: subscription.cancellation_details?.reason || 'unknown',
            cancelComment: subscription.cancellation_details?.comment || null,
            hadActivePeriod: sub.currentPeriodStart && sub.currentPeriodEnd,
            context: 'stripe_webhook_subscription_canceled',
          });
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
        const invoice = event.data.object;
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
            // Get current balance before update
            const [userBefore] = await db
              .select({ credits: users.credits })
              .from(users)
              .where(eq(users.id, sub.userId));

            const balanceBefore = userBefore?.credits || 0;

            // Add credits atomically
            const [updatedUser] = await db
              .update(users)
              .set({
                credits: sql`${users.credits} + ${sub.monthlyCredits}`,
                updatedAt: new Date(),
              })
              .where(eq(users.id, sub.userId))
              .returning({ credits: users.credits });

            const balanceAfter = updatedUser?.credits || balanceBefore + sub.monthlyCredits;

            // Record transaction for audit trail
            await db.insert(creditTransactions).values({
              userId: sub.userId,
              debateId: null,
              type: 'addition',
              source: 'monthly_allocation',
              amount: sub.monthlyCredits,
              balanceBefore,
              balanceAfter,
              reason: `Monthly subscription renewal: ${sub.monthlyCredits} credits`,
              metadata: {
                stripeInvoiceId: invoice.id,
                stripeCustomerId: customerId,
                stripeSubscriptionId: sub.stripeSubscriptionId,
                billingReason: invoice.billing_reason || 'subscription_cycle',
                amountPaidUsd: invoice.amount_paid ? invoice.amount_paid / 100 : 0,
                timestamp: new Date().toISOString(),
              },
            });

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
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        // Get subscription to find userId
        const [sub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeCustomerId, customerId));

        await db.update(subscriptions)
          .set({
            status: "past_due",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeCustomerId, customerId));

        // Admin notification for failed payment
        if (sub) {
          logError(new Error('Payment failed for subscription'), {
            context: 'stripe_webhook_payment_failed',
            userId: sub.userId,
            stripeCustomerId: customerId,
            stripeInvoiceId: invoice.id,
            stripeSubscriptionId: sub.stripeSubscriptionId,
            amountDue: invoice.amount_due ? invoice.amount_due / 100 : 0,
            attemptCount: invoice.attempt_count,
            nextPaymentAttempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toISOString() : null,
          });
        }
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
