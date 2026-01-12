import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build time, return a mock client that will be replaced at runtime
  if (!supabaseUrl || !supabaseKey) {
    // Return a placeholder that works during SSG
    // The real client will be created on the client side
    if (typeof window === "undefined") {
      return createBrowserClient(
        "https://placeholder.supabase.co",
        "placeholder-key"
      );
    }
    throw new Error("Supabase environment variables are not set");
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
