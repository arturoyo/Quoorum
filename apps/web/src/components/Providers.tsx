"use client";

import { TRPCProvider } from "@/lib/trpc/provider";
import { type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <TRPCProvider>{children}</TRPCProvider>;
}
