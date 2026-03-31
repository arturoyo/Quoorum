"use client";

import { useState, useEffect, useCallback } from "react";
import { getSessionAction, logoutAction } from "./actions";
import { useRouter } from "next/navigation";

export interface ClientUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Client-side hook to check authentication state.
 * Replaces the previous Supabase auth.getUser() pattern.
 */
export function useAuth() {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const result = await getSessionAction();
        if (mounted) {
          if (result.success && result.user) {
            setUser(result.user as ClientUser);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch {
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signOut = useCallback(async () => {
    await logoutAction();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    signOut,
  };
}

/**
 * Client-side hook that redirects to login if not authenticated.
 * Replaces the Supabase auth check + redirect pattern.
 */
export function useRequireAuth() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  return { user, isLoading, isAuthenticated, signOut };
}
