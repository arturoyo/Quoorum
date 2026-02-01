"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Account Page - Redirects to /settings/billing
 * 
 * All account/billing content has been consolidated in /settings/billing
 * This page redirects to maintain backward compatibility
 */
export default function AccountPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to billing settings page
    router.replace("/settings/billing");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  );
}
