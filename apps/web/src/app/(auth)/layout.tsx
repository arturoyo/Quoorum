import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { AnimatedBackground } from "@/components/layout/animated-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 border-b border-white/5 backdrop-blur-2xl bg-black/50">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="flex items-center gap-3 group w-fit">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
              Forum
            </span>
          </Link>
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
