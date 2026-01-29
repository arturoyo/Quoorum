"use client";

import { TRPCProvider } from "@/lib/trpc/provider";
import { CommandPalette } from "@/components/quoorum/command-palette";
import { ThemeProvider } from "@/components/theme";
import { type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <TRPCProvider>
        {children}
        <CommandPalette />
      </TRPCProvider>
    </ThemeProvider>
  );
}
