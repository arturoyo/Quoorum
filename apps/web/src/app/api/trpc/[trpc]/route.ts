import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@quoorum/api";
import { createServerClient } from "@supabase/ssr";
import { db } from "@quoorum/db";
import { profiles } from "@quoorum/db/schema";
import { eq } from "drizzle-orm";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

const createContext = async (opts?: FetchCreateContextFnOptions) => {
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
    return {
      db,
      user: null,
      userId: null,
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
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) {
    return {
      db,
      user: null,
      userId: null,
    };
  }

  // Find profile by Supabase auth user ID
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, authUser.id))
    .limit(1);

  if (!profile) {
    return {
      db,
      user: null,
      userId: null,
    };
  }

  // Return context with profile as user
  return {
    db,
    user: profile as any, // Type cast to match Context interface (Profile -> User)
    userId: profile.id,
  };
};

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
