import Stripe from "stripe";
import { planTierEnum } from "@quoorum/db/schema";

// Lazy initialization to avoid build-time errors
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

// For backwards compatibility - use getStripe() for lazy initialization
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : (null as unknown as Stripe);

// Price IDs from Stripe Dashboard (replace with actual IDs from your Stripe account)
export const STRIPE_PRICES = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "price_pro_monthly",
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "price_pro_yearly",
  },
  business: {
    monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || "price_business_monthly",
    yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || "price_business_yearly",
  },
} as const;

export type PlanId = (typeof planTierEnum.enumValues)[number];

const BILLING_INTERVALS = ["monthly", "yearly"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export function getPriceId(planId: PlanId, interval: BillingInterval): string | null {
  if (planId === "free") return null;
  return STRIPE_PRICES[planId][interval];
}
