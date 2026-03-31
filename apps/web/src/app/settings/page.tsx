"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import { Loader2 } from "lucide-react";
import { SettingsModal } from "@/components/settings/settings-modal";

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading: isChecking, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Get section from URL query params (reactivo)
  const sectionParam = searchParams.get('section');
  const initialSection = sectionParam || '/settings';

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.push("/login");
    } else if (!isChecking && isAuthenticated) {
      setIsOpen(true);
    }
  }, [isChecking, isAuthenticated, router]);

  const handleClose = () => {
    setIsOpen(false);
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
