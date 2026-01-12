import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { logError, logWarning } from "@/lib/monitoring";
import { db } from "@quoorum/db";
import { subscriptions, plans, usage } from "@quoorum/db/schema";
import { eq } from "drizzle-orm";

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
  const body = await request.text();
  const headersList = await headers();
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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId || "pro";

        if (!userId) {
          logWarning("No userId in session metadata", { sessionId: session.id });
          break;
        }

        const plan = await getOrCreatePlan(planId);

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

        // Reset usage for new billing period
        const [sub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeCustomerId, customerId));

        if (sub) {
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

    return NextResponse.json({ received: true });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "Webhook handler" });
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
