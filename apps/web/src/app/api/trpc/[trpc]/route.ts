import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@quoorum/api";
import { createServerClient } from "@supabase/ssr";
import { db } from "@quoorum/db";
import { profiles, users, adminUsers } from "@quoorum/db/schema";
import { eq, sql } from "drizzle-orm";
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

    // Load user from PostgreSQL local users table (has credits, tier, role, etc.)
    console.log("[tRPC Context] Loading user from PostgreSQL local...");
    const searchEmail = profile.email || authUser.email || "";
    console.log("[tRPC Context] Searching for user with email:", searchEmail, "| profile.email:", profile.email, "| authUser.email:", authUser.email);
    
    // Use case-insensitive email matching to avoid issues
    // ALSO: Check if any user has admin role and match by profile email
    const [dbUser] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${searchEmail})`)
      .limit(1);
    
    // If no user found, try to find by profile email match
    let finalDbUser = dbUser;
    if (!dbUser && profile) {
      console.log("[tRPC Context] User not found by email, trying to find by profile...");
      // Get all users and find by email match
      const allUsers = await db.select().from(users).limit(100);
      const matchingUser = allUsers.find(u => 
        u.email && profile.email && 
        u.email.toLowerCase().trim() === profile.email.toLowerCase().trim()
      );
      if (matchingUser) {
        console.log("[tRPC Context] Found user by profile email match:", matchingUser.id, matchingUser.email, matchingUser.role);
        finalDbUser = matchingUser;
      }
    }
    
    console.log("[tRPC Context] User query result:", finalDbUser ? {
      id: finalDbUser.id,
      email: finalDbUser.email,
      role: finalDbUser.role,
      searchEmail: searchEmail,
      emailMatch: finalDbUser.email?.toLowerCase() === searchEmail.toLowerCase(),
    } : 'null');
    
    // If no user found, log all users for debugging
    if (!finalDbUser) {
      const allUsers = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).limit(10);
      console.log("[tRPC Context] No user found. All users in DB:", allUsers);
    }
    
    if (!finalDbUser) {
      console.log("[tRPC Context] User not found in PostgreSQL local, creating...");
      // Check if user exists in users table by email (maybe created elsewhere) - case insensitive
      const [existingUser] = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${profile.email || authUser.email || ""})`)
        .limit(1);
      
      if (existingUser) {
        console.log("[tRPC Context] User exists but wasn't found by email, using existing user with role:", existingUser.role);
        return {
          db,
          user: existingUser,
          userId: existingUser.id,
          supabase,
          authUserId: authUser.id,
        };
      }
      
      // Create user in PostgreSQL local if it doesn't exist
      // IMPORTANT: Check if user already exists in admin_users to preserve admin role
      const [adminCheck] = await db
        .select({ role: adminUsers.role })
        .from(adminUsers)
        .innerJoin(profiles, eq(adminUsers.userId, profiles.id))
        .where(sql`LOWER(${profiles.email}) = LOWER(${profile.email || authUser.email || ""})`)
        .limit(1);
      
      const defaultRole = adminCheck?.role === "super_admin" || adminCheck?.role === "admin" 
        ? "admin" 
        : (profile.role === "admin" || profile.role === "super_admin" ? profile.role : "member");
      
      console.log("[tRPC Context] Creating new user with role:", defaultRole, "adminCheck:", adminCheck);
      
      const [newUser] = await db
        .insert(users)
        .values({
          email: profile.email || authUser.email || "",
          name: profile.name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "Usuario",
          avatarUrl: profile.avatar_url || authUser.user_metadata?.avatar_url || null,
          role: defaultRole,
          credits: 1000, // Default credits
          tier: "free", // Default tier
          isActive: true,
        })
        .returning();
      
      console.log("[tRPC Context] User created in PostgreSQL local:", newUser?.id, "with role:", newUser.role);
      
      // Return context with new user
      return {
        db,
        user: newUser,
        userId: newUser.id,
        supabase,
        authUserId: authUser.id,
      };
    }

    console.log("[tRPC Context] User found in PostgreSQL local:", finalDbUser.id, "email:", finalDbUser.email, "role:", finalDbUser.role);
    
    // CRITICAL: Check if user has adminUsers entry OR if email matches known admin emails
    const [adminCheck] = await db
      .select({ role: adminUsers.role })
      .from(adminUsers)
      .innerJoin(profiles, eq(adminUsers.userId, profiles.id))
      .where(sql`LOWER(${profiles.email}) = LOWER(${finalDbUser.email})`)
      .limit(1);
    
    // Also check if user email is in the list of known admin emails
    const knownAdminEmails = ['usuario@quoorum.com'];
    const isKnownAdminEmail = knownAdminEmails.some(email => 
      finalDbUser.email?.toLowerCase().trim() === email.toLowerCase().trim()
    );
    
    // FORCE role to admin if:
    // 1. User has adminUsers entry, OR
    // 2. User email is in known admin emails, OR
    // 3. User already has admin role in DB
    let finalRole = finalDbUser.role;
    if (adminCheck && (adminCheck.role === "super_admin" || adminCheck.role === "admin")) {
      finalRole = "admin";
      console.log("[tRPC Context] FORCING role to admin because adminUsers entry exists");
    } else if (isKnownAdminEmail) {
      finalRole = "admin";
      console.log("[tRPC Context] FORCING role to admin because email is in known admin list");
    } else if (finalDbUser.role === "admin" || finalDbUser.role === "super_admin") {
      finalRole = finalDbUser.role;
      console.log("[tRPC Context] User already has admin role in DB:", finalRole);
    }
    
    // Update DB to be consistent if needed
    if (finalRole === "admin" && finalDbUser.role !== "admin" && finalDbUser.role !== "super_admin") {
      console.log("[tRPC Context] Updating user role in DB to admin");
      await db
        .update(users)
        .set({ role: "admin", updatedAt: new Date() })
        .where(eq(users.id, finalDbUser.id));
    }
    
    const finalUser = {
      ...finalDbUser,
      role: finalRole,
    };
    
    console.log("[tRPC Context] FINAL user:", {
      id: finalUser.id,
      email: finalUser.email,
      role: finalUser.role,
      adminCheck: adminCheck?.role || 'null',
      isKnownAdminEmail,
      originalRole: finalDbUser.role,
    });

    // Return context with user from PostgreSQL local (has credits, tier, role, etc.)
    return {
      db,
      user: finalUser,
      userId: finalUser.id,
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
