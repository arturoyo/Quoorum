import { initTRPC, TRPCError } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { db } from "@quoorum/db";
import type { Database } from "@quoorum/db";
import type { User } from "@quoorum/db";

// Type for Supabase client (avoid importing full package)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export interface Context {
  db: Database;
  user: User | null;
  userId: string | null;
  supabase?: SupabaseClient | null;
  authUserId?: string | null; // Supabase auth.uid() for RLS policies
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
  errorFormatter({ shape }) {
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
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  // Check if user has admin role
  if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const adminProcedure = t.procedure.use(isAdmin);

// Rate limited procedure (stub - implement actual rate limiting as needed)
export const expensiveRateLimitedProcedure = t.procedure.use(isAuthenticated);
