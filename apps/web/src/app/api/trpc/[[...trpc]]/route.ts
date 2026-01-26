import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, systemLogger, validateEnvironmentOrThrow } from "@quoorum/api";
import { db } from "@quoorum/db";
import { profiles, users, adminUsers } from "@quoorum/db/schema";
import { eq, sql } from "drizzle-orm";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

// Validate environment variables on module load
// This will fail fast if critical vars are missing
try {
  validateEnvironmentOrThrow();
} catch (error) {
  systemLogger.error('[tRPC] Environment validation failed', error as Error);
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

    // PostgreSQL-only mode: Get user email from cookie
    // Support both test-auth-bypass and user-email cookies
    const userEmail = cookies['test-auth-bypass'] || cookies['user-email'] || null;

    if (!userEmail) {
      systemLogger.debug("[tRPC Context] No user email in cookies - unauthenticated");
      return {
        db,
        user: null,
        userId: null,
        supabase: null,
        authUserId: null,
      };
    }

    systemLogger.debug("[tRPC Context] PostgreSQL-only mode - looking up user", { email: userEmail });

    // Find profile in PostgreSQL local by email
    const [profile] = await db
      .select()
      .from(profiles)
      .where(sql`LOWER(${profiles.email}) = LOWER(${userEmail})`)
      .limit(1);

    if (!profile) {
      systemLogger.warn("[tRPC Context] Profile not found in PostgreSQL", { email: userEmail });
      return {
        db,
        user: null,
        userId: null,
        supabase: null,
        authUserId: null,
      };
    }

    systemLogger.debug("[tRPC Context] Profile found", { profileId: profile.id, email: profile.email });

    // Find or create user in users table
    let dbUser = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${userEmail})`)
      .limit(1)
      .then(rows => rows[0] || null);

    if (!dbUser) {
      systemLogger.info("[tRPC Context] User not found in users table, creating", { email: userEmail, profileId: profile.id });
      
      // Check if user has admin role in adminUsers table
      const [adminCheck] = await db
        .select({ role: adminUsers.role })
        .from(adminUsers)
        .where(eq(adminUsers.userId, profile.id))
        .limit(1);

      const defaultRole = adminCheck?.role === "super_admin" || adminCheck?.role === "admin" 
        ? "admin" 
        : (profile.role === "admin" || profile.role === "super_admin" ? profile.role : "member");

      const [newUser] = await db
        .insert(users)
        .values({
          email: profile.email || userEmail,
          name: profile.name || userEmail.split("@")[0] || "Usuario",
          avatarUrl: profile.avatarUrl || null,
          role: defaultRole,
          credits: 1000,
          tier: "free",
          isActive: true,
        })
        .returning();

      dbUser = newUser;
      systemLogger.info("[tRPC Context] User created", { userId: dbUser.id, role: dbUser.role });
    }

    // Check admin status
    const [adminCheck] = await db
      .select({ role: adminUsers.role })
      .from(adminUsers)
      .where(eq(adminUsers.userId, profile.id))
      .limit(1);

    const knownAdminEmails = ['usuario@quoorum.com'];
    const isKnownAdminEmail = knownAdminEmails.some(email => 
      dbUser.email?.toLowerCase().trim() === email.toLowerCase().trim()
    );

    let finalRole = dbUser.role;
    if (adminCheck && (adminCheck.role === "super_admin" || adminCheck.role === "admin")) {
      finalRole = "admin";
    } else if (isKnownAdminEmail) {
      finalRole = "admin";
    } else if (dbUser.role === "admin" || dbUser.role === "super_admin") {
      finalRole = dbUser.role;
    }

    // Update role if needed
    if (finalRole === "admin" && dbUser.role !== "admin" && dbUser.role !== "super_admin") {
      await db
        .update(users)
        .set({ role: "admin", updatedAt: new Date() })
        .where(eq(users.id, dbUser.id));
    }

    const finalUser = {
      ...dbUser,
      role: finalRole,
    };

    systemLogger.debug("[tRPC Context] Context created", {
      userId: finalUser.id,
      profileId: profile.id,
      email: finalUser.email,
      role: finalUser.role,
    });

    // Return context with profile.id as userId (for foreign key compatibility)
    return {
      db,
      user: finalUser,
      userId: profile.id, // Use profile.id for foreign keys (quoorum_debates.user_id, etc.)
      supabase: null, // Not using Supabase
      authUserId: profile.userId, // Original user ID from auth system (if any)
    };
  } catch (error) {
    systemLogger.error("[tRPC Context] Error creating context", error as Error);
    return {
      db,
      user: null,
      userId: null,
      supabase: null,
      authUserId: null,
    };
  }
};

const handler = async (req: Request) => {
  try {
    // HEAD: health check; responder 200 sin ejecutar tRPC
    if (req.method === "HEAD") {
      return new Response(null, { status: 200 });
    }
    return await fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext,
      onError(opts) {
        const { error, path, type, input } = opts;
        const is500 = error.code === "INTERNAL_SERVER_ERROR";
        const err = error.cause instanceof Error ? error.cause : error;

        systemLogger.error(
          `[tRPC] ${error.code} on ${type} ${path ?? "(no path)"}: ${error.message}`,
          err,
          {
            path,
            type,
            code: error.code,
            input: is500 ? input : undefined,
            stack: error.stack,
          }
        );

        if (is500 && process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.error("[tRPC 500] path:", path, "| message:", error.message);
          if (error.cause) {
            // eslint-disable-next-line no-console
            console.error("[tRPC 500] cause:", error.cause);
          }
        }
      },
    });
  } catch (error) {
    // Capturar errores no manejados que podrían causar que Next.js devuelva HTML
    systemLogger.error("[tRPC Handler] Unhandled error in request handler", error as Error);
    
    // Devolver respuesta JSON de error en lugar de dejar que Next.js devuelva HTML
    return new Response(
      JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

export { handler as GET, handler as POST, handler as HEAD };
