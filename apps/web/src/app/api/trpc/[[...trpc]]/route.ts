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
        const trimmed = cookie.trim();
        const equalIndex = trimmed.indexOf("=");
        if (equalIndex > 0) {
          const name = trimmed.substring(0, equalIndex).trim();
          const value = trimmed.substring(equalIndex + 1).trim();
          if (name && value) {
            // Handle URL-encoded values (e.g., test%40quoorum.pro -> test@quoorum.pro)
            try {
              cookies[name] = decodeURIComponent(value);
            } catch {
              // If decode fails, use raw value
              cookies[name] = value;
            }
          }
        }
      });
    }

    // SECURITY: Cookie bypass allowed for localhost (dev/test) with optional secret token
    let userEmail: string | null = null;
    const host = opts?.req.headers.get('host')?.toLowerCase() ?? '';
    const isLocalHost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
    const allowCookieBypass = isLocalHost || process.env.NODE_ENV === 'development';

    if (allowCookieBypass) {
      const bypassCookie = cookies['test-auth-bypass'] || cookies['user-email'];
      const secretToken = process.env.DEV_AUTH_BYPASS_SECRET;
      
      // If secret is set, require it in the bypass cookie (format: email:secret)
      if (bypassCookie) {
        if (secretToken) {
          const [email, token] = bypassCookie.split(':');
          if (token === secretToken) {
            userEmail = email ?? null;
          } else {
            systemLogger.warn("[tRPC Context] Invalid bypass token", { hasToken: !!token, isLocalHost });
          }
        } else {
          // No secret configured, allow simple email bypass (backward compat for local)
          userEmail = bypassCookie ?? null;
        }
      }
    }

    // Debug: Log cookie parsing
    systemLogger.debug("[tRPC Context] Cookie parsing", {
      cookieHeader: cookieHeader.substring(0, 100), // First 100 chars
      cookiesKeys: Object.keys(cookies),
      userEmail: userEmail ? '[REDACTED]' : null,
      isProduction: process.env.NODE_ENV === 'production',
    });

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

    // OPTIMIZED: Run all queries in parallel
    const startTime = Date.now();
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

    systemLogger.debug("[tRPC Context] Profile found", { profileId: profile.id, email: profile.email, queryTimeMs: Date.now() - startTime });

    // OPTIMIZED: Run user lookup and admin check in parallel
    const [dbUserRows, adminCheckRows] = await Promise.all([
      db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${userEmail})`).limit(1),
      db.select({ role: adminUsers.role }).from(adminUsers).where(eq(adminUsers.userId, profile.id)).limit(1)
    ]);

    let dbUser: typeof users.$inferSelect | null = dbUserRows[0] ?? null;
    const adminCheck = adminCheckRows[0] || null;

    if (!dbUser) {
      systemLogger.info("[tRPC Context] User not found in users table, creating", { email: userEmail, profileId: profile.id });
      
      const defaultRole = adminCheck?.role === "super_admin" || adminCheck?.role === "admin" 
        ? "admin" 
        : (profile.role === "admin" || profile.role === "super_admin" ? profile.role : "member");

      const inserted = await db
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

      const newUser = inserted[0] ?? null;
      if (!newUser) {
        systemLogger.error('[tRPC Context] User creation returned empty result', { email: userEmail });
        return {
          db,
          user: null,
          userId: null,
          supabase: null,
          authUserId: null,
        };
      }

      dbUser = newUser;
      systemLogger.info("[tRPC Context] User created", { userId: dbUser.id, role: dbUser.role });
    }

    if (!dbUser) {
      systemLogger.error('[tRPC Context] User creation failed unexpectedly', { email: userEmail });
      return {
        db,
        user: null,
        userId: null,
        supabase: null,
        authUserId: null,
      };
    }

    let finalRole = dbUser.role;
    if (adminCheck && (adminCheck.role === "super_admin" || adminCheck.role === "admin")) {
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
      authUserId: profile.userId ?? null, // Original user ID from auth system (if any)
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
        const isUnauthorized = error.code === "UNAUTHORIZED";
        const err = error.cause instanceof Error ? error.cause : error;

        // No loggear errores UNAUTHORIZED - son esperados cuando el usuario no está autenticado
        // Las queries del frontend usan `enabled: false` para evitar ejecutarlas sin auth,
        // pero algunos errores pueden llegar aquí durante SSR o prefetch
        if (isUnauthorized) {
          // Solo loggear en modo debug si es necesario
          systemLogger.debug(
            `[tRPC] UNAUTHORIZED on ${type} ${path ?? "(no path)"} - expected when user not authenticated`
          );
          return;
        }

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

        // Removed console.error to avoid UTF-8 encoding issues on Windows
        // Errors are already logged via systemLogger.error above
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
