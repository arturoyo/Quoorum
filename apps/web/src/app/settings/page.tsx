"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { SettingsModal } from "@/components/settings/settings-modal";

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const supabase = createClient();

  // Get section from URL query params (reactivo)
  const sectionParam = searchParams.get('section');
  const initialSection = sectionParam || '/settings';

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Open modal after auth check
      setIsOpen(true);
      setIsChecking(false);
    }

    checkAuth();
  }, [router, supabase.auth]);

  const handleClose = () => {
    setIsOpen(false);
    // Redirect to dashboard when modal closes
    router.push("/dashboard");
  };

  if (isChecking) {
    return (
      <div className="min-h-screen relative bg-[var(--theme-bg-primary)] flex items-center justify-center">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full blur-2xl opacity-30 animate-pulse" />
          <Loader2 className="relative w-8 h-8 text-purple-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-[var(--theme-bg-primary)]">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
      </div>

      <SettingsModal
        open={isOpen}
        onOpenChange={handleClose}
        initialSection={initialSection}
      />
    </div>
  );
}
