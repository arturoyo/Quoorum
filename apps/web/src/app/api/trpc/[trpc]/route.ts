import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@quoorum/api";
import { createServerClient } from "@supabase/ssr";
import { db } from "@quoorum/db";
import { profiles } from "@quoorum/db/schema";
import { eq } from "drizzle-orm";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { validateEnvironmentOrThrow } from "@quoorum/api";

// Validate environment variables on module load
// This will fail fast if critical vars are missing
try {
  validateEnvironmentOrThrow();
} catch (error) {
  console.error('[tRPC] Environment validation failed:', error);
  // Continue loading but log the error
  // In development, this is logged and visible
  // In production, this should be caught by monitoring
}

const createContext = async (opts?: FetchCreateContextFnOptions) => {
  try {
    // Get cookies from request headers
    const cookieHeader = opts?.req.headers.get("cookie") || "";
    const cookies: Record<string, string> = {};

    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [name, value] = cookie.trim().split("=");
        if (name && value) {
          cookies[name] = decodeURIComponent(value);
        }
      });
    }

    // Create Supabase client with cookies from request
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log("[tRPC Context] Missing Supabase credentials");
      return {
        db,
        user: null,
        userId: null,
        supabase: null,
        authUserId: null,
      };
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return cookies[name];
        },
        set() {
          // Cannot set cookies in this context
        },
        remove() {
          // Cannot remove cookies in this context
        },
      },
    });

    // Get authenticated user from Supabase
    console.log("[tRPC Context] Getting user from Supabase...");
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error) {
      console.error("[tRPC Context] Supabase auth error:", error.message);
      return {
        db,
        user: null,
        userId: null,
        supabase: null,
        authUserId: null,
      };
    }

    if (!authUser) {
      console.log("[tRPC Context] No authenticated user");
      return {
        db,
        user: null,
        userId: null,
        supabase: null,
        authUserId: null,
      };
    }

    console.log("[tRPC Context] Authenticated user:", authUser.id);

    // Use Supabase REST API instead of direct Postgres to avoid connection issues
    console.log("[tRPC Context] Querying profile via Supabase REST API...");

    // Try to get profile from Supabase
    const { data: existingProfile, error: selectError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .single();

    let profile = existingProfile;

    // If profile doesn't exist, create it
    if (!existingProfile && selectError?.code === "PGRST116") {
      console.log("[tRPC Context] Profile not found, creating new profile...");
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          user_id: authUser.id,
          email: authUser.email || "",
          name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "Usuario",
          full_name: authUser.user_metadata?.full_name || "",
          avatar_url: authUser.user_metadata?.avatar_url || null,
          role: "user",
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[tRPC Context] Error creating profile:", insertError.message);
        return {
          db,
          user: null,
          userId: null,
          supabase: null,
          authUserId: null,
        };
      }

      profile = newProfile;
      console.log("[tRPC Context] Profile created:", profile?.id);
    } else if (selectError && selectError.code !== "PGRST116") {
      console.error("[tRPC Context] Error fetching profile:", selectError.message);
      return {
        db,
        user: null,
        userId: null,
        supabase: null,
        authUserId: null,
      };
    } else {
      console.log("[tRPC Context] Profile found:", profile?.id);
    }

    if (!profile) {
      console.error("[tRPC Context] Profile is null after fetch/create");
      return {
        db,
        user: null,
        userId: null,
        supabase: null,
        authUserId: null,
      };
    }

    // Sync profile to PostgreSQL local (for foreign key constraints)
    try {
      console.log("[tRPC Context] Syncing profile to PostgreSQL local...");
      const [localProfile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, profile.id))
        .limit(1);

      if (!localProfile) {
        console.log("[tRPC Context] Creating profile in PostgreSQL local...");
        await db.insert(profiles).values({
          id: profile.id,
          userId: authUser.id,
          email: profile.email,
          name: profile.name || authUser.email?.split("@")[0] || "Usuario",
          fullName: profile.full_name || null,
          avatarUrl: profile.avatar_url || null,
          role: profile.role || "user",
          isActive: true,
        }).onConflictDoNothing();
        console.log("[tRPC Context] Profile synced to PostgreSQL local");
      } else {
        console.log("[tRPC Context] Profile already exists in PostgreSQL local");
      }
    } catch (syncError) {
      console.error("[tRPC Context] Error syncing profile to local DB:", syncError);
      // Continue anyway, most operations work with Supabase
    }

    // Return context with profile as user AND Supabase client
    return {
      db,
      user: profile as any, // Type cast to match Context interface (Profile -> User)
      userId: profile.id,
      supabase, // Add Supabase client to context for REST API queries
      authUserId: authUser.id, // Auth UID for RLS policies
    };
  } catch (error) {
    console.error("[tRPC Context] Error creating context:", error);
    return {
      db,
      user: null,
      userId: null,
      supabase: null,
      authUserId: null,
    };
  }
};

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
