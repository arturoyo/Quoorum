"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { SettingsModal } from "@/components/settings/settings-modal";

export default function ContextPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const supabase = createClient();

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
      <div className="min-h-screen relative bg-slate-950 flex items-center justify-center">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full blur-2xl opacity-30 animate-pulse" />
          <Loader2 className="relative w-8 h-8 text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-slate-950">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      <SettingsModal
        open={isOpen}
        onOpenChange={handleClose}
        initialSection="/settings/context"
      />
    </div>
  );
}
