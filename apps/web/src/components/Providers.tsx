"use client";

import { TRPCProvider } from "@/lib/trpc/provider";
import { CommandPalette } from "@/components/quoorum/command-palette";
import { type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TRPCProvider>
      {children}
      <CommandPalette />
    </TRPCProvider>
  );
}
