import { NextRequest, NextResponse } from "next/server";
import { db } from "@quoorum/db";
import { users, profiles } from "@quoorum/db/schema";
import { eq } from "drizzle-orm";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/login?error=google_auth_failed`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("[Google OAuth] Token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${appUrl}/login?error=google_token_failed`);
    }

    const tokens: GoogleTokenResponse = await tokenRes.json();

    // Get user info
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${appUrl}/login?error=google_userinfo_failed`);
    }

    const googleUser: GoogleUserInfo = await userInfoRes.json();

    if (!googleUser.email) {
      return NextResponse.redirect(`${appUrl}/login?error=google_no_email`);
    }

    // Find or create user
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, googleUser.email))
      .limit(1);

    if (!user) {
      // Auto-register Google users
      const userName = googleUser.name || googleUser.email.split("@")[0] || "Usuario";
      const insertedRows = await db
        .insert(users)
        .values({
          email: googleUser.email,
          name: userName,
          avatarUrl: googleUser.picture || null,
          role: "member",
          tier: "free" as const,
          credits: 1000,
        })
        .returning();
      const newUser = insertedRows[0];
      if (!newUser) {
        return NextResponse.redirect(`${appUrl}/login?error=google_user_creation_failed`);
      }
      user = newUser;

      // Create matching profile (required by tRPC context)
      await db
        .insert(profiles)
        .values({
          id: newUser.id,
          userId: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          isActive: true,
        })
        .onConflictDoNothing();
    } else if (googleUser.picture && !user.avatarUrl) {
      // Update avatar if missing
      await db
        .update(users)
        .set({ avatarUrl: googleUser.picture, updatedAt: new Date() })
        .where(eq(users.id, user.id));
    }

    if (!user) {
      return NextResponse.redirect(`${appUrl}/login?error=google_no_user`);
    }

    // Create JWT session
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
    });

    await setSessionCookie(token);

    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (err) {
    console.error("[Google OAuth] Callback error:", err);
    return NextResponse.redirect(`${appUrl}/login?error=google_callback_error`);
  }
}
