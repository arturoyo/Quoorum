import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/Providers";
// Validate environment variables on server startup
import { getEnvValidation } from "@/lib/env";

export const metadata: Metadata = {
  title: "Quoorum - Multi-Agent Deliberation System",
  description: "Strategic decision-making through AI expert deliberation",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Validate environment variables (only runs on server)
  if (typeof window === "undefined") {
    const validation = getEnvValidation();
    if (!validation.valid && process.env.NODE_ENV === "development") {
      // Only log in development - use structured logging in production via monitoring
      // eslint-disable-next-line no-console
      console.error("❌ Environment validation failed. Check your .env.local file.", {
        missing: validation.missing,
      });
    }
  }

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b141a] text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
