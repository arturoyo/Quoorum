import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Quoorum - Multi-Agent Deliberation System",
  description: "Strategic decision-making through AI expert deliberation",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
