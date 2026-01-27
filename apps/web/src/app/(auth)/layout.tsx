import Link from "next/link";
import { AnimatedBackground } from "@/components/layout/animated-background";
import { QuoorumLogoWithText } from "@/components/ui/quoorum-logo";


export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--theme-landing-bg)] relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 border-b border-white/5 backdrop-blur-2xl bg-[var(--theme-landing-bg)]/50">
        <div className="container mx-auto px-4 py-6">
          <QuoorumLogoWithText 
            href="/"
            iconSize={48}
            showGradient={true}
            showText={false}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="min-h-screen flex items-center justify-center px-4 py-32">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  );
}
