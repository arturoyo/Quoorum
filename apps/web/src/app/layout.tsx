import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/Providers";
// Validate environment variables on server startup
import { getEnvValidation } from "@/lib/env";

export const metadata: Metadata = {
  title: "Quoorum - Comité Ejecutivo de IA para Decisiones Estratégicas",
  description: "La única plataforma que simula un Comité Ejecutivo de expertos de IA (la Capa de Inteligencia Corporativa) para debatir, criticar y sintetizar la mejor decisión estratégica, eliminando los sesgos humanos y la lentitud de las reuniones, y entregando un consenso accionable en minutos.",
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
      // Removed emoji to avoid UTF-8 encoding issues on Windows
      console.error("[ERROR] Environment validation failed. Check your .env.local file.", {
        missing: validation.missing,
      });
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent FOUC by setting theme class before render */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('quoorum-theme') || 'system';
                  var resolved = theme;
                  if (theme === 'system') {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  // Remove any existing theme classes first
                  document.documentElement.classList.remove('light', 'dark');
                  // Add the resolved theme
                  document.documentElement.classList.add(resolved);
                  document.documentElement.style.colorScheme = resolved;
                } catch (e) {
                  // Fallback to dark if anything fails
                  document.documentElement.classList.remove('light');
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
