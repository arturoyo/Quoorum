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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/904a4f4c-b744-40dc-870a-654c1b1871a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/web/src/app/api/trpc/[[...trpc]]/route.ts:19',message:'createContext ENTRY',data:{hasOpts:!!opts,hasReq:!!opts?.req},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
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

    // PostgreSQL-only mode: Get user email from cookie
    // Support both test-auth-bypass and user-email cookies
    const userEmail = cookies['test-auth-bypass'] || cookies['user-email'] || null;

    // Debug: Log cookie parsing
    systemLogger.debug("[tRPC Context] Cookie parsing", {
      cookieHeader: cookieHeader.substring(0, 100), // First 100 chars
      cookiesKeys: Object.keys(cookies),
      userEmail,
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

    // Find profile in PostgreSQL local by email
    // Debug: Test database connection first
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/904a4f4c-b744-40dc-870a-654c1b1871a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/web/src/app/api/trpc/[[...trpc]]/route.ts:70',message:'Before DB connection test',data:{userEmail,dbExists:!!db},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    try {
      const testQueryStart = Date.now();
      const testQuery = await db.select({ count: sql<number>`count(*)` }).from(profiles).limit(1);
      const testQueryTime = Date.now() - testQueryStart;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/904a4f4c-b744-40dc-870a-654c1b1871a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/web/src/app/api/trpc/[[...trpc]]/route.ts:73',message:'DB connection test SUCCESS',data:{profilesCount:testQuery[0]?.count,queryTimeMs:testQueryTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      systemLogger.debug("[tRPC Context] Database connection test successful", { profilesCount: testQuery[0]?.count });
    } catch (dbError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/904a4f4c-b744-40dc-870a-654c1b1871a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/web/src/app/api/trpc/[[...trpc]]/route.ts:76',message:'DB connection test FAILED',data:{errorMessage:(dbError as Error).message,errorName:(dbError as Error).name,errorStack:(dbError as Error).stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      systemLogger.error("[tRPC Context] Database connection test failed", dbError as Error);
      throw dbError;
    }

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

    // Parallelize user and admin role queries for faster context creation
    const queryStart = Date.now();
    const [userResults, adminCheckResults] = await Promise.all([
      db
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${userEmail})`)
        .limit(1),
      db
        .select({ role: adminUsers.role })
        .from(adminUsers)
        .where(eq(adminUsers.userId, profile.id))
        .limit(1)
    ]);
    const queryTime = Date.now() - queryStart;
    
    systemLogger.debug("[tRPC Context] Parallel queries completed", { 
      queryTimeMs: queryTime,
      hasUser: userResults.length > 0,
      hasAdminRole: adminCheckResults.length > 0
    });

    let dbUser = userResults[0] || null;

    if (!dbUser) {
      systemLogger.info("[tRPC Context] User not found in users table, creating", { email: userEmail, profileId: profile.id });
      
      const adminCheck = adminCheckResults[0];
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/904a4f4c-b744-40dc-870a-654c1b1871a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/web/src/app/api/trpc/[[...trpc]]/route.ts:187',message:'createContext ERROR',data:{errorMessage:(error as Error).message,errorName:(error as Error).name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/904a4f4c-b744-40dc-870a-654c1b1871a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/web/src/app/api/trpc/[[...trpc]]/route.ts:195',message:'tRPC handler ENTRY',data:{method:req.method,url:req.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
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
