"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { AppHeader } from "@/components/layout/app-header"
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  Shield,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const adminNavItems: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/billing",
    label: "Facturación",
    icon: CreditCard,
  },
  {
    href: "/admin/logs",
    label: "Logs",
    icon: FileText,
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
      } else {
        setIsAuthenticated(true)
      }
    }
    void checkAuth()
  }, [router, supabase.auth])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <AppHeader variant="app" />

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "sticky top-16 h-[calc(100vh-4rem)] border-r border-[var(--theme-border)] bg-[var(--theme-bg-primary)]/95 backdrop-blur-xl transition-all duration-300",
            isCollapsed ? "w-16" : "w-64"
          )}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              {!isCollapsed && (
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-400" />
                  <h2 className="font-semibold text-white">Admin</h2>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-8 w-8 text-[var(--theme-text-secondary)] hover:text-white hover:bg-white/10"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-2">
              {adminNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                      isActive
                        ? "bg-purple-600 text-white"
                        : "text-[var(--theme-text-secondary)] hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-white/10 p-4">
              {!isCollapsed && (
                <div className="rounded-lg bg-purple-500/10 border border-purple-500/30 p-3">
                  <p className="text-xs text-purple-300">
                    <strong>Panel de Administración</strong>
                  </p>
                  <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
                    Control total del sistema
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pt-16 pb-32">
          {children}
        </main>
      </div>
    </div>
  )
}
