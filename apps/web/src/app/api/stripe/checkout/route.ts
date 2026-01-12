import { NextResponse } from "next/server";
import { getStripe, getPriceId, type PlanId, type BillingInterval } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/monitoring";
import { db } from "@quoorum/db";
import { subscriptions } from "@quoorum/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, interval = "monthly" } = body as {
      planId: PlanId;
      interval?: BillingInterval;
    };

    if (!planId || planId === "free") {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    const priceId = getPriceId(planId, interval);
    if (!priceId) {
      return NextResponse.json(
        { error: "Price not found" },
        { status: 400 }
      );
    }

    // Check if user already has a Stripe customer ID
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, user.id),
    });

    let customerId = existingSubscription?.stripeCustomerId;

    const stripe = getStripe();

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        planId,
        interval,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "Checkout" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
