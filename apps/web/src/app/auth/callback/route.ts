import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@quoorum/db";
import { profiles, referralCodes, referrals } from "@quoorum/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

/**
 * Process referral conversion after user registration
 * This is called server-side to avoid exposing the referral conversion logic
 */
async function processReferralConversion(
  referralCode: string,
  authUserId: string,
  email: string
) {
  try {
    // Find profile by userId
    const [profile] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.userId, authUserId))
      .limit(1);

    if (!profile) {
      logger.error("[Referral] Profile not found for user:", { authUserId });
      return { success: false, error: "Profile not found" };
    }

    // Call convertReferral via direct database operations
    // (We can't use tRPC here because we need to call a publicProcedure)
    // Instead, we'll replicate the logic from the router

    // Find referral code
    const [code] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, referralCode))
      .limit(1);

    if (!code) {
      logger.warn("[Referral] Invalid referral code:", { referralCode });
      return { success: false, error: "Invalid referral code" };
    }

    // Find or create referral record
    const [existingReferral] = await db
      .select()
      .from(referrals)
      .where(
        eq(referrals.referredEmail, email)
      )
      .limit(1);

    if (existingReferral) {
      // Update existing referral
      await db
        .update(referrals)
        .set({
          referredUserId: profile.id,
          status: "converted",
          convertedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(referrals.id, existingReferral.id));

      logger.info("[Referral] Referral converted (existing):", {
        referralId: existingReferral.id,
        referrerId: code.userId,
        referredUserId: profile.id,
      });
    } else {
      // Create new referral (direct link usage)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const [newReferral] = await db
        .insert(referrals)
        .values({
          referrerId: code.userId,
          referralCodeId: code.id,
          referredEmail: email,
          referredUserId: profile.id,
          status: "converted",
          convertedAt: new Date(),
          expiresAt,
          invitationMethod: "link",
          metadata: {
            registrationSource: "direct_link",
          },
        })
        .returning();

      if (newReferral) {
        logger.info("[Referral] Referral converted (new):", {
          referralId: newReferral.id,
          referrerId: code.userId,
          referredUserId: profile.id,
        });
      }
    }

    return { success: true };
  } catch (error) {
    logger.error("[Referral] Error processing referral conversion:", error instanceof Error ? error : { error });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const referralCode = searchParams.get("ref"); // Get referral code from URL
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const next = searchParams.get("next") || redirectTo;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get authenticated user to process referral
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        // Get referral code from URL param or user metadata
        const finalReferralCode =
          referralCode || authUser.user_metadata?.referral_code;

        if (finalReferralCode && authUser.email) {
          // Process referral conversion (non-blocking)
          void processReferralConversion(
            finalReferralCode,
            authUser.id,
            authUser.email
          );
        }
      }

      // Redirect to the intended destination
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
