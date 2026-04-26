import { initTRPC, TRPCError } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { db } from "@quoorum/db";
import type { Database } from "@quoorum/db";
import type { User } from "@quoorum/db";
import { adminUsers, adminRoles } from "@quoorum/db/schema";
import { eq, and } from "drizzle-orm";

export interface Context {
  db: Database;
  user: User | null;
  userId: string | null;
  authUserId?: string | null;
}

export async function createContext(_opts?: FetchCreateContextFnOptions) {
  // For now, return context without auth
  // Auth will be handled by middleware when needed
  return {
    db,
    user: null,
    userId: null,
  };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // PAYMENT_REQUIRED es un código válido en tRPC v11 y se mapea automáticamente a HTTP 402
    // El código ya está en shape.data.code cuando se lanza con TRPCError({ code: 'PAYMENT_REQUIRED' })
    // Verificar tanto desde shape.data.code como desde error.code
    const errorCode = shape.data?.code || (error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined);
    
    // Check for PAYMENT_REQUIRED code (cast to string to avoid type error)
    if (String(errorCode) === 'PAYMENT_REQUIRED') {
      // En tRPC v11, el httpStatus debe estar en shape.data.httpStatus
      // fetchRequestHandler lo usa automáticamente para establecer el status HTTP
      return {
        ...shape,
        data: {
          ...shape.data,
          httpStatus: 402,
          code: 'PAYMENT_REQUIRED',
        },
      };
    }
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      userId: ctx.userId,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);

const isAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  // Check if user has admin role in users table (legacy check)
  const hasUserRole = ctx.user.role === "admin" || ctx.user.role === "super_admin";

  // Check if user has admin role in adminUsers table (new system)
  // IMPORTANT: adminUsers.userId references profiles.id, so we use ctx.userId (profile ID)
  const [adminUser] = await db
    .select({
      id: adminUsers.id,
      userId: adminUsers.userId,
      roleId: adminUsers.roleId,
      roleSlug: adminRoles.slug,
      rolePermissions: adminRoles.permissions,
    })
    .from(adminUsers)
    .innerJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
    .where(and(eq(adminUsers.userId, ctx.userId), eq(adminUsers.isActive, true)))
    .limit(1);
  
  // User must have either legacy role OR adminUsers entry
  if (!hasUserRole && !adminUser) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      adminUser: adminUser ? {
        ...adminUser,
        permissions: (adminUser.rolePermissions as string[]) || [],
      } : undefined,
    },
  });
});

export const adminProcedure = t.procedure.use(isAdmin);

// In-memory rate limiter for expensive operations (LLM calls)
const _rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10; // max requests per window
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

const rateLimiter = t.middleware(async ({ ctx, next }) => {
  const userId = ctx.userId;
  if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

  const now = Date.now();
  const entry = _rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    _rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else if (entry.count >= RATE_LIMIT_MAX) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Max ${RATE_LIMIT_MAX} expensive operations per minute.`,
    });
  } else {
    entry.count++;
  }

  return next();
});

export const expensiveRateLimitedProcedure = t.procedure.use(isAuthenticated).use(rateLimiter);
